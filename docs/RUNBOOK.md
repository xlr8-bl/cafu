# RUNBOOK

Procedures for the things you don't want to figure out at 2am.

---

## Backups

A sidecar container (`srwa-backup`, built from `docker/backup/`) runs
`mysqldump` every night at **02:00 UTC** and writes gzipped snapshots to
the `srwa_backups` named volume. Last **7 days** are retained; older
dumps are deleted automatically.

### List existing backups

```powershell
docker compose exec backup ls -lh /backups
```

### Take an ad-hoc backup right now

```powershell
docker compose exec backup /usr/local/bin/backup.sh
```

Confirm it landed:

```powershell
docker compose exec backup ls -lh /backups | Select-String "srwa-"
```

### Watch the backup log

```powershell
docker compose logs -f backup
```

You should see periodic `backup.start` / `backup.ok` lines.

### Copy a backup out of the volume to your host

```powershell
# Pick one filename from the list above.
docker compose cp backup:/backups/srwa-20260521-020000.sql.gz .\srwa-20260521.sql.gz
```

---

## Restoring from a backup

> **Heads up.** This **destroys the current database** (the dump contains
> `DROP DATABASE` + `CREATE DATABASE`). Take a fresh backup first if there
> is any data you don't want to lose.

### 1. Take a safety dump of the current state

```powershell
docker compose exec backup /usr/local/bin/backup.sh
```

### 2. Find the backup you want to restore

```powershell
docker compose exec backup ls -lh /backups
```

Note the filename, e.g. `srwa-20260520-020001.sql.gz`.

### 3. Restore it

```powershell
docker compose exec -T backup sh -c 'gunzip -c /backups/srwa-20260520-020001.sql.gz | mysql -h "$DB_HOST" -u root -p"$MYSQL_ROOT_PASSWORD"'
```

> The `-T` flag disables TTY allocation so the redirected gzip stream flows
> through correctly. The dump's own `CREATE DATABASE` + `USE` statements
> drop and recreate `srwa`.

### 4. Re-apply migrations (just in case the dump is older than the schema)

```powershell
docker compose run --rm migrate
```

Phinx checks `schema_migrations` and only runs anything that's actually missing.

### 5. Sanity-check

```powershell
docker compose exec mysql mysql -uroot -proot_dev_password srwa -e "SHOW TABLES; SELECT COUNT(*) AS orders FROM orders;"
```

Expected: all 8 tables present (`menu_categories`, `menu_items`, `customers`,
`orders`, `order_items`, `reservations`, `admins`, `events`,
`schema_migrations`) and an `orders` row count matching what you remember.

### 6. Smoke test the app

```powershell
curl.exe http://localhost:8090/healthz
curl.exe http://localhost:8090/api/menu
```

If `/api/menu` returns the menu and `/healthz` returns `ok`, restore is done.

---

## Recreating the admin user after a destructive restore

If the dump predates the admin you've been using:

```powershell
docker compose exec php php /var/www/html/bin/create-admin.php new-admin@cafu.local "StrongPassword!" "Admin Name"
```

---

## Verifying backups regularly (manual, weekly)

A backup you've never restored is a coin flip. Once a week, in a scratch
environment:

1. Spin up a parallel compose with a different project name (`COMPOSE_PROJECT_NAME=srwa-verify docker compose up -d`).
2. Restore the latest backup into it (steps 1–5 above).
3. Hit `/api/menu` — should return rows.
4. Tear it down (`docker compose down -v`).

If any step fails, the prod backup is suspect — investigate before relying
on it.

---

## After a `php` rebuild — 502s from `/healthz` and `/api/*`

If you rebuild the php container (`docker compose up -d --build php`) and
the next request returns `502 Bad Gateway`, nginx is holding a cached DNS
entry pointing at the old php container's IP. Fix:

```powershell
docker compose restart nginx
```

The smoke endpoints come back to 200 immediately.

---

## Disaster: the named volume itself is gone

If you've lost `srwa_backups` (host disk failure, accidental
`docker volume prune`, etc.), the backups themselves are gone. The
RUNBOOK can't help.

**Mitigation:** in production, shell out to off-host storage. Add a
post-backup step that uploads to S3-compatible storage (Backblaze, MinIO,
Wasabi). Out of scope for the course project but flagged here so the gap
is visible.
