# Backend ↔ WebApps Gap Analysis

**Date:** 2026-08-13
**Method:** source inspection only. No code was modified. Every contract claim below is verified against running source — controllers, DTOs, services, repositories, Prisma schema, WebApps data-sources and components. Where `Docs/` and code disagree, code is treated as the source of truth and the disagreement is recorded rather than silently resolved.

> **Location note.** The request named `docs/architecture/`. This repository's root documentation directory is `Docs/` (capital D) and there is no lowercase `docs/`; seven pointers were just corrected for exactly that drift. These artifacts therefore live in `Docs/architecture/`.

---

## 1. Executive summary

The two halves of this system are in unusually good shape *individually* and are joined by a very thin seam.

**The backend implements 22 routes across 5 of its 12 planned modules.** Auth, exchange, approval and audit are complete, transactional, scope-enforced and audited. Seven modules — `device`, `employee`, `master-data`, `inventory`, `reporting`, `synchronization`, `rfid` — are empty folders whose Prisma schema is seeded but whose HTTP surface does not exist.

**The WebApps app has 4 working screens against 20 declared navigation entries.** Four feature modules (auth, transactions/exchange, confirmation, audit) call real endpoints; one (dashboard) runs on fixtures behind an explicit ADR; four (administration, analytics, inventory, master-data) are one-line `index.ts` stubs.

The single most important finding is not a defect — it is a shape. **WebApps has been disciplined about not inventing contracts.** Every `data-source.ts` carries a comment naming the backend file and line it mirrors; `transactions/api/types.ts` explicitly refuses to type operator or needle-type *names* because the backend does not return them; `exchange-filters.tsx` renders exactly the two filters the API implements rather than the thirteen `Docs/12` describes. There is one fixture module and it is sanctioned by `Docs/adr/0001`. This means the gap list below is almost entirely *missing backend capability*, not frontend drift to unwind.

The dominant cross-cutting gap is **name resolution**. The backend returns foreign keys and no labels. Every list and detail screen in the app currently renders raw UUIDs where a human expects "Trolley A-01" or "Budi Santoso". This is not one bug in one module; it is the same gap appearing in Exchange, Confirmation, Audit, the factory scope selector, and — prospectively — every screen not yet built.

The smallest dependency chain that unlocks the most WebApps modules is **read-only master-data endpoints**. See §14.

**Counts by classification.** Two registers, counted separately so nothing is double-counted: the 14 actionable items in [`backend-webapps-action-plan.md`](./backend-webapps-action-plan.md), and the 7 documentation-drift items in §13 below.

| Classification | Action-plan items | Drift register (§13) |
|---|---|---|
| REAL_API_GAP | 8 | 1 (DD-5, same as GAP-12) |
| WEBAPP_GAP | 3 | — |
| CONTRACT_DRIFT | 1 (GAP-11) | 4 (DD-1…DD-4) |
| FRONTEND_ASSUMPTION | 1 (GAP-02) | — |
| DOCUMENTATION_GAP | 1 (GAP-14) | 2 (DD-6, DD-7) |
| PRODUCT_DECISION | 4 (PD-1…PD-4) | — |
| NOT_APPLICABLE | 1 (dashboard fixtures, §10) | — |

Three frontend assumptions are described in §11; only FA-1 is actionable as its own item (GAP-02), FA-2 folds into GAP-09 and FA-3 into GAP-10.

---

## 2. Backend module / API inventory

Registered in `Backend/src/app.module.ts:53-59`: `PrismaModule`, `IdentityModule`, `ExchangeModule`, `ApprovalModule`, `AuditModule`, `NotificationModule`, `RetentionModule`. Notification and Retention expose no HTTP surface.

All routes are prefixed `/api/v1` (`Backend/src/bootstrap.ts`, URI versioning, default version `1`).

### Identity — `src/modules/identity/controllers/auth.controller.ts`

| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | `/auth/login` | `@Public()` | returns `LoginResponseDto` (tokens + user) |
| POST | `/auth/refresh` | `@Public()` | rotates the refresh token (single-use) |
| POST | `/auth/logout` | `@Public()` | 204, revokes a refresh token |
| GET | `/auth/me` | authenticated, no permission | `MeResponseDto` — roles, permissions, `factoryIds`, `locationIds` |

