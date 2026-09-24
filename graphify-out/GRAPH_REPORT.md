# Graph Report - needle_mobile  (2026-09-24)

## Corpus Check
- 653 files · ~336,580 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4143 nodes · 10989 edges · 290 communities (177 shown, 113 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 243 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `890b1154`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ExchangeController
- RequirePermissions
- confirmation.controller.ts
- dashboard/api/queries.ts
- constants/permissions.ts
- receiving-page.tsx
- inventory/api/types.ts
- role-detail-screen.tsx
- app-shell.tsx
- renderWithQueryClient
- core/master-data/index.ts
- exchange-transactions-page.test.tsx
- PrismaService
- auth/data-source.ts
- cn
- auth.ts
- auth.controller.ts
- useCurrentUser
- dependencies
- devDependencies
- getApiErrorMessage
- client.ts
- TokenService
- forgot-password.e2e-spec.ts
- app.module.ts
- RetentionService
- audit-log-page.test.tsx
- AppDelegate
- Database ERD & Physical Schema
- devDependencies
- .uploadAdjustmentEvidence
- notification.templates.ts
- components.json
- AuthController
- roles.e2e-spec.ts
- UserService
- compilerOptions
- evidence.controller.ts
- System Architecture Document
- scripts
- http-exception.filter.ts
- exchange.service.ts
- Claude Code Backend Setup Prompting Guide
- jest
- sync-commands.ts
- identity.module.ts
- inventory-history.service.ts
- Backend CLAUDE.md
- scope.guard.ts
- UserRepository
- inventory.controller.ts
- ListMovementsQueryDto
- device.controller.ts
- whatsapp.port.ts
- AuthenticatedUser
- compilerOptions
- bootstrap.service.ts
- NotificationService
- audit.controller.ts
- count-session.controller.ts
- useSessionBootstrapStore
- Backend ARCHITECTURE.md
- notification.service.ts
- device.service.ts
- inventory.service.ts
- my_application.cc
- transfer-page.test.tsx
- dependencies
- WebApps Dev Subagent Spec
- count-session-page.test.tsx
- status-badge.tsx
- Backend/package.json
- HealthController
- .enroll
- WhatsApp Integration Specification
- adjustment-detail-dialog.tsx
- IdempotencyStore
- employee.controller.ts
- POST /mobile/sync (client)
- stock-movement-page.test.tsx
- count-session-detail-page.tsx
- scripts
- exclude
- ADR-0001 Dashboard v1 Scoped to Existing Contract
- extends
- inventory-adjustment.spec.ts
- master-data.controller.ts
- InventoryHistoryController
- password-reset.service.spec.ts
- FakeRefreshTokenRepository
- integrations/ Adapter Isolation Pattern
- MasterDataService
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
- CountSessionController
- users/index.ts
- user-write-queries.ts
- exchange.controller.ts
- confirmation-monitoring-page.test.tsx
- top-needle-types-table.tsx
- assertFactoryScope
- ScopedMasterDataQueryDto
- factory-queries.ts
- dashboard-page.tsx
- adjustment-page.test.tsx
- return-page.test.tsx
- user.controller.ts
- needle-type-queries.ts
- SyncCommandDto
- ts-node
- ExchangeRepository
- RequireAuth
- RfidCardService
- exchange-trend-chart.tsx
- count-session-detail-page.test.tsx
- database.config.ts
- setup-env.ts
- master-data-response.dto.ts
- clsx
- sync.service.ts
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
- main.dart
- 1. Fase 0 — Yang Harus Selesai *Sebelum* Membuka Claude Code
- lucide-react
- next-themes
- MOCK_SESSION_USER
- roles/index.ts
- users-screen-write.test.tsx
- location-data-source.ts
- win32_window.cpp
- proxy-config.test.ts
- rfid-screen.tsx
- location-screen.test.tsx
- zod
- storage-screen.test.tsx
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
- trolley-screen.test.tsx
- mobile-response.dto.ts
- administration-roles.spec.ts
- role-detail-screen.test.tsx
- @nestjs/swagger
- rbac.guard.ts
- Admin-panel CRUD audit: five contract-ready write gaps close next, three stay blocked on undecided policy, three are recorded but not queued
- administration-devices.spec.ts
- users-screen.test.tsx
- wWinMain
- catalogue-writes.spec.ts
- Win32Window
- Backend ↔ Mobile Contract Matrix
- source-map-support
- 0003-roles-permissions-ships-read-only-first.md
- 0005-admin-panel-writes-never-widen-access-and-never-overwrite-stock.md
- 0006-stock-operations-keep-a-header-row-beside-the-ledger.md
- 0007-mobile-sync-executes-through-exchange-service.md
- manifest.json
- MessageHandler
- administration/index.ts
- auth/index.ts
- device-context.guard.spec.ts
- HealthService
- mobile.e2e-spec.ts
- CLAUDE.md — nexa_mobile (Troli App)
- RfidCardQueryDto
- Flutter project rules — nexa_mobile
- EnrollRfidCardDto
- mobile-dev.md
- exchange/[id]/page.tsx
- RegisterPlugins
- dashboard/page.tsx
- FlutterActivity
- nexa_mobile
- jsdom
- LaunchImage.imageset/README.md
- sonner
- @tanstack/react-table
- @testing-library/jest-dom
- vitest
- typescript

## God Nodes (most connected - your core abstractions)
1. `AuthenticatedUser` - 240 edges
2. `getApiErrorMessage()` - 138 edges
3. `RequirePermissions()` - 107 edges
4. `PrismaService` - 102 edges
5. `cn()` - 89 edges
6. `react` - 67 edges
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

## Communities (290 total, 113 thin omitted)

### Community 0 - "ExchangeController"
Cohesion: 0.25
Nodes (17): ExchangeController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+9 more)

