<?php

declare(strict_types=1);

namespace Srwa\Auth;

use InvalidArgumentException;

/**
 * Wraps PHP's password_* functions. Bcrypt cost 12 — ~250ms per hash on
 * a 2024 server-grade CPU, expensive enough to slow brute-force, fast enough
 * to keep login interactive.
 */
final class Password
{
    private const COST = 12;
    private const MIN_LENGTH = 10;

    public static function hash(string $plain): string
    {
        if (strlen($plain) < self::MIN_LENGTH) {
            throw new InvalidArgumentException(
                'Password must be at least ' . self::MIN_LENGTH . ' characters.'
            );
        }
        return password_hash($plain, PASSWORD_BCRYPT, ['cost' => self::COST]);
    }

    public static function verify(string $plain, string $hash): bool
    {
        return password_verify($plain, $hash);
    }

    /** True when the stored hash should be re-computed (cost bumped, algo upgraded). */
    public static function needsRehash(string $hash): bool
    {
        return password_needs_rehash($hash, PASSWORD_BCRYPT, ['cost' => self::COST]);
    }
}
