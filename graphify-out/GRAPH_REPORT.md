# Graph Report - nexa_mobile  (2026-09-24)

## Corpus Check
- 751 files · ~372,288 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 5484 nodes · 12962 edges · 316 communities (203 shown, 113 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 243 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a7043c2e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- RequirePermissions
- master-data.controller.ts
- .approve
- app_database.dart
- PERMISSIONS
- adjustment-form-dialog.tsx
- inventory/api/types.ts
- confirmation-panel.tsx
- app-shell.tsx
- renderWithQueryClient
- core/master-data/index.ts
- exchange-transactions-page.test.tsx
- PrismaService
- auth/data-source.ts
- cn
- auth.ts
- auth-response.dto.ts
- useCurrentUser
- dependencies
- devDependencies
- getApiErrorMessage
- client.ts
- TokenService
- email.port.ts
- app.module.ts
- RetentionService
- audit-log-page.test.tsx
- GeneratedPluginRegistrant.swift
- Database ERD & Physical Schema
- devDependencies
- .uploadAdjustmentEvidence
- notification.templates.ts
- components.json
- AuthController
- constants/permissions.ts
- Audit
- compilerOptions
- .upload
- System Architecture Document
- scripts
- http-exception.filter.ts
- exchange.service.ts
- Claude Code Backend Setup Prompting Guide
- jest
- audit-log.interceptor.spec.ts
- identity.module.ts
- ObjectStoragePort
- Backend CLAUDE.md
- scope.guard.ts
- auth.service.ts
- inventory.controller.ts
- ListMovementsQueryDto
- device_validation_controller.dart
- whatsapp.port.ts
- token_refresher.dart
- compilerOptions
- sync.service.ts
- NotificationService
- authenticated-user.interface.ts
- inventory.service.ts
- providers.tsx
- Backend ARCHITECTURE.md
- notification.service.ts
- DeviceService
- count-session-detail-page.tsx
- my_application.cc
- transfer-page.test.tsx
- dependencies
- WebApps Dev Subagent Spec
- count-session-page.test.tsx
- status-badge.tsx
- Backend/package.json
- HealthService
- RfidCardService
- WhatsApp Integration Specification
- bootstrap_repository_test.dart
- IdempotencyStore
- employee.service.ts
- POST /mobile/sync (client)
- device_remote_data_source.dart
- inventory/api/queries.ts
- scripts
- exclude
- ADR-0001 Dashboard v1 Scoped to Existing Contract
- extends
- inventory-adjustment.spec.ts
- app_strings.dart
- bootstrap_repository_impl.dart
- test_app.dart
- provisioning_screen.dart
- integrations/ Adapter Isolation Pattern
- AuthenticatedUser
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
- CountSessionController
- users/index.ts
- user-write-queries.ts
- confirmation.service.ts
- confirmation-monitoring-page.test.tsx
- trolley-stock-dialog.tsx
- .sync
- app_error.dart
- tables.dart
- dashboard/api/queries.ts
- adjustment-page.test.tsx
- return-page.test.tsx
- master_data_versions.dart
- needle-type-queries.ts
- SyncCommandDto
- ts-node
- fake_backend.dart
- router.dart
- rfid-card.service.ts
- exchange-trend-chart.tsx
- count-session-detail-page.test.tsx
- database.config.ts
- setup-env.ts
- auth_remote_data_source.dart
- auth_repository_impl.dart
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
- dart:async
- MOCK_SESSION_USER
- role-detail-screen.test.tsx
- users-screen-write.test.tsx
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
- sync.service.spec.ts
- FlutterWindow
- provisioning_controller.dart
- mobile-response.dto.ts
- administration-roles.spec.ts
- auth_repository.dart
- .findAll
- app_config.dart
- Admin-panel CRUD audit: five contract-ready write gaps close next, three stay blocked on undecided policy, three are recorded but not queued
- administration-devices.spec.ts
- nest-cli.json
- wWinMain
- audit.service.spec.ts
- Win32Window
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
- useSessionBootstrapStore
- ListConfirmationsQueryDto
- auth_user.dart
- CLAUDE.md — nexa_mobile (Troli App)
- master_data.dart
- Flutter project rules — nexa_mobile
- @hookform/resolvers
- mobile-dev.md
- secure_store.dart
- RegisterPlugins
- routes.dart
- FlutterActivity
- nexa_mobile — NEXA Troli (Android tablet)
- inventory/index.ts
- LaunchImage.imageset/README.md
- auth/index.ts
- Table
- mobile.e2e-spec.ts
- main.ts
- rbac.guard.spec.ts
- 22 — Mobile Folder Structure (nexa_mobile)
- audit/store.ts
- public.decorator.ts
- fixtures.dart
- ResetPasswordDto
- inventory-writes.e2e-spec.ts
- app_logger.dart
- confirmation/[id]/page.tsx
- exchange/[id]/page.tsx
- ApprovalModule
- auth.e2e-spec.ts
- confirmation.service.spec.ts
- catalogue-writes.spec.ts
- ForgotPasswordDto
- dashboard/page.tsx
- eslint-config-next
- radix-ui
- sonner
- tailwind-merge
- @testing-library/react
- vitest
- zustand
- String?
- Uuid

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

## Communities (316 total, 113 thin omitted)

### Community 0 - "RequirePermissions"
Cohesion: 0.13
Nodes (39): RequirePermissions(), ExchangeController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+31 more)

