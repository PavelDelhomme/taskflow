ROOT_DIR := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
COMPOSE_DEV := docker compose -f docker-compose.yml -f docker-compose.dev.yml
COMPOSE_PROD := docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env
COMPOSE_PREPROD := docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.preprod.yml --env-file .env

.PHONY: help init build build-prod start stop restart restart-logs up down prod up-prod down-prod up-preprod down-preprod restart-prod restart-preprod logs logs-prod logs-preprod clean status status-watch status-live ps secrets secrets-print smoke-prod deploy-web deploy-api deploy-service deploy-prod deploy-preprod upgrade-prod upgrade-preprod seed-users ide-deps clean-cache test-data clean-test migrate test-check test-all test-all-isolated test-report test-env-stop test-voice mobile-build mobile-release

help:
	@echo "🎯 TaskFlow — commandes Make"
	@echo ""
	@echo "  Développement local :"
	@echo "    make init / build / up / down / restart / logs"
	@echo "    make ide-deps          # npm local pour Cursor (sans casser Docker)"
	@echo "    make status / status-watch / ps"
	@echo ""
	@echo "  Production (Portainer / VPS) :"
	@echo "    make prod / up-prod / down-prod / upgrade-prod"
	@echo "    make deploy-prod / deploy-web / deploy-api / deploy-service SERVICE=web"
	@echo "    make smoke-prod / secrets-print / secrets-print-accounts"
	@echo ""
	@echo "  Préprod staging (ports 401x, conteneurs *-preprod) :"
	@echo "    make up-preprod / down-preprod / upgrade-preprod / deploy-preprod"
	@echo ""
	@echo "  Mobile (Flutter — taskflow-mobile/README.md) :"
	@echo "    make mobile-build / mobile-release"
	@echo ""
	@echo "  Tests : make test-check / test-all / migrate / seed-users / …"
	@echo ""
	@echo "📖 Portainer : deploy/portainer/PORTAINER-STACK.md"

init:
	@if [ -f .env ]; then \
		printf '%b\n' "\033[1;33m⚠️  .env existe déjà.\033[0m"; \
	else \
		cp env.example .env; \
		echo "✅ .env créé — ou make secrets pour prod"; \
	fi

secrets:
	@chmod +x scripts/dev/gen-secrets.sh
	@./scripts/dev/gen-secrets.sh

secrets-print:
	@chmod +x scripts/dev/gen-secrets.sh
	@./scripts/dev/gen-secrets.sh --print

secrets-print-accounts:
	@chmod +x scripts/dev/gen-secrets.sh
	@./scripts/dev/gen-secrets.sh --accounts

ide-deps:
	@chmod +x scripts/dev/ide-deps.sh
	@./scripts/dev/ide-deps.sh

build:
	$(COMPOSE_DEV) build

build-prod:
	$(COMPOSE_PROD) build

build-preprod:
	$(COMPOSE_PREPROD) build

start: up
stop: down

restart: down up

restart-logs: down up
	@sleep 2
	@$(COMPOSE_DEV) logs -f

up:
	$(COMPOSE_DEV) up -d
	@echo "✅ Stack dev — http://localhost:4000 · API :4001"

down:
	$(COMPOSE_DEV) down

prod: up-prod

up-prod:
	$(COMPOSE_PROD) up -d
	@echo "✅ Stack prod (loopback 4000/4001/4002) — configurez NPM"

down-prod:
	$(COMPOSE_PROD) down

restart-prod: down-prod up-prod

deploy-prod: build-prod up-prod smoke-prod

upgrade-prod:
	$(COMPOSE_PROD) pull --ignore-pull-failures 2>/dev/null || true
	$(COMPOSE_PROD) build --pull
	$(COMPOSE_PROD) up -d --remove-orphans
	@echo "✅ Prod mise à jour"

up-preprod:
	$(COMPOSE_PREPROD) up -d
	@echo "✅ Stack préprod (4010/4011/4012) — staging NPM"

down-preprod:
	$(COMPOSE_PREPROD) down

restart-preprod: down-preprod up-preprod

deploy-preprod: build-preprod up-preprod smoke-preprod

upgrade-preprod:
	$(COMPOSE_PREPROD) pull --ignore-pull-failures 2>/dev/null || true
	$(COMPOSE_PREPROD) build --pull
	$(COMPOSE_PREPROD) up -d --remove-orphans

