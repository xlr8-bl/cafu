<?php

declare(strict_types=1);

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/_layout.php';

use Srwa\Auth\Csrf;
use Srwa\Auth\Password;
use Srwa\Auth\Session;
use Srwa\Logging\Events;
use Srwa\Models\Admin;

Session::start();

if (Session::adminId() !== null) {
    header('Location: /admin/', true, 302);
    exit;
}

$error = null;

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    if (!Csrf::verify($_POST['_csrf'] ?? null)) {
        http_response_code(403);
        $error = 'Session expired. Refresh and try again.';
    } else {
        $email = (string) ($_POST['email']    ?? '');
        $pass  = (string) ($_POST['password'] ?? '');
        $admin = Admin::findByEmail($email);
        // Compare even on miss to keep timing constant.
        $valid = $admin !== null && Password::verify($pass, $admin['password_hash']);
        if ($valid) {
            Session::loginAs($admin['id']);
            Csrf::rotate();
            Admin::recordLogin($admin['id']);
            Events::record(
                Events::KIND_ADMIN_LOGIN_OK,
                subjectKind: 'admin',
                subjectId:   $admin['id'],
                actorKind:   'admin',
                actorId:     $admin['id'],
            );
            header('Location: /admin/', true, 302);
            exit;
        }
        http_response_code(401);
        $error = 'Invalid email or password.';
        Events::record(
            Events::KIND_ADMIN_LOGIN_FAIL,
            payload: ['email_attempted' => strtolower(trim($email))],
        );
        usleep(250000);
    }
}

$csrf  = admin_h(Csrf::token());
$errH  = $error === null ? '' : admin_h($error);

admin_head('Sign in');
?>
<main class="login-shell">
    <form class="login-card" method="post" action="/admin/login.php" autocomplete="on">
        <div class="brand-head">
            <span class="mark">M</span>
            <span class="name">Maison Cafu</span>
            <span class="tag">Staff sign in</span>
        </div>

        <input type="hidden" name="_csrf" value="<?= $csrf ?>">

        <div class="field">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" required autocomplete="username" autofocus
                   placeholder="chef@cafu.local">
        </div>

        <div class="field">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" required autocomplete="current-password"
                   placeholder="••••••••••••">
        </div>

        <button type="submit" class="btn btn-primary btn-block" style="margin-top:24px;">Sign in</button>

        <?php if ($errH !== ''): ?>
            <div class="toast err" style="margin: 20px 0 0;"><?= $errH ?></div>
        <?php endif ?>

        <p class="below">
            Not staff? <a href="/">Back to the dining room →</a>
        </p>
    </form>
</main>
<?php admin_close();
