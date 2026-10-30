SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.ONESHELL:
.DEFAULT_GOAL := help

.PHONY: help setup run dev backend frontend test test-integration check build test-e2e test-live clean

help:
	@printf '%s\n' \
	  'make run        Start backend (8080) and frontend (4028); Ctrl+C stops both' \
	  'make setup      Install frontend dependencies and create missing .env.local' \
	  'make backend    Start only the Spring Boot backend' \
	  'make frontend   Start only the Next.js frontend' \
	  'make test       Run backend tests' \
	  'make test-integration  Run isolated Docker Compose API integration tests' \
	  'make check      Run frontend type checking and lint' \
	  'make build      Package the backend and build the frontend' \
	  'make test-e2e   Run frontend browser regression tests' \
	  'make test-live  Run browser tests against real Spring Boot/H2' \
	  'make clean      Remove build output; preserve H2 data and local configuration'

setup: frontend/node_modules/.package-lock.json
	@if [ ! -e frontend/.env.local ]; then
		cp frontend/.env.example frontend/.env.local
	fi

frontend/node_modules/.package-lock.json: frontend/package.json frontend/package-lock.json
	cd frontend && npm ci

run: dev

dev: setup
	@# Separate job groups let cleanup stop Maven/npm and their Java/Node children.
	set -m
	cleanup() {
		trap - EXIT INT TERM
		for pid in "$${backend_pid:-}" "$${frontend_pid:-}"; do
			if [ -n "$$pid" ]; then kill -TERM -- "-$$pid" 2>/dev/null || true; fi
		done
		wait || true
	}
	trap cleanup EXIT
	trap 'exit 130' INT
	trap 'exit 143' TERM
	printf '%s\n' 'Frontend: http://localhost:4028' 'Backend:  http://localhost:8080' 'Press Ctrl+C to stop both.'
	(cd backend && exec ./mvnw spring-boot:run) & backend_pid=$$!
	(cd frontend && exec npm run dev) & frontend_pid=$$!
	wait -n "$$backend_pid" "$$frontend_pid"

backend:
	cd backend && ./mvnw spring-boot:run

frontend: setup
	cd frontend && npm run dev

test:
	cd backend && ./mvnw test

test-integration:
	./scripts/test-integration.sh

check: setup
	cd frontend
	npm run type-check
	npm run lint

build: setup
	(cd backend && ./mvnw package -DskipTests)
	(cd frontend && npm run build)

test-e2e: setup
	cd frontend && npm run test:e2e

test-live: setup
	cd frontend && npx playwright test --config=playwright.live.config.ts

clean:
	rm -rf backend/target frontend/.next frontend/.next-e2e frontend/.next-live
