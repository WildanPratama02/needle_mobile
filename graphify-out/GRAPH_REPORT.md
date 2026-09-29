# Graph Report - Adding-Feature  (2026-09-29)

## Corpus Check
- 894 files · ~518,768 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 8441 nodes · 17894 edges · 346 communities (235 shown, 111 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 252 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `10e927a3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package:nexa_mobile/features/exchange/domain/exchange.dart
- RequirePermissions
- .approve
- app_database.dart
- PrismaService
- client.ts
- inventory/api/types.ts
- app_database.steps.dart
- package:flutter/material.dart
- auth/data-source.ts
- core/master-data/index.ts
- exchange-transactions-page.test.tsx
- schema_v1.dart
- auth/queries.ts
- schema_v2.dart
- auth.ts
- auth.controller.ts
- schema_v4.dart
- dependencies
- devDependencies
- schema_v3.dart
- getApiErrorMessage
- identity.module.ts
- password-reset.service.ts
- app.module.ts
- RetentionService
- audit-log-page.tsx
- GeneratedPluginRegistrant.swift
- Database ERD & Physical Schema
- devDependencies
- factory-queries.ts
- notification.service.ts
- components.json
- permissions/index.ts
- identity.seed.ts
- UserController
- compilerOptions
- .upload
- System Architecture Document
- scripts
- http-exception.filter.ts
- evidence.service.ts
- Claude Code Backend Setup Prompting Guide
- jest
- sync_repositories.dart
- needle_type_picker.dart
- MasterDataService
- Backend CLAUDE.md
- scope.guard.ts
- sync_engine_test.dart
- inventory-history.controller.ts
- sync_remote_data_source.dart
- connectivityStatusProvider
- network_providers.dart
- inventory-receiving.spec.ts
- compilerOptions
- data-table.test.tsx
- history_entry.dart
- authenticated-user.interface.ts
- _Body
- providers.tsx
- Backend ARCHITECTURE.md
- .enroll
- DeviceService
- operation-history-types.ts
- my_application.cc
- transfer-page.test.tsx
- dependencies
- WebApps Dev Subagent Spec
- count-session-detail-page.test.tsx
- offline_sync_flow_test.dart
- Backend/package.json
- HealthController
- .create
- WhatsApp Integration Specification
- package:flutter_riverpod/flutter_riverpod.dart
- sync.service.ts
- login_screen.dart
- POST /mobile/sync (client)
- device_remote_data_source.dart
- exchange_flow_controller.dart
- scripts
- exclude
- ADR-0001 Dashboard v1 Scoped to Existing Contract
- extends
- inventory-adjustment.spec.ts
- app_strings.dart
- master_data_refresher_test.dart
- provisioning_screen.dart
- device_access_monitor.dart
- integrations/ Adapter Isolation Pattern
- DataClass
- inventory-physical-count.spec.ts
- inventory-return.spec.ts
- inventory-transfer.spec.ts
- typescript
- Confirmation API
- ADR-0002 Password Reset Email is Transactional, Not a Notification Channel
- GAP-12 No Health/Readiness Endpoint
- Idempotency Rules
- Backend ↔ WebApps Action Plan
- postcss.config.mjs
- storage-screen.test.tsx
- exchange_repository.dart
- users-screen-write.test.tsx
- AuthController
- master-data.controller.ts
- confirmation-monitoring-page.tsx
- exchange_flow_state.dart
- sync_controller.dart
- app_error.dart
- tables.dart
- cn
- adjustment-page.test.tsx
- device_validation_controller.dart
- master_data_versions.dart
- evidence_views.dart
- sync_engine.dart
- ts-node
- fake_backend.dart
- router.dart
- exchange_steps.dart
- DateTime
- needle-type-screen.test.tsx
- database.config.ts
- setup-env.ts
- AuthenticatedUser
- PasswordResetTokenRepository
- evidence_camera.dart
- Audit API
- Exchange API
- Inventory API
- GET /mobile/bootstrap
- User / RBAC API
- RFID Functional Flow
- WhatsApp Business Trigger (BROKEN + NOT_FOUND)
- No Duplicate/No Negative Stock Offline Principle
- GoRouter Navigation
- Flutter State Management (Transaction/RFID/Camera/Sync)
- Flutter UI Architecture (lib/core, features, shared)
- Simple, Large, Fast, Guided, Error-Proof Principle
- Analytics Screens
- Design System (§73 placeholder)
- Exchange Transaction List / Detail
- WebApps State Model (Inventory/Device/Confirmation/Exchange)
- Project File Structure Overview
- GAP-11 Missing GET /exchanges Filters
- WebApps Frontend Stack (Next.js/shadcn/Tailwind/Recharts)
- StatelessWidget
- 1. Fase 0 — Yang Harus Selesai *Sebelum* Membuka Claude Code
- lucide-react
- sync_status.dart
- MOCK_SESSION_USER
- role-detail-screen.test.tsx
- fakes.dart
- users-screen.tsx
- win32_window.cpp
- proxy-config.test.ts
- rfid-screen.test.tsx
- design_tokens.dart
- confirmation.service.ts
- envelope.dart
- tailwind.config.ts
- receiving-page.test.tsx
- Backend as Single Source of Truth (API Principles)
- POST /auth/login
- Authorization Baseline Matrix
- Standard Error Codes
- Factory Scope Enforcement
- Fragment Endpoint Correction (NOT_REQUIRED removed 2026-08-10)
- Physical Count API
- Standard Response Envelope
- RFID Debounce Rule
- Invalid RFID Handling
- RFID Data Contract
- RfidReader Flutter Interface
- RFID Security Rules
- WhatsApp Approval Interaction (Webhook)
- WhatsApp Provider Failure Handling
- Notification Status (QUEUED/SENT/DELIVERED/READ/FAILED)
- WhatsApp Retry Policy (Exponential Backoff)
- WhatsApp Security Rules
- Supervisor Resolution Mapping
- Command Ordering / Dependency Rule
- Command Queue
- Sync Conflict Handling
- Local Exchange State (LOCAL_DRAFT…COMPLETED)
- Local Storage (Master Cache + Transaction)
- Mobile Data Layers (UI→UseCase→Repository→SyncQueue→API)
- Stock Safety Rule (Backend Authoritative Issue)
- Camera / Evidence Screen
- Exchange Type Screen
- Guided Transaction Flow
- Home Screen
- New Needle Type Screen
- Used Needle Storage Screen
- Administration Screens (Users/Roles/Devices/Audit)
- API Alignment Rule (Backend is Source of Truth)
- Confirmation Monitoring Screen
- Recommended WebApps Frontend Structure
- Inventory Overview / Stock / Movement Screens
- Master Data Screens
- Role-Based Experience (Frontend hiding ≠ security)
- Sidebar Navigation
- WebApps Responsibility Split
- Backend Is Authoritative Principle (ADR-004)
- src/ Folder Layout
- Modular Monolith Decision (ADR-001)
- Open Decisions (DBMS/ORM/Auth/Providers)
- Package-by-Feature over Package-by-Layer Rationale
- CONTEXT.md Glossary (referenced)
- GAP-02 Trolley Filter UUID Mismatch
- GAP-04 Name Resolution Lookup Layer
- GAP-05 core/permissions Client Guard
- GAP-07 exchangeType Name Projection
- GAP-08 List Ordering Tiebreaker
- GAP-10 Sixteen Nav Entries Lead to 404
- GAP-14 Record Contract Drift
- HIGH-2 No Rate Limiting on /auth/*
- HIGH-3 Idempotency Key Wedge Risk
- HIGH-4 Audit/Notification At-Most-Once Delivery
- PD-1 Web Supervisor Cancel Permission Decision
- PD-2 Dashboard Payload Shapes Decision
- PD-4 Location Scope Usage Decision
- DD-3 Response Envelope Drift
- Flutter Testing Best Practices
- Material Theming (ColorScheme.fromSeed, ThemeExtension)
- devices-screen.tsx
- exchange.dart
- Win32Window
- provisioning_controller.dart
- assertFactoryScope
- administration-roles.spec.ts
- auth_remote_data_source.dart
- .findAll
- app_config.dart
- Admin-panel CRUD audit: five contract-ready write gaps close next, three stay blocked on undecided policy, three are recorded but not queued
- history_providers.dart
- nest-cli.json
- wWinMain
- sync_command.dart
- device_outcomes.dart
- Backend ↔ Mobile Contract Matrix
- sync_state_mapper.dart
- 0003-roles-permissions-ships-read-only-first.md
- 0005-admin-panel-writes-never-widen-access-and-never-overwrite-stock.md
- 0006-stock-operations-keep-a-header-row-beside-the-ledger.md
- 0007-mobile-sync-executes-through-exchange-service.md
- manifest.json
- MessageHandler
- device_qr_payload.dart
- UpdateCompanion
- package:nexa_mobile/core/error/app_error.dart
- evidence.dart
- AuditQueryDto
- CLAUDE.md — nexa_mobile (Troli App)
- master_data.dart
- Flutter project rules — nexa_mobile
- return-page.test.tsx
- mobile-dev.md
- secure_store.dart
- RegisterPlugins
- sync_queue_impl.dart
- FlutterActivity
- nexa_mobile — NEXA Troli (Android tablet)
- inventory.service.ts
- LaunchImage.imageset/README.md
- exchange-trend-chart.tsx
- Table
- exchange_flow_test.dart
- sync_result.dart
- test_app.dart
- 22 — Mobile Folder Structure (nexa_mobile)
- whatsapp.port.ts
- idempotency_and_retry_test.dart
- fixtures.dart
- factory-scope-store.ts
- active_exchange_store_impl.dart
- app_logger.dart
- package:nexa_mobile/shared/l10n/app_strings.dart
- operator_lookup.dart
- history_repository.dart
- AppDelegate
- ios/RunnerTests/RunnerTests.swift
- keyboard_wedge_rfid_reader.dart
- rfid_providers.dart
- inventory_stock_repository_impl.dart
- @DataClassName
- radix-ui
- history_detail_controller.dart
- tailwind-merge
- @testing-library/react
- vitest
- zustand
- String?
- Uuid
- i0.VersionedTable
- history_filter.dart
- history_controller.dart
- dashboard/api/data-source.ts
- home_screen.dart
- camera_evidence_camera.dart
- FakeRefreshTokenRepository
- i0.VersionedSchema
- RefreshTokenRepository
- flow_driver.dart
- HealthService
- bool get
- exchange_sync_view.dart
- .constructor
- exchange_projection.dart
- notification.module.ts
- eslint
- eslint-config-next
- NotificationService
- history_screen_test.dart
- rfid_debouncer.dart
- public.decorator.ts
- MessageHandler
- package:nexa_mobile/core/connectivity/connectivity.dart
- user.service.ts
- @hookform/resolvers
- RfidCardService
- sonner
- date_time_format.dart
- zod

## God Nodes (most connected - your core abstractions)
1. `AuthenticatedUser` - 244 edges
2. `getApiErrorMessage()` - 148 edges
3. `RequirePermissions()` - 113 edges
4. `PrismaService` - 102 edges
5. `cn()` - 89 edges
6. `react` - 71 edges
7. `useFactoryScopeStore` - 69 edges
8. `usePermission()` - 60 edges
9. `assertFactoryScope()` - 58 edges
10. `@nestjs/swagger` - 53 edges

## Surprising Connections (you probably didn't know these)
- `Exchange State (Domain Concept)` --semantically_similar_to--> `Exchange State Machine (Pure Function)`  [INFERRED] [semantically similar]
  CONTEXT.md → Backend/ARCHITECTURE.md
- `WebApps Next.js Bootstrap README` --semantically_similar_to--> `WebApps Frontend Stack (Next.js/shadcn/Tailwind/Recharts)`  [INFERRED] [semantically similar]
  WebApps/README.md → Docs/design.md
- `ADR-005 Offline-First Android` --semantically_similar_to--> `AADR-003 Mobile Offline-First`  [INFERRED] [semantically similar]
  Backend/CLAUDE.md → Docs/06-Application-Architecture.md
- `Authorized Approver Actor` --references--> `Business Process Specification`  [EXTRACTED]
  CONTEXT.md → Docs/02-Business-Process.md
- `Exchange Type (Domain Concept)` --references--> `PRD v2.0`  [EXTRACTED]
  CONTEXT.md → Docs/01-Needle_Management_System_PRD_v2.0.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Backend Architecture Decision Records (ADR-001..006)** — backend_claude_adr_001_modular_monolith, backend_claude_adr_002_postgresql, backend_claude_adr_003_trolley_location, backend_claude_adr_004_backend_stock_authority, backend_claude_adr_005_offline_first_android, backend_claude_adr_006_whatsapp_notification_only [EXTRACTED 1.00]
- **Backend↔WebApps Gap Documentation Triad** — docs_architecture_backend_webapps_action_plan_overview, docs_architecture_backend_webapps_contract_matrix_overview, docs_architecture_backend_webapps_gap_analysis_overview [EXTRACTED 1.00]
- **Idempotency-Key Middleware Enforcement Pattern** — docs_20_claude_code_backend_setup_prompting_guide_phase2_common_layer, docs_20_claude_code_backend_setup_prompting_guide_phase6_inventory_module, docs_20_claude_code_backend_setup_prompting_guide_phase10_synchronization [EXTRACTED 1.00]
- **Requirements-to-Physical-Schema Document Baseline Chain** — docs_01_needle_management_system_prd_v2_0_doc, docs_02_business_process_doc, docs_03_use_case_doc, docs_04_functional_requirements_doc, docs_05_system_architecture_doc, docs_09_api_specification_doc, docs_10_database_design_doc, docs_11_database_erd_physical_schema_doc [EXTRACTED 1.00]
- **Backend/Mobile/WebApps Specification Pipeline (Doc 12→13→14→15→17→18)** — docs_12_openapi_swagger_specification_root, docs_13_rfid_integration_specification_root, docs_14_whatsapp_integration_specification_root, docs_15_mobile_offline_sync_specification_root, docs_17_mobile_ui_ux_specification_root, docs_18_webapps_ui_ux_specification_root [EXTRACTED 1.00]
- **Broken Needle Confirmation Flow** — context_confirmation, context_approval, context_fragment_status, backend_claude_module_approval [INFERRED 0.85]
- **Stock Ledger Integrity Pattern (no balance mutation without ledger entry)** — docs_20_claude_code_backend_setup_prompting_guide_phase3_database_schema, docs_20_claude_code_backend_setup_prompting_guide_phase6_inventory_module, docs_20_claude_code_backend_setup_prompting_guide_phase7_exchange_approval [INFERRED 0.85]

## Communities (346 total, 111 thin omitted)

### Community 0 - "package:nexa_mobile/features/exchange/domain/exchange.dart"
Cohesion: 0.06
Nodes (30): HistoryFilter, entries, localByServerId, mergeHistory, mine, seenServerIds, syncing, usedLocal (+22 more)

### Community 1 - "RequirePermissions"
Cohesion: 0.15
Nodes (24): Audit(), Paginated(), RequirePermissions(), ExchangeTypeController, FactoryController, LocationController, NeedleTypeController, StorageMappingController (+16 more)

### Community 2 - ".approve"
Cohesion: 0.17
Nodes (17): ConfirmationController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+9 more)

### Community 3 - "app_database.dart"
Cohesion: 0.01
Nodes (182): _, actualTableName, _alias, aliasedName, allSchemaEntities, allTables, attachedDatabase, attemptCount (+174 more)

### Community 4 - "PrismaService"
Cohesion: 0.03
Nodes (67): AppModule, Module, ALLOWED_HEADERS, configureApp(), PrismaService, Injectable, bootstrap(), RoleWithMemberCount (+59 more)

### Community 5 - "client.ts"
Cohesion: 0.04
Nodes (122): Button, ButtonProps, buttonVariants, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogTitle (+114 more)

### Community 6 - "inventory/api/types.ts"
Cohesion: 0.05
Nodes (56): createAdjustment(), createReceiving(), createReturn(), createTransfer(), fetchBalances(), fetchMovements(), fetchTrolleyStock(), AdjustmentReasonCode (+48 more)

### Community 7 - "app_database.steps.dart"
Cohesion: 0.01
Nodes (158): attemptCount, byteSize, capturedAt, category, checkedAt, clientTransactionId, closedAt, code (+150 more)

### Community 8 - "package:flutter/material.dart"
Cohesion: 0.02
Nodes (95): BorderRadius, Color, EdgeInsetsGeometry, IconData, AppTheme, light, seed, build (+87 more)

### Community 9 - "auth/data-source.ts"
Cohesion: 0.04
Nodes (59): fetchCurrentUser(), CurrentUser, ForgotPasswordRequest, ForgotPasswordResponse, LoginRequest, LoginResponse, LoginUser, ResetPasswordRequest (+51 more)

### Community 10 - "core/master-data/index.ts"
Cohesion: 0.05
Nodes (65): apiClient, fetchMasterData(), fetchMasterDataRow(), FILTERLESS_COLLECTIONS, LocationsQuery, MasterDataQuery, MasterDataQueryBase, SupplierQuery (+57 more)

### Community 11 - "exchange-transactions-page.test.tsx"
Cohesion: 0.11
Nodes (22): fetchExchangeDetail(), fetchExchangeEvidence(), fetchExchanges(), exchangeKeys, useExchangeDetail(), useExchangeEvidence(), useExchangeList(), EvidenceItem (+14 more)

### Community 12 - "schema_v1.dart"
Cohesion: 0.02
Nodes (86): class, class LocalDeviceContext extends, class LocalDeviceContextData extends, class LocalDeviceValidation extends, class LocalDeviceValidationData extends, class LocalExchangeType extends, class LocalExchangeTypeData extends, class LocalMasterDataVersion extends (+78 more)

### Community 13 - "auth/queries.ts"
Cohesion: 0.14
Nodes (21): DEFAULT_ERROR_MESSAGE, refreshAccessToken(), SERVER_UNREACHABLE_MESSAGE, config, forgotPassword(), login(), logout(), resetPassword() (+13 more)

### Community 14 - "schema_v2.dart"
Cohesion: 0.02
Nodes (88): class LocalExchange extends, class LocalExchangeData extends, class LocalExchangeEvidence extends, class LocalExchangeEvidenceData extends, class LocalNeedleTypeData extends, class LocalUserSession extends, GeneratedColumn, LocalExchange (+80 more)

### Community 15 - "auth.ts"
Cohesion: 0.10
Nodes (23): Captured, envelope(), FACTORY, makeDevice(), mockDeviceApi(), TROLLEY, Captured, envelope() (+15 more)

### Community 16 - "auth.controller.ts"
Cohesion: 0.09
Nodes (24): LoginResponseDto, LoginUserDto, MeResponseDto, TokenPairDto, ApiProperty, ForgotPasswordDto, ApiProperty, MaxLength (+16 more)

### Community 17 - "schema_v4.dart"
Cohesion: 0.02
Nodes (100): class LocalTrolleyStock extends, class LocalTrolleyStockData extends, LocalTrolleyStock, actualTableName, _alias, aliasedName, allSchemaEntities, allTables (+92 more)

### Community 18 - "dependencies"
Cohesion: 0.04
Nodes (47): dependencies, bcryptjs, bullmq, class-transformer, class-validator, dotenv, ioredis, joi (+39 more)

### Community 19 - "devDependencies"
Cohesion: 0.07
Nodes (29): jsdom, @playwright/test, postcss, tailwindcss, tailwindcss-animate, @testing-library/jest-dom, @testing-library/user-event, @types/react (+21 more)

### Community 20 - "schema_v3.dart"
Cohesion: 0.02
Nodes (99): class LocalSyncQueue extends, class LocalSyncQueueData extends, class LocalSyncState extends, class LocalSyncStateData extends, LocalSyncQueue, actualTableName, _alias, aliasedName (+91 more)

### Community 21 - "getApiErrorMessage"
Cohesion: 0.03
Nodes (112): react, react, getApiErrorMessage(), useMasterData(), useFactoryScopeStore, PERMISSIONS, usePermission(), PermissionCatalogueCard() (+104 more)

### Community 22 - "identity.module.ts"
Cohesion: 0.09
Nodes (15): IdentityModule, Module, Injectable, UserRepository, AuthService, LoginResult, Injectable, TokenPair (+7 more)

### Community 23 - "password-reset.service.ts"
Cohesion: 0.10
Nodes (15): EmailModule, Module, EMAIL_CLIENT, EmailMessage, EmailPort, ADR-0002, NodemailerEmailAdapter, ADR-0002 (+7 more)

### Community 24 - "app.module.ts"
Cohesion: 0.05
Nodes (36): AuditWriter, AuditWriterModule, Global, Module, Injectable, IdempotencyModule, Global, Module (+28 more)

### Community 25 - "RetentionService"
Cohesion: 0.15
Nodes (10): RecordRetentionProcessor, Processor, RETENTION_QUEUE, RETENTION_SWEEP_JOB, RetentionModule, InjectQueue, Module, RetentionService (+2 more)

### Community 26 - "audit-log-page.tsx"
Cohesion: 0.19
Nodes (15): fetchAuditLogs(), auditKeys, useAuditLogs(), AUDIT_ACTIONS, AuditAction, AuditLogEntry, AuditLogFilters, DEFAULT_AUDIT_FILTERS (+7 more)

### Community 27 - "GeneratedPluginRegistrant.swift"
Cohesion: 0.14
Nodes (12): Cocoa, connectivity_plus, flutter_secure_storage_darwin, FlutterMacOS, FlutterPluginRegistry, FlutterViewController, Foundation, mobile_scanner (+4 more)

### Community 28 - "Database ERD & Physical Schema"
Cohesion: 0.12
Nodes (23): Response Envelope Interceptor Ordering, ScopeGuard / assertFactoryScope Dual Implementation, Stock Ledger Invariants (Three Layers), Audit Logging Mechanism, Idempotency-Key / client_transaction_id Mechanism, Five-Dimension Authorization Model, Adjustment (Domain Concept), Approval (Domain Concept) (+15 more)

### Community 29 - "devDependencies"
Cohesion: 0.04
Nodes (49): devDependencies, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, globals, jest, @nestjs/cli, @nestjs/schematics (+41 more)

### Community 30 - "factory-queries.ts"
Cohesion: 0.25
Nodes (12): authKeys, activateFactory(), createFactory(), deactivateFactory(), updateFactory(), useActivateFactory(), useCreateFactory(), useDeactivateFactory() (+4 more)

### Community 31 - "notification.service.ts"
Cohesion: 0.15
Nodes (15): ADR-0006, resolveTemplateVariables(), STUCK_REASONS, STUCK_TEXT, StuckReason, stuckReasonText(), TEMPLATE_VARIABLES, TemplateCode (+7 more)

### Community 32 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 33 - "permissions/index.ts"
Cohesion: 0.15
Nodes (19): useCurrentUser(), Factory, useAuthorizedFactories(), hasAllPermissions(), hasAnyPermission(), hasPermission(), PermissionCode, PermissionHolder (+11 more)

### Community 34 - "identity.seed.ts"
Cohesion: 0.17
Nodes (16): humanize(), IdentitySeedResult, ROLE_DESCRIPTIONS, seedAdminUser(), seedIdentity(), seedPermissions(), seedRoles(), MasterDataSeedResult (+8 more)

### Community 35 - "UserController"
Cohesion: 0.25
Nodes (14): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get, HttpCode (+6 more)

### Community 36 - "compilerOptions"
Cohesion: 0.07
Nodes (27): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, incremental (+19 more)

### Community 37 - ".upload"
Cohesion: 0.10
Nodes (24): EvidenceController, ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags, Controller (+16 more)

### Community 38 - "System Architecture Document"
Cohesion: 0.23
Nodes (19): ADR-003 Trolley Is an Inventory Location, ADR-005 Offline-First Android, ADR-006 WhatsApp Is the Only Notification Channel, Exchange State (Domain Concept), Fragment Status (Domain Concept), Operator Actor, PIC Actor, PRD v2.0 (+11 more)

### Community 39 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, build, db:seed, docker:down, docker:up, format, lint, prisma:deploy (+11 more)

### Community 40 - "http-exception.filter.ts"
Cohesion: 0.10
Nodes (19): PAGINATED_KEY, ApiErrorBodyDto, ApiErrorDto, ApiSuccessDto, PaginatedPayload, ResponseMetaDto, ApiProperty, ApiPropertyOptional (+11 more)

### Community 41 - "evidence.service.ts"
Cohesion: 0.04
Nodes (44): DomainException, ERROR_CODES, ErrorCode, DEVICE_ID_HEADER, DeviceContextGuard, Injectable, isInFactoryScope(), ADR-0005 (+36 more)

### Community 42 - "Claude Code Backend Setup Prompting Guide"
Cohesion: 0.17
Nodes (19): Root CLAUDE.md, Exchange State Machine (CREATED→COMPLETED), State-Based UI (ExchangeState drives actions), Catatan Penggunaan, Fase 0 — Kunci Keputusan Terbuka, Fase 10 — Modul Synchronization, Fase 11 — Kontrak API & Dokumentasi, Fase 12 — Test Menyeluruh & Docker (+11 more)

### Community 43 - "jest"
Cohesion: 0.11
Nodes (18): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, moduleNameMapper, rootDir, roots, testEnvironment (+10 more)

### Community 44 - "sync_repositories.dart"
Cohesion: 0.07
Nodes (28): SyncCheckpointStoreImpl, SyncQueueImpl, SyncRemoteDataSource, byId, clearBackoff, commandsFor, cursor, delete (+20 more)

### Community 45 - "needle_type_picker.dart"
Cohesion: 0.05
Nodes (45): NeedleType, build, _CancelDialog, _CancelDialogState, choice, createState, dispose, initialReason (+37 more)

### Community 46 - "MasterDataService"
Cohesion: 0.09
Nodes (13): ListLocationsQueryDto, MasterDataQueryDto, ScopedMasterDataQueryDto, StorageMappingQueryDto, SupplierQueryDto, ApiPropertyOptional, IsEnum, IsInt (+5 more)

### Community 47 - "Backend CLAUDE.md"
Cohesion: 0.12
Nodes (17): Exchange State Machine (Pure Function), Side Effects Happen After Commit, ADR-001 Modular Monolith, Backend CLAUDE.md, approval module, audit module, device module, employee module (+9 more)

### Community 48 - "scope.guard.ts"
Cohesion: 0.17
Nodes (6): FACTORY_SCOPE_KEY, LOCATION_SCOPE_KEY, ScopeSource, ScopeGuard, Injectable, picFactoryA

### Community 49 - "sync_engine_test.dart"
Cohesion: 0.04
Nodes (47): ActiveExchangeStore get, EvidenceRepository get, _db, _exchanges, load, _photos, _queue, read (+39 more)

### Community 50 - "inventory-history.controller.ts"
Cohesion: 0.05
Nodes (81): CountSessionController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+73 more)

### Community 51 - "sync_remote_data_source.dart"
Cohesion: 0.03
Nodes (68): _Json, ApiClient, delays, immediate, RetryPolicy, _api, confirmation, create (+60 more)

### Community 52 - "connectivityStatusProvider"
Cohesion: 0.07
Nodes (54): appVersionProvider, serverClockProvider, connectivityStatusProvider, appConfigProvider, sessionControllerProvider, build, build, deviceValidationControllerProvider (+46 more)

### Community 53 - "network_providers.dart"
Cohesion: 0.03
Nodes (85): Dio, Future, _categoryFor, _categoryForStatus, ErrorMapper, fromCommandError, fromDioException, fromErrorBody (+77 more)

### Community 54 - "inventory-receiving.spec.ts"
Cohesion: 0.09
Nodes (21): Captured, collectionEnvelope(), CreateReceivingBody, envelope(), errorEnvelope(), existingReceiving(), FACTORY, jsonBody() (+13 more)

### Community 55 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, @testing-library/jest-dom, **/*.tsx, vitest/globals (+20 more)

### Community 56 - "data-table.test.tsx"
Cohesion: 0.29
Nodes (5): DataTableColumnHeader(), DataTableColumnHeaderProps, columns, Row, rows

### Community 57 - "history_entry.dart"
Cohesion: 0.06
Nodes (30): ConfirmationStatus? get, DateTime get, ExchangeState? get, FragmentStatus? get, cancelledAt, canResume, clientTransactionId, completedAt (+22 more)

### Community 58 - "authenticated-user.interface.ts"
Cohesion: 0.04
Nodes (52): AuditRecord, SNAPSHOT_FIELDS, AUDIT_ACTIONS, AUDIT_KEY, AuditAction, AuditEvent, CurrentUser, CurrentDevice (+44 more)

### Community 59 - "_Body"
Cohesion: 0.19
Nodes (16): InventoryController, ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags, Controller (+8 more)

### Community 60 - "providers.tsx"
Cohesion: 0.21
Nodes (8): inter, jetbrainsMono, metadata, RootLayout(), Providers(), Toaster(), QueryProvider(), ThemeProvider()

### Community 61 - "Backend ARCHITECTURE.md"
Cohesion: 0.23
Nodes (12): Backend ARCHITECTURE.md, ADR-002 PostgreSQL, Backend docker-compose.yml, minio service, minio-init service, postgres service, redis service, Backend README.md (+4 more)

### Community 62 - ".enroll"
Cohesion: 0.11
Nodes (24): RfidController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+16 more)

### Community 63 - "DeviceService"
Cohesion: 0.08
Nodes (34): DeviceController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+26 more)

### Community 64 - "operation-history-types.ts"
Cohesion: 0.05
Nodes (87): useLookup(), deviceColumns, userColumns, auditColumns, CountSessionStatus, fetchAdjustment(), fetchAdjustments(), fetchReceiving() (+79 more)

### Community 65 - "my_application.cc"
Cohesion: 0.09
Nodes (22): FlPluginRegistry, FlView, GApplication, gboolean, gchar, GObject, GtkApplication, MyApplicationClass (+14 more)

### Community 66 - "transfer-page.test.tsx"
Cohesion: 0.12
Nodes (13): DESTINATION_LOCATION, FACTORY, makePaged(), makeTransfer(), mockedCreateTransfer, mockedFetchAllUsers, mockedFetchBalances, mockedFetchCurrentUser (+5 more)

### Community 67 - "dependencies"
Cohesion: 0.07
Nodes (27): axios, class-variance-authority, clsx, date-fns, next-themes, react-dom, react-hook-form, recharts (+19 more)

### Community 68 - "WebApps Dev Subagent Spec"
Cohesion: 0.24
Nodes (11): ADR-004 Backend Is the Stock Authority, WebApps Dev Subagent Spec, Flag Gaps and Conflicts Principle, 10-Stage Development Lifecycle, Reuse Before You Build Principle, WebApps Stack Decision, OpenAPI/Swagger Specification, WebApps UI/UX Specification (+3 more)

### Community 69 - "count-session-detail-page.test.tsx"
Cohesion: 0.06
Nodes (46): addCountItem(), cancelCountSession(), completeCountSession(), createCountSession(), fetchCountSession(), fetchCountSessions(), countSessionKeys, useAddCountItem() (+38 more)

### Community 70 - "offline_sync_flow_test.dart"
Cohesion: 0.05
Nodes (39): ../helpers/flow_driver.dart, chooseTypes, _ctx, expectStep, _finishBentOffline, h, identifyOperatorOnline, main (+31 more)

### Community 71 - "Backend/package.json"
Cohesion: 0.20
Nodes (9): description, engines, node, license, name, prisma, seed, private (+1 more)

### Community 72 - "HealthController"
Cohesion: 0.29
Nodes (7): HealthController, ApiOperation, ApiResponse, ApiTags, Controller, Get, HealthStatus

### Community 73 - ".create"
Cohesion: 0.16
Nodes (16): EmployeeController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+8 more)

### Community 74 - "WhatsApp Integration Specification"
Cohesion: 0.31
Nodes (10): OpenAPI / Swagger Specification, Offline RFID Policy Deferral, RFID Integration Specification, WhatsApp Integration Specification, Mobile Offline Sync Specification, Mobile UI/UX Specification, WebApps UI/UX Specification, Backend Folder Structure (+2 more)

### Community 75 - "package:flutter_riverpod/flutter_riverpod.dart"
Cohesion: 0.03
Nodes (104): _, @DriftDatabase, AppConfig, Directory, ../helpers/fake_backend.dart, ../helpers/fake_exchange_server.dart, ../../../helpers/fakes.dart, ../helpers/fixtures.dart (+96 more)

### Community 76 - "sync.service.ts"
Cohesion: 0.03
Nodes (84): ClaimRequest, ClaimResult, IdempotencyStore, Injectable, IdempotencyKeyMiddleware, Injectable, toExchangeResponse(), ExchangeRepository (+76 more)

### Community 77 - "login_screen.dart"
Cohesion: 0.10
Nodes (21): build, errorMessage, LoginController, loginControllerProvider, LoginFormState, _messageFor, submit, submitting (+13 more)

### Community 78 - "POST /mobile/sync (client)"
Cohesion: 0.22
Nodes (9): Master Data APIs, POST /mobile/sync, Employee Resolution via RFID, BROKEN_NEEDLE_CONFIRMATION Message Template, POST /mobile/sync (client), Pending Sync Screen, Module-to-Document Mapping Table, GAP-03 Master-Data Read API (+1 more)

### Community 79 - "device_remote_data_source.dart"
Cohesion: 0.05
Nodes (39): active,
  inactive,
  revoked,, _api, bootstrap, BootstrapResponseDto, clockOffsetMs, device, factory, fromJson (+31 more)

### Community 80 - "exchange_flow_controller.dart"
Cohesion: 0.03
Nodes (70): ExchangeRepository get, masterDataRefresherProvider, confirmationPollIntervalProvider, _apply, _attempts, cancel, _cancelBeforeCreateAnswered, changeOldNeedle (+62 more)

### Community 81 - "scripts"
Cohesion: 0.17
Nodes (11): name, private, scripts, build, dev, lint, start, test (+3 more)

### Community 82 - "exclude"
Cohesion: 0.25
Nodes (7): exclude, extends, dist, node_modules, test, **/*spec.ts, ./tsconfig.json

### Community 83 - "ADR-0001 Dashboard v1 Scoped to Existing Contract"
Cohesion: 0.33
Nodes (7): Dashboard API, Dashboard Screen, ADR-0001 Dashboard v1 Scoped to Existing Contract, ADR Conflict Flagging Policy, GAP-09 No Reporting Module — Dashboard on Fixtures, DD-6 Dashboard Endpoint Payloads Undefined, KpiCard Component

### Community 84 - "extends"
Cohesion: 0.29
Nodes (6): error, next/core-web-vitals, next/typescript, extends, rules, @typescript-eslint/no-unused-vars

### Community 85 - "inventory-adjustment.spec.ts"
Cohesion: 0.09
Nodes (21): AdjustmentEvidence, AdjustmentRow, Captured, collectionEnvelope(), countSessionAdjustment(), CreateAdjustmentBody, envelope(), errorEnvelope() (+13 more)

### Community 86 - "app_strings.dart"
Cohesion: 0.01
Nodes (322): accessDeniedBody, accessDeniedTitle, appName, AppStrings, appVersion, awaitingBody, awaitingOffline, awaitingQueuedBody (+314 more)

### Community 87 - "master_data_refresher_test.dart"
Cohesion: 0.03
Nodes (83): _bootstrap, BootstrapMasterDataRefresher, _masterData, refresh, bootstrap, BootstrapRepositoryImpl, cached, _deviceStore (+75 more)

### Community 88 - "provisioning_screen.dart"
Cohesion: 0.03
Nodes (89): ConsumerState, ConsumerStatefulWidget, dart:async, MobileScannerController, MobileScannerException?, _controller, dispose, sessionEnded (+81 more)

### Community 89 - "device_access_monitor.dart"
Cohesion: 0.24
Nodes (9): _controller, DeviceAccessEvent, DeviceAccessInactive, DeviceAccessMonitor, DeviceAccessNotFound, dispose, events, report (+1 more)

### Community 90 - "integrations/ Adapter Isolation Pattern"
Cohesion: 0.40
Nodes (5): WhatsApp Notification Flow (Backend Internal), Reader Integration Modes (USB/Bluetooth/Vendor SDK), POST /internal/notifications/whatsapp Payload, Evidence Upload Flow (Photo → Object Storage), integrations/ Adapter Isolation Pattern

### Community 91 - "DataClass"
Cohesion: 0.06
Nodes (64): DeviceContextRow, DeviceValidationRow, ExchangeTypeRow, LocalDeviceContextCompanion, LocalDeviceValidationCompanion, LocalExchangeCompanion, LocalExchangeEvidenceCompanion, LocalExchangeEvidenceRow (+56 more)

### Community 92 - "inventory-physical-count.spec.ts"
Cohesion: 0.11
Nodes (23): AdjustmentDetail, cancelledSession(), Captured, collectionEnvelope(), completedSession(), CountItem, CountSession, envelope() (+15 more)

### Community 93 - "inventory-return.spec.ts"
Cohesion: 0.10
Nodes (19): Captured, collectionEnvelope(), CreateReturnBody, envelope(), errorEnvelope(), existingReturn(), FACTORY, jsonBody() (+11 more)

### Community 94 - "inventory-transfer.spec.ts"
Cohesion: 0.11
Nodes (18): Captured, collectionEnvelope(), CreateTransferBody, envelope(), errorEnvelope(), existingTransfer(), FACTORY, jsonBody() (+10 more)

### Community 96 - "Confirmation API"
Cohesion: 0.67
Nodes (3): Confirmation API, Confirmation Approve/Reject API (WhatsApp context), DD-2 /approvals vs /confirmations Drift

### Community 97 - "ADR-0002 Password Reset Email is Transactional, Not a Notification Channel"
Cohesion: 0.67
Nodes (3): POST /auth/forgot-password, POST /auth/reset-password, ADR-0002 Password Reset Email is Transactional, Not a Notification Channel

### Community 98 - "GAP-12 No Health/Readiness Endpoint"
Cohesion: 0.67
Nodes (3): Health API (/health, /ready), GAP-12 No Health/Readiness Endpoint, DD-5 Health/Ready Envelope Closed

### Community 99 - "Idempotency Rules"
Cohesion: 0.67
Nodes (3): Idempotency Rules, Notification Idempotency Rule, clientTransactionId + Idempotency-Key Rule

### Community 100 - "Backend ↔ WebApps Action Plan"
Cohesion: 1.00
Nodes (3): Backend ↔ WebApps Action Plan, Backend ↔ WebApps Contract Matrix, Backend ↔ WebApps Gap Analysis

### Community 102 - "storage-screen.test.tsx"
Cohesion: 0.11
Nodes (23): createStorageMapping(), fetchStorageMappings(), updateStorageMapping(), storageMappingKeys, useCreateStorageMapping(), useStorageMappings(), useUpdateStorageMapping(), CreateStorageMappingInput (+15 more)

### Community 103 - "exchange_repository.dart"
Cohesion: 0.05
Nodes (38): OperatorIdentity, all, begin, byId, clientTransactionId, closedAt, CommandResult, confirmationStatus (+30 more)

### Community 104 - "users-screen-write.test.tsx"
Cohesion: 0.10
Nodes (33): fetchAllUsers(), fetchUser(), fetchUsers(), userDisplayLabel(), userKeys, UserLookup, useUserLookup(), useUsersByRole() (+25 more)

### Community 105 - "AuthController"
Cohesion: 0.23
Nodes (14): Public(), AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser (+6 more)

### Community 106 - "master-data.controller.ts"
Cohesion: 0.14
Nodes (42): DUPLICATE_CODE, EDIT_FORBIDDEN, FORBIDDEN, NOT_FOUND, CreateFactoryDto, CreateLocationDto, CreateNeedleTypeDto, CreateStorageMappingDto (+34 more)

### Community 107 - "confirmation-monitoring-page.tsx"
Cohesion: 0.13
Nodes (24): approveConfirmation(), fetchConfirmation(), fetchConfirmations(), rejectConfirmation(), confirmationKeys, useApproveConfirmation(), useConfirmation(), useConfirmationList() (+16 more)

### Community 108 - "exchange_flow_state.dart"
Cohesion: 0.04
Nodes (52): EvidenceType? get, approvedNotice, availableQuantity, busy, cancelledAfterIssue, canRetry, catalog, confirmation (+44 more)

### Community 109 - "sync_controller.dart"
Cohesion: 0.09
Nodes (27): activeExchangeStoreProvider, syncCheckpointStoreProvider, syncEngineProvider, syncPeriodicIntervalProvider, syncQueueProvider, _auto, build, cancelExchange (+19 more)

### Community 110 - "app_error.dart"
Cohesion: 0.04
Nodes (47): authForbidden, authInvalidToken, BackendErrorCodes, category, ClientErrorCodes, code, conflict, context (+39 more)

### Community 111 - "tables.dart"
Cohesion: 0.03
Nodes (77): BoolColumn get, DateTimeColumn get, IntColumn get, attemptCount, byteSize, capturedAt, category, checkedAt (+69 more)

### Community 112 - "cn"
Cohesion: 0.06
Nodes (66): Badge(), BadgeProps, badgeVariants, Card, CardContent, CardDescription, CardFooter, CardHeader (+58 more)

### Community 113 - "adjustment-page.test.tsx"
Cohesion: 0.11
Nodes (13): FACTORY, LOCATION, makeAdjustment(), makePaged(), mockedCreateAdjustment, mockedFetchAdjustment, mockedFetchAdjustments, mockedFetchAllUsers (+5 more)

### Community 114 - "device_validation_controller.dart"
Cohesion: 0.14
Nodes (20): DeviceStatus, bootstrapRepositoryProvider, context, DeviceValidationController, DeviceValidationState, error, _forgetDevice, _forgetting (+12 more)

### Community 115 - "master_data_versions.dart"
Cohesion: 0.05
Nodes (42): apply, clear, _db, _deleteVersion, exchangeTypes, needleTypes, _replaceRows, storageMappings (+34 more)

### Community 116 - "evidence_views.dart"
Cohesion: 0.08
Nodes (28): evidenceCameraPreviewBuilderProvider, evidenceCameraProvider, build, busy, _bytes, _camera, _CameraProblem, _capture (+20 more)

### Community 117 - "sync_engine.dart"
Cohesion: 0.05
Nodes (42): accepted, acceptedTypes, _acceptsEvidence, _applyChanges, _applyResults, _checkpoints, _evidence, _exchanges (+34 more)

### Community 119 - "fake_backend.dart"
Cohesion: 0.10
Nodes (20): dart:typed_data, body, close, error, FakeHandler, FakeResponse, fetch, _handlers (+12 more)

### Community 120 - "router.dart"
Cohesion: 0.05
Nodes (41): @visibleForTesting, GoRouter, build, AppGate, appGateProvider, resolveAppGate, NexaApp, allowed (+33 more)

### Community 121 - "exchange_steps.dart"
Cohesion: 0.09
Nodes (39): ConsumerWidget, StokTroliCard, exchangeFlowControllerProvider, ExchangeFlowScreen, StockProblem, AwaitingConfirmationStep, AwaitingSyncStep, build (+31 more)

### Community 122 - "DateTime"
Cohesion: 0.10
Nodes (20): DateTime, build, CachedContextBanner, cachedSince, _hhmm, cached, CachedTrolleyStock, error (+12 more)

### Community 123 - "needle-type-screen.test.tsx"
Cohesion: 0.13
Nodes (21): NeedleType, activateNeedleType(), createNeedleType(), deactivateNeedleType(), updateNeedleType(), useActivateNeedleType(), useCreateNeedleType(), useDeactivateNeedleType() (+13 more)

### Community 126 - "AuthenticatedUser"
Cohesion: 0.07
Nodes (13): AuthenticatedUser, JwtPayload, AdjustmentEvidenceService, Inject, Injectable, CountSessionService, Injectable, InventoryHistoryService (+5 more)

### Community 127 - "PasswordResetTokenRepository"
Cohesion: 0.14
Nodes (5): PasswordResetTokenRepository, Injectable, PasswordResetService, Inject, Injectable

### Community 128 - "evidence_camera.dart"
Cohesion: 0.22
Nodes (8): capture, capturedAt, CapturedPhoto, dispose, EvidenceCameraStatus, initialize, mimeType, path

### Community 148 - "StatelessWidget"
Cohesion: 0.03
Nodes (91): CancelledStep, ConfirmationBlockedStep, DoneStep, PendingSyncBanner, _StockProblemPanel, NeedleRole, catalog, child (+83 more)

### Community 149 - "1. Fase 0 — Yang Harus Selesai *Sebelum* Membuka Claude Code"
Cohesion: 0.14
Nodes (13): 0. Kenapa Dokumen Ini Ada, 1.1 Verifikasi kontrak API mobile vs backend aktual, 1.2 Kunci keputusan teknis terbuka, 1.3 `Mobile/CLAUDE.md` — root rules untuk Claude Code, 1.4 `Docs/22-Mobile-Folder-Structure.md`, 1.5 Agent routing — `Docs/agents/mobile-dev.md`, 1.6 SKILL.md yang paling relevan, 1.7 Pemecahan tiket di `.scratch/` (+5 more)

### Community 151 - "sync_status.dart"
Cohesion: 0.08
Nodes (25): LocalSyncState, activity, allSynced, build, failed, indicator, lastSyncAt, local (+17 more)

### Community 152 - "MOCK_SESSION_USER"
Cohesion: 0.18
Nodes (9): Captured, envelope(), FACTORY, makeUser(), mockUsersApi(), mockLoggedOut(), unauthorized(), MOCK_SESSION_USER (+1 more)

### Community 153 - "role-detail-screen.test.tsx"
Cohesion: 0.12
Nodes (17): fetchPermissions(), fetchRoles(), roleKeys, usePermissionCatalogue(), useRole(), useRoles(), PermissionRow, RoleRow (+9 more)

### Community 154 - "fakes.dart"
Cohesion: 0.03
Nodes (59): dart:io, evidenceDirectoryProvider, awaitingUpload, _db, _deleteFile, _deleteRow, discard, discardAll (+51 more)

### Community 155 - "users-screen.tsx"
Cohesion: 0.15
Nodes (24): assignFactoryScope(), assignRole(), createUser(), revokeFactoryScope(), revokeRole(), updateUser(), useAssignFactoryScope(), useAssignRole() (+16 more)

### Community 156 - "win32_window.cpp"
Cohesion: 0.16
Nodes (15): wchar_t, Scale(), Create, Destroy, GetHandle, SetQuitOnClose, Win32Window::Win32Window(), WindowClassRegistrar (+7 more)

### Community 158 - "proxy-config.test.ts"
Cohesion: 0.29
Nodes (4): nextConfig, nextConfig, ORIGINAL, SimpleRewrite

### Community 159 - "rfid-screen.test.tsx"
Cohesion: 0.09
Nodes (28): ApiSuccessBody, createEmployee(), updateEmployee(), useCreateEmployee(), useUpdateEmployee(), CreateEmployeeInput, EntityStatus, UpdateEmployeeInput (+20 more)

### Community 160 - "design_tokens.dart"
Cohesion: 0.07
Nodes (29): @immutable, BuildContext, DesignTokens get, buttonHeight, cardShadow, copyWith, ctaBackground, ctaBackgroundDark (+21 more)

### Community 161 - "confirmation.service.ts"
Cohesion: 0.07
Nodes (27): CONFIRMATION_EXPIRY_JOB, CONFIRMATION_EXPIRY_QUEUE, ConfirmationExpiryProcessor, Processor, ApprovalModule, InjectQueue, Module, ApproveConfirmationDto (+19 more)

### Community 162 - "envelope.dart"
Cohesion: 0.09
Nodes (22): ApiErrorBody, Envelope, ApiErrorBody, code, context, data, details, Envelope (+14 more)

### Community 167 - "receiving-page.test.tsx"
Cohesion: 0.10
Nodes (14): FACTORY, makePaged(), makeReceiving(), mockedCreateReceiving, mockedFetchAllUsers, mockedFetchBalances, mockedFetchCurrentUser, mockedFetchMasterData (+6 more)

### Community 235 - "devices-screen.tsx"
Cohesion: 0.06
Nodes (57): activateDevice(), fetchDevices(), reassignDevice(), registerDevice(), revokeDevice(), buildDeviceQrPayload(), DEVICE_QR_TYPE, DEVICE_QR_VERSION (+49 more)

### Community 242 - "exchange.dart"
Cohesion: 0.05
Nodes (38): blocksExchange, brokenExchangeTypeCode, cancelledAt, completedAt, confirmationId, confirmationNumber, ConfirmationSnapshot, ConfirmationStatus (+30 more)

### Community 243 - "Win32Window"
Cohesion: 0.13
Nodes (20): DartProject, FlutterWindow, flutter_controller_, FlutterWindow::FlutterWindow(), OnCreate, OnDestroy, project_, DartProject (+12 more)

### Community 244 - "provisioning_controller.dart"
Cohesion: 0.15
Nodes (17): provisioningRepositoryProvider, ProvisionedDevice, build, confirm, device, _load, notice, Provisioned (+9 more)

### Community 245 - "assertFactoryScope"
Cohesion: 0.08
Nodes (47): assertFactoryScope(), ExchangeController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser (+39 more)

### Community 246 - "administration-roles.spec.ts"
Cohesion: 0.32
Nodes (7): Captured, envelope(), FACTORY, makeMember(), mockRolesApi(), PERMISSIONS, ROLES

### Community 247 - "auth_remote_data_source.dart"
Cohesion: 0.03
Nodes (74): AuthRepository get, LoginResult, sessionEventsProvider, authRepositoryProvider, accessToken, _api, AuthRemoteDataSource, expiresInSeconds (+66 more)

### Community 248 - ".findAll"
Cohesion: 0.17
Nodes (10): RoleController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+2 more)

### Community 249 - "app_config.dart"
Cohesion: 0.10
Nodes (19): dev,
  staging,, Exception, apiBaseUrl, AppConfig, AppConfigException, AppEnvironment, connectTimeout, defaultRfidDebounce (+11 more)

### Community 250 - "Admin-panel CRUD audit: five contract-ready write gaps close next, three stay blocked on undecided policy, three are recorded but not queued"
Cohesion: 0.29
Nodes (6): Admin-panel CRUD audit: five contract-ready write gaps close next, three stay blocked on undecided policy, three are recorded but not queued, Audit findings — status per module, Consequences, Decision, What this does not change, What was audited

### Community 251 - "history_providers.dart"
Cohesion: 0.12
Nodes (17): exchangeType, exchangeTypes, HistoryCatalog, _historyRemoteProvider, historyRepositoryProvider, masterData, needle, needleTypes (+9 more)

### Community 252 - "nest-cli.json"
Cohesion: 0.29
Nodes (6): collection, compilerOptions, deleteOutDir, plugins, $schema, sourceRoot

### Community 253 - "wWinMain"
Cohesion: 0.24
Nodes (9): _In_, _In_opt_, wWinMain(), string, wchar_t, CreateAndAttachConsole(), GetCommandLineArguments(), Utf8FromUtf16() (+1 more)

### Community 254 - "sync_command.dart"
Cohesion: 0.07
Nodes (26): attemptCount, clientTransactionId, closesExchange, code, commandId, context, createdAt, fromWire (+18 more)

### Community 255 - "device_outcomes.dart"
Cohesion: 0.09
Nodes (26): Duration, build, now, observe, ServerClock, setOffset, blockedStatusOf, BootstrapAccessDenied (+18 more)

### Community 256 - "Backend ↔ Mobile Contract Matrix"
Cohesion: 0.18
Nodes (10): Backend ↔ Mobile Contract Matrix, Conventions every tablet call follows, Doc 07 error names → backend codes (Doc 07 §40–41), Gaps and decisions, Mapping tables the tablet needs, Matrix, Stock status labels (FR-MOB-015), Summary (+2 more)

### Community 257 - "sync_state_mapper.dart"
Cohesion: 0.10
Nodes (25): SyncCommandError, AcceptCommand, CommandTransition, error, evidencePhase, forExchange, forRequestFailure, forResult (+17 more)

### Community 262 - "manifest.json"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, name, orientation, prefer_related_applications, short_name (+2 more)

### Community 263 - "MessageHandler"
Cohesion: 0.38
Nodes (10): HWND, LPARAM, LRESULT, UINT, WPARAM, EnableFullDpiSupportIfAvailable(), GetThisFromHandle, MessageHandler (+2 more)

### Community 264 - "device_qr_payload.dart"
Cohesion: 0.09
Nodes (21): DeviceQrPayload?, deviceCode, deviceId, DeviceQrAccepted, DeviceQrParseResult, DeviceQrPayload, DeviceQrPayloadParser, DeviceQrRejected (+13 more)

### Community 265 - "UpdateCompanion"
Cohesion: 0.06
Nodes (50): LocalDeviceContextData, LocalDeviceValidationData, LocalExchangeData, LocalExchangeEvidenceData, LocalExchangeTypeData, LocalMasterDataVersionData, LocalNeedleTypeData, LocalStorageMappingData (+42 more)

### Community 266 - "package:nexa_mobile/core/error/app_error.dart"
Cohesion: 0.12
Nodes (26): _byCode, ErrorMessages, forCategory, forCode, availableQuantity, AwaitConfirmation, ExchangeCommand, ExchangeErrorRoute (+18 more)

### Community 267 - "evidence.dart"
Cohesion: 0.07
Nodes (29): allowedMimeTypes, byteSize, capturedAt, check, clientTransactionId, EvidenceFilePolicy, EvidenceFileProblem, EvidencePolicy (+21 more)

### Community 268 - "AuditQueryDto"
Cohesion: 0.06
Nodes (27): AuditController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+19 more)

### Community 269 - "CLAUDE.md — nexa_mobile (Troli App)"
Cohesion: 0.22
Nodes (8): §1 Non-negotiable principles, §2 Locked decisions, §3 Module boundary (package-by-feature, mirrors Backend §4 / Doc 19), §4 Mandatory coding rules, §5 Testing required per feature, §6 References, §7 Before Fase 0 checklist items still open, CLAUDE.md — nexa_mobile (Troli App)

### Community 270 - "master_data.dart"
Cohesion: 0.13
Nodes (14): category, code, ExchangeType, exchangeTypeId, id, minimumStock, name, NeedleType (+6 more)

### Community 271 - "Flutter project rules — nexa_mobile"
Cohesion: 0.25
Nodes (7): Decisions this skill assumes (source: `nexa_mobile/CLAUDE.md` §2), Domain vocabulary in code, Flutter project rules — nexa_mobile, Mandatory rules beyond the generic baseline, Module boundary (mirrors `nexa_mobile/CLAUDE.md` §3), Testing (adds to generic baseline's "write code with testing in mind"), What's still generic (unchanged from `Docs/Flutter_rules/rules.md`)

### Community 272 - "return-page.test.tsx"
Cohesion: 0.11
Nodes (14): FACTORY, makePaged(), makeReturn(), mockedCreateReturn, mockedFetchAllUsers, mockedFetchBalances, mockedFetchCurrentUser, mockedFetchMasterData (+6 more)

### Community 273 - "mobile-dev.md"
Cohesion: 0.29
Nodes (6): Flag gaps and conflicts — don't silently paper over them, Flutter/Dart tooling — dart-flutter plugin, Provisional vs. locked decisions — stop before building on a TBD, Reuse before you build, Source of truth — read before deciding anything, The lifecycle

### Community 274 - "secure_store.dart"
Cohesion: 0.07
Nodes (26): FlutterSecureStorage, _cached, clear, deviceCode, deviceId, _loaded, ProvisionedDeviceStore, read (+18 more)

### Community 276 - "sync_queue_impl.dart"
Cohesion: 0.03
Nodes (59): dart:convert, Interceptor, blocked, history, historyDetail, home, login, newExchange (+51 more)

### Community 278 - "nexa_mobile — NEXA Troli (Android tablet)"
Cohesion: 0.40
Nodes (4): Environments, First launch on a tablet, nexa_mobile — NEXA Troli (Android tablet), Tests

### Community 279 - "inventory.service.ts"
Cohesion: 0.04
Nodes (56): NumberSequenceService, PREFIXES, SEQUENCE_SCOPES, Injectable, AddCountItemDto, CreateAdjustmentDto, CreateCountSessionDto, CreateReceivingDto (+48 more)

### Community 281 - "exchange-trend-chart.tsx"
Cohesion: 0.09
Nodes (35): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), getPayloadConfigFromPayload(), INITIAL_DIMENSION (+27 more)

### Community 282 - "Table"
Cohesion: 0.10
Nodes (41): LocalDeviceContext, LocalDeviceValidation, LocalExchangeType, LocalMasterDataVersion, LocalNeedleType, LocalStorageMapping, LocalUserSession, LocalDeviceContext (+33 more)

### Community 283 - "exchange_flow_test.dart"
Cohesion: 0.04
Nodes (43): File, FilledButton, generated/schema.dart, generated/schema_v1.dart, generated/schema_v2.dart, generated/schema_v3.dart, generated/schema_v4.dart, databaseForVersion (+35 more)

### Community 284 - "sync_result.dart"
Cohesion: 0.09
Nodes (22): changedExchanges, clientTransactionId, commandId, commandType, confirmationStatus, error, exchange, fromWire (+14 more)

### Community 291 - "test_app.dart"
Cohesion: 0.03
Nodes (62): fake_backend.dart, fakes.dart, fixtures.dart, backend, _cancel, cancelReason, cardUid, clientTransactionId (+54 more)

### Community 292 - "22 — Mobile Folder Structure (nexa_mobile)"
Cohesion: 0.25
Nodes (7): 1. Top level, 22 — Mobile Folder Structure (nexa_mobile), 2. `lib/app/` and `lib/core/`, 3. `lib/features/`, 4. `lib/shared/`, 5. Local database (Drift), 6. Environments

### Community 293 - "whatsapp.port.ts"
Cohesion: 0.22
Nodes (10): MetaCloudWhatsAppAdapter, MetaSendResponse, Injectable, Module, WhatsAppModule, ADR-0006, WHATSAPP_CLIENT, WhatsAppMessage (+2 more)

### Community 294 - "idempotency_and_retry_test.dart"
Cohesion: 0.13
Nodes (18): CommandResult, ApiFailure, ApiResult, ApiSuccess, data, error, meta, ApiMeta (+10 more)

### Community 295 - "fixtures.dart"
Cohesion: 0.29
Nodes (6): bootstrapData, deviceCode, deviceId, heartbeatData, loginData, meData

### Community 296 - "factory-scope-store.ts"
Cohesion: 0.21
Nodes (11): displayLabel(), FactoryScopeState, Confirmation, UsedNeedleStorageLocationSelect, ExchangeState, ExchangeDetailScreen(), ExchangeFilters(), ExchangeTransactionsScreen() (+3 more)

### Community 297 - "active_exchange_store_impl.dart"
Cohesion: 0.06
Nodes (34): ExchangeRepository, ActiveExchangeStoreImpl, all, begin, byId, current, _db, _dropForeign (+26 more)

### Community 298 - "app_logger.dart"
Cohesion: 0.33
Nodes (5): dart:developer, AppLogger, error, info, warning

### Community 299 - "package:nexa_mobile/shared/l10n/app_strings.dart"
Cohesion: 0.04
Nodes (53): AsyncValue, build, PenukaranHariIniCard, build, stock, trolleyId, build, onTap (+45 more)

### Community 300 - "operator_lookup.dart"
Cohesion: 0.15
Nodes (14): RfidRepositoryImpl, employeeId, employeeNumber, error, factoryId, lookup, name, operator (+6 more)

### Community 301 - "history_repository.dart"
Cohesion: 0.19
Nodes (13): count, error, HistoryPageFailed, HistoryPageLoaded, HistoryPageOutcome, page, rows, todayExchangeCount (+5 more)

### Community 302 - "AppDelegate"
Cohesion: 0.16
Nodes (10): Any, FlutterAppDelegate, FlutterImplicitEngineBridge, FlutterImplicitEngineDelegate, AppDelegate, Bool, AppDelegate, Bool (+2 more)

### Community 303 - "ios/RunnerTests/RunnerTests.swift"
Cohesion: 0.18
Nodes (8): Flutter, FlutterSceneDelegate, SceneDelegate, RunnerTests, RunnerTests, UIKit, XCTest, XCTestCase

### Community 304 - "keyboard_wedge_rfid_reader.dart"
Cohesion: 0.12
Nodes (15): HardwareKeyboard?, HardwareKeyboard get, _buffer, _cards, cardStream, _debouncer, dispose, handleKeyEvent (+7 more)

### Community 305 - "rfid_providers.dart"
Cohesion: 0.11
Nodes (18): KeyboardWedgeRfidReader, reader, cardStream, dispose, initialize, ManualUidInput, RfidReader, submit (+10 more)

### Community 306 - "inventory_stock_repository_impl.dart"
Cohesion: 0.05
Nodes (40): AsyncNotifier, InventoryRemoteDataSource, _inventoryRemoteProvider, trolleyStockRepositoryProvider, cachedTrolleyStock, InventoryStockRepositoryImpl, _local, _mapItems (+32 more)

### Community 307 - "@DataClassName"
Cohesion: 0.15
Nodes (13): @DataClassName, LocalDeviceContext, LocalDeviceValidation, LocalExchange, LocalExchangeEvidence, LocalExchangeType, LocalMasterDataVersion, LocalNeedleType (+5 more)

### Community 309 - "history_detail_controller.dart"
Cohesion: 0.14
Nodes (19): ConfirmationStatus?, exchangeRepositoryProvider, HistoryEntry, confirmation, DetailEvidence, entry, error, evidence (+11 more)

### Community 316 - "i0.VersionedTable"
Cohesion: 0.14
Nodes (14): i0.VersionedTable, Shape0, Shape1, Shape10, Shape11, Shape12, Shape2, Shape3 (+6 more)

### Community 317 - "history_filter.dart"
Cohesion: 0.08
Nodes (23): int get, contains, copyWith, end, exchangeTypeId, first, from, hashCode (+15 more)

### Community 318 - "history_controller.dart"
Cohesion: 0.05
Nodes (38): List, AppError, copyWith, _deviceId, error, filter, _generation, hasMore (+30 more)

### Community 319 - "dashboard/api/data-source.ts"
Cohesion: 0.33
Nodes (10): FIXTURE_EXCHANGE_TREND, FIXTURE_NEEDLE_CONSUMPTION, FIXTURE_OVERVIEW, FIXTURE_STOCK_SUMMARY, DashboardFilters, DashboardOverview, ExchangeTrendPoint, NeedleConsumptionItem (+2 more)

### Community 320 - "home_screen.dart"
Cohesion: 0.06
Nodes (35): DeviceContextSnapshot, riwayatSubtitle, _StackedLayout, sync, _TabletLayout, trolleyId, build, c (+27 more)

### Community 321 - "camera_evidence_camera.dart"
Cohesion: 0.15
Nodes (13): CameraController?, buildPreview, camera, CameraPackageEvidenceCamera, capture, _controller, dispose, EvidenceCameraPreviewBuilder (+5 more)

### Community 323 - "i0.VersionedSchema"
Cohesion: 0.50
Nodes (4): i0.VersionedSchema, Schema2, Schema3, Schema4

### Community 325 - "flow_driver.dart"
Cohesion: 0.12
Nodes (16): fake_exchange_server.dart, chooseTypes, ensureVisible, enterText, expectStep, finder, identifyOperatorOnline, settle (+8 more)

### Community 326 - "HealthService"
Cohesion: 0.33
Nodes (3): HealthService, Injectable, InjectQueue

### Community 327 - "bool get"
Cohesion: 0.07
Nodes (26): bool get, complete,

  
  
  awaitingSync,

  
  done,

  
  cancelled,, ExchangeFlowStep, ExchangeProgressStage, ExchangeStepMapper, isTerminal, stageOf, stagesFor (+18 more)

### Community 328 - "exchange_sync_view.dart"
Cohesion: 0.07
Nodes (25): ExchangeState?, Iterable, build, exchangeStateLabel, exchangeStateStyle, ExchangeStateText, state, tokens (+17 more)

### Community 330 - "exchange_projection.dart"
Cohesion: 0.15
Nodes (12): ExchangeSnapshot, closure, evidencePending, exchange, ExchangeProjection, fragmentPending, isPending, issuePending (+4 more)

### Community 331 - "notification.module.ts"
Cohesion: 0.31
Nodes (5): HealthModule, Module, NOTIFICATION_DISPATCH_JOB, NOTIFICATION_QUEUE, DispatchJobData

### Community 334 - "NotificationService"
Cohesion: 0.22
Nodes (4): NotificationDispatchProcessor, Processor, NotificationService, Injectable

### Community 335 - "history_screen_test.dart"
Cohesion: 0.08
Nodes (23): await, _choose, closed, connectivity, _createdToday, db, h, historyReads (+15 more)

### Community 339 - "rfid_debouncer.dart"
Cohesion: 0.22
Nodes (8): accept, _lastAt, _lastUid, normalizeRfidUid, reset, RfidDebouncer, value, window

### Community 340 - "public.decorator.ts"
Cohesion: 0.33
Nodes (3): IS_PUBLIC_KEY, JwtAuthGuard, Injectable

### Community 343 - "MessageHandler"
Cohesion: 0.33
Nodes (6): HWND, LPARAM, LRESULT, UINT, WPARAM, MessageHandler

### Community 345 - "package:nexa_mobile/core/connectivity/connectivity.dart"
Cohesion: 0.04
Nodes (45): Connectivity, Key, main, tap, main, main, changes, _connectivity (+37 more)

### Community 346 - "user.service.ts"
Cohesion: 0.06
Nodes (32): ApiPropertyOptional, IsIn, IsInt, IsOptional, IsUUID, Min, UserQueryDto, AssignFactoryScopeDto (+24 more)

### Community 350 - "RfidCardService"
Cohesion: 0.05
Nodes (30): CreateEmployeeDto, ApiProperty, ApiPropertyOptional, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID (+22 more)

### Community 352 - "date_time_format.dart"
Cohesion: 0.29
Nodes (6): formatDate, formatDateTime, formatShortDate, formatTime, l, _two

## Knowledge Gaps
- **3931 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+3926 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **111 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `_Body` connect `_Body` to `RequirePermissions`, `.approve`, `UserController`, `.upload`, `.create`, `AuthController`, `package:nexa_mobile/shared/l10n/app_strings.dart`, `sync.service.ts`, `inventory-history.controller.ts`, `StatelessWidget`, `assertFactoryScope`, `.enroll`, `DeviceService`?**
  _High betweenness centrality (0.210) - this node is a cross-community bridge._
- **Why does `AuthenticatedUser` connect `AuthenticatedUser` to `RequirePermissions`, `.approve`, `PrismaService`, `AuditQueryDto`, `auth.controller.ts`, `identity.module.ts`, `inventory.service.ts`, `confirmation.service.ts`, `UserController`, `.upload`, `evidence.service.ts`, `MasterDataService`, `scope.guard.ts`, `inventory-history.controller.ts`, `authenticated-user.interface.ts`, `_Body`, `.enroll`, `DeviceService`, `.create`, `sync.service.ts`, `user.service.ts`, `RfidCardService`, `AuthController`, `master-data.controller.ts`, `assertFactoryScope`, `.findAll`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `RequirePermissions()` connect `RequirePermissions` to `.approve`, `UserController`, `.upload`, `.create`, `master-data.controller.ts`, `AuditQueryDto`, `sync.service.ts`, `inventory-history.controller.ts`, `assertFactoryScope`, `.findAll`, `authenticated-user.interface.ts`, `_Body`, `.enroll`, `DeviceService`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _3931 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package:nexa_mobile/features/exchange/domain/exchange.dart` be split into smaller, more focused modules?**
  _Cohesion score 0.06417112299465241 - nodes in this community are weakly interconnected._
- **Should `app_database.dart` be split into smaller, more focused modules?**
  _Cohesion score 0.01092896174863388 - nodes in this community are weakly interconnected._
- **Should `PrismaService` be split into smaller, more focused modules?**
  _Cohesion score 0.032097868217054265 - nodes in this community are weakly interconnected._