`/auth/me` is the whole client authorization model in one call, and WebApps consumes it correctly.

### Exchange — `src/modules/exchange/controllers/exchange.controller.ts`

| Method | Path | Permission | Audit |
|---|---|---|---|
| POST | `/exchanges` | `EXCHANGE_CREATE` | `CREATE_EXCHANGE` |
| POST | `/exchanges/:id/operator` | `EXCHANGE_CREATE` | — |
| POST | `/exchanges/:id/type` | `EXCHANGE_CREATE` | — |
| POST | `/exchanges/:id/fragment` | `EXCHANGE_CREATE` | — |
| POST | `/exchanges/:id/new-needle` | `EXCHANGE_CREATE` | — |
| POST | `/exchanges/:id/issue` | `EXCHANGE_ISSUE` | `ISSUE_NEEDLE` |
| POST | `/exchanges/:id/store-used-needle` | `EXCHANGE_CREATE` | — |
| POST | `/exchanges/:id/complete` | `EXCHANGE_COMPLETE` | — |
| POST | `/exchanges/:id/cancel` | `EXCHANGE_CANCEL` | `CANCEL_EXCHANGE` |
| GET | `/exchanges/:id` | `EXCHANGE_VIEW` | — |
| GET | `/exchanges` | `EXCHANGE_VIEW` | — |

### Evidence — `src/modules/exchange/controllers/evidence.controller.ts`

| Method | Path | Permission |
|---|---|---|
| POST | `/exchanges/:id/evidence` | `EXCHANGE_CREATE` |
| GET | `/exchanges/:id/evidence` | `EXCHANGE_VIEW` |

### Approval — `src/modules/approval/controllers/confirmation.controller.ts`

| Method | Path | Permission | Audit |
|---|---|---|---|
| GET | `/confirmations` | `CONFIRMATION_VIEW` | — |
| GET | `/confirmations/:id` | `CONFIRMATION_VIEW` | — |
| POST | `/confirmations/:id/approve` | `CONFIRMATION_APPROVE` | `APPROVE_CONFIRMATION` |
| POST | `/confirmations/:id/reject` | `CONFIRMATION_REJECT` | `REJECT_CONFIRMATION` |

### Audit — `src/modules/audit/controllers/audit.controller.ts`

| Method | Path | Permission |
|---|---|---|
| GET | `/audit-logs` | `AUDIT_VIEW` |

### Not implemented

`device`, `employee`, `master-data`, `inventory`, `reporting`, `synchronization`, `rfid` — directories exist under `src/modules/` and are empty. Verified by `ls Backend/src/modules/`.

---

## 3. WebApps module inventory

Routes that exist (`WebApps/src/app/`): `/login`, `/dashboard`, `/transactions/exchange`, `/transactions/exchange/[id]`, `/transactions/confirmation`, `/transactions/confirmation/[id]`, `/administration/audit`. Plus root `page.tsx` and `layout.tsx`.

| Feature module | Files | Data source | State |
|---|---|---|---|
| `auth` | login form/page, `require-auth` | `core/auth/data-source.ts` — real | Working |
| `dashboard` | 8 components, `store.ts` | `api/data-source.ts` — **fixtures** | Fixture-first per `Docs/adr/0001` |
| `transactions` | 9 components, `store.ts` | `api/data-source.ts` — real | Working, name gaps |
| `confirmation` | 5 components, `store.ts` | `api/data-source.ts` — real | Working, name gaps |
| `audit` | 4 components, `store.ts` | `api/data-source.ts` — real | Working, name gaps |
| `administration` | `index.ts` only | — | Stub |
| `analytics` | `index.ts` only | — | Stub |
| `inventory` | `index.ts` only | — | Stub |
| `master-data` | `index.ts` only | — | Stub |

Shared infrastructure (`src/shared/`, `src/core/`) is real and reused: `DataTable` with pagination and column headers, `EmptyState`, `ErrorState`, `StatusBadge`, `PageHeader`, `AppShell`, `Sidebar`, `TopBar`, a Zustand factory-scope store, a TanStack Query provider, and a single Axios client with request-id, idempotency-key and 401-refresh interceptors.

