# SHIPPING — Production-readiness plan for SRWA / Maison Cafu

This file tracks the 6-PR "shipping overlay" that turns the course demo into
a deployable product. Each PR gets a detailed entry below as it lands so any
future session (or teammate) can pick up cold.

> **Why this exists.** The lecturer requires the project to follow SWEBOK
> Fig 1.1 ("Breakdown of Topics for the Software Construction KA") "to the
> bone." That tree has ~36 leaves across 5 branches. The course skeleton
> covered roughly 22 of them. This plan closes the remaining gaps **and**
> hardens the system for real-world deploy. Payments are explicitly out of
> scope.

---

## Plan at a glance

| # | PR                                  | Status        | Touches                                                |
|---|-------------------------------------|---------------|--------------------------------------------------------|
| 1 | Phinx migrations + initial schema   | **shipped**   | `db/`, `docker-compose.yml`, `Jenkinsfile`, `composer.json` |
| 2 | Admin auth (sessions, bcrypt, CSRF) | next          | `db/migrations/`, new `src/Auth/`, `public/admin/`     |
| 3 | Observability (Monolog + Sentry)    | blocked by 1,2| `src/Logging/`, new `events` table, `composer.json`    |
| 4 | HTTPS via Caddy reverse proxy       | blocked by 2  | `docker/caddy/`, `docker-compose.yml`, `README.md`     |
| 5 | Nightly mysqldump backups + RUNBOOK | blocked by 1  | new `backup` service, `docs/RUNBOOK.md`                |
| 6 | Legal pages + cookie banner         | independent   | `public/legal/`, `public/views/shell.php`, `assets/js/` |

Dependencies:
- PR2 needs PR1 (auth tables are a migration)
- PR3 needs PR1 + PR2 (events table is a migration; events tie to user identity)
- PR4 needs PR2 (HTTPS protects the session cookies auth hands out)
- PR5 needs PR1 (backups assume schema is stable post-migrations)

---

## PR1 — Phinx migrations + `001_initial_schema`

**Shipped:** 2026-05-21

**Why.** `db/init.sql` was a single drop-and-reseed file. Fine for dev,
unusable in production where real customer data sits in the tables. Adopting
Phinx gives us versioned, ordered, reversible schema changes — "git for the
database."

### What changed

**Added**
- `db/phinx.php` — Phinx config; reads `DB_*` env vars so the same file works
  locally, inside Docker, and in CI.
- `db/migrations/20260521000001_initial_schema.php` — the first migration.
  Class `InitialSchema` extends `AbstractMigration`; `up()` sources the raw
  SQL file below; `down()` drops the tables in reverse-FK order so InnoDB
  doesn't complain.
- `db/sql/001_initial_schema.sql` — the schema, extracted verbatim from the
  old `init.sql`. Sourced by the migration so the SQL is reviewable as SQL.
- `scripts/migrate.sh` — runs `vendor/bin/phinx migrate` inside the container.

**Modified**
- `app/composer.json` — added `robmorgan/phinx ^0.16` to `require` (not
  `require-dev`, because production needs phinx to apply migrations at deploy
  time). Added `composer migrate / rollback / status` scripts for convenience.
- `docker-compose.yml`:
  - New one-shot `migrate` service. Builds from the same Dockerfile as `php`
    so it shares the vendor cache. Runs after `mysql: service_healthy`,
    exits when done.
  - `php` now waits on `migrate: service_completed_successfully` — guarantees
    schema is applied before FastCGI accepts traffic.
  - Removed the `init.sql` initdb-mount. Mysql no longer auto-loads schema;
    Phinx owns it. `seed.sql` is now mounted at `/srwa-seed.sql` and loaded
    on demand via `make seed`.
  - Mysql healthcheck switched from `-h localhost` → `-h 127.0.0.1` to force
    TCP. The unix-socket variant marked mysql healthy before the TCP listener
    was actually open, causing migrate to race ahead and fail with
    `Connection refused`.
- `Makefile` — `make migrate / rollback / migration-status / seed` targets.
- `Jenkinsfile` — integration-smoke stage now runs `phinx status` and seeds
  dev data before hitting `/api/menu`.
- `phpcs.xml` — excludes `db/migrations/` from PSR-12 (Phinx's class-naming
  rules diverge from PSR-12 file-per-class).
- `README.md` — quick-start updated; new "Database migrations" section; layout
  diagram updated.
