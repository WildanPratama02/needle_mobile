# Needle Mobile System — Backend

REST API and single source of truth for the needle exchange / inventory system. Modular monolith (ADR-001): one NestJS service, one PostgreSQL database, domain modules separated by folder.

Project rules live in [`CLAUDE.md`](./CLAUDE.md). How the code is put together and why is in [`ARCHITECTURE.md`](./ARCHITECTURE.md). Requirement documents live in `../Docs/`. Domain vocabulary lives in `../CONTEXT.md` — read it before naming anything.

Current state: tickets 01–17 complete (auth, exchange state machine, evidence, confirmations, cancellation, notifications, audit, response envelope, factory-scope helper, retention sweeps, audit queries, CORS). Remaining production-readiness gaps are reviewed in `../.scratch/exchange/final-review.md`.

## Stack

| Concern | Choice |
|---|---|
| Runtime | Node.js 20+ (dev on 22) |
| Framework | NestJS 11 (TypeScript) |
| Database | PostgreSQL 16 (ADR-002) |
| ORM | Prisma 6 |
| Auth | Custom JWT (access + refresh) |
| Object storage | MinIO (evidence photos) |
| Cache / queue | Redis + BullMQ |
| Notifications | WhatsApp via Meta Cloud API, outbound only (ADR-006) |

## Local setup

```bash
cd Backend

# 1. Environment
cp .env.example .env          # then edit secrets

# 2. Dependencies
npm install

# 3. Infrastructure (PostgreSQL + Redis + MinIO)
docker compose up -d

# 4. Prisma client + schema
npm run prisma:generate
npm run prisma:migrate        # applies the migrations in prisma/migrations/

# 5. Seed roles, permissions and the admin user
npm run db:seed

# 6. Run
npm run start:dev
```

Then:

- API base — `http://localhost:3000/api/v1`
- Swagger UI — `http://localhost:3000/docs`
- MinIO console — `http://localhost:9001`

## Local services

`docker-compose.yml` brings up exactly what local dev needs; the API itself runs on the host via `npm run start:dev` (faster reload). `Dockerfile` builds the API image for deployment.

| Service | Host port | Notes |
|---|---|---|
| `postgres` | 5432 | credentials from `POSTGRES_*` in `.env` |
| `redis` | 6379 | append-only persistence on |
| `minio` | 9000 (API), 9001 (console) | credentials from `MINIO_ROOT_*` |
| `minio-init` | — | one-shot; creates the `MINIO_BUCKET` bucket, then exits |

`minio-init` exiting with code 0 is expected, not a crash.

### Port conflicts

Every host port is overridable in `.env` (`POSTGRES_PORT`, `REDIS_PORT`, `MINIO_PORT`, `MINIO_CONSOLE_PORT`, `PORT`). A locally installed PostgreSQL or another project already holding 5432 is the common case, and the symptom is misleading: Docker binds the port, but the pre-existing server answers instead, so Prisma fails with `P1000 Authentication failed ... for user 'needle'` rather than a connection error.

When that happens, move the host port **and** the port inside `DATABASE_URL` together — they are two separate settings and both must change:

```dotenv
POSTGRES_PORT=55432
DATABASE_URL=postgresql://needle:needle_dev_password@localhost:55432/needle_dev?schema=public
```

Then `docker compose up -d postgres` to rebind. To see what already owns a port: `netstat -ano | findstr :5432` on Windows, `lsof -i :5432` elsewhere.

## Commands

| Command | Purpose |
|---|---|
| `npm run start:dev` | Watch-mode dev server |
| `npm run build` | Compile to `dist/` |
| `npm test` | Unit tests (`src/**/*.spec.ts`, `test/unit/`) |
| `npm run test:e2e` | End-to-end tests (`test/e2e/`) |
| `npm run lint` | ESLint + Prettier, autofix |
| `npm run prisma:migrate` | Create + apply a dev migration |
| `npm run db:seed` | Seed development data |

## Browser access (CORS)

Only the WebApp needs this — the Android client is not subject to the same-origin policy.

`CORS_ORIGINS` is a comma-separated allow-list of exact origins. **Empty disables CORS entirely**, so an environment that never configures it stays closed rather than silently opening. Listing `*` allows any origin and is a development-only convenience.

