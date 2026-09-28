# Graph Report - nexa_mobile  (2026-09-28)

## Corpus Check
- 875 files · ~497,800 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 8283 nodes · 17367 edges · 358 communities (246 shown, 112 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 243 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `36865748`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- exchange.controller.ts
- RequirePermissions
- confirmation.service.ts
- app_database.dart
- PrismaService
- receiving-page.tsx
- inventory/api/types.ts
- app_database.steps.dart
- RequireAuth
- renderWithQueryClient
- core/master-data/index.ts
- exchange-transactions-page.test.tsx
- schema_v1.dart
- auth/data-source.ts
- schema_v2.dart
- auth.ts
- auth.controller.ts
- schema_v4.dart
- dependencies
- devDependencies
- schema_v3.dart
- react
- identity.module.ts
- forgot-password.e2e-spec.ts
- app.module.ts
- RetentionService
- audit-log-page.tsx
- GeneratedPluginRegistrant.swift
- Database ERD & Physical Schema
- devDependencies
- .uploadAdjustmentEvidence
- notification.service.ts
- components.json
- exchange.module.ts
- roles.e2e-spec.ts
- AuthenticatedUser
- compilerOptions
- evidence.controller.ts
- System Architecture Document
- scripts
- http-exception.filter.ts
- exchange.service.ts
- Claude Code Backend Setup Prompting Guide
- jest
- audit.decorator.ts
- needle_type_picker.dart
- employee.service.ts
- Backend CLAUDE.md
- scope.guard.ts
- test_app.dart
- inventory-history.service.ts
- sync_remote_data_source.dart
- device_validation_controller.dart
- token_refresher.dart
- api_client.dart
- compilerOptions
- sync_repositories.dart
- history_entry.dart
- authenticated-user.interface.ts
- NumberSequenceService
- providers.tsx
- Backend ARCHITECTURE.md
- sync.service.spec.ts
- DeviceService
- count-session-page.tsx
- my_application.cc
- transfer-page.test.tsx
- dependencies
- WebApps Dev Subagent Spec
- count-session-detail-page.test.tsx
- rfid_scan_panel.dart
- Backend/package.json
- HealthService
- RfidCardService
- WhatsApp Integration Specification
- package:flutter_test/flutter_test.dart
- sync.service.ts
- assertFactoryScope
- POST /mobile/sync (client)
- device_remote_data_source.dart
- exchange_flow_controller.dart
- scripts
- exclude
- ADR-0001 Dashboard v1 Scoped to Existing Contract
- extends
- inventory-adjustment.spec.ts
- app_strings.dart
- device_context_providers.dart
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
- storage-data-source.ts
- exchange_repository.dart
- users-screen-write.test.tsx
- user-write-queries.ts
- master-data.controller.ts
- confirmation-monitoring-page.tsx
- exchange_flow_state.dart
- sync_controller.dart
- app_error.dart
- tables.dart
- cn
- adjustment-page.test.tsx
- return-page.test.tsx
- master_data_refresher_test.dart
- evidence_views.dart
- sync_engine.dart
- ts-node
- fake_backend.dart
- package:flutter_riverpod/flutter_riverpod.dart
- exchange_steps.dart
- device.service.ts
- rfid-screen.test.tsx
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
- history_detail_screen.dart
- authMeEnvelope
- role-detail-screen.test.tsx
- evidence_repository_impl.dart
- getApiErrorMessage
- win32_window.cpp
- proxy-config.test.ts
- client.ts
- design_tokens.dart
- sync_engine_test.dart
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
- _Body
- administration-roles.spec.ts
- auth_repository_impl.dart
- role.controller.ts
- app_config.dart
- Admin-panel CRUD audit: five contract-ready write gaps close next, three stay blocked on undecided policy, three are recorded but not queued
- administration-devices.spec.ts
- nest-cli.json
- wWinMain
- sync_command.dart
- bootstrap_repository_test.dart
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
- audit.controller.ts
- CLAUDE.md — nexa_mobile (Troli App)
- master_data.dart
- Flutter project rules — nexa_mobile
- inventory_remote_data_source.dart
- mobile-dev.md
- secure_store.dart
- RegisterPlugins
- routes.dart
- FlutterActivity
- nexa_mobile — NEXA Troli (Android tablet)
- inventory.service.ts
- LaunchImage.imageset/README.md
- dashboard/api/queries.ts
- Table
- exchange_flow_test.dart
- sync_result.dart
- fake_exchange_server.dart
- 22 — Mobile Folder Structure (nexa_mobile)
- offline_sync_flow_test.dart
- AppError
- fixtures.dart
- exchange_remote_data_source.dart
- active_exchange_store_impl.dart
- app_logger.dart
- package:flutter/material.dart
- operator_lookup.dart
- network_providers.dart
- AppDelegate
- ios/RunnerTests/RunnerTests.swift
- SyncCommandDto
- auth/queries.ts
- package:nexa_mobile/core/network/network_providers.dart
- inventory/api/queries.ts
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
- @nestjs/swagger
- sync_status.dart
- package:nexa_mobile/core/connectivity/connectivity.dart
- FakeRefreshTokenRepository
- i0.VersionedSchema
- package:nexa_mobile/features/exchange/domain/exchange.dart
- flow_driver.dart
- auth_user.dart
- bool get
- exchange_sync_view.dart
- inventory/index.ts
- exchange_projection.dart
- auth/index.ts
- storage-screen.test.tsx
- package:drift/drift.dart
- exchange/[id]/page.tsx
- history_screen_test.dart
- app-shell.tsx
- confirmation/[id]/page.tsx
- auth_remote_data_source.dart
- List
- penukaran_hari_ini_card_test.dart
- dashboard/page.tsx
- eslint
- history_repository.dart
- @DataClassName
- connectivity.dart
- user.service.ts
- devices-screen.test.tsx
- main.ts
- ResponseFormatInterceptor
- RfidCardQueryDto
- confirmation-monitoring-page.test.tsx
- date_time_format.dart
- catalogue-writes.spec.ts
- next-themes
- @playwright/test
- @tanstack/react-table
- qrcode.react

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

## Communities (358 total, 112 thin omitted)

### Community 0 - "exchange.controller.ts"
Cohesion: 0.14
Nodes (27): AUDIT_ACTIONS, CancelExchangeDto, CreateExchangeDto, IdentifyOperatorDto, IssueNeedleDto, ListExchangesQueryDto, RecordFragmentDto, SelectExchangeTypeDto (+19 more)

### Community 1 - "RequirePermissions"
Cohesion: 0.10
Nodes (22): Audit(), RequirePermissions(), ExchangeTypeController, FactoryController, LocationController, NeedleTypeController, StorageMappingController, TrolleyController (+14 more)

### Community 2 - "confirmation.service.ts"
Cohesion: 0.07
Nodes (38): CONFIRMATION_EXPIRY_JOB, CONFIRMATION_EXPIRY_QUEUE, ConfirmationExpiryProcessor, Processor, ConfirmationController, ApiBearerAuth, ApiOperation, ApiResponse (+30 more)

### Community 3 - "app_database.dart"
Cohesion: 0.01
Nodes (182): _, actualTableName, _alias, aliasedName, allSchemaEntities, allTables, attachedDatabase, attemptCount (+174 more)

### Community 4 - "PrismaService"
Cohesion: 0.04
Nodes (48): PrismaService, Injectable, PERMISSIONS, PNG, AuditRow, Envelope, LoginBody, MeBody (+40 more)

### Community 5 - "receiving-page.tsx"
Cohesion: 0.06
Nodes (88): Button, ButtonProps, buttonVariants, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogTitle (+80 more)

### Community 6 - "inventory/api/types.ts"
Cohesion: 0.05
Nodes (49): AdjustmentReasonCode, AdjustmentResult, BalanceItem, BalanceListFilters, CreateAdjustmentInput, CreateReceivingInput, CreateReturnInput, CreateTransferInput (+41 more)

### Community 7 - "app_database.steps.dart"
Cohesion: 0.01
Nodes (158): attemptCount, byteSize, capturedAt, category, checkedAt, clientTransactionId, closedAt, code (+150 more)

### Community 8 - "RequireAuth"
Cohesion: 0.13
Nodes (4): RequireAuth(), RfidScreen(), handleRevoke(), ExchangeTypeScreen()

### Community 9 - "renderWithQueryClient"
Cohesion: 0.04
Nodes (45): mockedFetchCurrentUser, mockReplace, mockGet, mockedFetchAllUsers, mockedFetchConfirmation, mockedFetchCurrentUser, EMPLOYEE, FACTORY (+37 more)

### Community 10 - "core/master-data/index.ts"
Cohesion: 0.05
Nodes (63): authKeys, fetchMasterData(), fetchMasterDataRow(), MasterDataQuery, displayLabel(), Lookup, masterDataKeys, useLookup() (+55 more)

### Community 11 - "exchange-transactions-page.test.tsx"
Cohesion: 0.09
Nodes (33): fetchExchangeDetail(), fetchExchangeEvidence(), fetchExchanges(), exchangeKeys, useExchangeDetail(), useExchangeEvidence(), useExchangeList(), EvidenceItem (+25 more)

### Community 12 - "schema_v1.dart"
Cohesion: 0.02
Nodes (86): class, class LocalDeviceContext extends, class LocalDeviceContextData extends, class LocalDeviceValidation extends, class LocalExchangeType extends, class LocalExchangeTypeData extends, class LocalMasterDataVersion extends, class LocalMasterDataVersionData extends (+78 more)

### Community 13 - "auth/data-source.ts"
Cohesion: 0.14
Nodes (17): forgotPassword(), resetPassword(), CurrentUser, ForgotPasswordRequest, ForgotPasswordResponse, LoginRequest, LoginResponse, LoginUser (+9 more)

### Community 14 - "schema_v2.dart"
Cohesion: 0.02
Nodes (88): class LocalDeviceValidationData extends, class LocalExchange extends, class LocalExchangeData extends, class LocalExchangeEvidence extends, class LocalExchangeEvidenceData extends, class LocalNeedleTypeData extends, class LocalUserSession extends, GeneratedColumn (+80 more)

### Community 15 - "auth.ts"
Cohesion: 0.13
Nodes (11): Captured, envelope(), makeEntry(), mockAuditApi(), USERS, mockLoggedOut(), unauthorized(), CapturedRequest (+3 more)

### Community 16 - "auth.controller.ts"
Cohesion: 0.08
Nodes (38): Public(), AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser (+30 more)

### Community 17 - "schema_v4.dart"
Cohesion: 0.02
Nodes (100): class LocalTrolleyStock extends, class LocalTrolleyStockData extends, LocalTrolleyStock, actualTableName, _alias, aliasedName, allSchemaEntities, allTables (+92 more)

### Community 18 - "dependencies"
Cohesion: 0.04
Nodes (47): dependencies, bcryptjs, bullmq, class-transformer, class-validator, dotenv, ioredis, joi (+39 more)

### Community 19 - "devDependencies"
Cohesion: 0.07
Nodes (29): eslint-config-next, jsdom, postcss, tailwindcss, tailwindcss-animate, @testing-library/jest-dom, @testing-library/user-event, @types/react (+21 more)

### Community 20 - "schema_v3.dart"
Cohesion: 0.02
Nodes (99): class LocalSyncQueue extends, class LocalSyncQueueData extends, class LocalSyncState extends, class LocalSyncStateData extends, LocalSyncQueue, actualTableName, _alias, aliasedName (+91 more)

### Community 21 - "react"
Cohesion: 0.07
Nodes (67): react, react, fetchCurrentUser(), useCurrentUser(), useMasterData(), Factory, FactoryScopeState, useFactoryScopeStore (+59 more)

### Community 22 - "identity.module.ts"
Cohesion: 0.05
Nodes (23): JwtPayload, PasswordResetTokenRepository, Injectable, RefreshTokenRepository, Injectable, Injectable, UserRepository, AuthService (+15 more)

### Community 23 - "forgot-password.e2e-spec.ts"
Cohesion: 0.11
Nodes (12): EmailModule, Module, EMAIL_CLIENT, EmailMessage, EmailPort, ADR-0002, NodemailerEmailAdapter, ADR-0002 (+4 more)

### Community 24 - "app.module.ts"
Cohesion: 0.04
Nodes (37): IS_PUBLIC_KEY, REQUIRED_PERMISSIONS_KEY, JwtAuthGuard, Injectable, RbacGuard, Injectable, IdempotencyModule, Global (+29 more)

### Community 25 - "RetentionService"
Cohesion: 0.12
Nodes (12): RecordRetentionProcessor, Processor, RETENTION_QUEUE, RETENTION_SWEEP_JOB, RetentionModule, InjectQueue, Module, RetentionService (+4 more)

### Community 26 - "audit-log-page.tsx"
Cohesion: 0.15
Nodes (21): fetchAuditLogs(), auditKeys, useAuditLogs(), AUDIT_ACTIONS, AuditAction, AuditLogEntry, AuditLogFilters, DEFAULT_AUDIT_FILTERS (+13 more)

### Community 27 - "GeneratedPluginRegistrant.swift"
Cohesion: 0.12
Nodes (13): Cocoa, connectivity_plus, flutter_secure_storage_darwin, FlutterMacOS, FlutterPluginRegistry, FlutterViewController, Foundation, mobile_scanner (+5 more)

### Community 28 - "Database ERD & Physical Schema"
Cohesion: 0.12
Nodes (23): Response Envelope Interceptor Ordering, ScopeGuard / assertFactoryScope Dual Implementation, Stock Ledger Invariants (Three Layers), Audit Logging Mechanism, Idempotency-Key / client_transaction_id Mechanism, Five-Dimension Authorization Model, Adjustment (Domain Concept), Approval (Domain Concept) (+15 more)

### Community 29 - "devDependencies"
Cohesion: 0.04
Nodes (49): devDependencies, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, globals, jest, @nestjs/cli, @nestjs/schematics (+41 more)

### Community 30 - ".uploadAdjustmentEvidence"
Cohesion: 0.19
Nodes (15): InventoryController, ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags, Controller (+7 more)

### Community 31 - "notification.service.ts"
Cohesion: 0.06
Nodes (37): MetaCloudWhatsAppAdapter, MetaSendResponse, Injectable, Module, WhatsAppModule, ADR-0006, WHATSAPP_CLIENT, WhatsAppMessage (+29 more)

### Community 32 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 33 - "exchange.module.ts"
Cohesion: 0.08
Nodes (15): MinioObjectStorageAdapter, Injectable, ObjectStorageModule, Module, OBJECT_STORAGE, ObjectStoragePort, StoredObject, ExchangeModule (+7 more)

### Community 34 - "roles.e2e-spec.ts"
Cohesion: 0.12
Nodes (23): humanize(), IdentitySeedResult, ROLE_DESCRIPTIONS, seedAdminUser(), seedIdentity(), seedPermissions(), seedRoles(), MasterDataSeedResult (+15 more)

### Community 35 - "AuthenticatedUser"
Cohesion: 0.06
Nodes (48): AuthenticatedUser, FORBIDDEN, GRANT_FORBIDDEN, NOT_FOUND, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags (+40 more)

### Community 36 - "compilerOptions"
Cohesion: 0.07
Nodes (27): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, incremental (+19 more)

### Community 37 - "evidence.controller.ts"
Cohesion: 0.11
Nodes (25): EvidenceController, ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags, Controller (+17 more)

### Community 38 - "System Architecture Document"
Cohesion: 0.23
Nodes (19): ADR-003 Trolley Is an Inventory Location, ADR-005 Offline-First Android, ADR-006 WhatsApp Is the Only Notification Channel, Exchange State (Domain Concept), Fragment Status (Domain Concept), Operator Actor, PIC Actor, PRD v2.0 (+11 more)

### Community 39 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, build, db:seed, docker:down, docker:up, format, lint, prisma:deploy (+11 more)

### Community 40 - "http-exception.filter.ts"
Cohesion: 0.22
Nodes (9): ApiErrorBodyDto, DescribedError, describeError(), describeMessage(), HttpExceptionFilter, NestExceptionBody, STATUS_CODES, ErrorEnvelope (+1 more)

### Community 41 - "exchange.service.ts"
Cohesion: 0.06
Nodes (35): DomainException, ERROR_CODES, ErrorCode, DEVICE_ID_HEADER, ADR-0005, isEvidenceComplete(), missingEvidenceTypes(), requiredEvidenceTypes() (+27 more)

### Community 42 - "Claude Code Backend Setup Prompting Guide"
Cohesion: 0.17
Nodes (19): Root CLAUDE.md, Exchange State Machine (CREATED→COMPLETED), State-Based UI (ExchangeState drives actions), Catatan Penggunaan, Fase 0 — Kunci Keputusan Terbuka, Fase 10 — Modul Synchronization, Fase 11 — Kontrak API & Dokumentasi, Fase 12 — Test Menyeluruh & Docker (+11 more)

### Community 43 - "jest"
Cohesion: 0.11
Nodes (18): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, moduleNameMapper, rootDir, roots, testEnvironment (+10 more)

### Community 44 - "audit.decorator.ts"
Cohesion: 0.10
Nodes (16): AuditRecord, AuditWriter, AuditWriterModule, Global, Module, SNAPSHOT_FIELDS, Injectable, AUDIT_KEY (+8 more)

### Community 45 - "needle_type_picker.dart"
Cohesion: 0.05
Nodes (45): NeedleType, build, _CancelDialog, _CancelDialogState, choice, createState, dispose, initialReason (+37 more)

### Community 46 - "employee.service.ts"
Cohesion: 0.19
Nodes (10): PagedRows, MasterDataQueryDto, ScopedMasterDataQueryDto, StorageMappingQueryDto, ApiPropertyOptional, IsEnum, IsInt, IsOptional (+2 more)

### Community 47 - "Backend CLAUDE.md"
Cohesion: 0.12
Nodes (17): Exchange State Machine (Pure Function), Side Effects Happen After Commit, ADR-001 Modular Monolith, Backend CLAUDE.md, approval module, audit module, device module, employee module (+9 more)

### Community 48 - "scope.guard.ts"
Cohesion: 0.17
Nodes (6): FACTORY_SCOPE_KEY, LOCATION_SCOPE_KEY, ScopeSource, ScopeGuard, Injectable, picFactoryA

### Community 49 - "test_app.dart"
Cohesion: 0.06
Nodes (34): AppConfig, fake_backend.dart, fakes.dart, fixtures.dart, build, config, _ConfigErrorApp, main (+26 more)

### Community 50 - "inventory-history.service.ts"
Cohesion: 0.08
Nodes (37): InventoryHistoryController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+29 more)

