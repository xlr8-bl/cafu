#!/usr/bin/env bash
# Take one consistent mysqldump snapshot, gzip it, prune old ones.
set -euo pipefail

: "${DB_HOST:?DB_HOST not set}"
: "${DB_NAME:?DB_NAME not set}"
: "${MYSQL_ROOT_PASSWORD:?MYSQL_ROOT_PASSWORD not set}"

TS="$(date -u +%Y%m%d-%H%M%S)"
OUT="/backups/srwa-${TS}.sql.gz"
TMP="/tmp/srwa-${TS}.sql"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

echo "[$(date -u -Iseconds)] backup.start out=${OUT}"

# Dump to a temp file first, then gzip. This way a mysqldump failure exits
# before any partial gzip lands in /backups.
#
# --single-transaction:  consistent snapshot on InnoDB without table locks.
# --routines, --triggers: include stored programs.
# --add-drop-database:   restore replaces the database cleanly.
# --hex-blob:            safer for binary columns (e.g. our packed-ip events.ip).
mysqldump \
    -h "${DB_HOST}" -u root -p"${MYSQL_ROOT_PASSWORD}" \
    --single-transaction \
    --routines \
    --triggers \
    --add-drop-database \
    --hex-blob \
    --databases "${DB_NAME}" \
    > "${TMP}"

gzip -c < "${TMP}" > "${OUT}"
rm -f "${TMP}"

SIZE="$(du -h "${OUT}" | cut -f1)"
echo "[$(date -u -Iseconds)] backup.ok out=${OUT} size=${SIZE}"

# Prune anything older than the retention window.
find /backups -maxdepth 1 -name "srwa-*.sql.gz" -mtime "+${RETENTION_DAYS}" -print -delete \
    | sed "s|^|[$(date -u -Iseconds)] backup.pruned |"
