.PHONY: help build up down logs clean test

help:
	@echo "Voting Application - Docker Commands"
	@echo ""
	@echo "Available commands:"
	@echo "  make build     - Build the Docker image"
	@echo "  make up        - Start all services (app + mongodb)"
	@echo "  make down      - Stop all services"
	@echo "  make logs      - View logs from all services"
	@echo "  make clean    - Remove containers and volumes"
	@echo "  make test     - Run tests inside container"

build:
	docker-compose build

up:
	docker-compose up -d
	@echo "Waiting for services to be ready..."
	@sleep 10
	@echo ""
	@echo "Services running:"
	@echo "  - App:          http://localhost:3000"
	@echo "  - Health:       http://localhost:3000/health"
	@echo "  - MongoDB:      localhost:27017"

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	@echo "Removed containers and volumes"

test:
	docker-compose exec app npm run test

test:cov:
	docker-compose exec app npm run test:cov

lint:
	docker-compose exec app npm run lint

shell:
	docker-compose exec app sh