<?php
/**
 * Shared closing shell for legal pages. Highlights the current page in the nav.
 *
 * @var string $legalCurrent  one of 'privacy', 'terms', 'cookies'
 */
$current = $legalCurrent ?? '';
?>
        <nav class="legal-nav">
            <a href="/legal/privacy"<?= $current === 'privacy' ? ' class="current"' : '' ?>>Privacy</a>
            <a href="/legal/terms"<?= $current === 'terms' ? ' class="current"' : '' ?>>Terms of service</a>
            <a href="/legal/cookies"<?= $current === 'cookies' ? ' class="current"' : '' ?>>Cookie notice</a>
            <span style="color:var(--muted)">·</span>
            <a href="/">Back to site</a>
        </nav>
    </main>
</body>
</html>
