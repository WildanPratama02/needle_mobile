---
name: flutter-project-rules
description: Project-aware Flutter/Dart coding rules for nexa_mobile (Needle Mobile System's Troli app). Use whenever writing or reviewing Dart/Flutter code under nexa_mobile/ — layers this project's locked/provisional architecture decisions, domain state machine, and module boundaries on top of the generic Flutter style baseline.
---

# Flutter project rules — nexa_mobile

This is the project-scoped layer Doc 21 (`Docs/21-Claude-Code-Mobile-Setup-Prompting-Guide.md`) §1.6 asks for. `Docs/Flutter_rules/rules.md` is a generic, project-agnostic Dart/Flutter style baseline — still valid for formatting, widget composition, theming, and general Dart idiom. This skill only states where nexa_mobile **overrides or narrows** that baseline; read the generic file for everything not repeated here.

## Decisions this skill assumes (source: `nexa_mobile/CLAUDE.md` §2)

- **State management: Riverpod** (provisional). This overrides the generic baseline's default-to-built-in (`ValueNotifier`/`ChangeNotifier`) guidance — the 12-state exchange machine (Doc 07 §28) plus sync engine plus offline queue need typed providers and testable DI, not ad hoc `ChangeNotifier`s wired by hand. Don't fall back to `ChangeNotifier` for new app state; `ValueNotifier` is still fine for genuinely single-widget ephemeral state (a text field's focus, a toggle).
- **Local database: Drift** (provisional). Local DB schema mirrors the storage tables in Doc 15 §38. Every table needs a migration path — this app ships to factory tablets, not dev machines, so a destructive schema change without a migration is a production data-loss bug.
- **Routing: go_router** (locked, matches generic baseline — no change).
- Both "provisional" rows can still change — if you're about to write non-trivial code against either (a DAO, a provider tree root), check `nexa_mobile/CLAUDE.md` §2 hasn't been re-confirmed differently since this skill was written.

## Module boundary (mirrors `nexa_mobile/CLAUDE.md` §3)

```
lib/features/{auth, device_context, rfid, master_data, exchange,
              photo_evidence, inventory_stock, history, sync, settings}
```

Each feature: `presentation/` (widgets, screens, Riverpod providers that expose UI-ready state) → `domain/` (state machine, business rules, repository interfaces) → `data/` (Drift DAOs, API clients, repository implementations, adapters). A widget calling an API client or a Drift database directly, instead of through a repository, is a violation regardless of how small the call looks.

## Domain vocabulary in code

Class, enum, and variable names must use `CONTEXT.md`'s canonical terms, not a stale synonym from an older spec doc:

- Server Exchange State enum values: `CREATED, OPERATOR_IDENTIFIED, NEEDLE_SELECTED, EXCHANGE_TYPE_SELECTED, FRAGMENT_CHECK, CONFIRMATION_PENDING, EVIDENCE_CAPTURED, NEW_NEEDLE_SELECTED, NEEDLE_ISSUED, USED_NEEDLE_STORED, COMPLETED, CANCELLED`. Never `DRAFT`, `EXCHANGE_SELECTED`, `WAITING_CONFIRMATION`, `PHOTO_CAPTURED`, `STOCK_VALIDATED`, `ISSUE`, or `BLOCKED` as a state value — none of those exist in the DB enum (`CONTEXT.md` "Exchange State").
- Local sync state is a **separate enum** from server Exchange State: `LOCAL_DRAFT, QUEUED, SYNCING, SERVER_ACCEPTED, SERVER_REJECTED, COMPLETED` (Doc 15 §8). Map one to the other through exactly one class — conventionally `SyncStateMapper` in `lib/features/sync/domain/`. Don't let a widget or a repository do this mapping inline.
- "Evidence", not "Photo", for the captured-image domain object (`exchange_evidence` table) — `Photo` is fine as a UI-facing label/string, not as a type or field name.
- "Fragment Status" (`FOUND`/`NOT_FOUND`) is a data field; "Fragment Check" is the Exchange State where it's set. Don't name a variable `fragmentStatus` when it actually holds the state, or vice versa.

## Mandatory rules beyond the generic baseline

- **Idempotency is not optional.** Every mutating command DTO (`CreateExchangeCommand`, `IssueNeedleCommand`, …) has a `clientTransactionId` and sends an `Idempotency-Key` header (Doc 15 §10). A command class without one is incomplete, not a later addition.
- **No client-side stock authority.** Never compute a final stock balance client-side and treat it as truth — Issue always round-trips through the backend (Doc 15 §7, ADR-004). A local number is a UI hint until the backend response confirms it.
- **RFID/camera stay behind an adapter.** `domain/` defines the interface (`RfidReader`, `EvidenceCapture`), `data/` implements it per-platform. No `package:some_rfid_sdk` import outside a `data/` adapter file, anywhere in the codebase.
- **Retry whitelist is exact.** Automatic retry fires only for `NETWORK_TIMEOUT` and `TEMPORARY_SERVER_ERROR` (Doc 07 §41). A business rejection (e.g. `INVENTORY_INSUFFICIENT_STOCK`) must surface to the user, never silently retry.
- **One screen, one primary action** (Doc 07 §43). If a screen in the exchange wizard needs two primary buttons, that's a sign the flow needs another screen, not a design call to make locally — flag it.

## Testing (adds to generic baseline's "write code with testing in mind")

Per `nexa_mobile/CLAUDE.md` §5: unit tests for `domain/`+`data/`, widget tests for `presentation/`, `integration_test` for full flows (Doc 07 §59 scenarios — normal path, BROKEN+APPROVED path, offline→sync path). A sync-engine change needs a test proving retry doesn't duplicate a command and dependent commands don't run out of order — these are exactly the bugs Doc 15 warns are easy to get wrong silently.

## What's still generic (unchanged from `Docs/Flutter_rules/rules.md`)

Lint rules (`flutter_lints`), formatting, `const` constructors, widget composition over inheritance, `ListView.builder` for long lists, `compute()` for expensive parsing, Material 3 theming approach, doc-comment style. Use that file as-is for all of this.
