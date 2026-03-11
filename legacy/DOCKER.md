# Docker Development Guide

Unified Docker setup for both Python (FastAPI) and TypeScript (NestJS) services.

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Copy environment template
cp .env.docker .env

# Edit .env and add your API keys
nano .env  # or use your preferred editor
```

### 2. Start All Services

```bash
# Start everything (both services + infrastructure)
docker-compose --profile all up

# Start in background
docker-compose --profile all up -d
```

### 3. Access Services

| Service | URL | Port |
|---------|-----|------|
| Python API | http://localhost:8000 | 8000 |
| TypeScript API | http://localhost:3000 | 3000 |
| Bull Board (Queue UI) | http://localhost:3001/admin | 3001 |
| PostgreSQL | localhost:5432 | 5432 |
| Redis | localhost:6379 | 6379 |

## 📦 Service Profiles

### Start Specific Services

```bash
# Only infrastructure (DB + Redis)
docker-compose up db redis

# Only Python service
docker-compose --profile python up python-app

# Only TypeScript service
docker-compose --profile ts up ts-app

# Development mode (TypeScript with hot reload)
docker-compose --profile ts-dev up ts-dev

# Run tests
docker-compose --profile python-test up python-test
docker-compose --profile ts-test up ts-test

# Monitoring (Bull Board)
docker-compose --profile monitoring up bull-board
```

## 🛠️ Development Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f ts-app
docker-compose logs -f python-app
```

### Run Tests

```bash
# Python tests
docker-compose --profile python-test up python-test

# TypeScript tests
docker-compose --profile ts-test up ts-test
```

### Access Shell

```bash
# TypeScript service
docker-compose exec ts-app sh

# Python service
docker-compose exec python-app sh

# Database
docker-compose exec db psql -U postgres
```

### Database Migrations

```bash
# TypeScript migrations
docker-compose exec ts-app yarn migration:run
docker-compose exec ts-app yarn migration:generate -- src/database/migrations/NewMigration

# Python migrations
docker-compose exec python-app alembic upgrade head
docker-compose exec python-app alembic revision --autogenerate -m "migration"
```

## 🧹 Cleanup

```bash
# Stop all services
docker-compose --profile all down

# Stop and remove volumes (fresh start)
docker-compose --profile all down -v

# Remove all containers and volumes
docker-compose --profile all down -v --remove-orphans
```

## 🔧 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs ts-app

# Rebuild
docker-compose build ts-app

# Force recreate
docker-compose up --force-recreate ts-app
```

### Database Connection Issues

```bash
# Check if DB is healthy
docker-compose ps

# Restart DB
docker-compose restart db

# Check DB logs
docker-compose logs db
```

### Port Already in Use

Edit `docker-compose.yml` and change the port mapping:
```yaml
ports:
  - "3001:3000"  # Change 3001 to another port
```

## 📝 Environment Variables

See `.env.docker` for all available options:

| Variable | Service | Default | Description |
|----------|---------|---------|-------------|
| `DATABASE_URL` | Both | - | PostgreSQL connection |
| `REDIS_URL` | TS | redis://redis:6379 | Redis connection |
| `GEMINI_API_KEY` | TS | - | Google AI API key |
| `API_KEY` | Python | change-me | API authentication |
| `ALLOWED_ORIGINS` | TS | http://localhost:3000 | CORS origins |

## 🎯 Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.yml build

# Start with production profile
docker-compose --profile all up -d

# Scale services
docker-compose up --scale ts-app=3 -d
```

## 📊 Monitoring

### Bull Board (Queue Dashboard)

Access at http://localhost:3001/admin to:
- View job queues
- Monitor job status
- Retry failed jobs
- Clean completed jobs

### Database

```bash
# Connect to PostgreSQL
docker-compose exec db psql -U postgres

# List databases
\l

# Connect to specific database
\c candidates_db
```

## 🔄 Hot Reload

TypeScript service supports hot reload in development:

```bash
# Start dev mode
docker-compose --profile ts-dev up ts-dev

# Edit files - changes auto-reload!
```

Python service also supports hot reload with volume mounts.
