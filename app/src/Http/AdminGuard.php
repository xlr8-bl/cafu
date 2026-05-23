<?php

declare(strict_types=1);

namespace Srwa\Http;

use Srwa\Auth\Csrf;
use Srwa\Auth\Session;

/**
 * Run at the top of every admin page. Enforces:
 *   1. An admin is logged in (else 302 → /admin/login.php).
 *   2. POST requests carry a valid CSRF token (else 403).
 */
final class AdminGuard
{
    public static function require(): int
    {
        Session::start();
        $adminId = Session::adminId();
        if ($adminId === null) {
            self::redirect('/admin/login.php');
        }

        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
            $token = $_POST['_csrf'] ?? null;
            if (!Csrf::verify(is_string($token) ? $token : null)) {
                http_response_code(403);
                header('Content-Type: text/plain');
                echo "CSRF token missing or invalid.\n";
                exit;
            }
        }

        return $adminId;
    }

    public static function redirect(string $path): never
    {
        header('Location: ' . $path, true, 302);
        exit;
    }
}
