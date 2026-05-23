<?php

declare(strict_types=1);

namespace Srwa\Logging;

use function Sentry\init;

/**
 * Initialise Sentry from env vars. No-op if SENTRY_DSN is unset — keeps
 * local development quiet and avoids paying for events nobody will read.
 */
final class SentryInit
{
    private static bool $done = false;

    public static function boot(): void
    {
        if (self::$done) {
            return;
        }
        self::$done = true;

        $dsn = getenv('SENTRY_DSN') ?: '';
        if ($dsn === '') {
            return;
        }

        init([
            'dsn'                  => $dsn,
            'environment'          => getenv('APP_ENV') ?: 'production',
            'release'              => getenv('APP_RELEASE') ?: null,
            'traces_sample_rate'   => 0.0,  // perf tracing off by default — opt in once we have a budget
            'send_default_pii'     => false, // do not ship request bodies / cookies by default
        ]);
    }
}