---

## 4. Backend ↔ WebApps mapping matrix

| WebApps module | Backend module | Endpoints used | Backend status |
|---|---|---|---|
| auth | identity | `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` | Complete |
| dashboard | reporting | none — fixtures | **Missing entirely** |
| transactions (exchange) | exchange | `GET /exchanges`, `GET /exchanges/:id`, `GET /exchanges/:id/evidence` | Read path complete |
| transactions (audit timeline) | audit | `GET /audit-logs` | Complete |
| transactions (confirmation panel) | approval | `GET /confirmations/:id`, approve, reject | Complete |
| confirmation | approval | `GET /confirmations`, `GET /confirmations/:id`, approve, reject | Complete |
| audit | audit | `GET /audit-logs` | Complete |
| administration → users | identity (user CRUD) | — | **Missing** |
| administration → roles | identity (RBAC admin) | — | **Missing** |
| administration → devices | device | — | **Missing** |
| inventory (5 screens) | inventory | — | **Missing** |
| master-data (7 screens) | master-data | — | **Missing** |
| analytics | reporting | — | **Missing** |

---

## 5. Endpoint contract comparison

### `GET /exchanges` — the widest drift

**Implemented** (`ListExchangesQueryDto`, `exchange-request.dto.ts:96-126`): `factoryId`, `trolleyId`, `status`, `page`, `pageSize`. Five parameters.

**Documented** (`Docs/12` §608, line 608-628): `factoryId`, `trolleyId`, `deviceId`, `operatorId`, `exchangeTypeId`, `oldNeedleTypeId`, `newNeedleTypeId`, `status`, `dateFrom`, `dateTo`, `search`, `page`, `pageSize`. Thirteen parameters.

Eight documented filters do not exist: `deviceId`, `operatorId`, `exchangeTypeId`, `oldNeedleTypeId`, `newNeedleTypeId`, `dateFrom`, `dateTo`, `search`.

WebApps sends only the five real ones (`transactions/api/data-source.ts:15-21`) and its type comment says so explicitly. **The frontend is correct; the document is aspirational.** Classification: CONTRACT_DRIFT — and, for the date range which Docs/18 §12 shows in the Exchange screen mockup, REAL_API_GAP.

**Two validation defects inside the five that do exist:**

- `status` is declared `@IsString()` with no enum constraint (`exchange-request.dto.ts:111-113`), then cast unchecked into Prisma: `state: query.status ? (query.status as ExchangeState) : undefined` (`exchange.service.ts:637`). Any string that is not a valid `ExchangeState` reaches the ORM and raises a Prisma validation error — surfacing as **500, not 400**. The DTO whitelist is the input boundary and this field escapes it.
- `trolleyId` is declared `@IsUUID()` (`exchange-request.dto.ts:104-105`), but the UI renders it as a free-text input labelled "Trolley ID" (`exchange-filters.tsx:41-47`). Any human-readable trolley code — the only thing a user would type — fails validation and returns **400**, which the screen presents as an error rather than as an empty result. The filter is broken as shipped for realistic input.

### `GET /confirmations`

Implemented (`ListConfirmationsQueryDto`): `status` (`@IsEnum(ConfirmationStatus)`), `factoryId` (`@IsUUID()`), `page`, `pageSize`. WebApps sends exactly these four. **No drift.**

### `GET /audit-logs`

Implemented (`AuditQueryDto`): `factoryId`, `actorUserId`, `entityType`, `entityId`, `action`, `dateFrom`, `dateTo`, `page`, `pageSize`. WebApps sends exactly these nine. `Docs/12` §17 matches field for field. **No drift — the one place doc, code and client all agree.**

### Documented endpoints that do not exist

From `Docs/12`, verified absent from the route table in §2:

| Documented | Doc §/line | Blocks |
|---|---|---|
| `/factories` (6 routes) | §222, L225-230 | factory names, Master Data |
| `/locations` | §245 | Master Data → Storage |
| `/trolleys` (4 routes) | §276, L279-282 | trolley filter, Master Data |
| `/devices` (5 routes) | §299, L302-306 | Administration → Devices |
| `/employees`, `/rfid/cards/{id}` | §320, L323-324 | operator names, Master Data |
| `/needle-types` (6 routes) | §352, L355-360 | needle-type names, Master Data |
| `/exchange-types` | §377 | exchange-type names, Master Data |
| `/inventory/*` (11 routes) | §823-998 | Inventory (5 screens) |
| `/dashboard/*` (4 routes) | §1023-1088 | Dashboard real data, Analytics |
| `/users/*` (8 routes) | §1106-1118 | Administration → Users, user names |
| `/mobile/bootstrap`, `/mobile/sync` | §1163, §1192 | mobile client only |
| `GET /health`, `GET /ready` | §5 area | deployment probes |

### Implemented endpoints not represented in WebApps

The nine exchange write transitions (`/operator`, `/type`, `/fragment`, `/new-needle`, `/issue`, `/store-used-needle`, `/complete`, `/cancel`) and `POST /exchanges/:id/evidence`.

Eight of these are trolley-floor PIC operations performed on the Flutter client; their absence from a supervisor web app is correct. **`POST /exchanges/:id/cancel` is the exception** — cancelling a stuck exchange is plausibly a supervisor action, `EXCHANGE_CANCEL` is a distinct permission, and `ARCHITECTURE.md` notes a blocked exchange "advances again only when the blocker clears, or stops permanently when someone cancels it". Whether that someone can be a web supervisor is not answerable from code. Classification: PRODUCT_DECISION.

---

## 6. RBAC and scope comparison

**Backend is the authority and behaves correctly.** Three independent layers, verified:

- `JwtAuthGuard` rebuilds authorization state from the database per request; access tokens carry only `sub`, `username`, `type`.
- `RbacGuard` requires every code in `@RequirePermissions(...)`, exact string match, no implication (`permissions.ts:13-14`).
- Factory scope is enforced **at the query level** on all three list endpoints, and never widens:
  - `exchange.service.ts:633-635` — `query.factoryId ? { in: user.factoryIds.filter(id => id === query.factoryId) } : { in: user.factoryIds }`
  - `confirmation.service.ts:143-145` — identical pattern
  - `audit.service.ts:45-47` — identical pattern

  A caller requesting a factory outside their scope gets an empty intersection, not someone else's data. Detail routes use `assertFactoryScope()` and throw 403.

**WebApps treats permissions as UX guards only, which is correct**, but the implementation is duplicated:

| Site | Check |
|---|---|
| `audit/components/audit-log-page.tsx:32` | `currentUser?.permissions.includes("AUDIT_VIEW") ?? false` |
| `transactions/components/audit-timeline.tsx:28` | `currentUser?.permissions.includes("AUDIT_VIEW") ?? false` |
| `transactions/components/confirmation-panel.tsx:44` | `currentUser?.permissions.includes("CONFIRMATION_APPROVE") ?? false` |
| `transactions/components/confirmation-panel.tsx:45` | `currentUser?.permissions.includes("CONFIRMATION_REJECT") ?? false` |

`WebApps/src/core/permissions/index.ts` is a single line: `export {};`. The shared home for this exists and is empty, so four call sites each re-derive the same expression. Classification: WEBAPP_GAP.

**The sidebar is not permission-filtered at all.** `nav-config.ts:36` states "Actual visibility is permission-driven at render time once core/permissions ships" — it has not shipped. Every authenticated user sees all 20 entries regardless of their permission set. Not a security hole (the backend refuses), but a user without `STOCK_VIEW` is shown five Inventory links.

**Location scope is fetched and unused.** `MeResponseDto.locationIds` is returned by `/auth/me` and typed in `core/auth/types.ts:40`, but no WebApps screen reads it. Not a defect today — no shipped screen is location-scoped — but it is the second scope dimension and Inventory will need it.

---

## 7. DTO / response comparison

