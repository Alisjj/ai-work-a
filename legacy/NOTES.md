# Design Notes & Decisions

## Part A — FastAPI / Python

### Schema design

The briefing data is split across three tables:

- **`briefings`** — the top-level record with scalar fields (company, ticker, summary, etc.)
- **`briefing_points`** — key points and risks stored in a single table, differentiated by a `point_type` enum. This avoids having two nearly-identical tables and keeps queries simple.
- **`briefing_metrics`** — separate table because metrics have two fields (name + value) and carry a uniqueness constraint per briefing.

A `display_order` integer is stored on both points and metrics. This preserves insertion order for rendering without relying on `id` sort order (which is non-deterministic for UUIDs).

### Validation

All validation happens in Pydantic schemas, which is idiomatic for FastAPI. The `ticker` is normalized to uppercase in the validator itself — the stored value is always clean, so no normalization is needed at read time. Duplicate metric names are caught via a `model_validator` that compares lowercase-stripped names.

### Formatter / view model layer

The `ReportViewModel` class in `briefing_service.py` acts as the formatter. It:
- groups and sorts key points vs risks
- formats the `generated_at` timestamp into a human-readable string
- title-cases metric names for display
- exposes a `has_metrics` boolean so the template can skip the metrics section cleanly without logic in the template itself

The template receives a `ReportViewModel` instance, never a raw ORM object. This keeps template logic minimal and testable.

### HTML rendering

Jinja2 is configured with `autoescape=True` for `.html` files. All values are escaped via the `| e` filter in the template as an explicit reminder, though autoescaping means this is belt-and-suspenders.

The HTML is designed to look like a print-ready internal report: a dark header with a gold accent, semantic `<section>` structure, a styled metrics table, and a color-coded recommendation box.

### Generate-before-HTML pattern

`GET /briefings/{id}/html` returns `409 Conflict` if the briefing hasn't been generated yet, rather than silently returning an empty page. This makes the two-step flow (create → generate → view) explicit in the API contract.

### Testing

Tests use pure mocking with `unittest.mock` and `freezegun` for time control. No Docker or database required.

The approach:
- Mock the service layer at the route level (`app.api.routes.briefings.briefing_service.*`)
- Return plain dicts that match the `BriefingOut` schema (not ORM mocks)
- Use `freezegun` for deterministic timestamps where needed
- Validation tests (422 responses) don't need mocking — they test Pydantic schemas directly

This keeps tests fast (~0.4s for 28 tests) and removes the Docker dependency.

---

## Part B — NestJS / TypeScript

### Module structure

Services and entities are grouped by domain (`documents/`, `summaries/`, `candidates/`). The controller lives under `candidates/` because all routes are nested under `/candidates/:id`. Queue logic lives in `queue/` and the LLM integration in `summarization/`.

### Access control

A `WorkspaceGuard` reads the `x-workspace-id` header and attaches it to the request object. Every service method that touches candidates checks that the candidate's `workspaceId` matches the header value before doing anything. This means workspace isolation is enforced at the service layer, not just the guard.

In a production system, the workspace ID would come from a decoded JWT, not a header. Documenting this assumption felt more honest than building a fake JWT system that adds complexity without adding insight.

### Async queue design

Summary generation uses a Bull queue backed by Redis. The flow is:
1. `POST /summaries/generate` creates a `PENDING` summary record and enqueues a job (returns `202 Accepted`)
2. The `SummaryProcessor` worker picks up the job, calls the summarization provider, and updates the record to `COMPLETED` or `FAILED`

Bull is configured with `attempts: 3` and exponential backoff, so transient API failures are retried automatically. Jobs are removed on success to keep the queue clean.

### Summarization provider abstraction

`SummarizationProvider` is an interface with a single method: `generateCandidateSummary(input)`. The `GeminiSummarizationProvider` implements it. NestJS injects it via the `SUMMARIZATION_PROVIDER` token, so swapping to OpenAI or a stub provider requires zero changes to the worker or services.

The Gemini call requests JSON-only output and validates the parsed response against an explicit schema before returning. If the model returns malformed output, an error is thrown and the worker catches it, marking the summary as `FAILED` with an `errorMessage`. This prevents corrupt data from being persisted.

### LLM provider

- **Provider used:** Google Gemini via `@google/generative-ai`
- **Model:** `gemini-1.5-flash`
- **How to configure locally:** Set `GEMINI_API_KEY` in `ts-service/.env`. Get a free key at https://aistudio.google.com/app/apikey — no billing required for the free tier.
- **Prompt version:** `v1` (stored on each summary record for future auditability and reproducibility)
- **API key:** Never committed to the repo — read from environment variable only
- **Limitations:**
  - Free tier has rate limits (~15 RPM); under heavy load jobs will fail and be retried via Bull's backoff strategy
  - The prompt is tuned for software engineering roles; it would need adjustment for other job types
  - Gemini occasionally ignores the JSON-only instruction and wraps output in markdown fences — the provider strips these defensively, but sufficiently malformed output will mark the summary as `FAILED`
  - No token limit enforcement on document input; very long resumes could exceed the model's context window

### Testing

Tests use InMemory repository implementations (`InMemoryCandidateRepository`, `InMemoryDocumentRepository`, `InMemorySummaryRepository`) and a `FakeSummarizationProvider` class that implements the `SummarizationProvider` interface. No database, no Redis, and no Jest mocking of internals.

The processor tests cover the four key paths: happy path, no documents found, provider throws, and summary record missing. The service tests verify workspace ownership enforcement and queue job payload correctness.

---

## What I would improve with more time

- **Python service:** Add pagination to a future `GET /briefings` list endpoint. Add an integration test against a real Postgres instance (e.g. via `pytest-docker`).
- **NestJS service:** Add a proper JWT-based auth system. Add a `GET /candidates/:id/documents` endpoint. Add end-to-end tests that spin up a test Postgres + Redis via `testcontainers`.
- **Both services:** Structured logging (e.g. JSON logs with request IDs), OpenAPI spec validation in CI, and Docker Compose for one-command local startup.
- **Queue:** Add a dead-letter queue so permanently-failed jobs can be inspected and replayed.