The preflight permits the Docs/12 §5 common headers — `Authorization`, `Content-Type`, `Idempotency-Key`, `X-Request-ID`, `X-Device-ID` — and `X-Request-ID` is added to `Access-Control-Expose-Headers` so a browser client can actually read back the id that ties its request to an audit row. Credentials are off: authentication travels as a bearer token, not a cookie.

```dotenv
CORS_ORIGINS=https://webapp.example.com
```

## Response format

Every response uses the envelope from `Docs/12` §7. Controllers return plain payloads; `ResponseFormatInterceptor` wraps them.

```jsonc
// success
{ "success": true, "data": { }, "meta": { "requestId": "uuid" } }

// paginated — rows in data, counters in meta
{ "success": true, "data": [], "meta": { "requestId": "uuid", "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 } }

// error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "...", "details": [] }, "meta": { "requestId": "uuid" } }
```

`204 No Content` stays bodiless (Docs/12 §8) — wrapping it would contradict the status.

**Request id.** `RequestIdMiddleware` honours an inbound `X-Request-ID` (Docs/12 §5) and mints a UUID otherwise. The same value appears in `meta.requestId`, in the `X-Request-ID` response header, and in `audit_logs.request_id`, so one trace id links a client's response to its audit row. A replayed idempotent response is re-stamped with the current request's id rather than the original caller's.

**Error codes** are derived from the HTTP status — `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `UNPROCESSABLE_ENTITY`, `RATE_LIMITED`, `SERVICE_UNAVAILABLE`, `INTERNAL_ERROR` — so the set stays closed and predictable; the `message` says which resource was involved. Field-level validation messages land in `details`. `HttpExceptionFilter` catches everything, including non-HTTP errors, which become a generic 500 with the real message logged rather than returned.

Swagger `@ApiResponse` types describe the **`data` payload**, not the envelope.

## Authentication & authorization

Custom JWT, access + refresh — self-issued and rotated, not OAuth2/OIDC. Endpoints:

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /api/v1/auth/login` | public | Username + password → token pair |
| `POST /api/v1/auth/refresh` | public | Rotate a refresh token into a new pair |
| `POST /api/v1/auth/logout` | public | Revoke a refresh token (204) |
| `GET /api/v1/auth/me` | bearer | Caller with roles, permissions and scopes |

Send `X-Device-ID` on login/refresh to record which tablet a session belongs to.

**Access tokens are minimal.** They carry only `sub`, `username` and `type` — roles, permissions and scopes are reloaded from the database on every request. A deactivated user or a revoked grant takes effect immediately rather than when the token expires (ADR-004).

**Refresh tokens are opaque and single-use.** Random 384-bit strings, stored only as a SHA-256 hash, revoked and replaced on each refresh. Presenting an already-rotated token is treated as a possible theft: every live token for that user is revoked.

### Guards

Three global guards run in order, so a new endpoint is protected the moment it exists:

1. `JwtAuthGuard` — authenticates unless the route is `@Public()`.
2. `RbacGuard` — requires every code in `@RequirePermissions(...)`.
3. `ScopeGuard` — requires the request's factory / location id to be in the caller's scope, for routes declaring `@RequireFactoryScope` / `@RequireLocationScope`.

```ts
@RequirePermissions(PERMISSIONS.STOCK_TRANSFER)
@RequireFactoryScope({ in: 'params', key: 'factoryId' })
@Post(':factoryId/transfers')
transfer(@CurrentUser() user: AuthenticatedUser) { ... }
```

Routes that only learn their factory after loading the entity check it in the service via `assertFactoryScope()` (`common/guards/factory-scope.ts`) rather than in `ScopeGuard`. Both return **403 Forbidden** — the request is well-formed, the caller simply may not act in that factory.

Permission matching is exact string equality and **nothing implies anything else** — `STOCK_VIEW` grants no part of `STOCK_ADJUST`, and `SYSTEM_ADMIN` has no bypass; it can do everything only because the seed grants it every code (`Backend/CLAUDE.md` §4). Codes live in `src/shared/constants/permissions.ts`; default role grants in `src/shared/constants/roles.ts`.

### Seed accounts

`npm run db:seed` creates the 22 permissions, the 5 roles with their grants, and one admin user — `admin` / `ChangeMe123!` by default, overridable with `SEED_ADMIN_USERNAME` and `SEED_ADMIN_PASSWORD`. Development only.

The seed also scopes that admin to the seeded factory and its three locations. Without those rows `ScopeGuard` fails closed, so any route declaring a scope requirement would refuse for everyone.

