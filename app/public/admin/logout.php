<?php

declare(strict_types=1);

require __DIR__ . '/../../src/bootstrap.php';

use Srwa\Auth\Csrf;
use Srwa\Auth\Session;
use Srwa\Logging\Events;

Session::start();

// Logout must be a POST with CSRF — defeats a malicious image tag that
// would otherwise log the admin out as a denial-of-service trick.
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST' || !Csrf::verify($_POST['_csrf'] ?? null)) {
    http_response_code(405);
    header('Allow: POST');
    echo "Logout requires POST with CSRF token.\n";
    exit;
}

$adminId = Session::adminId();
if ($adminId !== null) {
    Events::record(
        Events::KIND_ADMIN_LOGOUT,
        subjectKind: 'admin',
        subjectId:   $adminId,
        actorKind:   'admin',
        actorId:     $adminId,
    );
}
Session::logout();
header('Location: /admin/login.php', true, 302);
exit;
