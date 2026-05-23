-- Append-only audit log. Every business-meaningful state change writes a row here.
-- Queries: "what did admin #3 do last week?", "what happened to order #1234?",
-- "how many failed logins from this IP yesterday?".
-- Sourced by db/migrations/20260521140000_create_events.php — do not load directly.

CREATE TABLE events (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kind            VARCHAR(64) NOT NULL,
    actor_kind      ENUM('admin','customer','system','anonymous') NOT NULL DEFAULT 'system',
    actor_id        INT UNSIGNED NULL,
    subject_kind    VARCHAR(32) NULL,
    subject_id      INT UNSIGNED NULL,
    payload         JSON NULL,
    ip              VARBINARY(16) NULL,
    created_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_events_kind    (kind, created_at),
    INDEX idx_events_subject (subject_kind, subject_id),
    INDEX idx_events_actor   (actor_kind, actor_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
