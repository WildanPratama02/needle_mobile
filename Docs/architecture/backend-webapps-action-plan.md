# Backend ↔ WebApps Action Plan

**Date:** 2026-08-13 · **Derived from:** [`backend-webapps-gap-analysis.md`](./backend-webapps-gap-analysis.md) · [`backend-webapps-contract-matrix.md`](./backend-webapps-contract-matrix.md)

Ordered queue. Nothing here has been implemented — this phase changed no production code.

**Priority scale**
`P0` blocks authentication, security or data correctness · `P1` blocks a production-ready WebApps module · `P2` important contract or UX improvement · `P3` cleanup, documentation, refactoring.

---

## GAP-01 · `GET /exchanges` accepts any string as `status` and returns 500

- **Classification:** REAL_API_GAP
- **Priority:** **P0**
- **Problem:** The `status` query parameter is validated only as a string, then cast unchecked into a Prisma enum filter. Any value outside `ExchangeState` escapes the DTO whitelist — the request's only input boundary — and fails inside the ORM, surfacing as a 500 instead of a 400. Every other enum-bearing query parameter in the codebase (`ListConfirmationsQueryDto.status`) uses `@IsEnum`; this one does not.
- **Evidence:**
  - `Backend/src/modules/exchange/dto/exchange-request.dto.ts:107-113` — `@ApiPropertyOptional({ enum: ['CREATED','COMPLETED','CANCELLED'] }) @IsOptional() @IsString() status?: string`. The Swagger annotation advertises three values; the validator enforces none; the enum actually has twelve.
  - `Backend/src/modules/exchange/services/exchange.service.ts:637` — `state: query.status ? (query.status as ExchangeState) : undefined`
  - Contrast `Backend/src/modules/approval/dto/confirmation-request.dto.ts:38-41` — `@IsEnum(ConfirmationStatus)`
- **Backend work:** Replace `@IsString()` with `@IsEnum(ExchangeState)` and correct the `@ApiPropertyOptional` enum to the full twelve values, so Swagger, the validator and the Prisma enum finally agree. Remove the now-redundant cast at `exchange.service.ts:637`.
- **WebApps work:** None. `features/transactions/api/types.ts:16-29` already declares all twelve states and sends only valid ones.
- **Documentation work:** None — `Docs/12` §608 does not enumerate status values.
- **Dependencies:** None.
- **Risk:** Low. The valid-value set widens (3 → 12 in the annotation) and the invalid set moves from 500 to 400. No client sends anything else today.
- **Acceptance criteria:**
  - `GET /exchanges?status=NOT_A_STATE` returns 400 with the error envelope, not 500.
  - All twelve `ExchangeState` values return 200.
  - A new e2e case covers both.
  - Existing exchange e2e suites pass unchanged.

---

## GAP-02 · Trolley filter sends free text to a `@IsUUID()` parameter

- **Classification:** FRONTEND_ASSUMPTION
- **Priority:** **P1**
- **Problem:** The Exchange Transactions screen renders a free-text input labelled "Trolley ID". The backend parameter is validated as a UUID. Any human-readable trolley code — the only thing an operator would type — returns 400, which the screen surfaces as an error state rather than an empty result. The filter is broken as shipped for realistic input; it works only if the user pastes a raw UUID.
- **Evidence:**
  - `WebApps/src/features/transactions/components/exchange-filters.tsx:41-47` — `<Input placeholder="Trolley ID" aria-label="Filter by Trolley ID" />`, debounced into the store at line 34
  - `WebApps/src/features/transactions/api/data-source.ts:17` — `trolleyId: filters.trolleyId.trim() === "" ? undefined : filters.trolleyId.trim()`
  - `Backend/src/modules/exchange/dto/exchange-request.dto.ts:102-105` — `@IsOptional() @IsUUID() trolleyId?: string`
  - `WebApps/src/features/transactions/api/types.ts:55` already names the cause: *"no `/trolleys` endpoint exists to source real names from"*
- **Backend work:** None, if GAP-03 lands — the correct fix is a real trolley list to select from, not loosening the UUID constraint. Do **not** relax `@IsUUID()` to accept codes; that would put trolley-code resolution inside the exchange query.
- **WebApps work:** Replace the free-text input with a `Select` populated from `GET /trolleys`, scoped to the active factory. Until GAP-03 lands, either hide the filter or label it explicitly as requiring an ID — do not leave a control that 400s on ordinary input.
- **Documentation work:** None.
- **Dependencies:** GAP-03 (for the proper fix).
- **Risk:** Low. Interim mitigation is a label or a removal.
- **Acceptance criteria:**
  - No input in the Exchange filter bar can produce a 400.
  - Once GAP-03 lands, the trolley filter is a select of real trolleys in the caller's factory scope.