### Community 1 - "RequirePermissions"
Cohesion: 0.18
Nodes (22): Audit(), Paginated(), RequirePermissions(), ExchangeTypeController, FactoryController, LocationController, NeedleTypeController, StorageMappingController (+14 more)

### Community 2 - "confirmation.controller.ts"
Cohesion: 0.06
Nodes (42): CONFIRMATION_EXPIRY_JOB, CONFIRMATION_EXPIRY_QUEUE, ConfirmationExpiryProcessor, Processor, ApprovalModule, InjectQueue, Module, ConfirmationController (+34 more)

### Community 3 - "dashboard/api/queries.ts"
Cohesion: 0.22
Nodes (17): delayed(), fetchDashboardOverview(), fetchExchangeTrend(), fetchNeedleConsumption(), fetchStockSummary(), FIXTURE_EXCHANGE_TREND, FIXTURE_NEEDLE_CONSUMPTION, FIXTURE_OVERVIEW (+9 more)

### Community 4 - "constants/permissions.ts"
Cohesion: 0.05
Nodes (38): AppModule, Module, ALLOWED_HEADERS, configureApp(), bootstrap(), PERMISSIONS, PNG, AuditRow (+30 more)

### Community 5 - "receiving-page.tsx"
Cohesion: 0.06
Nodes (90): Button, ButtonProps, buttonVariants, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogTitle (+82 more)

### Community 6 - "inventory/api/types.ts"
Cohesion: 0.06
Nodes (46): AdjustmentReasonCode, AdjustmentResult, BalanceItem, BalanceListFilters, CreateAdjustmentInput, CreateReceivingInput, CreateReturnInput, CreateTransferInput (+38 more)

### Community 7 - "role-detail-screen.tsx"
Cohesion: 0.30
Nodes (13): Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton(), AuditTimeline(), EvidenceGallery() (+5 more)

### Community 8 - "app-shell.tsx"
Cohesion: 0.12
Nodes (3): ReturnScreen(), TransferScreen(), AppShell()

### Community 9 - "renderWithQueryClient"
Cohesion: 0.04
Nodes (43): SessionBootstrapState, makeDevice(), makePaged(), mockedFetchCurrentUser, mockedFetchDevices, mockedFetchMasterData, mockedFetchCurrentUser, mockedFetchPermissions (+35 more)

### Community 10 - "core/master-data/index.ts"
Cohesion: 0.08
Nodes (41): ApiSuccessBody, fetchMasterData(), fetchMasterDataRow(), MasterDataQuery, displayLabel(), Lookup, useLookup(), Employee (+33 more)

### Community 11 - "exchange-transactions-page.test.tsx"
Cohesion: 0.12
Nodes (22): fetchExchangeDetail(), fetchExchangeEvidence(), fetchExchanges(), exchangeKeys, useExchangeDetail(), useExchangeEvidence(), useExchangeList(), EvidenceItem (+14 more)

### Community 12 - "PrismaService"
Cohesion: 0.04
Nodes (41): JwtPayload, ADR-0004, PrismaService, Injectable, CONFIRMATION_INCLUDE, PagedRows, NumberSequenceService, PREFIXES (+33 more)

### Community 13 - "auth/data-source.ts"
Cohesion: 0.12
Nodes (24): fetchCurrentUser(), forgotPassword(), login(), logout(), resetPassword(), useForgotPassword(), useLogout(), useResetPassword() (+16 more)

### Community 14 - "cn"
Cohesion: 0.07
Nodes (33): inter, jetbrainsMono, metadata, RootLayout(), Providers(), CardFooter, DialogOverlay, DropdownMenuCheckboxItem (+25 more)

### Community 15 - "auth.ts"
Cohesion: 0.13
Nodes (17): Captured, envelope(), FACTORY, makeUser(), mockUsersApi(), Captured, envelope(), makeEntry() (+9 more)

### Community 16 - "auth.controller.ts"
Cohesion: 0.12
Nodes (19): LoginResponseDto, LoginUserDto, MeResponseDto, TokenPairDto, ApiProperty, ForgotPasswordDto, ApiProperty, MaxLength (+11 more)

### Community 17 - "useCurrentUser"
Cohesion: 0.20
Nodes (15): useCurrentUser(), hasAllPermissions(), hasAnyPermission(), hasPermission(), PermissionCode, PermissionHolder, useAllPermissions(), useAnyPermission() (+7 more)

### Community 18 - "dependencies"
Cohesion: 0.04
Nodes (47): dependencies, bcryptjs, bullmq, class-transformer, class-validator, dotenv, ioredis, joi (+39 more)

### Community 19 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint-config-next, @playwright/test, postcss, tailwindcss, tailwindcss-animate, @testing-library/react, @testing-library/user-event, @types/react (+19 more)

