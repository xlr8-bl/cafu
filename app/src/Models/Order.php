<?php

declare(strict_types=1);

namespace Srwa\Models;

use InvalidArgumentException;
use Srwa\Database;
use Srwa\Logging\Events;

final class Order
{
    /**
     * @param array{name:string, phone:string, email?:?string, notes?:?string} $customer
     * @param list<array{menu_item_id:int, quantity:int}> $items
     * @return array{reference:string, total_cents:int}
     */
    public static function place(array $customer, array $items): array
    {
        if ($items === []) {
            throw new InvalidArgumentException('Order must contain at least one item.');
        }

        $pdo = Database::connection();
        $pdo->beginTransaction();
        try {
            $customerId = Customer::upsert($customer);

            $reference  = self::generateReference();
            $stmt       = $pdo->prepare(
                'INSERT INTO orders (customer_id, reference, status, total_cents, notes)
                 VALUES (:customer_id, :reference, "pending", 0, :notes)'
            );
            $stmt->execute([
                'customer_id' => $customerId,
                'reference'   => $reference,
                'notes'       => $customer['notes'] ?? null,
            ]);
            $orderId = (int) $pdo->lastInsertId();

            $total = 0;
            $insert = $pdo->prepare(
                'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_cents)
                 VALUES (:order_id, :item_id, :qty, :unit)'
            );
            foreach ($items as $line) {
                $menuItem = MenuItem::find((int) $line['menu_item_id']);
                if ($menuItem === null || (int) $menuItem['is_available'] !== 1) {
                    throw new InvalidArgumentException(
                        'Menu item is unavailable: ' . ($line['menu_item_id'] ?? '?')
                    );
                }
                $qty   = max(1, (int) $line['quantity']);
                $unit  = (int) $menuItem['price_cents'];
                $total += $qty * $unit;

                $insert->execute([
                    'order_id' => $orderId,
                    'item_id'  => $menuItem['id'],
                    'qty'      => $qty,
                    'unit'     => $unit,
                ]);
            }

            $pdo->prepare('UPDATE orders SET total_cents = :t WHERE id = :id')
                ->execute(['t' => $total, 'id' => $orderId]);

            $pdo->commit();

            Events::record(
                Events::KIND_ORDER_PLACED,
                subjectKind: 'order',
                subjectId:   $orderId,
                payload:     ['reference' => $reference, 'total_cents' => $total, 'line_count' => count($items)],
                actorKind:   'customer',
                actorId:     $customerId,
            );

            return ['reference' => $reference, 'total_cents' => $total];
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    /** Pure helper exposed for unit testing. */
    public static function generateReference(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ambiguity-safe
        $out = '';
        for ($i = 0; $i < 10; $i++) {
            $out .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }
        return $out;
    }

    /**
     * Allowed state transitions. Keep this near the data — when we add a
     * formal state machine in §4.7, this is the upgrade point.
     *
     * @return array<string, list<string>>
     */
    public static function transitions(): array
    {
        return [
            'pending'   => ['confirmed', 'cancelled'],
            'confirmed' => ['preparing', 'cancelled'],
            'preparing' => ['served',    'cancelled'],
            'served'    => [],
            'cancelled' => [],
        ];
    }

    public static function canTransition(string $from, string $to): bool
    {
        return in_array($to, self::transitions()[$from] ?? [], true);
    }

    /**
     * Recent orders for the kitchen view. Defaults to non-terminal statuses.
     *
     * @return list<array{
     *     id:int, reference:string, status:string,
     *     total_cents:int, placed_at:string, customer_name:?string
     * }>
     */
    public static function recent(int $limit = 50): array
    {
        $sql = 'SELECT o.id, o.reference, o.status, o.total_cents, o.placed_at, c.name AS customer_name
                FROM orders o LEFT JOIN customers c ON c.id = o.customer_id
                ORDER BY o.placed_at DESC LIMIT :limit';
        $stmt = Database::connection()->prepare($sql);
        $stmt->bindValue(':limit', max(1, min(200, $limit)), \PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();
        return array_map(static fn (array $r): array => [
            'id'            => (int)    $r['id'],
            'reference'     => (string) $r['reference'],
            'status'        => (string) $r['status'],
            'total_cents'   => (int)    $r['total_cents'],
            'placed_at'     => (string) $r['placed_at'],
            'customer_name' => $r['customer_name'] === null ? null : (string) $r['customer_name'],
        ], $rows);
    }

    /** @throws InvalidArgumentException on disallowed transition or missing order. */
    public static function updateStatus(int $id, string $newStatus): void
    {
        $pdo  = Database::connection();
        $stmt = $pdo->prepare('SELECT status FROM orders WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $current = $stmt->fetchColumn();
        if ($current === false) {
            throw new InvalidArgumentException("Order #{$id} not found.");
        }
        if (!self::canTransition((string) $current, $newStatus)) {
            throw new InvalidArgumentException(
                "Cannot move order #{$id} from {$current} to {$newStatus}."
            );
        }
        $pdo->prepare('UPDATE orders SET status = :s WHERE id = :id')
            ->execute(['s' => $newStatus, 'id' => $id]);

        Events::record(
            Events::KIND_ORDER_STATUS_CHANGED,
            subjectKind: 'order',
            subjectId:   $id,
            payload:     ['from' => (string) $current, 'to' => $newStatus],
        );
    }
}