### Community 51 - "sync_remote_data_source.dart"
Cohesion: 0.05
Nodes (40): _Json, ApiClient, delays, immediate, RetryPolicy, _api, exchanges, _api (+32 more)

### Community 52 - "device_validation_controller.dart"
Cohesion: 0.05
Nodes (68): appVersionProvider, serverClockProvider, connectivityStatusProvider, appConfigProvider, loginControllerProvider, build, _LoginScreenState, sessionControllerProvider (+60 more)

### Community 53 - "token_refresher.dart"
Cohesion: 0.07
Nodes (32): Future, _deviceId, _dio, error, _errorMapper, _inFlight, refresh, RefreshFailed (+24 more)

### Community 54 - "api_client.dart"
Cohesion: 0.07
Nodes (28): Dio, _categoryFor, _categoryForStatus, ErrorMapper, fromCommandError, fromDioException, fromErrorBody, fromResponse (+20 more)

### Community 55 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, @testing-library/jest-dom, **/*.tsx, vitest/globals (+20 more)

### Community 56 - "sync_repositories.dart"
Cohesion: 0.07
Nodes (26): SyncViewSourceImpl, SyncRemoteDataSource, byId, clearBackoff, commandsFor, cursor, delete, deleteFor (+18 more)

### Community 57 - "history_entry.dart"
Cohesion: 0.06
Nodes (30): ConfirmationStatus? get, DateTime get, ExchangeState? get, FragmentStatus? get, cancelledAt, canResume, clientTransactionId, completedAt (+22 more)