### Community 1 - "master-data.controller.ts"
Cohesion: 0.05
Nodes (76): EmployeeResponseDto, ApiProperty, ApiPropertyOptional, DUPLICATE_CODE, EDIT_FORBIDDEN, ExchangeTypeController, FactoryController, FORBIDDEN (+68 more)

### Community 2 - ".approve"
Cohesion: 0.16
Nodes (18): ConfirmationController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+10 more)

### Community 3 - "app_database.dart"
Cohesion: 0.02
Nodes (115): _, actualTableName, _alias, aliasedName, allSchemaEntities, allTables, attachedDatabase, category (+107 more)

### Community 4 - "PERMISSIONS"
Cohesion: 0.07
Nodes (24): PERMISSIONS, PNG, AuditRow, Envelope, ExchangeBody, PNG, Envelope, Row (+16 more)

### Community 5 - "adjustment-form-dialog.tsx"
Cohesion: 0.06
Nodes (87): Button, ButtonProps, buttonVariants, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogTitle (+79 more)

### Community 6 - "inventory/api/types.ts"
Cohesion: 0.05
Nodes (50): AdjustmentReasonCode, AdjustmentResult, BalanceItem, BalanceListFilters, CreateAdjustmentInput, CreateReceivingInput, CreateReturnInput, CreateTransferInput (+42 more)

### Community 7 - "confirmation-panel.tsx"
Cohesion: 0.29
Nodes (14): Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton(), AuditTimeline(), ConfirmationPanel() (+6 more)

### Community 9 - "renderWithQueryClient"
Cohesion: 0.04
Nodes (50): SessionBootstrapState, mockedFetchCurrentUser, mockReplace, mockGet, mockedFetchAllUsers, mockedFetchConfirmation, mockedFetchCurrentUser, EMPLOYEE (+42 more)

### Community 10 - "core/master-data/index.ts"
Cohesion: 0.07
Nodes (51): fetchMasterData(), fetchMasterDataRow(), MasterDataQuery, Lookup, masterDataKeys, Employee, ExchangeType, Factory (+43 more)

### Community 11 - "exchange-transactions-page.test.tsx"
Cohesion: 0.12
Nodes (22): fetchExchangeDetail(), fetchExchangeEvidence(), fetchExchanges(), exchangeKeys, useExchangeDetail(), useExchangeEvidence(), useExchangeList(), EvidenceItem (+14 more)

### Community 12 - "PrismaService"
Cohesion: 0.05
Nodes (25): PrismaModule, Global, Module, PrismaService, Injectable, NumberSequenceService, PREFIXES, SEQUENCE_SCOPES (+17 more)

### Community 13 - "auth/data-source.ts"
Cohesion: 0.11
Nodes (26): fetchCurrentUser(), forgotPassword(), login(), logout(), resetPassword(), authKeys, useForgotPassword(), useLogin() (+18 more)

### Community 14 - "cn"
Cohesion: 0.09
Nodes (28): CardFooter, DialogOverlay, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator (+20 more)

### Community 15 - "auth.ts"
Cohesion: 0.13
Nodes (17): Captured, envelope(), FACTORY, makeUser(), mockUsersApi(), Captured, envelope(), makeEntry() (+9 more)

### Community 16 - "auth-response.dto.ts"
Cohesion: 0.60
Nodes (5): LoginResponseDto, LoginUserDto, MeResponseDto, TokenPairDto, ApiProperty

### Community 17 - "useCurrentUser"
Cohesion: 0.42
Nodes (8): useCurrentUser(), hasAllPermissions(), hasAnyPermission(), hasPermission(), PermissionHolder, useAllPermissions(), useAnyPermission(), Sidebar()

### Community 18 - "dependencies"
Cohesion: 0.04
Nodes (47): dependencies, bcryptjs, bullmq, class-transformer, class-validator, dotenv, ioredis, joi (+39 more)

### Community 19 - "devDependencies"
Cohesion: 0.07
Nodes (29): jsdom, @playwright/test, postcss, tailwindcss, tailwindcss-animate, @testing-library/jest-dom, @testing-library/user-event, @types/react (+21 more)

### Community 20 - "getApiErrorMessage"
Cohesion: 0.06
Nodes (63): react, react, getApiErrorMessage(), hasErrorEnvelope(), useMasterData(), handleConfirm(), PermissionCatalogueCard(), CreateUserForm() (+55 more)

### Community 21 - "client.ts"
Cohesion: 0.07
Nodes (72): API_BASE_PATH, ApiErrorBody, ApiResponseMeta, MUTATING_METHODS, displayLabel(), Factory, FactoryScopeState, useFactoryScopeStore (+64 more)

### Community 22 - "TokenService"
Cohesion: 0.09
Nodes (8): RefreshTokenRepository, Injectable, TokenService, Injectable, parseDurationToSeconds(), UNIT_SECONDS, FakeRefreshTokenRepository, USER

### Community 23 - "email.port.ts"
Cohesion: 0.11
Nodes (12): EmailModule, Module, EMAIL_CLIENT, EmailMessage, EmailPort, ADR-0002, NodemailerEmailAdapter, ADR-0002 (+4 more)

### Community 24 - "app.module.ts"
Cohesion: 0.09
Nodes (24): IdempotencyModule, Global, Module, AppConfig, configuration(), ADR-0002, validationSchema, AuditModule (+16 more)

