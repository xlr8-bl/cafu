# The Maison Cafu Journey

A walk-through of everything we did to turn the CEC418 course skeleton
into a deployable restaurant ordering system, written for someone who
knows code but is new to DevOps. Read top-down — every concept is
defined the first time it appears.

---

## 0. Where we started

You had a working course project — call it the **skeleton**:

- A PHP backend that exposed a small JSON API (`/api/menu`, `/api/orders`,
  `/api/reservations`, `/api/recommend`).
- A React/Vite single-page app (SPA) that showed the menu, the cart, and
  a reservation form.
- A MySQL database with a single `db/init.sql` file that created the
  schema and seeded a Cameroonian menu.
- A Python script that mined past orders for "people who ordered X also
  ordered Y" recommendations.
- A `Dockerfile` + `docker-compose.yml` that brought it all up.
- A `Jenkinsfile` for CI plus GitHub Actions.
- PHPUnit tests + PSR-12 linting + CodeQL security scanning.

It worked. You could `docker compose up`, visit the site, place an order.
But it was a **demo**, not a **product**. Anyone on the internet who knew
the URL `/admin` could pretend to be the kitchen. There was no HTTPS.
Schema changes meant wiping the database. If a disk failed, you'd lose
everything. There was no legal page, no observability, no audit trail.

---

## 1. The lecturer's brief, in one sentence

> *"Follow Fig 1.1 of the SWEBOK Software Construction KA to the bone."*

**SWEBOK** = Software Engineering Body of Knowledge. It's the
profession's reference textbook. **KA** = Knowledge Area. **Fig 1.1** in
your Unit 1 PDF breaks Software Construction down into 5 branches and
~36 leaves: Fundamentals, Managing Construction, Practical
Considerations, Construction Technologies, Software Construction Tools.

"Follow it to the bone" means every leaf of that tree should be visible
somewhere in your project — in the code, in CI, or in the docs. The
original skeleton covered roughly 22 of 36 leaves. The work below
closes a chunk of the rest **and** delivers something a real restaurant
could pilot.

---

## 2. The plan — six PRs

After a gap analysis (in `docs/SHIPPING.md`), we landed on six pull
requests, in dependency order. Payments were explicitly out of scope.

| # | What                              | Why                                             |
|---|-----------------------------------|-------------------------------------------------|
| 1 | Phinx database migrations         | Schema changes without wiping production data   |
| 2 | Admin auth (sessions, bcrypt, CSRF) | Kitchen view was wide open to the internet     |
| 3 | Observability (Monolog + events + Sentry) | If something breaks, see what happened    |
| 4 | HTTPS via Caddy reverse proxy     | Stop sending session cookies in clear text      |
| 5 | Nightly mysqldump backups + RUNBOOK | Disks die; you need a recovery story          |
| 6 | Legal pages + cookie banner       | CM/EU law requires disclosure of data practices |

Plus a **post-shipping design overhaul** to bring the admin surface up
to the same polish as the customer-facing React app.

---

## 3. What is "DevOps" anyway?

Two words mashed together: *development* and *operations*. The idea is
that the same team writes the code **and** keeps it running. So you
build the operational scaffolding (deploys, monitoring, backups,
incident response) **into** the project, not bolted on later.

In practice DevOps shows up as:

- **Containers** — packaging your app with its operating system so it
  runs the same on your laptop, on CI, and on the production server.
- **Compose / orchestration** — declarative description of which
  containers to run and how they connect.
- **CI** (Continuous Integration) — every push triggers automatic
  tests, linting, security scans, and an image build.
- **CD** (Continuous Delivery/Deployment) — when CI is green, ship.
- **Migrations** — version-controlled schema changes.
- **Observability** — logs, metrics, and traces emitted by the live
  system so you can see what it's doing.
- **Reverse proxy** — the front door to your stack; handles HTTPS,
  routing, rate-limiting.
- **Backups + restore drill** — a backup you've never restored is a
  coin flip.

Every PR below adds one of these.

---

## 4. The mental model of our stack

You have **five containers** that talk to each other on a private
network called `srwa`:

```
                       Browser (you)
                            │
                            ▼  https://maisoncafu.com (or http://localhost:8090 in dev)
                       ┌─────────┐
                       │  Caddy  │  (reverse proxy, HTTPS, security headers)
                       └────┬────┘
                            │  http (internal)
                            ▼
                       ┌─────────┐
                       │  Nginx  │  (web server, static files, /admin routing)
                       └────┬────┘
                            │  FastCGI
                            ▼
   ┌────────────────────────────────────────────────────────────┐
   │   PHP-FPM (your application)                                │
   │   /api/* → JSON   /admin/* → kitchen   /legal/* → pages    │
   │   Writes events + logs                                     │
   └────────────────────────┬───────────────────────────────────┘
                            │  SQL
                            ▼
                        ┌───────┐         ┌────────┐
                        │ MySQL │ ◀────── │ Backup │  (nightly mysqldump)
                        └───────┘         └────────┘
```

Each container has one job. They start in dependency order: MySQL first
(other things need it), then the one-shot **migrate** container applies
schema changes, then PHP, then Nginx, then Caddy. The **backup**
container runs alongside.

Why containers? Because "works on my machine" used to be the entire
problem of shipping software. A container is a frozen recipe of OS +
language runtime + your code + dependencies. Same recipe on your
Windows laptop, on Linux CI, on a server in Frankfurt. No
"wait, the prod box has PHP 8.2 but I wrote this for 8.3" surprises.

**Docker** is the container runtime. **docker-compose** is a small tool
that reads the file `docker-compose.yml` and starts/stops a whole
multi-container app at once. Everything below is glued together with
those two.

---

## 5. PR 1 — Phinx database migrations

### The problem we were solving

Your original setup loaded `db/init.sql` whenever MySQL started for the
first time. That file said "create these tables, insert this seed
data." It worked for development — you can drop the database and
recreate it every minute. But in production, the `orders` table will
have real customers' orders in it. You can't just drop it whenever you
want to add a column.

**Migrations** are the answer. A migration is a small, numbered file
that says "from version N to version N+1, run this SQL." A tool keeps
a tiny table called `schema_migrations` that records which versions
have been applied. To upgrade a database: run the tool, it applies any
missing migrations in order. To roll back: tool runs the `down()`
direction.

It's git, but for your database.

### The tool: Phinx

**Phinx** is a PHP library for managing migrations. We picked it because:

- It's pure PHP, no extra framework needed.
- It can use raw SQL (`$this->execute(...)`) or a fluent API. We use
  raw SQL so the schema reads like SQL.
- Tiny: one Composer dependency.

Two ways to think about it:

- *"git for the database"* — each migration is a commit, the
  `schema_migrations` table is the equivalent of `.git/refs`.
- *"a numbered to-do list of SQL changes"* — Phinx runs each item in
  order and ticks it off when done.

### What we changed

- Added `db/phinx.php` — Phinx configuration (reads `DB_*` env vars).
- Added `db/migrations/20260521000001_initial_schema.php` — the first
  migration, which loads the SQL from `db/sql/001_initial_schema.sql`.
- Added a new compose service called `migrate`: a one-shot container
  that runs `vendor/bin/phinx migrate` and exits. The `php` service
  now waits for `migrate` to complete before starting.
- Deleted `db/init.sql`. Schema is now owned by Phinx.

### What you can do with it now

```powershell
# Add a column to admins — create a new migration:
#   db/migrations/20260601090000_add_admin_role.php
#   class AddAdminRole extends AbstractMigration { up(): ALTER TABLE admins ADD COLUMN role VARCHAR(32) ... }
# Then on every developer's machine + production:
docker compose run --rm migrate
```

Phinx looks at `schema_migrations`, sees `AddAdminRole` hasn't been
applied, runs it, records it. The next time you run `migrate`, it does
nothing because the migration is already applied.

### Mapped to Fig 1.1

- §1.3 Anticipating Change — schema changes are now versioned and
  reviewable, which is exactly what "anticipating change" is supposed
  to deliver.
- §1.5 Reuse + §3.6 Construction with Reuse — Phinx itself is an
  external library we reuse rather than building our own migration
  system.

---

## 6. PR 2 — Admin auth

### The problem

The kitchen / admin view didn't exist yet, but the **intent** in the
README was that staff would see a list of incoming orders and mark
them prepared. Without auth, that view would be world-reachable. A
prankster could log in as the kitchen and mark every order `served`.

### The concepts