### Community 58 - "authenticated-user.interface.ts"
Cohesion: 0.05
Nodes (47): CurrentDevice, RequireDeviceContext(), DeviceContextGuard, Injectable, ADR-0004, DeviceContext, RequestWithContext, REQUEST_ID_HEADER (+39 more)

### Community 59 - "NumberSequenceService"
Cohesion: 0.08
Nodes (14): NumberSequenceService, PREFIXES, SEQUENCE_SCOPES, Injectable, dto, user, openSession, user (+6 more)

### Community 60 - "providers.tsx"
Cohesion: 0.21
Nodes (8): inter, jetbrainsMono, metadata, RootLayout(), Providers(), Toaster(), QueryProvider(), ThemeProvider()

### Community 61 - "Backend ARCHITECTURE.md"
Cohesion: 0.23
Nodes (12): Backend ARCHITECTURE.md, ADR-002 PostgreSQL, Backend docker-compose.yml, minio service, minio-init service, postgres service, redis service, Backend README.md (+4 more)

### Community 62 - "sync.service.spec.ts"
Cohesion: 0.10
Nodes (11): ClaimRequest, ClaimResult, IdempotencyStore, Injectable, IdempotencyKeyMiddleware, Injectable, build(), device (+3 more)

### Community 63 - "DeviceService"
Cohesion: 0.15
Nodes (14): DeviceController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+6 more)

