# Architecture

How this codebase is put together and why. Setup and endpoint reference live in [`README.md`](./README.md); binding rules live in [`CLAUDE.md`](./CLAUDE.md); domain vocabulary lives in [`../CONTEXT.md`](../CONTEXT.md).

## Shape

One NestJS service, one PostgreSQL database, modules separated by folder (ADR-001). Not microservices — inventory consistency is far easier to keep inside a single transaction, and the module boundaries are drawn so a module could be extracted later if scale ever demands it.

```
HTTP  →  Guards  →  Middleware  →  Controller  →  Service  →  Prisma  →  PostgreSQL
                                                     │
                                                     ├─→  Ports  →  MinIO / WhatsApp
                                                     └─→  BullMQ  →  Redis  →  Workers
```

Controllers orchestrate only: validate the DTO, call a service, shape the response. Every business rule lives in a service (CLAUDE.md §4).

## Request pipeline

Four things run before a controller method, in this order:

1. **`JwtAuthGuard`** — verifies the bearer token, then rebuilds the caller's authorization state from the database. Registered globally, so a new endpoint is protected the moment it exists and must opt out with `@Public()`.
2. **`RbacGuard`** — requires every permission code in `@RequirePermissions(...)`. Exact string match, no hierarchy, no implication.
3. **`ScopeGuard`** — for routes declaring `@RequireFactoryScope` / `@RequireLocationScope`, requires the request's id to be in the caller's scope list.
4. **`IdempotencyKeyMiddleware`** — on POSTs, stores the first response per (key, endpoint) and replays it on retry.

Two interceptors and a filter shape what comes back:

- **`ResponseFormatInterceptor`** wraps every payload in the `Docs/12` §7 envelope.
- **`AuditLogInterceptor`** writes an `audit_logs` row for routes carrying `@Audit(...)`.
- **`HttpExceptionFilter`** renders every failure in the error envelope.

**Their order is load-bearing.** Nest unwinds interceptors in reverse registration order, so the *last* registered sees the handler's raw result first. `AuditLogInterceptor` is registered after `ResponseFormatInterceptor` precisely so audit snapshots the plain DTO and the formatter wraps afterwards. Swapping them would have audit recording envelopes.

`configureApp()` also enables CORS when `CORS_ORIGINS` is non-empty. It lives there rather than in `main.ts` so the e2e suites exercise the same browser surface the WebApp will meet.

`RequestIdMiddleware` runs before everything and resolves one request id per request — quoted by the envelope, the audit row and any error body, so all three agree.

**Factory scope is checked in two places, with one implementation each.**
`ScopeGuard` covers routes that name their factory in the request. Services use
`assertFactoryScope()` from `common/guards/factory-scope.ts`, because most
routes identify the factory only after loading the entity —
`/exchanges/{id}/issue` carries no factory id a guard could read. Both refuse
with **403**; no service re-derives the check.

**Access tokens carry almost nothing** — `sub`, `username`, `type`. Roles, permissions and scopes are reloaded per request, so a deactivated user or revoked grant takes effect immediately rather than when the token expires. That is ADR-004 applied to authorization: the backend decides, not a token minted minutes ago.

## Module layout

```
src/
├── config/          env loading, Joi validation at boot
├── common/          guards, interceptors, decorators, middleware, interfaces
├── database/        PrismaService (global), seeds
├── modules/
│   ├── identity/    auth, RBAC          (issue 02)
│   ├── exchange/    state machine, evidence, stock issue/reversal (05, 07, 09)
│   ├── approval/    confirmation lifecycle (06)
│   ├── audit/       read-only audit queries (16)
│   └── notification/ outbound dispatch  (08)
├── integrations/    object-storage/, whatsapp/, rfid-adapter/
├── jobs/            BullMQ processors + queue constants
└── shared/          permission/role catalogues, pure utils
```

`device`, `employee`, `master-data`, `inventory`, `reporting`, `synchronization` and `rfid` exist as empty folders — their schema is seeded but the modules are future work.

## Three ideas worth understanding before changing anything

### 1. The state machine is pure

`modules/exchange/services/exchange-state-machine.ts` imports neither Prisma nor Nest. It takes a context and an action and returns the states to write, or throws. That is why all 41 of its tests run without a database, and why the riskiest logic in the system is also the cheapest to verify.

It returns a **path**, not a single state: `/type` writes `NEEDLE_SELECTED` then `EXCHANGE_TYPE_SELECTED` inside one transaction, and a fragment-not-found check passes through `FRAGMENT_CHECK` on its way to `CONFIRMATION_PENDING`. Callers persist the whole path and land on the last entry.

The same file owns `requiresStockReversal()` and `NON_TERMINAL_STATES`, both derived rather than hand-listed, so adding a state cannot silently miss them.

**"Blocked" is not a state.** A rejected confirmation or a stock-refused issue leaves the exchange exactly where it was; it advances again only when the blocker clears, or stops permanently when someone cancels it. Nothing is persisted to mark the stuck condition (CONTEXT.md).

### 2. Stock cannot go negative, and never moves without a ledger entry

Three independent layers:

- **Conditional decrement.** `updateMany` with `quantity: { gte: n }` is a compare-and-set. Two concurrent issues cannot both pass a check and drive the balance below zero; the loser sees `count === 0`.
- **Database CHECK.** `quantity >= 0`, `reserved_quantity <= quantity`, `stock_movements.quantity > 0`. Prisma cannot express these, so they are raw SQL appended to the migrations.
- **Ledger discipline.** Every balance change writes a `stock_movements` row in the same transaction (CLAUDE.md §4). Cancellation after issue reverses by *summing issues minus prior reversals*, so a retry cannot inflate stock.

