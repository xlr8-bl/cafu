# Contributing

This is a course project but the workflow is real: assume a maintainer is reading
your change months from now. The lecture (Unit 1 §1.3.1) calls out *team stability*
and *program age* as the two biggest cost drivers in maintenance — small, well-
described commits are how we fight both.

## Branching

- `main` — always green, deployable.
- `feat/<short-slug>` — new perfective change.
- `fix/<short-slug>` — corrective change tied to an issue.
- `chore/<short-slug>` — preventive / housekeeping.

Open a PR against `main`. CI must be green; one reviewer approval; squash-merge.

## Commit messages

```
<type>: <imperative summary, <= 72 chars>

<optional body — why, not what>

Refs: #<issue>
```

`type` ∈ `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `ops`.

## Local checks before pushing

```bash
cd app
composer install
composer lint
composer test
```

Or, fully containerised:

```bash
docker compose run --rm php composer test
```

## Code style

- PSR-12 (enforced by `phpcs.xml`).
- `declare(strict_types=1);` at the top of every PHP file.
- Functions/methods stay under ~50 lines (Unit 3 §3.3.3 — routines under ~143 LOC, error rate doubles past that).
- No emoji icons. SVG only (UI/UX Pro Max §4 `no-emoji-icons`).
- Animations: see `docs/ARCHITECTURE.md#animation-rules`.

## Tests

- New behaviour comes with a unit test (Unit 1 §1.4 — *construct for verification*).
- Bug fixes start with a failing regression test (Unit 1 §1.4.6 — debug then re-test).
- PHPUnit tests live in `app/tests/Unit`. Mirror the namespace of the SUT.

## Reporting bugs / asking for features

Use the issue templates. They map to the four maintenance categories from Unit 2
§2.2 (corrective / adaptive / perfective / preventive).