### Community 64 - "count-session-page.tsx"
Cohesion: 0.07
Nodes (67): fetchAdjustment(), fetchAdjustments(), fetchReturn(), fetchReturns(), fetchTransfer(), fetchTransfers(), historyParams(), toPaged() (+59 more)

### Community 65 - "my_application.cc"
Cohesion: 0.09
Nodes (22): FlPluginRegistry, FlView, GApplication, gboolean, gchar, GObject, GtkApplication, MyApplicationClass (+14 more)

### Community 66 - "transfer-page.test.tsx"
Cohesion: 0.12
Nodes (13): DESTINATION_LOCATION, FACTORY, makePaged(), makeTransfer(), mockedCreateTransfer, mockedFetchAllUsers, mockedFetchBalances, mockedFetchCurrentUser (+5 more)

### Community 67 - "dependencies"
Cohesion: 0.07
Nodes (27): axios, class-variance-authority, clsx, date-fns, @hookform/resolvers, react-dom, react-hook-form, recharts (+19 more)

### Community 68 - "WebApps Dev Subagent Spec"
Cohesion: 0.24
Nodes (11): ADR-004 Backend Is the Stock Authority, WebApps Dev Subagent Spec, Flag Gaps and Conflicts Principle, 10-Stage Development Lifecycle, Reuse Before You Build Principle, WebApps Stack Decision, OpenAPI/Swagger Specification, WebApps UI/UX Specification (+3 more)

### Community 69 - "count-session-detail-page.test.tsx"
Cohesion: 0.06
Nodes (47): addCountItem(), cancelCountSession(), completeCountSession(), createCountSession(), fetchCountSession(), fetchCountSessions(), countSessionKeys, useAddCountItem() (+39 more)

### Community 70 - "rfid_scan_panel.dart"
Cohesion: 0.03
Nodes (67): Duration, HardwareKeyboard?, HardwareKeyboard get, build, now, observe, ServerClock, setOffset (+59 more)

### Community 71 - "Backend/package.json"
Cohesion: 0.20
Nodes (9): description, engines, node, license, name, prisma, seed, private (+1 more)

### Community 72 - "HealthService"
Cohesion: 0.14
Nodes (12): HealthController, ApiOperation, ApiResponse, ApiTags, Controller, Get, HealthModule, Module (+4 more)

### Community 73 - "RfidCardService"
Cohesion: 0.05
Nodes (44): EmployeeController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+36 more)

### Community 74 - "WhatsApp Integration Specification"
Cohesion: 0.31
Nodes (10): OpenAPI / Swagger Specification, Offline RFID Policy Deferral, RFID Integration Specification, WhatsApp Integration Specification, Mobile Offline Sync Specification, Mobile UI/UX Specification, WebApps UI/UX Specification, Backend Folder Structure (+2 more)

### Community 75 - "package:flutter_test/flutter_test.dart"
Cohesion: 0.04
Nodes (79): Directory, ../helpers/fake_backend.dart, ../helpers/fake_exchange_server.dart, ../../../helpers/fakes.dart, ../helpers/fixtures.dart, ../helpers/test_app.dart, HttpClientAdapter, Map (+71 more)

### Community 76 - "sync.service.ts"
Cohesion: 0.08
Nodes (36): toExchangeResponse(), EXCHANGE_CONTEXT_INCLUDE, ExchangeRepository, Injectable, BootstrapDeviceDto, BootstrapExchangeTypeDto, BootstrapFactoryDto, BootstrapNeedleTypeDto (+28 more)

### Community 77 - "assertFactoryScope"
Cohesion: 0.21
Nodes (9): assertFactoryScope(), isInFactoryScope(), ExchangeWithContext, insufficientStock(), ExchangeService, Injectable, scopedToA, scopedToBoth (+1 more)

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
Nodes (69): ExchangeRepository get, masterDataRefresherProvider, confirmationPollIntervalProvider, _apply, _attempts, cancel, _cancelBeforeCreateAnswered, changeOldNeedle (+61 more)

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
Nodes (323): accessDeniedBody, accessDeniedTitle, appName, AppStrings, appVersion, awaitingBody, awaitingOffline, awaitingQueuedBody (+315 more)

### Community 87 - "device_context_providers.dart"
Cohesion: 0.04
Nodes (56): _bootstrap, BootstrapMasterDataRefresher, _masterData, refresh, bootstrap, BootstrapRepositoryImpl, cached, _deviceStore (+48 more)

### Community 88 - "provisioning_screen.dart"
Cohesion: 0.05
Nodes (48): ConsumerState, ConsumerStatefulWidget, MobileScannerController, MobileScannerException?, LoginScreen, _barcodes, buildPreview, _controller (+40 more)

### Community 89 - "device_access_monitor.dart"
Cohesion: 0.11
Nodes (19): _controller, DeviceAccessEvent, DeviceAccessInactive, DeviceAccessMonitor, DeviceAccessNotFound, dispose, events, report (+11 more)

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

### Community 102 - "storage-data-source.ts"
Cohesion: 0.19
Nodes (16): createStorageMapping(), fetchStorageMappings(), updateStorageMapping(), storageMappingKeys, useCreateStorageMapping(), useStorageMappings(), useUpdateStorageMapping(), CreateStorageMappingInput (+8 more)

### Community 103 - "exchange_repository.dart"
Cohesion: 0.05
Nodes (38): OperatorIdentity, all, begin, byId, clientTransactionId, closedAt, CommandResult, confirmationStatus (+30 more)

### Community 104 - "users-screen-write.test.tsx"
Cohesion: 0.10
Nodes (34): fetchAllUsers(), fetchUser(), fetchUsers(), userDisplayLabel(), userKeys, UserLookup, useUserLookup(), useUsersByRole() (+26 more)

### Community 105 - "user-write-queries.ts"
Cohesion: 0.19
Nodes (19): assignFactoryScope(), assignRole(), createUser(), revokeFactoryScope(), revokeRole(), updateUser(), useAssignFactoryScope(), useAssignRole() (+11 more)

### Community 106 - "master-data.controller.ts"
Cohesion: 0.12
Nodes (41): DUPLICATE_CODE, EDIT_FORBIDDEN, FORBIDDEN, NOT_FOUND, CREATABLE_LOCATION_TYPES, CreatableLocationType, CreateFactoryDto, CreateLocationDto (+33 more)