**The envelope is correct and mirrored exactly.** `ResponseFormatInterceptor` (`response-format.interceptor.ts:41-55`) flattens a paginated payload into `data: items` with `meta: { requestId, page, pageSize, total, totalPages }`, and wraps everything else as `{ success, data, meta: { requestId } }`. `WebApps/src/core/api/client.ts:48-70` declares precisely this. `totalPages` is computed by the interceptor, not by any DTO — and `confirmation/api/types.ts:53` correctly documents that. No drift.

**Field-level comparison, per module:**

| Backend DTO | WebApps type | Match |
|---|---|---|
| `ExchangeResponseDto` (16 fields) | `ExchangeListItem` (16 fields) | Exact |
| `ConfirmationResponseDto` + `ConfirmationDecisionDto` | `Confirmation` + `ConfirmationDecision` | Exact |
| `AuditLogResponseDto` (11 fields) | `AuditLogEntry` (11 fields) | Exact |
| `MeResponseDto` (7 fields) | `CurrentUser` (7 fields) | Exact |
| `EvidenceListItemDto` | `EvidenceItem` (11 fields) | Exact |
| — | `DashboardOverview`, `ExchangeTrendPoint` | Copied from `Docs/12` §15 example JSON, unverified |
| — | `NeedleConsumptionItem`, `StockSummary` | **Invented** — `Docs/12` gives no example payload |

`GET /exchanges/:id` returns the identical DTO as the list — there is no richer detail projection. `transactions/api/types.ts:74` types this honestly as `export type ExchangeDetail = ExchangeListItem`. Any detail screen wanting more than the list carries must first get the backend to project more.

---

## 8. Pagination, sorting and filtering

**Pagination is consistent and correct everywhere.** All three list endpoints: 1-based `page`, `pageSize` capped at 100 (`exchange.service.ts:629`, `confirmation.service.ts:137`, `audit.service.ts:41`), `$transaction([findMany, count])` so the page and the total are read consistently. The client reads `meta.page/pageSize/total/totalPages` with sensible fallbacks.

**Sorting does not exist as a contract.** No list endpoint accepts a sort parameter. Each has one hardcoded order:

| Endpoint | Order | Source |
|---|---|---|
| `GET /exchanges` | `createdAt desc` | `exchange.repository.ts:41` |
| `GET /confirmations` | `requestedAt desc` | `confirmation.service.ts:152` |
| `GET /audit-logs` | `timestamp desc, id desc` | `audit.service.ts:65` |

Audit is the only one with a tiebreaker, which is the correct choice — without it two rows in the same millisecond can swap between pages and silently hide or repeat a record. **`GET /exchanges` and `GET /confirmations` lack that tiebreaker and have the same latent defect**, less likely to fire because their timestamps are coarser.

WebApps has not added client-side sorting to compensate: `transactions/api/data-source.ts:10-11` carries an explicit instruction not to invent `sortBy`/`sortOrder`. Correct discipline. But `DataTable` uses `@tanstack/react-table`, whose column headers imply sortability — any future work must not wire a header to a parameter that does not exist.

**Filters** are covered in §5. Summary: audit is complete, confirmation is complete, exchange has 5 of 13 documented and two of the five are defective.

---

## 9. Name resolution and relationship gaps

**This is the largest single cross-cutting gap in the system.** The backend returns foreign keys; nothing resolves them to labels; every affected screen renders a UUID.

| Field | Returned as | Screen impact | Resolvable today? |
|---|---|---|---|
| `exchange.trolleyId` | UUID | Exchange list column | No — no `/trolleys` |
| `exchange.operatorId` | UUID | Exchange detail | No — no `/employees` |
| `exchange.exchangeTypeId` | UUID | Exchange list + detail | **Yes — see below** |
| `exchange.oldNeedleTypeId` / `newNeedleTypeId` | UUID | Exchange detail | No — no `/needle-types` |
| `exchange.deviceId` | UUID | Exchange detail | No — no `/devices` |
| `exchange.factoryId` | UUID | Every scoped screen | No — no `/factories` |
| `confirmation.requestedToUserId` | UUID | Confirmation list + detail | No — no `/users` |
| `confirmation.decisions[].decidedBy` | UUID | Decision history | No — no `/users` |
| `auditLog.actorUserId` | UUID | Audit "who" column | No — no `/users` |
| `auditLog.factoryId` | UUID | Audit factory column | No — no `/factories` |

