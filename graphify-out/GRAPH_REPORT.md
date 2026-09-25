# Graph Report - nexa_mobile  (2026-09-25)

## Corpus Check
- 830 files · ~426,792 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 6945 nodes · 15177 edges · 324 communities (214 shown, 110 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 243 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7c90a86c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ExchangeController
- RequirePermissions
- ConfirmationService
- app_database.dart
- PrismaService
- receiving-page.tsx
- inventory/api/types.ts
- app_database.steps.dart
- auth/index.ts
- renderWithQueryClient
- core/master-data/index.ts
- exchange-transactions-page.test.tsx
- schema_v1.dart
- auth/data-source.ts
- schema_v2.dart
- auth.ts
- auth-response.dto.ts
- permissions/index.ts
- dependencies
- devDependencies
- getApiErrorMessage
- client.ts
- identity.module.ts
- forgot-password.e2e-spec.ts
- app.module.ts
- RetentionService
- audit-log-page.test.tsx
- GeneratedPluginRegistrant.swift
- Database ERD & Physical Schema
- devDependencies
- CreateAdjustmentDto
- notification.service.ts
- components.json
- AuthController
- identity.seed.ts
- user.controller.ts
- compilerOptions
- .upload
- System Architecture Document
- scripts
- http-exception.filter.ts
- exchange.service.ts
- Claude Code Backend Setup Prompting Guide
- jest
- audit-log.interceptor.spec.ts
- package:nexa_mobile/shared/l10n/app_strings.dart
- ObjectStoragePort
- Backend CLAUDE.md
- approval.module.ts
- test_app.dart
- inventory-response.dto.ts
- exchange_remote_data_source.dart
- device_validation_controller.dart
- whatsapp.port.ts
- network_providers.dart
- compilerOptions
- sync.service.ts
- NotificationService
- authenticated-user.interface.ts
- inventory.service.ts
- providers.tsx
- Backend ARCHITECTURE.md
- notification.module.ts
- DeviceService
- count-session-detail-page.tsx
- my_application.cc
- transfer-page.test.tsx
- dependencies
- WebApps Dev Subagent Spec
- count-session-queries.ts
- rfid_scan_panel.dart
- Backend/package.json
- HealthService
- .enroll
- WhatsApp Integration Specification
- token_refresh_test.dart
- sync.service.spec.ts
- AuthenticatedUser
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
- master_data_repository_impl.dart
- provisioning_screen.dart
- integrations/ Adapter Isolation Pattern
- ExchangeWithContext
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
- storage-screen.tsx
- exchange_repository.dart
- users-screen-write.test.tsx
- user-write-queries.ts
- master-data.controller.ts
- confirmation-monitoring-page.test.tsx
- exchange_flow_state.dart
- mobile-response.dto.ts
- app_error.dart
- tables.dart
- cn
- adjustment-page.test.tsx
- return-page.test.tsx
- master_data_versions.dart
- evidence_views.dart
- SyncCommandDto
- ts-node
- fake_backend.dart
- router.dart
- exchange_steps.dart
- home_screen.dart
- count-session-detail-page.test.tsx
- database.config.ts
- setup-env.ts
- auth_remote_data_source.dart
- session_controller.dart
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
- package:flutter/material.dart
- 1. Fase 0 — Yang Harus Selesai *Sebelum* Membuka Claude Code
- lucide-react
- exchange_flow_screen.dart
- MOCK_SESSION_USER
- role-detail-screen.test.tsx
- evidence_repository_impl.dart
- location-data-source.ts
- win32_window.cpp
- proxy-config.test.ts
- rfid-screen.test.tsx
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
- devices-screen.tsx
- exchange.dart
- Win32Window
- provisioning_controller.dart
- inventory_stock_repository_impl.dart
- administration-roles.spec.ts
- auth_user.dart
- .findAll
- app_config.dart
- Admin-panel CRUD audit: five contract-ready write gaps close next, three stay blocked on undecided policy, three are recorded but not queued
- administration-devices.spec.ts
- nest-cli.json
- wWinMain
- DateTime?
- bootstrap_repository_test.dart
- Backend ↔ Mobile Contract Matrix
- source-map-support
- 0003-roles-permissions-ships-read-only-first.md
- 0005-admin-panel-writes-never-widen-access-and-never-overwrite-stock.md
- 0006-stock-operations-keep-a-header-row-beside-the-ledger.md
- 0007-mobile-sync-executes-through-exchange-service.md
- manifest.json
- MessageHandler
- device_qr_payload.dart
- DataClass
- package:nexa_mobile/core/error/app_error.dart
- evidence.dart
- AuditQueryDto
- CLAUDE.md — nexa_mobile (Troli App)
- master_data.dart
- Flutter project rules — nexa_mobile
- @hookform/resolvers
- mobile-dev.md
- auth_repository_impl.dart
- RegisterPlugins
- routes.dart
- FlutterActivity
- nexa_mobile — NEXA Troli (Android tablet)
- sync-commands.ts
- LaunchImage.imageset/README.md
- dashboard/api/data-source.ts
- Table
- exchange_flow_test.dart
- main.ts
- fake_exchange_server.dart
- 22 — Mobile Folder Structure (nexa_mobile)
- trolley-screen.test.tsx
- public.decorator.ts
- fixtures.dart
- ResetPasswordDto
- exchange_repository_impl.dart
- app_logger.dart
- penukaran_hari_ini_card_test.dart
- operator_lookup.dart
- confirmation-monitoring-page.tsx
- AppDelegate
- ios/RunnerTests/RunnerTests.swift
- count-session-page.test.tsx
- ForgotPasswordDto
- List
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
- exchange_flow_step.dart
- history_repository.dart
- first_launch_flow_test.dart
- app.dart
- MessageHandler
- FakeRefreshTokenRepository
- Schema2

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

## Communities (324 total, 110 thin omitted)

### Community 0 - "ExchangeController"
Cohesion: 0.25
Nodes (16): ExchangeController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+8 more)

### Community 1 - "RequirePermissions"
Cohesion: 0.08
Nodes (32): Audit(), RequirePermissions(), ExchangeTypeController, FactoryController, LocationController, NeedleTypeController, StorageMappingController, TrolleyController (+24 more)

