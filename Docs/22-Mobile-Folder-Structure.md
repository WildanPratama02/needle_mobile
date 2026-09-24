# 22 — Mobile Folder Structure (nexa_mobile)

Status: v1.0 (2026-09-24), written with the Phase 1–3 scaffold of `Docs/21`
Companion to: `nexa_mobile/CLAUDE.md` §3 (module boundary), `Docs/19-Backend-Folder-Structure.md` (the backend version of this document)

This document is the tree that `nexa_mobile/CLAUDE.md` §3 refers to. If code and this document disagree, fix one of them in the same change.

---

## 1. Top level

```
nexa_mobile/
├── config/                      # one JSON per environment, used with --dart-define-from-file
│   ├── dev.json
│   ├── staging.json
│   └── prod.json
├── lib/
│   ├── main.dart                # reads AppConfig, opens ProviderScope, runs NexaApp
│   ├── app/                     # composition root: MaterialApp.router, router, gate, theme
│   ├── core/                    # infrastructure shared by all features (no business rules)
│   ├── shared/                  # reusable widgets, UI strings
│   └── features/                # package-by-feature, see §3
├── test/
│   ├── helpers/                 # fakes shared by tests (in-memory secure store, fake repos, fake HTTP adapter)
│   ├── unit/                    # domain + data tests, mirrors lib/
│   └── widget/                  # presentation tests, one file per flow
├── integration_test/            # end-to-end flows on a device/emulator (Doc 07 §59)
├── android/                     # network security config per env (see §6)
└── pubspec.yaml
```

## 2. `lib/app/` and `lib/core/`

```
lib/app/
├── app.dart                     # NexaApp — MaterialApp.router
├── app_gate.dart                # pure: which part of the app the user may see (provisioning → login → validation → home)
├── router.dart                  # go_router; redirect() is driven only by app_gate.dart
├── routes.dart                  # route path constants
└── theme/
    └── app_theme.dart           # Material 3, ColorScheme.fromSeed, tablet-sized controls (tokens: shared/theme/)

lib/core/
├── config/app_config.dart       # AppEnvironment + base URL from dart-defines, validated at start-up
├── network/
│   ├── api_client.dart          # the ONE HTTP client wrapper; every repository goes through it
│   ├── api_result.dart          # sealed ApiSuccess / ApiFailure
│   ├── envelope.dart            # {success,data,meta} / {success:false,error,meta} parser
│   ├── headers_interceptor.dart # X-Request-ID, X-Device-ID, Accept
│   ├── auth_interceptor.dart    # Bearer token, 401 → single-flight refresh → one resend
│   ├── token_refresher.dart     # serialises POST /auth/refresh (refresh tokens are single-use)
│   ├── device_access_monitor.dart # broadcasts DEVICE_INACTIVE / DEVICE_NOT_FOUND from any response
│   ├── session_events.dart      # broadcasts "session expired" when refresh is rejected
│   └── network_providers.dart   # Riverpod wiring for the above
├── error/
│   ├── app_error.dart           # AppError + ErrorCategory (Doc 07 §40) + retry whitelist (Doc 07 §41)
│   ├── error_mapper.dart        # DioException / envelope → AppError, Doc 07 name ↔ backend code table
│   └── error_messages.dart      # user-facing Indonesian text per code / category (never a stack trace)
├── storage/
│   ├── secure_store.dart        # flutter_secure_storage wrapper + keys
│   ├── session_token_store.dart # access/refresh token pair
│   ├── provisioned_device_store.dart # device id + code learned at provisioning (MG-1)
│   └── storage_providers.dart
├── database/
│   ├── app_database.dart        # Drift database, schema version + migrations
│   ├── app_database.g.dart      # generated (build_runner) — do not edit
│   ├── tables.dart              # table definitions (names follow Doc 07 §38 local_*)
│   └── database_provider.dart
├── connectivity/connectivity.dart # online/offline stream (connectivity_plus behind an interface)
├── clock/server_clock.dart      # server-time offset (Doc 15 §18)
├── app_info/app_info.dart       # app version for the heartbeat
└── logging/app_logger.dart      # dart:developer log, never tokens or passwords (Doc 07 §49)
```

Rule: `core/` never imports `features/`. Features import `core/`.

## 3. `lib/features/`

Every feature has the same three layers:

| Layer | Holds | May import |
|---|---|---|
| `domain/` | entities, value objects, pure rules (parsers, state resolution), repository and hardware **interfaces** | `dart:*`, other `domain/` |
| `data/` | repository implementations, remote data sources (through `ApiClient`), Drift DAOs, hardware adapters, the Riverpod providers that build them | `domain/`, `core/`, packages |
| `presentation/` | screens, widgets, Riverpod Notifiers exposing UI state | `domain/`, `data/` **providers only**, `core/`, `shared/`, `app/routes.dart` (path constants only) |

A widget never calls `ApiClient`, `Dio` or the Drift database; it reads a Notifier, which calls a repository interface (Doc 07 §39).