---

## GAP-03 · No master-data read API — the highest-leverage backend gap

- **Classification:** REAL_API_GAP
- **Priority:** **P1**
- **Problem:** `Backend/src/modules/master-data/` is an empty folder. Nothing can resolve a factory, trolley, needle type, exchange type or employee id to a name, and no master-data screen can be built. This one absence produces the raw-UUID rendering in every existing screen *and* blocks 7 of the 16 dead navigation links.
- **Evidence:**
  - `Backend/src/modules/master-data/` — empty (verified by directory listing); absent from `Backend/src/app.module.ts:53-59`
  - `Docs/12` §222 (`/factories`), §245 (`/locations`), §276 (`/trolleys`), §320 (`/employees`), §352 (`/needle-types`), §377 (`/exchange-types`) all document these
  - `WebApps/src/core/permissions/factory-scope.ts:21` — `factoryIds.map((id) => ({ id, code: id, name: id }))`, with a header explaining exactly why
  - Schema exists and is seeded: `Backend/prisma/schema.prisma` carries `Factory`, `Location`, `Trolley`, `NeedleType`, `ExchangeType`, `Employee` models; `Backend/README.md` §Seed data lists the seeded rows
- **Backend work:** A `MasterDataModule` exposing **read-only** endpoints first — `GET /factories`, `GET /trolleys`, `GET /needle-types`, `GET /exchange-types`, `GET /employees`, each list-and-by-id. Reuse the existing conventions without inventing new ones: `@Paginated()` for lists, `MASTER_VIEW` on `@RequirePermissions`, and factory-scope intersection at the query level exactly as `exchange.service.ts:633-635` does. Writes (`POST`/`PATCH`/activate/deactivate) are a separate, later ticket — they need `CHANGE_MASTER` audit wiring.
- **WebApps work:** Deferred to GAP-04.
- **Documentation work:** Record which of the documented master-data routes ship read-only in phase one, so the remainder is visibly deferred rather than forgotten.
- **Dependencies:** None. This is the root of the chain.
- **Risk:** Medium — five new endpoints, but no transactions, no state machine, no stock mutation. The only real decision is whether `/trolleys` and `/employees` are factory-scoped (they should be, matching every other list).
- **Acceptance criteria:**
  - Five list endpoints return the paginated envelope with `meta.total`.
  - A caller receives only rows inside their factory scope; a request naming a factory outside their scope returns an empty page, never another factory's data.
  - `MASTER_VIEW` is required; a caller lacking it receives 403.
  - Unit tests for scope intersection, e2e for each endpoint.

---

## GAP-04 · WebApps renders raw UUIDs wherever a name belongs

- **Classification:** WEBAPP_GAP (unblocked by GAP-03 and GAP-06)
- **Priority:** **P1**
- **Problem:** Ten distinct fields across four screens display a UUID where a human expects a label — including the factory switcher in the TopBar, which is on every page of the application.
- **Evidence:** Full table in gap-analysis §9. Principal sites:
  - `WebApps/src/core/permissions/factory-scope.ts:21` — factory `code` and `name` both echo the id
  - `WebApps/src/features/transactions/api/types.ts:9-13` — deliberately omits every name field
  - `WebApps/src/features/confirmation/api/types.ts:5-7` — `requestedToUserId`/`decidedBy` raw
  - `WebApps/src/features/audit/api/types.ts:13` — `actorUserId` raw
- **Backend work:** None beyond GAP-03 and GAP-06.
- **WebApps work:** One shared lookup layer in `core/`, not a per-feature solution — a cached TanStack query per master-data collection, keyed and long-`staleTime`, exposing `useFactoryName(id)`-style resolvers that feature columns call. Prefer this to embedding names in every feature's types, which would duplicate the same fetch four times. Update `useAuthorizedFactories()` to consume it.
- **Documentation work:** None.
- **Dependencies:** GAP-03, GAP-06.
- **Risk:** Low, once the data exists. The main trap is fetching one lookup per table row — the layer must fetch per collection, not per id.
- **Acceptance criteria:**
  - The TopBar factory selector shows factory names.
  - Exchange list and detail show trolley, exchange-type and needle-type names.
  - Confirmation and Audit show actor names.
  - No component fabricates a name from an id when the lookup misses — it falls back to the id, visibly.

