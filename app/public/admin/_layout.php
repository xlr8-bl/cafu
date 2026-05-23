<?php

declare(strict_types=1);

/**
 * Admin page layout helpers. Pure-PHP — no router, no template engine.
 *
 *   admin_head('Kitchen');
 *   admin_topbar($name, $csrf);
 *   // ... page body ...
 *   admin_close();
 */

function admin_fonts_link(): void
{
    // Same font set the public-facing React app loads — Fraunces variable + Geist + Geist Mono.
    echo '<link rel="preconnect" href="https://fonts.googleapis.com">';
    echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>';
    echo '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
        . 'family=Fraunces:opsz,wght,SOFT@9..144,300..700,0..100'
        . '&family=Geist:wght@400;500;600'
        . '&family=Geist+Mono:wght@400;500;600'
        . '&display=swap">';
}

function admin_head(string $title): void
{
    $t = htmlspecialchars($title, ENT_QUOTES);
    ?><!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
    <meta name="theme-color" content="#100d0c">
    <meta name="robots" content="noindex,nofollow">
    <title><?= $t ?> · Maison Cafu</title>
    <link rel="icon" href="/favicon.ico">
    <?php admin_fonts_link(); ?>
    <link rel="stylesheet" href="/admin/admin.css">
</head>
<body><?php
}

function admin_topbar(string $adminName, string $csrfToken): void
{
    $n = htmlspecialchars($adminName, ENT_QUOTES);
    $c = htmlspecialchars($csrfToken, ENT_QUOTES);
    ?>
    <header class="topbar">
        <a class="brand" href="/admin/">
            <span class="mark">M</span>
            <span class="meta">
                <span class="name">Maison Cafu</span>
                <span class="tag">Kitchen console</span>
            </span>
        </a>
        <div class="who">
            <span class="who-name"><?= $n ?></span>
            <form method="post" action="/admin/logout.php">
                <input type="hidden" name="_csrf" value="<?= $c ?>">
                <button type="submit" class="btn btn-ghost btn-sm">Sign out</button>
            </form>
        </div>
    </header>
    <?php
}

function admin_close(): void
{
    ?></body></html><?php
}

function admin_h(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES);
}

/** Friendly relative-time string from a "Y-m-d H:i:s" timestamp. */
function admin_ago(string $ts): string
{
    try {
        $then = new DateTimeImmutable($ts, new DateTimeZone('UTC'));
    } catch (\Throwable) {
        return $ts;
    }
    $sec = max(0, (new DateTimeImmutable('now', new DateTimeZone('UTC')))->getTimestamp() - $then->getTimestamp());
    return match (true) {
        $sec < 10    => 'just now',
        $sec < 60    => $sec . 's ago',
        $sec < 3600  => intdiv($sec, 60)    . ' min ago',
        $sec < 86400 => intdiv($sec, 3600)  . ' hr ago',
        default      => intdiv($sec, 86400) . ' d ago',
    };
}

function admin_money_xaf(int $cents): string
{
    return number_format($cents / 100, 0, '.', ' ') . ' XAF';
}