Three things stack on top of each other to make a safe login system:

**1. Authentication** — "Who are you?"
The login form. Compare the submitted password to what's stored.

**2. Sessions**
HTTP is stateless — every request stands alone. To remember "this
browser is logged in", the server hands the browser a small token in
a cookie (`srwa_sid=abc...`). Every subsequent request includes that
cookie; the server looks up the matching session, sees "ah, this is
admin #1", and serves the page.

We use PHP's built-in sessions, but with hardened cookie settings:
- `HttpOnly` — JavaScript can't read it (defeats XSS-based theft).
- `SameSite=Lax` — most cross-site forms can't use it (defeats CSRF).
- `Secure` — only sent over HTTPS (set automatically when `APP_URL`
  starts with `https://`).

**3. Password hashing — bcrypt**
We *never* store passwords. We store a **bcrypt hash** — a one-way
mathematical scramble. Bcrypt is deliberately slow (cost factor 12 ≈
250ms per hash). If the database ever leaks, an attacker has to spend
~250ms per password guess. That makes brute force impractical.

`password_hash($pw, PASSWORD_BCRYPT, ['cost' => 12])` to hash.
`password_verify($input, $hash)` to check. Done.

**4. CSRF — Cross-Site Request Forgery**
A subtle attack: imagine you're signed into Maison Cafu admin in one
tab, and you visit a malicious page in another. That page can submit
a form to `https://maisoncafu.com/admin/...` while your browser
helpfully attaches the session cookie. The malicious page makes you
perform an action you didn't intend.

**Defence:** every form embeds a random token (`<input type="hidden"
name="_csrf" value="...">`) stored in your session. The malicious site
can't guess the token, so the request is rejected.

### What we changed

