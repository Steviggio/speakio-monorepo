.PHONY: build run-api run-worker migrate-up migrate-down test lint clean

# Build
build:
	go build -o bin/agent-api ./cmd/api
	go build -o bin/agent-worker ./cmd/worker
	go build -o bin/agent-migrate ./cmd/migrate

# Run
run-api:
	go run ./cmd/api

run-worker:
	go run ./cmd/worker

# Migrations
migrate-up:
	go run ./cmd/migrate up

migrate-down:
	go run ./cmd/migrate down

# Tests
test:
	go test ./... -v -race -count=1

# Lint
lint:
	go vet ./...

# Clean
clean:
	rm -rf bin/

# Dependencies
tidy:
	go mod tidy

# Docker
docker-build:
	docker build -f deploy/Dockerfile.api -t speakio-agent-api .
	docker build -f deploy/Dockerfile.worker -t speakio-agent-worker .
