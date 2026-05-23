<?php
$legalTitle   = 'Privacy policy';
$legalCurrent = 'privacy';
require __DIR__ . '/_header.php';
?>

<p>
    This policy explains what personal data Maison Cafu (the "restaurant",
    "we", "us") collects when you use this site, what we do with it, and
    your rights under Cameroon Law No. 2010/012 on cybersecurity and
    cybercriminality, and — for visitors in the European Economic Area —
    Regulation (EU) 2016/679 ("GDPR").
</p>

<h2>1. Who we are</h2>
<p>
    Maison Cafu is a restaurant operating at Rue Joffre, Bonapriso, Douala,
    Cameroon. Questions about this policy:
    <a href="mailto:bonjour@maisoncafu.cm">bonjour@maisoncafu.cm</a>.
</p>

<h2>2. What we collect</h2>
<ul>
    <li><strong>Order data</strong> — your name and phone number when you
        place an order or hold a table. Email is optional. We do not collect
        payment-card information; payment happens in person.</li>
    <li><strong>Order history</strong> — the items you ordered and when,
        used to operate the kitchen and improve the menu.</li>
    <li><strong>Audit log</strong> — every successful order, reservation,
        and administrative action is timestamped along with the IP address
        of the request, for security and dispute resolution.</li>
    <li><strong>Cookies</strong> — see the <a href="/legal/cookies">cookie notice</a>.</li>
</ul>

<h2>3. Why we collect it</h2>
<ul>
    <li>To prepare and serve your order or hold your reservation
        (contractual necessity).</li>
    <li>To recommend popular pairings — anonymous statistical analysis of
        past orders (legitimate interest).</li>
    <li>To respond to complaints and detect abuse of the system (legitimate
        interest).</li>
</ul>

<h2>4. How long we keep it</h2>
<ul>
    <li>Order and reservation data: retained for two years for accounting
        and warranty purposes, then anonymised.</li>
    <li>Audit-log entries: retained for one year, then anonymised.</li>
    <li>You can request earlier deletion (see section 6).</li>
</ul>

<h2>5. Who we share it with</h2>
<p>
    We do not sell personal data. We share it only with:
</p>
<ul>
    <li>Our cloud hosting provider, which stores the database on our behalf.</li>
    <li>Sentry, an error-tracking provider, which receives stack traces of
        application errors. PII forwarding is disabled by default.</li>
    <li>Authorities, when compelled by valid legal process.</li>
</ul>

<h2>6. Your rights</h2>
<p>
    You may at any time request a copy of the personal data we hold about
    you, correction of inaccurate data, or its deletion. Write to
    <a href="mailto:bonjour@maisoncafu.cm">bonjour@maisoncafu.cm</a> with
    the phone number you used. We respond within 30 days.
</p>

<h2>7. Security</h2>
<p>
    The site is served over HTTPS. Administrative passwords are stored as
    bcrypt hashes (cost 12). Order data is stored on encrypted disks. We
    take daily backups, retained for seven days.
</p>

<h2>8. Changes to this policy</h2>
<p>
    We may update this policy. Material changes will be announced on the
    homepage 14 days before they take effect. The current version is dated
    at the top of this page.
</p>

<?php require __DIR__ . '/_footer.php'; ?>
