<?php

declare(strict_types=1);

namespace Srwa\Models;

use DateTimeImmutable;
use DateTimeZone;
use InvalidArgumentException;
use Srwa\Database;
use Srwa\Logging\Events;

final class Reservation
{
    /** @param array{name:string, phone:string, email?:?string} $customer */
    public static function hold(
        array $customer,
        int $partySize,
        string $reservedFor,
        ?string $notes = null
    ): array {
        if ($partySize < 1 || $partySize > 20) {
            throw new InvalidArgumentException('Party size must be between 1 and 20.');
        }
        $when = self::parseFutureDateTime($reservedFor);

        $pdo = Database::connection();
        $pdo->beginTransaction();
        try {
            $customerId = Customer::upsert($customer);
            $pdo->prepare(
                'INSERT INTO reservations (customer_id, party_size, reserved_for, status, notes)
                 VALUES (:cid, :size, :when, "held", :notes)'
            )->execute([
                'cid'   => $customerId,
                'size'  => $partySize,
                'when'  => $when->format('Y-m-d H:i:s'),
                'notes' => $notes,
            ]);
            $reservationId = (int) $pdo->lastInsertId();
            $pdo->commit();

            Events::record(
                Events::KIND_RESERVATION_HELD,
                subjectKind: 'reservation',
                subjectId:   $reservationId,
                payload:     ['party_size' => $partySize, 'reserved_for' => $when->format(DATE_ATOM)],
                actorKind:   'customer',
                actorId:     $customerId,
            );

            return [
                'reservation_id' => $reservationId,
                'reserved_for'   => $when->format(DATE_ATOM),
                'status'         => 'held',
            ];
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function parseFutureDateTime(string $input): DateTimeImmutable
    {
        try {
            $dt = new DateTimeImmutable($input, new DateTimeZone('UTC'));
        } catch (\Exception) {
            throw new InvalidArgumentException('Invalid reservation date/time.');
        }
        $now = new DateTimeImmutable('now', new DateTimeZone('UTC'));
        if ($dt < $now) {
            throw new InvalidArgumentException('Reservation must be in the future.');
        }
        return $dt;
    }
}