### Community 2 - "ConfirmationService"
Cohesion: 0.07
Nodes (35): ConfirmationController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+27 more)

### Community 3 - "app_database.dart"
Cohesion: 0.01
Nodes (143): _, actualTableName, _alias, aliasedName, allSchemaEntities, allTables, attachedDatabase, byteSize (+135 more)

### Community 4 - "PrismaService"
Cohesion: 0.03
Nodes (65): PrismaService, Injectable, AuditService, PagedAuditLogs, Injectable, RoleWithMemberCount, ALL_PERMISSIONS, PermissionCode (+57 more)

### Community 5 - "receiving-page.tsx"
Cohesion: 0.06
Nodes (89): Button, ButtonProps, buttonVariants, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogTitle (+81 more)

### Community 6 - "inventory/api/types.ts"
Cohesion: 0.04
Nodes (65): createAdjustment(), createReceiving(), createReturn(), createTransfer(), fetchBalances(), fetchMovements(), fetchTrolleyStock(), AdjustmentReasonCode (+57 more)

### Community 7 - "app_database.steps.dart"
Cohesion: 0.02
Nodes (119): byteSize, capturedAt, category, checkedAt, clientTransactionId, code, collection, _column_0 (+111 more)

### Community 8 - "auth/index.ts"
Cohesion: 0.06
Nodes (13): RoleDetailScreen(), RolesScreen(), ForgotPasswordScreen(), LoginScreen(), RequireAuth(), ResetPasswordScreen(), ConfirmationDetailScreen(), DashboardScreen() (+5 more)

### Community 9 - "renderWithQueryClient"
Cohesion: 0.03
Nodes (55): makeDevice(), makePaged(), mockedFetchCurrentUser, mockedFetchDevices, mockedFetchMasterData, openDetail(), qrValues, mockedFetchCurrentUser (+47 more)

### Community 10 - "core/master-data/index.ts"
Cohesion: 0.06
Nodes (57): authKeys, Employee, ExchangeType, Factory, Location, LOCATION_TYPE_LABELS, MASTER_DATA_COLLECTIONS, MasterDataRow (+49 more)

### Community 11 - "exchange-transactions-page.test.tsx"
Cohesion: 0.11
Nodes (22): fetchExchangeDetail(), fetchExchangeEvidence(), fetchExchanges(), exchangeKeys, useExchangeDetail(), useExchangeEvidence(), useExchangeList(), EvidenceItem (+14 more)

### Community 12 - "schema_v1.dart"
Cohesion: 0.02
Nodes (89): class, class LocalDeviceContextData extends, class LocalDeviceValidation extends, class LocalDeviceValidationData extends, class LocalExchangeType extends, class LocalExchangeTypeData extends, class LocalMasterDataVersion extends, class LocalMasterDataVersionData extends (+81 more)

### Community 13 - "auth/data-source.ts"
Cohesion: 0.08
Nodes (38): apiClient, DEFAULT_ERROR_MESSAGE, refreshAccessToken(), SERVER_UNREACHABLE_MESSAGE, config, fetchCurrentUser(), forgotPassword(), login() (+30 more)

### Community 14 - "schema_v2.dart"
Cohesion: 0.02
Nodes (85): class LocalDeviceContext extends, class LocalExchange extends, class LocalExchangeData extends, class LocalExchangeEvidence extends, class LocalExchangeEvidenceData extends, GeneratedColumn, LocalExchange, LocalExchangeEvidence (+77 more)

### Community 15 - "auth.ts"
Cohesion: 0.13
Nodes (17): Captured, envelope(), FACTORY, makeUser(), mockUsersApi(), Captured, envelope(), makeEntry() (+9 more)

### Community 16 - "auth-response.dto.ts"
Cohesion: 0.60
Nodes (5): LoginResponseDto, LoginUserDto, MeResponseDto, TokenPairDto, ApiProperty

### Community 17 - "permissions/index.ts"
Cohesion: 0.16
Nodes (19): TooltipContent, useCurrentUser(), Factory, useAuthorizedFactories(), hasAllPermissions(), hasAnyPermission(), hasPermission(), PermissionCode (+11 more)

### Community 18 - "dependencies"
Cohesion: 0.04
Nodes (47): dependencies, bcryptjs, bullmq, class-transformer, class-validator, dotenv, ioredis, joi (+39 more)

### Community 19 - "devDependencies"
Cohesion: 0.07
Nodes (29): jsdom, @playwright/test, postcss, tailwindcss, tailwindcss-animate, @testing-library/jest-dom, @testing-library/user-event, @types/react (+21 more)

### Community 20 - "getApiErrorMessage"
Cohesion: 0.04
Nodes (84): react, react, getApiErrorMessage(), hasErrorEnvelope(), displayLabel(), useMasterData(), FactoryScopeState, useFactoryScopeStore (+76 more)

### Community 21 - "client.ts"
Cohesion: 0.05
Nodes (87): API_BASE_PATH, ApiErrorBody, ApiResponseMeta, MUTATING_METHODS, PERMISSIONS, usePermission(), UserFormDialog(), AuditFilters() (+79 more)

### Community 22 - "identity.module.ts"
Cohesion: 0.05
Nodes (26): JwtPayload, LoginDto, ApiProperty, IsNotEmpty, IsString, MaxLength, PasswordResetTokenRepository, Injectable (+18 more)

### Community 23 - "forgot-password.e2e-spec.ts"
Cohesion: 0.08
Nodes (14): EmailModule, Module, EMAIL_CLIENT, EmailMessage, EmailPort, ADR-0002, NodemailerEmailAdapter, ADR-0002 (+6 more)

### Community 24 - "app.module.ts"
Cohesion: 0.05
Nodes (37): RbacGuard, Injectable, HealthModule, Module, IdempotencyModule, Global, Module, RequestIdMiddleware (+29 more)

### Community 25 - "RetentionService"
Cohesion: 0.12
Nodes (12): RecordRetentionProcessor, Processor, RETENTION_QUEUE, RETENTION_SWEEP_JOB, RetentionModule, InjectQueue, Module, RetentionService (+4 more)