### Community 107 - "confirmation-monitoring-page.tsx"
Cohesion: 0.12
Nodes (26): TabsContent, TabsList, TabsTrigger, approveConfirmation(), fetchConfirmation(), fetchConfirmations(), rejectConfirmation(), confirmationKeys (+18 more)

### Community 108 - "exchange_flow_state.dart"
Cohesion: 0.05
Nodes (42): EvidenceType? get, approvedNotice, availableQuantity, busy, cancelledAfterIssue, canRetry, catalog, confirmation (+34 more)

### Community 109 - "sync_controller.dart"
Cohesion: 0.07
Nodes (36): activeExchangeStoreProvider, syncCheckpointStoreProvider, syncEngineProvider, syncGatewayProvider, syncPeriodicIntervalProvider, syncQueueProvider, syncViewSourceProvider, SyncEngine (+28 more)

### Community 110 - "app_error.dart"
Cohesion: 0.04
Nodes (47): authForbidden, authInvalidToken, BackendErrorCodes, category, ClientErrorCodes, code, conflict, context (+39 more)

### Community 111 - "tables.dart"
Cohesion: 0.03
Nodes (77): BoolColumn get, DateTimeColumn get, IntColumn get, attemptCount, byteSize, capturedAt, category, checkedAt (+69 more)

### Community 112 - "cn"
Cohesion: 0.05
Nodes (83): Badge(), BadgeProps, badgeVariants, Card, CardContent, CardDescription, CardFooter, CardHeader (+75 more)

### Community 113 - "adjustment-page.test.tsx"
Cohesion: 0.11
Nodes (13): FACTORY, LOCATION, makeAdjustment(), makePaged(), mockedCreateAdjustment, mockedFetchAdjustment, mockedFetchAdjustments, mockedFetchAllUsers (+5 more)

### Community 114 - "return-page.test.tsx"
Cohesion: 0.11
Nodes (14): FACTORY, makePaged(), makeReturn(), mockedCreateReturn, mockedFetchAllUsers, mockedFetchBalances, mockedFetchCurrentUser, mockedFetchMasterData (+6 more)

### Community 115 - "master_data_refresher_test.dart"
Cohesion: 0.03
Nodes (68): apply, clear, _db, _deleteVersion, exchangeTypes, MasterDataRepositoryImpl, needleTypes, _replaceRows (+60 more)

### Community 116 - "evidence_views.dart"
Cohesion: 0.04
Nodes (52): CameraController?, buildPreview, camera, CameraPackageEvidenceCamera, capture, _controller, dispose, EvidenceCameraPreviewBuilder (+44 more)

### Community 117 - "sync_engine.dart"
Cohesion: 0.04
Nodes (54): ActiveExchangeStoreImpl, ActiveExchangeStore, EvidenceRepositoryImpl, EvidenceRepository, _db, _exchanges, load, _photos (+46 more)

### Community 119 - "fake_backend.dart"
Cohesion: 0.10
Nodes (20): dart:typed_data, body, close, error, FakeHandler, FakeResponse, fetch, _handlers (+12 more)

### Community 120 - "package:flutter_riverpod/flutter_riverpod.dart"
Cohesion: 0.03
Nodes (77): @visibleForTesting, AsyncValue, AuthRepository get, GoRouter, AppGate, appGateProvider, resolveAppGate, allowed (+69 more)

### Community 121 - "exchange_steps.dart"
Cohesion: 0.08
Nodes (43): ConsumerWidget, build, StokTroliCard, exchangeFlowControllerProvider, ExchangeFlowScreen, StockProblem, AwaitingConfirmationStep, AwaitingSyncStep (+35 more)

### Community 122 - "device.service.ts"
Cohesion: 0.13
Nodes (22): DeviceQueryDto, ApiPropertyOptional, IsEnum, IsInt, IsOptional, IsUUID, Min, DeviceActionDto (+14 more)

### Community 123 - "rfid-screen.test.tsx"
Cohesion: 0.18
Nodes (8): ACTIVE_CARD, EMPLOYEE, mockedEnrollRfidCard, mockedFetchCurrentUser, mockedFetchMasterData, mockedFetchRfidCards, mockedRevokeRfidCard, REVOKED_CARD

### Community 126 - "CountSessionController"
Cohesion: 0.17
Nodes (15): CountSessionController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+7 more)

### Community 127 - "sync_queue_impl.dart"
Cohesion: 0.08
Nodes (25): _accepted, byId, clearBackoff, commandsFor, _db, delete, deleteFor, enqueue (+17 more)

### Community 128 - "fakes.dart"
Cohesion: 0.07
Nodes (28): capture, capturedAt, CapturedPhoto, dispose, EvidenceCameraStatus, initialize, mimeType, path (+20 more)

### Community 148 - "StatelessWidget"
Cohesion: 0.02
Nodes (104): IconData, build, _compactBelow, icon, onTap, SecondaryNavCard, subtitle, title (+96 more)

### Community 149 - "1. Fase 0 — Yang Harus Selesai *Sebelum* Membuka Claude Code"
Cohesion: 0.14
Nodes (13): 0. Kenapa Dokumen Ini Ada, 1.1 Verifikasi kontrak API mobile vs backend aktual, 1.2 Kunci keputusan teknis terbuka, 1.3 `Mobile/CLAUDE.md` — root rules untuk Claude Code, 1.4 `Docs/22-Mobile-Folder-Structure.md`, 1.5 Agent routing — `Docs/agents/mobile-dev.md`, 1.6 SKILL.md yang paling relevan, 1.7 Pemecahan tiket di `.scratch/` (+5 more)

### Community 151 - "history_detail_screen.dart"
Cohesion: 0.04
Nodes (51): dart:async, build, NexaApp, routerProvider, _controller, dispose, sessionEnded, SessionEndReason (+43 more)

### Community 152 - "authMeEnvelope"
Cohesion: 0.17
Nodes (15): Captured, envelope(), FACTORY, makeUser(), mockUsersApi(), envelope(), makeItem(), mockConfirmationsApi() (+7 more)

### Community 153 - "role-detail-screen.test.tsx"
Cohesion: 0.12
Nodes (18): fetchPermissions(), fetchRoles(), roleKeys, usePermissionCatalogue(), useRole(), useRoles(), PermissionRow, RoleRow (+10 more)

### Community 154 - "evidence_repository_impl.dart"
Cohesion: 0.08
Nodes (26): dart:io, evidenceDirectoryProvider, evidenceRepositoryProvider, awaitingUpload, _db, _deleteFile, _deleteRow, discard (+18 more)

### Community 155 - "getApiErrorMessage"
Cohesion: 0.05
Nodes (56): getApiErrorMessage(), useForgotPassword(), useResetPassword(), useUpdateUser(), CreateUserForm(), onSubmit(), EditUserForm(), onSubmit() (+48 more)

