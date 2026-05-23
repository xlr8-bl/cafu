# Day-to-day commands. Each target is doc-as-code: `make help` lists them all.
SHELL := /usr/bin/env bash

.DEFAULT_GOAL := help

help: ## Show this help.
	@awk 'BEGIN {FS = ":.*##"; printf "Targets:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

up: ## Boot the full stack (runs migrations automatically).
	docker compose up -d --build

down: ## Stop the stack, keep data.
	docker compose down

nuke: ## Stop the stack, drop the DB + vendor volumes (forces full rebuild).
	docker compose down -v

migrate: ## Apply any new DB migrations against the running stack.
	docker compose run --rm migrate

rollback: ## Roll back the most recent migration. Destructive — confirm first.
	docker compose run --rm --entrypoint "" migrate sh -c 'cd /var/www/html && vendor/bin/phinx rollback -c /srwa-db/phinx.php'

migration-status: ## Show which migrations have been applied.
	docker compose run --rm --entrypoint "" migrate sh -c 'cd /var/www/html && vendor/bin/phinx status -c /srwa-db/phinx.php'

seed: ## Load dev seed data into the running DB. Drops + reseeds menu/customers; not idempotent.
	docker compose exec -T mysql sh -c 'mysql -u"$$MYSQL_USER" -p"$$MYSQL_PASSWORD" "$$MYSQL_DATABASE" < /srwa-seed.sql'

logs: ## Tail all logs.
	docker compose logs -f --tail=200

shell: ## Open a shell inside the php container.
	docker compose exec php sh

test: ## Run PHPUnit in the container.
	docker compose run --rm php composer test

lint: ## Run PSR-12 check.
	docker compose run --rm php composer lint

smoke: ## Hit /healthz and /api/menu.
	@curl -fsS http://localhost:8090/healthz && echo
	@curl -fsS http://localhost:8090/api/menu | head -c 200 && echo

pairings: ## Rebuild ml/pairings.json from orders.
	docker compose run --rm \
	  -e DB_HOST=mysql -e DB_USER=srwa -e DB_PASS=srwa_dev_password \
	  --entrypoint sh python:3.12-alpine -c \
	  "pip install -q pymysql && python /workspace/ml/recommend.py --host mysql --db srwa --user srwa --password srwa_dev_password --out /workspace/ml/pairings.json"
