.PHONY: help install dev build start test seed-admin fetch train clean docker-up docker-down

help: ## Show this help message
	@echo "AlgoTrader Makefile Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

dev: ## Run development server
	npm run dev

build: ## Build production application
	npm run build

start: ## Start production server
	npm start

test: ## Run tests
	npm test

seed-admin: ## Seed admin user
	node scripts/seedAdmin.js

fetch: ## Fetch data for symbol (usage: make fetch SYMBOL=RELIANCE.NS)
	node scripts/fetchData.js $(SYMBOL)

train: ## Train model for symbol (usage: make train SYMBOL=RELIANCE.NS)
	node scripts/trainModel.js $(SYMBOL)

backtest: ## Run backtest (example)
	@echo "Use API: POST /api/backtest/[symbol]"

docker-up: ## Start Docker containers
	docker-compose up -d

docker-down: ## Stop Docker containers
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

clean: ## Clean build artifacts and logs
	rm -rf .next
	rm -rf node_modules
	rm -rf logs/*
	rm -rf public/exports/*

lint: ## Run linter
	npm run lint

format: ## Format code (if you add prettier)
	@echo "Add prettier to format code"