### Community 156 - "win32_window.cpp"
Cohesion: 0.16
Nodes (15): wchar_t, Scale(), Create, Destroy, GetHandle, SetQuitOnClose, Win32Window::Win32Window(), WindowClassRegistrar (+7 more)

### Community 158 - "proxy-config.test.ts"
Cohesion: 0.29
Nodes (4): nextConfig, nextConfig, ORIGINAL, SimpleRewrite

### Community 159 - "client.ts"
Cohesion: 0.07
Nodes (42): API_BASE_PATH, apiClient, ApiErrorBody, ApiResponseMeta, ApiSuccessBody, DEFAULT_ERROR_MESSAGE, hasErrorEnvelope(), MUTATING_METHODS (+34 more)

### Community 160 - "design_tokens.dart"
Cohesion: 0.07
Nodes (29): @immutable, BuildContext, DesignTokens get, buttonHeight, cardShadow, copyWith, ctaBackground, ctaBackgroundDark (+21 more)

### Community 161 - "sync_engine_test.dart"
Cohesion: 0.07
Nodes (26): ActiveExchangeStore get, EvidenceRepository get, FakeExchangeServer, backend, container, ctx, db, dir (+18 more)

### Community 162 - "envelope.dart"
Cohesion: 0.09
Nodes (22): ApiErrorBody, Envelope, ApiErrorBody, code, context, data, details, Envelope (+14 more)

### Community 235 - "devices-screen.tsx"
Cohesion: 0.07
Nodes (49): activateDevice(), fetchDevices(), reassignDevice(), registerDevice(), revokeDevice(), buildDeviceQrPayload(), DEVICE_QR_TYPE, DEVICE_QR_VERSION (+41 more)

### Community 242 - "exchange.dart"
Cohesion: 0.05
Nodes (38): blocksExchange, brokenExchangeTypeCode, cancelledAt, completedAt, confirmationId, confirmationNumber, ConfirmationSnapshot, ConfirmationStatus (+30 more)

### Community 243 - "Win32Window"
Cohesion: 0.10
Nodes (26): DartProject, HWND, LPARAM, LRESULT, UINT, WPARAM, FlutterWindow, flutter_controller_ (+18 more)

### Community 244 - "provisioning_controller.dart"
Cohesion: 0.11
Nodes (21): provisioningRepositoryProvider, ProvisionedDevice, build, confirm, device, _load, notice, Provisioned (+13 more)

### Community 245 - "_Body"
Cohesion: 0.29
Nodes (15): ExchangeController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+7 more)

### Community 246 - "administration-roles.spec.ts"
Cohesion: 0.32
Nodes (7): Captured, envelope(), FACTORY, makeMember(), mockRolesApi(), PERMISSIONS, ROLES

### Community 247 - "auth_repository_impl.dart"
Cohesion: 0.05
Nodes (39): LoginResult, AuthRemoteDataSource, AuthRepositoryImpl, _local, login, logout, refreshProfile, _remote (+31 more)

### Community 248 - "role.controller.ts"
Cohesion: 0.12
Nodes (15): FORBIDDEN, RoleController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser (+7 more)

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

### Community 255 - "bootstrap_repository_test.dart"
Cohesion: 0.10
Nodes (27): DeviceStatus, blockedStatusOf, BootstrapAccessDenied, BootstrapDeviceBlocked, BootstrapDeviceNotRegistered, BootstrapOutcome, BootstrapSucceeded, BootstrapUnavailable (+19 more)

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
Cohesion: 0.12
Nodes (17): DeviceQrPayload?, deviceCode, deviceId, DeviceQrAccepted, DeviceQrParseResult, DeviceQrPayload, DeviceQrPayloadParser, DeviceQrRejected (+9 more)

### Community 265 - "UpdateCompanion"
Cohesion: 0.06
Nodes (50): LocalDeviceContextData, LocalDeviceValidationData, LocalExchangeData, LocalExchangeEvidenceData, LocalExchangeTypeData, LocalMasterDataVersionData, LocalNeedleTypeData, LocalStorageMappingData (+42 more)

### Community 266 - "package:nexa_mobile/core/error/app_error.dart"
Cohesion: 0.12
Nodes (26): _byCode, ErrorMessages, forCategory, forCode, availableQuantity, AwaitConfirmation, ExchangeCommand, ExchangeErrorRoute (+18 more)

### Community 267 - "evidence.dart"
Cohesion: 0.07
Nodes (29): allowedMimeTypes, byteSize, capturedAt, check, clientTransactionId, EvidenceFilePolicy, EvidenceFileProblem, EvidencePolicy (+21 more)

### Community 268 - "audit.controller.ts"
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

### Community 272 - "inventory_remote_data_source.dart"
Cohesion: 0.07
Nodes (25): Interceptor, AuthInterceptor, authenticated, _deviceId, DeviceIdReader, HeadersInterceptor, onRequest, RequestFlags (+17 more)

### Community 273 - "mobile-dev.md"
Cohesion: 0.29
Nodes (6): Flag gaps and conflicts — don't silently paper over them, Flutter/Dart tooling — dart-flutter plugin, Provisional vs. locked decisions — stop before building on a TBD, Reuse before you build, Source of truth — read before deciding anything, The lifecycle

### Community 274 - "secure_store.dart"
Cohesion: 0.07
Nodes (26): FlutterSecureStorage, _cached, clear, deviceCode, deviceId, _loaded, ProvisionedDeviceStore, read (+18 more)

### Community 276 - "routes.dart"
Cohesion: 0.15
Nodes (12): blocked, history, historyDetail, home, login, newExchange, provision, Routes (+4 more)

### Community 278 - "nexa_mobile — NEXA Troli (Android tablet)"
Cohesion: 0.40
Nodes (4): Environments, First launch on a tablet, nexa_mobile — NEXA Troli (Android tablet), Tests

### Community 279 - "inventory.service.ts"
Cohesion: 0.07
Nodes (42): AddCountItemDto, CreateAdjustmentDto, CreateCountSessionDto, CreateReceivingDto, CreateReturnDto, CreateTransferDto, ApiProperty, ApiPropertyOptional (+34 more)

### Community 281 - "dashboard/api/queries.ts"
Cohesion: 0.19
Nodes (19): delayed(), fetchDashboardOverview(), fetchExchangeTrend(), fetchNeedleConsumption(), fetchStockSummary(), FIXTURE_EXCHANGE_TREND, FIXTURE_NEEDLE_CONSUMPTION, FIXTURE_OVERVIEW (+11 more)

### Community 282 - "Table"
Cohesion: 0.10
Nodes (41): LocalDeviceContext, LocalDeviceValidation, LocalExchangeType, LocalMasterDataVersion, LocalNeedleType, LocalStorageMapping, LocalUserSession, LocalDeviceContext (+33 more)

### Community 283 - "exchange_flow_test.dart"
Cohesion: 0.08
Nodes (24): File, FilledButton, ensureVisible, enterText, _expectStep, finder, h, _identifyOperator (+16 more)

### Community 284 - "sync_result.dart"
Cohesion: 0.09
Nodes (22): changedExchanges, clientTransactionId, commandId, commandType, confirmationStatus, error, exchange, fromWire (+14 more)