### Community 26 - "audit-log-page.test.tsx"
Cohesion: 0.15
Nodes (16): fetchAuditLogs(), auditKeys, useAuditLogs(), AUDIT_ACTIONS, AuditAction, AuditLogEntry, AuditLogFilters, DEFAULT_AUDIT_FILTERS (+8 more)

### Community 27 - "GeneratedPluginRegistrant.swift"
Cohesion: 0.14
Nodes (12): Cocoa, connectivity_plus, flutter_secure_storage_darwin, FlutterMacOS, FlutterPluginRegistry, FlutterViewController, Foundation, mobile_scanner (+4 more)

### Community 28 - "Database ERD & Physical Schema"
Cohesion: 0.12
Nodes (23): Response Envelope Interceptor Ordering, ScopeGuard / assertFactoryScope Dual Implementation, Stock Ledger Invariants (Three Layers), Audit Logging Mechanism, Idempotency-Key / client_transaction_id Mechanism, Five-Dimension Authorization Model, Adjustment (Domain Concept), Approval (Domain Concept) (+15 more)

### Community 29 - "devDependencies"
Cohesion: 0.04
Nodes (49): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, globals, jest, @nestjs/cli (+41 more)

### Community 30 - "CreateAdjustmentDto"
Cohesion: 0.08
Nodes (41): UploadedFile, InventoryController, ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags (+33 more)

### Community 31 - "notification.service.ts"
Cohesion: 0.14
Nodes (16): NOTIFICATION_DISPATCH_JOB, ADR-0006, resolveTemplateVariables(), STUCK_REASONS, STUCK_TEXT, StuckReason, stuckReasonText(), TEMPLATE_VARIABLES (+8 more)

### Community 32 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 33 - "AuthController"
Cohesion: 0.18
Nodes (18): Public(), AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser (+10 more)

### Community 34 - "identity.seed.ts"
Cohesion: 0.21
Nodes (13): humanize(), IdentitySeedResult, ROLE_DESCRIPTIONS, seedAdminUser(), seedIdentity(), seedPermissions(), seedRoles(), MasterDataSeedResult (+5 more)

### Community 35 - "user.controller.ts"
Cohesion: 0.05
Nodes (54): FORBIDDEN, GRANT_FORBIDDEN, NOT_FOUND, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller (+46 more)

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

### Community 41 - "exchange.service.ts"
Cohesion: 0.09
Nodes (26): isEvidenceComplete(), missingEvidenceTypes(), requiredEvidenceTypes(), ALLOWED_MIME_TYPES, EvidenceService, Injectable, UPLOAD_ALLOWED_STATES, exchangeNotFound() (+18 more)

### Community 42 - "Claude Code Backend Setup Prompting Guide"
Cohesion: 0.17
Nodes (19): Root CLAUDE.md, Exchange State Machine (CREATED→COMPLETED), State-Based UI (ExchangeState drives actions), Catatan Penggunaan, Fase 0 — Kunci Keputusan Terbuka, Fase 10 — Modul Synchronization, Fase 11 — Kontrak API & Dokumentasi, Fase 12 — Test Menyeluruh & Docker (+11 more)

### Community 43 - "jest"
Cohesion: 0.11
Nodes (18): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, moduleNameMapper, rootDir, roots, testEnvironment (+10 more)

### Community 44 - "audit-log.interceptor.spec.ts"
Cohesion: 0.10
Nodes (16): AuditRecord, AuditWriter, AuditWriterModule, Global, Module, SNAPSHOT_FIELDS, Injectable, AUDIT_KEY (+8 more)

### Community 45 - "package:nexa_mobile/shared/l10n/app_strings.dart"
Cohesion: 0.03
Nodes (68): NeedleType, build, onTap, TukarJarumCtaCard, StepCancel, build, _CancelDialog, _CancelDialogState (+60 more)

### Community 46 - "ObjectStoragePort"
Cohesion: 0.15
Nodes (8): MinioObjectStorageAdapter, Injectable, ObjectStorageModule, Module, OBJECT_STORAGE, ObjectStoragePort, StoredObject, Inject

### Community 47 - "Backend CLAUDE.md"
Cohesion: 0.12
Nodes (17): Exchange State Machine (Pure Function), Side Effects Happen After Commit, ADR-001 Modular Monolith, Backend CLAUDE.md, approval module, audit module, device module, employee module (+9 more)

### Community 48 - "approval.module.ts"
Cohesion: 0.09
Nodes (13): FACTORY_SCOPE_KEY, LOCATION_SCOPE_KEY, ScopeSource, ScopeGuard, Injectable, CONFIRMATION_EXPIRY_JOB, CONFIRMATION_EXPIRY_QUEUE, ConfirmationExpiryProcessor (+5 more)

### Community 49 - "test_app.dart"
Cohesion: 0.04
Nodes (62): AppConfig, dart:io, Directory, fakes.dart, ../helpers/fake_exchange_server.dart, info, _historyRemoteProvider, historyRepositoryProvider (+54 more)

### Community 50 - "inventory-response.dto.ts"
Cohesion: 0.07
Nodes (51): CountSessionController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+43 more)

### Community 51 - "exchange_remote_data_source.dart"
Cohesion: 0.04
Nodes (52): _Json, ApiClient, _api, confirmation, create, _date, decisions, fetch (+44 more)

### Community 52 - "device_validation_controller.dart"
Cohesion: 0.04
Nodes (83): ConsumerState, ConsumerStatefulWidget, AppGate, appGateProvider, resolveAppGate, appVersionProvider, serverClockProvider, connectivityStatusProvider (+75 more)

### Community 53 - "whatsapp.port.ts"
Cohesion: 0.20
Nodes (10): MetaCloudWhatsAppAdapter, MetaSendResponse, Injectable, ADR-0006, WHATSAPP_CLIENT, WhatsAppMessage, WhatsAppPort, WhatsAppSendResult (+2 more)

### Community 54 - "network_providers.dart"
Cohesion: 0.03
Nodes (79): Dio, Future, Interceptor, _categoryFor, _categoryForStatus, ErrorMapper, fromDioException, fromErrorBody (+71 more)

### Community 55 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, @testing-library/jest-dom, **/*.tsx, vitest/globals (+20 more)

