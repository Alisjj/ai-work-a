# Assessment Notes & Decisions

Below is a breakdown of the architectural, design, and schema decisions made during the implementation of the backend assessment features.

## 1. Design Decisions

- **Global Error Handling:** Implemented a global exception filter (`QueryFailedFilter`) to intercept TypeORM database errors rather than using localized try-catch blocks in the controllers. This gracefully maps PostgreSQL unique constraints (to `409 Conflict`) and foreign key constraints (to `400 Bad Request`) without leaking SQL details to the client.
- **Provider Abstraction:** Maintained the abstraction between `FakeSummarizationProvider` (used strictly for fast, reliable unit/E2E testing) and `GeminiSummarizationProvider` (used for production workflows).
- **Gemini Model Upgrade:** Upgraded the LLM model identifier to `gemini-2.5-flash` to ensure compatibility and reliable structured payload generation against the active Google Gemini API.
- **Physical Local Disk Storage:** Strictly adhered to the assessment instructions by using `fs.promises` to write document contents directly to physical files on the server disk within an `uploads/` directory, rather than solely saving a dummy path string to PostgreSQL.
- **Consistent Authentication:** Refactored all controllers to natively use the custom `@AuthUser()` decorator. This ensures controllers consistently extract the `workspaceId` mapped by the `WorkspaceGuard`, guaranteeing clean multi-tenant data boundaries.

## 2. Schema Decisions

- **UUID Primary Keys:** Used `uuid` for all entity IDs (`Candidate`, `CandidateDocument`, `CandidateSummary`) to ensure globally unique referencing and avoid ID enumeration vulnerabilities across workspaces.
- **Database Level Isolation:** Standardized `candidateId` and `workspaceId` foreign-key relationships. All reads and writes (`CandidateRepository`, `SummaryRepository`) enforce a strict `WHERE workspaceId = x` clause, creating a secondary layer of multi-tenant isolation at the DB query level.
- **Enums for Strictness:** Utilized Postgres enums for structured fields like `status` (`pending`, `completed`, `failed`) and `documentType` (`resume`, `cover_letter`) to prevent invalid states in the worker queue flow.

## 3. Assumptions and Tradeoffs

- **Testing Environment:** Assumed that the requirement "Tests must not depend on live external API calls" meant the Jest testing environment should transparently bind to the `FakeSummarizationProvider`, keeping CI pipelines unblocked from rate limits.
- **Auth Guard:** Assumed the simple header-based `WorkspaceGuard` was sufficient for demonstrating access control boundary theory without needing to over-engineer a full JWT/OAuth suite.
- **Tradeoff - Inline File Text:** The document upload implementation assumes the front-end handles actual file extraction, taking `rawText` directly in the payload. This trades off binary multipart parsing for simplicity and testability.

## 4. Improvements with More Time

- **True Blob Storage Provider:** I would introduce a `StorageProvider` interface that writes to an S3 bucket instead of generating a pseudo-local path.
- **Native LLM Structured Outputs:** Migrate the Gemini summary generation to utilize the SDK's native `responseSchema` (JSON schema enforcing) rather than asking the LLM to format as JSON and parsing it out of markdown blocks manually.
- **Redis Retry Strategies:** Implement exponential backoff configurations on the Bull Job Queue to robustly handle transient rate limits from the external Gemini APIs.
