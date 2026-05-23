<?php

declare(strict_types=1);

namespace Srwa\Logging;

use Monolog\Formatter\JsonFormatter;
use Monolog\Handler\StreamHandler;
use Monolog\Level;
use Monolog\Logger as Monolog;
use Monolog\Processor\PsrLogMessageProcessor;
use Monolog\Processor\WebProcessor;

/**
 * Single Monolog channel. JSON-formatted to stdout — Docker captures stdout,
 * so `docker compose logs php` becomes a structured-log search.
 *
 * Level threshold is read from LOG_LEVEL env var; defaults to INFO.
 */
final class Logger
{
    private static ?Monolog $instance = null;

    public static function get(): Monolog
    {
        if (self::$instance instanceof Monolog) {
            return self::$instance;
        }

        $level   = self::levelFromEnv((string) (getenv('LOG_LEVEL') ?: 'info'));
        $handler = new StreamHandler('php://stdout', $level);
        $handler->setFormatter(new JsonFormatter(JsonFormatter::BATCH_MODE_NEWLINES, true));

        $logger = new Monolog('srwa');
        $logger->pushHandler($handler);

        // Adds request URI / method / IP automatically when running under FPM.
        if (PHP_SAPI !== 'cli') {
            $logger->pushProcessor(new WebProcessor());
        }
        // Interpolate {placeholder} tokens in messages from context.
        $logger->pushProcessor(new PsrLogMessageProcessor(null, true));

        self::$instance = $logger;
        return $logger;
    }

    /** Allow tests to replace the singleton. */
    public static function set(Monolog $logger): void
    {
        self::$instance = $logger;
    }

    public static function reset(): void
    {
        self::$instance = null;
    }

    private static function levelFromEnv(string $name): Level
    {
        return match (strtolower($name)) {
            'debug'   => Level::Debug,
            'notice'  => Level::Notice,
            'warning' => Level::Warning,
            'error'   => Level::Error,
            default   => Level::Info,
        };
    }
}
