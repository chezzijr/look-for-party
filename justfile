DEV_COMPOSE_FILE := "docker-compose.dev.yml"

install-frontend:
    [ -d "./frontend/node_modules" ] || (cd frontend && npm install)

install-backend:
    [ -d "./backend/.venv" ] || (cd backend && uv sync)

# Download packages for frontend and backend
[parallel]
init: install-frontend install-backend

# Start development container
up:
    @echo "Starting up containers..."
    @docker compose -f {{DEV_COMPOSE_FILE}} up -d --remove-orphans

# Stop development container
down:
    @echo "Stopping containers..."
    @docker compose -f {{DEV_COMPOSE_FILE}} down
