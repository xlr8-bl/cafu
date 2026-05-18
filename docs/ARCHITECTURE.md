# Architecture

```
            ┌──────────────────────────────────────────┐
            │                  browser                 │
            └────────────────┬─────────────────────────┘
                             │ HTML / fetch (JSON)
                             ▼
   ┌─────────────────────────────────────────────────────┐
   │   nginx :80                                         │
   │   - serves /var/www/html/public/*.{css,js,svg,png}  │
   │   - proxies *.php to php-fpm:9000                   │
   └────────────────┬────────────────────────────────────┘
                    │ fastcgi
                    ▼
   ┌─────────────────────────────────────────────────────┐
   │   php-fpm 8.3                                       │
   │   public/index.php  ──▶  /api  (Json + Models)      │
   │                          └─▶  views/shell.php       │
   │   src/                                              │
   │     Database.php  (PDO singleton)                   │
   │     Http/Json.php                                   │
   │     Models/{MenuItem,Order,Reservation,             │
   │              Customer,Recommendation}.php           │
   └────────────────┬────────────────────────────────────┘
                    │ PDO (utf8mb4, prepared)
                    ▼
   ┌─────────────────────────────────────────────────────┐
   │   MySQL 8.4                                         │
   │   menu_categories, menu_items, customers,           │
   │   orders, order_items, reservations                 │
   └─────────────────────────────────────────────────────┘
                    ▲
                    │ nightly batch
                    │
   ┌─────────────────────────────────────────────────────┐
   │   ml/recommend.py — apriori pairings → JSON cache   │
   └─────────────────────────────────────────────────────┘
```

## Layered distribution

Mirrors the layered model from Unit 1 §1.3.2:

| Layer                       | Implementation                                           |
| --------------------------- | -------------------------------------------------------- |
| Presentation                | `public/views/shell.php` + `assets/js/app.js`            |
| Data validation             | Browser HTML5 + `src/Http/Json.php` + model invariants   |
| Interaction control         | `app.js` (cart drawer state, tab selection)              |
| Application services        | `public/api/router.php` + `src/Models/*`                 |
| Database                    | `src/Database.php` + `db/init.sql`                       |

Each layer can be replaced without touching its neighbours — a direct application
of the "anticipating change" principle from Unit 1 §1.3. If the team later swaps
nginx + php-fpm for a Caddy + RoadRunner stack, the only file that changes is
`Dockerfile`.

## Domain model

```
menu_categories  1───*  menu_items  *───1  order_items  *───1  orders  *───1  customers
                                                                            \
                                                                             *───1 reservations
```

Items carry tags (`JSON`), are gated by `is_available`, and price is stored in
`*_cents` to avoid floating-point. Orders carry a 10-character ambiguity-safe
reference (no `0/O`, `1/I`) generated in `Order::generateReference()` — covered
by a unit test.

## Recommendation engine

Two paths, same shape:

1. **Live** — `Recommendation::forBasket($basket)` runs a single CTE against
   `order_items` and returns the top-4 items ranked by **lift** (`P(B|A)/P(B)`).
   Fast enough for a few hundred orders.

2. **Offline** — `ml/recommend.py` walks every order, builds pair counts, writes
   `ml/pairings.json`. Suitable for the > 10k-order regime. Scheduled in
   Jenkins (`@nightly`) — see `docs/DEVOPS.md`.

When the live query returns nothing (cold start), the API falls back to
`Recommendation::popular()`.

## Animation rules

All UI motion lives in `assets/css/app.css` and follows the Emil Kowalski playbook
encoded by the `emil-design-eng` skill:

- `transition: <prop> 160–240ms <ease-out>` — never `transition: all`.
- Enter animations start from `scale(0.95)` + `opacity: 0`, never `scale(0)`.
- Buttons get `transform: scale(0.97)` on `:active`.
- The cart drawer uses an iOS-flavoured curve (`--ease-drawer`).
- `prefers-reduced-motion` collapses everything to a 120 ms cross-fade.

## Why this is "modern" without a JS framework

The proposal pins HTML/CSS/JS. We honour that and still get the polish from the
design skills by:

- Using **vanilla ES modules** with `type="module"` — no bundler required.
- Tabular numerics on prices (`font-variant-numeric: tabular-nums`).
- Skeleton loaders instead of spinners (UI/UX Pro Max §3 `progressive-loading`).
- A single accent colour (`--accent`), zinc-flavoured neutrals, no purple glow.
- `color-mix()` for state derivations — fewer hex constants to drift.
- `100dvh` for full-height regions (no iOS Safari layout-jump bug).

## Reuse

Per Unit 1 §1.5, "construction with reuse":

- Docker base images (`composer:2.7`, `php:8.3-fpm-alpine`, `nginx:1.27-alpine`,
  `mysql:8.4`, `phpmyadmin:5.2`) — every CI run starts from a known-good image.
- `pymysql`, `phpunit`, `phpcs` — pinned in `composer.json` / `requirements.txt`.

Per Unit 1 §1.5.6, the in-house code itself follows reusability standards:
PSR-4 autoload, PSR-12 style, named constants over magic numbers.