### Community 25 - "RetentionService"
Cohesion: 0.12
Nodes (12): RecordRetentionProcessor, Processor, RETENTION_QUEUE, RETENTION_SWEEP_JOB, RetentionModule, InjectQueue, Module, RetentionService (+4 more)

### Community 26 - "audit-log-page.test.tsx"
Cohesion: 0.13
Nodes (14): fetchAuditLogs(), auditKeys, useAuditLogs(), AUDIT_ACTIONS, AuditLogEntry, AuditLogFilters, PagedAuditLog, makeEntry() (+6 more)

### Community 27 - "GeneratedPluginRegistrant.swift"
Cohesion: 0.05
Nodes (30): Any, Cocoa, connectivity_plus, Flutter, flutter_secure_storage_darwin, FlutterAppDelegate, FlutterImplicitEngineBridge, FlutterImplicitEngineDelegate (+22 more)

### Community 28 - "Database ERD & Physical Schema"
Cohesion: 0.12
Nodes (23): Response Envelope Interceptor Ordering, ScopeGuard / assertFactoryScope Dual Implementation, Stock Ledger Invariants (Three Layers), Audit Logging Mechanism, Idempotency-Key / client_transaction_id Mechanism, Five-Dimension Authorization Model, Adjustment (Domain Concept), Approval (Domain Concept) (+15 more)

### Community 29 - "devDependencies"
Cohesion: 0.04
Nodes (49): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, globals, jest, @nestjs/cli (+41 more)

### Community 30 - ".uploadAdjustmentEvidence"
Cohesion: 0.18
Nodes (17): UploadedFile, InventoryController, ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags (+9 more)

### Community 31 - "notification.templates.ts"
Cohesion: 0.14
Nodes (13): STUCK_REASONS, STUCK_TEXT, StuckReason, stuckReasonText(), TEMPLATE_VARIABLES, TemplateCode, TEMPLATES, TemplateVariableError (+5 more)

### Community 32 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 33 - "AuthController"
Cohesion: 0.18
Nodes (19): Public(), AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+11 more)

### Community 34 - "constants/permissions.ts"
Cohesion: 0.13
Nodes (23): humanize(), IdentitySeedResult, ROLE_DESCRIPTIONS, seedAdminUser(), seedIdentity(), seedPermissions(), seedRoles(), MasterDataSeedResult (+15 more)

### Community 35 - "Audit"
Cohesion: 0.08
Nodes (35): Audit(), ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+27 more)

### Community 36 - "compilerOptions"
Cohesion: 0.07
Nodes (27): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, incremental (+19 more)

### Community 37 - ".upload"
Cohesion: 0.10
Nodes (25): EvidenceController, ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags, Body (+17 more)

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
Cohesion: 0.07
Nodes (30): EXCHANGE_CONTEXT_INCLUDE, ExchangeRepository, Injectable, isEvidenceComplete(), missingEvidenceTypes(), requiredEvidenceTypes(), ALLOWED_MIME_TYPES, EvidenceService (+22 more)

### Community 42 - "Claude Code Backend Setup Prompting Guide"
Cohesion: 0.17
Nodes (19): Root CLAUDE.md, Exchange State Machine (CREATED→COMPLETED), State-Based UI (ExchangeState drives actions), Catatan Penggunaan, Fase 0 — Kunci Keputusan Terbuka, Fase 10 — Modul Synchronization, Fase 11 — Kontrak API & Dokumentasi, Fase 12 — Test Menyeluruh & Docker (+11 more)

### Community 43 - "jest"
Cohesion: 0.11
Nodes (18): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, moduleNameMapper, rootDir, roots, testEnvironment (+10 more)

### Community 44 - "audit-log.interceptor.spec.ts"
Cohesion: 0.10
Nodes (16): AuditRecord, AuditWriter, AuditWriterModule, Global, Module, SNAPSHOT_FIELDS, Injectable, AUDIT_KEY (+8 more)

### Community 45 - "identity.module.ts"
Cohesion: 0.09
Nodes (15): JwtPayload, IdentityModule, Module, PasswordResetTokenRepository, Injectable, Injectable, UserRepository, PASSWORD_HASH_ROUNDS (+7 more)

### Community 46 - "ObjectStoragePort"
Cohesion: 0.16
Nodes (8): MinioObjectStorageAdapter, Injectable, ObjectStorageModule, Module, OBJECT_STORAGE, ObjectStoragePort, StoredObject, Inject

### Community 47 - "Backend CLAUDE.md"
Cohesion: 0.12
Nodes (17): Exchange State Machine (Pure Function), Side Effects Happen After Commit, ADR-001 Modular Monolith, Backend CLAUDE.md, approval module, audit module, device module, employee module (+9 more)

### Community 48 - "scope.guard.ts"
Cohesion: 0.17
Nodes (6): FACTORY_SCOPE_KEY, LOCATION_SCOPE_KEY, ScopeSource, ScopeGuard, Injectable, picFactoryA

### Community 49 - "auth.service.ts"
Cohesion: 0.13
Nodes (9): LoginDto, ApiProperty, IsNotEmpty, IsString, MaxLength, AuthService, LoginResult, Injectable (+1 more)

### Community 50 - "inventory.controller.ts"
Cohesion: 0.07
Nodes (51): InventoryHistoryController, NOT_FOUND, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser (+43 more)

### Community 51 - "ListMovementsQueryDto"
Cohesion: 0.16
Nodes (19): ListAdjustmentsQueryDto, ListBalancesQueryDto, ListCountSessionsQueryDto, ListMovementsQueryDto, ListOperationHistoryQueryDto, ApiPropertyOptional, ADR-0003, IsDate (+11 more)