deploy-web:
	$(COMPOSE_PROD) build taskflow-web
	$(COMPOSE_PROD) up -d taskflow-web
	@echo "✅ taskflow-web redéployé"

deploy-api:
	$(COMPOSE_PROD) build taskflow-api
	$(COMPOSE_PROD) up -d taskflow-api
	@echo "✅ taskflow-api redéployé"

deploy-service:
	@test -n "$(SERVICE)" || (echo "Usage: make deploy-service SERVICE=web|api|db" && exit 1)
	$(COMPOSE_PROD) build taskflow-$(SERVICE)
	$(COMPOSE_PROD) up -d taskflow-$(SERVICE)

logs:
	$(COMPOSE_DEV) logs -f

logs-prod:
	$(COMPOSE_PROD) logs -f

logs-preprod:
	$(COMPOSE_PREPROD) logs -f

smoke-prod:
	@chmod +x scripts/ops/smoke-prod.sh
	@./scripts/ops/smoke-prod.sh

smoke-preprod:
	@SMOKE_API_URL=http://127.0.0.1:4011 SMOKE_WEB_URL=http://127.0.0.1:4010 ./scripts/ops/smoke-prod.sh

seed-users:
	@chmod +x scripts/db/seed-users.sh
	@./scripts/db/seed-users.sh

status:
	@chmod +x scripts/ops/status-print.sh
	@bash scripts/ops/status-print.sh

status-watch:
	@chmod +x scripts/ops/status-watch-loop.sh
	@ROOT_DIR="$(ROOT_DIR)" INTERVAL="$(or $(INTERVAL),4)" ALTSCREEN="$(or $(ALTSCREEN),1)" CLEAR="$(or $(CLEAR),0)" STATUS_FOLD="$(or $(STATUS_FOLD),1)" bash scripts/ops/status-watch-loop.sh

status-live: status-watch

ps:
	@docker ps --filter "name=taskflow" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

test-data:
	@docker exec -i taskflow-db psql -U taskflow -d taskflow_adhd < taskflow-api/generate-test-data.sql

test-data-due-dates:
	@docker exec -i taskflow-db psql -U taskflow -d taskflow_adhd < taskflow-api/generate-test-data-with-due-dates.sql

clean-test:
	@docker exec -i taskflow-db psql -U taskflow -d taskflow_adhd < taskflow-api/clean-test-data.sql

migrate:
	@docker exec -i taskflow-db psql -U taskflow -d taskflow_adhd < taskflow-api/migration_add_deleted_at.sql
	@docker exec -i taskflow-db psql -U taskflow -d taskflow_adhd < taskflow-api/migration_add_project_to_workflows.sql
	@docker exec -i taskflow-db psql -U taskflow -d taskflow_adhd < taskflow-api/migration_add_due_date.sql
	@docker exec -i taskflow-db psql -U taskflow -d taskflow_adhd < taskflow-api/migration_add_time_tracking.sql
	@docker exec -i taskflow-db psql -U taskflow -d taskflow_adhd < taskflow-api/migration_add_project_to_tasks.sql
	@docker exec -i taskflow-db psql -U taskflow -d taskflow_adhd < taskflow-api/migration_tdah_features.sql

clean-cache:
	@sudo rm -rf taskflow-web/.next 2>/dev/null || true
	@docker exec taskflow-web rm -rf /app/.next 2>/dev/null || true

test-voice:
	@./test-voice-commands.sh

test-check:
	@./test-checklist.sh

test-all:
	@./test-all.sh

test-all-isolated:
	@./setup-test-env.sh && sleep 15 && TEST_API_URL=http://localhost:4003 ./test-all.sh || (docker compose -f docker-compose.test.yml down -v; exit 1)
	@docker compose -f docker-compose.test.yml down -v

test-report:
	@./generate-test-report.sh

test-env-stop:
	@docker compose -f docker-compose.test.yml down -v

mobile-build:
	@test -f taskflow-mobile/pubspec.yaml || (echo "❌ Voir taskflow-mobile/README.md"; exit 1)
	cd taskflow-mobile && flutter pub get && flutter build apk --debug

mobile-release:
	@test -f taskflow-mobile/pubspec.yaml || (echo "❌ Voir taskflow-mobile/README.md"; exit 1)
	cd taskflow-mobile && flutter pub get && flutter build apk --release

clean:
	$(COMPOSE_DEV) down -v
	docker system prune -f
