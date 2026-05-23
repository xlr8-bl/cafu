<?php
/**
 * Shared <head> + opening shell for legal pages. The page that requires this
 * must set $legalTitle before requiring.
 *
 * @var string $legalTitle
 */
$pageTitle = htmlspecialchars($legalTitle ?? 'Legal', ENT_QUOTES);
?><!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title><?= $pageTitle ?> — Maison Cafu</title>
    <meta name="robots" content="index, follow">
    <link rel="icon" href="/favicon.ico">
    <style>
        :root { --bg:#0a0a0a; --fg:#fafafa; --muted:#a3a3a3; --accent:#d4a574; --card:#171717; --border:#262626; }
        * { box-sizing:border-box; }
        html, body { margin:0; padding:0; background:var(--bg); color:var(--fg); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif; line-height:1.6; }
        a { color:var(--accent); text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:3px; }
        a:hover { color:var(--fg); }
        header.bar { padding:16px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; font-size:14px; }
        header.bar a.home { display:inline-flex; gap:10px; align-items:center; color:var(--fg); text-decoration:none; font-weight:600; }
        header.bar a.home span.mark { display:inline-grid; place-items:center; width:32px; height:32px; border-radius:50%; background:var(--fg); color:var(--bg); font-family:'Source Serif Pro',serif; font-size:18px; }
        main { max-width:760px; margin:0 auto; padding:48px 24px 96px; }
        h1 { font-size:32px; font-weight:600; letter-spacing:-0.02em; margin:0 0 8px; }
        p.eyebrow { color:var(--muted); font-family:'JetBrains Mono',Menlo,monospace; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; margin:0 0 24px; }
        h2 { font-size:18px; font-weight:600; margin:40px 0 12px; }
        h3 { font-size:15px; font-weight:600; margin:24px 0 8px; }
        p, ul { color:var(--fg); font-size:15px; }
        ul { padding-left:22px; }
        li { margin-bottom:6px; }
        .draft { display:inline-block; padding:4px 10px; border:1px solid rgba(212,165,116,0.4); background:rgba(212,165,116,0.08); color:var(--accent); font-family:'JetBrains Mono',Menlo,monospace; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; border-radius:6px; margin-bottom:24px; }
        .meta { color:var(--muted); font-size:13px; margin-top:16px; }
        nav.legal-nav { margin-top:48px; padding-top:24px; border-top:1px solid var(--border); display:flex; gap:18px; flex-wrap:wrap; font-size:14px; }
        nav.legal-nav a { color:var(--muted); text-decoration:none; }
        nav.legal-nav a:hover, nav.legal-nav a.current { color:var(--fg); }
    </style>
</head>
<body>
    <header class="bar">
        <a class="home" href="/"><span class="mark">M</span> Maison Cafu</a>
        <span style="color:var(--muted)">Legal</span>
    </header>
    <main>
        <p class="eyebrow">Legal · <?= $pageTitle ?></p>
        <span class="draft">Draft — pending counsel review</span>
        <h1><?= $pageTitle ?></h1>
        <p class="meta">Last updated: <?= htmlspecialchars(date('j F Y'), ENT_QUOTES) ?></p>