### Community 291 - "fake_exchange_server.dart"
Cohesion: 0.05
Nodes (38): backend, _cancel, cancelReason, cardUid, clientTransactionId, _complete, completedCount, confirmationId (+30 more)

### Community 292 - "22 — Mobile Folder Structure (nexa_mobile)"
Cohesion: 0.25
Nodes (7): 1. Top level, 22 — Mobile Folder Structure (nexa_mobile), 2. `lib/app/` and `lib/core/`, 3. `lib/features/`, 4. `lib/shared/`, 5. Local database (Drift), 6. Environments

### Community 293 - "offline_sync_flow_test.dart"
Cohesion: 0.10
Nodes (20): chooseTypes, _ctx, expectStep, _finishBentOffline, h, identifyOperatorOnline, main, _offline (+12 more)

### Community 294 - "AppError"
Cohesion: 0.11
Nodes (21): CommandResult, AppError, ApiFailure, ApiResult, ApiSuccess, data, error, meta (+13 more)

### Community 295 - "fixtures.dart"
Cohesion: 0.29
Nodes (6): bootstrapData, deviceCode, deviceId, heartbeatData, loginData, meData

### Community 296 - "exchange_remote_data_source.dart"
Cohesion: 0.08
Nodes (24): ExchangeRepository, _api, confirmation, create, _date, decisions, ExchangeRemoteDataSource, exchangeToJson (+16 more)

### Community 297 - "active_exchange_store_impl.dart"
Cohesion: 0.08
Nodes (25): _, @DriftDatabase, AppDatabase, appDatabaseProvider, db, all, begin, byId (+17 more)

### Community 298 - "app_logger.dart"
Cohesion: 0.33
Nodes (5): dart:developer, AppLogger, error, info, warning

### Community 299 - "package:flutter/material.dart"
Cohesion: 0.02
Nodes (92): BorderRadius, Color, EdgeInsetsGeometry, Key, AppTheme, light, seed, build (+84 more)

### Community 300 - "operator_lookup.dart"
Cohesion: 0.18
Nodes (12): employeeId, employeeNumber, error, factoryId, lookup, name, operator, OperatorFound (+4 more)

### Community 301 - "network_providers.dart"
Cohesion: 0.08
Nodes (24): _dio, _isAuthenticated, onError, onRequest, _refresher, _tokenStore, adapter, apiClientProvider (+16 more)

### Community 302 - "AppDelegate"
Cohesion: 0.16
Nodes (10): Any, FlutterAppDelegate, FlutterImplicitEngineBridge, FlutterImplicitEngineDelegate, AppDelegate, Bool, AppDelegate, Bool (+2 more)

### Community 303 - "ios/RunnerTests/RunnerTests.swift"
Cohesion: 0.22
Nodes (7): Flutter, FlutterSceneDelegate, SceneDelegate, RunnerTests, UIKit, XCTest, XCTestCase

### Community 304 - "SyncCommandDto"
Cohesion: 0.12
Nodes (23): BootstrapQueryDto, SyncCommandDto, SyncRequestDto, ApiProperty, ApiPropertyOptional, ArrayMaxSize, IsArray, IsIn (+15 more)

### Community 305 - "auth/queries.ts"
Cohesion: 0.16
Nodes (19): refreshAccessToken(), login(), logout(), useLogin(), useLogout(), SessionProvider(), bootstrap(), SessionBootstrapState (+11 more)

### Community 306 - "package:nexa_mobile/core/network/network_providers.dart"
Cohesion: 0.04
Nodes (49): _inventoryRemoteProvider, cachedTrolleyStock, InventoryStockRepositoryImpl, _local, _mapItems, _masterData, _remote, trolleyStock (+41 more)

### Community 307 - "inventory/api/queries.ts"
Cohesion: 0.11
Nodes (22): createAdjustment(), createReceiving(), createReturn(), createTransfer(), fetchBalances(), fetchMovements(), fetchTrolleyStock(), inventoryKeys (+14 more)

### Community 309 - "history_detail_controller.dart"
Cohesion: 0.11
Nodes (22): ConfirmationStatus?, exchangeRepositoryProvider, HistoryEntry, confirmation, DetailEvidence, entry, error, evidence (+14 more)

### Community 316 - "i0.VersionedTable"
Cohesion: 0.14
Nodes (14): i0.VersionedTable, Shape0, Shape1, Shape10, Shape11, Shape12, Shape2, Shape3 (+6 more)

### Community 317 - "history_filter.dart"
Cohesion: 0.08
Nodes (23): int get, contains, copyWith, end, exchangeTypeId, first, from, hashCode (+15 more)

### Community 318 - "history_controller.dart"
Cohesion: 0.03
Nodes (63): exchangeType, exchangeTypes, HistoryCatalog, _historyRemoteProvider, historyRepositoryProvider, masterData, needle, needleTypes (+55 more)

### Community 319 - "@nestjs/swagger"
Cohesion: 0.08
Nodes (43): CurrentUser, Paginated(), PAGINATED_KEY, ApiErrorDto, ApiSuccessDto, PaginatedPayload, ResponseMetaDto, ApiProperty (+35 more)

### Community 320 - "sync_status.dart"
Cohesion: 0.04
Nodes (51): LocalSyncState, DeviceContextSnapshot, build, HomeScreen, riwayatSubtitle, _StackedLayout, sync, _TabletLayout (+43 more)

### Community 321 - "package:nexa_mobile/core/connectivity/connectivity.dart"
Cohesion: 0.11
Nodes (19): AsyncNotifier, main, tap, main, main, trolleyStockRepositoryProvider, build, refresh (+11 more)

### Community 323 - "i0.VersionedSchema"
Cohesion: 0.50
Nodes (4): i0.VersionedSchema, Schema2, Schema3, Schema4

### Community 324 - "package:nexa_mobile/features/exchange/domain/exchange.dart"
Cohesion: 0.09
Nodes (20): ExchangeState?, build, exchangeStateLabel, exchangeStateStyle, ExchangeStateText, state, tokens, main (+12 more)

### Community 325 - "flow_driver.dart"
Cohesion: 0.12
Nodes (16): fake_exchange_server.dart, chooseTypes, ensureVisible, enterText, expectStep, finder, identifyOperatorOnline, settle (+8 more)

### Community 326 - "auth_user.dart"
Cohesion: 0.10
Nodes (19): canReprovisionDevice, deviceManage, factoryIds, hasPermission, id, locationIds, mobileOperate, name (+11 more)

### Community 327 - "bool get"
Cohesion: 0.07
Nodes (26): bool get, complete,

  
  
  awaitingSync,

  
  done,

  
  cancelled,, ExchangeFlowStep, ExchangeProgressStage, ExchangeStepMapper, isTerminal, stageOf, stagesFor (+18 more)

### Community 328 - "exchange_sync_view.dart"
Cohesion: 0.08
Nodes (23): DateTime, Iterable, build, CachedContextBanner, cachedSince, _hhmm, clientTransactionId, closed (+15 more)

