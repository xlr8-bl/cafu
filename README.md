# Smart Restaurant Web App (SRWA)

Course project for **CEC418 — Software Construction & Evolution**. Customers browse
the menu, place orders, and hold a table; the kitchen sees them on an admin
view; a simple market-basket recommender surfaces frequent pairings.

This repo is structured around the four DevOps tools called out in the proposal —
**Git, GitHub, Jenkins, Docker** — plus modern equivalents (GitHub Actions,
PHPUnit, PSR-12, CodeQL) so the project survives evolution past the course.

## Stack

| Layer        | Choice                                  | Why                                            |
| ------------ | --------------------------------------- | ---------------------------------------------- |
| Frontend     | HTML + CSS + vanilla ES modules         | Matches the proposal; no framework debt        |
| Type / icons | Geist (sans+mono), inline SVG           | No emoji icons; no `Inter` slop                |
| Backend      | PHP 8.3 (PSR-12, strict types, PDO)     | Matches the proposal; modern PHP               |
| DB           | MySQL 8.4                               | Matches the proposal                           |
| ML           | Python 3 (`pymysql`) — apriori pairings | "Simple data mining" per the proposal          |
| Web server   | nginx 1.27 + php-fpm                    | Decoupled, scales horizontally                 |
| Container    | Docker + docker compose                 | Reproducible "works on my machine" elimination |
| CI           | Jenkins (primary) + GitHub Actions      | Proposal asks for Jenkins; GHA is the modern co-pilot |
| Tests        | PHPUnit 11                              | Constructs for verification (Unit 1 §1.4)      |
| Style        | PHP_CodeSniffer (PSR-12), EditorConfig  | Standards in construction (Unit 1 §1.6)        |

## Quick start

```bash
cp .env.example .env
docker compose up -d --build        # builds image, brings stack up
# Optional: also run phpMyAdmin
docker compose --profile dev up -d phpmyadmin
```

- App:        http://localhost:8080
- Health:     http://localhost:8080/healthz
- API:        http://localhost:8080/api/menu
- phpMyAdmin: http://localhost:8081 (only with the `dev` profile)

To run tests outside Docker:

```bash
cd app && composer install
composer test
composer lint
```

## Project layout

```
.
├── app/                  PHP app (PSR-4 under Srwa\)
│   ├── public/           web root (index.php, /api, /assets, /views)
│   ├── src/              Models, Http helpers, Database
│   ├── tests/            PHPUnit suites
│   ├── composer.json
│   └── phpunit.xml
├── db/
│   ├── init.sql          schema
│   └── seed.sql          realistic seed data
├── docker/               nginx + php-fpm configs, Jenkins CI compose overlay
├── ml/                   Python recommender (offline batch)
├── docs/                 ARCHITECTURE.md + DEVOPS.md (lecture mapping)
├── .github/              workflows + PR / issue templates
├── docker-compose.yml
├── Dockerfile
├── Jenkinsfile
├── phpcs.xml
└── README.md
```

## What's implemented

- **Menu page** with category tabs, skeleton loaders, modern type and motion
- **Cart drawer** with localStorage persistence, qty steppers, scale-on-press feedback
- **Order placement** API (`POST /api/orders`) — transactional, validates availability
- **Reservation form** (`POST /api/reservations`) — future-date validation, 1–20 party size
- **Recommendations** (`GET /api/recommend`, `POST /api/recommend`) — market-basket lift
- **Health endpoint** (`/healthz`) used by every smoke test
- **CI pipelines** — lint → style → unit → docker build → integration smoke

## DevOps pipeline (high level)

```
git push  ──▶  GitHub Actions ──▶  PSR-12 + PHPUnit + docker build + healthz smoke
              │
              └──▶  CodeQL weekly
                                                                                        
Jenkins poll ──▶  install ──▶  lint+style (parallel) ──▶  unit ──▶  build image
                                                                ──▶  integration smoke
                                                                ──▶  (main) deploy
```

See [`docs/DEVOPS.md`](docs/DEVOPS.md) for how each piece maps back to the lecture
chapters on V&V, maintenance, evolution, reuse, and standards.

## Maintenance posture

The lecture (Unit 1 §1.3) names four maintenance types — this repo plans for all of them:

| Type        | Where it lives                                                      |
| ----------- | ------------------------------------------------------------------- |
| Corrective  | Bug report template + `:bug` label + CI catches regressions early   |
| Adaptive    | `.env.example` + Docker images pinned to versions; PHP/MySQL upgradable independently |
| Perfective  | Feature request template + association in PR template               |
| Preventive  | PSR-12 + PHPUnit + CodeQL; offline ML batch isolated from runtime   |

## Licence

MIT — see [`LICENSE`](LICENSE).