### Community 20 - "getApiErrorMessage"
Cohesion: 0.05
Nodes (68): react, react, getApiErrorMessage(), hasErrorEnvelope(), useMasterData(), useFactoryScopeStore, handleConfirm(), PermissionCatalogueCard() (+60 more)

### Community 21 - "client.ts"
Cohesion: 0.07
Nodes (64): API_BASE_PATH, ApiErrorBody, ApiResponseMeta, MUTATING_METHODS, FactoryScopeState, PERMISSIONS, usePermission(), RolesScreen() (+56 more)

### Community 22 - "TokenService"
Cohesion: 0.12
Nodes (7): RefreshTokenRepository, Injectable, TokenService, Injectable, parseDurationToSeconds(), UNIT_SECONDS, USER

### Community 23 - "forgot-password.e2e-spec.ts"
Cohesion: 0.18
Nodes (9): EmailModule, Module, EMAIL_CLIENT, EmailMessage, EmailPort, ADR-0002, NodemailerEmailAdapter, ADR-0002 (+1 more)

### Community 24 - "app.module.ts"
Cohesion: 0.06
Nodes (32): AuditWriterModule, Global, Module, HealthModule, Module, IdempotencyModule, Global, Module (+24 more)

### Community 25 - "RetentionService"
Cohesion: 0.12
Nodes (12): RecordRetentionProcessor, Processor, RETENTION_QUEUE, RETENTION_SWEEP_JOB, RetentionModule, InjectQueue, Module, RetentionService (+4 more)

### Community 26 - "audit-log-page.test.tsx"
Cohesion: 0.16
Nodes (14): fetchAuditLogs(), auditKeys, useAuditLogs(), AUDIT_ACTIONS, AuditLogEntry, AuditLogFilters, DEFAULT_AUDIT_FILTERS, PagedAuditLog (+6 more)

### Community 27 - "AppDelegate"
Cohesion: 0.06
Nodes (26): Any, Cocoa, Flutter, FlutterAppDelegate, FlutterImplicitEngineBridge, FlutterImplicitEngineDelegate, FlutterMacOS, FlutterPluginRegistry (+18 more)

### Community 28 - "Database ERD & Physical Schema"
Cohesion: 0.12
Nodes (23): Response Envelope Interceptor Ordering, ScopeGuard / assertFactoryScope Dual Implementation, Stock Ledger Invariants (Three Layers), Audit Logging Mechanism, Idempotency-Key / client_transaction_id Mechanism, Five-Dimension Authorization Model, Adjustment (Domain Concept), Approval (Domain Concept) (+15 more)

### Community 29 - "devDependencies"
Cohesion: 0.04
Nodes (49): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, globals, jest, @nestjs/cli (+41 more)

### Community 30 - ".uploadAdjustmentEvidence"
Cohesion: 0.17
Nodes (18): InventoryController, ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags, Body (+10 more)

### Community 31 - "notification.templates.ts"
Cohesion: 0.14
Nodes (14): resolveTemplateVariables(), STUCK_REASONS, STUCK_TEXT, StuckReason, stuckReasonText(), TEMPLATE_VARIABLES, TemplateCode, TEMPLATES (+6 more)

### Community 32 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 33 - "AuthController"
Cohesion: 0.23
Nodes (15): Public(), AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+7 more)

### Community 34 - "roles.e2e-spec.ts"
Cohesion: 0.12
Nodes (23): humanize(), IdentitySeedResult, ROLE_DESCRIPTIONS, seedAdminUser(), seedIdentity(), seedPermissions(), seedRoles(), MasterDataSeedResult (+15 more)

### Community 35 - "UserService"
Cohesion: 0.07
Nodes (42): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser, Get (+34 more)

### Community 36 - "compilerOptions"
Cohesion: 0.07
Nodes (27): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, incremental (+19 more)

### Community 37 - "evidence.controller.ts"
Cohesion: 0.10
Nodes (26): EvidenceController, ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags, Body (+18 more)

### Community 38 - "System Architecture Document"
Cohesion: 0.23
Nodes (19): ADR-003 Trolley Is an Inventory Location, ADR-005 Offline-First Android, ADR-006 WhatsApp Is the Only Notification Channel, Exchange State (Domain Concept), Fragment Status (Domain Concept), Operator Actor, PIC Actor, PRD v2.0 (+11 more)

### Community 39 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, build, db:seed, docker:down, docker:up, format, lint, prisma:deploy (+11 more)

### Community 40 - "http-exception.filter.ts"
Cohesion: 0.17
Nodes (14): ApiErrorBodyDto, ApiErrorDto, ApiSuccessDto, ResponseMetaDto, ApiProperty, ApiPropertyOptional, DescribedError, describeError() (+6 more)

### Community 41 - "exchange.service.ts"
Cohesion: 0.08
Nodes (28): DomainException, ERROR_CODES, ErrorCode, DEVICE_ID_HEADER, ADR-0005, EXCHANGE_CONTEXT_INCLUDE, exchangeNotFound(), transitionRefused() (+20 more)

### Community 42 - "Claude Code Backend Setup Prompting Guide"
Cohesion: 0.17
Nodes (19): Root CLAUDE.md, Exchange State Machine (CREATED→COMPLETED), State-Based UI (ExchangeState drives actions), Catatan Penggunaan, Fase 0 — Kunci Keputusan Terbuka, Fase 10 — Modul Synchronization, Fase 11 — Kontrak API & Dokumentasi, Fase 12 — Test Menyeluruh & Docker (+11 more)

