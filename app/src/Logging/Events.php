<?php

declare(strict_types=1);

namespace Srwa\Logging;

use Srwa\Auth\Session;
use Srwa\Database;

/**
 * Append-only business-event recorder. Writes a row to the `events` table
 * AND echoes a structured Monolog line so the event shows up in both the
 * audit log and the live stream.
 */
final class Events
{
    public const KIND_ORDER_PLACED          = 'order.placed';
    public const KIND_ORDER_STATUS_CHANGED  = 'order.status_changed';
    public const KIND_RESERVATION_HELD      = 'reservation.held';
    public const KIND_ADMIN_LOGIN_OK        = 'admin.login_succeeded';
    public const KIND_ADMIN_LOGIN_FAIL      = 'admin.login_failed';
    public const KIND_ADMIN_LOGOUT          = 'admin.logout';

    /**
     * @param array<string, mixed> $payload
     */
    public static function record(
        string $kind,
        ?string $subjectKind = null,
        ?int $subjectId = null,
        array $payload = [],
        ?string $actorKind = null,
        ?int $actorId = null,
    ): void {
        [$actorKind, $actorId] = self::resolveActor($actorKind, $actorId);

        try {
            Database::connection()->prepare(
                'INSERT INTO events
                    (kind, actor_kind, actor_id, subject_kind, subject_id, payload, ip)
                 VALUES
                    (:k, :ak, :ai, :sk, :si, :p, :ip)'
            )->execute([
                'k'  => $kind,
                'ak' => $actorKind,
                'ai' => $actorId,
                'sk' => $subjectKind,
                'si' => $subjectId,
                'p'  => $payload === [] ? null : json_encode($payload, JSON_THROW_ON_ERROR),
                'ip' => self::packedIp(),
            ]);
        } catch (\Throwable $e) {
            // Never let audit failure break the request — log it and move on.
            Logger::get()->error('events.write_failed', [
                'kind'  => $kind,
                'error' => $e->getMessage(),
            ]);
        }

        Logger::get()->info($kind, [
            'actor_kind'   => $actorKind,
            'actor_id'     => $actorId,
            'subject_kind' => $subjectKind,
            'subject_id'   => $subjectId,
            'payload'      => $payload,
        ]);
    }

    /** @return array{0:string, 1:?int} */
    private static function resolveActor(?string $actorKind, ?int $actorId): array
    {
        if ($actorKind !== null) {
            return [$actorKind, $actorId];
        }
        if (PHP_SAPI !== 'cli' && ($admin = Session::adminId()) !== null) {
            return ['admin', $admin];
        }
        return ['anonymous', null];
    }

    private static function packedIp(): ?string
    {
        if (PHP_SAPI === 'cli') {
            return null;
        }
        $raw = $_SERVER['REMOTE_ADDR'] ?? null;
        if (!is_string($raw)) {
            return null;
        }
        $packed = @inet_pton($raw);
        return $packed === false ? null : $packed;
    }
}
