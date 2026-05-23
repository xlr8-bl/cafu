#!/usr/bin/env bash
# Wires up cron and launches it in the foreground.
set -euo pipefail

# Install a system crontab (Debian style — runs as root). Output to PID 1's
# stdio so `docker compose logs backup` sees it.
cat > /etc/cron.d/srwa-backup <<'CRONTAB'
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
0 2 * * * root /usr/local/bin/backup.sh > /proc/1/fd/1 2> /proc/1/fd/2
CRONTAB
chmod 0644 /etc/cron.d/srwa-backup

echo "[$(date -u -Iseconds)] backup sidecar started; cron schedule: 0 2 * * *"
echo "[$(date -u -Iseconds)] retention: ${BACKUP_RETENTION_DAYS:-7} days under /backups"

# Take one backup right now so the volume is never empty.
if ! /usr/local/bin/backup.sh; then
    echo "[$(date -u -Iseconds)] initial backup failed (db may not be ready yet — nightly schedule will retry)"
fi

# crond in foreground; -x sch traces schedule decisions; -n keeps it attached.
exec /usr/sbin/crond -n