### Community 43 - "jest"
Cohesion: 0.11
Nodes (18): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, moduleNameMapper, rootDir, roots, testEnvironment (+10 more)

### Community 44 - "sync-commands.ts"
Cohesion: 0.11
Nodes (17): AuditRecord, AuditWriter, SNAPSHOT_FIELDS, Injectable, AUDIT_ACTIONS, AUDIT_KEY, AuditAction, AuditEvent (+9 more)

### Community 45 - "identity.module.ts"
Cohesion: 0.12
Nodes (8): PasswordResetTokenRepository, Injectable, PASSWORD_HASH_ROUNDS, PasswordResetService, Inject, Injectable, buildPasswordResetEmail(), ADR-0002

### Community 46 - "inventory-history.service.ts"
Cohesion: 0.08
Nodes (19): MinioObjectStorageAdapter, Injectable, ObjectStorageModule, Module, OBJECT_STORAGE, ObjectStoragePort, StoredObject, ExchangeModule (+11 more)

### Community 47 - "Backend CLAUDE.md"
Cohesion: 0.12
Nodes (17): Exchange State Machine (Pure Function), Side Effects Happen After Commit, ADR-001 Modular Monolith, Backend CLAUDE.md, approval module, audit module, device module, employee module (+9 more)

### Community 48 - "scope.guard.ts"
Cohesion: 0.17
Nodes (6): FACTORY_SCOPE_KEY, LOCATION_SCOPE_KEY, ScopeSource, ScopeGuard, Injectable, picFactoryA

### Community 49 - "UserRepository"
Cohesion: 0.12
Nodes (11): LoginDto, ApiProperty, IsNotEmpty, IsString, MaxLength, Injectable, UserRepository, AuthService (+3 more)

### Community 50 - "inventory.controller.ts"
Cohesion: 0.16
Nodes (28): NOT_FOUND, AdjustmentDetailResponseDto, AdjustmentEvidenceItemDto, AdjustmentEvidenceResponseDto, AdjustmentHistoryResponseDto, AdjustmentResponseDto, BalanceResponseDto, CompleteCountSessionResponseDto (+20 more)

### Community 51 - "ListMovementsQueryDto"
Cohesion: 0.24
Nodes (18): ListAdjustmentsQueryDto, ListBalancesQueryDto, ListCountSessionsQueryDto, ListMovementsQueryDto, ListOperationHistoryQueryDto, ApiPropertyOptional, ADR-0003, IsDate (+10 more)

### Community 52 - "device.controller.ts"
Cohesion: 0.08
Nodes (31): CurrentUser, CurrentDevice, RequireDeviceContext(), DeviceContext, RequestWithContext, REQUEST_ID_HEADER, RequestIdMiddleware, Injectable (+23 more)

### Community 53 - "whatsapp.port.ts"
Cohesion: 0.17
Nodes (12): MetaCloudWhatsAppAdapter, MetaSendResponse, Injectable, Module, WhatsAppModule, ADR-0006, WHATSAPP_CLIENT, WhatsAppMessage (+4 more)

### Community 54 - "AuthenticatedUser"
Cohesion: 0.10
Nodes (8): AuthenticatedUser, DeviceService, Injectable, CountSessionService, Injectable, InventoryService, PagedRows, Injectable

### Community 55 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, @testing-library/jest-dom, **/*.tsx, vitest/globals (+20 more)

### Community 56 - "bootstrap.service.ts"
Cohesion: 0.13
Nodes (12): MasterDataVersionsDto, BootstrapService, Catalogue, MappingWithLocation, Injectable, Versioned, versionOf(), SyncChangesService (+4 more)

### Community 57 - "NotificationService"
Cohesion: 0.22
Nodes (4): NotificationDispatchProcessor, Processor, NotificationService, Injectable

### Community 58 - "audit.controller.ts"
Cohesion: 0.08
Nodes (27): AuditModule, Module, AuditController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller (+19 more)

### Community 59 - "count-session.controller.ts"
Cohesion: 0.16
Nodes (25): NOT_FOUND, NOT_OPEN, AddCountItemDto, CreateAdjustmentDto, CreateCountSessionDto, CreateReceivingDto, CreateReturnDto, CreateTransferDto (+17 more)

### Community 60 - "useSessionBootstrapStore"
Cohesion: 0.13
Nodes (16): Toaster(), apiClient, DEFAULT_ERROR_MESSAGE, refreshAccessToken(), SERVER_UNREACHABLE_MESSAGE, config, useLogin(), QueryProvider() (+8 more)

### Community 61 - "Backend ARCHITECTURE.md"
Cohesion: 0.23
Nodes (12): Backend ARCHITECTURE.md, ADR-002 PostgreSQL, Backend docker-compose.yml, minio service, minio-init service, postgres service, redis service, Backend README.md (+4 more)

### Community 62 - "notification.service.ts"
Cohesion: 0.38
Nodes (4): NOTIFICATION_DISPATCH_JOB, NOTIFICATION_QUEUE, DispatchJobData, ADR-0006

### Community 63 - "device.service.ts"
Cohesion: 0.10
Nodes (35): DeviceController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+27 more)