### Community 52 - "device_validation_controller.dart"
Cohesion: 0.03
Nodes (98): ConsumerWidget, Duration?, AppGate, appGateProvider, resolveAppGate, appVersionProvider, info, build (+90 more)

### Community 53 - "whatsapp.port.ts"
Cohesion: 0.17
Nodes (12): MetaCloudWhatsAppAdapter, MetaSendResponse, Injectable, Module, WhatsAppModule, ADR-0006, WHATSAPP_CLIENT, WhatsAppMessage (+4 more)

### Community 54 - "token_refresher.dart"
Cohesion: 0.03
Nodes (82): Dio, Future, _categoryFor, _categoryForStatus, ErrorMapper, fromDioException, fromErrorBody, fromResponse (+74 more)

### Community 55 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, @testing-library/jest-dom, **/*.tsx, vitest/globals (+20 more)

### Community 56 - "sync.service.ts"
Cohesion: 0.10
Nodes (25): DeviceContext, toExchangeResponse(), DEVICE_REFUSED, BootstrapResponseDto, SyncResponseDto, BootstrapService, MappingWithLocation, Injectable (+17 more)

### Community 57 - "NotificationService"
Cohesion: 0.29
Nodes (3): NotificationService, Injectable, resolveTemplateVariables()

### Community 58 - "authenticated-user.interface.ts"
Cohesion: 0.03
Nodes (68): AUDIT_ACTIONS, CurrentUser, CurrentDevice, RequireDeviceContext(), Paginated(), REQUIRED_PERMISSIONS_KEY, ADR-0004, ADR-0006 (+60 more)

### Community 59 - "inventory.service.ts"
Cohesion: 0.06
Nodes (45): AddCountItemDto, CreateAdjustmentDto, CreateCountSessionDto, CreateReceivingDto, CreateReturnDto, CreateTransferDto, ApiProperty, ApiPropertyOptional (+37 more)

### Community 60 - "providers.tsx"
Cohesion: 0.21
Nodes (8): inter, jetbrainsMono, metadata, RootLayout(), Providers(), Toaster(), QueryProvider(), ThemeProvider()

### Community 61 - "Backend ARCHITECTURE.md"
Cohesion: 0.23
Nodes (12): Backend ARCHITECTURE.md, ADR-002 PostgreSQL, Backend docker-compose.yml, minio service, minio-init service, postgres service, redis service, Backend README.md (+4 more)

### Community 62 - "notification.service.ts"
Cohesion: 0.29
Nodes (6): NOTIFICATION_DISPATCH_JOB, NOTIFICATION_QUEUE, DispatchJobData, NotificationDispatchProcessor, Processor, ADR-0006

### Community 63 - "DeviceService"
Cohesion: 0.07
Nodes (40): DeviceController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+32 more)

### Community 64 - "count-session-detail-page.tsx"
Cohesion: 0.06
Nodes (71): useLookup(), PermissionCode, useCountSession(), fetchAdjustment(), fetchAdjustments(), fetchReturn(), fetchReturns(), fetchTransfer() (+63 more)

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

### Community 69 - "count-session-page.test.tsx"
Cohesion: 0.08
Nodes (35): addCountItem(), cancelCountSession(), completeCountSession(), createCountSession(), fetchCountSession(), fetchCountSessions(), countSessionKeys, useAddCountItem() (+27 more)

### Community 70 - "status-badge.tsx"
Cohesion: 0.23
Nodes (9): Badge(), BadgeProps, badgeVariants, BadgeVariant, EXCHANGE_STATE_CONFIG, STATUS_CONFIG, StatusBadge(), StatusConfig (+1 more)

### Community 71 - "Backend/package.json"
Cohesion: 0.20
Nodes (9): description, engines, node, license, name, prisma, seed, private (+1 more)

### Community 72 - "HealthService"
Cohesion: 0.14
Nodes (12): HealthController, ApiOperation, ApiResponse, ApiTags, Controller, Get, HealthModule, Module (+4 more)

### Community 73 - "RfidCardService"
Cohesion: 0.07
Nodes (34): RfidController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+26 more)

### Community 74 - "WhatsApp Integration Specification"
Cohesion: 0.31
Nodes (10): OpenAPI / Swagger Specification, Offline RFID Policy Deferral, RFID Integration Specification, WhatsApp Integration Specification, Mobile Offline Sync Specification, Mobile UI/UX Specification, WebApps UI/UX Specification, Backend Folder Structure (+2 more)

### Community 75 - "bootstrap_repository_test.dart"
Cohesion: 0.04
Nodes (73): ../helpers/fake_backend.dart, ../../../helpers/fakes.dart, ../helpers/fixtures.dart, ../helpers/test_app.dart, HttpClientAdapter, main, _byCode, ErrorMessages (+65 more)

### Community 76 - "IdempotencyStore"
Cohesion: 0.14
Nodes (5): IdempotencyStore, Injectable, IdempotencyKeyMiddleware, Injectable, messagesOf()

### Community 77 - "employee.service.ts"
Cohesion: 0.07
Nodes (29): EmployeeController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+21 more)

### Community 78 - "POST /mobile/sync (client)"
Cohesion: 0.22
Nodes (9): Master Data APIs, POST /mobile/sync, Employee Resolution via RFID, BROKEN_NEEDLE_CONFIRMATION Message Template, POST /mobile/sync (client), Pending Sync Screen, Module-to-Document Mapping Table, GAP-03 Master-Data Read API (+1 more)

