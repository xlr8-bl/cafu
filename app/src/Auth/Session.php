<?php

declare(strict_types=1);

namespace Srwa\Auth;

/**
 * Thin wrapper around PHP sessions with hardened defaults.
 * - HttpOnly + SameSite=Lax cookies (XSS-resistant, CSRF-resistant for top-level navigation).
 * - Secure flag flipped on when APP_URL starts with https.
 * - Strict mode rejects uninitialised session IDs.
 */
final class Session
{
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        // CLI (incl. PHPUnit) gets an array-backed session — $_SESSION just works.
        // No cookies, no headers, no warnings about "headers already sent."
        if (PHP_SAPI === 'cli') {
            $_SESSION ??= [];
            return;
        }

        $secure = str_starts_with((string) getenv('APP_URL'), 'https://');

        ini_set('session.use_strict_mode', '1');
        ini_set('session.cookie_httponly', '1');
        ini_set('session.cookie_samesite', 'Lax');
        ini_set('session.cookie_secure', $secure ? '1' : '0');
        ini_set('session.gc_maxlifetime', '7200');

        session_name('srwa_sid');
        session_start();
    }

    public static function loginAs(int $adminId): void
    {
        self::start();
        // Regenerate the ID on auth boundary — defeats session fixation.
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
        }
        $_SESSION['admin_id']  = $adminId;
        $_SESSION['logged_at'] = time();
    }

    public static function adminId(): ?int
    {
        self::start();
        $id = $_SESSION['admin_id'] ?? null;
        return is_int($id) ? $id : null;
    }

    public static function logout(): void
    {
        self::start();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                [
                    'expires'  => time() - 3600,
                    'path'     => $params['path'],
                    'domain'   => $params['domain'],
                    'secure'   => $params['secure'],
                    'httponly' => $params['httponly'],
                    'samesite' => $params['samesite'],
                ],
            );
        }
        session_destroy();
    }
}