### Community 64 - "inventory.service.ts"
Cohesion: 0.08
Nodes (20): isInFactoryScope(), StockStatus, ConcurrentAdjustmentError, CompletedCountSession, CountSessionListRow, DETAIL_INCLUDE, InsufficientStockError, AdjustmentResult (+12 more)

### Community 65 - "my_application.cc"
Cohesion: 0.09
Nodes (22): FlPluginRegistry, FlView, GApplication, gboolean, gchar, GObject, GtkApplication, MyApplicationClass (+14 more)

### Community 66 - "transfer-page.test.tsx"
Cohesion: 0.12
Nodes (13): DESTINATION_LOCATION, FACTORY, makePaged(), makeTransfer(), mockedCreateTransfer, mockedFetchAllUsers, mockedFetchBalances, mockedFetchCurrentUser (+5 more)

### Community 67 - "dependencies"
Cohesion: 0.07
Nodes (27): axios, class-variance-authority, date-fns, @hookform/resolvers, radix-ui, react-dom, react-hook-form, recharts (+19 more)

### Community 68 - "WebApps Dev Subagent Spec"
Cohesion: 0.24
Nodes (11): ADR-004 Backend Is the Stock Authority, WebApps Dev Subagent Spec, Flag Gaps and Conflicts Principle, 10-Stage Development Lifecycle, Reuse Before You Build Principle, WebApps Stack Decision, OpenAPI/Swagger Specification, WebApps UI/UX Specification (+3 more)

### Community 69 - "count-session-page.test.tsx"
Cohesion: 0.08
Nodes (36): addCountItem(), cancelCountSession(), completeCountSession(), createCountSession(), fetchCountSession(), fetchCountSessions(), countSessionKeys, useAddCountItem() (+28 more)

### Community 70 - "status-badge.tsx"
Cohesion: 0.23
Nodes (9): Badge(), BadgeProps, badgeVariants, BadgeVariant, EXCHANGE_STATE_CONFIG, STATUS_CONFIG, StatusBadge(), StatusConfig (+1 more)

### Community 71 - "Backend/package.json"
Cohesion: 0.20
Nodes (9): description, engines, node, license, name, prisma, seed, private (+1 more)

### Community 72 - "HealthController"
Cohesion: 0.29
Nodes (7): HealthController, ApiOperation, ApiResponse, ApiTags, Controller, Get, HealthStatus

### Community 73 - ".enroll"
Cohesion: 0.15
Nodes (19): RfidController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+11 more)

### Community 74 - "WhatsApp Integration Specification"
Cohesion: 0.31
Nodes (10): OpenAPI / Swagger Specification, Offline RFID Policy Deferral, RFID Integration Specification, WhatsApp Integration Specification, Mobile Offline Sync Specification, Mobile UI/UX Specification, WebApps UI/UX Specification, Backend Folder Structure (+2 more)

### Community 75 - "adjustment-detail-dialog.tsx"
Cohesion: 0.09
Nodes (48): fetchAdjustment(), fetchAdjustments(), fetchReturn(), fetchReturns(), fetchTransfer(), fetchTransfers(), historyParams(), toPaged() (+40 more)

### Community 76 - "IdempotencyStore"
Cohesion: 0.16
Nodes (5): IdempotencyStore, Injectable, IdempotencyKeyMiddleware, Injectable, messagesOf()

### Community 77 - "employee.controller.ts"
Cohesion: 0.09
Nodes (29): EmployeeController, FORBIDDEN, NOT_FOUND, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body (+21 more)

### Community 78 - "POST /mobile/sync (client)"
Cohesion: 0.22
Nodes (9): Master Data APIs, POST /mobile/sync, Employee Resolution via RFID, BROKEN_NEEDLE_CONFIRMATION Message Template, POST /mobile/sync (client), Pending Sync Screen, Module-to-Document Mapping Table, GAP-03 Master-Data Read API (+1 more)

### Community 79 - "stock-movement-page.test.tsx"
Cohesion: 0.22
Nodes (8): LOCATION, makeItem(), makePaged(), mockedFetchAllUsers, mockedFetchCurrentUser, mockedFetchMasterData, mockedFetchMovements, NEEDLE_TYPE

### Community 80 - "count-session-detail-page.tsx"
Cohesion: 0.08
Nodes (29): createAdjustment(), createReceiving(), createReturn(), createTransfer(), fetchBalances(), fetchMovements(), fetchTrolleyStock(), useBalances() (+21 more)

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

### Community 86 - "master-data.controller.ts"
Cohesion: 0.16
Nodes (32): DUPLICATE_CODE, EDIT_FORBIDDEN, FORBIDDEN, NOT_FOUND, CREATABLE_LOCATION_TYPES, CreatableLocationType, CreateFactoryDto, CreateLocationDto (+24 more)

### Community 87 - "InventoryHistoryController"
Cohesion: 0.20
Nodes (13): InventoryHistoryController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+5 more)

### Community 88 - "password-reset.service.spec.ts"
Cohesion: 0.22
Nodes (3): FakeResetTokenRepository, flush(), requestAndExtractToken()

### Community 90 - "integrations/ Adapter Isolation Pattern"
Cohesion: 0.40
Nodes (5): WhatsApp Notification Flow (Backend Internal), Reader Integration Modes (USB/Bluetooth/Vendor SDK), POST /internal/notifications/whatsapp Payload, Evidence Upload Flow (Photo → Object Storage), integrations/ Adapter Isolation Pattern

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
Cohesion: 0.21
Nodes (16): createStorageMapping(), fetchStorageMappings(), updateStorageMapping(), storageMappingKeys, useCreateStorageMapping(), useStorageMappings(), useUpdateStorageMapping(), CreateStorageMappingInput (+8 more)