- Schema: migration `002_create_admins` — `admins(id, email, password_hash, name, last_login_at, created_at)`.
- Library: `app/src/Auth/Session.php`, `Password.php`, `Csrf.php`.
- Gate: `app/src/Http/AdminGuard.php` — redirects to login if no session, returns 403 on POST without valid CSRF.
- Pages: `app/public/admin/login.php`, `logout.php`, `index.php` (the kitchen view).
- Model: `app/src/Models/Admin.php` + a CLI `app/bin/create-admin.php` to seed the first admin (there's no public sign-up).
- nginx config: a new `location /admin` block that routes admin pages to PHP-FPM (not the React SPA).
- Tests: `PasswordTest` (4 tests), `CsrfTest` (4 tests).

### What's protected now

- `/admin/login.php` — public (you have to be able to reach the login form).
- `/admin/*` — anything else: gated by `AdminGuard::require()`.
- Status changes (`POST /admin/?action=update_status`) — CSRF-checked.
- Logout — POST-only with CSRF (defeats the "malicious image tag logs you out" trick).

### Mapped to Fig 1.1

- §1.6 Standards in Construction — OWASP-style auth patterns.
- §3.4.4 Defensive Programming — `hash_equals` for constant-time
  compare, bcrypt cost 12, input validation, prepared statements.
- §4.7 (partial) State-Based Construction — the `Order::transitions()`
  table is the seed of a real state machine.

---

## 7. PR 3 — Observability

### The problem

A customer calls: *"I placed an order an hour ago and it never
arrived."* You look at the kitchen view. Nothing. Did the form fail
silently? Did the DB reject it? Did PHP crash? Without
**observability**, you have no way to know — the system is a black box.

### The three streams

We split observability into three independent streams because each
answers a different question.

**Stream 1 — Logs** (Monolog) — *"What just happened?"*
Every request, every error, every notable event gets a line of JSON
written to standard output (`stdout`). Docker captures `stdout`; `docker
compose logs php` becomes a structured-log search. We use **Monolog**,
the standard PHP logging library, configured with a JSON formatter:

```json
{"message":"order.placed","level_name":"INFO","datetime":"2026-05-21T15:23:00+00:00","context":{"order_id":10,"total":5800}}
```

JSON because machines can parse it — you can ship these to ELK,
Datadog, Loki, etc.

**Stream 2 — The `events` audit table** — *"What happened last week?"*
Logs rotate and disappear. For events that *matter to the business* —
order placed, order status changed, admin signed in — we also write a
row to a permanent `events` table:

```sql
events(id, kind, actor_kind, actor_id, subject_kind, subject_id, payload JSON, ip, created_at)
```

Permanent, queryable. *"How many failed logins yesterday?"* is one
SQL query. *"Show me every action admin #3 took this month"* is
another.

**Stream 3 — Sentry** — *"What's broken right now?"*
When an uncaught exception fires, **Sentry** captures it, groups
identical errors together (so 50 instances of the same `NullPointer`
show as one issue), and notifies you. Free tier handles 5,000 events
a month — plenty for a small system.

Sentry is **opt-in**: if `SENTRY_DSN` is unset (default), the SDK is a
no-op. Set the DSN in `.env` to activate it.

### What we changed

- Schema: migration `003_create_events` — the audit table above.
- Library: `app/src/Logging/Logger.php` (Monolog singleton),
  `Events.php` (the audit-write function), `SentryInit.php`.
- Bootstrap: `app/src/bootstrap.php` — single entry point that's
  `require`d from every public PHP entrypoint.
- Wired into lifecycle moments: `Order::place()` emits `order.placed`,
  `Order::updateStatus()` emits `order.status_changed`,
  `Reservation::hold()` emits `reservation.held`, login + logout emit
  their own events.
- The router catches uncaught exceptions, logs them at ERROR level,
  forwards them to Sentry (if configured), and returns a 500.
- Tests: `LoggerTest` (3 tests).

### Read it

```powershell
docker compose logs -f php                # live stream
docker compose exec mysql mysql -uroot -p... srwa -e "SELECT * FROM events ORDER BY id DESC LIMIT 10;"
```

### Mapped to Fig 1.1

- §1.4 Constructing for Verification — observability is a form of
  runtime verification ("is the system actually behaving the way the
  tests say it should?").
- §3.4.5 Error Handling — exceptions land in three places: a 500
  response, the structured log, and (optionally) Sentry.

---

## 8. PR 4 — HTTPS via Caddy reverse proxy

### The problem

Without HTTPS, every byte between the browser and your server travels
in clear text. Including session cookies. Including form data.
Including the admin's bcrypt-checked password. Anyone on the same WiFi
network can read it — coffee shop, hotel, airport. With the session
cookie they can impersonate the admin.

HTTPS encrypts the channel. The browser and the server do a
**handshake** using **certificates** (signed bits of math that prove
the server is really `maisoncafu.com` and not a phisher's domain).
After the handshake, everything is encrypted; the WiFi snoop sees
gibberish.

Catch: certificates have to be issued by a trusted authority and
renewed every 90 days.

### The tool: Caddy

**Caddy** is a web server with one killer feature for our purposes:
**automatic HTTPS via Let's Encrypt** (a free certificate authority).
You tell Caddy your domain. Caddy fetches the cert, renews it 30 days
before expiry, redirects HTTP to HTTPS — all without configuration.

We slid Caddy in front of nginx as a **reverse proxy**. The browser
hits Caddy; Caddy decrypts HTTPS and forwards a plain HTTP request
to nginx on the internal network; nginx serves static files or
forwards PHP requests to php-fpm; the response travels back through
Caddy where it gets encrypted again. The browser never sees nginx.

### What we changed

- Added `docker/caddy/Caddyfile` — the entire config:
  - Dev (`SITE_ADDRESS` unset): listen on `:80`, no TLS.
  - Prod (`SITE_ADDRESS=cafu.example.com`): auto-issue Let's Encrypt
    cert, listen on 443, redirect 80→443.
  - Always: add `Strict-Transport-Security` (HSTS), `X-Content-Type-Options`,
    `Referrer-Policy` headers; strip the `Server` banner.
- Added `caddy` service in `docker-compose.yml`. Holds host ports
  `8090:80` + `8493:443`.
- Nginx no longer publishes a host port — it's now internal-only.
- `caddy_data` + `caddy_config` named volumes preserve certs across
  restarts.

### Going to production

Set in `.env` on the prod host:

```
SITE_ADDRESS=cafu.example.com
CADDY_EMAIL=admin@cafu.example.com
APP_URL=https://cafu.example.com
```

…and map Caddy's host ports to `80:80` + `443:443`. First request
triggers Let's Encrypt; cert is in place within a minute.

### Mapped to Fig 1.1

- §3.4.12 Distributed Software — Caddy is a new tier in our distributed
  architecture, talking to nginx over a Docker network.
- §1.6 Standards — HSTS, X-Content-Type-Options, Let's Encrypt are
  external standards we adopted.

---

## 9. PR 5 — Backups + RUNBOOK

### The problem

Disks die. People run `DROP TABLE` at 2 a.m. A bad deploy corrupts
data. Without backups, you've lost everything since the system was
built.

### The tools

**`mysqldump`** — the standard MySQL utility for dumping a whole
database to a single `.sql` file. Important flag: `--single-transaction`
makes it use a consistent snapshot via REPEATABLE READ isolation, so
the dump is consistent without locking the tables.

**`cron`** — the Unix scheduler. A "crontab" is a file of lines
saying "at this time, run this command." We schedule `0 2 * * *`
which means "minute 0 of hour 2, every day, every month, every weekday"
— i.e. 02:00 every night.

**Docker named volumes** — persistent storage that lives outside any
container. `srwa_backups` survives container rebuilds. If a container
dies, the data stays.

### The shape we built

A new sidecar container (`srwa-backup`):

- Image: `mysql:8.4` (gives us the real MySQL client, which can
  authenticate against MySQL 8's `caching_sha2_password`) plus `cronie`
  from the Oracle Linux repos.
- On boot: takes one immediate backup (so the volume is never empty),
  then starts `crond` in the foreground.
- Cron schedule: `0 2 * * *` runs `/usr/local/bin/backup.sh`.
- `backup.sh` dumps the DB to `/backups/srwa-<UTC-TIMESTAMP>.sql.gz`,
  then prunes anything older than 7 days.

### And the runbook

A backup you've never restored is a coin flip. So we wrote
`docs/RUNBOOK.md` with numbered steps for:

- List existing backups
- Take an ad-hoc backup
- Restore from a backup (with a "take a safety dump first" warning)
- Recreate the admin user after a destructive restore
- Weekly verify procedure (restore into a parallel compose project)
- Disaster note: the named volume is on the same host as the
  database. Off-host upload is flagged as a gap (production should add
  S3-compatible upload).

### Mapped to Fig 1.1

- §1.3 Anticipating Change — data loss is the most absolute form of
  change you can anticipate.
- §2.2.4 Preventive Change — backups don't fix bugs; they prevent
  irreversible loss.

---

## 10. PR 6 — Legal pages + cookie banner

### The problem

The moment your site collects a phone number, you're processing
**personal data**. In Cameroon (Law No. 2010/012 on cybersecurity) and
the EU (GDPR), you have legal duties to:

- Tell users what data you collect and why
- Explain who you share it with
- Disclose cookies / similar storage
- Provide a way for users to request deletion

The skeleton had **none** of this.

### What we added

**Three legal pages** under `/legal/*`, server-rendered PHP with the
Maison Cafu styling:

- `/legal/privacy` — what we collect (name, phone, order history,
  audit log, IP), why (contract, legitimate interest), retention
  (orders 2y, audit 1y), who we share with (hosting provider, Sentry,
  legal process), user rights, security posture.
- `/legal/terms` — orders, reservations, acceptable use, IP, liability,
  Cameroon governing law.
- `/legal/cookies` — enumerates the two storage items: the `srwa_sid`
  session cookie (strictly necessary) and the `cafu_cookie_consent`
  localStorage key (functional). Explicitly states "no third-party
  trackers."

Each page is marked **"Draft — pending counsel review"**. A real lawyer
needs to look at the language before you go live.

**A cookie banner** (React) — slides up from bottom-right on the first
visit. Checks `localStorage['cafu_cookie_consent']`; if not set, shows
the banner; on "Got it", writes the key and slides away. Stays away on
subsequent visits.

**Footer links** — added Privacy / Terms / Cookie-notice links to the
existing footer.

**nginx route** — new `location /legal` block that lets you use pretty
URLs (`/legal/privacy` resolves to `legal/privacy.php`).

### Mapped to Fig 1.1

- §1.6 Standards in Construction — compliance is a form of external
  standards (Cameroon Law 2010/012, GDPR).
- §2.2.3 Perfective Change — improves the product without altering
  function.

---

## 11. The design overhaul

After all six PRs landed, the admin surface still looked utilitarian
next to the polished React front-end. We did one more pass:

- Wrote `app/public/admin/admin.css` — a full design system mirroring
  the front-end's tokens: same warm-dark palette (`hsl(24 9% 6%)` base,
  warm orange-amber `hsl(25 75% 53%)` accent), same fonts (Fraunces
  variable serif for display, Geist for body, Geist Mono for labels),
  same radial gradient + noise overlay on the body.
- Wrote `_layout.php` partial with `admin_head()`, `admin_topbar()`,
  `admin_close()` helpers and the `admin_ago()` / `admin_money_xaf()`
  formatters.
- Rewrote both admin pages against the new system:
  - Login: centred card with the circle-M logo, "Staff sign in"
    eyebrow, focus-glow on inputs in amber, primary CTA in the brand
    orange.
  - Kitchen: sticky glass topbar with the brand on the left and admin
    name + sign-out on the right; "Kitchen" eyebrow with the
    horizontal-line rule; serif display heading *"Live orders."* with
    the italic accent in amber; pill filter tabs (All / Pending /
    Confirmed / Preparing / Served / Cancelled) with live counts; order
    rows as rounded cards with reference (mono tabular), total in XAF,
    status pill with dot indicator, customer + relative time, action
    buttons (primary amber for forward transitions, ghost for cancel);
    empty-state with the M logo for when a filter has no matches.
- Added reduced-motion + mobile-responsive breakpoints.

The admin surface now reads like an extension of the customer-facing
brand, not a separate utility.

---

## 12. The boot chain

When you run `docker compose up -d`, this is what happens:

```
1. Docker builds any images that changed (php, backup if their
   Dockerfiles or build context changed).
2. Docker pulls any external images that aren't local (mysql:8.4,
   nginx:1.27-alpine, caddy:2.8-alpine, node:20-alpine).
3. Containers start in dependency order:

   mysql       starts immediately, takes ~30-60s to be ready
     │
     │  (healthcheck passes: `mysqladmin ping -h 127.0.0.1 -uroot -p...`)
     ▼
   migrate     one-shot, runs `phinx migrate`, exits with code 0
   backup      starts (parallel to migrate)
     │
     ▼
   web_build   one-shot, runs `npm install && npm run build`,
               writes dist/ to a host bind-mount, exits
     │
     ▼
   php         starts php-fpm
     │
     ▼
   nginx       starts, opens port 80 on the internal network
     │
     ▼
   caddy       starts, opens port 80 + 443 on the host
```

Once everything is up, browsing to `http://localhost:8090` hits Caddy.
Caddy forwards to nginx. Nginx either serves a static file from `dist/`
(the React app) or forwards a PHP request to php-fpm. PHP-FPM reads/writes
MySQL, optionally writes events + logs.

---

## 13. Everyday workflow — "I want to add a feature"

Say you want to add a new admin permission level (so a "waiter" admin
can see orders but not change them).

1. **Branch off main:** `git checkout -b feature/admin-role`
2. **Write a migration:** new file
   `db/migrations/20260601090000_add_admin_role.php`, class
   `AddAdminRole`, `up()` adds a `role ENUM('owner','manager','waiter')
   NOT NULL DEFAULT 'manager'` column to `admins`, `down()` drops it.
3. **Apply locally:** `docker compose run --rm migrate`.
4. **Code the feature:** update `Models\Admin::findByEmail()` to also
   return the role, update `AdminGuard` to optionally check role,
   etc.
5. **Test:** `docker compose exec php composer test` — add a new
   `AdminRoleTest`.
6. **Lint:** `docker compose exec php composer lint`.
7. **Commit:** `git commit`.
8. **Push:** `git push origin feature/admin-role`.
9. **CI runs:** Jenkins and/or GitHub Actions does lint → unit tests
   → build image → integration smoke (boots the whole stack via
   compose, runs migrations, hits `/healthz`). All green or it
   blocks merge.
10. **Review + merge.**
11. **Deploy:** on the prod host, `git pull && docker compose up -d
    --build`. The `migrate` service runs the new migration. PHP picks
    up the new code. Zero downtime if you've got two replicas; tens
    of seconds of downtime if you don't.

Notice that **every step is the same as before this work was done** —
except now there *is* a "step 10. CI runs" that's automatic, a
deterministic deploy step, and migrations that don't wipe data.

---

## 14. DevOps glossary

One-line definitions of every tool/term used above, in alphabetical
order.

- **bcrypt** — a deliberately slow password-hashing function. Cost
  factor 12 ≈ 250 ms per hash.
- **Caddy** — a web server with automatic HTTPS via Let's Encrypt.
  We use it as the reverse proxy in front of nginx.
- **CI** (Continuous Integration) — every push triggers automated
  tests + linting + a build. We use Jenkins + GitHub Actions.
- **CodeQL** — GitHub's static security scanner. Runs weekly.
- **Compose** (docker-compose) — declarative orchestration of
  multi-container apps.
- **Composer** — PHP's package manager. Like `npm` for JavaScript or
  `pip` for Python.
- **cron** — Unix scheduler. `0 2 * * *` = "minute 0, hour 2, every
  day".
- **CSRF** (Cross-Site Request Forgery) — attack where a malicious
  site submits a form to your site using the victim's session.
  Defence: synchronizer token in every form.
- **Docker** — container runtime. A container is an isolated mini-OS
  that wraps your app + deps.
- **Dockerfile** — recipe for building a container image.
- **FastCGI** — the protocol nginx uses to talk to php-fpm.
- **Geist / Geist Mono / Fraunces** — the three fonts used by the
  brand. Loaded from Google Fonts.
- **GitHub Actions** — GitHub's built-in CI. We use it as a co-pilot
  to Jenkins.
- **HSTS** (HTTP Strict Transport Security) — header that tells
  browsers "always use HTTPS for my domain for the next year."
- **HTTPS** — HTTP wrapped in encryption. Defends against
  network-level snooping.
- **Jenkins** — the original CI server, runs on a Java VM. Defined by
  the `Jenkinsfile` in the repo.
- **JSON Web Tokens** — *not* what we use. We use server-side
  sessions, which are simpler and more revocable.
- **Let's Encrypt** — free certificate authority. Caddy uses it
  automatically.
- **Monolog** — PHP's standard logging library. We configure it to
  emit JSON to stdout.
- **mysqldump** — MySQL's official tool for dumping a database to SQL.
- **named volume** — Docker storage that lives outside any single
  container. Survives `docker compose down` (but not `down -v`).
- **nginx** — the web server that fronts php-fpm and serves static
  files. Lives behind Caddy in our stack.
- **OWASP** (Open Worldwide Application Security Project) — the
  industry reference for application security. The Top 10 list informs
  our auth + input-handling patterns.
- **PHP-FPM** (FastCGI Process Manager) — the PHP runtime that nginx
  talks to.
- **Phinx** — the PHP migrations library we use.
- **PHPUnit** — PHP's standard unit-test framework.
- **PSR-12** — the PHP community's coding-style standard. Enforced
  via `phpcs`.
- **Reverse proxy** — a server that sits in front of your real
  servers and routes incoming traffic to them. Caddy + nginx are
  both reverse proxies in our stack.
- **Sentry** — error-tracking service. Catches exceptions, groups
  them, notifies you.
- **session cookie** — small token stored in the browser that
  identifies a logged-in user across requests.
- **SPA** (Single-Page Application) — your customer-facing site. One
  HTML page; routing and rendering happens in JavaScript (React via
  Vite).
- **stdout / stderr** — standard output and error streams. Docker
  captures both, so writing to them is "writing to logs."
- **SWEBOK** — the Software Engineering Body of Knowledge. The
  lecturer's reference textbook.
- **try_files** — nginx directive that tries multiple file paths in
  order and serves the first match. Used to map pretty URLs.
- **Vite** — fast build tool for the React app. Compiles `.tsx` to
  optimised JS bundles under `dist/`.

---

## 15. Gotchas accumulated (lessons learned)

We hit each of these and recorded them — they will save you (and
future-you) hours next time:

- MySQL healthcheck must use `-h 127.0.0.1` not `localhost`. The unix
  socket says "healthy" before the TCP listener is up, so downstream
  services try to connect over TCP too early.
- After `composer.json` or `Dockerfile` dependency changes, the named
  `app_vendor` volume caches the old `vendor/`. Use `docker compose
  down -v` to nuke it.
- PowerShell eats empty `""` argument tokens. `--entrypoint ""` becomes
  `--entrypoint` followed by the next arg. Use `--entrypoint=''`.
- PowerShell line continuation: end every line except the last with a
  backtick `` ` `` — without it, PowerShell runs lines separately and
  you get "command not found" on the second line.
- `session_start()` in PHPUnit (CLI) emits a "headers already sent"
  warning that fails the test run because `failOnWarning="true"`. We
  short-circuit `Session::start()` with `if (PHP_SAPI === 'cli')`.
- Alpine's `mysql-client` is actually MariaDB-client. It can't
  authenticate against MySQL 8's `caching_sha2_password`. The backup
  sidecar uses `mysql:8.4` (Oracle Linux 9 based) + `microdnf install
  -y cronie`.
- Recreating the `php` container (during any rebuild) gives it a new
  IP, but nginx's resolver keeps the old one cached. Symptom: 502s.
  Fix: `docker compose restart nginx`.
- Git Bash mangles single-slash docker exec paths (`/backups` →
  `C:/Program Files/Git/backups`). Use `//backups` to escape.
- Vite's `.vite/` transform cache lives inside `node_modules`, which
  is on a named volume. New `.tsx` files can silently fail to land
  in the bundle until you clear the cache: `rm -rf
  /web/node_modules/.vite /web/dist/* && npm run build`.
- A Composer script named `status` silently shadows the built-in
  `composer status` command and emits a warning every run. Renamed
  to `migrate-info`.

These all live in your repo's `docs/SHIPPING.md`, `docs/RUNBOOK.md`,
and in the Claude memory at `C:\Users\DELL\.claude\projects\F--Code-Bases-cafu\memory\`.

---

## 16. What's still in the gap

The "real engineering" leaves of Fig 1.1 we haven't done — flagged
explicitly so the gap is visible at defence time:

- **§4.7 State-Based Construction** — `Order::transitions()` is a
  flat array, not a formal state machine. A library like
  `winzou/state-machine` would make the transitions declarative.
- **§4.8 Internationalization** — UI is English-only. A real Douala
  restaurant probably wants FR + EN.
- **§4.9 Grammar-Based Input Processing** — input validation is
  ad-hoc (`trim`, `filter_var`). A schema validator (e.g.
  `rakit/validation`) would be cleaner.
- **§4.10 Concurrency Primitives** — two customers ordering the
  last item could double-allocate. Row-level locks + careful
  transaction ordering would solve this; we haven't written it.
- **§4.14 Performance Analysis** — no profiling, no load test, no
  slow-query log. We don't know what falls over at 1k orders/hour.
- **§5.4 Profiling / Slicing Tools** — no Xdebug profile artefacts.

And the "shipping" gaps:

- **Off-host backup storage** — `srwa_backups` is on the same disk as
  MySQL. Production needs S3-compatible upload.
- **Production deployment** — the system *can* deploy (registry +
  prod compose), but you haven't actually shipped it to a VPS yet.
- **Customer accounts** — guest checkout only. Loyalty / order
  history would need a customer auth layer.
- **Payments** — explicitly out of scope. Cash, mobile money, card
  in person.
- **Search-engine optimisation** — `robots.txt`, sitemap, OpenGraph
  tags on legal pages — none of it done.

None of these are blockers for course defence. All of them are
**legitimate "future work"** bullets.

---

## 17. Where to look next

For the panel defence:

- `docs/SHIPPING.md` — the per-PR detailed log
- `docs/RUNBOOK.md` — the operational procedures
- `docs/ARCHITECTURE.md` — the high-level architecture
- `docs/lecture-mapping.md` — the lecture-to-artefact crossreference
- `docs/JOURNEY.md` — this file

For learning more about each tool:

- Phinx: <https://book.cakephp.org/phinx/0.16/en/index.html>
- Caddy: <https://caddyserver.com/docs/>
- Monolog: <https://seldaek.github.io/monolog/>
- Sentry PHP: <https://docs.sentry.io/platforms/php/>
- MySQL's `mysqldump`: <https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html>
- OWASP cheat sheets (CSRF, session, password): <https://cheatsheetseries.owasp.org/>
- SWEBOK v4 (the source of Fig 1.1): <https://www.computer.org/education/bodies-of-knowledge/software-engineering>

---

You shipped a real system. Enjoy the defence.
