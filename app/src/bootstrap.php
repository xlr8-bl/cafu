<?php

/**
 * Shared entry-point setup. Required at the top of every request entrypoint
 * (public/index.php, public/admin/*.php). Idempotent.
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

\Srwa\Logging\SentryInit::boot();