### Community 56 - "sync.service.ts"
Cohesion: 0.17
Nodes (12): toExchangeResponse(), EXCHANGE_CONTEXT_INCLUDE, ExchangeRepository, Injectable, ChangedRow, SyncChangesService, toMobileExchange(), Injectable (+4 more)

### Community 57 - "NotificationService"
Cohesion: 0.24
Nodes (4): NotificationDispatchProcessor, Processor, NotificationService, Injectable

### Community 58 - "authenticated-user.interface.ts"
Cohesion: 0.05
Nodes (45): AUDIT_ACTIONS, CurrentUser, CurrentDevice, RequireDeviceContext(), Paginated(), REQUIRED_PERMISSIONS_KEY, DomainException, ERROR_CODES (+37 more)

### Community 59 - "inventory.service.ts"
Cohesion: 0.04
Nodes (63): NumberSequenceService, PREFIXES, SEQUENCE_SCOPES, Injectable, ListAdjustmentsQueryDto, ListBalancesQueryDto, ListCountSessionsQueryDto, ListMovementsQueryDto (+55 more)

### Community 60 - "providers.tsx"
Cohesion: 0.21
Nodes (8): inter, jetbrainsMono, metadata, RootLayout(), Providers(), Toaster(), QueryProvider(), ThemeProvider()

### Community 61 - "Backend ARCHITECTURE.md"
Cohesion: 0.23
Nodes (12): Backend ARCHITECTURE.md, ADR-002 PostgreSQL, Backend docker-compose.yml, minio service, minio-init service, postgres service, redis service, Backend README.md (+4 more)

### Community 62 - "notification.module.ts"
Cohesion: 0.36
Nodes (4): Module, WhatsAppModule, NOTIFICATION_QUEUE, DispatchJobData

### Community 63 - "DeviceService"
Cohesion: 0.08
Nodes (36): DeviceController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+28 more)

### Community 64 - "count-session-detail-page.tsx"
Cohesion: 0.07
Nodes (41): useLookup(), formatLastSeen(), DeviceDetailDialog(), userColumns, ADJUSTMENT_REASON_LABELS, AdjustmentEvidence, MOVEMENT_TYPE_LABELS, StockStatus (+33 more)

### Community 65 - "my_application.cc"
Cohesion: 0.09
Nodes (22): FlPluginRegistry, FlView, GApplication, gboolean, gchar, GObject, GtkApplication, MyApplicationClass (+14 more)

### Community 66 - "transfer-page.test.tsx"
Cohesion: 0.11
Nodes (14): DESTINATION_LOCATION, FACTORY, makePaged(), makeTransfer(), mockedCreateTransfer, mockedFetchAllUsers, mockedFetchBalances, mockedFetchCurrentUser (+6 more)

### Community 67 - "dependencies"
Cohesion: 0.07
Nodes (27): axios, class-variance-authority, clsx, date-fns, next-themes, react-dom, react-hook-form, recharts (+19 more)

### Community 68 - "WebApps Dev Subagent Spec"
Cohesion: 0.24
Nodes (11): ADR-004 Backend Is the Stock Authority, WebApps Dev Subagent Spec, Flag Gaps and Conflicts Principle, 10-Stage Development Lifecycle, Reuse Before You Build Principle, WebApps Stack Decision, OpenAPI/Swagger Specification, WebApps UI/UX Specification (+3 more)

### Community 69 - "count-session-queries.ts"
Cohesion: 0.14
Nodes (24): addCountItem(), cancelCountSession(), completeCountSession(), createCountSession(), fetchCountSession(), fetchCountSessions(), countSessionKeys, useAddCountItem() (+16 more)

### Community 70 - "rfid_scan_panel.dart"
Cohesion: 0.04
Nodes (53): HardwareKeyboard?, HardwareKeyboard get, _buffer, _cards, cardStream, _debouncer, dispose, handleKeyEvent (+45 more)

### Community 71 - "Backend/package.json"
Cohesion: 0.20
Nodes (9): description, engines, node, license, name, prisma, seed, private (+1 more)

### Community 72 - "HealthService"
Cohesion: 0.16
Nodes (10): HealthController, ApiOperation, ApiResponse, ApiTags, Controller, Get, HealthService, HealthStatus (+2 more)

### Community 73 - ".enroll"
Cohesion: 0.09
Nodes (31): RfidController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+23 more)

### Community 74 - "WhatsApp Integration Specification"
Cohesion: 0.31
Nodes (10): OpenAPI / Swagger Specification, Offline RFID Policy Deferral, RFID Integration Specification, WhatsApp Integration Specification, Mobile Offline Sync Specification, Mobile UI/UX Specification, WebApps UI/UX Specification, Backend Folder Structure (+2 more)

### Community 75 - "token_refresh_test.dart"
Cohesion: 0.04
Nodes (63): ../helpers/fake_backend.dart, ../../../helpers/fakes.dart, ../helpers/fixtures.dart, ../helpers/test_app.dart, HttpClientAdapter, Map, FakeBackend, api (+55 more)

### Community 76 - "sync.service.spec.ts"
Cohesion: 0.07
Nodes (16): ClaimRequest, ClaimResult, IdempotencyStore, Injectable, IdempotencyKeyMiddleware, Injectable, messagesOf(), SyncService (+8 more)

### Community 77 - "AuthenticatedUser"
Cohesion: 0.04
Nodes (45): assertFactoryScope(), isInFactoryScope(), AuthenticatedUser, CONFIRMATION_INCLUDE, ConfirmationWithContext, EmployeeController, ApiBearerAuth, ApiOperation (+37 more)

### Community 78 - "POST /mobile/sync (client)"
Cohesion: 0.22
Nodes (9): Master Data APIs, POST /mobile/sync, Employee Resolution via RFID, BROKEN_NEEDLE_CONFIRMATION Message Template, POST /mobile/sync (client), Pending Sync Screen, Module-to-Document Mapping Table, GAP-03 Master-Data Read API (+1 more)

### Community 79 - "device_remote_data_source.dart"
Cohesion: 0.05
Nodes (39): active,
  inactive,
  revoked,, _api, bootstrap, BootstrapResponseDto, clockOffsetMs, device, factory, fromJson (+31 more)

