.PHONY: help init build start stop restart up down logs clean status test-data clean-test migrate

help:
	@echo "🎯 TaskFlow ADHD - Commandes Docker"
	@echo "  make init    => Initialise le projet (crée .env depuis env.example)"
	@echo "  make build   => Build les images Docker"
	@echo "  make start   => Lance tous les services (alias: make up)"
	@echo "  make stop    => Arrête tous les services (alias: make down)"
	@echo "  make restart => Redémarre tous les services (stop puis start)"
	@echo "  make up      => Lance tous les services"
	@echo "  make down    => Arrête tous les services"
	@echo "  make logs    => Affiche les logs"
	@echo "  make status  => Affiche le statut des conteneurs TaskFlow"
	@echo "  make test-data => Génère les données de test (workflows + tâches)"
	@echo "  make clean-test => Supprime les données de test (conserve l'utilisateur)"
	@echo "  make migrate => Applique les migrations de base de données"
	@echo "  make clean   => Nettoie Docker"
	@echo ""
	@echo "🌐 Accès:"
	@echo "  - Web: http://localhost:4000"
	@echo "  - API: http://localhost:4001"
	@echo "  - DB:  localhost:4002"

init:
	@if [ -f .env ]; then \
		echo "⚠️  Le fichier .env existe déjà. Supprimez-le d'abord si vous voulez le réinitialiser."; \
	else \
		cp env.example .env; \
		echo "✅ Fichier .env créé depuis env.example"; \
		echo "📝 N'oubliez pas de vérifier et modifier les valeurs dans .env si nécessaire"; \
	fi

build:
	docker-compose build

start: up

stop: down

restart: down up

up:
	docker-compose up -d
	@echo "✅ Services démarrés!"
	@echo "🌐 Web: http://localhost:4000"
	@echo "🔥 API: http://localhost:4001"

down:
	docker-compose down

logs:
	docker-compose logs -f

status:
	@docker ps --filter "name=taskflow" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

test-data:
	@echo "🧪 Génération des données de test..."
	@docker exec -i taskflow-db-paul psql -U taskflow -d taskflow_adhd < taskflow-api/generate-test-data.sql
	@echo "✅ Données de test générées !"

clean-test:
	@echo "🧹 Suppression des données de test..."
	@docker exec -i taskflow-db-paul psql -U taskflow -d taskflow_adhd < taskflow-api/clean-test-data.sql
	@echo "✅ Données de test supprimées (utilisateur conservé) !"

migrate:
	@echo "🔄 Application des migrations..."
	@docker exec -i taskflow-db-paul psql -U taskflow -d taskflow_adhd < taskflow-api/migration_add_deleted_at.sql
	@docker exec -i taskflow-db-paul psql -U taskflow -d taskflow_adhd < taskflow-api/migration_add_project_to_workflows.sql
	@echo "✅ Migrations appliquées !"

clean:
	docker-compose down -v
	docker system prune -f
