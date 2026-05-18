# DevOps — How the pieces fit and how they map back to the lectures

The proposal calls out four tools: **Git, GitHub, Jenkins, Docker**. Below is
how each is wired into the project, what it's actually buying us, and which
lecture chapter justifies it.

## 1. Git — local version control

| What                | Where                                                   |
| ------------------- | ------------------------------------------------------- |
| Ignore rules        | `.gitignore`                                            |
| Branching contract  | `CONTRIBUTING.md` — `main`, `feat/*`, `fix/*`, `chore/*` |
| Commit format       | `<type>: <imperative>` + `Refs: #<issue>`                |
| EOL / charset       | `.editorconfig` — LF, UTF-8, final newline               |

**Why** — Unit 1 §1.3 calls out configuration management as a first-class
concern: "the management of changing software products is called configuration
management." Without a clear branching and commit contract, the lecture's
§1.3.1 cost drivers (team stability, program age) compound fast.

## 2. GitHub — collaboration surface

| What                | Where                                                |
| ------------------- | ---------------------------------------------------- |
| PR template         | `.github/pull_request_template.md`                   |
| Issue templates     | `.github/ISSUE_TEMPLATE/{bug_report,feature_request}.md` |
| CI                  | `.github/workflows/ci.yml`                           |
| Security scanning   | `.github/workflows/codeql.yml` (weekly + on push)    |

The PR template forces the author to declare which **maintenance category**
(Unit 2 §2.2) the change belongs to. That single checkbox protects against the
"this is a 2-line fix that secretly touches three subsystems" failure mode.

## 3. Jenkins — primary CI as required by the proposal

`Jenkinsfile` declares the pipeline. Stages, in order:

1. **Checkout** — pulls the branch, captures the head commit message.
2. **Install deps** — runs `composer install` inside the official `composer:2.7`
   image so the agent stays stateless.
3. **Static analysis (parallel)**
   - `php -l` syntax lint over every PHP file (Unit 1 §1.4.8 — inspections find
     defects without execution).
   - `phpcs --standard=phpcs.xml` against PSR-12. Output published as a
     checkstyle report; the Warnings NG plugin lights it up in the build UI.
4. **Unit tests** — PHPUnit, JUnit XML for the test results dashboard, Cobertura
   XML for coverage.
5. **Build image** — `docker build` with two tags: `srwa/php:build-<n>` and
   `srwa/php:latest`.
6. **Integration smoke** — brings the whole compose stack up, polls
   `/healthz`, hits `/api/menu`, then tears down with `-v`. This is dynamic V&V
   per Unit 1 §1.4.3.
7. **Deploy** — gated to `main`. Pushes the build-tagged image (real registry
   credentials would live in Jenkins' credentials store).

`docker/jenkins/docker-compose.ci.yml` is a compose overlay that strips out
phpMyAdmin and source-mounted volumes so the CI run is bit-for-bit deterministic.

### Recommended Jenkins setup

- Plugins: `pipeline`, `docker-workflow`, `warnings-ng`, `junit`, `cobertura`,
  `ansicolor`, `timestamper`.
- Credentials: `srwa-registry` (username + token).
- Trigger: GitHub webhook → "GitHub hook trigger for GITScm polling".

## 4. Docker — reproducible runtime

| Artefact                            | Purpose                                              |
| ----------------------------------- | ---------------------------------------------------- |
| `Dockerfile`                        | Two-stage build: `composer` install → `php-fpm-alpine` runtime; runs as non-root `srwa:srwa` |
| `docker-compose.yml`                | Local dev stack: nginx + php + mysql, optional phpMyAdmin under the `dev` profile |
| `docker/nginx/default.conf`         | nginx config with hardened headers, FastCGI to `php:9000`, long cache on static assets |
| `docker/php/php.ini`, `opcache.ini` | hardened php.ini; OPcache + JIT on for prod-like perf |
| `docker/jenkins/docker-compose.ci.yml` | CI-only overlay                                  |
| `.dockerignore`                     | Keeps build context tiny — no `.git`, no PDFs, no vendor |

**Why** — Unit 3 §3.4.12 treats deployable artefacts as the unit of distributed
software construction. Containerising the *whole* stack (not just the app)
removes the "works on my MySQL but not theirs" class of bug entirely.

## 5. Modern co-pilots

The lecture is from 2025/2026 and explicitly calls out (Unit 3 §3.4) that the
landscape has moved toward platforms. We honour that by running the same checks
in GitHub Actions:

- `ci.yml` — PHP setup → composer → lint → phpcs → phpunit → docker build → smoke.
- `codeql.yml` — weekly + on-push CodeQL scan for the JS and Python.

The two pipelines deliberately overlap. If one breaks, the other still gives
signal — protection against the lecture's §1.3.1 "single point of process
failure" worry.

## 6. Quality gates summary

Lecture mapping for the gates:

| Gate                          | Lecture reference                            |
| ----------------------------- | -------------------------------------------- |
| PSR-12 style check            | Unit 1 §1.6 (Standards in construction)      |
| `php -l` syntax lint          | Unit 1 §1.4.3 (Static verification)          |
| PHPUnit unit tests            | Unit 3 §3.3.4 (Construction testing)         |
| Integration smoke             | Unit 3 §3.3.8 (Integration — incremental)    |
| Docker build / image          | Unit 3 §3.4.12 (Distributed software)        |
| CodeQL                        | Unit 3 §3.3.7 (Construction quality)         |
| PR template w/ maintenance category | Unit 2 §2.2 (Concepts and principles)  |

## 7. Day-2 ops cheat sheet

```bash
# Run everything locally
cp .env.example .env && docker compose up -d --build

# Re-run the recommender batch
docker compose exec php php -r "echo 'restart sql query';"  # or:
docker compose run --rm \
  -e DB_HOST=mysql -e DB_USER=srwa -e DB_PASS=srwa_dev_password \
  --entrypoint sh \
  python:3.12-alpine -c "pip install pymysql && python /ml/recommend.py --host mysql --db srwa --user srwa --password srwa_dev_password --out /ml/pairings.json"

# Tail logs
docker compose logs -f php nginx

# Tests in CI parity
docker compose run --rm php composer test

# Tear down (keep volumes)
docker compose down
# Tear down everything (lose DB)
docker compose down -v
```