### Community 103 - "CountSessionController"
Cohesion: 0.23
Nodes (14): CountSessionController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+6 more)

### Community 104 - "users/index.ts"
Cohesion: 0.19
Nodes (20): fetchAllUsers(), fetchUser(), fetchUsers(), userDisplayLabel(), userKeys, UserLookup, useUserLookup(), useUsersByRole() (+12 more)

### Community 105 - "user-write-queries.ts"
Cohesion: 0.19
Nodes (20): assignFactoryScope(), assignRole(), createUser(), revokeFactoryScope(), revokeRole(), updateUser(), useAssignFactoryScope(), useAssignRole() (+12 more)

### Community 106 - "exchange.controller.ts"
Cohesion: 0.20
Nodes (21): CancelExchangeDto, CreateExchangeDto, IdentifyOperatorDto, IssueNeedleDto, ListExchangesQueryDto, RecordFragmentDto, SelectExchangeTypeDto, SelectNewNeedleDto (+13 more)

### Community 107 - "confirmation-monitoring-page.test.tsx"
Cohesion: 0.13
Nodes (21): approveConfirmation(), fetchConfirmation(), fetchConfirmations(), rejectConfirmation(), confirmationKeys, useConfirmationList(), Confirmation, ConfirmationDecision (+13 more)

### Community 108 - "top-needle-types-table.tsx"
Cohesion: 0.31
Nodes (9): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow (+1 more)

### Community 109 - "assertFactoryScope"
Cohesion: 0.29
Nodes (5): assertFactoryScope(), ExchangeWithContext, insufficientStock(), ExchangeService, Injectable

### Community 110 - "ScopedMasterDataQueryDto"
Cohesion: 0.22
Nodes (9): MasterDataQueryDto, ScopedMasterDataQueryDto, StorageMappingQueryDto, ApiPropertyOptional, IsEnum, IsInt, IsOptional, IsUUID (+1 more)

### Community 111 - "factory-queries.ts"
Cohesion: 0.19
Nodes (16): authKeys, Factory, activateFactory(), createFactory(), deactivateFactory(), updateFactory(), useActivateFactory(), useCreateFactory() (+8 more)

### Community 112 - "dashboard-page.tsx"
Cohesion: 0.17
Nodes (15): dashboardKeys, useDashboardOverview(), DashboardFilters(), KpiRow(), PendingConfirmationIndicator(), StockAlertPanel(), TopNeedleTypesTable(), DashboardFilterState (+7 more)

### Community 113 - "adjustment-page.test.tsx"
Cohesion: 0.11
Nodes (13): FACTORY, LOCATION, makeAdjustment(), makePaged(), mockedCreateAdjustment, mockedFetchAdjustment, mockedFetchAdjustments, mockedFetchAllUsers (+5 more)

### Community 114 - "return-page.test.tsx"
Cohesion: 0.11
Nodes (14): FACTORY, makePaged(), makeReturn(), mockedCreateReturn, mockedFetchAllUsers, mockedFetchBalances, mockedFetchCurrentUser, mockedFetchMasterData (+6 more)

### Community 115 - "user.controller.ts"
Cohesion: 0.11
Nodes (11): PAGINATED_KEY, PaginatedPayload, ResponseFormatInterceptor, Injectable, FORBIDDEN, GRANT_FORBIDDEN, NOT_FOUND, ApiProperty (+3 more)

### Community 116 - "needle-type-queries.ts"
Cohesion: 0.22
Nodes (14): activateNeedleType(), createNeedleType(), deactivateNeedleType(), updateNeedleType(), useActivateNeedleType(), useCreateNeedleType(), useDeactivateNeedleType(), useUpdateNeedleType() (+6 more)

### Community 117 - "SyncCommandDto"
Cohesion: 0.14
Nodes (21): BootstrapQueryDto, SyncCommandDto, SyncRequestDto, ApiProperty, ApiPropertyOptional, ArrayMaxSize, IsArray, IsIn (+13 more)

### Community 119 - "ExchangeRepository"
Cohesion: 0.12
Nodes (10): ExchangeRepository, Injectable, isEvidenceComplete(), missingEvidenceTypes(), requiredEvidenceTypes(), ALLOWED_MIME_TYPES, EvidenceService, Inject (+2 more)

### Community 121 - "RfidCardService"
Cohesion: 0.16
Nodes (4): EmployeeService, Injectable, RfidCardService, Injectable

### Community 122 - "exchange-trend-chart.tsx"
Cohesion: 0.18
Nodes (14): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), getPayloadConfigFromPayload(), INITIAL_DIMENSION (+6 more)

### Community 123 - "count-session-detail-page.test.tsx"
Cohesion: 0.13
Nodes (11): FACTORY, LOCATION, mockedAddItem, mockedCancel, mockedComplete, mockedFetchAllUsers, mockedFetchBalances, mockedFetchCurrentUser (+3 more)

### Community 126 - "master-data-response.dto.ts"
Cohesion: 0.45
Nodes (9): ExchangeTypeResponseDto, FactoryResponseDto, LocationResponseDto, MasterDataRowDto, NeedleTypeResponseDto, StorageMappingResponseDto, TrolleyResponseDto, ApiProperty (+1 more)

