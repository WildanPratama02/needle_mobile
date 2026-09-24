# CLAUDE.md — nexa_mobile (Troli App)

Root rules for the Flutter mobile client. Read this before touching `lib/`. Full specs: `Docs/07-SRS-Mobile-Android.md`, `Docs/13-RFID-Integration-Specification.md`, `Docs/15-Mobile-Offline-Sync-Specification.md`, `Docs/17-Mobile-UI-UX-Specification.md`, `Docs/09-API-Specification.md`, `Docs/12-OpenAPI-Swagger-Specification.md`. Domain vocabulary: `CONTEXT.md` at repo root (tiebreaker over any spec below). Setup/prompting playbook: `Docs/21-Claude-Code-Mobile-Setup-Prompting-Guide.md` — this file is that playbook's §1.3 output.

## §1 Non-negotiable principles

- **Backend is authoritative (ADR-004).** Mobile never finalizes a stock deduction or marks an exchange `COMPLETED` on local assumption alone — always from a backend response.
- **Offline-first Android (ADR-005).** The app stays usable offline within the limits in Doc 15 §6, but offline never means bypassing a business rule.
- **Local state ≠ server state.** Local sync state (`LOCAL_DRAFT/QUEUED/SYNCING/SERVER_ACCEPTED/SERVER_REJECTED/COMPLETED` — Doc 15 §8) must never be conflated with server Exchange State (`CREATED..COMPLETED` — Doc 07 §28, canonical values in `CONTEXT.md`). Map explicitly in one place (`SyncStateMapper`), never scattered across widgets.

## §2 Locked decisions

Status: **provisional defaults**, picked from Doc 21 §1.2's own recommendation because no answer was given when asked. Treat every row below as open until a human explicitly confirms it — do not build hardware- or distribution-dependent code (RFID adapter, release signing) against a row still marked TBD.

| Decision | Value | Status |
|---|---|---|
| Local database | Drift (SQLite, type-safe query + build_runner) | Provisional — confirm before Fase 2 (core layer) |
| State management | Riverpod | Provisional — confirm before Fase 3 |
| Offline stock policy | Issue always requires online backend confirmation before `COMPLETED`; no full offline reservation | Provisional — confirm before Fase 8/9 |
| Local DB encryption | Not decided (Doc 15 §4/§22, Doc 07 §45: SQLCipher vs field-level vs `flutter_secure_storage` for token only) | **TBD — ask user** |
| RFID reader protocol | Not decided (Doc 13 §5/§15: USB/Serial vs Bluetooth vs vendor SDK) — depends on hardware bought for the trolley tablet | **TBD — ask user, needs hardware info** |
| Routing | go_router | Locked (matches `Flutter_rules/rules.md` baseline, no tradeoff to relitigate) |
| Build flavor / base URL per env | Not decided (dev/staging/prod) | **TBD — ask user** |
| APK distribution to factory tablets | Not decided (Play Store internal track vs MDM sideload vs manual APK) | **TBD — ask user, affects signing** |

Before starting Fase 2, 3, 8, or 9 of `Docs/21`'s phase plan, re-confirm the relevant provisional row with the user instead of assuming it silently carries over.

## §3 Module boundary (package-by-feature, mirrors Backend §4 / Doc 19)

```
lib/features/{auth, device_context, rfid, master_data, exchange,
              photo_evidence, inventory_stock, history, sync, settings}
```

Each `features/<name>/` has `presentation/ domain/ data/`. Widgets never call the API client directly — always through a repository (Doc 07 §39). Full proposed tree: `Docs/22-Mobile-Folder-Structure.md` (create when scaffolding begins — see Doc 21 §1.4).

## §4 Mandatory coding rules

- Every mutating command (`CREATE_EXCHANGE`, `ISSUE_NEEDLE`, …) carries `clientTransactionId` + `Idempotency-Key` (Doc 15 §10).
- Dependent commands execute in order per Doc 15 §12 — never in parallel.
- Automatic retry only for the Doc 07 §41 whitelist (`NETWORK_TIMEOUT`, `TEMPORARY_SERVER_ERROR`) — never for a business rejection.
- One screen = one decision = one primary action (Doc 07 §43).
- RFID/camera access isolated behind an adapter — interface in `domain/`, platform-specific implementation in `data/` (Doc 13 §6).

## §5 Testing required per feature

Unit tests (domain + data), widget tests (presentation), `integration_test` for end-to-end flow (Doc 07 §59).

## §6 References

Requirements: Docs 07, 13, 15, 17. API contract: Docs 09, 12. Cross-system ADRs: `Docs/adr/` + `Backend/CLAUDE.md` §2. Coding-style baseline (generic, not project-aware): `Docs/Flutter_rules/rules.md` — project-specific version lives in the `flutter-project-rules` skill (`.claude/skills/flutter-project-rules/SKILL.md`), which layers this file's decisions on top.

## §7 Before Fase 0 checklist items still open

Per `Docs/21` §4, these are unchecked — do them before the first real feature-coding session, not mid-flight:

- [ ] `Docs/architecture/backend-mobile-contract-matrix.md` — compare actual `Backend/` routes/`openapi.json` against what Doc 07/09/15 assume (`/mobile/bootstrap`, `/mobile/sync`, `/rfid/cards/{uid}`, `/exchanges`, …). Not yet done — the mobile app is still an empty scaffold, so this hasn't been forced yet.
- [ ] Lock the TBD rows in §2 above.
- [ ] `Docs/22-Mobile-Folder-Structure.md` written.
- [ ] `.scratch/mobile-troli-app/spec.md` + EPIC 01–14 tickets split (Doc 07 §61, ticket convention in `Docs/agents/issue-tracker.md`).
- [ ] `exchange-state-machine` and `offline-sync-engine` skills — not built yet; they encode Doc 07 §28 and Doc 15 §9-14 mechanically and need §2's decisions locked first so they don't encode a guess.