A second account, `approver` / `ChangeMe123!` (`SEED_APPROVER_USERNAME`, `SEED_APPROVER_PASSWORD`), holds the `APPROVER` role scoped to the same factory. This one is not cosmetic: `/exchanges/{id}/fragment` with `NOT_FOUND` resolves its recipient by role plus factory scope and returns 409 when none exists, so without it a `BROKEN` exchange with a missing fragment cannot be raised at all.

## Exchange API

One endpoint per state transition; paths follow `../Docs/12-OpenAPI-Swagger-Specification.md`.

| Endpoint | Transition | Permission |
|---|---|---|
| `POST /api/v1/exchanges` | → `CREATED` | `EXCHANGE_CREATE` |
| `POST /api/v1/exchanges/{id}/operator` | `CREATED` → `OPERATOR_IDENTIFIED` | `EXCHANGE_CREATE` |
| `POST /api/v1/exchanges/{id}/type` | `OPERATOR_IDENTIFIED` → `EXCHANGE_TYPE_SELECTED` | `EXCHANGE_CREATE` |
| `POST /api/v1/exchanges/{id}/fragment` | → `FRAGMENT_CHECK` or `CONFIRMATION_PENDING` | `EXCHANGE_CREATE` |
| `POST /api/v1/exchanges/{id}/new-needle` | `EVIDENCE_CAPTURED` → `NEW_NEEDLE_SELECTED` | `EXCHANGE_CREATE` |
| `POST /api/v1/exchanges/{id}/issue` | `NEW_NEEDLE_SELECTED` → `NEEDLE_ISSUED` | `EXCHANGE_ISSUE` |
| `POST /api/v1/exchanges/{id}/store-used-needle` | `NEEDLE_ISSUED` → `USED_NEEDLE_STORED` | `EXCHANGE_CREATE` |
| `POST /api/v1/exchanges/{id}/complete` | `USED_NEEDLE_STORED` → `COMPLETED` | `EXCHANGE_COMPLETE` |
| `GET /api/v1/exchanges/{id}`, `GET /api/v1/exchanges` | — | `EXCHANGE_VIEW` |

| `POST /api/v1/exchanges/{id}/evidence` | → `EVIDENCE_CAPTURED` when the mandatory set completes | `EXCHANGE_CREATE` |
| `GET /api/v1/exchanges/{id}/evidence` | — | `EXCHANGE_VIEW` |

| `POST /api/v1/exchanges/{id}/cancel` | any non-terminal → `CANCELLED` | `EXCHANGE_CANCEL` |

Transition rules live in `src/modules/exchange/services/exchange-state-machine.ts` as pure functions — no Prisma, no Nest — so every legal and illegal move is unit tested without a database. A rejected transition returns **409**, not 400: the request may become valid once the exchange advances.

`/type` writes the transient `NEEDLE_SELECTED` state and `EXCHANGE_TYPE_SELECTED` in one transaction; it has no endpoint of its own. `BENT` and `CHANGEOVER` skip `FRAGMENT_CHECK` entirely and go straight to evidence. On a `BROKEN` exchange, `fragmentStatus: NOT_FOUND` raises a `PENDING` Confirmation and parks the exchange at `CONFIRMATION_PENDING` until it is approved.

`/issue` is a single transaction: conditional decrement of the trolley balance, an `ISSUE` row in `stock_movements`, then the state change. The decrement is a compare-and-set (`quantity >= requested`), so concurrent issues cannot both pass a stock check and drive the balance negative.

A shortfall raises `InsufficientStockError` — a domain error, since it happens inside a transaction where HTTP means nothing — which is mapped to **409** at the service boundary and is the only condition that triggers the stock-blocked notification. Matching by type rather than by exception class means any other failure escaping the transaction propagates untouched and never reaches a PIC as a false stock alert.

## Confirmation API