### Community 80 - "exchange_flow_controller.dart"
Cohesion: 0.04
Nodes (56): ActiveExchangeStore get, ExchangeRepository get, masterDataRefresherProvider, activeExchangeStoreProvider, confirmationPollIntervalProvider, exchangeRepositoryProvider, _apply, _attempts (+48 more)

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
Nodes (202): accessDeniedBody, accessDeniedTitle, appName, AppStrings, appVersion, awaitingBody, awaitingTitle, back (+194 more)

### Community 87 - "master_data_refresher_test.dart"
Cohesion: 0.03
Nodes (81): _bootstrap, BootstrapMasterDataRefresher, _masterData, refresh, bootstrap, BootstrapRepositoryImpl, cached, _deviceStore (+73 more)

### Community 88 - "master_data_repository_impl.dart"
Cohesion: 0.06
Nodes (36): _, @DriftDatabase, generated/schema.dart, generated/schema_v1.dart, generated/schema_v2.dart, AppDatabase, appDatabaseProvider, db (+28 more)

### Community 89 - "provisioning_screen.dart"
Cohesion: 0.03
Nodes (66): dart:async, MobileScannerController, MobileScannerException?, _controller, DeviceAccessEvent, DeviceAccessInactive, DeviceAccessNotFound, dispose (+58 more)

### Community 90 - "integrations/ Adapter Isolation Pattern"
Cohesion: 0.40
Nodes (5): WhatsApp Notification Flow (Backend Internal), Reader Integration Modes (USB/Bluetooth/Vendor SDK), POST /internal/notifications/whatsapp Payload, Evidence Upload Flow (Photo → Object Storage), integrations/ Adapter Isolation Pattern

### Community 91 - "ExchangeWithContext"
Cohesion: 0.30
Nodes (3): ExchangeWithContext, ExchangeService, Injectable

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

### Community 102 - "storage-screen.tsx"
Cohesion: 0.19
Nodes (17): createStorageMapping(), fetchStorageMappings(), updateStorageMapping(), storageMappingKeys, useCreateStorageMapping(), useStorageMappings(), useUpdateStorageMapping(), CreateStorageMappingInput (+9 more)

### Community 103 - "exchange_repository.dart"
Cohesion: 0.05
Nodes (47): CommandResult, ApiFailure, ApiResult, ApiSuccess, data, error, meta, ApiMeta (+39 more)

### Community 104 - "users-screen-write.test.tsx"
Cohesion: 0.09
Nodes (36): fetchAllUsers(), fetchUser(), fetchUsers(), userDisplayLabel(), userKeys, UserLookup, useUserLookup(), useUsersByRole() (+28 more)

### Community 105 - "user-write-queries.ts"
Cohesion: 0.15
Nodes (23): assignFactoryScope(), assignRole(), createUser(), revokeFactoryScope(), revokeRole(), updateUser(), useAssignFactoryScope(), useAssignRole() (+15 more)

### Community 106 - "master-data.controller.ts"
Cohesion: 0.12
Nodes (41): DUPLICATE_CODE, EDIT_FORBIDDEN, FORBIDDEN, NOT_FOUND, CREATABLE_LOCATION_TYPES, CreatableLocationType, CreateFactoryDto, CreateLocationDto (+33 more)

### Community 107 - "confirmation-monitoring-page.test.tsx"
Cohesion: 0.13
Nodes (21): approveConfirmation(), fetchConfirmation(), fetchConfirmations(), rejectConfirmation(), confirmationKeys, useApproveConfirmation(), useConfirmationList(), useRejectConfirmation() (+13 more)

### Community 108 - "exchange_flow_state.dart"
Cohesion: 0.05
Nodes (41): EvidenceType? get, approvedNotice, availableQuantity, busy, cancelledAfterIssue, canRetry, catalog, confirmation (+33 more)

### Community 109 - "mobile-response.dto.ts"
Cohesion: 0.08
Nodes (32): MobileController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+24 more)

### Community 110 - "app_error.dart"
Cohesion: 0.04
Nodes (47): authForbidden, authInvalidToken, BackendErrorCodes, category, ClientErrorCodes, code, conflict, context (+39 more)

### Community 111 - "tables.dart"
Cohesion: 0.03
Nodes (60): BoolColumn get, DateTimeColumn get, IntColumn get, byteSize, capturedAt, category, checkedAt, clientTransactionId (+52 more)

### Community 112 - "cn"
Cohesion: 0.06
Nodes (78): Badge(), BadgeProps, badgeVariants, Card, CardContent, CardDescription, CardFooter, CardHeader (+70 more)

### Community 113 - "adjustment-page.test.tsx"
Cohesion: 0.11
Nodes (13): FACTORY, LOCATION, makeAdjustment(), makePaged(), mockedCreateAdjustment, mockedFetchAdjustment, mockedFetchAdjustments, mockedFetchAllUsers (+5 more)

### Community 114 - "return-page.test.tsx"
Cohesion: 0.11
Nodes (15): FACTORY, makePaged(), makeReturn(), mockedCreateReturn, mockedFetchAllUsers, mockedFetchBalances, mockedFetchCurrentUser, mockedFetchMasterData (+7 more)

### Community 115 - "master_data_versions.dart"
Cohesion: 0.09
Nodes (26): CollectionUpdate, differsFrom, exchangeTypes, InvalidateCollectionVersion, isEmpty, isPresent, KeepCollection, MasterDataCollection (+18 more)

### Community 116 - "evidence_views.dart"
Cohesion: 0.06
Nodes (40): CameraController?, buildPreview, camera, CameraPackageEvidenceCamera, capture, _controller, dispose, EvidenceCameraPreviewBuilder (+32 more)

### Community 117 - "SyncCommandDto"
Cohesion: 0.12
Nodes (23): BootstrapQueryDto, SyncCommandDto, SyncRequestDto, ApiProperty, ApiPropertyOptional, ArrayMaxSize, IsArray, IsIn (+15 more)

### Community 119 - "fake_backend.dart"
Cohesion: 0.07
Nodes (28): dart:convert, dart:typed_data, _canonical, _fingerprint, IdempotencyAttempts, isOpen, keyFor, settle (+20 more)