---

## GAP-05 · `core/permissions` is empty; four components re-derive the same check

- **Classification:** WEBAPP_GAP
- **Priority:** **P1**
- **Problem:** `core/permissions/index.ts` contains `export {};`. Every permission check in the app is an inline `currentUser?.permissions.includes("CODE") ?? false`, repeated at four sites. Consequently the sidebar is not permission-filtered at all: every authenticated user sees all 20 navigation entries regardless of what they may actually do.
- **Evidence:**
  - `WebApps/src/core/permissions/index.ts:1` — `export {};`
  - `WebApps/src/features/audit/components/audit-log-page.tsx:32`
  - `WebApps/src/features/transactions/components/audit-timeline.tsx:28`
  - `WebApps/src/features/transactions/components/confirmation-panel.tsx:44-45`
  - `WebApps/src/shared/components/nav-config.ts:36` — *"Actual visibility is permission-driven at render time once core/permissions ships"*
  - The data is already available: `WebApps/src/core/auth/types.ts:38` — `permissions: string[]`
- **Backend work:** None. `GET /auth/me` already delivers the full permission list, and the backend remains the authorization authority regardless — these are UX guards only.
- **WebApps work:** Implement `hasPermission(user, code)` and a `usePermission(code)` hook in `core/permissions`, replace the four inline checks, and add a `permission?: PermissionCode` field to `NavItem` so the sidebar filters itself. Mirror the backend's exact-match, no-implication rule — never let the client treat one code as implying another.
- **Documentation work:** None.
- **Dependencies:** None. Highest-value item with zero backend dependency.
- **Risk:** Low. Worst case a nav item is hidden from someone who should see it, which is recoverable and visible.
- **Acceptance criteria:**
  - No component contains a literal `permissions.includes(` outside `core/permissions`.
  - A user without `AUDIT_VIEW` does not see the Audit Log nav entry.
  - Permission matching is exact string equality, with a test asserting no implication.

---

## GAP-06 · No `/users` read API — user names unresolvable

- **Classification:** REAL_API_GAP
- **Priority:** **P2**
- **Problem:** Three fields across Confirmation and Audit carry user ids with nothing to resolve them against, and Administration → Users cannot be built. The `identity` module implements authentication only.
- **Evidence:**
  - `Backend/src/modules/identity/controllers/auth.controller.ts` — four routes, all authentication; no user CRUD
  - `Docs/12` §1106-1118 documents eight `/users` routes
  - `ConfirmationResponseDto.requestedToUserId` (`confirmation-response.dto.ts:45`), `ConfirmationDecisionDto.decidedBy` (line 12), `AuditLogResponseDto.actorUserId` (`audit-response.dto.ts:28`)
- **Backend work:** `GET /users` and `GET /users/:id`, read-only, `USER_MANAGE` permission, factory-scope filtered. Return `id`, `username`, `name`, `status`, `roles` — and no password material of any kind. Writes are a separate ticket.
- **WebApps work:** Extend the GAP-04 lookup layer; build Administration → Users as a read-only table.
- **Documentation work:** Note which of the eight documented `/users` routes ship read-only first.
- **Dependencies:** GAP-04 shares the lookup layer.
- **Risk:** Medium — this endpoint exposes account data and must be scope-filtered and permission-gated from the first commit. Never return password hashes, refresh tokens, or `passwordUpdatedAt`-style fields that leak account state.
- **Acceptance criteria:**
  - `GET /users` requires `USER_MANAGE` and returns only in-scope users.
  - No credential-bearing field appears in the response DTO; an e2e test asserts the exact field set.

---

## GAP-07 · `exchangeType` is loaded on every read and discarded

- **Classification:** REAL_API_GAP
- **Priority:** **P2** (but the cheapest item in this document)
- **Problem:** `EXCHANGE_CONTEXT_INCLUDE` eager-loads the full `exchangeType` row on every exchange read — list, detail and each of the nine transitions — because the state machine needs it to judge fragment rules. The response mapper then projects only `exchangeTypeId` and throws the row away. The name a screen needs is already in memory and costs nothing extra to return.
- **Evidence:**
  - `Backend/src/modules/exchange/repositories/exchange.repository.ts:7-11` — `EXCHANGE_CONTEXT_INCLUDE = { exchangeType: true, confirmation: true, evidence: true }`, applied at lines 24, 34 and 45
  - `Backend/src/modules/exchange/controllers/exchange.controller.ts:43` — `private static toResponse(exchange: ExchangeWithContext): ExchangeResponseDto`
  - `Backend/src/modules/exchange/dto/exchange-response.dto.ts:30-31` — only `exchangeTypeId` is declared
