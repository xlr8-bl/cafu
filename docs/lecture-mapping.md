# Lecture → Repo mapping

A direct cross-reference between **CEC418 Units 1–3** and this repository.
Use it during the project defence to point a panel at concrete artefacts.

## Unit 1 — Software Construction Fundamentals

| Lecture concept                                | Artefact                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| §1.2 Minimising complexity                     | Routines under ~100 LOC, single-responsibility models, no framework      |
| §1.2.6 Cyclomatic complexity                   | Branchless helpers (`Customer::normalizePhone`, `Order::generateReference`) |
| §1.3 Anticipating change                       | Layered architecture (see `docs/ARCHITECTURE.md`)                        |
| §1.3.1 Maintenance types                       | Issue + PR templates explicitly ask which type                           |
| §1.4 Constructing for verification             | PHPUnit suites + `/healthz` endpoint + Monolog JSON logs + `events` audit table |
| §1.4.1 Verification vs validation              | Linter + `php -l` = verification; integration smoke = validation         |
| §1.4.3 Static vs dynamic V&V                   | Jenkins parallel "Static analysis" stage + dynamic "Integration smoke"   |
| §1.4.7 V&V planning                            | `Jenkinsfile` is the test plan                                           |
| §1.4.8 Software inspections                    | GitHub PR review required + CodeQL automated inspection                  |
| §1.5 Reuse                                     | PSR-4 autoload + Docker base images + Composer / pip pins + Phinx (db migrations) |
| §1.6 Standards in construction                 | PSR-12 (`phpcs.xml`) + `.editorconfig` + commit format in `CONTRIBUTING.md` + OWASP auth/CSRF patterns in `src/Auth/` |

## Unit 2 — Software Evolution

| Lecture concept                                | Artefact                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| §2.2.1 Corrective change                       | `:bug` issue template, regression test guidance in `CONTRIBUTING.md`     |
| §2.2.2 Adaptive change                         | `.env.example` + version-pinned Docker images = env decoupling           |
| §2.2.3 Perfective change                       | Feature request template + legal pages (Cameroon Law 2010/012 / GDPR compliance) |
| §2.2.4 Preventive change                       | `chore/*` branches, `phpcs`, CodeQL, nightly mysqldump backup sidecar    |
| §2.4 SPE classification (E-type)               | The app *mechanises a human activity* — by definition evolutionary; CI catches drift |
| §2.7 Software system evolution                 | Versioned images (`srwa/php:build-N`); rollback = redeploy older tag     |
| §2.8 Application evolution in its domain       | Recommender adapts as the order log grows (no model retraining required) |

## Unit 3 — Construction Management, Techniques, Tools

| Lecture concept                                | Artefact                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| §3.2.1 Construction lifecycle                  | Trunk-based on `main`, short-lived feature branches                      |
| §3.2.3 Construction measurement                | PHPUnit test count, phpcs warning count, Jenkins build duration          |
| §3.3.1 Construction design                     | Small components, low fan-out, models behind a thin HTTP router          |
| §3.3.2 Construction languages                  | PHP 8.3 (typed), SQL DDL, vanilla JS — each used where it's strongest    |
| §3.3.3 Coding considerations                   | <=7 method params, ≤3 nesting levels, named consts (`CART_KEY` etc.)     |
| §3.3.4 Construction testing                    | Unit + integration smoke in CI                                           |
| §3.3.5 Construction for reuse                  | `Customer::upsert()` extracted out of Order/Reservation                  |
| §3.3.7 Construction quality (defect detection) | Reviews + tests + CodeQL stacked → > 90% per Extreme Programming combo   |
| §3.3.8 Integration                             | Incremental (Docker compose brings services up one at a time)            |
| §3.4.1 API design                              | Stable JSON shape, status codes (201, 422, 404, 500)                     |
| §3.4.4 Defensive programming                   | `JSON_THROW_ON_ERROR`, prepared statements, input validation, `hash_equals` CSRF compare, bcrypt cost 12 |
| §3.4.5 Error handling                          | Try / catch in router maps `InvalidArgumentException` → 422; uncaught → 500 + Monolog `error` + Sentry capture |
| §3.4.12 Distributed software                   | Caddy + nginx + php-fpm + mysql in separate containers, talking over the bridge |
| §3.4.16 Test-first programming                 | `OrderTest::testReferenceLengthAndAlphabet` was written before the impl  |
| §3.8 Software construction tools               | Git, GitHub, Jenkins, Docker, PHPUnit, PHPCS, CodeQL                     |