- `docs/ARCHITECTURE.md` — database-layer reference updated; reuse list
  includes Phinx.
- `docs/lecture-mapping.md` — §1.5 Reuse entry now cites Phinx.

**Removed**
- `db/init.sql` — replaced by the migration + extracted SQL file.

### Gotchas hit during PR1

1. **Mysql healthcheck false-positive.** Mysql 8.4's first response to
   `mysqladmin ping -h localhost` comes from the unix socket, which is alive
   long before the TCP port. Compose marked mysql healthy → migrate ran →
   PDO failed with `Connection refused`. Fix: `-h 127.0.0.1` + `start_period: 20s`.
2. **Vendor volume masking.** The named `app_vendor` volume caches the
   image's `vendor/` on first boot. Adding Phinx to `composer.json` and
   rebuilding the image is **not enough** — the old vendor cache shadows the
   new one. Fix: `docker compose down -v` before `up --build`. README warns
   about this.
3. **PowerShell quoting.** `docker compose run --rm --entrypoint "" migrate sh -c '...'`
   gets mangled because PowerShell eats the empty `""` token, leaving
   `--entrypoint migrate sh ...` and "no such service: sh". Use
   `--entrypoint=''` (single quotes, equals sign) instead.

### Verification

Boot order ends up:
```
mysql (healthy) → migrate (one-shot, exits 0) → php (started) → nginx (started)
```

Confirmed by:
```powershell
docker compose down -v
docker compose up -d --build
docker compose exec mysql mysql -uroot -proot_dev_password srwa -e "SHOW TABLES;"
```

Expected tables: `customers`, `menu_categories`, `menu_items`, `order_items`,
`orders`, `reservations`, `schema_migrations` (7 total).

### How to add a new migration

```powershell
# 1. Create the file. Filename must be YYYYMMDDHHMMSS_snake_name.php; class is PascalCase.
# Example:
#   db/migrations/20260601120000_add_admins.php  →  class AddAdmins
# 2. Implement up() and down() using $this->execute() or Phinx fluent API.
# 3. Re-run `docker compose up -d` (or `make migrate`) — Phinx applies new ones in order.
```

---

## PR2 — Admin auth (sessions, bcrypt, CSRF)

**Shipped:** 2026-05-21

**Why.** The kitchen / admin surface was undefined and would have been
publicly reachable. We need a way to gate it before anything observable
(events, audit log) is tied to "who did this." Customer side stays
guest-checkout — a restaurant doesn't need accounts to take an order.

### What changed

**Added — schema**
- `db/migrations/20260521120000_create_admins.php` — second migration
- `db/sql/002_admins.sql` — extracted SQL (id, email UNIQUE, password_hash,
  name, last_login_at, created_at)

**Added — auth library** under `app/src/Auth/`
- `Session.php` — hardened wrapper around `session_start()`. HttpOnly +
  SameSite=Lax cookies, Secure flag flipped on when `APP_URL` starts with
  `https://`, strict mode enabled, `session_regenerate_id(true)` on auth
  boundary (defeats session fixation). CLI/PHPUnit path uses an array-backed
  `$_SESSION` so unit tests don't fight with PHP's cookie machinery.
- `Password.php` — `password_hash` / `password_verify` wrapper.
  Bcrypt cost 12; minimum 10 chars enforced at hash time.
- `Csrf.php` — synchronizer-token CSRF: 64-hex token per session in
  `$_SESSION['_csrf_token']`, `hash_equals` for constant-time compare,
  `Csrf::field()` helper for forms, `Csrf::rotate()` for use after privilege
  changes.

**Added — HTTP gate**
- `app/src/Http/AdminGuard.php` — `AdminGuard::require()` redirects to
  `/admin/login.php` if no session, returns 403 on POSTs without valid CSRF.