- **Backend work:** Add `exchangeTypeCode` and `exchangeTypeName` (both nullable, since `exchangeTypeId` is nullable until the type is selected) to `ExchangeResponseDto`, populated in `toResponse`. No new query, no N+1 — the relation is already joined.
- **WebApps work:** Add the two fields to `ExchangeListItem` and render the name in the list column and detail panel.
- **Documentation work:** None.
- **Dependencies:** None. Independent of GAP-03.
- **Risk:** Very low — two additive nullable fields.
- **Acceptance criteria:**
  - `GET /exchanges` returns `exchangeTypeName` for exchanges past `EXCHANGE_TYPE_SELECTED` and `null` before it.
  - No additional database query is issued — verified by an unchanged query count in the e2e path.

---

## GAP-08 · Exchange and confirmation list ordering has no tiebreaker

- **Classification:** REAL_API_GAP
- **Priority:** **P2**
- **Problem:** Both lists order by a single timestamp column. Two rows sharing a timestamp are free to swap places between page requests, which can silently hide one record and repeat another across a pagination boundary. The audit endpoint already solves this; the other two do not.
- **Evidence:**
  - `Backend/src/modules/exchange/repositories/exchange.repository.ts:41` — `orderBy: { createdAt: 'desc' }`
  - `Backend/src/modules/approval/services/confirmation.service.ts:152` — `orderBy: { requestedAt: 'desc' }`
  - Correct pattern already in the codebase: `Backend/src/modules/audit/services/audit.service.ts:62-65`, with a comment explaining precisely this failure mode
- **Backend work:** Append `{ id: 'desc' }` as a secondary sort to both.
- **WebApps work:** None.
- **Documentation work:** None.
- **Dependencies:** None.
- **Risk:** Very low.
- **Acceptance criteria:** Paging through a list containing same-timestamp rows returns each row exactly once.

---

## GAP-09 · No reporting module — Dashboard runs on fixtures

- **Classification:** REAL_API_GAP (with an embedded PRODUCT_DECISION)
- **Priority:** **P2**
- **Problem:** `Backend/src/modules/reporting/` is empty, so all four `/dashboard/*` endpoints are absent and the Dashboard renders fixtures. This is sanctioned by ADR and correctly structured, but it means the most-visited screen in the app shows no real data.
- **Evidence:**
  - `Backend/src/modules/reporting/` — empty; absent from `app.module.ts`
  - `Docs/adr/0001-dashboard-v1-scoped-to-existing-contract.md` — sanctions fixture-first for exactly this reason
  - `WebApps/src/features/dashboard/api/data-source.ts:15-32` — the swap seam, with the replacement body written out
  - `WebApps/src/features/dashboard/api/types.ts:1-13` — declares which two shapes are contract-derived and which two are guessed
- **Backend work:** A `ReportingModule` with `GET /dashboard/overview`, `/exchange-trend`, `/needle-consumption`, `/stock-summary`, gated on `DASHBOARD_VIEW` / `REPORT_VIEW`, factory-scope filtered. `overview` and `exchange-trend` have example payloads in `Docs/12` §1023/§1048 and can be built directly; the other two are blocked on PD-2.
- **WebApps work:** Swap the four function bodies in `dashboard/api/data-source.ts` — nothing else changes if the shapes hold. Delete `fixtures.ts` once all four are real. Reconcile `NeedleConsumptionItem` and `StockSummary` against whatever the backend actually returns.
- **Documentation work:** Add the two missing example payloads to `Docs/12` §1075 and §1088 once decided (PD-2).
- **Dependencies:** PD-2 for two of the four endpoints. `StockAlertItem.factoryName`/`locationName` additionally depend on GAP-03.
- **Risk:** Medium. Aggregation queries over `exchanges` and `inventory_balances` need index review before they run against production volumes.
- **Acceptance criteria:**
  - Four endpoints return the envelope, scope-filtered.
  - `WebApps/src/features/dashboard/api/fixtures.ts` is deleted and no import of it remains.
  - The existing Dashboard component tests pass against real shapes.

---