### Community 79 - "device_remote_data_source.dart"
Cohesion: 0.03
Nodes (68): active,
  inactive,
  revoked,, bool get, DateTime?, DeviceStatus, _api, bootstrap, BootstrapResponseDto, clockOffsetMs (+60 more)

### Community 80 - "inventory/api/queries.ts"
Cohesion: 0.10
Nodes (25): createAdjustment(), createReceiving(), createReturn(), createTransfer(), fetchBalances(), fetchMovements(), fetchTrolleyStock(), useBalances() (+17 more)

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
Cohesion: 0.03
Nodes (68): accessDeniedBody, accessDeniedTitle, appName, AppStrings, appVersion, back, blockedInactive, blockedRevoked (+60 more)

### Community 87 - "bootstrap_repository_impl.dart"
Cohesion: 0.04
Nodes (60): _cached, clear, deviceCode, deviceId, _loaded, ProvisionedDeviceStore, read, readDeviceId (+52 more)

### Community 88 - "test_app.dart"
Cohesion: 0.04
Nodes (52): _, @DriftDatabase, dart:convert, fake_backend.dart, fakes.dart, fixtures.dart, AppDatabase, appDatabaseProvider (+44 more)

### Community 89 - "provisioning_screen.dart"
Cohesion: 0.05
Nodes (46): ConsumerState, ConsumerStatefulWidget, MobileScannerController, MobileScannerException?, LoginScreen, _barcodes, buildPreview, _controller (+38 more)

### Community 90 - "integrations/ Adapter Isolation Pattern"
Cohesion: 0.40
Nodes (5): WhatsApp Notification Flow (Backend Internal), Reader Integration Modes (USB/Bluetooth/Vendor SDK), POST /internal/notifications/whatsapp Payload, Evidence Upload Flow (Photo → Object Storage), integrations/ Adapter Isolation Pattern

### Community 91 - "AuthenticatedUser"
Cohesion: 0.11
Nodes (10): assertFactoryScope(), isInFactoryScope(), AuthenticatedUser, ExchangeWithContext, insufficientStock(), ExchangeService, Injectable, scopedToA (+2 more)

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
Nodes (22): createStorageMapping(), fetchStorageMappings(), updateStorageMapping(), storageMappingKeys, useCreateStorageMapping(), useStorageMappings(), useUpdateStorageMapping(), CreateStorageMappingInput (+14 more)

### Community 103 - "CountSessionController"
Cohesion: 0.16
Nodes (16): CountSessionController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+8 more)

### Community 104 - "users/index.ts"
Cohesion: 0.16
Nodes (22): fetchAllUsers(), fetchUser(), fetchUsers(), userDisplayLabel(), userKeys, UserLookup, useUserLookup(), useUsersByRole() (+14 more)

### Community 105 - "user-write-queries.ts"
Cohesion: 0.19
Nodes (20): assignFactoryScope(), assignRole(), createUser(), revokeFactoryScope(), revokeRole(), updateUser(), useAssignFactoryScope(), useAssignRole() (+12 more)

### Community 106 - "confirmation.service.ts"
Cohesion: 0.17
Nodes (8): CONFIRMATION_EXPIRY_JOB, CONFIRMATION_EXPIRY_QUEUE, ConfirmationExpiryProcessor, Processor, CONFIRMATION_INCLUDE, ConfirmationService, ConfirmationWithContext, Injectable

### Community 107 - "confirmation-monitoring-page.test.tsx"
Cohesion: 0.09
Nodes (32): TabsContent, TabsList, TabsTrigger, approveConfirmation(), fetchConfirmation(), fetchConfirmations(), rejectConfirmation(), confirmationKeys (+24 more)

### Community 108 - "trolley-stock-dialog.tsx"
Cohesion: 0.36
Nodes (8): TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState(), EmptyStateProps, DataTableProps

### Community 109 - ".sync"
Cohesion: 0.15
Nodes (13): MobileController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+5 more)

### Community 110 - "app_error.dart"
Cohesion: 0.04
Nodes (47): authForbidden, authInvalidToken, BackendErrorCodes, category, ClientErrorCodes, code, conflict, context (+39 more)

### Community 111 - "tables.dart"
Cohesion: 0.04
Nodes (45): BoolColumn get, DateTimeColumn get, IntColumn get, category, checkedAt, code, collection, deviceCode (+37 more)

### Community 112 - "dashboard/api/queries.ts"
Cohesion: 0.11
Nodes (32): delayed(), fetchDashboardOverview(), fetchExchangeTrend(), fetchNeedleConsumption(), fetchStockSummary(), FIXTURE_EXCHANGE_TREND, FIXTURE_NEEDLE_CONSUMPTION, FIXTURE_OVERVIEW (+24 more)

### Community 113 - "adjustment-page.test.tsx"
Cohesion: 0.11
Nodes (13): FACTORY, LOCATION, makeAdjustment(), makePaged(), mockedCreateAdjustment, mockedFetchAdjustment, mockedFetchAdjustments, mockedFetchAllUsers (+5 more)

### Community 114 - "return-page.test.tsx"
Cohesion: 0.11
Nodes (14): FACTORY, makePaged(), makeReturn(), mockedCreateReturn, mockedFetchAllUsers, mockedFetchBalances, mockedFetchCurrentUser, mockedFetchMasterData (+6 more)