### Community 120 - "router.dart"
Cohesion: 0.06
Nodes (33): @visibleForTesting, AsyncValue, GoRouter, allowed, fallback, gate, redirectFor, router (+25 more)

### Community 121 - "exchange_steps.dart"
Cohesion: 0.08
Nodes (40): ConsumerWidget, StokTroliCard, exchangeFlowControllerProvider, ExchangeFlowScreen, StockProblem, AwaitingConfirmationStep, build, CompleteStep (+32 more)

### Community 122 - "home_screen.dart"
Cohesion: 0.06
Nodes (37): bool get, DeviceContextSnapshot, build, HomeScreen, riwayatSubtitle, _StackedLayout, sync, _TabletLayout (+29 more)

### Community 123 - "count-session-detail-page.test.tsx"
Cohesion: 0.10
Nodes (18): fetchMasterData(), fetchMasterDataRow(), MasterDataQuery, Lookup, masterDataKeys, MasterDataCollection, FACTORY, LOCATION (+10 more)

### Community 126 - "auth_remote_data_source.dart"
Cohesion: 0.10
Nodes (19): accessToken, _api, expiresInSeconds, factoryIds, fromJson, id, locationIds, login (+11 more)

### Community 127 - "session_controller.dart"
Cohesion: 0.17
Nodes (12): AuthRepository get, sessionEventsProvider, authRepositoryProvider, build, login, logout, _refreshProfile, _repository (+4 more)

### Community 128 - "fakes.dart"
Cohesion: 0.10
Nodes (20): bytes, capture, captures, _changes, current, delete, directory, dispose (+12 more)

### Community 148 - "package:flutter/material.dart"
Cohesion: 0.03
Nodes (90): BorderRadius, Color, EdgeInsetsGeometry, IconData, main, tap, AppTheme, light (+82 more)

### Community 149 - "1. Fase 0 — Yang Harus Selesai *Sebelum* Membuka Claude Code"
Cohesion: 0.14
Nodes (13): 0. Kenapa Dokumen Ini Ada, 1.1 Verifikasi kontrak API mobile vs backend aktual, 1.2 Kunci keputusan teknis terbuka, 1.3 `Mobile/CLAUDE.md` — root rules untuk Claude Code, 1.4 `Docs/22-Mobile-Folder-Structure.md`, 1.5 Agent routing — `Docs/agents/mobile-dev.md`, 1.6 SKILL.md yang paling relevan, 1.7 Pemecahan tiket di `.scratch/` (+5 more)

### Community 151 - "exchange_flow_screen.dart"
Cohesion: 0.05
Nodes (37): Connectivity, changes, _connectivity, ConnectivityPlusSource, ConnectivitySource, connectivitySourceProvider, ConnectivityStatus, current (+29 more)

### Community 152 - "MOCK_SESSION_USER"
Cohesion: 0.18
Nodes (9): mockLoggedOut(), unauthorized(), confirmation(), envelope(), EXCHANGE, mockExchangeDetailApi(), USERS, MOCK_SESSION_USER (+1 more)

### Community 153 - "role-detail-screen.test.tsx"
Cohesion: 0.12
Nodes (18): fetchPermissions(), fetchRoles(), roleKeys, usePermissionCatalogue(), useRole(), useRoles(), PermissionRow, RoleRow (+10 more)

### Community 154 - "evidence_repository_impl.dart"
Cohesion: 0.06
Nodes (35): ActiveExchangeStoreImpl, begin, current, _db, finish, recordOperator, recordServerState, _toRecord (+27 more)

### Community 155 - "location-data-source.ts"
Cohesion: 0.25
Nodes (11): createLocation(), updateLocation(), useCreateLocation(), useInvalidateLocations(), useUpdateLocation(), CREATABLE_LOCATION_TYPES, CreatableLocationType, CreateLocationInput (+3 more)

### Community 156 - "win32_window.cpp"
Cohesion: 0.16
Nodes (15): wchar_t, Scale(), Create, Destroy, GetHandle, SetQuitOnClose, Win32Window::Win32Window(), WindowClassRegistrar (+7 more)

### Community 158 - "proxy-config.test.ts"
Cohesion: 0.29
Nodes (4): nextConfig, nextConfig, ORIGINAL, SimpleRewrite

### Community 159 - "rfid-screen.test.tsx"
Cohesion: 0.08
Nodes (30): ApiSuccessBody, createEmployee(), updateEmployee(), useCreateEmployee(), useUpdateEmployee(), CreateEmployeeInput, EntityStatus, UpdateEmployeeInput (+22 more)

### Community 160 - "design_tokens.dart"
Cohesion: 0.07
Nodes (29): @immutable, BuildContext, DesignTokens get, buttonHeight, cardShadow, copyWith, ctaBackground, ctaBackgroundDark (+21 more)

### Community 162 - "envelope.dart"
Cohesion: 0.09
Nodes (22): ApiErrorBody, Envelope, ApiErrorBody, code, context, data, details, Envelope (+14 more)

### Community 235 - "devices-screen.tsx"
Cohesion: 0.12
Nodes (27): activateDevice(), fetchDevices(), reassignDevice(), registerDevice(), revokeDevice(), deviceKeys, useActivateDevice(), useDevices() (+19 more)

### Community 242 - "exchange.dart"
Cohesion: 0.06
Nodes (35): ConfirmationStatus?, blocksExchange, brokenExchangeTypeCode, cancelledAt, completedAt, confirmationId, confirmationNumber, ConfirmationSnapshot (+27 more)

### Community 243 - "Win32Window"
Cohesion: 0.13
Nodes (20): DartProject, FlutterWindow, flutter_controller_, FlutterWindow::FlutterWindow(), OnCreate, OnDestroy, project_, DartProject (+12 more)

### Community 244 - "provisioning_controller.dart"
Cohesion: 0.15
Nodes (16): provisioningRepositoryProvider, ProvisionedDevice, build, confirm, device, _load, notice, Provisioned (+8 more)

### Community 245 - "inventory_stock_repository_impl.dart"
Cohesion: 0.07
Nodes (28): InventoryRemoteDataSource, _inventoryRemoteProvider, trolleyStockRepositoryProvider, InventoryStockRepositoryImpl, _mapItems, _masterData, _remote, trolleyStock (+20 more)

