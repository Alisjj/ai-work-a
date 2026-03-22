# InsightOps Python Service Starter

FastAPI starter service for the backend assessment.

This service includes:

- FastAPI app bootstrap and health endpoint
- SQLAlchemy wiring
- Manual SQL migration runner
- One small `sample_items` example feature
- Jinja template wiring with a minimal base template
- Pytest setup

The assessment-specific briefing features are intentionally not implemented.

## Prerequisites

- Python 3.12
- PostgreSQL running from repository root:

```bash
docker compose up -d postgres
```

## Setup

```bash
cd python-service
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

## Environment

`.env.example` includes:

- `DATABASE_URL`
- `APP_ENV`
- `APP_PORT`

## Run Migrations (Manual SQL Runner)

Apply pending migrations:

```bash
cd python-service
source .venv/bin/activate
python -m app.db.run_migrations up
```

Roll back the latest migration:

```bash
cd python-service
source .venv/bin/activate
python -m app.db.run_migrations down --steps 1
```

How it works:

- SQL files live in `python-service/db/migrations/`
- A `schema_migrations` table tracks applied filenames
- Up files are applied in sorted filename order (`*.sql` or `*.up.sql`)
- Rollback uses a paired `*.down.sql` file for each applied migration
- Applied migration files are skipped on subsequent runs

## Run Service

```bash
cd python-service
source .venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

## Run Tests

```bash
cd python-service
source .venv/bin/activate
python -m pytest
```

## Quality Checks

Project-level tool configuration now lives in `pyproject.toml`.

If you install the tools in your venv, the intended checks are:

```bash
cd python-service
source .venv/bin/activate
ruff check .
pyright
```

## Project Layout

- `app/main.py`: FastAPI app factory and ASGI entrypoint
- `app/config.py`: environment config
- `app/db/`: SQLAlchemy session management and migration runner
- `db/migrations/`: SQL migration files
- `app/briefings/`: briefing feature package (API, service, queries, presenters, exception handlers)
- `app/sample_items/`: sample-items feature package (API, service, queries, presenters)
- `app/models/`: ORM models
- `app/schemas/`: Pydantic request/response schemas
- `app/api/`: shared/simple route handlers
- `app/templates/`: Jinja templates
- `tests/`: test suite