```
lib/features/
├── auth/                        # Phase 3
│   ├── domain/     auth_user.dart (+ PermissionCodes), auth_repository.dart, session_state.dart
│   ├── data/       auth_remote_data_source.dart, user_session_local_data_source.dart,
│   │               auth_repository_impl.dart, auth_providers.dart
│   └── presentation/ session_controller.dart, login_controller.dart, login_screen.dart
├── device_context/              # Phase 3 — provisioning (MG-1), bootstrap validation (MG-14), heartbeat, home
│   ├── domain/     device_qr_payload.dart (QR + manual-id parser), device_context_snapshot.dart
│   │               (DeviceStatus, ProvisionedDevice, context), device_outcomes.dart (bootstrap /
│   │               heartbeat outcomes, failure classification), device_repositories.dart,
│   │               qr_scanner.dart (camera interface)
│   ├── data/       device_remote_data_source.dart, device_context_local_data_source.dart,
│   │               provisioning_repository_impl.dart, bootstrap_repository_impl.dart,
│   │               heartbeat_repository_impl.dart, device_context_providers.dart,
│   │               mobile_scanner_qr_scanner.dart (camera adapter + its providers; the only
│   │               file importing mobile_scanner)
│   └── presentation/ provisioning_controller.dart, provisioning_screen.dart,
│                     device_validation_controller.dart, heartbeat_controller.dart,
│                     startup_screen.dart, device_blocked_screen.dart, home_screen.dart
├── master_data/                 # Phase 3 stores the bootstrap collections; Phase 5 adds the refresh-on-sync logic
│   ├── domain/     master_data.dart, master_data_versions.dart (merge plan), master_data_repository.dart
│   └── data/       master_data_repository_impl.dart (Drift), master_data_providers.dart
├── rfid/                        # Phase 4 — BLOCKED on the RFID protocol decision (nexa_mobile/CLAUDE.md §2, TBD)
├── exchange/                    # Phase 6 — the Doc 07 §9–28 wizard
├── photo_evidence/              # Phase 7 — camera capture behind an interface, local file until upload
├── inventory_stock/             # Phase 8/10
├── history/                     # Phase 10
├── sync/                        # Phase 9 — command queue, SyncStateMapper, conflict UI
│   └── presentation/ sync_status.dart (placeholder: no queue exists yet)
└── settings/
    └── presentation/ settings_screen.dart (about, logout, admin re-provisioning)
```

Features without code yet keep `presentation/ domain/ data/` directories with a `.gitkeep` so the boundary is visible before the first file lands.

Home is not a feature of its own: it shows the device context, so it lives in `device_context/presentation/home_screen.dart`. The Home buttons for features not built yet route to `shared/widgets/feature_pending_screen.dart`.

## 4. `lib/shared/`

```
lib/shared/
├── theme/design_tokens.dart     # spacing / radius / button height / status colours (ThemeExtension, Doc 17 §55)
├── l10n/app_strings.dart        # every UI string (Indonesian, Doc 17 §35) in one place; flutter_localizations later
└── widgets/
    ├── action_buttons.dart       # PrimaryActionButton / SecondaryActionButton, Doc 17 §33–34 (≥ 56 dp, larger on main actions)
    ├── status_badge.dart         # icon + label + colour, never colour alone (Doc 17 §36)
    ├── network_indicator.dart    # ONLINE / OFFLINE (Doc 07 §32)
    ├── app_header.dart           # factory | trolley | PIC | network (Doc 17 §5)
    ├── message_panel.dart        # full-screen message with one primary action (blocked, errors)
    ├── inline_error.dart         # icon + text error line
    ├── confirm_dialog.dart       # destructive-action confirmation (Doc 07 §44)
    └── feature_pending_screen.dart
```

## 5. Local database (Drift)

Tables use the Doc 07 §38 conceptual names. Schema version 1 (Phase 3):

| Table | Holds | Cleared on |
|---|---|---|
| `local_user_session` | the signed-in user and the last `GET /auth/me` (roles, permissions, factory/location scopes) | logout |
| `local_device_context` | device, factory, trolley, `serverTime`, `syncCursor` from the last successful bootstrap | re-provisioning |
| `local_device_validation` | last known device status (`ACTIVE`/`INACTIVE`/`REVOKED`) so an offline start stays blocked | re-provisioning |
| `local_needle_type`, `local_exchange_type`, `local_storage_mapping` | bootstrap master data (active rows only) | re-provisioning |
| `local_master_data_version` | the version string per collection, sent back on the next bootstrap | re-provisioning |

Tokens and the device id are **not** in the database — they live in `flutter_secure_storage` (`nexa_mobile/CLAUDE.md` §2, encryption v1). The database is not encrypted in v1.

The sync queue (`local_sync_queue`, `local_exchange`, …) is deliberately **not** created yet. It lands with Phase 9 as a schema-version-2 migration, once its shape follows Doc 15 §9–14 instead of a guess.

Every schema change bumps `schemaVersion` and adds a step in `AppDatabase.migration` — a destructive change without a migration is a data-loss bug on factory tablets.

## 6. Environments

`--dart-define-from-file=config/<env>.json`. Keys:

| Key | Meaning |
|---|---|
| `APP_ENV` | `dev` / `staging` / `prod` |
| `API_BASE_URL` | absolute URL including `/api/v1`; must be `https` outside `dev` (checked at start-up) |
| `HEARTBEAT_INTERVAL_SECONDS` | heartbeat cadence while online (default 300) |

Android reads `APP_ENV` from the same dart-defines in `android/app/build.gradle.kts` and picks the network security config: `dev` permits cleartext HTTP (LAN backend), `staging`/`prod` do not.