### Community 128 - "sync.service.ts"
Cohesion: 0.23
Nodes (10): toExchangeResponse(), ChangedRow, toMobileExchange(), decodeCursor(), encodeCursor(), ORIGIN, SyncCall, MAX_PULL_CHANGES (+2 more)

### Community 148 - "main.dart"
Cohesion: 0.12
Nodes (16): build, _counter, createState, _incrementCounter, main, MyApp, MyHomePage, _MyHomePageState (+8 more)

### Community 149 - "1. Fase 0 — Yang Harus Selesai *Sebelum* Membuka Claude Code"
Cohesion: 0.14
Nodes (13): 0. Kenapa Dokumen Ini Ada, 1.1 Verifikasi kontrak API mobile vs backend aktual, 1.2 Kunci keputusan teknis terbuka, 1.3 `Mobile/CLAUDE.md` — root rules untuk Claude Code, 1.4 `Docs/22-Mobile-Folder-Structure.md`, 1.5 Agent routing — `Docs/agents/mobile-dev.md`, 1.6 SKILL.md yang paling relevan, 1.7 Pemecahan tiket di `.scratch/` (+5 more)

### Community 152 - "MOCK_SESSION_USER"
Cohesion: 0.18
Nodes (9): mockLoggedOut(), unauthorized(), confirmation(), envelope(), EXCHANGE, mockExchangeDetailApi(), USERS, MOCK_SESSION_USER (+1 more)

### Community 153 - "roles/index.ts"
Cohesion: 0.36
Nodes (9): fetchPermissions(), fetchRoles(), roleKeys, usePermissionCatalogue(), useRole(), useRoles(), PermissionRow, RoleRow (+1 more)

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

### Community 159 - "rfid-screen.tsx"
Cohesion: 0.12
Nodes (24): masterDataKeys, createEmployee(), updateEmployee(), useCreateEmployee(), useUpdateEmployee(), CreateEmployeeInput, EntityStatus, UpdateEmployeeInput (+16 more)

### Community 160 - "location-screen.test.tsx"
Cohesion: 0.14
Nodes (10): FACTORY, mockedCreate, mockedFetchCurrentUser, mockedFetchMasterData, mockedUpdate, openCreateDialog(), openEditDialog(), STORAGE (+2 more)

### Community 162 - "storage-screen.test.tsx"
Cohesion: 0.15
Nodes (9): EXCHANGE_TYPE, FACTORY, MAPPING, mockedCreateStorageMapping, mockedFetchCurrentUser, mockedFetchMasterData, mockedFetchStorageMappings, STORAGE_LOCATION (+1 more)

### Community 235 - "devices-screen.tsx"
Cohesion: 0.09
Nodes (38): activateDevice(), fetchDevices(), reassignDevice(), registerDevice(), revokeDevice(), deviceKeys, useActivateDevice(), useDevices() (+30 more)

### Community 242 - "sync.service.spec.ts"
Cohesion: 0.15
Nodes (8): ClaimRequest, ClaimResult, REQUEST, build(), device, exchangeRow(), FakeStore, user

### Community 243 - "FlutterWindow"
Cohesion: 0.13
Nodes (15): DartProject, HWND, LPARAM, LRESULT, UINT, WPARAM, FlutterWindow, flutter_controller_ (+7 more)

### Community 244 - "trolley-screen.test.tsx"
Cohesion: 0.09
Nodes (15): ACTIVE_CARD, EMPLOYEE, mockedEnrollRfidCard, mockedFetchCurrentUser, mockedFetchMasterData, mockedFetchRfidCards, mockedRevokeRfidCard, REVOKED_CARD (+7 more)

### Community 245 - "mobile-response.dto.ts"
Cohesion: 0.29
Nodes (13): BootstrapDeviceDto, BootstrapExchangeTypeDto, BootstrapFactoryDto, BootstrapNeedleTypeDto, BootstrapResponseDto, BootstrapStorageMappingDto, BootstrapTrolleyDto, MobileExchangeDto (+5 more)

### Community 246 - "administration-roles.spec.ts"
Cohesion: 0.32
Nodes (7): Captured, envelope(), FACTORY, makeMember(), mockRolesApi(), PERMISSIONS, ROLES

### Community 247 - "role-detail-screen.test.tsx"
Cohesion: 0.25
Nodes (4): mockedFetchAllUsers, mockedFetchCurrentUser, mockedFetchMasterData, mockedFetchRoles

### Community 248 - "@nestjs/swagger"
Cohesion: 0.08
Nodes (22): collection, compilerOptions, deleteOutDir, plugins, $schema, sourceRoot, FORBIDDEN, RoleController (+14 more)

### Community 249 - "rbac.guard.ts"
Cohesion: 0.14
Nodes (7): IS_PUBLIC_KEY, REQUIRED_PERMISSIONS_KEY, JwtAuthGuard, Injectable, RbacGuard, Injectable, picTroli

### Community 250 - "Admin-panel CRUD audit: five contract-ready write gaps close next, three stay blocked on undecided policy, three are recorded but not queued"
Cohesion: 0.29
Nodes (6): Admin-panel CRUD audit: five contract-ready write gaps close next, three stay blocked on undecided policy, three are recorded but not queued, Audit findings — status per module, Consequences, Decision, What this does not change, What was audited