Direction is carried by `movementType` plus the source/destination pair, never by a negative quantity: an `ISSUE` has the trolley as source, its `REVERSAL` has the trolley as destination.

A shortfall raises `InsufficientStockError` rather than an `HttpException` — it is thrown inside a transaction, where HTTP status codes are meaningless — and the service maps it to 409 on the way out. Domain errors of this shape (`InvalidTransitionError` is the other) exist so callers can branch on *what went wrong* rather than on which exception class happened to surface.

### 3. Side effects happen after the commit, never inside it

Notifications and audit rows are written once the database transaction has succeeded.

The reason is asymmetric and easy to get wrong: a BullMQ job is **not** rolled back with the database, because Redis is not part of the Postgres transaction. Enqueuing inside a transaction that later fails would announce an event that never happened. Writing after commit means the worst case is a missing notification, not a false one.

The stock-blocked notification is the sharpest example — it is queued from the `catch` block, *after* the transaction rolled back. Nothing was persisted, the exchange did not move, but the failed attempt genuinely occurred and the PIC needs to know. It is deduplicated per (exchange, reason) so an offline-first client retrying does not spam.

## External systems

Everything outside the process sits behind a port with a symbol token:

| Port | Adapter | Used by |
|---|---|---|
| `ObjectStoragePort` | `MinioObjectStorageAdapter` | evidence upload |
| `WhatsAppPort` | `MetaCloudWhatsAppAdapter` | notification dispatch |

The adapter is the only file importing the provider SDK; swapping providers is one line in the binding module (Docs/19 §5). `WhatsAppPort` deliberately has **no receive method** — ADR-006 makes WhatsApp one-way, so there is no inbound path to accidentally add later.

## Background work

BullMQ on Redis, registered once in `AppModule`:

| Queue | Job | Owner |
|---|---|---|
| `confirmation-expiry` | 5-minute sweep flipping overdue `PENDING` confirmations to `EXPIRED` | issue 06 |
| `notification-dispatch` | WhatsApp send, 3 attempts with exponential backoff | issue 08 |
| `record-retention` | hourly sweep of expired idempotency keys and refresh tokens | issue 15 |

Both are **sweeps or per-record jobs that tolerate restarts**. The expiry job is a sweep rather than one timer per confirmation precisely so an outage cannot strand a record forever.

Queue name constants live in `jobs/notification.constants.ts` rather than beside the processor: the service enqueues and the processor consumes, so sharing names through the processor file creates an import cycle that leaves the service undefined at injection time.

## Data model notes

28 tables across five migrations. Names follow `Docs/11`; deviations are documented in the schema where they occur. The ones worth knowing:

- **A trolley is an inventory location** (ADR-003), not a device. Stock lives at a `Location`; the trolley owns one of type `TROLLEY`.
- **`exchanges` columns fill in progressively.** `operator_id`, `old_needle_type_id` and `exchange_type_id` are nullable because `POST /exchanges` opens the row knowing only factory, trolley and device. Docs/11 §15 marks them NOT NULL, but it describes a *finished* exchange. Presence is enforced per state by the state machine and rechecked at `/complete`.
- **`exchanges.confirmation_id` was deliberately dropped.** `confirmations.exchange_id` is unique, which already makes the relation one-to-one; keeping both would be a circular foreign key with no insertable order.
- **Two idempotency mechanisms coexist** and serve different layers: `UNIQUE(device_id, client_transaction_id)` on `exchanges` is mobile's per-command dedupe; `idempotency_keys` with `UNIQUE(idempotency_key, endpoint)` backs the middleware across all endpoints.
- **Audit history outlives accounts.** `audit_logs.actor_user_id` is an optional relation, so deleting a user nulls it instead of removing the row.

## Testing

- **Unit tests** cover pure logic without a database: the state machine, the evidence policy, token rotation, the guards, the audit interceptor, notification queueing.
- **E2E tests** run against the real PostgreSQL, Redis and MinIO from `docker-compose`, serially (`maxWorkers: 1`) because they share one database. Evidence tests upload a real PNG and fetch it back through a presigned URL — a mocked port would not prove the adapter, the bucket or the signing.

Each suite creates uniquely-suffixed fixtures and tears them down, so runs coexist with seeded data rather than truncating it.

**Every e2e suite boots through `test/e2e/create-test-app.ts`**, which calls the same `configureApp()` as `main.ts`. Suites must not call `setGlobalPrefix`, `enableVersioning` or `useGlobalPipes` themselves. That rule exists because the two had already drifted: the suites omitted `enableImplicitConversion`, so a numeric query parameter failed validation under test and succeeded in production. Sharing one function makes that class of divergence impossible rather than merely unlikely.

Known remaining differences, all deliberate: Swagger is mounted only in `main.ts`; e2e runs against the development database rather than a dedicated one; and `setup-env.ts` pins short-lived test secrets with a low bcrypt cost for speed.

## Known gaps

Issues 11–17 closed the review's implementation gaps. What remains is the layer between "the code is correct" and "this can be exposed", recorded in [`../.scratch/exchange/final-review.md`](../.scratch/exchange/final-review.md):

- **No rate limiting on `/auth/*`** (HIGH-2) — credential stuffing is unthrottled.
- **An idempotency key can wedge** for the full retention window (HIGH-3) if the first attempt dies between claiming the key and writing its response.
- **Audit rows and notifications are at-most-once** with no reconciliation (HIGH-4). A committed action whose audit insert fails leaves no trail and nothing notices.
- **No health or readiness endpoint, and no `enableShutdownHooks()`** — nothing for an orchestrator to probe, and SIGTERM does not drain in-flight BullMQ jobs.

None of these change the API contract, so client development proceeds against it unaffected.
