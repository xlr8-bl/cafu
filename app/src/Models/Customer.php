<?php

declare(strict_types=1);

namespace Srwa\Models;

use InvalidArgumentException;
use Srwa\Database;

final class Customer
{
    /** @param array{name:string, phone:string, email?:?string} $data */
    public static function upsert(array $data): int
    {
        $name  = trim($data['name']  ?? '');
        $phone = self::normalizePhone($data['phone'] ?? '');
        if ($name === '' || $phone === '') {
            throw new InvalidArgumentException('Name and phone are required.');
        }

        $pdo  = Database::connection();
        $stmt = $pdo->prepare('SELECT id FROM customers WHERE phone = :phone');
        $stmt->execute(['phone' => $phone]);
        $existing = $stmt->fetchColumn();
        if ($existing !== false) {
            return (int) $existing;
        }

        $pdo->prepare(
            'INSERT INTO customers (name, phone, email) VALUES (:name, :phone, :email)'
        )->execute([
            'name'  => $name,
            'phone' => $phone,
            'email' => $data['email'] ?? null,
        ]);
        return (int) $pdo->lastInsertId();
    }

    public static function normalizePhone(string $raw): string
    {
        return preg_replace('/\s+/', ' ', trim($raw)) ?? '';
    }
}