### Community 251 - "administration-devices.spec.ts"
Cohesion: 0.38
Nodes (6): Captured, envelope(), FACTORY, makeDevice(), mockDeviceApi(), TROLLEY

### Community 252 - "users-screen.test.tsx"
Cohesion: 0.33
Nodes (5): makePaged(), makeUser(), mockedFetchCurrentUser, mockedFetchMasterData, mockedFetchUsers

### Community 253 - "wWinMain"
Cohesion: 0.22
Nodes (9): _In_, _In_opt_, wWinMain(), wchar_t, CreateAndAttachConsole(), GetCommandLineArguments(), Utf8FromUtf16(), string (+1 more)

### Community 254 - "catalogue-writes.spec.ts"
Cohesion: 0.50
Nodes (3): build(), user, withLocations()

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

### Community 265 - "auth/index.ts"
Cohesion: 0.27
Nodes (3): ForgotPasswordScreen(), LoginScreen(), ResetPasswordScreen()

### Community 266 - "device-context.guard.spec.ts"
Cohesion: 0.22
Nodes (4): DeviceContextGuard, Injectable, device, user

### Community 267 - "HealthService"
Cohesion: 0.33
Nodes (3): HealthService, Injectable, InjectQueue

### Community 268 - "mobile.e2e-spec.ts"
Cohesion: 0.22
Nodes (5): CommandResult, ErrorBody, MobileExchange, PNG, SyncBody

### Community 269 - "CLAUDE.md — nexa_mobile (Troli App)"
Cohesion: 0.22
Nodes (8): §1 Non-negotiable principles, §2 Locked decisions, §3 Module boundary (package-by-feature, mirrors Backend §4 / Doc 19), §4 Mandatory coding rules, §5 Testing required per feature, §6 References, §7 Before Fase 0 checklist items still open, CLAUDE.md — nexa_mobile (Troli App)

### Community 270 - "RfidCardQueryDto"
Cohesion: 0.25
Nodes (7): RfidCardQueryDto, ApiPropertyOptional, IsEnum, IsInt, IsOptional, IsUUID, Min

### Community 271 - "Flutter project rules — nexa_mobile"
Cohesion: 0.25
Nodes (7): Decisions this skill assumes (source: `nexa_mobile/CLAUDE.md` §2), Domain vocabulary in code, Flutter project rules — nexa_mobile, Mandatory rules beyond the generic baseline, Module boundary (mirrors `nexa_mobile/CLAUDE.md` §3), Testing (adds to generic baseline's "write code with testing in mind"), What's still generic (unchanged from `Docs/Flutter_rules/rules.md`)

### Community 272 - "EnrollRfidCardDto"
Cohesion: 0.29
Nodes (6): EnrollRfidCardDto, ApiProperty, IsNotEmpty, IsString, IsUUID, MaxLength

### Community 273 - "mobile-dev.md"
Cohesion: 0.29
Nodes (6): Flag gaps and conflicts — don't silently paper over them, Flutter/Dart tooling — dart-flutter plugin, Provisional vs. locked decisions — stop before building on a TBD, Reuse before you build, Source of truth — read before deciding anything, The lifecycle

## Knowledge Gaps
- **969 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+964 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **113 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthenticatedUser` connect `AuthenticatedUser` to `ExchangeController`, `RequirePermissions`, `confirmation.controller.ts`, `sync.service.ts`, `device-context.guard.spec.ts`, `PrismaService`, `auth.controller.ts`, `.uploadAdjustmentEvidence`, `AuthController`, `roles.e2e-spec.ts`, `UserService`, `evidence.controller.ts`, `exchange.service.ts`, `sync-commands.ts`, `inventory-history.service.ts`, `scope.guard.ts`, `UserRepository`, `inventory.controller.ts`, `device.controller.ts`, `audit.controller.ts`, `count-session.controller.ts`, `device.service.ts`, `inventory.service.ts`, `.enroll`, `employee.controller.ts`, `master-data.controller.ts`, `InventoryHistoryController`, `MasterDataService`, `rbac.guard.ts`, `CountSessionController`, `exchange.controller.ts`, `assertFactoryScope`, `ScopedMasterDataQueryDto`, `sync.service.spec.ts`, `user.controller.ts`, `ExchangeRepository`, `@nestjs/swagger`, `RfidCardService`, `catalogue-writes.spec.ts`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `react` connect `getApiErrorMessage` to `dependencies`, `receiving-page.tsx`, `storage-screen.tsx`, `users/index.ts`, `user-write-queries.ts`, `core/master-data/index.ts`, `devices-screen.tsx`, `auth/index.ts`, `adjustment-detail-dialog.tsx`, `count-session-detail-page.tsx`, `useCurrentUser`, `client.ts`, `RequireAuth`, `exchange-trend-chart.tsx`, `useSessionBootstrapStore`, `rfid-screen.tsx`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `zod`, `scripts`, `getApiErrorMessage`, `lucide-react`, `next-themes`, `sonner`, `@tanstack/react-table`, `clsx`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _969 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `confirmation.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05920745920745921 - nodes in this community are weakly interconnected._
- **Should `constants/permissions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05217391304347826 - nodes in this community are weakly interconnected._
- **Should `receiving-page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05967027559055118 - nodes in this community are weakly interconnected._