WebApps has refused to fabricate any of these, which is the right call and is stated in the code: `transactions/api/types.ts:9-13` ("Deliberately absent: any operator/PIC/exchange-type/needle-type *name*"), `confirmation/api/types.ts:5-7`, `core/permissions/factory-scope.ts:9-16`.

**The factory-scope selector is the most visible symptom.** `useAuthorizedFactories()` (`factory-scope.ts:17-22`) maps each id to `{ id, code: id, name: id }` — the TopBar factory switcher, which appears on every screen, displays raw UUIDs as factory names.

**One of these is nearly free to fix.** `EXCHANGE_CONTEXT_INCLUDE` (`exchange.repository.ts:7-11`) already eager-loads the full `exchangeType` relation on every read — list, detail and every transition — because the state machine needs it. `ExchangeController.toResponse()` (`exchange.controller.ts:43`) then projects only `exchangeTypeId` and discards the row. **The name is already in memory and thrown away.** Adding `exchangeTypeCode`/`exchangeTypeName` to `ExchangeResponseDto` costs no extra query.

---

## 10. Fixture and mock usage

A full scan of `WebApps/src` for fixtures, mocks, TODOs, hardcoded values and fake IDs (excluding test files) returns **exactly one production fixture source**: `features/dashboard/api/fixtures.ts`, consumed only by `features/dashboard/api/data-source.ts`.

This is **permitted and correctly structured**:

- `Docs/adr/0001-dashboard-v1-scoped-to-existing-contract.md` explicitly sanctions fixture-first development for Dashboard v1 behind `api/data-source.ts`, because `Backend/src/modules/reporting` is an empty placeholder.
- The seam is enforced: `data-source.ts:16-18` states that `queries.ts` and every component call only the four exported functions, never `fixtures.ts` or `apiClient` directly. Verified — no component imports `fixtures`.
- The file header carries the exact same-signature replacement body for when reporting ships (`data-source.ts:21-27`).
- An artificial 400 ms latency keeps loading states exercisable rather than instantly resolved.

Classification: NOT_APPLICABLE (sanctioned), with one caveat carried forward as FRONTEND_ASSUMPTION — see §11.

**No other fixture, mock, fake ID, or hardcoded permission exists in production code.** The `mock-current-user.ts` helper is under `shared/test-utils/` and imported only by `.test.tsx` files. The former hardcoded two-factory fixture in `core/permissions/factory-scope.ts` has already been replaced by real `/auth/me` data.

---

## 11. Frontend assumptions

**FA-1 — Trolley filter assumes a code, backend demands a UUID.** Covered in §5. `exchange-filters.tsx:41-47` renders free text; `ListExchangesQueryDto.trolleyId` is `@IsUUID()`. Shipped-broken for realistic input.

**FA-2 — Two Dashboard response shapes are invented.** `dashboard/api/types.ts:38-65` declares `NeedleConsumptionItem` and `StockSummary`/`StockAlertItem` with a header stating they are "this feature's best-guess shape, not a verified contract" — `Docs/12` §1075 and §1088 describe what those endpoints return *by* (Factory/Trolley/Needle Type/Date) without an example payload. `DashboardOverview` and `ExchangeTrendPoint` are copied field-for-field from the contract's example JSON and are on firmer ground. The assumption is honestly labelled and confined to one file, but when `/dashboard/stock-summary` ships it will likely not match, and `StockAlertItem.factoryName`/`locationName` in particular assume a name-resolution capability the backend does not have anywhere else.

**FA-3 — Sidebar assumes routes that do not exist.** `nav-config.ts` declares 20 navigation entries; 4 resolve. Sixteen links — all of Inventory (5), all of Master Data (7), Administration → Users/Roles/Devices (3), Analytics (1) — navigate to a Next.js 404. Minus the overlap, that is every menu item outside Dashboard, the two Transactions screens and Audit Log.

---

## 12. Shared infrastructure assessment

