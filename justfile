DEV_COMPOSE_FILE := "docker-compose.dev.yml"

install-frontend:
    [ -d "./frontend/node_modules" ] || (cd frontend && npm install)

install-backend:
    [ -d "./backend/.venv" ] || (cd backend && uv sync)

# Download packages for frontend and backend
[parallel]
init: install-frontend install-backend

# Start development container
up *args:
    @echo "Starting up containers..."
    @docker compose -f {{DEV_COMPOSE_FILE}} up -d --remove-orphans {{args}}

# Stop development container
down *args:
    @echo "Stopping containers..."
    @docker compose -f {{DEV_COMPOSE_FILE}} down {{args}}

logs service:
    @docker compose -f {{DEV_COMPOSE_FILE}} logs {{service}}

# Stop specific service
stop service:
    @docker compose -f {{DEV_COMPOSE_FILE}} stop {{service}}

# Execute command on service container
exec service *command:
    @docker compose -f {{DEV_COMPOSE_FILE}} exec {{service}} {{command}}

generate_migration message:
    @docker compose -f {{DEV_COMPOSE_FILE}} exec backend alembic revision --autogenerate -m "{{message}}"

migrate_up:
    @docker compose -f {{DEV_COMPOSE_FILE}} exec backend alembic upgrade head

migrate_down:
    @docker compose -f {{DEV_COMPOSE_FILE}} exec backend alembic downgrade -1

# Run frontend tests (Playwright E2E)
test-frontend:
    @echo "Running frontend tests..."
    @docker compose -f {{DEV_COMPOSE_FILE}} exec frontend npx playwright test

# Run backend tests (pytest)
test-backend:
    @echo "Running backend tests..."
    @docker compose -f {{DEV_COMPOSE_FILE}} exec backend uv run pytest

# Run both frontend and backend tests in parallel
[parallel]
test: test-frontend test-backend

# Run tests with coverage (backend only)
test-backend-coverage:
    @echo "Running backend tests with coverage..."
    @docker compose -f {{DEV_COMPOSE_FILE}} exec backend uv run coverage run -m pytest
    @docker compose -f {{DEV_COMPOSE_FILE}} exec backend uv run coverage report