## GAP-10 · Sixteen navigation entries lead to 404

- **Classification:** WEBAPP_GAP
- **Priority:** **P2**
- **Problem:** `NAV_SECTIONS` declares 20 entries; four routes exist. Every Inventory (5), Master Data (7), Analytics (1) and Administration → Users/Roles/Devices (3) link navigates to a Next.js 404.
- **Evidence:**
  - `WebApps/src/shared/components/nav-config.ts` — 20 `NavItem` entries
  - `WebApps/src/app/` — `/login`, `/dashboard`, `/transactions/exchange[/id]`, `/transactions/confirmation[/id]`, `/administration/audit`
- **Backend work:** None.
- **WebApps work:** Either mark unbuilt entries as disabled with a "coming soon" affordance, or filter them out until their route exists. Combines naturally with GAP-05's permission filter — one visibility predicate, two inputs. Do not delete the entries: the list mirrors `Docs/18` §7 and is the roadmap.
- **Documentation work:** None.
- **Dependencies:** GAP-05 (shared visibility mechanism).
- **Risk:** Very low.
- **Acceptance criteria:** No sidebar entry navigates to a 404.

---

## GAP-11 · Eight documented `GET /exchanges` filters do not exist

- **Classification:** CONTRACT_DRIFT (partly REAL_API_GAP — see PD-3)
- **Priority:** **P2**
- **Problem:** `Docs/12` §608 documents thirteen filters; five are implemented. WebApps correctly built only the five real ones, so nothing is broken today — but `Docs/18` §12's Exchange screen mockup shows a date range, which means the UI spec and the API spec disagree with each other as well as with the code.
- **Evidence:**
  - `Docs/12-OpenAPI-Swagger-Specification.md:608-628` — thirteen filter names
  - `Backend/src/modules/exchange/dto/exchange-request.dto.ts:96-126` — five
  - `WebApps/src/features/transactions/api/types.ts:51` — *"Only the 5 params `ListExchangesQueryDto` actually declares"*
- **Backend work:** Contingent on PD-3. If the filters are kept, `dateFrom`/`dateTo` are the highest value (they back a mockup); `operatorId`, `exchangeTypeId`, `oldNeedleTypeId`, `newNeedleTypeId` become useful only once GAP-03 supplies selects to populate them; `search` needs a defined search target before it can be built at all.
- **WebApps work:** Add filter controls only for parameters that exist after the backend decision. **Do not add a control ahead of its parameter.**
- **Documentation work:** Whichever way PD-3 resolves, record the outcome. Do not edit `Docs/12` §608 merely to match the current code — it is a historical specification and the discrepancy is the finding.
- **Dependencies:** PD-3; GAP-03 for the id-based filters.
- **Risk:** Low.
- **Acceptance criteria:** Every filter control in the Exchange screen maps to a parameter verified present in `ListExchangesQueryDto`.

---

## GAP-12 · No health or readiness endpoint

- **Classification:** REAL_API_GAP
- **Priority:** **P2**
- **Problem:** `Docs/12` documents `GET /health` and `GET /ready`; neither exists. A container with a dead database connection still reports healthy to any orchestrator.
- **Evidence:** `Docs/12` §5 area; absent from the route inventory in gap-analysis §2. Independently recorded as M1 in `.scratch/exchange/final-review.md:118`.
- **Backend work:** `@Public()` health and readiness routes; readiness probes Prisma and Redis. Pair with `app.enableShutdownHooks()` (final-review M2) — the same deployment gap.
- **WebApps work:** None.
- **Documentation work:** None — already documented.
- **Dependencies:** None.
- **Risk:** Low. Keep the payload free of version or dependency detail on the public route.
- **Acceptance criteria:** `GET /health` returns 200 with no auth; `GET /ready` returns 503 when the database is unreachable.

---

## GAP-13 · Administration and Inventory modules

- **Classification:** REAL_API_GAP
- **Priority:** **P3** for this phase
- **Problem:** Administration (Roles, Devices) and Inventory (5 screens, 11 documented endpoints) have neither backend nor frontend.
- **Evidence:** `Backend/src/modules/{device,inventory}/` empty; `WebApps/src/features/{administration,inventory}/index.ts` are stubs; `Docs/12` §299, §823-998.
- **Backend work:** `DeviceModule`; `InventoryModule` with balances, movements, receiving, transfer, adjustment and count sessions. Inventory is the last module carrying real transactional risk — every mutation must write a `stock_movements` ledger row in the same transaction and respect the non-negative balance invariant, per `Backend/CLAUDE.md` §4.
- **WebApps work:** Both feature modules, after their APIs exist.
- **Documentation work:** None.
- **Dependencies:** GAP-03 (needle types, locations); GAP-06 (users, for Roles).
- **Risk:** High for Inventory — it mutates stock. It is correctly last.
- **Acceptance criteria:** Deferred; each endpoint gets its own ticket.