**Added — admin pages**
- `app/public/admin/login.php` — dark-mode login form, constant-time compare
  even on miss (so timing doesn't leak "email exists"), 250ms artificial
  delay on failure to slow brute force.
- `app/public/admin/logout.php` — POST-only with CSRF (defeats malicious
  `<img>` tag DoS-logout).
- `app/public/admin/index.php` — kitchen view: lists last 50 orders with
  customer name, status, total, placed-at, and one button per allowed state
  transition.

**Added — model + CLI**
- `app/src/Models/Admin.php` — `findByEmail`, `create` (validates email),
  `recordLogin` (touches `last_login_at`).
- `app/src/Models/Order.php` — extended with `transitions()`, `canTransition()`,
  `recent()`, `updateStatus()`. Status machine is a flat array, ready for
  promotion to a formal state machine in §4.7.
- `app/bin/create-admin.php` — CLI seeder. There's no public sign-up; first
  admin must be created via this script.

**Added — tests**
- `app/tests/Unit/PasswordTest.php` — round-trip, bcrypt format check,
  salting (same input → different hash), short-password rejection.
- `app/tests/Unit/CsrfTest.php` — hex/length, stability within session,
  positive + negative verify, rotation invalidates old token.

**Modified**
- `docker/nginx/default.conf` — new `location /admin` block routes
  `/admin/` and `/admin/*` to PHP-FPM, never the React SPA.
- `Dockerfile` — dev deps included in the build stage; composer binary
  copied into the runtime stage so in-container `composer test/lint` works.
- `app/composer.json` — `status` script renamed to `migrate-info` (avoided
  shadowing `composer status`).
- `docs/lecture-mapping.md` — entries added for §1.6 standards and §3.4.4
  defensive programming (CSRF / hash_equals).

### Gotchas hit during PR2

1. **`failOnWarning="true"` + `session_start()` in CLI.** PHPUnit runs in
   CLI; calling `session_start()` in CLI without an active request emits a
   "headers already sent" warning that would fail the test run. Fix: in
   `Session::start()`, detect `PHP_SAPI === 'cli'` and skip the real
   `session_start()` — `$_SESSION` works as a plain array under PHPUnit.
2. **`composer` and PHPUnit were missing from the runtime image.** The
   Dockerfile used `composer install --no-dev` and never copied the
   `composer` binary into the runtime stage, so `docker compose exec php
   composer test` failed with "executable file not found". Fix:
    - Dropped `--no-dev` (dev deps in the image are fine while we have one
      image for dev + prod; the prod-split target arrives with PR4).
    - Added `COPY --from=composer:2.7 /usr/bin/composer /usr/local/bin/composer`
      to the runtime stage.
   Note: rebuild requires `docker compose down -v` (the `app_vendor` volume
   would otherwise mask the freshly built `vendor/`).
3. **Composer script naming.** A script called `status` silently shadows
   `composer status` (and emits a warning at every script run). The
   migration-status script is now `composer migrate-info`.

### Seeding the first admin

```powershell
docker compose exec php php /var/www/html/bin/create-admin.php `
    chef@cafu.local "TempPass1234!" "Chef Ngalle"
```

Then visit `http://localhost:8090/admin/` — you'll be bounced to
`/admin/login.php` until a valid session is established.

### Boot order is unchanged

```
mysql (healthy) → migrate (one-shot, exits 0) → php (started) → nginx (started)
```

The `migrate` service now applies **both** `001_initial_schema` and
`002_create_admins` on first boot.

---

## PR3 — Observability (Monolog + events table + Sentry)

**Shipped:** 2026-05-21

**Why.** Without observability, a live system is a black box: customer
complaints can't be reproduced, errors die in `error_log`, and there's no
audit trail of who did what. We split the concern in three:

- **Logs** (Monolog → stdout JSON) — operational, ephemeral, captured by Docker.
- **Events table** — append-only business audit; permanent, queryable.
- **Sentry** — exception grouping + alerting; no-op until `SENTRY_DSN` is set.

### What changed

**Added — schema**
- `db/migrations/20260521140000_create_events.php` — third migration
- `db/sql/003_events.sql` — `events` table (id, kind, actor_kind enum,
  actor_id, subject_kind, subject_id, payload JSON, ip VARBINARY(16),
  created_at TIMESTAMP(3)). Indexes on (kind, created_at), (subject_kind,
  subject_id), (actor_kind, actor_id, created_at).

**Added — logging library** under `app/src/Logging/`
- `Logger.php` — Monolog 3 singleton. JSON formatter, `php://stdout`,
  WebProcessor under FPM, level from `LOG_LEVEL` env (default `info`).
  `Logger::set()` and `Logger::reset()` exposed for tests.
- `Events.php` — `Events::record(kind, subjectKind, subjectId, payload, actorKind, actorId)`.
  Resolves actor from session if not supplied. Writes to DB AND echoes a
  structured Monolog INFO line (one event, two streams). DB failures
  degrade to a log error — auditing never breaks the request.
  Constants: `KIND_ORDER_PLACED`, `KIND_ORDER_STATUS_CHANGED`,
  `KIND_RESERVATION_HELD`, `KIND_ADMIN_LOGIN_OK / _FAIL`, `KIND_ADMIN_LOGOUT`.
- `SentryInit.php` — calls `\Sentry\init()` with DSN from env. No-op when
  unset; PII off by default.

**Added — bootstrap**
- `app/src/bootstrap.php` — single entry-point setup: autoload + Sentry init.
  Required from every public PHP entrypoint (`index.php`, `admin/*.php`).
  Idempotent.

**Wired in**
- `app/public/index.php` — logs every request (`http.request`).
- `app/public/api/router.php` — `notice` on 422 validation errors,
  `error` + `Sentry::captureException()` on 500.
- `app/src/Models/Order.php` — emits `order.placed` after commit;
  `order.status_changed` (with from/to) after status mutation.
- `app/src/Models/Reservation.php` — emits `reservation.held` after commit.
- `app/public/admin/login.php` — emits `admin.login_succeeded` /
  `admin.login_failed` (payload includes attempted email, **never** the password).
- `app/public/admin/logout.php` — emits `admin.logout`.

**Added — tests**
- `app/tests/Unit/LoggerTest.php` — singleton, configured Monolog instance,
  record carries message + context (via TestHandler).

**Modified**
- `app/composer.json` — added `monolog/monolog ^3.5`, `sentry/sentry ^4.0`.
- `.env.example`, `.env` — new vars `LOG_LEVEL`, `SENTRY_DSN`, `APP_RELEASE`.
- `docs/lecture-mapping.md` — entries added for §1.4 V&V (observability is
  runtime verification), §3.7 Construction Quality, §4.5 Error Handling.

### How to read events

```powershell
# Tail live structured logs
docker compose logs -f php

# Query the audit table
docker compose exec mysql mysql -uroot -proot_dev_password srwa -e `
    "SELECT id, kind, actor_kind, actor_id, subject_kind, subject_id, payload, created_at FROM events ORDER BY id DESC LIMIT 20;"

# What did admin #1 do today?
docker compose exec mysql mysql -uroot -proot_dev_password srwa -e `
    "SELECT kind, subject_kind, subject_id, payload, created_at FROM events WHERE actor_kind='admin' AND actor_id=1 AND DATE(created_at)=CURDATE() ORDER BY id DESC;"
```

### Sentry

To activate, paste your DSN into `.env`:

```
SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
```

Restart the php container (`docker compose restart php`). Any unhandled
exception in the API router now ships to Sentry with grouping + alerts.

---

## PR4 — HTTPS via Caddy reverse proxy

**Shipped:** 2026-05-21

**Why.** Session cookies and CSRF tokens travel in clear-text over plain
HTTP, so anyone on the same network can steal them. HTTPS encrypts the
transport. We use Caddy because it auto-fetches and renews Let's Encrypt
certificates with zero config — set a domain, it just works.

### What changed

**Added**
- `docker/caddy/Caddyfile` — env-driven site address. Defaults to `:80`
  (plain HTTP) when `SITE_ADDRESS` is unset; set it to a real domain in
  prod and Caddy auto-issues a Let's Encrypt cert.
  - Sets HSTS, X-Content-Type-Options, Referrer-Policy headers.
  - Removes the `Server` banner.
  - JSON-formatted access logs to stdout.
  - Edge-level 404 on dotfile paths.
- `docker-compose.yml` — new `caddy` service (image `caddy:2.8-alpine`).
  Holds host port `8090:80` (and `8493:443` for HTTPS testing); proxies to
  `nginx:80` on the internal network. `caddy_data` + `caddy_config` named
  volumes preserve certs across restarts.

**Modified**
- `docker-compose.yml` — `nginx` service no longer publishes a host port;
  it now `expose`s only port 80 to other compose services. Caddy is the
  public entrypoint.
- `.env.example` / `.env` — new commented vars `SITE_ADDRESS` + `CADDY_EMAIL`
  with prod usage notes.

### Boot order

```
mysql (healthy) → migrate (one-shot) → php → nginx → caddy → public traffic
```

Dev URL stays `http://localhost:8090` — Caddy now handles it (transparent).

### Going to production

```env
# In .env on the prod host:
SITE_ADDRESS=cafu.example.com
CADDY_EMAIL=admin@cafu.example.com
APP_URL=https://cafu.example.com
```

…and override the Caddy ports in your prod compose to `80:80` + `443:443`.
First request triggers ACME — Caddy fetches the cert, then redirects HTTP
to HTTPS automatically.

### Verifying

```powershell
docker compose down
docker compose up -d --build

# Healthz still works via the new Caddy entrypoint.
curl.exe http://localhost:8090/healthz

# Confirm Caddy is doing the proxying — response headers should NOT show "Server: nginx".
curl.exe -I http://localhost:8090/healthz
# Look for: Server: Caddy  (or no Server header at all, since we strip it)
#           Strict-Transport-Security
#           X-Content-Type-Options
```

---

## PR5 — Nightly mysqldump backups + RUNBOOK

**Shipped:** 2026-05-21

**Why.** Disks die. Schemas get DROPped at 2am. Without backups, a single
bad afternoon erases years of orders. A backup you've never restored is a
coin flip — the RUNBOOK documents the restore procedure so it's not invented
from scratch in a crisis.

### What changed

**Added — sidecar image** (`docker/backup/`)
- `Dockerfile` — `alpine:3.20` + `mysql-client` + `gzip` + busybox crond.
  Stays running with `crond` as PID 1 so Docker captures cron output.
- `backup.sh` — `mysqldump --single-transaction --routines --triggers
  --hex-blob --add-drop-database --databases srwa | gzip -c >
  /backups/srwa-<UTC-TIMESTAMP>.sql.gz`. Then prunes anything older than
  `BACKUP_RETENTION_DAYS` (default 7).
- `entrypoint.sh` — installs the crontab (`0 2 * * *`), runs one immediate
  backup so the volume is never empty, exec's `crond -f -L /dev/stdout`.

**Added — service in docker-compose.yml**
- `backup` service builds from `./docker/backup`, depends on
  `mysql: service_healthy`, mounts `srwa_backups:/backups`, `restart: unless-stopped`.

**Added — RUNBOOK** (`docs/RUNBOOK.md`)
- List backups · ad-hoc backup · tail log · copy out of volume
- Full restore procedure (safety dump → restore → re-migrate → smoke test)
- Recreate admin after destructive restore
- Weekly-verify procedure (restore into a parallel compose project)
- Disaster note: off-host storage gap is explicitly called out

**Modified**
- `docker-compose.yml` — `srwa_backups` named volume in the volumes block.
- `docs/lecture-mapping.md` — entries added for §2.2.4 Preventive
  maintenance (backup as preventive) and §1.3 Anticipating Change
  (data-loss recovery is a form of change).

### Verifying

```powershell
docker compose up -d --build

# 1. Sidecar is healthy and crond is running.
docker compose ps backup
docker compose logs backup
#    Expected: "backup sidecar started; cron schedule: 0 2 * * *"
#              "backup.start" + "backup.ok" lines from the initial backup.

# 2. There's at least one dump on disk.
docker compose exec backup ls -lh /backups

# 3. Take one on demand.
docker compose exec backup /usr/local/bin/backup.sh

# 4. Confirm restore path works (RUNBOOK §3). Take a safety dump first.
docker compose exec backup /usr/local/bin/backup.sh
docker compose exec -T backup sh -c 'gunzip -c $(ls -1t /backups/srwa-*.sql.gz | head -n1) | mysql -h "$DB_HOST" -u root -p"$MYSQL_ROOT_PASSWORD"'

# 5. Sanity-check.
docker compose exec mysql mysql -uroot -proot_dev_password srwa -e "SHOW TABLES;"
```

### Gotchas hit during PR5

1. **Alpine `mysql-client` is MariaDB-client.** MySQL 8 defaults to
   `caching_sha2_password` auth, which MariaDB's client can't load
   (`Plugin caching_sha2_password could not be loaded`). First attempt
   produced 4KB "backups" that were just an empty gzip stream — bash
   reported `backup.ok` because the pipe was masking mysqldump's exit
   code. Fix: base the sidecar on `mysql:8.4` itself (real MySQL client),
   use `set -o pipefail`, dump to a temp file first then gzip.
2. **mysql:8.4 is Oracle Linux 9, not Debian.** `apt-get` doesn't exist.
   Use `microdnf install -y cronie` and `/usr/sbin/crond -n`.
3. **Git Bash mangles single-slash paths.** `docker compose exec backup
   ls /backups` becomes `ls "C:/Program Files/Git/backups"`. Use
   `//backups` to escape. Documented in the RUNBOOK.
4. **nginx DNS cache vs container recreate.** Recreating `php` (during
   any rebuild) gives it a new IP, but nginx's resolver keeps the old
   one cached → 502s on subsequent requests. Fix: `docker compose
   restart nginx` after any `php` recreate. Noted in RUNBOOK §
   "After a php rebuild".

### Gap noted (not addressed in this PR)

`srwa_backups` is a docker named volume on the same host as the database.
If the host disk fails, both go. Production deploys should add an off-host
upload step (S3-compatible). Out of scope for the course project; called
out in RUNBOOK § "Disaster: the named volume itself is gone".

---

## PR6 — Legal pages + cookie banner

**Shipped:** 2026-05-21

**Why.** Even a small restaurant collecting phone numbers triggers
disclosure duties under Cameroon Law 2010/012 (cybercriminality) and —
for EU visitors — GDPR. The system was operating without any privacy
notice, terms, or cookie information. This PR closes that gap.

### What changed

**Added — legal pages** (PHP-rendered, pretty URLs)
- `app/public/legal/_header.php` + `_footer.php` — shared shell with the
  dark Maison Cafu styling, "Draft — pending counsel review" banner,
  and a three-link nav (Privacy / Terms / Cookies). `robots: index,follow`
  so search engines can find them.
- `app/public/legal/privacy.php` — covers controller identity, what we
  collect, why, retention, sharing (cloud host, Sentry, authorities), user
  rights, security posture (HTTPS, bcrypt, backups), change procedure.
- `app/public/legal/terms.php` — orders, reservations, acceptable use, IP,
  liability, Cameroon governing law.
- `app/public/legal/cookies.php` — enumerates the two storage items
  (`srwa_sid` session cookie, `cafu_cookie_consent` localStorage key) with
  flags, purposes, expirations; states "no third-party trackers."

**Added — cookie banner** (React)
- `app/web/src/components/CookieBanner.tsx` — checks
  `localStorage['cafu_cookie_consent']` on mount; if absent, slides up a
  card at bottom-right (bottom-inset on mobile) with "Got it" + a Privacy
  link. Dismiss writes the key and slides out. Wrapped in `AnimatePresence`
  for consistency with the existing motion design.
- `app/web/src/App.tsx` — mounts `<CookieBanner />` once at root.

**Modified**
- `app/web/src/components/Footer.tsx` — appended a small Privacy / Terms /
  Cookie-notice link row at the bottom of the existing legal section.
- `docker/nginx/default.conf` — new `location /legal` block that resolves
  pretty URLs (`/legal/privacy` → `legal/privacy.php` via try_files).
- `docs/lecture-mapping.md` — entries added for §1.6 Standards (legal
  compliance as an external standard) and §2.2.3 Perfective change
  (improving the product without altering functionality).

### Verifying

```powershell
# 1. Rebuild — Vite needs to pick up the new CookieBanner.tsx. The .vite
#    transform cache (in the app_web_modules named volume) is sticky, so
#    on first attempt you may get a bundle without the banner. Clear it:
docker compose run --rm --entrypoint='' web_build sh -c \
    'rm -rf /web/node_modules/.vite /web/dist/* && npm run build'

# 2. Reload nginx so /legal/* routes are recognised.
docker compose restart nginx

# 3. Each legal page renders.
curl.exe -s -o NUL -w "privacy:  %{http_code}`n" http://localhost:8090/legal/privacy
curl.exe -s -o NUL -w "terms:    %{http_code}`n" http://localhost:8090/legal/terms
curl.exe -s -o NUL -w "cookies:  %{http_code}`n" http://localhost:8090/legal/cookies
#    Expected: 200 for all three.

# 4. Visit in a browser to see the banner.
start http://localhost:8090
#    First visit: cookie banner appears bottom-right.
#    Click "Got it": banner slides away, localStorage['cafu_cookie_consent'] = '1'.
#    Refresh: banner stays away.
#    Footer now has Privacy / Terms / Cookie notice links.
```

### Gotchas hit during PR6

1. **Vite transform cache survives `docker compose up --build`.** Because
   `node_modules` lives in the `app_web_modules` named volume, the
   `.vite/` transform cache inside it persists. New `.tsx` source files
   get added but Vite serves the previous bundle unchanged (same hash,
   same size, same module count). Fix: `rm -rf /web/node_modules/.vite
   /web/dist/*` before `npm run build`. Visible symptom: bundle hash
   doesn't change despite source edits.