### Community 115 - "master_data_versions.dart"
Cohesion: 0.07
Nodes (32): apply, clear, exchangeTypes, needleTypes, storageMappings, storedVersions, CollectionUpdate, exchangeTypes (+24 more)

### Community 116 - "needle-type-queries.ts"
Cohesion: 0.22
Nodes (14): activateNeedleType(), createNeedleType(), deactivateNeedleType(), updateNeedleType(), useActivateNeedleType(), useCreateNeedleType(), useDeactivateNeedleType(), useUpdateNeedleType() (+6 more)

### Community 117 - "SyncCommandDto"
Cohesion: 0.12
Nodes (23): BootstrapQueryDto, SyncCommandDto, SyncRequestDto, ApiProperty, ApiPropertyOptional, ArrayMaxSize, IsArray, IsIn (+15 more)

### Community 119 - "fake_backend.dart"
Cohesion: 0.06
Nodes (32): dart:typed_data, Interceptor, AuthInterceptor, authenticated, _deviceId, DeviceIdReader, HeadersInterceptor, onRequest (+24 more)

### Community 120 - "router.dart"
Cohesion: 0.07
Nodes (30): @visibleForTesting, GoRouter, build, NexaApp, allowed, fallback, gate, redirectFor (+22 more)

### Community 121 - "rfid-card.service.ts"
Cohesion: 0.10
Nodes (15): DomainException, ERROR_CODES, ErrorCode, DEVICE_ID_HEADER, DeviceContextGuard, Injectable, RequestWithContext, ADR-0005 (+7 more)

### Community 122 - "exchange-trend-chart.tsx"
Cohesion: 0.20
Nodes (12): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), getPayloadConfigFromPayload(), INITIAL_DIMENSION (+4 more)

### Community 123 - "count-session-detail-page.test.tsx"
Cohesion: 0.13
Nodes (11): FACTORY, LOCATION, mockedAddItem, mockedCancel, mockedComplete, mockedFetchAllUsers, mockedFetchBalances, mockedFetchCurrentUser (+3 more)

### Community 126 - "auth_remote_data_source.dart"
Cohesion: 0.06
Nodes (31): List, accessToken, _api, expiresInSeconds, factoryIds, fromJson, id, locationIds (+23 more)

### Community 127 - "auth_repository_impl.dart"
Cohesion: 0.08
Nodes (28): AuthRepository get, sessionEventsProvider, authRepositoryProvider, AuthRemoteDataSource, AuthRepositoryImpl, _local, login, logout (+20 more)

### Community 128 - "fakes.dart"
Cohesion: 0.07
Nodes (28): Connectivity, Map, changes, _connectivity, ConnectivityPlusSource, ConnectivitySource, connectivitySourceProvider, ConnectivityStatus (+20 more)

### Community 148 - "package:flutter/material.dart"
Cohesion: 0.03
Nodes (62): AppConfig, Color, IconData, AppTheme, light, seed, _Footer, _ConfirmPane (+54 more)

### Community 149 - "1. Fase 0 — Yang Harus Selesai *Sebelum* Membuka Claude Code"
Cohesion: 0.14
Nodes (13): 0. Kenapa Dokumen Ini Ada, 1.1 Verifikasi kontrak API mobile vs backend aktual, 1.2 Kunci keputusan teknis terbuka, 1.3 `Mobile/CLAUDE.md` — root rules untuk Claude Code, 1.4 `Docs/22-Mobile-Folder-Structure.md`, 1.5 Agent routing — `Docs/agents/mobile-dev.md`, 1.6 SKILL.md yang paling relevan, 1.7 Pemecahan tiket di `.scratch/` (+5 more)

### Community 151 - "dart:async"
Cohesion: 0.08
Nodes (25): dart:async, _controller, DeviceAccessEvent, DeviceAccessInactive, DeviceAccessNotFound, dispose, events, report (+17 more)

### Community 152 - "MOCK_SESSION_USER"
Cohesion: 0.18
Nodes (9): mockLoggedOut(), unauthorized(), confirmation(), envelope(), EXCHANGE, mockExchangeDetailApi(), USERS, MOCK_SESSION_USER (+1 more)

### Community 153 - "role-detail-screen.test.tsx"
Cohesion: 0.12
Nodes (17): fetchPermissions(), fetchRoles(), roleKeys, usePermissionCatalogue(), useRole(), useRoles(), PermissionRow, RoleRow (+9 more)

### Community 154 - "users-screen-write.test.tsx"
Cohesion: 0.15
Nodes (12): FACTORY, makePaged(), makeUser(), mockedAssignFactoryScope, mockedAssignRole, mockedCreateUser, mockedFetchCurrentUser, mockedFetchMasterData (+4 more)

### Community 155 - "location-data-source.ts"
Cohesion: 0.25
Nodes (11): createLocation(), updateLocation(), useCreateLocation(), useInvalidateLocations(), useUpdateLocation(), CREATABLE_LOCATION_TYPES, CreatableLocationType, CreateLocationInput (+3 more)

### Community 156 - "win32_window.cpp"
Cohesion: 0.18
Nodes (14): wchar_t, Scale(), Create, Destroy, UpdateTheme, Win32Window::Win32Window(), WindowClassRegistrar, class_registered_ (+6 more)

### Community 158 - "proxy-config.test.ts"
Cohesion: 0.29
Nodes (4): nextConfig, nextConfig, ORIGINAL, SimpleRewrite

