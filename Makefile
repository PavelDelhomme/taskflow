.PHONY: help build up down logs clean

help:
	@echo "🎯 TaskFlow ADHD - Commandes Docker"
	@echo "  make build   => Build les images Docker"
	@echo "  make up      => Lance tous les services"
	@echo "  make down    => Arrête tous les services"
	@echo "  make logs    => Affiche les logs"
	@echo "  make clean   => Nettoie Docker"
	@echo ""
	@echo "🌐 Accès:"
	@echo "  - Web: http://localhost:3003"
	@echo "  - API: http://localhost:8008"
	@echo "  - DB:  localhost:5435"

build:
	docker-compose build

up:
	docker-compose up -d
	@echo "✅ Services démarrés!"
	@echo "🌐 Web: http://localhost:3003"
	@echo "🔥 API: http://localhost:8008"

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	docker system prune -f