### Community 329 - "inventory/index.ts"
Cohesion: 0.20
Nodes (3): CountSessionDetailScreen(), ReturnScreen(), TransferScreen()

### Community 330 - "exchange_projection.dart"
Cohesion: 0.15
Nodes (12): ExchangeSnapshot, closure, evidencePending, exchange, ExchangeProjection, fragmentPending, isPending, issuePending (+4 more)

### Community 331 - "auth/index.ts"
Cohesion: 0.27
Nodes (3): ForgotPasswordScreen(), LoginScreen(), ResetPasswordScreen()

### Community 332 - "storage-screen.test.tsx"
Cohesion: 0.15
Nodes (9): EXCHANGE_TYPE, FACTORY, MAPPING, mockedCreateStorageMapping, mockedFetchCurrentUser, mockedFetchMasterData, mockedFetchStorageMappings, STORAGE_LOCATION (+1 more)

### Community 333 - "package:drift/drift.dart"
Cohesion: 0.10
Nodes (19): generated/schema.dart, generated/schema_v1.dart, generated/schema_v2.dart, generated/schema_v3.dart, generated/schema_v4.dart, databaseForVersion, GeneratedHelper, versions (+11 more)

### Community 335 - "history_screen_test.dart"
Cohesion: 0.04
Nodes (51): await, dart:convert, ../helpers/flow_driver.dart, _canonical, _fingerprint, IdempotencyAttempts, isOpen, keyFor (+43 more)

### Community 336 - "app-shell.tsx"
Cohesion: 0.14
Nodes (3): RoleDetailScreen(), RolesScreen(), AppShell()

### Community 338 - "auth_remote_data_source.dart"
Cohesion: 0.10
Nodes (19): accessToken, _api, expiresInSeconds, factoryIds, fromJson, id, locationIds, login (+11 more)

### Community 339 - "List"
Cohesion: 0.12
Nodes (16): List, HistoryFilter, AwaitingEvidenceCount, filter, local, locals, main, merge (+8 more)

### Community 340 - "penukaran_hari_ini_card_test.dart"
Cohesion: 0.12
Nodes (15): build, PenukaranHariIniCard, exchangeTypesProvider, bodyWidth, _cardPadding, main, pump, _pumpCardAtBodyHeight (+7 more)

### Community 343 - "history_repository.dart"
Cohesion: 0.19
Nodes (13): count, error, HistoryPageFailed, HistoryPageLoaded, HistoryPageOutcome, page, rows, todayExchangeCount (+5 more)

### Community 344 - "@DataClassName"
Cohesion: 0.15
Nodes (13): @DataClassName, LocalDeviceContext, LocalDeviceValidation, LocalExchange, LocalExchangeEvidence, LocalExchangeType, LocalMasterDataVersion, LocalNeedleType (+5 more)

### Community 345 - "connectivity.dart"
Cohesion: 0.17
Nodes (12): Connectivity, changes, _connectivity, ConnectivityPlusSource, ConnectivitySource, connectivitySourceProvider, ConnectivityStatus, current (+4 more)

### Community 346 - "user.service.ts"
Cohesion: 0.20
Nodes (6): PASSWORD_HASH_ROUNDS, BY_USERNAME, PagedRows, USER_INCLUDE, caller, target

### Community 347 - "devices-screen.test.tsx"
Cohesion: 0.28
Nodes (7): makeDevice(), makePaged(), mockedFetchCurrentUser, mockedFetchDevices, mockedFetchMasterData, openDetail(), qrValues

### Community 348 - "main.ts"
Cohesion: 0.32
Nodes (5): AppModule, Module, ALLOWED_HEADERS, configureApp(), bootstrap()

### Community 349 - "ResponseFormatInterceptor"
Cohesion: 0.25
Nodes (3): ResponseFormatInterceptor, Injectable, Envelope

### Community 350 - "RfidCardQueryDto"
Cohesion: 0.25
Nodes (7): RfidCardQueryDto, ApiPropertyOptional, IsEnum, IsInt, IsOptional, IsUUID, Min

### Community 351 - "confirmation-monitoring-page.test.tsx"
Cohesion: 0.29
Nodes (7): ConfirmationListItem, PagedConfirmations, makeItem(), makePaged(), mockedFetchAllUsers, mockedFetchConfirmations, mockedFetchCurrentUser

### Community 352 - "date_time_format.dart"
Cohesion: 0.29
Nodes (6): formatDate, formatDateTime, formatShortDate, formatTime, l, _two

### Community 353 - "catalogue-writes.spec.ts"
Cohesion: 0.50
Nodes (3): build(), user, withLocations()

## Knowledge Gaps
- **3892 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+3887 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **112 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `_Body` connect `_Body` to `RequirePermissions`, `confirmation.service.ts`, `AuthenticatedUser`, `evidence.controller.ts`, `RfidCardService`, `auth.controller.ts`, `StatelessWidget`, `.uploadAdjustmentEvidence`, `package:flutter_riverpod/flutter_riverpod.dart`, `authenticated-user.interface.ts`, `CountSessionController`, `DeviceService`?**
  _High betweenness centrality (0.218) - this node is a cross-community bridge._
- **Why does `AuthenticatedUser` connect `AuthenticatedUser` to `exchange.controller.ts`, `RequirePermissions`, `confirmation.service.ts`, `PrismaService`, `audit.controller.ts`, `auth.controller.ts`, `identity.module.ts`, `inventory.service.ts`, `app.module.ts`, `.uploadAdjustmentEvidence`, `notification.service.ts`, `exchange.module.ts`, `roles.e2e-spec.ts`, `evidence.controller.ts`, `exchange.service.ts`, `audit.decorator.ts`, `employee.service.ts`, `scope.guard.ts`, `inventory-history.service.ts`, `authenticated-user.interface.ts`, `NumberSequenceService`, `sync.service.spec.ts`, `DeviceService`, `@nestjs/swagger`, `RfidCardService`, `sync.service.ts`, `assertFactoryScope`, `user.service.ts`, `catalogue-writes.spec.ts`, `master-data.controller.ts`, `_Body`, `role.controller.ts`, `device.service.ts`, `CountSessionController`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `RequirePermissions()` connect `RequirePermissions` to `exchange.controller.ts`, `role.controller.ts`, `confirmation.service.ts`, `AuthenticatedUser`, `evidence.controller.ts`, `RfidCardService`, `master-data.controller.ts`, `audit.controller.ts`, `inventory-history.service.ts`, `_Body`, `.uploadAdjustmentEvidence`, `app.module.ts`, `authenticated-user.interface.ts`, `DeviceService`, `CountSessionController`, `@nestjs/swagger`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _3892 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `exchange.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14193548387096774 - nodes in this community are weakly interconnected._
- **Should `RequirePermissions` be split into smaller, more focused modules?**
  _Cohesion score 0.0975609756097561 - nodes in this community are weakly interconnected._
- **Should `confirmation.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06610169491525424 - nodes in this community are weakly interconnected._