### Community 159 - "rfid-screen.test.tsx"
Cohesion: 0.09
Nodes (28): ApiSuccessBody, createEmployee(), updateEmployee(), useCreateEmployee(), useUpdateEmployee(), CreateEmployeeInput, EntityStatus, UpdateEmployeeInput (+20 more)

### Community 160 - "design_tokens.dart"
Cohesion: 0.09
Nodes (23): @immutable, BuildContext, DesignTokens get, buttonHeight, copyWith, danger, DesignTokens, DesignTokensContext (+15 more)

### Community 162 - "envelope.dart"
Cohesion: 0.09
Nodes (22): ApiErrorBody, Envelope, int?, ApiErrorBody, code, context, data, details (+14 more)

### Community 235 - "devices-screen.tsx"
Cohesion: 0.06
Nodes (52): activateDevice(), fetchDevices(), reassignDevice(), registerDevice(), revokeDevice(), buildDeviceQrPayload(), DEVICE_QR_TYPE, DEVICE_QR_VERSION (+44 more)

### Community 242 - "sync.service.spec.ts"
Cohesion: 0.22
Nodes (7): ClaimRequest, ClaimResult, build(), device, exchangeRow(), FakeStore, user

### Community 243 - "FlutterWindow"
Cohesion: 0.12
Nodes (15): DartProject, HWND, LPARAM, LRESULT, UINT, WPARAM, FlutterWindow, flutter_controller_ (+7 more)

### Community 244 - "provisioning_controller.dart"
Cohesion: 0.11
Nodes (21): provisioningRepositoryProvider, ProvisionedDevice, build, confirm, device, _load, notice, Provisioned (+13 more)

### Community 245 - "mobile-response.dto.ts"
Cohesion: 0.27
Nodes (13): BootstrapDeviceDto, BootstrapExchangeTypeDto, BootstrapFactoryDto, BootstrapNeedleTypeDto, BootstrapStorageMappingDto, BootstrapTrolleyDto, MasterDataVersionsDto, MobileExchangeDto (+5 more)

### Community 246 - "administration-roles.spec.ts"
Cohesion: 0.32
Nodes (7): Captured, envelope(), FACTORY, makeMember(), mockRolesApi(), PERMISSIONS, ROLES

### Community 247 - "auth_repository.dart"
Cohesion: 0.11
Nodes (20): LoginResult, AppError, error, login, LoginFailed, LoginResult, LoginSucceeded, logout (+12 more)

### Community 248 - ".findAll"
Cohesion: 0.17
Nodes (10): RoleController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+2 more)

### Community 249 - "app_config.dart"
Cohesion: 0.11
Nodes (17): dev,
  staging,, Exception, apiBaseUrl, AppConfig, AppConfigException, AppEnvironment, connectTimeout, environment (+9 more)

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

### Community 254 - "audit.service.spec.ts"
Cohesion: 0.33
Nodes (3): FindManyArgs, multiFactory, viewer

### Community 255 - "Win32Window"
Cohesion: 0.23
Nodes (12): OnCreate, HWND, Win32Window, child_content_, GetClientArea, OnCreate, quit_on_close_, SetChildContent (+4 more)

### Community 256 - "Backend ↔ Mobile Contract Matrix"
Cohesion: 0.18
Nodes (10): Backend ↔ Mobile Contract Matrix, Conventions every tablet call follows, Doc 07 error names → backend codes (Doc 07 §40–41), Gaps and decisions, Mapping tables the tablet needs, Matrix, Stock status labels (FR-MOB-015), Summary (+2 more)

### Community 262 - "manifest.json"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, name, orientation, prefer_related_applications, short_name (+2 more)

### Community 263 - "MessageHandler"
Cohesion: 0.36
Nodes (10): HWND, LPARAM, LRESULT, UINT, WPARAM, EnableFullDpiSupportIfAvailable(), GetHandle, GetThisFromHandle (+2 more)

### Community 264 - "device_qr_payload.dart"
Cohesion: 0.12
Nodes (17): DeviceQrPayload?, deviceCode, deviceId, DeviceQrAccepted, DeviceQrParseResult, DeviceQrPayload, DeviceQrPayloadParser, DeviceQrRejected (+9 more)

### Community 265 - "DataClass"
Cohesion: 0.21
Nodes (17): DataClass, DeviceContextRow, DeviceValidationRow, ExchangeTypeRow, LocalDeviceContextCompanion, LocalDeviceValidationCompanion, LocalExchangeTypeCompanion, LocalMasterDataVersionCompanion (+9 more)

### Community 266 - "useSessionBootstrapStore"
Cohesion: 0.20
Nodes (12): apiClient, DEFAULT_ERROR_MESSAGE, refreshAccessToken(), SERVER_UNREACHABLE_MESSAGE, config, SessionProvider(), bootstrap(), useSessionBootstrapStore (+4 more)

### Community 267 - "ListConfirmationsQueryDto"
Cohesion: 0.18
Nodes (13): ApproveConfirmationDto, ListConfirmationsQueryDto, RejectConfirmationDto, trimmed(), ApiProperty, ApiPropertyOptional, IsEnum, IsInt (+5 more)

### Community 268 - "auth_user.dart"
Cohesion: 0.13
Nodes (14): canReprovisionDevice, deviceManage, factoryIds, hasPermission, id, locationIds, mobileOperate, name (+6 more)

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
Cohesion: 0.15
Nodes (12): FlutterSecureStorage, accessToken, accessTokenExpiresAt, delete, deviceCode, deviceId, read, refreshToken (+4 more)

