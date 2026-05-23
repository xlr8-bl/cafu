<?php

declare(strict_types=1);

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/_layout.php';

use Srwa\Auth\Csrf;
use Srwa\Http\AdminGuard;
use Srwa\Models\Admin;
use Srwa\Models\Order;

$adminId = AdminGuard::require();

$notice = null;
$error  = null;

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $action = (string) ($_POST['action'] ?? '');
    if ($action === 'update_status') {
        try {
            Order::updateStatus(
                (int)    ($_POST['order_id']   ?? 0),
                (string) ($_POST['new_status'] ?? '')
            );
            $notice = 'Order updated.';
        } catch (\InvalidArgumentException $e) {
            $error = $e->getMessage();
        }
    }
}

$orders = Order::recent(50);
$csrf   = admin_h(Csrf::token());

// Status filter from query string. "" means all.
$filter   = (string) ($_GET['status'] ?? '');
$allowed  = ['pending', 'confirmed', 'preparing', 'served', 'cancelled'];
if ($filter !== '' && !in_array($filter, $allowed, true)) {
    $filter = '';
}

// Counts per status — built from the same recent() list so the filter pills are accurate to what's on screen.
$counts = array_fill_keys($allowed, 0);
foreach ($orders as $o) {
    $counts[$o['status']] = ($counts[$o['status']] ?? 0) + 1;
}
$totalShown = count($orders);

$visible = $filter === ''
    ? $orders
    : array_values(array_filter($orders, static fn (array $o): bool => $o['status'] === $filter));

$adminName = (Admin::findById($adminId)['name'] ?? null) ?? 'Signed in';

admin_head('Kitchen');
admin_topbar($adminName, $csrf);
?>
<main class="page">
    <span class="eyebrow">Kitchen</span>
    <h1 class="display">Live <em>orders</em>.</h1>

    <?php if ($notice !== null): ?>
        <div class="toast ok" style="margin-top:24px;"><?= admin_h($notice) ?></div>
    <?php endif ?>
    <?php if ($error !== null): ?>
        <div class="toast err" style="margin-top:24px;"><?= admin_h($error) ?></div>
    <?php endif ?>

    <nav class="tabs" aria-label="Filter by status">
        <a class="tab <?= $filter === '' ? 'is-active' : '' ?>" href="/admin/">
            All <span class="count"><?= $totalShown ?></span>
        </a>
        <?php foreach ($allowed as $s): ?>
            <a class="tab <?= $filter === $s ? 'is-active' : '' ?>" href="/admin/?status=<?= admin_h($s) ?>">
                <?= admin_h(ucfirst($s)) ?> <span class="count"><?= (int) $counts[$s] ?></span>
            </a>
        <?php endforeach ?>
    </nav>

    <?php if ($visible === []): ?>
        <div class="empty">
            <span class="mark">M</span>
            <h2>No orders here yet.</h2>
            <p>
                <?php if ($filter === ''): ?>
                    Place one from the customer site and it will appear in seconds.
                <?php else: ?>
                    Nothing in <strong><?= admin_h($filter) ?></strong> right now.
                    <a href="/admin/" style="color:var(--accent); text-decoration:none;">Show all →</a>
                <?php endif ?>
            </p>
        </div>
    <?php else: ?>
        <ul class="order-list">
            <?php foreach ($visible as $o):
                $status = (string) $o['status'];
                $next   = Order::transitions()[$status] ?? [];
            ?>
                <li class="order-row">
                    <div class="order-meta">
                        <div class="order-line-1">
                            <span class="order-ref"><?= admin_h($o['reference']) ?></span>
                            <span class="order-total"><?= admin_h(admin_money_xaf((int) $o['total_cents'])) ?></span>
                            <span class="pill pill-<?= admin_h($status) ?>"><?= admin_h($status) ?></span>
                        </div>
                        <div class="order-line-2">
                            <span class="order-customer"><?= admin_h($o['customer_name'] ?? 'Guest') ?></span>
                            <span aria-hidden="true">·</span>
                            <span class="order-time"><?= admin_h(admin_ago((string) $o['placed_at'])) ?></span>
                        </div>
                    </div>
                    <div class="order-actions">
                        <?php foreach ($next as $to):
                            $variant = $to === 'cancelled' ? 'btn-ghost' : 'btn-primary';
                        ?>
                            <form method="post" action="/admin/">
                                <input type="hidden" name="_csrf"      value="<?= $csrf ?>">
                                <input type="hidden" name="action"     value="update_status">
                                <input type="hidden" name="order_id"   value="<?= (int) $o['id'] ?>">
                                <input type="hidden" name="new_status" value="<?= admin_h($to) ?>">
                                <button type="submit" class="btn <?= $variant ?> btn-sm">
                                    Mark <?= admin_h($to) ?>
                                </button>
                            </form>
                        <?php endforeach ?>
                    </div>
                </li>
            <?php endforeach ?>
        </ul>
    <?php endif ?>
</main>
<?php admin_close();