---

## GAP-14 · Record contract drift without rewriting the specifications

- **Classification:** DOCUMENTATION_GAP
- **Priority:** **P3**
- **Problem:** Seven drift items (gap-analysis §13) are known and traceable but recorded only in `.scratch/` and in code comments. `Docs/` accumulates known-stale sections with nothing marking them.
- **Evidence:** DD-1 through DD-7 in gap-analysis §13.
- **Backend work:** None.
- **WebApps work:** None.
- **Documentation work:** Add a drift register — this directory is the right home — naming each discrepancy and its authoritative source. **Do not edit the historical specifications to agree with the implementation.** Where a document was already corrected in place for a shipped decision (`Docs/12` §`/fragment`), that precedent applies only to contract corrections made *with the user's agreement*, not to retrospective tidying.
- **Dependencies:** None.
- **Risk:** None.
- **Acceptance criteria:** Every drift item in §13 appears in the register with a named authority.

---

## Product decisions blocking the queue

| ID | Decision | Blocks |
|---|---|---|
| **PD-1** | May a web supervisor cancel a stuck exchange? `POST /exchanges/:id/cancel` and `EXCHANGE_CANCEL` both exist; no spec says whether a web role ever holds that permission. | A Transactions screen action |
| **PD-2** | Exact payloads for `/dashboard/needle-consumption` and `/dashboard/stock-summary`. `Docs/12` §1075/§1088 state what they aggregate by, never their shape; WebApps guessed. | Half of GAP-09 |
| **PD-3** | Add the eight missing `GET /exchanges` filters, or narrow `Docs/12` §608 to five? `Docs/18` §12 shows a date range, which argues for at least `dateFrom`/`dateTo`. | GAP-11 |
| **PD-4** | Does any WebApps screen need location scope? `MeResponseDto.locationIds` is delivered and unused; whether Inventory filters by location determines if the second scope dimension needs client plumbing. | Inventory design (GAP-13) |

---

## Execution order

```
P0   GAP-01  status validation                    (BE, no deps)

P1   GAP-05  core/permissions + nav filter        (FE, no deps)  ─┐
     GAP-03  master-data read API                 (BE, no deps)  ─┤
     GAP-04  name-resolution lookup layer         (FE, needs 03) ─┤
     GAP-02  trolley select                       (FE, needs 03) ─┘

P2   GAP-07  exchangeType name projection         (BE, no deps)
     GAP-08  ordering tiebreakers                 (BE, no deps)
     GAP-06  /users read API                      (BE, no deps)
     GAP-12  health / readiness                   (BE, no deps)
     GAP-10  nav dead links                       (FE, needs 05)
     GAP-09  reporting module                     (BE, needs PD-2)
     GAP-11  exchange filters                     (BE, needs PD-3)

P3   GAP-13  administration + inventory           (BE+FE, needs 03/06)
     GAP-14  drift register                       (DOC, no deps)
```

---

## The next five implementation steps

1. **GAP-01 — constrain `status` to `@IsEnum(ExchangeState)`.** Half an hour, closes the one input-validation hole, and fixes a Swagger annotation that currently advertises three of twelve valid values.
2. **GAP-05 — ship `core/permissions` and filter the sidebar.** No backend dependency, removes four duplicated checks, and stops presenting every user with sixteen links they cannot use. The highest-value WebApps work available today.
3. **GAP-03 — build the read-only master-data API.** The root of the dependency chain: five endpoints with no transactional complexity that improve four existing modules and unblock a fifth.
4. **GAP-04 — build the shared name-resolution layer and wire the trolley select (GAP-02).** Turns raw UUIDs into names across the whole app and fixes the one shipped-broken filter.
5. **GAP-07 — project `exchangeTypeCode`/`exchangeTypeName` onto `ExchangeResponseDto`.** Two additive nullable fields returning data already loaded on every read and currently discarded. Independent of everything above, so it can land in any gap in the schedule.

Steps 1, 2 and 5 have no dependencies and can proceed in parallel with 3.
