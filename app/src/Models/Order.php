<?php

declare(strict_types=1);

namespace Srwa\Models;

use InvalidArgumentException;
use Srwa\Database;

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
}
