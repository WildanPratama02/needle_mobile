# Graph Report - nexa_mobile  (2026-09-28)

## Corpus Check
- 853 files · ~466,333 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 7673 nodes · 16318 edges · 343 communities (225 shown, 118 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 243 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `928b82c4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- assertFactoryScope
- RequirePermissions
- .approve
- app_database.dart
- create-test-app.ts
- receiving-page.tsx
- inventory/api/types.ts
- app_database.steps.dart
- app-shell.tsx
- renderWithQueryClient
- core/master-data/index.ts
- exchange-transactions-page.test.tsx
- schema_v1.dart
- auth/data-source.ts
- schema_v2.dart
- auth.ts
- auth.controller.ts
- useCurrentUser
- dependencies
- devDependencies
- schema_v3.dart
- getApiErrorMessage
- identity.module.ts
- password-reset.service.ts
- app.module.ts
- RetentionService
- audit-filters.tsx
- GeneratedPluginRegistrant.swift
- Database ERD & Physical Schema
- devDependencies
- InventoryService
- notification.templates.ts
- components.json
- AuthController
- @nestjs/swagger
- AuthenticatedUser
- compilerOptions
- .upload
- System Architecture Document
- scripts
- http-exception.filter.ts
- evidence.service.ts
- Claude Code Backend Setup Prompting Guide
- jest
- audit.decorator.ts
- needle_type_picker.dart
- MasterDataService
- Backend CLAUDE.md
- scope.guard.ts
- test_app.dart
- inventory.controller.ts
- sync_remote_data_source.dart
- device_validation_controller.dart
- whatsapp.port.ts
- network_providers.dart
- compilerOptions
- sync_repositories.dart
- NotificationService
- rfid.controller.ts
- PrismaService
- providers.tsx
- Backend ARCHITECTURE.md
- notification.service.ts
- _Body
- adjustment-page.tsx
- my_application.cc
- transfer-page.test.tsx
- dependencies
- WebApps Dev Subagent Spec
- count-session-detail-page.test.tsx
- keyboard_wedge_rfid_reader.dart
- Backend/package.json
- HealthService
- RfidCardService
- WhatsApp Integration Specification
- package:flutter_riverpod/flutter_riverpod.dart
- sync.service.ts
- .create
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
- mobile_scanner_qr_scanner.dart
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
- storage-data-source.ts
- exchange_repository.dart
- users-screen-write.test.tsx
- user-write-queries.ts
- master-data.controller.ts
- confirmation-monitoring-page.test.tsx
- exchange_flow_state.dart
- sync_controller.dart
- app_error.dart
- tables.dart
- cn
- adjustment-page.test.tsx
- return-page.test.tsx
- master_data_versions.dart
- evidence_views.dart
- sync_engine.dart
- ts-node
- fake_backend.dart
- home_screen.dart
- exchange_steps.dart
- device.controller.ts
- master-data/data-source.ts
- database.config.ts
- setup-env.ts
- CountSessionController
- sync_queue_impl.dart
- fakes.dart
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
- exchange_flow_screen.dart
- MOCK_SESSION_USER
- role-detail-screen.test.tsx
- sync_engine_test.dart
- location-data-source.ts
- win32_window.cpp
- proxy-config.test.ts
- rfid-screen.tsx
- design_tokens.dart
- zod
- envelope.dart
- tailwind.config.ts
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
- react
- exchange.dart
- Win32Window
- provisioning_controller.dart
- trolley_stock_item.dart
- administration-roles.spec.ts
- auth_repository_impl.dart
- .findAll
- app_config.dart
- Admin-panel CRUD audit: five contract-ready write gaps close next, three stay blocked on undecided policy, three are recorded but not queued
- administration-devices.spec.ts
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
- @hookform/resolvers
- mobile-dev.md
- secure_store.dart
- RegisterPlugins
- static const
- FlutterActivity
- nexa_mobile — NEXA Troli (Android tablet)
- CreateAdjustmentDto
- LaunchImage.imageset/README.md
- exchange-trend-chart.tsx
- Table
- exchange_flow_test.dart
- sync_result.dart
- fake_exchange_server.dart
- 22 — Mobile Folder Structure (nexa_mobile)
- offline_sync_flow_test.dart
- idempotency_and_retry_test.dart
- fixtures.dart
- rfid_scan_panel.dart
- active_exchange_store_impl.dart
- app_logger.dart
- package:flutter/material.dart
- operator_lookup.dart
- PasswordResetTokenRepository
- AppDelegate
- ios/RunnerTests/RunnerTests.swift
- ConfirmationService
- confirmation.service.ts
- AppError
- eslint-config-next
- radix-ui
- sonner
- tailwind-merge
- @testing-library/react
- vitest
- zustand
- String?
- Uuid
- i0.VersionedTable
- bool get
- heartbeat_controller.dart
- employee.controller.ts
- sync_status.dart
- MessageHandler
- token.service.spec.ts
- i0.VersionedSchema
- CreateUserDto
- flow_driver.dart
- List
- sync_planner.dart
- exchange_sync_view.dart
- inventory/index.ts
- exchange_projection.dart
- auth/index.ts
- storage-screen.test.tsx
- RefreshTokenRepository
- RequireAuth
- idempotency_attempts.dart
- administration/index.ts
- confirmation/[id]/page.tsx
- ApprovalModule
- confirmation.service.spec.ts
- FakeResetTokenRepository
- dashboard/page.tsx
- eslint

## God Nodes (most connected - your core abstractions)
1. `AuthenticatedUser` - 240 edges
2. `getApiErrorMessage()` - 138 edges
3. `RequirePermissions()` - 107 edges
4. `PrismaService` - 102 edges
5. `cn()` - 89 edges
6. `react` - 68 edges
7. `useFactoryScopeStore` - 67 edges
8. `usePermission()` - 58 edges
9. `assertFactoryScope()` - 57 edges
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

## Communities (343 total, 118 thin omitted)

### Community 0 - "assertFactoryScope"
Cohesion: 0.06
Nodes (65): assertFactoryScope(), isInFactoryScope(), ExchangeController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller (+57 more)

### Community 1 - "RequirePermissions"
Cohesion: 0.17
Nodes (23): Audit(), Paginated(), RequirePermissions(), ExchangeTypeController, FactoryController, LocationController, NeedleTypeController, StorageMappingController (+15 more)

### Community 2 - ".approve"
Cohesion: 0.17
Nodes (17): ConfirmationController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+9 more)

### Community 3 - "app_database.dart"
Cohesion: 0.01
Nodes (179): _, actualTableName, _alias, aliasedName, allSchemaEntities, allTables, attachedDatabase, attemptCount (+171 more)

### Community 4 - "create-test-app.ts"
Cohesion: 0.04
Nodes (39): AppModule, Module, ALLOWED_HEADERS, configureApp(), bootstrap(), LoginBody, MeBody, TokenPairBody (+31 more)

### Community 5 - "receiving-page.tsx"
Cohesion: 0.05
Nodes (98): Button, ButtonProps, buttonVariants, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogTitle (+90 more)

### Community 6 - "inventory/api/types.ts"
Cohesion: 0.04
Nodes (62): createAdjustment(), createReceiving(), createReturn(), createTransfer(), fetchBalances(), fetchMovements(), fetchTrolleyStock(), AdjustmentReasonCode (+54 more)

### Community 7 - "app_database.steps.dart"
Cohesion: 0.01
Nodes (155): attemptCount, byteSize, capturedAt, category, checkedAt, clientTransactionId, closedAt, code (+147 more)

### Community 9 - "renderWithQueryClient"
Cohesion: 0.03
Nodes (60): SessionBootstrapState, useSessionBootstrapStore, makeDevice(), makePaged(), mockedFetchCurrentUser, mockedFetchDevices, mockedFetchMasterData, openDetail() (+52 more)

### Community 10 - "core/master-data/index.ts"
Cohesion: 0.05
Nodes (62): authKeys, Employee, ExchangeType, Factory, Location, LOCATION_TYPE_LABELS, MASTER_DATA_COLLECTIONS, MasterDataRow (+54 more)

### Community 11 - "exchange-transactions-page.test.tsx"
Cohesion: 0.11
Nodes (22): fetchExchangeDetail(), fetchExchangeEvidence(), fetchExchanges(), exchangeKeys, useExchangeDetail(), useExchangeEvidence(), useExchangeList(), EvidenceItem (+14 more)

### Community 12 - "schema_v1.dart"
Cohesion: 0.02
Nodes (83): class, class LocalDeviceContext extends, class LocalDeviceContextData extends, class LocalDeviceValidation extends, class LocalDeviceValidationData extends, class LocalExchangeType extends, class LocalExchangeTypeData extends, class LocalMasterDataVersion extends (+75 more)

### Community 13 - "auth/data-source.ts"
Cohesion: 0.12
Nodes (24): fetchCurrentUser(), forgotPassword(), login(), logout(), resetPassword(), useForgotPassword(), useLogout(), useResetPassword() (+16 more)

### Community 14 - "schema_v2.dart"
Cohesion: 0.02
Nodes (90): class LocalExchange extends, class LocalExchangeData extends, class LocalExchangeEvidence extends, class LocalExchangeEvidenceData extends, GeneratedColumn, GeneratedDatabase, LocalDeviceContext, LocalExchange (+82 more)

### Community 15 - "auth.ts"
Cohesion: 0.13
Nodes (17): Captured, envelope(), FACTORY, makeUser(), mockUsersApi(), Captured, envelope(), makeEntry() (+9 more)

### Community 16 - "auth.controller.ts"
Cohesion: 0.09
Nodes (24): LoginResponseDto, LoginUserDto, MeResponseDto, TokenPairDto, ApiProperty, ForgotPasswordDto, ApiProperty, MaxLength (+16 more)

### Community 17 - "useCurrentUser"
Cohesion: 0.15
Nodes (18): useCurrentUser(), Factory, useAuthorizedFactories(), hasAllPermissions(), hasAnyPermission(), hasPermission(), PermissionCode, PermissionHolder (+10 more)

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
Cohesion: 0.06
Nodes (87): API_BASE_PATH, ApiErrorBody, ApiResponseMeta, getApiErrorMessage(), hasErrorEnvelope(), MUTATING_METHODS, useMasterData(), FactoryScopeState (+79 more)

### Community 22 - "identity.module.ts"
Cohesion: 0.10
Nodes (15): JwtPayload, IdentityModule, Module, Injectable, UserRepository, AuthService, LoginResult, Injectable (+7 more)

### Community 23 - "password-reset.service.ts"
Cohesion: 0.12
Nodes (13): EmailModule, Module, EMAIL_CLIENT, EmailMessage, EmailPort, ADR-0002, NodemailerEmailAdapter, ADR-0002 (+5 more)

### Community 24 - "app.module.ts"
Cohesion: 0.07
Nodes (28): IS_PUBLIC_KEY, JwtAuthGuard, Injectable, IdempotencyModule, Global, Module, AppConfig, configuration() (+20 more)

### Community 25 - "RetentionService"
Cohesion: 0.12
Nodes (12): RecordRetentionProcessor, Processor, RETENTION_QUEUE, RETENTION_SWEEP_JOB, RetentionModule, InjectQueue, Module, RetentionService (+4 more)

### Community 26 - "audit-filters.tsx"
Cohesion: 0.16
Nodes (17): fetchAuditLogs(), auditKeys, useAuditLogs(), AUDIT_ACTIONS, AuditAction, AuditLogEntry, AuditLogFilters, DEFAULT_AUDIT_FILTERS (+9 more)

### Community 27 - "GeneratedPluginRegistrant.swift"
Cohesion: 0.12
Nodes (14): Cocoa, connectivity_plus, flutter_secure_storage_darwin, FlutterMacOS, FlutterPluginRegistry, FlutterViewController, Foundation, mobile_scanner (+6 more)

### Community 28 - "Database ERD & Physical Schema"
Cohesion: 0.12
Nodes (23): Response Envelope Interceptor Ordering, ScopeGuard / assertFactoryScope Dual Implementation, Stock Ledger Invariants (Three Layers), Audit Logging Mechanism, Idempotency-Key / client_transaction_id Mechanism, Five-Dimension Authorization Model, Adjustment (Domain Concept), Approval (Domain Concept) (+15 more)

### Community 29 - "devDependencies"
Cohesion: 0.04
Nodes (49): devDependencies, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, globals, jest, @nestjs/cli, @nestjs/schematics (+41 more)

### Community 30 - "InventoryService"
Cohesion: 0.10
Nodes (17): InventoryController, ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags, Controller (+9 more)

### Community 31 - "notification.templates.ts"
Cohesion: 0.14
Nodes (14): resolveTemplateVariables(), STUCK_REASONS, STUCK_TEXT, StuckReason, stuckReasonText(), TEMPLATE_VARIABLES, TemplateCode, TEMPLATES (+6 more)

### Community 32 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 33 - "AuthController"
Cohesion: 0.23
Nodes (14): Public(), AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser (+6 more)

### Community 34 - "@nestjs/swagger"
Cohesion: 0.05
Nodes (56): CurrentUser, REQUIRED_PERMISSIONS_KEY, RbacGuard, Injectable, humanize(), IdentitySeedResult, ROLE_DESCRIPTIONS, seedAdminUser() (+48 more)

### Community 35 - "AuthenticatedUser"
Cohesion: 0.15
Nodes (17): AuthenticatedUser, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+9 more)

### Community 36 - "compilerOptions"
Cohesion: 0.07
Nodes (27): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, incremental (+19 more)

### Community 37 - ".upload"
Cohesion: 0.10
Nodes (25): EvidenceController, ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags, Controller (+17 more)

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
Cohesion: 0.07
Nodes (21): DomainException, ERROR_CODES, ErrorCode, ADR-0005, MinioObjectStorageAdapter, Injectable, OBJECT_STORAGE, ObjectStoragePort (+13 more)

### Community 42 - "Claude Code Backend Setup Prompting Guide"
Cohesion: 0.17
Nodes (19): Root CLAUDE.md, Exchange State Machine (CREATED→COMPLETED), State-Based UI (ExchangeState drives actions), Catatan Penggunaan, Fase 0 — Kunci Keputusan Terbuka, Fase 10 — Modul Synchronization, Fase 11 — Kontrak API & Dokumentasi, Fase 12 — Test Menyeluruh & Docker (+11 more)

### Community 43 - "jest"
Cohesion: 0.11
Nodes (18): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, moduleNameMapper, rootDir, roots, testEnvironment (+10 more)

### Community 44 - "audit.decorator.ts"
Cohesion: 0.08
Nodes (21): AuditRecord, AuditWriter, AuditWriterModule, Global, Module, SNAPSHOT_FIELDS, Injectable, AUDIT_ACTIONS (+13 more)

### Community 45 - "needle_type_picker.dart"
Cohesion: 0.05
Nodes (43): NeedleType, build, _CancelDialog, _CancelDialogState, choice, createState, dispose, initialReason (+35 more)

### Community 46 - "MasterDataService"
Cohesion: 0.07
Nodes (13): MasterDataQueryDto, ScopedMasterDataQueryDto, StorageMappingQueryDto, ApiPropertyOptional, IsEnum, IsInt, IsOptional, IsUUID (+5 more)

### Community 47 - "Backend CLAUDE.md"
Cohesion: 0.12
Nodes (17): Exchange State Machine (Pure Function), Side Effects Happen After Commit, ADR-001 Modular Monolith, Backend CLAUDE.md, approval module, audit module, device module, employee module (+9 more)

### Community 48 - "scope.guard.ts"
Cohesion: 0.17
Nodes (6): FACTORY_SCOPE_KEY, LOCATION_SCOPE_KEY, ScopeSource, ScopeGuard, Injectable, picFactoryA

### Community 49 - "test_app.dart"
Cohesion: 0.06
Nodes (33): AppConfig, fake_backend.dart, fakes.dart, fixtures.dart, build, config, _ConfigErrorApp, main (+25 more)

### Community 50 - "inventory.controller.ts"
Cohesion: 0.07
Nodes (60): InventoryHistoryController, NOT_FOUND, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser (+52 more)

### Community 51 - "sync_remote_data_source.dart"
Cohesion: 0.03
Nodes (85): _Json, ApiClient, delays, immediate, RetryPolicy, accessToken, _api, expiresInSeconds (+77 more)

### Community 52 - "device_validation_controller.dart"
Cohesion: 0.07
Nodes (49): appVersionProvider, serverClockProvider, connectivityStatusProvider, appConfigProvider, sessionControllerProvider, bootstrapRepositoryProvider, DeviceContextSnapshot, build (+41 more)

### Community 53 - "whatsapp.port.ts"
Cohesion: 0.17
Nodes (12): MetaCloudWhatsAppAdapter, MetaSendResponse, Injectable, Module, WhatsAppModule, ADR-0006, WHATSAPP_CLIENT, WhatsAppMessage (+4 more)

### Community 54 - "network_providers.dart"
Cohesion: 0.02
Nodes (98): Dio, Future, Interceptor, _categoryFor, _categoryForStatus, ErrorMapper, fromCommandError, fromDioException (+90 more)

### Community 55 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, @testing-library/jest-dom, **/*.tsx, vitest/globals (+20 more)

### Community 56 - "sync_repositories.dart"
Cohesion: 0.05
Nodes (42): ActiveExchangeStoreImpl, ActiveExchangeStore, _db, _exchanges, load, _photos, _queue, read (+34 more)

### Community 57 - "NotificationService"
Cohesion: 0.22
Nodes (4): NotificationDispatchProcessor, Processor, NotificationService, Injectable

### Community 58 - "rfid.controller.ts"
Cohesion: 0.06
Nodes (39): CurrentDevice, RequireDeviceContext(), DEVICE_ID_HEADER, DeviceContextGuard, Injectable, DeviceContext, RequestWithContext, REQUEST_ID_HEADER (+31 more)

### Community 59 - "PrismaService"
Cohesion: 0.03
Nodes (65): ADR-0004, PrismaService, Injectable, NumberSequenceService, PREFIXES, SEQUENCE_SCOPES, Injectable, StockStatus (+57 more)

### Community 60 - "providers.tsx"
Cohesion: 0.14
Nodes (16): inter, jetbrainsMono, metadata, RootLayout(), Providers(), Toaster(), refreshAccessToken(), useLogin() (+8 more)

### Community 61 - "Backend ARCHITECTURE.md"
Cohesion: 0.23
Nodes (12): Backend ARCHITECTURE.md, ADR-002 PostgreSQL, Backend docker-compose.yml, minio service, minio-init service, postgres service, redis service, Backend README.md (+4 more)

### Community 62 - "notification.service.ts"
Cohesion: 0.29
Nodes (6): HealthModule, Module, NOTIFICATION_DISPATCH_JOB, NOTIFICATION_QUEUE, DispatchJobData, ADR-0006

### Community 63 - "_Body"
Cohesion: 0.11
Nodes (22): DeviceController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+14 more)

### Community 64 - "adjustment-page.tsx"
Cohesion: 0.07
Nodes (65): useLookup(), userDisplayLabel(), userColumns, confirmationColumns, fetchAdjustment(), fetchAdjustments(), fetchReturn(), fetchReturns() (+57 more)

### Community 65 - "my_application.cc"
Cohesion: 0.09
Nodes (22): FlPluginRegistry, FlView, GApplication, gboolean, gchar, GObject, GtkApplication, MyApplicationClass (+14 more)

### Community 66 - "transfer-page.test.tsx"
Cohesion: 0.11
Nodes (14): TransferResult, DESTINATION_LOCATION, FACTORY, makePaged(), makeTransfer(), mockedCreateTransfer, mockedFetchAllUsers, mockedFetchBalances (+6 more)

### Community 67 - "dependencies"
Cohesion: 0.07
Nodes (27): axios, class-variance-authority, clsx, date-fns, next-themes, react-dom, react-hook-form, recharts (+19 more)

### Community 68 - "WebApps Dev Subagent Spec"
Cohesion: 0.24
Nodes (11): ADR-004 Backend Is the Stock Authority, WebApps Dev Subagent Spec, Flag Gaps and Conflicts Principle, 10-Stage Development Lifecycle, Reuse Before You Build Principle, WebApps Stack Decision, OpenAPI/Swagger Specification, WebApps UI/UX Specification (+3 more)

### Community 69 - "count-session-detail-page.test.tsx"
Cohesion: 0.06
Nodes (47): addCountItem(), cancelCountSession(), completeCountSession(), createCountSession(), fetchCountSession(), fetchCountSessions(), countSessionKeys, useAddCountItem() (+39 more)

### Community 70 - "keyboard_wedge_rfid_reader.dart"
Cohesion: 0.04
Nodes (46): DateTime, HardwareKeyboard?, HardwareKeyboard get, build, CachedContextBanner, cachedSince, _hhmm, _buffer (+38 more)

### Community 71 - "Backend/package.json"
Cohesion: 0.20
Nodes (9): description, engines, node, license, name, prisma, seed, private (+1 more)

### Community 72 - "HealthService"
Cohesion: 0.15
Nodes (10): HealthController, ApiOperation, ApiResponse, ApiTags, Controller, Get, HealthService, HealthStatus (+2 more)

### Community 73 - "RfidCardService"
Cohesion: 0.14
Nodes (14): RfidController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+6 more)

### Community 74 - "WhatsApp Integration Specification"
Cohesion: 0.31
Nodes (10): OpenAPI / Swagger Specification, Offline RFID Policy Deferral, RFID Integration Specification, WhatsApp Integration Specification, Mobile Offline Sync Specification, Mobile UI/UX Specification, WebApps UI/UX Specification, Backend Folder Structure (+2 more)

### Community 75 - "package:flutter_riverpod/flutter_riverpod.dart"
Cohesion: 0.03
Nodes (93): _, @DriftDatabase, Directory, ../helpers/fake_backend.dart, ../helpers/fake_exchange_server.dart, ../../../helpers/fakes.dart, ../helpers/fixtures.dart, ../helpers/test_app.dart (+85 more)

### Community 76 - "sync.service.ts"
Cohesion: 0.04
Nodes (72): ClaimRequest, ClaimResult, IdempotencyStore, Injectable, IdempotencyKeyMiddleware, Injectable, toExchangeResponse(), ExchangeRepository (+64 more)

### Community 77 - ".create"
Cohesion: 0.12
Nodes (15): EmployeeController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+7 more)

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
Nodes (78): ExchangeRepository get, masterDataRefresherProvider, confirmationPollIntervalProvider, exchangeRepositoryProvider, _apply, _attempts, build, cancel (+70 more)

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
Nodes (242): accessDeniedBody, accessDeniedTitle, appName, AppStrings, appVersion, awaitingBody, awaitingOffline, awaitingQueuedBody (+234 more)

### Community 87 - "master_data_refresher_test.dart"
Cohesion: 0.02
Nodes (108): ProvisionedDeviceStore, provisionedDeviceStoreProvider, secureStoreProvider, sessionTokenStoreProvider, _bootstrap, BootstrapMasterDataRefresher, _masterData, refresh (+100 more)

### Community 88 - "provisioning_screen.dart"
Cohesion: 0.06
Nodes (39): ConsumerState, ConsumerStatefulWidget, loginControllerProvider, build, createState, dispose, LoginScreen, _LoginScreenState (+31 more)

### Community 89 - "mobile_scanner_qr_scanner.dart"
Cohesion: 0.06
Nodes (34): MobileScannerController, MobileScannerException?, _controller, dispose, sessionEnded, SessionEndReason, SessionEvents, stream (+26 more)

### Community 90 - "integrations/ Adapter Isolation Pattern"
Cohesion: 0.40
Nodes (5): WhatsApp Notification Flow (Backend Internal), Reader Integration Modes (USB/Bluetooth/Vendor SDK), POST /internal/notifications/whatsapp Payload, Evidence Upload Flow (Photo → Object Storage), integrations/ Adapter Isolation Pattern

### Community 91 - "DataClass"
Cohesion: 0.10
Nodes (40): DeviceContextRow, DeviceValidationRow, ExchangeTypeRow, LocalExchangeEvidenceRow, LocalExchangeRow, LocalSyncQueueRow, LocalSyncStateRow, MasterDataVersionRow (+32 more)

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

### Community 102 - "storage-data-source.ts"
Cohesion: 0.19
Nodes (16): createStorageMapping(), fetchStorageMappings(), updateStorageMapping(), storageMappingKeys, useCreateStorageMapping(), useStorageMappings(), useUpdateStorageMapping(), CreateStorageMappingInput (+8 more)

### Community 103 - "exchange_repository.dart"
Cohesion: 0.05
Nodes (37): all, begin, byId, clientTransactionId, closedAt, CommandResult, confirmationStatus, ConfirmationUpdate (+29 more)

### Community 104 - "users-screen-write.test.tsx"
Cohesion: 0.10
Nodes (31): fetchAllUsers(), fetchUser(), fetchUsers(), userKeys, UserLookup, useUserLookup(), useUsersByRole(), useUsersList() (+23 more)

### Community 105 - "user-write-queries.ts"
Cohesion: 0.19
Nodes (20): assignFactoryScope(), assignRole(), createUser(), revokeFactoryScope(), revokeRole(), updateUser(), useAssignFactoryScope(), useAssignRole() (+12 more)

### Community 106 - "master-data.controller.ts"
Cohesion: 0.11
Nodes (44): EmployeeResponseDto, ApiProperty, ApiPropertyOptional, DUPLICATE_CODE, EDIT_FORBIDDEN, FORBIDDEN, NOT_FOUND, CREATABLE_LOCATION_TYPES (+36 more)

### Community 107 - "confirmation-monitoring-page.test.tsx"
Cohesion: 0.10
Nodes (28): approveConfirmation(), fetchConfirmation(), fetchConfirmations(), rejectConfirmation(), confirmationKeys, useApproveConfirmation(), useConfirmation(), useConfirmationList() (+20 more)

### Community 108 - "exchange_flow_state.dart"
Cohesion: 0.05
Nodes (42): EvidenceType? get, approvedNotice, availableQuantity, busy, cancelledAfterIssue, canRetry, catalog, confirmation (+34 more)

### Community 109 - "sync_controller.dart"
Cohesion: 0.07
Nodes (35): activeExchangeStoreProvider, syncCheckpointStoreProvider, syncEngineProvider, syncGatewayProvider, syncPeriodicIntervalProvider, syncQueueProvider, syncViewSourceProvider, SyncEngine (+27 more)

### Community 110 - "app_error.dart"
Cohesion: 0.04
Nodes (47): authForbidden, authInvalidToken, BackendErrorCodes, category, ClientErrorCodes, code, conflict, context (+39 more)

### Community 111 - "tables.dart"
Cohesion: 0.03
Nodes (76): BoolColumn get, DateTimeColumn get, IntColumn get, attemptCount, byteSize, capturedAt, category, checkedAt (+68 more)

### Community 112 - "cn"
Cohesion: 0.07
Nodes (63): Badge(), BadgeProps, badgeVariants, Card, CardContent, CardDescription, CardFooter, CardHeader (+55 more)

### Community 113 - "adjustment-page.test.tsx"
Cohesion: 0.11
Nodes (13): FACTORY, LOCATION, makeAdjustment(), makePaged(), mockedCreateAdjustment, mockedFetchAdjustment, mockedFetchAdjustments, mockedFetchAllUsers (+5 more)

### Community 114 - "return-page.test.tsx"
Cohesion: 0.11
Nodes (14): FACTORY, makePaged(), makeReturn(), mockedCreateReturn, mockedFetchAllUsers, mockedFetchBalances, mockedFetchCurrentUser, mockedFetchMasterData (+6 more)

### Community 115 - "master_data_versions.dart"
Cohesion: 0.09
Nodes (23): CollectionUpdate, differsFrom, exchangeTypes, fromWire, InvalidateCollectionVersion, isEmpty, isPresent, KeepCollection (+15 more)

### Community 116 - "evidence_views.dart"
Cohesion: 0.04
Nodes (50): CameraController?, buildPreview, camera, CameraPackageEvidenceCamera, capture, _controller, dispose, EvidenceCameraPreviewBuilder (+42 more)

### Community 117 - "sync_engine.dart"
Cohesion: 0.06
Nodes (33): accepted, _acceptsEvidence, _applyChanges, _checkpoints, _evidence, _exchanges, failed, forExchange (+25 more)

### Community 119 - "fake_backend.dart"
Cohesion: 0.10
Nodes (20): dart:typed_data, body, close, error, FakeHandler, FakeResponse, fetch, _handlers (+12 more)

### Community 120 - "home_screen.dart"
Cohesion: 0.04
Nodes (54): @visibleForTesting, dart:async, GoRouter, AppGate, appGateProvider, resolveAppGate, allowed, fallback (+46 more)

### Community 121 - "exchange_steps.dart"
Cohesion: 0.08
Nodes (43): ConsumerWidget, build, StokTroliCard, exchangeFlowControllerProvider, ExchangeFlowScreen, StockProblem, AwaitingConfirmationStep, AwaitingSyncStep (+35 more)

### Community 122 - "device.controller.ts"
Cohesion: 0.11
Nodes (24): BAD_TROLLEY, FORBIDDEN, NOT_FOUND, DeviceModule, Module, DeviceActionDto, HeartbeatDto, ReassignDeviceDto (+16 more)

### Community 123 - "master-data/data-source.ts"
Cohesion: 0.09
Nodes (18): apiClient, DEFAULT_ERROR_MESSAGE, SERVER_UNREACHABLE_MESSAGE, config, fetchMasterData(), fetchMasterDataRow(), MasterDataQuery, Lookup (+10 more)

### Community 126 - "CountSessionController"
Cohesion: 0.17
Nodes (15): CountSessionController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+7 more)

### Community 127 - "sync_queue_impl.dart"
Cohesion: 0.08
Nodes (25): _accepted, byId, clearBackoff, commandsFor, _db, delete, deleteFor, enqueue (+17 more)

### Community 128 - "fakes.dart"
Cohesion: 0.06
Nodes (32): Connectivity, changes, _connectivity, ConnectivityPlusSource, ConnectivitySource, connectivitySourceProvider, ConnectivityStatus, current (+24 more)

### Community 148 - "StatelessWidget"
Cohesion: 0.03
Nodes (83): BorderRadius, Color, EdgeInsetsGeometry, IconData, _ConfirmPane, build, _compactBelow, icon (+75 more)

### Community 149 - "1. Fase 0 — Yang Harus Selesai *Sebelum* Membuka Claude Code"
Cohesion: 0.14
Nodes (13): 0. Kenapa Dokumen Ini Ada, 1.1 Verifikasi kontrak API mobile vs backend aktual, 1.2 Kunci keputusan teknis terbuka, 1.3 `Mobile/CLAUDE.md` — root rules untuk Claude Code, 1.4 `Docs/22-Mobile-Folder-Structure.md`, 1.5 Agent routing — `Docs/agents/mobile-dev.md`, 1.6 SKILL.md yang paling relevan, 1.7 Pemecahan tiket di `.scratch/` (+5 more)

### Community 151 - "exchange_flow_screen.dart"
Cohesion: 0.04
Nodes (49): main, tap, main, main, build, connectivity, context_, HomeHeaderBar (+41 more)

### Community 152 - "MOCK_SESSION_USER"
Cohesion: 0.18
Nodes (9): mockLoggedOut(), unauthorized(), confirmation(), envelope(), EXCHANGE, mockExchangeDetailApi(), USERS, MOCK_SESSION_USER (+1 more)

### Community 153 - "role-detail-screen.test.tsx"
Cohesion: 0.12
Nodes (17): fetchPermissions(), fetchRoles(), roleKeys, usePermissionCatalogue(), useRole(), useRoles(), PermissionRow, RoleRow (+9 more)

### Community 154 - "sync_engine_test.dart"
Cohesion: 0.03
Nodes (62): ActiveExchangeStore get, dart:io, EvidenceRepository get, evidenceDirectoryProvider, awaitingUpload, _db, _deleteFile, _deleteRow (+54 more)

### Community 155 - "location-data-source.ts"
Cohesion: 0.18
Nodes (16): createLocation(), updateLocation(), useCreateLocation(), useInvalidateLocations(), useUpdateLocation(), CREATABLE_LOCATION_TYPES, CreatableLocationType, CreateLocationInput (+8 more)

### Community 156 - "win32_window.cpp"
Cohesion: 0.15
Nodes (16): wchar_t, Scale(), Create, Destroy, SetQuitOnClose, Show, UpdateTheme, Win32Window::Win32Window() (+8 more)

### Community 158 - "proxy-config.test.ts"
Cohesion: 0.29
Nodes (4): nextConfig, nextConfig, ORIGINAL, SimpleRewrite

### Community 159 - "rfid-screen.tsx"
Cohesion: 0.07
Nodes (40): ApiSuccessBody, masterDataKeys, createEmployee(), updateEmployee(), useCreateEmployee(), useUpdateEmployee(), CreateEmployeeInput, EntityStatus (+32 more)

### Community 160 - "design_tokens.dart"
Cohesion: 0.07
Nodes (29): @immutable, BuildContext, DesignTokens get, buttonHeight, cardShadow, copyWith, ctaBackground, ctaBackgroundDark (+21 more)

### Community 162 - "envelope.dart"
Cohesion: 0.09
Nodes (22): ApiErrorBody, Envelope, Map, ApiErrorBody, code, context, data, details (+14 more)

### Community 235 - "react"
Cohesion: 0.05
Nodes (61): react, react, activateDevice(), fetchDevices(), reassignDevice(), registerDevice(), revokeDevice(), buildDeviceQrPayload() (+53 more)

### Community 242 - "exchange.dart"
Cohesion: 0.05
Nodes (37): int get, blocksExchange, brokenExchangeTypeCode, cancelledAt, completedAt, confirmationId, confirmationNumber, ConfirmationSnapshot (+29 more)

### Community 243 - "Win32Window"
Cohesion: 0.13
Nodes (19): DartProject, FlutterWindow, flutter_controller_, FlutterWindow::FlutterWindow(), OnCreate, OnDestroy, project_, DartProject (+11 more)

### Community 244 - "provisioning_controller.dart"
Cohesion: 0.15
Nodes (17): provisioningRepositoryProvider, ProvisionedDevice, build, confirm, device, _load, notice, Provisioned (+9 more)

### Community 245 - "trolley_stock_item.dart"
Cohesion: 0.12
Nodes (15): displayName, minimumStock, needleTypeCode, needleTypeId, quantity, status, TrolleyStockItem, fromWire (+7 more)

### Community 246 - "administration-roles.spec.ts"
Cohesion: 0.32
Nodes (7): Captured, envelope(), FACTORY, makeMember(), mockRolesApi(), PERMISSIONS, ROLES

### Community 247 - "auth_repository_impl.dart"
Cohesion: 0.04
Nodes (54): AuthRepository get, LoginResult, sessionEventsProvider, authRepositoryProvider, AuthRemoteDataSource, AuthRepositoryImpl, _local, login (+46 more)

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

### Community 251 - "administration-devices.spec.ts"
Cohesion: 0.38
Nodes (6): Captured, envelope(), FACTORY, makeDevice(), mockDeviceApi(), TROLLEY

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
Nodes (27): DeviceStatus, Duration, build, now, observe, ServerClock, setOffset, blockedStatusOf (+19 more)

### Community 256 - "Backend ↔ Mobile Contract Matrix"
Cohesion: 0.18
Nodes (10): Backend ↔ Mobile Contract Matrix, Conventions every tablet call follows, Doc 07 error names → backend codes (Doc 07 §40–41), Gaps and decisions, Mapping tables the tablet needs, Matrix, Stock status labels (FR-MOB-015), Summary (+2 more)

### Community 257 - "sync_state_mapper.dart"
Cohesion: 0.11
Nodes (25): SyncCommandError, AcceptCommand, CommandTransition, error, evidencePhase, forExchange, forRequestFailure, forResult (+17 more)

### Community 262 - "manifest.json"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, name, orientation, prefer_related_applications, short_name (+2 more)

### Community 263 - "MessageHandler"
Cohesion: 0.36
Nodes (10): HWND, LPARAM, LRESULT, UINT, WPARAM, EnableFullDpiSupportIfAvailable(), GetHandle, GetThisFromHandle (+2 more)

### Community 264 - "device_qr_payload.dart"
Cohesion: 0.09
Nodes (21): DeviceQrPayload?, deviceCode, deviceId, DeviceQrAccepted, DeviceQrParseResult, DeviceQrPayload, DeviceQrPayloadParser, DeviceQrRejected (+13 more)

### Community 265 - "UpdateCompanion"
Cohesion: 0.06
Nodes (48): LocalDeviceContextCompanion, LocalDeviceValidationCompanion, LocalExchangeCompanion, LocalExchangeEvidenceCompanion, LocalExchangeTypeCompanion, LocalMasterDataVersionCompanion, LocalNeedleTypeCompanion, LocalStorageMappingCompanion (+40 more)

### Community 266 - "package:nexa_mobile/core/error/app_error.dart"
Cohesion: 0.07
Nodes (39): _byCode, ErrorMessages, forCategory, forCode, availableQuantity, AwaitConfirmation, ExchangeCommand, ExchangeErrorRoute (+31 more)

### Community 267 - "evidence.dart"
Cohesion: 0.07
Nodes (26): allowedMimeTypes, byteSize, capturedAt, check, clientTransactionId, EvidenceFilePolicy, EvidenceFileProblem, EvidencePolicy (+18 more)

### Community 268 - "AuditQueryDto"
Cohesion: 0.06
Nodes (30): AuditModule, Module, AuditController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller (+22 more)

### Community 269 - "CLAUDE.md — nexa_mobile (Troli App)"
Cohesion: 0.22
Nodes (8): §1 Non-negotiable principles, §2 Locked decisions, §3 Module boundary (package-by-feature, mirrors Backend §4 / Doc 19), §4 Mandatory coding rules, §5 Testing required per feature, §6 References, §7 Before Fase 0 checklist items still open, CLAUDE.md — nexa_mobile (Troli App)

### Community 270 - "master_data.dart"
Cohesion: 0.13
Nodes (14): category, code, ExchangeType, exchangeTypeId, id, minimumStock, name, NeedleType (+6 more)

### Community 271 - "Flutter project rules — nexa_mobile"
Cohesion: 0.25
Nodes (7): Decisions this skill assumes (source: `nexa_mobile/CLAUDE.md` §2), Domain vocabulary in code, Flutter project rules — nexa_mobile, Mandatory rules beyond the generic baseline, Module boundary (mirrors `nexa_mobile/CLAUDE.md` §3), Testing (adds to generic baseline's "write code with testing in mind"), What's still generic (unchanged from `Docs/Flutter_rules/rules.md`)

### Community 273 - "mobile-dev.md"
Cohesion: 0.29
Nodes (6): Flag gaps and conflicts — don't silently paper over them, Flutter/Dart tooling — dart-flutter plugin, Provisional vs. locked decisions — stop before building on a TBD, Reuse before you build, Source of truth — read before deciding anything, The lifecycle

### Community 274 - "secure_store.dart"
Cohesion: 0.08
Nodes (25): FlutterSecureStorage, _cached, clear, deviceCode, deviceId, _loaded, read, readDeviceId (+17 more)

### Community 276 - "static const"
Cohesion: 0.11
Nodes (16): blocked, history, home, login, newExchange, provision, Routes, settings (+8 more)

### Community 278 - "nexa_mobile — NEXA Troli (Android tablet)"
Cohesion: 0.40
Nodes (4): Environments, First launch on a tablet, nexa_mobile — NEXA Troli (Android tablet), Tests

### Community 279 - "CreateAdjustmentDto"
Cohesion: 0.21
Nodes (22): AddCountItemDto, CreateAdjustmentDto, CreateCountSessionDto, CreateReceivingDto, CreateReturnDto, CreateTransferDto, ApiProperty, ApiPropertyOptional (+14 more)

### Community 281 - "exchange-trend-chart.tsx"
Cohesion: 0.07
Nodes (46): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), getPayloadConfigFromPayload(), INITIAL_DIMENSION (+38 more)

### Community 282 - "Table"
Cohesion: 0.09
Nodes (41): @DataClassName, LocalDeviceContext, LocalDeviceValidation, LocalExchange, LocalExchangeEvidence, LocalExchangeType, LocalMasterDataVersion, LocalNeedleType (+33 more)

### Community 283 - "exchange_flow_test.dart"
Cohesion: 0.05
Nodes (41): File, FilledButton, generated/schema.dart, generated/schema_v1.dart, generated/schema_v2.dart, generated/schema_v3.dart, databaseForVersion, GeneratedHelper (+33 more)

### Community 284 - "sync_result.dart"
Cohesion: 0.09
Nodes (22): changedExchanges, clientTransactionId, commandId, commandType, confirmationStatus, error, exchange, fromWire (+14 more)

### Community 291 - "fake_exchange_server.dart"
Cohesion: 0.05
Nodes (39): backend, _cancel, cancelReason, cardUid, clientTransactionId, _complete, completedCount, confirmationId (+31 more)

### Community 292 - "22 — Mobile Folder Structure (nexa_mobile)"
Cohesion: 0.25
Nodes (7): 1. Top level, 22 — Mobile Folder Structure (nexa_mobile), 2. `lib/app/` and `lib/core/`, 3. `lib/features/`, 4. `lib/shared/`, 5. Local database (Drift), 6. Environments

### Community 293 - "offline_sync_flow_test.dart"
Cohesion: 0.09
Nodes (21): ../helpers/flow_driver.dart, chooseTypes, _ctx, expectStep, _finishBentOffline, h, identifyOperatorOnline, main (+13 more)

### Community 294 - "idempotency_and_retry_test.dart"
Cohesion: 0.12
Nodes (19): CommandResult, ApiFailure, ApiResult, ApiSuccess, data, error, meta, ApiMeta (+11 more)

### Community 295 - "fixtures.dart"
Cohesion: 0.29
Nodes (6): bootstrapData, deviceCode, deviceId, heartbeatData, loginData, meData

### Community 296 - "rfid_scan_panel.dart"
Cohesion: 0.12
Nodes (19): rfidReaderProvider, build, _cards, createState, didUpdateWidget, dispose, enabled, entry (+11 more)

### Community 297 - "active_exchange_store_impl.dart"
Cohesion: 0.06
Nodes (32): ExchangeRepository, all, begin, byId, current, _db, _dropForeign, forget (+24 more)

### Community 298 - "app_logger.dart"
Cohesion: 0.33
Nodes (5): dart:developer, AppLogger, error, info, warning

### Community 299 - "package:flutter/material.dart"
Cohesion: 0.04
Nodes (50): AsyncValue, AppTheme, light, seed, build, PenukaranHariIniCard, stock, trolleyId (+42 more)

### Community 300 - "operator_lookup.dart"
Cohesion: 0.15
Nodes (14): RfidRepositoryImpl, employeeId, employeeNumber, error, factoryId, lookup, name, operator (+6 more)

### Community 301 - "PasswordResetTokenRepository"
Cohesion: 0.13
Nodes (5): PasswordResetTokenRepository, Injectable, PasswordResetService, Inject, Injectable

### Community 302 - "AppDelegate"
Cohesion: 0.16
Nodes (10): Any, FlutterAppDelegate, FlutterImplicitEngineBridge, FlutterImplicitEngineDelegate, AppDelegate, Bool, AppDelegate, Bool (+2 more)

### Community 303 - "ios/RunnerTests/RunnerTests.swift"
Cohesion: 0.24
Nodes (6): Flutter, FlutterSceneDelegate, SceneDelegate, RunnerTests, UIKit, XCTestCase

### Community 304 - "ConfirmationService"
Cohesion: 0.20
Nodes (6): CONFIRMATION_EXPIRY_JOB, CONFIRMATION_EXPIRY_QUEUE, ConfirmationExpiryProcessor, Processor, ConfirmationService, Injectable

### Community 305 - "confirmation.service.ts"
Cohesion: 0.16
Nodes (15): ApproveConfirmationDto, ListConfirmationsQueryDto, RejectConfirmationDto, trimmed(), ApiProperty, ApiPropertyOptional, IsEnum, IsInt (+7 more)

### Community 306 - "AppError"
Cohesion: 0.09
Nodes (23): AppError, count, error, todayExchangeCount, TodayExchangeCountFailed, TodayExchangeCountLoaded, TodayExchangeCountOutcome, InventoryRemoteDataSource (+15 more)

### Community 316 - "i0.VersionedTable"
Cohesion: 0.15
Nodes (13): i0.VersionedTable, Shape0, Shape1, Shape10, Shape11, Shape2, Shape3, Shape4 (+5 more)

### Community 317 - "bool get"
Cohesion: 0.18
Nodes (10): bool get, complete,

  
  
  awaitingSync,

  
  done,

  
  cancelled,, ExchangeFlowStep, ExchangeProgressStage, ExchangeStepMapper, isTerminal, stageOf, stagesFor (+2 more)

### Community 318 - "heartbeat_controller.dart"
Cohesion: 0.14
Nodes (14): _inFlight, _historyRemoteProvider, historyRepositoryProvider, HistoryRemoteDataSource, HistoryRepositoryImpl, _remote, todayExchangeCount, HistoryRepository (+6 more)

### Community 319 - "employee.controller.ts"
Cohesion: 0.18
Nodes (13): FORBIDDEN, NOT_FOUND, CreateEmployeeDto, ApiProperty, ApiPropertyOptional, IsEnum, IsNotEmpty, IsOptional (+5 more)

### Community 320 - "sync_status.dart"
Cohesion: 0.07
Nodes (30): LocalSyncState, build, NexaApp, routerProvider, heartbeatControllerProvider, activity, allSynced, build (+22 more)

### Community 321 - "MessageHandler"
Cohesion: 0.33
Nodes (6): HWND, LPARAM, LRESULT, UINT, WPARAM, MessageHandler

### Community 323 - "i0.VersionedSchema"
Cohesion: 0.67
Nodes (3): i0.VersionedSchema, Schema2, Schema3

### Community 324 - "CreateUserDto"
Cohesion: 0.16
Nodes (17): AssignFactoryScopeDto, AssignRoleDto, CreateUserDto, ApiProperty, ApiPropertyOptional, ArrayMinSize, ArrayUnique, IsArray (+9 more)

### Community 325 - "flow_driver.dart"
Cohesion: 0.12
Nodes (16): fake_exchange_server.dart, chooseTypes, ensureVisible, enterText, expectStep, finder, identifyOperatorOnline, settle (+8 more)

### Community 326 - "List"
Cohesion: 0.12
Nodes (16): List, canReprovisionDevice, deviceManage, factoryIds, hasPermission, id, locationIds, mobileOperate (+8 more)

### Community 327 - "sync_planner.dart"
Cohesion: 0.12
Nodes (16): awaitingEvidence, batch, byExchange, cancelAt, ignoreBackoff, isEmpty, max, maxSyncBatch (+8 more)

### Community 328 - "exchange_sync_view.dart"
Cohesion: 0.12
Nodes (15): ConfirmationStatus?, ExchangeState?, Iterable, clientTransactionId, closed, commands, confirmationStatus, createdAt (+7 more)

### Community 330 - "exchange_projection.dart"
Cohesion: 0.15
Nodes (12): ExchangeSnapshot, closure, evidencePending, exchange, ExchangeProjection, fragmentPending, isPending, issuePending (+4 more)

### Community 332 - "storage-screen.test.tsx"
Cohesion: 0.15
Nodes (9): EXCHANGE_TYPE, FACTORY, MAPPING, mockedCreateStorageMapping, mockedFetchCurrentUser, mockedFetchMasterData, mockedFetchStorageMappings, STORAGE_LOCATION (+1 more)

### Community 335 - "idempotency_attempts.dart"
Cohesion: 0.25
Nodes (7): dart:convert, _canonical, _fingerprint, IdempotencyAttempts, isOpen, keyFor, settle

### Community 338 - "ApprovalModule"
Cohesion: 0.40
Nodes (3): ApprovalModule, InjectQueue, Module

### Community 339 - "confirmation.service.spec.ts"
Cohesion: 0.40
Nodes (3): approver, DecisionCreateCall, pending

## Knowledge Gaps
- **3443 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+3438 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **118 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `_Body` connect `_Body` to `assertFactoryScope`, `AuthController`, `.approve`, `AuthenticatedUser`, `RequirePermissions`, `.upload`, `RfidCardService`, `package:flutter/material.dart`, `.create`, `StatelessWidget`, `InventoryService`, `rfid.controller.ts`, `CountSessionController`?**
  _High betweenness centrality (0.234) - this node is a cross-community bridge._
- **Why does `AuthenticatedUser` connect `AuthenticatedUser` to `assertFactoryScope`, `RequirePermissions`, `.approve`, `AuditQueryDto`, `auth.controller.ts`, `identity.module.ts`, `InventoryService`, `AuthController`, `@nestjs/swagger`, `.upload`, `evidence.service.ts`, `audit.decorator.ts`, `MasterDataService`, `scope.guard.ts`, `confirmation.service.ts`, `ConfirmationService`, `inventory.controller.ts`, `rfid.controller.ts`, `PrismaService`, `employee.controller.ts`, `_Body`, `RfidCardService`, `sync.service.ts`, `.create`, `confirmation.service.spec.ts`, `master-data.controller.ts`, `.findAll`, `device.controller.ts`, `CountSessionController`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `RequirePermissions()` connect `RequirePermissions` to `assertFactoryScope`, `@nestjs/swagger`, `.approve`, `AuthenticatedUser`, `employee.controller.ts`, `.upload`, `rfid.controller.ts`, `RfidCardService`, `master-data.controller.ts`, `AuditQueryDto`, `.create`, `inventory.controller.ts`, `InventoryService`, `.findAll`, `device.controller.ts`, `CountSessionController`, `_Body`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _3443 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `assertFactoryScope` be split into smaller, more focused modules?**
  _Cohesion score 0.057547956630525435 - nodes in this community are weakly interconnected._
- **Should `app_database.dart` be split into smaller, more focused modules?**
  _Cohesion score 0.011111111111111112 - nodes in this community are weakly interconnected._
- **Should `create-test-app.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03755868544600939 - nodes in this community are weakly interconnected._