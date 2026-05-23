<?php

declare(strict_types=1);

namespace Srwa\Auth;

/**
 * Synchronizer-token CSRF protection. One token per session, refreshed on
 * login. Verify with `hash_equals` — constant-time compare defeats timing
 * attacks. Field name `_csrf` by convention.
 */
final class Csrf
{
    private const KEY = '_csrf_token';

    public static function token(): string
    {
        Session::start();
        $existing = $_SESSION[self::KEY] ?? null;
        if (is_string($existing) && $existing !== '') {
            return $existing;
        }
        $fresh = bin2hex(random_bytes(32));
        $_SESSION[self::KEY] = $fresh;
        return $fresh;
    }

    public static function verify(?string $candidate): bool
    {
        Session::start();
        $expected = $_SESSION[self::KEY] ?? null;
        if (!is_string($expected) || !is_string($candidate)) {
            return false;
        }
        return hash_equals($expected, $candidate);
    }

    /** HTML <input type="hidden"> for embedding in forms. */
    public static function field(): string
    {
        return '<input type="hidden" name="_csrf" value="' . htmlspecialchars(self::token(), ENT_QUOTES) . '">';
    }

    /** Rotate the token — call after privilege changes. */
    public static function rotate(): void
    {
        Session::start();
        $_SESSION[self::KEY] = bin2hex(random_bytes(32));
    }
}
