<?php

declare(strict_types=1);

namespace Srwa\Models;

use InvalidArgumentException;
use Srwa\Auth\Password;
use Srwa\Database;

final class Admin
{
    /** @return array{id:int, email:string, password_hash:string, name:string}|null */
    public static function findByEmail(string $email): ?array
    {
        return self::findOne(
            'SELECT id, email, password_hash, name FROM admins WHERE email = :v LIMIT 1',
            strtolower(trim($email)),
        );
    }

    /** @return array{id:int, email:string, password_hash:string, name:string}|null */
    public static function findById(int $id): ?array
    {
        return self::findOne(
            'SELECT id, email, password_hash, name FROM admins WHERE id = :v LIMIT 1',
            $id,
        );
    }

    /** @return array{id:int, email:string, password_hash:string, name:string}|null */
    private static function findOne(string $sql, mixed $value): ?array
    {
        $stmt = Database::connection()->prepare($sql);
        $stmt->execute(['v' => $value]);
        $row = $stmt->fetch();
        if ($row === false) {
            return null;
        }
        return [
            'id'            => (int) $row['id'],
            'email'         => (string) $row['email'],
            'password_hash' => (string) $row['password_hash'],
            'name'          => (string) $row['name'],
        ];
    }

    /** @return int newly created admin id */
    public static function create(string $email, string $plainPassword, string $name): int
    {
        $email = strtolower(trim($email));
        $name  = trim($name);
        if ($email === '' || $name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Email and name are required; email must be valid.');
        }
        $pdo = Database::connection();
        $pdo->prepare(
            'INSERT INTO admins (email, password_hash, name) VALUES (:e, :h, :n)'
        )->execute([
            'e' => $email,
            'h' => Password::hash($plainPassword),
            'n' => $name,
        ]);
        return (int) $pdo->lastInsertId();
    }

    public static function recordLogin(int $id): void
    {
        Database::connection()
            ->prepare('UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = :id')
            ->execute(['id' => $id]);
    }
}
