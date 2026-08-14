# CLAUDE.md — Needle Mobile System Backend

Loaded automatically in every session under `Backend/`. It carries the decisions and boundaries an agent should not re-derive.

Everything else has a home:

- **How the code fits together, and why** — [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- **Setup, commands, endpoint reference** — [`README.md`](./README.md)
- **Domain vocabulary, and the tiebreaker when documents disagree** — [`../CONTEXT.md`](../CONTEXT.md)
- **Stack versions** — the `Stack` table in `README.md`, and `package.json`

## 1. What this is

Needle inventory management for factory floors, with three clients: an offline-first Flutter Android app running on the trolleys, a web management app for supervisors and admins, and this backend — the single source of truth for state. It validates operator RFID, drives the needle-exchange flow, decides broken-needle approvals, holds stock across many locations (the main warehouse plus every trolley), and sends WhatsApp notifications.

Requirements live in `../Docs/`: 01 PRD, 02 Business Process, 03 Use Case, 04 Functional Requirements, 05 System Architecture, 06 Application Architecture, 07 SRS Mobile, 08 SRS WebApp, 09 API Specification, 10 Database Design, 11 Database ERD & Physical Schema, 12 OpenAPI Spec, 13 RFID Integration, 14 WhatsApp Integration, 15 Mobile Offline Sync, 17 Mobile UI/UX, 18 WebApp UI/UX, 19 Backend Folder Structure, 20 Setup Prompting Guide. There is no 16. **When a requirement is unclear, read the document before assuming.**

## 2. Architecture decisions (binding — reopen only with the user)

- **ADR-001 Modular monolith** — one REST service, one database, modules separated logically by folder (package-by-feature). Modules ship together; a module never gets its own service or deployment.
- **ADR-002 PostgreSQL** — the DBMS, decided.
- **ADR-003 Trolley is an inventory location** — every trolley is a stock location in its own right, not merely a device.
- **ADR-004 Backend is the stock authority** — the server validates and executes every business rule and every stock mutation. Data arriving from mobile or web is a claim to re-validate, including on offline sync: input, never truth.
- **ADR-005 Offline-first Android** — commands arrive out of order and repeat. Every critical command is idempotent (§4).
- **ADR-006 WhatsApp is the only notification channel**, outbound only. It notifies; it never triggers a mutation, which is why `WhatsAppPort` has no receive method.

Decisions taken from here on get their own file in `../Docs/adr/`.

## 3. Module boundary

`src/modules/` holds exactly twelve domain modules: `identity`, `device`, `employee`, `master-data`, `exchange`, `approval`, `inventory`, `notification`, `audit`, `reporting`, `synchronization`, `rfid`. Work lands inside one of them; a thirteenth needs the user's agreement.

External providers — WhatsApp, object storage, RFID reader — reach the domain through a **port** in `src/integrations/`, so a domain module names the capability and never the vendor.

## 4. Rules that bind every change

- **Idempotency.** Critical commands (create exchange, issue, complete, approval, receiving, transfer, return, adjustment, sync) accept `Idempotency-Key` / `client_transaction_id` and return the same result on retry. One implementation, in `common/middleware/IdempotencyKeyMiddleware`.
- **Audit.** These events write an audit row: `LOGIN, CREATE_EXCHANGE, APPROVE_CONFIRMATION, REJECT_CONFIRMATION, ISSUE_NEEDLE, TRANSFER_STOCK, ADJUST_STOCK, CHANGE_MASTER, CHANGE_CONFIGURATION, DEVICE_BIND, DEVICE_REVOKE`. One implementation, in `common/interceptors/AuditLogInterceptor`.
- **Authorization has five dimensions** — User, Role + Permission, Factory **scope**, Location **scope**, Action. Permission codes match as exact strings and imply nothing else: `PIC_TROLI` scoped to Factory A / Trolley A-01 holding `EXCHANGE_CREATE` holds that alone, not `TRANSFER_STOCK`, `MANAGE_MASTER_DATA` or `ADJUST_STOCK`.
- **Exchange is a state machine**, not free CRUD. Every transition goes through `modules/exchange/services/exchange-state-machine.ts` — pure, returns the **path** of states to write, and refuses a jump. States, the terms retired from `Docs/05` §10, and why "blocked" is a condition rather than a state: [`../CONTEXT.md`](../CONTEXT.md).
- **Stock keeps a ledger.** Every balance change writes a `stock_movements` row in the same transaction — receiving, transfer, issue, return and adjustment alike. A bare balance update is never enough. Balances stay non-negative under concurrency (`Docs/05` §11–14).
- **Business rules live in services.** Controllers validate the DTO, call a service, and shape the response.
- **`../Docs/12-OpenAPI-Swagger-Specification.md` is the API contract** — the source of truth for paths, payloads and status codes. Change the document with the user first, then the endpoint.
- **Report export is async**: `POST /reports/export` → `GET /reports/export/{job_id}`, status `QUEUED → PROCESSING → COMPLETED/FAILED`, so a large report never blocks a request. Not built yet — `src/modules/reporting/` is empty.

## 5. Testing

Layering, fixtures and the deliberate test/production differences are in [`ARCHITECTURE.md`](./ARCHITECTURE.md#testing).

Business logic in `services/` carries unit tests — the exchange state machine and inventory validation above all — and critical endpoints carry e2e tests. **Every e2e suite boots through `test/e2e/create-test-app.ts`**, which shares `configureApp()` with `main.ts`; suites leave `setGlobalPrefix`, `enableVersioning` and `useGlobalPipes` to it, so test and production configuration cannot drift apart.

## 6. Still open

The RFID reader connection option (USB/Serial vs Bluetooth vs vendor SDK) is a mobile/Flutter decision. The reader attaches to the PIC tablet and the backend receives tap events over the ordinary API, so it does not block backend work.
