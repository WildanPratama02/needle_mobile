# Backend ↔ Mobile Contract Matrix

**First written:** 2026-09-23 · **Decisions confirmed:** 2026-09-23 (all MG recommendations accepted) · **Against:** `main` @ `0e0f218` (PR #11, mobile backend surface) · **Companion to:** [`backend-webapps-contract-matrix.md`](./backend-webapps-contract-matrix.md)

This is Phase 0 of `Docs/21-Claude-Code-Mobile-Setup-Prompting-Guide.md` (§25). Every row compares what the tablet needs (Docs 07, 13, 15) with what `Backend/` actually serves. Backend cells are **verified against source and a live smoke run**, not copied from a document. The Flutter app (`nexa_mobile/`) is still an empty scaffold, so this matrix has no "mobile status" column. It tells each feature what to build against.

## Value legend

| Value | Meaning |
|---|---|
| `READY` | Present and correct in source; e2e-tested |
| `PARTIAL` | Exists but incomplete for the screen's need |
| `MISSING` | Not implemented |
| `DRIFT` | Implementation and `Docs/` disagree (naming or shape) — the matrix says which side to follow |
| `DECISION_REQUIRED` | Not resolvable from code or docs |
| `CLIENT` | Nothing to build on the backend; the tablet owns it |
| `N/A` | Not applicable |

**Owner** is `BE` (Backend), `FE` (Flutter), `WEB` (WebApps), `DOC`, or `PRODUCT`. **Priority** is relative to the first shippable tablet build: `P1` blocks it, `P2` is needed before rollout to the factory floor, and `P3` can follow.

## Conventions every tablet call follows

| Topic | Contract (as built) | Source |
|---|---|---|
| Base URL | `/api/v1`, envelope `{ success, data, meta }` / `{ success:false, error:{ code, message, details, context? }, meta }` | Docs/12 §7, §23 |
| Auth | `Authorization: Bearer <access>`; access token 15 min, refresh token 7 days, **single-use and rotating**; a replayed refresh token revokes the whole family | `Backend/README.md` §Authentication |
| Device | `X-Device-ID: <device uuid>` on **every** tablet-only route; also send it on login and refresh so the session is tied to the tablet | Docs/12 §9 "Device context" |
| Idempotency (HTTP) | `Idempotency-Key` header on every POST command; same key + same body replays, same key + different body is `422 IDEMPOTENCY_KEY_REUSED`, in-flight duplicate is `409` | Docs/12 §25 |
| Idempotency (sync) | `commandId` per queued command; **no** `Idempotency-Key` on `/mobile/sync` itself | Docs/12 §19 |
| Server time | `serverTime` on heartbeat, bootstrap and sync; heartbeat also returns `clockOffsetMs` | Docs/15 §18 |
| Permission the tablet user needs | `PIC_TROLI` holds `MOBILE_OPERATE`, `EXCHANGE_VIEW/CREATE/ISSUE/COMPLETE/CANCEL`, `CONFIRMATION_VIEW`, `STOCK_VIEW`, `DASHBOARD_VIEW`, but **not** `MASTER_VIEW` | `src/shared/constants/roles.ts` |

---

## Matrix

| Feature (`lib/features/…`) | Screen / flow | Source | Online API | Offline path | Backend | Contract | Permission (PIC holds?) | Scope | Response ready | Owner | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `auth` | Login | FR-MOB-001 | `POST /auth/login` (+ `X-Device-ID`) | none — needs network | READY | READY (decided, MG-2: username + password for v1) | `@Public` | N/A | READY (`user`, tokens) | — | — |
| `auth` | Session refresh | Doc 07 §45 | `POST /auth/refresh` | none | READY | READY | `@Public` | N/A | READY | — | — |
| `auth` | Logout | — | `POST /auth/logout` (204) | none | READY | READY | `@Public` | N/A | READY | — | — |
| `auth` | Load user, permissions, scopes | FR-MOB-001 "Success" | `GET /auth/me` | cache last response | READY | READY | authenticated | both dimensions | READY | — | — |
| `device_context` | First-launch provisioning (learn own device id) | FR-MOB-002, Docs/12 §30 "Device is registered" | scan the QR of the device id shown in WebApps, then `GET /mobile/bootstrap` | — | N/A (no backend change) | READY (decided, MG-1) | — | — | — | WEB (QR on device detail) + FE (scanner) | **P1 — MG-1** |
| `device_context` | Validate device, load factory/trolley context | FR-MOB-002, Doc 07 §4 | `GET /mobile/bootstrap` (403 `DEVICE_INACTIVE`, `context.status` = `INACTIVE`/`REVOKED`) | cached context; blocked if last answer was inactive | READY | READY | `MOBILE_OPERATE` ✓ | device factory ∩ user scope | READY | FE | P1 — MG-14 |
| `device_context` | Heartbeat, clock offset, revoke detection | Docs/12 §9, Doc 15 §18 | `POST /devices/{id}/heartbeat` | skip while offline | READY | READY | `MOBILE_OPERATE` ✓ | device | READY | — | — |
| `master_data` | Needle types, exchange types, storage mappings cache | Doc 15 §4, §16–17 | `GET /mobile/bootstrap?…Version=` (unchanged collection → `null`) | local cache | READY | READY | `MOBILE_OPERATE` ✓ | device trolley | READY (active rows only) | — | — |
| `master_data` | Refresh when versions change | Doc 15 §17 | `changes.masterDataVersions` on every sync | compare, then re-bootstrap | READY | READY | ✓ | — | READY | FE | — |
| `master_data` | Employee roster for offline RFID | Doc 15 §4 "Employee reference" | — (not in bootstrap) | — | N/A for v1 | READY (decided, MG-6: RFID step needs connectivity) | `MASTER_VIEW` ✗ | — | — | FE | P2 — MG-6 |
| `rfid` | Tap → operator lookup | FR-MOB-004, Doc 13 §8 | `GET /rfid/cards/uid/{rfidUid}` | not possible (see MG-6) | READY | DRIFT (Doc 13 wrote `/rfid/cards/{rfidUid}`; built as `/uid/{rfidUid}`, Docs/12/13 already amended) | `MOBILE_OPERATE` ✓ | device factory | READY (Doc 13 §8 shape) | — | — |
| `rfid` | Invalid-card UX | Doc 13 §9 | same — `404 RFID_NOT_FOUND`, `422 RFID_INACTIVE`, `422 EMPLOYEE_INACTIVE`, `403 FACTORY_SCOPE_DENIED` | — | READY | READY | ✓ | — | READY | FE | — |
| `exchange` | Create exchange | FR-MOB-003 | `POST /exchanges` (`clientTransactionId`, factory/trolley/device ids) | sync `CREATE_EXCHANGE` (payload `{}`; context from device binding) | READY | READY | `EXCHANGE_CREATE` ✓ | factory | READY | — | — |
| `exchange` | Confirm operator | FR-MOB-004, Doc 07 §12 | `POST /exchanges/{id}/operator` `{ rfidUid }` | `ASSIGN_OPERATOR` `{ rfidUid }` — validated only at sync | READY | READY | `EXCHANGE_CREATE` ✓ | factory | PARTIAL (operator **name** not on the row) | BE | P2 — MG-4 |
| `exchange` | Old needle + exchange type | FR-MOB-005/006 | `POST /exchanges/{id}/type` `{ exchangeTypeId, oldNeedleTypeId }` — one call covers both screens | `SELECT_EXCHANGE_TYPE` | READY | DRIFT (Doc 07 has two screens; backend one transition — tablet sends after the second screen) | `EXCHANGE_CREATE` ✓ | factory | READY | FE | — |
| `exchange` | Fragment check (BROKEN) | FR-MOB-007 | `POST /exchanges/{id}/fragment` `{ fragmentStatus }` | `FRAGMENT_VALIDATION` | READY | READY | ✓ | factory | READY | — | — |
| `exchange` | Missing-fragment confirmation request | FR-MOB-008 | raised automatically by `/fragment` `NOT_FOUND`; `409` when no APPROVER is scoped | same via sync | READY | READY | ✓ | factory | READY (`confirmationStatus` on the exchange) | — | — |
| `exchange` | Confirmation status | Doc 07 §18 | sync results and pull carry `confirmationStatus`; the HTTP exchange routes carry only `confirmationId`, so online use `GET /confirmations/{id}` | pull delivers approver decisions | READY | DRIFT (`NOT_REQUIRED` is `null` on the wire) | `CONFIRMATION_VIEW` ✓ | factory | READY | FE | — MG-10 |
| `photo_evidence` | Capture + upload | FR-MOB-009, Doc 15 §15 | `POST /exchanges/{id}/evidence` multipart (`evidenceType`, `file`, `capturedAt?`; jpeg/png/webp ≤ 10 MB) | **not a sync command** — keep locally until the exchange has a server id, then upload | READY | READY | `EXCHANGE_CREATE` ✓ | factory | READY (`exchangeStatus`, `outstanding`) | FE | P1 — MG-7 |
| `photo_evidence` | View uploaded evidence | — | `GET /exchanges/{id}/evidence` (presigned `url`, 15 min) | — | READY | READY | `EXCHANGE_VIEW` ✓ | factory | READY | — | — |
| `inventory_stock` | Pre-issue stock hint | FR-MOB-011 | `POST /exchanges/{id}/new-needle` (409 `INVENTORY_INSUFFICIENT_STOCK` when trolley has none) | `SELECT_NEW_NEEDLE` | READY | DRIFT (no separate "validate" call; Doc 07 `AVAILABLE/NOT_AVAILABLE` = success / that 409) | `EXCHANGE_CREATE` ✓ | factory | READY (`context.availableQuantity`) | FE | — |
| `inventory_stock` | Issue needle | FR-MOB-012 | `POST /exchanges/{id}/issue` `{ quantity? }` | `ISSUE_NEEDLE` — backend re-checks stock at sync; never finalized locally | READY | READY | `EXCHANGE_ISSUE` ✓ | factory | READY | — | — |
| `exchange` | Used-needle storage | Doc 07 §26 | `POST /exchanges/{id}/store-used-needle` (backend resolves the storage mapping) | `STORE_USED_NEEDLE` | READY | READY | `EXCHANGE_CREATE` ✓ | factory | READY | — | — |
| `exchange` | Complete | FR-MOB-013 | `POST /exchanges/{id}/complete` | `COMPLETE_EXCHANGE` | READY | READY | `EXCHANGE_COMPLETE` ✓ | factory | READY | — | — |
| `exchange` | Cancel (with reversal after issue) | Doc 07 §29 | `POST /exchanges/{id}/cancel` `{ reason }` | `CANCEL_EXCHANGE` | READY | READY | `EXCHANGE_CANCEL` ✓ | factory | READY | — | — |
| `inventory_stock` | Trolley stock view | FR-MOB-015 | `GET /inventory/trolleys/{trolleyId}` | last cached copy, marked stale | READY | DRIFT (`NORMAL/LOW/OUT` vs Doc 07 `AVAILABLE/LOW STOCK/OUT OF STOCK`; needle **code** only, name from bootstrap) | `STOCK_VIEW` ✓ | factory | READY | FE | — MG-9 |
| `history` | Transaction list | FR-MOB-014 | `GET /exchanges?deviceId=&dateFrom=&dateTo=&status=&page=&pageSize=` | local rows + sync status | READY | READY | `EXCHANGE_VIEW` ✓ | factory | PARTIAL (operator name missing, MG-4) | BE | P2 |
| `history` | Filter by needle type / exchange type | FR-MOB-014 | `exchangeTypeId`, `oldNeedleTypeId`, `newNeedleTypeId` (documented in Docs/12 §10) | filter local cache | MISSING | DRIFT (documented, not built) | — | — | — | BE | P2 — MG-5 |
| `sync` | Push queued commands | FR-MOB-016, Doc 15 §9–13 | `POST /mobile/sync` `{ deviceId, cursor, commands[≤50] }` | — | READY | READY | `MOBILE_OPERATE` + each command's own permission ✓ | device | READY | FE | P1 |
| `sync` | Pull server-side changes | Doc 15 §11, §13 | same call — `changes.exchanges`, `hasMore`, `nextCursor` | — | READY | READY | ✓ | device | READY | FE | P1 |
| `sync` | Conflict handling | Doc 15 §13, Doc 07 §37 | result `status` + `error.code` + authoritative `exchange` | — | READY | DRIFT (small, see MG-8 and MG-12) | — | — | READY | FE | P1 |
| `sync` | Retry policy | Doc 15 §14, Doc 07 §41 | `FAILED` = retry; `REJECTED` = never auto-retry | — | READY | READY | — | — | READY | FE | P1 |
| `settings` | Connection / sync status, logs, analytics | Doc 07 §32, §49–50 | — | — | N/A | CLIENT | — | — | — | FE | P2 |
| `auth` | Brute-force protection on login | Doc 07 §45 | — | — | MISSING (only forgot/reset password are throttled) | — | — | — | — | BE | **P2 — MG-3** |

---

## Mapping tables the tablet needs

### Sync result → local state (Doc 15 §8) — the `SyncStateMapper` input

| Backend result | Local state | Retry? |
|---|---|---|
| `SUCCESS`, `IDEMPOTENT_SUCCESS` | `SERVER_ACCEPTED` (then `COMPLETED` once `exchange.status` is `COMPLETED`) | — |
| `REJECTED` | `SERVER_REJECTED`; show `error.message`, refresh from `exchange` | **never automatically** |
| `FAILED` | stays `QUEUED` | yes, same `commandId`, Doc 15 §14 schedule |
| `SKIPPED` | stays `QUEUED` behind the command that did not succeed | after that one resolves |
| HTTP 5xx / timeout on the whole request | stays `QUEUED` | yes |
| HTTP 403 `DEVICE_INACTIVE` on the whole request | block the app (FR-MOB-002) | no |
| HTTP 401 | refresh the token, then resend | once |

### Doc 07 error names → backend codes (Doc 07 §40–41)

| Doc 07 name | Backend `error.code` | Notes |
|---|---|---|
| `STOCK_NOT_AVAILABLE` | `INVENTORY_INSUFFICIENT_STOCK` | `context.availableQuantity`, `requestedQuantity` |
| `INVALID_STATE` | `EXCHANGE_INVALID_STATE` | `context.currentState`, `action` |
| `CONFIRMATION_REJECTED` | `EXCHANGE_FRAGMENT_CONFIRMATION_REQUIRED` | `context.confirmationStatus` = `PENDING` / `REJECTED` / `EXPIRED` |
| `DEVICE_REVOKED` | `DEVICE_INACTIVE` | `context.status` = `REVOKED` or `INACTIVE` |
| `ACCESS_DENIED` | `FORBIDDEN` / `FACTORY_SCOPE_DENIED` | |
| `NETWORK_TIMEOUT`, `TEMPORARY_SERVER_ERROR` | no response / 5xx / sync `FAILED` | the only automatic retries |
| — | `IDEMPOTENCY_KEY_REUSED` | a client bug: the same key was sent with a different body |

### Stock status labels (FR-MOB-015)

`NORMAL` → "Available" · `LOW` → "Low stock" · `OUT` → "Out of stock". The threshold is `NeedleType.minimumStock` on the backend.

---

## Gaps and decisions

**MG-1 — The tablet cannot learn its own device id (P1). Decided: QR code in the WebApps.** Every tablet route needs `X-Device-ID` as a UUID. Admins register devices in the WebApps with a code and a serial number, but nothing hands the UUID to the tablet. *Recommend:* the WebApps device detail shows the id as a QR code, and the tablet scans it once at first launch and stores it. That needs no new backend route, because `/mobile/bootstrap` validates the id straight away. *Alternative:* a new `GET /mobile/device?serialNumber=` for a user with `MOBILE_OPERATE`, which needs a Docs/12 change first.

**MG-2 — Login credential (P1). Decided: username + password for v1.** Doc 07 allows "employee ID / PIN". The backend has username + password only. *Recommend:* keep username + password for v1, since the tablet stays logged in (7-day refresh). A PIN is a separate identity decision.

**MG-3 — No rate limit on `/auth/login` (P2, BE). Accepted: to be built.** This is known issue HIGH-2. It must close before tablets reach the factory network.

**MG-4 — Operator name is not visible to the PIC (P2, BE). Accepted: project it onto the exchange response.** Exchange rows carry `operatorId` only, and `GET /employees` needs `MASTER_VIEW`, which `PIC_TROLI` does not have. History and the operator column show a bare id. *Recommend:* project `operatorEmployeeNumber` and `operatorName` onto the exchange response. Both are additive, one join, and serve WebApps too.

**MG-5 — History filters by needle type and exchange type (P2, BE). Accepted: to be built.** Docs/12 §10 documents them and Doc 07 §30 requires them. Add them the same way `deviceId`/`dateFrom`/`dateTo` were added.

**MG-6 — RFID offline (P2). Decided: the RFID step requires connectivity in v1.** Lookup is online-only and bootstrap has no employee roster, so offline the tablet cannot show *who* tapped. `ASSIGN_OPERATOR { rfidUid }` can still be queued and is validated at sync. *Recommend for v1:* require connectivity for the RFID step (Doc 15 §7 treats identification as critical). Revisit together with Doc 13 §13's deferred offline policy and data retention, because caching a roster of card UIDs on a tablet is a security decision.

**MG-7 — Evidence is online-only and needs the server id (P1, FE).** This matches Doc 15 §15. The tablet keeps the photo until `CREATE_EXCHANGE` has synced, uploads with an `Idempotency-Key` per photo, and only then sends `SELECT_NEW_NEEDLE`. If it is sent first, it returns `REJECTED EXCHANGE_INVALID_STATE` (`currentState` = `EXCHANGE_TYPE_SELECTED`), which the queue treats as "upload evidence, then resend".

**MG-8 — Error vocabulary (FE, DOC).** Doc 07 §40–41 names differ from Docs/12 §23. Follow the backend codes through the table above. Doc 07 is narrative there.

**MG-9 — Stock status labels (FE).** The UI needs a label mapping only (table above).

**MG-10 — `NOT_REQUIRED` confirmation (FE).** It is `confirmationStatus: null` on the wire.

**MG-11 — Evidence has no `device_id` column (N/A).** Doc 07 §20 lists it, but it is derivable from `exchange.deviceId`. No change.

**MG-12 — "Exchange already exists" (FE, informational).** Doc 15 §13 expects `IDEMPOTENT_SUCCESS`. If the tablet re-creates an existing exchange under a *new* `commandId`, it gets `SUCCESS` with the original exchange. The effect is the same and nothing is duplicated.

**MG-13 — Trolley stock is factory-scoped, not location-scoped (N/A).** Enough for the PIC. No change.

**MG-14 — Login does not reject an inactive device (FE).** `/auth/login` has no device check. The tablet must call `/mobile/bootstrap` straight after login and treat `DEVICE_INACTIVE` as "login blocked" (FR-MOB-002).

---

## Summary

- **Ready to build against now:** everything in the exchange flow (online and via sync), bootstrap, heartbeat, RFID lookup, evidence, trolley stock, history by device/date/status, and the retry/conflict semantics.
- **Decided (2026-09-23):** MG-1 is a QR code of the device id in the WebApps device detail, scanned once by the tablet. MG-2 is username + password for v1. MG-6 is that the RFID step needs connectivity in v1.
- **Work that follows from the decisions:** WEB adds the device-id QR code (MG-1). BE adds the login rate limit (MG-3), operator name on the exchange response (MG-4) and the history filters (MG-5), all before factory rollout. MG-7 and the `sync` rows are client work to design in from the start.