### Community 246 - "administration-roles.spec.ts"
Cohesion: 0.32
Nodes (7): Captured, envelope(), FACTORY, makeMember(), mockRolesApi(), PERMISSIONS, ROLES

### Community 247 - "auth_user.dart"
Cohesion: 0.06
Nodes (35): LoginResult, AuthRepositoryImpl, AuthRepository, error, login, LoginFailed, LoginResult, LoginSucceeded (+27 more)

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

### Community 254 - "DateTime?"
Cohesion: 0.06
Nodes (27): DateTime?, Duration, build, now, observe, ServerClock, setOffset, build (+19 more)

### Community 255 - "bootstrap_repository_test.dart"
Cohesion: 0.10
Nodes (27): DeviceStatus, blockedStatusOf, BootstrapAccessDenied, BootstrapDeviceBlocked, BootstrapDeviceNotRegistered, BootstrapOutcome, BootstrapSucceeded, BootstrapUnavailable (+19 more)

### Community 256 - "Backend ↔ Mobile Contract Matrix"
Cohesion: 0.18
Nodes (10): Backend ↔ Mobile Contract Matrix, Conventions every tablet call follows, Doc 07 error names → backend codes (Doc 07 §40–41), Gaps and decisions, Mapping tables the tablet needs, Matrix, Stock status labels (FR-MOB-015), Summary (+2 more)

### Community 262 - "manifest.json"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, name, orientation, prefer_related_applications, short_name (+2 more)

### Community 263 - "MessageHandler"
Cohesion: 0.38
Nodes (10): HWND, LPARAM, LRESULT, UINT, WPARAM, EnableFullDpiSupportIfAvailable(), GetThisFromHandle, MessageHandler (+2 more)

### Community 264 - "device_qr_payload.dart"
Cohesion: 0.09
Nodes (21): DeviceQrPayload?, deviceCode, deviceId, DeviceQrAccepted, DeviceQrParseResult, DeviceQrPayload, DeviceQrPayloadParser, DeviceQrRejected (+13 more)

### Community 265 - "DataClass"
Cohesion: 0.06
Nodes (60): DeviceContextRow, DeviceValidationRow, ExchangeTypeRow, LocalDeviceContextCompanion, LocalDeviceValidationCompanion, LocalExchangeCompanion, LocalExchangeEvidenceCompanion, LocalExchangeEvidenceRow (+52 more)

### Community 266 - "package:nexa_mobile/core/error/app_error.dart"
Cohesion: 0.12
Nodes (26): _byCode, ErrorMessages, forCategory, forCode, availableQuantity, AwaitConfirmation, ExchangeCommand, ExchangeErrorRoute (+18 more)

### Community 267 - "evidence.dart"
Cohesion: 0.07
Nodes (27): ExchangeState?, allowedMimeTypes, byteSize, capturedAt, check, clientTransactionId, EvidenceFilePolicy, EvidenceFileProblem (+19 more)

### Community 268 - "AuditQueryDto"
Cohesion: 0.08
Nodes (22): AuditController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+14 more)

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

### Community 274 - "auth_repository_impl.dart"
Cohesion: 0.04
Nodes (50): FlutterSecureStorage, _cached, clear, deviceCode, deviceId, _loaded, ProvisionedDeviceStore, read (+42 more)

### Community 276 - "routes.dart"
Cohesion: 0.10
Nodes (18): blocked, history, home, login, newExchange, provision, Routes, settings (+10 more)

### Community 278 - "nexa_mobile — NEXA Troli (Android tablet)"
Cohesion: 0.40
Nodes (4): Environments, First launch on a tablet, nexa_mobile — NEXA Troli (Android tablet), Tests

### Community 279 - "sync-commands.ts"
Cohesion: 0.17
Nodes (23): CancelExchangeDto, CreateExchangeDto, IdentifyOperatorDto, IssueNeedleDto, ListExchangesQueryDto, RecordFragmentDto, SelectExchangeTypeDto, SelectNewNeedleDto (+15 more)

### Community 281 - "dashboard/api/data-source.ts"
Cohesion: 0.13
Nodes (20): buildDeviceQrPayload(), DEVICE_QR_TYPE, DEVICE_QR_VERSION, DeviceQrPayload, DEVICE, copyText(), downloadQrSvg(), escapeXml() (+12 more)

### Community 282 - "Table"
Cohesion: 0.13
Nodes (28): @DataClassName, LocalDeviceContext, LocalDeviceValidation, LocalExchange, LocalExchangeEvidence, LocalExchangeType, LocalMasterDataVersion, LocalNeedleType (+20 more)

### Community 283 - "exchange_flow_test.dart"
Cohesion: 0.08
Nodes (23): File, FilledButton, ensureVisible, enterText, _expectStep, finder, h, _identifyOperator (+15 more)

### Community 284 - "main.ts"
Cohesion: 0.32
Nodes (5): AppModule, Module, ALLOWED_HEADERS, configureApp(), bootstrap()

### Community 291 - "fake_exchange_server.dart"
Cohesion: 0.09
Nodes (22): fake_backend.dart, fixtures.dart, backend, cancelReason, cardUid, completedCount, confirmationId, confirmationStatus (+14 more)

### Community 292 - "22 — Mobile Folder Structure (nexa_mobile)"
Cohesion: 0.25
Nodes (7): 1. Top level, 22 — Mobile Folder Structure (nexa_mobile), 2. `lib/app/` and `lib/core/`, 3. `lib/features/`, 4. `lib/shared/`, 5. Local database (Drift), 6. Environments

### Community 293 - "trolley-screen.test.tsx"
Cohesion: 0.14
Nodes (14): createTrolley(), updateTrolley(), useCreateTrolley(), useUpdateTrolley(), CreateTrolleyInput, EntityStatus, UpdateTrolleyInput, FACTORY (+6 more)

### Community 294 - "public.decorator.ts"
Cohesion: 0.33
Nodes (3): IS_PUBLIC_KEY, JwtAuthGuard, Injectable

### Community 295 - "fixtures.dart"
Cohesion: 0.29
Nodes (6): bootstrapData, deviceCode, deviceId, heartbeatData, loginData, meData