**Can shared WebApps infrastructure support the unbuilt modules without module-specific hacks?** Mostly yes.

| Concern | State | Verdict |
|---|---|---|
| API client | One Axios instance, request-id, idempotency-key on all mutations, single-flight 401 refresh | Ready |
| Envelope typing | `ApiSuccessBody<T>` / `ApiErrorBody` / `getApiErrorMessage` | Ready |
| Pagination | `DataTable` + `data-table-pagination` | Ready |
| Error / loading / empty | `ErrorState`, `EmptyState` shared components | Ready |
| Factory scope | Zustand store, read by all 4 feature stores, never duplicated | Ready |
| Query layer | TanStack Query provider, per-feature `queries.ts` with key factories | Ready |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` installed | Ready, lightly used |
| **Permission guard** | `core/permissions/index.ts` is `export {}` | **Gap — 4 duplicated inline checks** |
| **Name resolution** | Does not exist | **Gap — blocked on backend anyway** |
| **Sorting** | No shared contract | Gap, but correctly blocked on backend |
| Notifications | `sonner` + `shared/notifications` | Ready |
| Charts | `recharts` + `shared/charts` + `ChartCard` | Ready |

Two genuine shared-infrastructure gaps: a `hasPermission` / `usePermission` helper, and — once master-data lands — a lookup layer that resolves ids to labels once per session rather than per screen. Neither requires a new abstraction pattern; both belong in `core/`.

---

## 13. Documentation drift

Recorded, not resolved. `Docs/` is a historical specification set; the authoritative source for each row is named.

| ID | Drift | Authoritative | Class |
|---|---|---|---|
| DD-1 | `Docs/12` §608 lists 13 filters on `GET /exchanges`; 5 implemented | Code | CONTRACT_DRIFT |
| DD-2 | `Docs/05` §24 defines an `/approvals` endpoint group; `/confirmations` is what exists | Code (`Docs/12` §743) | CONTRACT_DRIFT |
| DD-3 | `Docs/09` §53 documents an envelope with `request_id` inside `error` and `details` as an object; the implementation puts `requestId` in `meta` and `details` as `string[]` | Code (`api-response.dto.ts`) | CONTRACT_DRIFT |
| DD-4 | `Docs/12` §1163/§1192 document `/mobile/bootstrap` and `/mobile/sync` | Neither — `synchronization` unbuilt | CONTRACT_DRIFT |
| DD-5 | `Docs/12` documents `GET /health` and `GET /ready`; neither exists | Doc (they should be built) | REAL_API_GAP |
| DD-6 | `Docs/12` §1075/§1088 define two dashboard endpoints with no example payload | Neither | DOCUMENTATION_GAP |
| DD-7 | `Backend/CLAUDE.md` §4 mandates audit rows for 11 events; `AuditLogInterceptor` is wired to 5 (`CREATE_EXCHANGE`, `ISSUE_NEEDLE`, `CANCEL_EXCHANGE`, `APPROVE_CONFIRMATION`, `REJECT_CONFIRMATION`) | Rule (the other 6 belong to unbuilt modules) | DOCUMENTATION_GAP |

DD-7 is not a defect: `LOGIN`, `TRANSFER_STOCK`, `ADJUST_STOCK`, `CHANGE_MASTER`, `CHANGE_CONFIGURATION`, `DEVICE_BIND`, `DEVICE_REVOKE` all belong to modules that do not exist yet. It is worth stating in the rule so the gap is visible rather than looking like an oversight.

---

## 14. The smallest dependency chain

**Read-only master-data endpoints unlock the most WebApps modules for the least backend work.**

A single `master-data` module exposing `GET /factories`, `GET /trolleys`, `GET /needle-types`, `GET /exchange-types`, `GET /employees` — list and by-id, no writes, scope-filtered like the existing three list endpoints — resolves:

1. **Factory names** in the TopBar scope selector, which appears on every screen in the app.
2. **The trolley filter**, converting a free-text input that 400s into a real select — which simultaneously fixes FA-1 and removes the need for a backend `trolleyId` change.
3. **Needle-type and exchange-type names** in Exchange list and detail.
4. **Operator names** in Exchange detail.
5. **The entire Master Data module** — 7 of the 16 dead navigation links, read-only first.

That is four existing modules improved and one new module unblocked, from one backend module with no transactional or state-machine complexity.

**Second link: read-only `/users`.** Resolves `requestedToUserId`, `decidedBy` and `actorUserId` — completing name resolution in Confirmation and Audit — and unblocks Administration → Users as a read screen.

**Third link: `reporting`.** Unblocks Dashboard's fixture swap and Analytics. Higher cost (aggregation queries, four endpoints, two of them with no documented payload) and it improves one screen that already renders. Correctly third.

**Inventory is deliberately last** among the feature modules: 5 screens, 11 endpoints, stock mutations that must respect ledger discipline and the non-negative invariant, and it is the only remaining module carrying real transactional risk.

---

## 15. Product decisions required

| ID | Question | Why code cannot answer it |
|---|---|---|
| PD-1 | Can a web supervisor cancel a stuck exchange? | `POST /exchanges/:id/cancel` exists with its own `EXCHANGE_CANCEL` permission, but no role assignment or UX spec says whether that permission is ever granted to a web user rather than the trolley PIC. |
| PD-2 | What are the exact payloads for `/dashboard/needle-consumption` and `/dashboard/stock-summary`? | `Docs/12` §1075/§1088 state what they aggregate by, never their shape. WebApps has guessed. Building the backend to match the guess, or the guess to match the backend, is a choice someone must make. |
| PD-3 | Should `GET /exchanges` gain the eight missing documented filters, or should `Docs/12` §608 be narrowed to five? | Both are defensible. Docs/18 §12's Exchange screen mockup shows a date range, which argues for at least `dateFrom`/`dateTo`. |
| PD-4 | Does the WebApp need a location-scoped view at all? | `MeResponseDto.locationIds` is delivered and unused. Whether Inventory screens filter by location scope, or only by factory, determines whether the second scope dimension needs client plumbing. |

---

## 16. Recommended implementation order

Ordered by unlock-per-unit-of-work, with correctness defects first.

1. **Fix `GET /exchanges` input validation** — constrain `status` to the enum so malformed input returns 400 instead of 500. Small, isolated, closes a hole in the DTO boundary. (P0)
2. **Add a shared `hasPermission` helper in `core/permissions`** and filter the sidebar with it. Removes four duplicated checks and stops showing users 15 links they cannot use. Pure WebApps, no backend dependency. (P1)
3. **Build read-only master-data endpoints.** The chain in §14. (P1)
4. **Wire WebApps master-data consumption** — factory names in TopBar, trolley select replacing free text, type names in Exchange screens. (P1)
5. **Project `exchangeType` name onto `ExchangeResponseDto`** — already loaded, currently discarded. (P2, but nearly free)
6. **Read-only `/users`**, then name resolution in Confirmation and Audit. (P2)
7. **`reporting` module**, then swap the Dashboard data-source. (P2)
8. **Add the `id` tiebreaker to exchange and confirmation ordering.** (P2)
9. **Inventory module**, backend then frontend. (P3 for this phase — largest and last)
10. **Record the drift** from §13 in `Docs/`, without rewriting the historical specifications. (P3)

---

## 17. Verification performed

- `Backend/src/app.module.ts` — module registration read directly.
- All 5 backend controllers, all 11 DTO files, 4 services, 1 repository read in full or in the relevant span.
- `Backend/prisma/schema.prisma` enum values cross-checked against `WebApps` type unions.
- All 5 WebApps `data-source.ts` files, all 5 `types.ts` files, `core/api/client.ts`, `core/auth/*`, `core/permissions/*`, `core/security/token-store.ts` read in full.
- `WebApps/src/app/` route tree and `nav-config.ts` enumerated on disk.
- `package.json` scripts and dependencies read on both sides.
- Full-tree scan of `WebApps/src` for fixtures, mocks, TODOs, fake IDs and hardcoded permissions.
- `Docs/12` endpoint inventory extracted by heading scan (lines 105-1192).
- **No lint, build or test run** — no code was changed, so neither would have validated anything this analysis claims.
- **No production code modified.**
