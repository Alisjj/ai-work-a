# Backend Engineering Assessment

Two standalone services in one repository:

| Service | Stack | Port |
|---------|-------|------|
| `python-service` | FastAPI + PostgreSQL + Alembic | 8000 |
| `ts-service` | NestJS + PostgreSQL + Bull/Redis | 3000 |

---

## Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 14+
- Redis 7+ (for the NestJS queue)

---

## Part A — Python Service (FastAPI)

### Setup

```bash
cd python-service

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set DATABASE_URL if needed
```

### Run migrations

```bash
# Make sure the database exists first:
createdb briefings_db    # or use psql/pgAdmin

alembic upgrade head
```

### Run the service

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Run tests

The test suite uses Testcontainers to spin up a real PostgreSQL instance. Docker must be running.

```bash
pytest
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/briefings` | Create a new briefing |
| GET | `/briefings/{id}` | Retrieve a briefing |
| POST | `/briefings/{id}/generate` | Generate the report |
| GET | `/briefings/{id}/html` | Fetch the rendered HTML report |

---

## Part B — NestJS Service

### Setup

```bash
cd ts-service

npm install

# Configure environment
cp .env.example .env
# Edit .env and fill in:
#   DATABASE_URL  — your Postgres connection string
#   REDIS_URL     — your Redis connection string
#   GEMINI_API_KEY — your Google AI Studio API key
```

### Get a Gemini API key

1. Go to https://aistudio.google.com/app/apikey
2. Create a new API key (free tier is sufficient)
3. Add it to your `.env` as `GEMINI_API_KEY`

### Run migrations

```bash
# Make sure the database exists:
createdb candidates_db

npm run migration:run
```

### Run the service

```bash
npm run start:dev
```

The service listens on http://localhost:3000

### Run tests

Tests use InMemory repositories and a fake provider — no live API calls, no running Postgres or Redis needed.

```bash
npm test
```

### API Endpoints

All endpoints require the `x-workspace-id` header (simulated auth — see NOTES.md).

| Method | Path | Description |
|--------|------|-------------|
| POST | `/candidates/:candidateId/documents` | Upload a candidate document |
| POST | `/candidates/:candidateId/summaries/generate` | Request async summary generation |
| GET | `/candidates/:candidateId/summaries` | List summaries for a candidate |
| GET | `/candidates/:candidateId/summaries/:summaryId` | Get a specific summary |

### Example request

```bash
# Upload a document
curl -X POST http://localhost:3000/candidates/<candidateId>/documents \
  -H "Content-Type: application/json" \
  -H "x-workspace-id: <your-workspace-id>" \
  -d '{
    "documentType": "resume",
    "fileName": "alice-resume.pdf",
    "rawText": "Alice Smith — Senior Software Engineer..."
  }'

# Request summary generation (returns 202 Accepted)
curl -X POST http://localhost:3000/candidates/<candidateId>/summaries/generate \
  -H "x-workspace-id: <your-workspace-id>"

# Poll for results
curl http://localhost:3000/candidates/<candidateId>/summaries \
  -H "x-workspace-id: <your-workspace-id>"
```

---

## Database Setup (Quick Reference)

```bash
# Create both databases
createdb briefings_db
createdb candidates_db

# Run both migrations
cd python-service && alembic upgrade head
cd ../ts-service && npm run migration:run
```

---

## Seeding Test Data (NestJS)

You will need a workspace and candidate in your database before calling the API.
Insert them directly or use psql:

```sql
-- Connect to candidates_db
INSERT INTO workspaces (id, name) VALUES ('ws-00000000-0000-0000-0000-000000000001', 'Acme Recruiting');
INSERT INTO candidates (id, workspace_id, name, email)
VALUES ('cand-00000000-0000-0000-0000-000000000001', 'ws-00000000-0000-0000-0000-000000000001', 'Alice Smith', 'alice@example.com');
```

Then use `x-workspace-id: ws-00000000-0000-0000-0000-000000000001` in your requests.