### Community 276 - "routes.dart"
Cohesion: 0.17
Nodes (11): blocked, history, home, login, newExchange, provision, Routes, settings (+3 more)

### Community 278 - "nexa_mobile — NEXA Troli (Android tablet)"
Cohesion: 0.40
Nodes (4): Environments, First launch on a tablet, nexa_mobile — NEXA Troli (Android tablet), Tests

### Community 281 - "auth/index.ts"
Cohesion: 0.27
Nodes (3): ForgotPasswordScreen(), LoginScreen(), ResetPasswordScreen()

### Community 282 - "Table"
Cohesion: 0.39
Nodes (9): @DataClassName, LocalDeviceContext, LocalDeviceValidation, LocalExchangeType, LocalMasterDataVersion, LocalNeedleType, LocalStorageMapping, LocalUserSession (+1 more)

### Community 283 - "mobile.e2e-spec.ts"
Cohesion: 0.22
Nodes (5): CommandResult, ErrorBody, MobileExchange, PNG, SyncBody

### Community 284 - "main.ts"
Cohesion: 0.32
Nodes (5): AppModule, Module, ALLOWED_HEADERS, configureApp(), bootstrap()

### Community 291 - "rbac.guard.spec.ts"
Cohesion: 0.25
Nodes (3): RbacGuard, Injectable, picTroli

### Community 292 - "22 — Mobile Folder Structure (nexa_mobile)"
Cohesion: 0.25
Nodes (7): 1. Top level, 22 — Mobile Folder Structure (nexa_mobile), 2. `lib/app/` and `lib/core/`, 3. `lib/features/`, 4. `lib/shared/`, 5. Local database (Drift), 6. Environments

### Community 293 - "audit/store.ts"
Cohesion: 0.36
Nodes (6): AuditAction, DEFAULT_AUDIT_FILTERS, AuditLogScreen(), AuditFilterState, useAuditFilters(), useAuditFilterStore

### Community 294 - "public.decorator.ts"
Cohesion: 0.33
Nodes (3): IS_PUBLIC_KEY, JwtAuthGuard, Injectable

### Community 295 - "fixtures.dart"
Cohesion: 0.29
Nodes (6): bootstrapData, deviceCode, deviceId, heartbeatData, loginData, meData

### Community 296 - "ResetPasswordDto"
Cohesion: 0.33
Nodes (6): ResetPasswordDto, ApiProperty, IsString, Matches, MaxLength, MinLength

### Community 297 - "inventory-writes.e2e-spec.ts"
Cohesion: 0.33
Nodes (5): AdjustmentRow, CountDetail, CountItem, Envelope, PNG

### Community 298 - "app_logger.dart"
Cohesion: 0.33
Nodes (5): dart:developer, AppLogger, error, info, warning

### Community 301 - "ApprovalModule"
Cohesion: 0.40
Nodes (3): ApprovalModule, InjectQueue, Module

### Community 302 - "auth.e2e-spec.ts"
Cohesion: 0.50
Nodes (3): LoginBody, MeBody, TokenPairBody

### Community 303 - "confirmation.service.spec.ts"
Cohesion: 0.40
Nodes (3): approver, DecisionCreateCall, pending

### Community 304 - "catalogue-writes.spec.ts"
Cohesion: 0.50
Nodes (3): build(), user, withLocations()

### Community 305 - "ForgotPasswordDto"
Cohesion: 0.50
Nodes (4): ForgotPasswordDto, ApiProperty, MaxLength, IsEmail

## Knowledge Gaps
- **1833 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+1828 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **113 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Table` connect `Table` to `count-session-detail-page.tsx`, `trolley-stock-dialog.tsx`, `cn`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `AuthenticatedUser` connect `AuthenticatedUser` to `RequirePermissions`, `master-data.controller.ts`, `.approve`, `ListConfirmationsQueryDto`, `PrismaService`, `.uploadAdjustmentEvidence`, `AuthController`, `constants/permissions.ts`, `Audit`, `rbac.guard.spec.ts`, `.upload`, `exchange.service.ts`, `audit-log.interceptor.spec.ts`, `identity.module.ts`, `confirmation.service.spec.ts`, `scope.guard.ts`, `auth.service.ts`, `inventory.controller.ts`, `ListMovementsQueryDto`, `catalogue-writes.spec.ts`, `sync.service.ts`, `authenticated-user.interface.ts`, `inventory.service.ts`, `DeviceService`, `RfidCardService`, `employee.service.ts`, `CountSessionController`, `confirmation.service.ts`, `.sync`, `sync.service.spec.ts`, `.findAll`, `rfid-card.service.ts`, `audit.service.spec.ts`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `count-session-detail-page.tsx`, `adjustment-form-dialog.tsx`, `status-badge.tsx`, `confirmation-panel.tsx`, `Table`, `trolley-stock-dialog.tsx`, `confirmation-monitoring-page.test.tsx`, `useCurrentUser`, `client.ts`, `exchange-trend-chart.tsx`, `providers.tsx`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _1833 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `RequirePermissions` be split into smaller, more focused modules?**
  _Cohesion score 0.1264849755415793 - nodes in this community are weakly interconnected._
- **Should `master-data.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05251765778081568 - nodes in this community are weakly interconnected._
- **Should `app_database.dart` be split into smaller, more focused modules?**
  _Cohesion score 0.017241379310344827 - nodes in this community are weakly interconnected._