# Day-to-day commands. Each target is doc-as-code: `make help` lists them all.
SHELL := /usr/bin/env bash

.DEFAULT_GOAL := help

help: ## Show this help.
	@awk 'BEGIN {FS = ":.*##"; printf "Targets:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

up: ## Boot the full stack.
	docker compose up -d --build

down: ## Stop the stack, keep data.
	docker compose down

nuke: ## Stop the stack, drop the DB volume.
	docker compose down -v

logs: ## Tail all logs.
	docker compose logs -f --tail=200

shell: ## Open a shell inside the php container.
	docker compose exec php sh

test: ## Run PHPUnit in the container.
	docker compose run --rm php composer test

lint: ## Run PSR-12 check.
	docker compose run --rm php composer lint

smoke: ## Hit /healthz and /api/menu.
	@curl -fsS http://localhost:8080/healthz && echo
	@curl -fsS http://localhost:8080/api/menu | head -c 200 && echo

pairings: ## Rebuild ml/pairings.json from orders.
	docker compose run --rm \
	  -e DB_HOST=mysql -e DB_USER=srwa -e DB_PASS=srwa_dev_password \
	  --entrypoint sh python:3.12-alpine -c \
	  "pip install -q pymysql && python /workspace/ml/recommend.py --host mysql --db srwa --user srwa --password srwa_dev_password --out /workspace/ml/pairings.json"
