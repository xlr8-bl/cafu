<?php
$legalTitle   = 'Cookie notice';
$legalCurrent = 'cookies';
require __DIR__ . '/_header.php';
?>

<p>
    A cookie is a small text file the site asks your browser to store. We
    use the minimum set needed to run the site — no advertising, no
    third-party tracking, no analytics.
</p>

<h2>Cookies we set</h2>

<h3>Session cookie</h3>
<ul>
    <li><strong>Name:</strong> <code>srwa_sid</code></li>
    <li><strong>Purpose:</strong> identifies an administrative session so
        kitchen staff stay signed in across pages.</li>
    <li><strong>Set when:</strong> an administrator signs in at
        <code>/admin/login.php</code>. Never set for ordinary site visitors.</li>
    <li><strong>Expires:</strong> when the browser is closed, or after 2
        hours of inactivity.</li>
    <li><strong>Flags:</strong> HttpOnly (not readable by JavaScript),
        SameSite=Lax, Secure (in production over HTTPS).</li>
    <li><strong>Category:</strong> strictly necessary — no consent required.</li>
</ul>

<h3>Cookie-notice acknowledgement</h3>
<ul>
    <li><strong>Storage:</strong> browser <code>localStorage</code>, key
        <code>cafu_cookie_consent</code>.</li>
    <li><strong>Purpose:</strong> remembers that you have read this notice
        so the banner doesn't reappear on every page load.</li>
    <li><strong>Expires:</strong> until you clear browser data.</li>
    <li><strong>Category:</strong> functional.</li>
</ul>

<h2>Third-party cookies</h2>
<p>
    We do not embed third-party trackers, analytics scripts, social plug-ins,
    or advertising pixels. If that changes, this notice will be updated and
    a fresh acknowledgement requested.
</p>

<h2>How to clear or block cookies</h2>
<p>
    Every modern browser lets you view and delete cookies from its settings.
    Clearing the cookies above will sign administrators out and re-show the
    notice banner on the next visit. Ordinary site visitors lose no
    functionality by blocking cookies entirely.
</p>

<h2>See also</h2>
<p>
    <a href="/legal/privacy">Privacy policy</a> · how we handle personal
    data more broadly.
</p>

<?php require __DIR__ . '/_footer.php'; ?>