Raised automatically when a `BROKEN` exchange reports `fragmentStatus: NOT_FOUND`. Paths per Docs/12 §11 (Docs/05 §24's `/approvals` group is stale and not implemented).

| Endpoint | Permission |
|---|---|
| `GET /api/v1/confirmations` | `CONFIRMATION_VIEW` |
| `GET /api/v1/confirmations/{id}` | `CONFIRMATION_VIEW` |
| `POST /api/v1/confirmations/{id}/approve` | `CONFIRMATION_APPROVE` |
| `POST /api/v1/confirmations/{id}/reject` | `CONFIRMATION_REJECT` |

Lifecycle is `PENDING → APPROVED / REJECTED / EXPIRED`. `reason` is optional on approval and mandatory on rejection — enforced at the DTO and again by a database CHECK.

**Deciding never moves the exchange.** An approved exchange still sits at `CONFIRMATION_PENDING` until evidence is captured; a rejected one sits there until an admin cancels it. There is no `BLOCKED` state — that is a description of the stuck condition, not a value (CONTEXT.md).

Any approver scoped to the exchange's factory may decide. `requestedToUserId` records who was *notified*, not the only person allowed to answer — binding the decision to one account would stall exchanges whenever that person is off shift. The real decider is recorded on the `confirmation_decisions` row.

Approve and reject are POSTs, so the idempotency middleware covers them too.

## Audit trail

`AuditLogInterceptor` writes an `audit_logs` row for every route carrying `@Audit(...)`. Services never log for themselves (`Backend/CLAUDE.md` §4), so adding an audited action is one decorator.

| Action | Route | Entity |
|---|---|---|
| `CREATE_EXCHANGE` | `POST /exchanges` | Exchange |
| `ISSUE_NEEDLE` | `POST /exchanges/{id}/issue` | Exchange |
| `CANCEL_EXCHANGE` | `POST /exchanges/{id}/cancel` | Exchange |
| `APPROVE_CONFIRMATION` | `POST /confirmations/{id}/approve` | Confirmation |
| `REJECT_CONFIRMATION` | `POST /confirmations/{id}/reject` | Confirmation |

`LOGIN`, `DEVICE_BIND` and `DEVICE_REVOKE` from CLAUDE.md §4 belong to their own modules' future tickets.

### Querying the trail

`GET /api/v1/audit-logs` — paginated, newest first, requires `AUDIT_VIEW`. Filters per Docs/12 §17: `factoryId`, `actorUserId`, `entityType`, `entityId`, `action`, `dateFrom`, `dateTo`, `page`, `pageSize`. Anything else is rejected by the global whitelist.

Results are scoped in the query, never in memory, so a caller cannot page into another factory's history. A requested `factoryId` is intersected with the caller's scope, so the filter can only narrow. Records with no `factoryId` are excluded — they cannot be shown to be in scope, so the check fails closed.

Ordering is `timestamp desc, id desc`; the tiebreaker keeps paging stable when rows share a timestamp. `pageSize` is capped at 100.

**Read-only.** No create, update or delete route exists — `AuditLogInterceptor` remains the only writer, which is what makes these records evidence.

**Only successful actions are recorded.** The interceptor sits on the success path, so a refused issue or a second decision attempt leaves no row — an audit trail should describe what happened, not what was attempted.

**The row is written before the response is released**, not in the background: a caller must never observe a committed action whose trail has not landed. It is still a separate write from the handler's transaction, because an HTTP interceptor runs after that transaction commits. `Docs/12` §`/issue` sketches "Create Audit" inside the issue transaction, which cannot hold together with CLAUDE.md §4's interceptor mandate; the binding project rule wins. The exposure is one-directional — an audit row can never describe a rolled-back action, though a committed action could in principle miss its row if the audit insert itself fails.

`beforeData` is deliberately null: an interceptor sees only the response, and capturing prior state would mean services logging their own changes. `afterData` keeps identifiers and state; bulk fields like evidence are dropped.

Deleting a user nulls `actorUserId` rather than removing the row — audit history outlives the account.

## Notifications

Outbound WhatsApp only, via Meta Cloud API. **ADR-006 and round 4 Q12: there is no inbound webhook at all** — `WhatsAppPort` has no receive method, so no message from WhatsApp can reach a mutation. Approve and reject happen solely through the authenticated confirmation endpoints. `Docs/14` §7-8 is superseded.

Three triggers, all dispatched through BullMQ off the request path:

| Trigger | Recipient | Template |
|---|---|---|
| Confirmation raised (`BROKEN` + `NOT_FOUND`) | assigned approver | `BROKEN_NEEDLE_CONFIRMATION` |
| Confirmation approved or rejected | the exchange's PIC | `NEEDLE_CONFIRMATION_DECIDED` |
| Exchange stuck (rejected, or stock-blocked) | the exchange's PIC | `NEEDLE_EXCHANGE_STUCK` |

**Notifications are queued after the transaction commits, never inside it.** A queued job is not rolled back with the database, so enqueuing inside a transaction would announce events that never happened. Every `notify*` call is also failure-swallowing: a WhatsApp outage logs and moves on rather than failing an exchange transition on the factory floor (Docs/14 §14).

**The stock-blocked notice is emitted from the rolled-back path.** When `/issue` refuses for insufficient stock the transaction has already rolled back — no movement, no balance change, and the exchange still sits at `NEW_NEEDLE_SELECTED`, because "Blocked" is not a state (CONTEXT.md). The *attempt* is real, though, so the notice is queued from the catch block after rollback. Deduplicated per (exchange, reason), so an offline-first client retrying ten times still notifies the PIC once.

**Template parameters are ordered by the template, not by the payload.** `TEMPLATE_VARIABLES` in `notification.templates.ts` declares each template's body parameters in the order Meta substitutes them — `BROKEN_NEEDLE_CONFIRMATION` mirrors the body in Docs/14 §6 line for line. Dispatch projects the stored payload through that list, so reordering fields in a service cannot reorder a message a supervisor reads. Missing parameters and unknown template codes fail the notification immediately rather than retrying, since a retry would resend the same defect; keys the template does not declare are dropped.

Idempotency is a unique `dedupe_key` of type, subject, template and recipient — Docs/14 §11 made the database's job rather than a racy read-then-write. Dispatch retries three times with exponential backoff and only marks `FAILED` on the last attempt; a recipient with no phone number fails immediately, since retrying cannot help.

Recipients need `users.phone_number`. The seeded `approver` gets a dev placeholder; real numbers come from user administration.

### Confirmation expiry

A BullMQ job sweeps every 5 minutes and flips `PENDING` confirmations past `dueAt` to `EXPIRED`; `dueAt` comes from `CONFIRMATION_TTL_HOURS` (default 24) at creation time. No decision row is written — nobody decided, the clock ran out.

It is a sweep rather than one timer per confirmation so a restart or an outage cannot strand a confirmation pending forever. If Redis is unreachable the schedule fails to register and the API logs an error but still starts: confirmations expiring late is degraded, refusing to serve the factory floor is worse.

### Cancellation and stock reversal

`POST /exchanges/{id}/cancel` takes a mandatory `reason` and works from **any non-terminal state** — including the stuck ones, since cancelling is precisely how a rejected confirmation or a stock-blocked exchange gets released. A `COMPLETED` exchange cannot be cancelled (Docs/03 UC-MOB-014).

Cancelling **after `NEEDLE_ISSUED`** does not fail; it reverses the stock (Docs/02 §22-23):

```
Issue:      Trolley -1
Reversal:   Trolley +1
```

In one transaction the service returns the issued quantity to the trolley balance and writes a `REVERSAL` movement whose **destination** is the trolley — the mirror of the ISSUE, which had it as the source. The original ISSUE row is never deleted. Before `NEEDLE_ISSUED` no stock was ever taken, so cancellation only sets the state, `cancelledAt` and `cancellationReason`.

The reversal sums the exchange's `ISSUE` movements and subtracts anything already reversed, so a retry after a crash cannot double-credit the trolley.

### Evidence

`multipart/form-data` with fields `file`, `evidenceType` (`OLD_NEEDLE` / `BROKEN_FRAGMENT` / `OTHER`) and an optional `capturedAt`. Accepts JPEG, PNG and WebP up to 10 MB.

The binary goes to MinIO; the database keeps metadata and the key only, shaped `exchanges/{yyyy}/{mm}/{exchangeId}/{evidenceId}.{ext}`. `GET` returns 15-minute presigned URLs, so image bytes never stream through this API.

**Mandatory set** (round 4 Q9): `OLD_NEEDLE` always, `BROKEN_FRAGMENT` only when fragment status is `FOUND`, `OTHER` never. The exchange advances to `EVIDENCE_CAPTURED` on the upload that first completes that set — every response carries `exchangeStatus` and the still-`outstanding` types. A later optional `OTHER` upload is accepted without attempting a second transition.

An upload while a confirmation is still `PENDING` stores the photo and returns **409**: the evidence is kept, only the transition is refused. The row is written before the object is stored, so a storage failure leaves a `FAILED` record rather than a silent gap.

Storage sits behind `ObjectStoragePort` in `src/integrations/object-storage/`. `MinioObjectStorageAdapter` is the only file that knows MinIO exists — swapping providers is one line in `ObjectStorageModule` (Docs/19 §5).

## Health probes

Two operational routes, both unauthenticated and both **outside** the `/api/v1` prefix, so an orchestrator's probe URL survives an API version bump:

| Route | Answers |
|---|---|
| `GET /health` | Liveness — the process is responding. Touches no dependency, so it cannot fail for something a restart will not fix. |
| `GET /ready` | Readiness — the database and the queue backend both answered. Returns 503 when either does not. |

Both return `{ status, timestamp }` and nothing else: an unauthenticated endpoint should describe neither its version nor which dependency is down. The detail goes to the logs.

`main.ts` calls `enableShutdownHooks()`, so SIGTERM drains in-flight BullMQ jobs and closes the Prisma pool rather than severing them.

### Record retention

An hourly BullMQ sweep clears records that can no longer be used:

- **Idempotency keys** past `expires_at`, which the middleware now stamps at insert from `IDEMPOTENCY_RETENTION_HOURS` (default 24). Rows written before that stamping existed are collected by age instead. Keep the window comfortably longer than the mobile client's offline retry horizon — past it, an identical retry runs for real rather than replaying.
- **Refresh tokens** past `expires_at` — **and only those**. A revoked-but-unexpired token is deliberately kept, because rotation recognises a replay by finding that revoked row and revoking the whole family; deleting it early would turn "already used" into "unknown token" and lose the theft signal.

### Idempotency

`IdempotencyKeyMiddleware` runs on every POST. It reads the `Idempotency-Key` header, falling back to `clientTransactionId` in the body, and stores the first response so a retry replays it rather than re-running the command (ADR-005). Reusing a key with a different body returns **422**; a retry arriving while the first is still running returns **409**. Failed commands release their key so a retry can genuinely re-run.

## Seed data

`npm run db:seed` is idempotent — every step upserts, so re-running against a populated database changes nothing. It is split by domain under `src/database/seeds/`: `identity.seed.ts`, `master-data.seed.ts`, orchestrated by `seed.ts`.

Master data is the minimum viable factory floor — enough to drive one exchange end to end:

| Entity | Seeded |
|---|---|
| Factory | `FAC-A` |
| Locations | `WH-01` (warehouse), `TRL-A-01` (trolley), `UNS-01` (used-needle storage) |
| Trolley | `A-01`, owning `TRL-A-01` |
| Device | `NM-TAB-001`, bound to trolley `A-01` |
| Employee + RFID | `EMP-0001`, card `RFID-0001` |
| Needle types | `DBX1-11`, `DBX1-14` |
| Exchange types | `BROKEN` (requires fragment validation), `BENT`, `CHANGEOVER` |
| Storage mappings | all three exchange types → `UNS-01` |
| Inventory balances | 500 per needle type in the warehouse, 20 on the trolley |

A trolley is an inventory location, not merely a device (ADR-003), which is why the trolley owns a `TROLLEY`-typed location rather than holding stock directly.

## Folder layout

Package-by-feature per `../Docs/19-Backend-Folder-Structure.md`:

```
src/
├── config/          # env loading + boot-time validation
├── common/          # guards, interceptors, filters, pipes, middleware (cross-cutting)
├── database/seeds/  # development seed data
├── modules/         # one folder per domain module (12 total, listed in CLAUDE.md §3)
├── integrations/    # external adapters: whatsapp, object-storage, rfid-adapter
├── jobs/            # BullMQ processors: confirmation-expiry, notification-dispatch, record-retention
└── shared/          # constants, enums, pure utils — no dependency on any module
```

`identity`, `exchange`, `approval`, `audit` and `notification` hold code; the other seven modules are empty folders whose schema is seeded but whose modules are future work. They fill in ticket by ticket (`.scratch/exchange/issues/`); a 13th module needs agreement (CLAUDE.md §3).

## Deviations from Docs/19

- **Migrations live in `prisma/migrations/`, not `src/database/migrations/`.** Prisma owns that directory by convention and its CLI won't read another location. `src/database/seeds/` stays where Docs/19 put it.
- **`entities/` folders are not created.** With Prisma the schema is `prisma/schema.prisma` and model types are generated — per-module `entities/` folders would be empty forever. Docs/19 §5 anticipated this: it left the folder's content dependent on the ORM decision.
- **`docker-compose.yml` bundles Postgres + Redis + MinIO**, not "PostgreSQL + backend" as Docs/19 sketched. Redis and MinIO became stack decisions after that document was written, and running the API on the host keeps hot reload fast.
