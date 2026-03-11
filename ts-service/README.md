# TalentFlow TypeScript Service

NestJS service for the Candidate Document Intake + Summary Workflow assessment.

## Features

- Upload candidate documents (resume, cover letter) with local file storage
- Async summary generation using Bull queue + Redis
- LLM-powered candidate evaluation (Gemini)
- Workspace-scoped access control
- TypeORM with PostgreSQL

## Prerequisites

- Node.js 22+
- PostgreSQL (via Docker)
- Redis (via Docker)

```bash
docker compose up -d postgres redis
```

## Setup

```bash
cd ts-service
npm install
cp .env.example .env
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string (default: redis://localhost:6379) |
| `GEMINI_API_KEY` | Google AI Studio API key for real LLM calls |

## Run Migrations

```bash
npm run migration:run
```

## Run Service

```bash
npm run start:dev
```

## Run Tests

```bash
npm test
```

## API Endpoints

### Documents
- `POST /candidates/:candidateId/documents` - Upload document

### Summaries
- `POST /candidates/:candidateId/summaries/generate` - Queue summary generation (async)
- `GET /candidates/:candidateId/summaries` - List summaries
- `GET /candidates/:candidateId/summaries/:summaryId` - Get single summary

All endpoints require headers: `x-user-id` and `x-workspace-id`

## LLM Provider

- Uses **Gemini 2.5 Flash** via Google AI Studio
- Set `GEMINI_API_KEY` in `.env` for real LLM calls
- Falls back to fake provider if no key configured
- See `src/llm/` for provider abstraction

## Design Decisions

- **Storage**: Local filesystem (`uploads/{candidateId}/`) with UUID-prefixed filenames
- **Queue**: Bull + Redis for async job processing
- **Access Control**: Workspace-scoped via `x-workspace-id` header
- **Separation**: Controller → Service → Repository pattern

## Assumptions & Limitations

- Redis must be running for queue to process jobs
- New workspaces must be seeded via `/sample/candidates` first
- Document raw text is stored in DB; actual files stored locally
- No JWT auth - uses fake header-based auth for assessment purposes