### Community 296 - "ResetPasswordDto"
Cohesion: 0.33
Nodes (6): ResetPasswordDto, ApiProperty, IsString, Matches, MaxLength, MinLength

### Community 297 - "exchange_repository_impl.dart"
Cohesion: 0.12
Nodes (16): ExchangeRepository, ExchangeRemoteDataSource, cancel, complete, create, ExchangeRepositoryImpl, fetch, fetchConfirmation (+8 more)

### Community 298 - "app_logger.dart"
Cohesion: 0.33
Nodes (5): dart:developer, AppLogger, error, info, warning

### Community 299 - "penukaran_hari_ini_card_test.dart"
Cohesion: 0.12
Nodes (15): build, PenukaranHariIniCard, exchangeTypesProvider, bodyWidth, _cardPadding, main, pump, _pumpCardAtBodyHeight (+7 more)

### Community 300 - "operator_lookup.dart"
Cohesion: 0.15
Nodes (14): RfidRepositoryImpl, employeeId, employeeNumber, error, factoryId, lookup, name, operator (+6 more)

### Community 301 - "confirmation-monitoring-page.tsx"
Cohesion: 0.26
Nodes (11): TabsContent, TabsList, TabsTrigger, CONFIRMATION_STATUSES, ConfirmationStatus, confirmationColumns, ConfirmationMonitoringScreen(), ConfirmationStatusTabs() (+3 more)

### Community 302 - "AppDelegate"
Cohesion: 0.16
Nodes (10): Any, FlutterAppDelegate, FlutterImplicitEngineBridge, FlutterImplicitEngineDelegate, AppDelegate, Bool, AppDelegate, Bool (+2 more)

### Community 303 - "ios/RunnerTests/RunnerTests.swift"
Cohesion: 0.18
Nodes (8): Flutter, FlutterSceneDelegate, SceneDelegate, RunnerTests, RunnerTests, UIKit, XCTest, XCTestCase

### Community 304 - "count-session-page.test.tsx"
Cohesion: 0.15
Nodes (11): FACTORY, LOCATION, makePaged(), makeSession(), mockedCreateSession, mockedFetchAllUsers, mockedFetchCurrentUser, mockedFetchMasterData (+3 more)

### Community 305 - "ForgotPasswordDto"
Cohesion: 0.50
Nodes (4): ForgotPasswordDto, ApiProperty, MaxLength, IsEmail

### Community 306 - "List"
Cohesion: 0.18
Nodes (11): List, AppError, delays, immediate, RetryPolicy, error, items, trolleyStock (+3 more)

### Community 316 - "i0.VersionedTable"
Cohesion: 0.20
Nodes (10): i0.VersionedTable, Shape0, Shape1, Shape2, Shape3, Shape4, Shape5, Shape6 (+2 more)

### Community 317 - "exchange_flow_step.dart"
Cohesion: 0.20
Nodes (9): ExchangeFlowStep, ExchangeProgressStage, ExchangeStepMapper, isTerminal, stageOf, stagesFor, stepFor, stuck (+1 more)

### Community 318 - "history_repository.dart"
Cohesion: 0.28
Nodes (8): HistoryRepositoryImpl, count, error, HistoryRepository, todayExchangeCount, TodayExchangeCountFailed, TodayExchangeCountLoaded, TodayExchangeCountOutcome

### Community 319 - "first_launch_flow_test.dart"
Cohesion: 0.36
Nodes (6): main, main, package:integration_test/integration_test.dart, ../test/helpers/fake_backend.dart, ../test/helpers/fixtures.dart, ../test/helpers/test_app.dart

### Community 320 - "app.dart"
Cohesion: 0.32
Nodes (7): build, NexaApp, routerProvider, heartbeatControllerProvider, package:nexa_mobile/app/router.dart, package:nexa_mobile/app/theme/app_theme.dart, package:nexa_mobile/features/device_context/presentation/heartbeat_controller.dart

### Community 321 - "MessageHandler"
Cohesion: 0.33
Nodes (6): HWND, LPARAM, LRESULT, UINT, WPARAM, MessageHandler

## Knowledge Gaps
- **2864 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+2859 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **110 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `_Body` connect `RequirePermissions` to `ExchangeController`, `AuthController`, `ConfirmationService`, `user.controller.ts`, `.upload`, `.enroll`, `AuthenticatedUser`, `mobile-response.dto.ts`, `inventory-response.dto.ts`, `package:flutter/material.dart`, `router.dart`, `CreateAdjustmentDto`, `DeviceService`?**
  _High betweenness centrality (0.214) - this node is a cross-community bridge._
- **Why does `AuthenticatedUser` connect `AuthenticatedUser` to `ExchangeController`, `RequirePermissions`, `ConfirmationService`, `PrismaService`, `AuditQueryDto`, `identity.module.ts`, `sync-commands.ts`, `CreateAdjustmentDto`, `AuthController`, `user.controller.ts`, `.upload`, `exchange.service.ts`, `audit-log.interceptor.spec.ts`, `approval.module.ts`, `inventory-response.dto.ts`, `sync.service.ts`, `authenticated-user.interface.ts`, `inventory.service.ts`, `DeviceService`, `.enroll`, `sync.service.spec.ts`, `ExchangeWithContext`, `master-data.controller.ts`, `mobile-response.dto.ts`, `.findAll`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `RequirePermissions()` connect `RequirePermissions` to `ExchangeController`, `ConfirmationService`, `user.controller.ts`, `.upload`, `.enroll`, `master-data.controller.ts`, `AuditQueryDto`, `AuthenticatedUser`, `mobile-response.dto.ts`, `inventory-response.dto.ts`, `.findAll`, `authenticated-user.interface.ts`, `CreateAdjustmentDto`, `DeviceService`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _2864 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `RequirePermissions` be split into smaller, more focused modules?**
  _Cohesion score 0.07538549400342662 - nodes in this community are weakly interconnected._
- **Should `ConfirmationService` be split into smaller, more focused modules?**
  _Cohesion score 0.06778476589797344 - nodes in this community are weakly interconnected._
- **Should `app_database.dart` be split into smaller, more focused modules?**
  _Cohesion score 0.013888888888888888 - nodes in this community are weakly interconnected._