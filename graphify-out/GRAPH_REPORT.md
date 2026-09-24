# Graph Report - nexa_mobile  (2026-09-24)

## Corpus Check
- 656 files · ~338,574 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 4165 nodes · 11042 edges · 291 communities (177 shown, 114 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 243 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f59ce765`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- exchange.service.ts
- RequirePermissions
- confirmation.controller.ts
- dashboard/api/data-source.ts
- prisma.service.ts
- receiving-page.tsx
- inventory/api/types.ts
- confirmation-panel.tsx
- auth/index.ts
- renderWithQueryClient
- core/master-data/index.ts
- exchange-transactions-page.test.tsx
- PrismaService
- auth/data-source.ts
- cn
- auth.ts
- auth.controller.ts
- permissions/index.ts
- dependencies
- devDependencies
- react
- getApiErrorMessage
- TokenService
- forgot-password.e2e-spec.ts
- app.module.ts
- RetentionService
- audit-log-page.test.tsx
- AppDelegate
- Database ERD & Physical Schema
- devDependencies
- .uploadAdjustmentEvidence
- notification.service.ts
- components.json
- AuthController
- roles.e2e-spec.ts
- UserService
- compilerOptions
- evidence.controller.ts
- System Architecture Document
- scripts
- http-exception.filter.ts
- evidence.service.ts
- Claude Code Backend Setup Prompting Guide
- jest
- audit.decorator.ts
- identity.module.ts
- inventory-history.service.ts
- Backend CLAUDE.md
- scope.guard.ts
- UserRepository
- inventory.controller.ts
- ListMovementsQueryDto
- @nestjs/swagger
- whatsapp.port.ts
- InventoryService
- compilerOptions
- sync.service.ts
- NotificationService
- audit.controller.ts
- count-session.controller.ts
- providers.tsx
- Backend ARCHITECTURE.md
- notification.module.ts
- DeviceService
- adjustment-detail-dialog.tsx
- my_application.cc
- transfer-page.test.tsx
- dependencies
- WebApps Dev Subagent Spec
- count-session-page.test.tsx
- status-badge.tsx
- Backend/package.json
- HealthController
- RfidController
- WhatsApp Integration Specification
- operation-history-data-source.ts
- IdempotencyStore
- employee.controller.ts
- POST /mobile/sync (client)
- stock-movement-page.test.tsx
- inventory/api/data-source.ts
- scripts
- exclude
- ADR-0001 Dashboard v1 Scoped to Existing Contract
- extends
- inventory-adjustment.spec.ts
- master-data.controller.ts
- InventoryHistoryController
- FakeResetTokenRepository
- device-detail-dialog.tsx
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
- storage-data-source.ts
- CountSessionController
- users/index.ts
- user-write-queries.ts
- confirmation.service.ts
- confirmation-monitoring-page.test.tsx
- count-session-detail-page.tsx
- .sync
- ScopedMasterDataQueryDto
- factory-queries.ts
- stock-alert-panel.tsx
- adjustment-page.test.tsx
- return-page.test.tsx
- user.controller.ts
- needle-type-queries.ts
- SyncCommandDto
- ts-node
- operation-history-types.ts
- master-data/components/columns.tsx
- authenticated-user.interface.ts
- chart.tsx
- count-session-detail-page.test.tsx
- database.config.ts
- setup-env.ts
- stock-overview-page.test.tsx
- clsx
- .enroll
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
- authMeEnvelope
- role-detail-screen.test.tsx
- users-screen-write.test.tsx
- location-data-source.ts
- win32_window.cpp
- proxy-config.test.ts
- rfid-data-source.ts
- ApiSuccessBody
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
- trolley-data-source.ts
- .findAll
- devices-screen.test.tsx
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
- DetailField
- .constructor
- kpi-card.tsx
- HealthService
- date-fns
- CLAUDE.md — nexa_mobile (Troli App)
- RfidCardQueryDto
- Flutter project rules — nexa_mobile
- @hookform/resolvers
- mobile-dev.md
- postcss
- RegisterPlugins
- tailwindcss-animate
- FlutterActivity
- nexa_mobile
- @tanstack/react-query
- LaunchImage.imageset/README.md
- vite-tsconfig-paths
- ForgotPasswordForm
- LoginForm
- ResetPasswordForm

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

## Communities (291 total, 114 thin omitted)

### Community 0 - "exchange.service.ts"
Cohesion: 0.06
Nodes (60): ExchangeController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+52 more)

### Community 1 - "RequirePermissions"
Cohesion: 0.15
Nodes (22): Audit(), Paginated(), RequirePermissions(), ExchangeTypeController, FactoryController, LocationController, NeedleTypeController, StorageMappingController (+14 more)

### Community 2 - "confirmation.controller.ts"
Cohesion: 0.08
Nodes (35): ConfirmationController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+27 more)

### Community 3 - "dashboard/api/data-source.ts"
Cohesion: 0.33
Nodes (10): FIXTURE_EXCHANGE_TREND, FIXTURE_NEEDLE_CONSUMPTION, FIXTURE_OVERVIEW, FIXTURE_STOCK_SUMMARY, DashboardFilters, DashboardOverview, ExchangeTrendPoint, NeedleConsumptionItem (+2 more)

### Community 4 - "prisma.service.ts"
Cohesion: 0.05
Nodes (46): AppModule, Module, ALLOWED_HEADERS, configureApp(), bootstrap(), PERMISSIONS, PNG, AuditRow (+38 more)

### Community 5 - "receiving-page.tsx"
Cohesion: 0.06
Nodes (83): Button, ButtonProps, buttonVariants, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogTitle (+75 more)

### Community 6 - "inventory/api/types.ts"
Cohesion: 0.08
Nodes (28): AdjustmentReasonCode, AdjustmentResult, BalanceItem, CreateAdjustmentInput, MOVEMENT_TYPE_LABELS, MOVEMENT_TYPES, MovementItem, PagedMovements (+20 more)

### Community 7 - "confirmation-panel.tsx"
Cohesion: 0.26
Nodes (16): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Skeleton(), useConfirmation() (+8 more)

### Community 8 - "auth/index.ts"
Cohesion: 0.06
Nodes (8): ForgotPasswordScreen(), LoginScreen(), RequireAuth(), ResetPasswordScreen(), ConfirmationDetailScreen(), DashboardScreen(), ExchangeDetailScreen(), AppShell()

### Community 9 - "renderWithQueryClient"
Cohesion: 0.04
Nodes (49): SessionBootstrapState, mockedFetchCurrentUser, mockReplace, mockGet, KpiRow(), EMPLOYEE, FACTORY, mockedCreateEmployee (+41 more)

### Community 10 - "core/master-data/index.ts"
Cohesion: 0.24
Nodes (17): fetchMasterData(), fetchMasterDataRow(), MasterDataQuery, Lookup, Employee, ExchangeType, Location, LOCATION_TYPE_LABELS (+9 more)

### Community 11 - "exchange-transactions-page.test.tsx"
Cohesion: 0.10
Nodes (22): fetchExchangeDetail(), fetchExchangeEvidence(), fetchExchanges(), useExchangeDetail(), useExchangeEvidence(), useExchangeList(), EvidenceItem, EXCHANGE_STATES (+14 more)

### Community 12 - "PrismaService"
Cohesion: 0.05
Nodes (33): PrismaService, Injectable, NumberSequenceService, PREFIXES, SEQUENCE_SCOPES, Injectable, ConcurrentAdjustmentError, CompletedCountSession (+25 more)

### Community 13 - "auth/data-source.ts"
Cohesion: 0.08
Nodes (37): apiClient, DEFAULT_ERROR_MESSAGE, refreshAccessToken(), SERVER_UNREACHABLE_MESSAGE, config, fetchCurrentUser(), forgotPassword(), login() (+29 more)

### Community 14 - "cn"
Cohesion: 0.10
Nodes (28): DialogOverlay, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut() (+20 more)

### Community 15 - "auth.ts"
Cohesion: 0.13
Nodes (11): Captured, envelope(), makeEntry(), mockAuditApi(), USERS, mockLoggedOut(), unauthorized(), CapturedRequest (+3 more)

### Community 16 - "auth.controller.ts"
Cohesion: 0.12
Nodes (19): LoginResponseDto, LoginUserDto, MeResponseDto, TokenPairDto, ApiProperty, ForgotPasswordDto, ApiProperty, MaxLength (+11 more)

### Community 17 - "permissions/index.ts"
Cohesion: 0.15
Nodes (21): useCurrentUser(), Factory, useAuthorizedFactories(), hasAllPermissions(), hasAnyPermission(), hasPermission(), PermissionCode, PermissionHolder (+13 more)

### Community 18 - "dependencies"
Cohesion: 0.04
Nodes (47): dependencies, bcryptjs, bullmq, class-transformer, class-validator, dotenv, ioredis, joi (+39 more)

### Community 19 - "devDependencies"
Cohesion: 0.07
Nodes (29): eslint-config-next, jsdom, @playwright/test, tailwindcss, @testing-library/jest-dom, @testing-library/react, @testing-library/user-event, @types/react (+21 more)

### Community 20 - "react"
Cohesion: 0.05
Nodes (67): react, react, TabsContent, TabsList, TabsTrigger, useCountSessions(), CountSessionStatus, useAdjustments() (+59 more)

### Community 21 - "getApiErrorMessage"
Cohesion: 0.08
Nodes (64): API_BASE_PATH, ApiErrorBody, ApiResponseMeta, getApiErrorMessage(), hasErrorEnvelope(), MUTATING_METHODS, displayLabel(), useMasterData() (+56 more)

### Community 22 - "TokenService"
Cohesion: 0.09
Nodes (8): RefreshTokenRepository, Injectable, TokenService, Injectable, parseDurationToSeconds(), UNIT_SECONDS, FakeRefreshTokenRepository, USER

### Community 23 - "forgot-password.e2e-spec.ts"
Cohesion: 0.14
Nodes (11): EmailModule, Module, EMAIL_CLIENT, EmailMessage, EmailPort, ADR-0002, NodemailerEmailAdapter, ADR-0002 (+3 more)

### Community 24 - "app.module.ts"
Cohesion: 0.06
Nodes (32): IS_PUBLIC_KEY, REQUIRED_PERMISSIONS_KEY, JwtAuthGuard, Injectable, RbacGuard, Injectable, IdempotencyModule, Global (+24 more)

### Community 25 - "RetentionService"
Cohesion: 0.12
Nodes (12): RecordRetentionProcessor, Processor, RETENTION_QUEUE, RETENTION_SWEEP_JOB, RetentionModule, InjectQueue, Module, RetentionService (+4 more)

### Community 26 - "audit-log-page.test.tsx"
Cohesion: 0.15
Nodes (16): fetchAuditLogs(), auditKeys, useAuditLogs(), AUDIT_ACTIONS, AuditAction, AuditLogEntry, AuditLogFilters, DEFAULT_AUDIT_FILTERS (+8 more)

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

### Community 31 - "notification.service.ts"
Cohesion: 0.15
Nodes (15): ADR-0006, resolveTemplateVariables(), STUCK_REASONS, STUCK_TEXT, StuckReason, stuckReasonText(), TEMPLATE_VARIABLES, TemplateCode (+7 more)

### Community 32 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 33 - "AuthController"
Cohesion: 0.23
Nodes (15): Public(), AuthController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller (+7 more)

### Community 34 - "roles.e2e-spec.ts"
Cohesion: 0.11
Nodes (24): humanize(), IdentitySeedResult, ROLE_DESCRIPTIONS, seedAdminUser(), seedIdentity(), seedPermissions(), seedRoles(), MasterDataSeedResult (+16 more)

### Community 35 - "UserService"
Cohesion: 0.11
Nodes (24): ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser, Get (+16 more)

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
Cohesion: 0.10
Nodes (19): PAGINATED_KEY, ApiErrorBodyDto, ApiErrorDto, ApiSuccessDto, PaginatedPayload, ResponseMetaDto, ApiProperty, ApiPropertyOptional (+11 more)

### Community 41 - "evidence.service.ts"
Cohesion: 0.10
Nodes (15): DomainException, ERROR_CODES, ErrorCode, ADR-0005, isEvidenceComplete(), missingEvidenceTypes(), requiredEvidenceTypes(), ALLOWED_MIME_TYPES (+7 more)

### Community 42 - "Claude Code Backend Setup Prompting Guide"
Cohesion: 0.17
Nodes (19): Root CLAUDE.md, Exchange State Machine (CREATED→COMPLETED), State-Based UI (ExchangeState drives actions), Catatan Penggunaan, Fase 0 — Kunci Keputusan Terbuka, Fase 10 — Modul Synchronization, Fase 11 — Kontrak API & Dokumentasi, Fase 12 — Test Menyeluruh & Docker (+11 more)

### Community 43 - "jest"
Cohesion: 0.11
Nodes (18): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, moduleNameMapper, rootDir, roots, testEnvironment (+10 more)

### Community 44 - "audit.decorator.ts"
Cohesion: 0.11
Nodes (16): AuditRecord, AuditWriter, AuditWriterModule, Global, Module, SNAPSHOT_FIELDS, Injectable, AUDIT_ACTIONS (+8 more)

### Community 45 - "identity.module.ts"
Cohesion: 0.10
Nodes (10): IdentityModule, Module, PasswordResetTokenRepository, Injectable, PASSWORD_HASH_ROUNDS, PasswordResetService, Inject, Injectable (+2 more)

### Community 46 - "inventory-history.service.ts"
Cohesion: 0.08
Nodes (14): MinioObjectStorageAdapter, Injectable, OBJECT_STORAGE, ObjectStoragePort, StoredObject, Inject, AdjustmentEvidenceService, EvidenceWithUrl (+6 more)

### Community 47 - "Backend CLAUDE.md"
Cohesion: 0.12
Nodes (17): Exchange State Machine (Pure Function), Side Effects Happen After Commit, ADR-001 Modular Monolith, Backend CLAUDE.md, approval module, audit module, device module, employee module (+9 more)

### Community 48 - "scope.guard.ts"
Cohesion: 0.17
Nodes (6): FACTORY_SCOPE_KEY, LOCATION_SCOPE_KEY, ScopeSource, ScopeGuard, Injectable, picFactoryA

### Community 49 - "UserRepository"
Cohesion: 0.11
Nodes (13): LoginDto, ApiProperty, IsNotEmpty, IsString, MaxLength, Injectable, UserRepository, AuthService (+5 more)

### Community 50 - "inventory.controller.ts"
Cohesion: 0.15
Nodes (28): NOT_FOUND, AdjustmentDetailResponseDto, AdjustmentEvidenceItemDto, AdjustmentEvidenceResponseDto, AdjustmentHistoryResponseDto, AdjustmentResponseDto, BalanceResponseDto, CompleteCountSessionResponseDto (+20 more)

### Community 51 - "ListMovementsQueryDto"
Cohesion: 0.24
Nodes (18): ListAdjustmentsQueryDto, ListBalancesQueryDto, ListCountSessionsQueryDto, ListMovementsQueryDto, ListOperationHistoryQueryDto, ApiPropertyOptional, ADR-0003, IsDate (+10 more)

### Community 52 - "@nestjs/swagger"
Cohesion: 0.08
Nodes (30): CurrentUser, CurrentDevice, RequireDeviceContext(), DeviceContext, RequestWithContext, REQUEST_ID_HEADER, RequestIdMiddleware, Injectable (+22 more)

### Community 53 - "whatsapp.port.ts"
Cohesion: 0.22
Nodes (10): MetaCloudWhatsAppAdapter, MetaSendResponse, Injectable, Module, WhatsAppModule, ADR-0006, WHATSAPP_CLIENT, WhatsAppMessage (+2 more)

### Community 54 - "InventoryService"
Cohesion: 0.11
Nodes (9): StockStatus, CountSessionService, Injectable, InventoryHistoryService, Injectable, InventoryService, PagedRows, TrolleyStockItem (+1 more)

### Community 55 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, @testing-library/jest-dom, **/*.tsx, vitest/globals (+20 more)

### Community 56 - "sync.service.ts"
Cohesion: 0.10
Nodes (20): toExchangeResponse(), ExchangeRepository, Injectable, BootstrapService, Injectable, ChangedRow, SyncChangesService, toMobileExchange() (+12 more)

### Community 57 - "NotificationService"
Cohesion: 0.22
Nodes (4): NotificationDispatchProcessor, Processor, NotificationService, Injectable

### Community 58 - "audit.controller.ts"
Cohesion: 0.08
Nodes (27): AuditModule, Module, AuditController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller (+19 more)

### Community 59 - "count-session.controller.ts"
Cohesion: 0.16
Nodes (25): NOT_FOUND, NOT_OPEN, AddCountItemDto, CreateAdjustmentDto, CreateCountSessionDto, CreateReceivingDto, CreateReturnDto, CreateTransferDto (+17 more)

### Community 60 - "providers.tsx"
Cohesion: 0.15
Nodes (10): inter, jetbrainsMono, metadata, RootLayout(), Providers(), Toaster(), QueryProvider(), ThemeProvider() (+2 more)

### Community 61 - "Backend ARCHITECTURE.md"
Cohesion: 0.23
Nodes (12): Backend ARCHITECTURE.md, ADR-002 PostgreSQL, Backend docker-compose.yml, minio service, minio-init service, postgres service, redis service, Backend README.md (+4 more)

### Community 62 - "notification.module.ts"
Cohesion: 0.31
Nodes (5): HealthModule, Module, NOTIFICATION_DISPATCH_JOB, NOTIFICATION_QUEUE, DispatchJobData

### Community 63 - "DeviceService"
Cohesion: 0.07
Nodes (39): DeviceController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+31 more)

### Community 64 - "adjustment-detail-dialog.tsx"
Cohesion: 0.21
Nodes (18): useLookup(), ADJUSTMENT_REASON_LABELS, RelocationHistoryItem, RelocationKind, adjustmentColumns, AdjustmentSource(), SystemToActual(), AdjustmentDetailDialog() (+10 more)

### Community 65 - "my_application.cc"
Cohesion: 0.09
Nodes (22): FlPluginRegistry, FlView, GApplication, gboolean, gchar, GObject, GtkApplication, MyApplicationClass (+14 more)

### Community 66 - "transfer-page.test.tsx"
Cohesion: 0.12
Nodes (13): DESTINATION_LOCATION, FACTORY, makePaged(), makeTransfer(), mockedCreateTransfer, mockedFetchAllUsers, mockedFetchBalances, mockedFetchCurrentUser (+5 more)

### Community 67 - "dependencies"
Cohesion: 0.07
Nodes (27): axios, class-variance-authority, radix-ui, react-dom, react-hook-form, recharts, sonner, tailwind-merge (+19 more)

### Community 68 - "WebApps Dev Subagent Spec"
Cohesion: 0.24
Nodes (11): ADR-004 Backend Is the Stock Authority, WebApps Dev Subagent Spec, Flag Gaps and Conflicts Principle, 10-Stage Development Lifecycle, Reuse Before You Build Principle, WebApps Stack Decision, OpenAPI/Swagger Specification, WebApps UI/UX Specification (+3 more)

### Community 69 - "count-session-page.test.tsx"
Cohesion: 0.07
Nodes (39): addCountItem(), cancelCountSession(), completeCountSession(), createCountSession(), fetchCountSession(), fetchCountSessions(), countSessionKeys, useAddCountItem() (+31 more)

### Community 70 - "status-badge.tsx"
Cohesion: 0.23
Nodes (9): Badge(), BadgeProps, badgeVariants, BadgeVariant, EXCHANGE_STATE_CONFIG, STATUS_CONFIG, StatusBadge(), StatusConfig (+1 more)

### Community 71 - "Backend/package.json"
Cohesion: 0.20
Nodes (9): description, engines, node, license, name, prisma, seed, private (+1 more)

### Community 72 - "HealthController"
Cohesion: 0.29
Nodes (7): HealthController, ApiOperation, ApiResponse, ApiTags, Controller, Get, HealthStatus

### Community 73 - "RfidController"
Cohesion: 0.19
Nodes (10): RfidController, ApiBearerAuth, ApiTags, Controller, RfidCardResponseDto, RfidLookupCardDto, RfidLookupEmployeeDto, RfidLookupResponseDto (+2 more)

### Community 74 - "WhatsApp Integration Specification"
Cohesion: 0.31
Nodes (10): OpenAPI / Swagger Specification, Offline RFID Policy Deferral, RFID Integration Specification, WhatsApp Integration Specification, Mobile Offline Sync Specification, Mobile UI/UX Specification, WebApps UI/UX Specification, Backend Folder Structure (+2 more)

### Community 75 - "operation-history-data-source.ts"
Cohesion: 0.23
Nodes (17): fetchAdjustment(), fetchAdjustments(), fetchReturn(), fetchReturns(), fetchTransfer(), fetchTransfers(), historyParams(), toPaged() (+9 more)

### Community 76 - "IdempotencyStore"
Cohesion: 0.16
Nodes (5): IdempotencyStore, Injectable, IdempotencyKeyMiddleware, Injectable, messagesOf()

### Community 77 - "employee.controller.ts"
Cohesion: 0.08
Nodes (31): EmployeeController, FORBIDDEN, NOT_FOUND, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body (+23 more)

### Community 78 - "POST /mobile/sync (client)"
Cohesion: 0.22
Nodes (9): Master Data APIs, POST /mobile/sync, Employee Resolution via RFID, BROKEN_NEEDLE_CONFIRMATION Message Template, POST /mobile/sync (client), Pending Sync Screen, Module-to-Document Mapping Table, GAP-03 Master-Data Read API (+1 more)

### Community 79 - "stock-movement-page.test.tsx"
Cohesion: 0.22
Nodes (8): LOCATION, makeItem(), makePaged(), mockedFetchAllUsers, mockedFetchCurrentUser, mockedFetchMasterData, mockedFetchMovements, NEEDLE_TYPE

### Community 80 - "inventory/api/data-source.ts"
Cohesion: 0.13
Nodes (24): createAdjustment(), createReceiving(), createReturn(), createTransfer(), fetchBalances(), fetchMovements(), fetchTrolleyStock(), useBalances() (+16 more)

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
Cohesion: 0.12
Nodes (41): DUPLICATE_CODE, EDIT_FORBIDDEN, FORBIDDEN, NOT_FOUND, CREATABLE_LOCATION_TYPES, CreatableLocationType, CreateFactoryDto, CreateLocationDto (+33 more)

### Community 87 - "InventoryHistoryController"
Cohesion: 0.19
Nodes (13): InventoryHistoryController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+5 more)

### Community 89 - "device-detail-dialog.tsx"
Cohesion: 0.14
Nodes (20): buildDeviceQrPayload(), DEVICE_QR_TYPE, DEVICE_QR_VERSION, DeviceQrPayload, DEVICE, formatLastSeen(), copyText(), DeviceDetailDialog() (+12 more)

### Community 90 - "integrations/ Adapter Isolation Pattern"
Cohesion: 0.40
Nodes (5): WhatsApp Notification Flow (Backend Internal), Reader Integration Modes (USB/Bluetooth/Vendor SDK), POST /internal/notifications/whatsapp Payload, Evidence Upload Flow (Photo → Object Storage), integrations/ Adapter Isolation Pattern

### Community 91 - "AuthenticatedUser"
Cohesion: 0.16
Nodes (3): AuthenticatedUser, MasterDataService, Injectable

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
Cohesion: 0.24
Nodes (13): createStorageMapping(), fetchStorageMappings(), updateStorageMapping(), storageMappingKeys, useCreateStorageMapping(), useStorageMappings(), useUpdateStorageMapping(), CreateStorageMappingInput (+5 more)

### Community 103 - "CountSessionController"
Cohesion: 0.23
Nodes (14): CountSessionController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+6 more)

### Community 104 - "users/index.ts"
Cohesion: 0.18
Nodes (21): fetchAllUsers(), fetchUser(), fetchUsers(), userDisplayLabel(), userKeys, UserLookup, useUserLookup(), useUsersByRole() (+13 more)

### Community 105 - "user-write-queries.ts"
Cohesion: 0.19
Nodes (20): assignFactoryScope(), assignRole(), createUser(), revokeFactoryScope(), revokeRole(), updateUser(), useAssignFactoryScope(), useAssignRole() (+12 more)

### Community 106 - "confirmation.service.ts"
Cohesion: 0.11
Nodes (11): CONFIRMATION_EXPIRY_JOB, CONFIRMATION_EXPIRY_QUEUE, ConfirmationExpiryProcessor, Processor, ApprovalModule, InjectQueue, Module, CONFIRMATION_INCLUDE (+3 more)

### Community 107 - "confirmation-monitoring-page.test.tsx"
Cohesion: 0.10
Nodes (26): approveConfirmation(), fetchConfirmation(), fetchConfirmations(), rejectConfirmation(), confirmationKeys, useApproveConfirmation(), useConfirmationList(), useRejectConfirmation() (+18 more)

### Community 108 - "count-session-detail-page.tsx"
Cohesion: 0.20
Nodes (15): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow (+7 more)

### Community 109 - ".sync"
Cohesion: 0.14
Nodes (13): MobileController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Body, Controller, CurrentUser (+5 more)

### Community 110 - "ScopedMasterDataQueryDto"
Cohesion: 0.27
Nodes (9): MasterDataQueryDto, ScopedMasterDataQueryDto, StorageMappingQueryDto, ApiPropertyOptional, IsEnum, IsInt, IsOptional, IsUUID (+1 more)

### Community 111 - "factory-queries.ts"
Cohesion: 0.19
Nodes (16): authKeys, Factory, activateFactory(), createFactory(), deactivateFactory(), updateFactory(), useActivateFactory(), useCreateFactory() (+8 more)

### Community 112 - "stock-alert-panel.tsx"
Cohesion: 0.15
Nodes (22): delayed(), fetchDashboardOverview(), fetchExchangeTrend(), fetchNeedleConsumption(), fetchStockSummary(), dashboardKeys, useDashboardOverview(), useExchangeTrend() (+14 more)

### Community 113 - "adjustment-page.test.tsx"
Cohesion: 0.10
Nodes (15): AdjustmentDetail, AdjustmentHistoryItem, FACTORY, LOCATION, makeAdjustment(), makePaged(), mockedCreateAdjustment, mockedFetchAdjustment (+7 more)

### Community 114 - "return-page.test.tsx"
Cohesion: 0.11
Nodes (14): FACTORY, makePaged(), makeReturn(), mockedCreateReturn, mockedFetchAllUsers, mockedFetchBalances, mockedFetchCurrentUser, mockedFetchMasterData (+6 more)

### Community 115 - "user.controller.ts"
Cohesion: 0.10
Nodes (24): FORBIDDEN, GRANT_FORBIDDEN, NOT_FOUND, AssignFactoryScopeDto, AssignRoleDto, CreateUserDto, ApiProperty, ApiPropertyOptional (+16 more)

### Community 116 - "needle-type-queries.ts"
Cohesion: 0.21
Nodes (15): NeedleType, activateNeedleType(), createNeedleType(), deactivateNeedleType(), updateNeedleType(), useActivateNeedleType(), useCreateNeedleType(), useDeactivateNeedleType() (+7 more)

### Community 117 - "SyncCommandDto"
Cohesion: 0.12
Nodes (23): BootstrapQueryDto, SyncCommandDto, SyncRequestDto, ApiProperty, ApiPropertyOptional, ArrayMaxSize, IsArray, IsIn (+15 more)

### Community 119 - "operation-history-types.ts"
Cohesion: 0.21
Nodes (14): useUploadAdjustmentEvidence(), ADJUSTMENT_REASON_CODES, AdjustmentEvidence, EVIDENCE_MAX_BYTES, EVIDENCE_MAX_FILES, EVIDENCE_MIME_TYPES, ReturnHistoryItem, StockRelocationBase (+6 more)

### Community 120 - "master-data/components/columns.tsx"
Cohesion: 0.14
Nodes (11): CODE_CELL(), codeColumn(), employeeColumns, exchangeTypeColumns, factoryColumns, locationColumns, needleTypeColumns, rfidCardColumns (+3 more)

### Community 121 - "authenticated-user.interface.ts"
Cohesion: 0.06
Nodes (24): DEVICE_ID_HEADER, DeviceContextGuard, Injectable, assertFactoryScope(), isInFactoryScope(), JwtPayload, ADR-0004, PagedRows (+16 more)

### Community 122 - "chart.tsx"
Cohesion: 0.21
Nodes (11): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), getPayloadConfigFromPayload(), INITIAL_DIMENSION (+3 more)

### Community 123 - "count-session-detail-page.test.tsx"
Cohesion: 0.13
Nodes (11): FACTORY, LOCATION, mockedAddItem, mockedCancel, mockedComplete, mockedFetchAllUsers, mockedFetchBalances, mockedFetchCurrentUser (+3 more)

### Community 126 - "stock-overview-page.test.tsx"
Cohesion: 0.15
Nodes (12): PagedBalances, TrolleyStock, FACTORY, LOCATION, makeItem(), makePaged(), mockedFetchBalances, mockedFetchCurrentUser (+4 more)

### Community 128 - ".enroll"
Cohesion: 0.28
Nodes (9): ApiOperation, ApiResponse, Body, CurrentUser, Get, HttpCode, Param, Post (+1 more)

### Community 148 - "main.dart"
Cohesion: 0.12
Nodes (16): build, _counter, createState, _incrementCounter, main, MyApp, MyHomePage, _MyHomePageState (+8 more)

### Community 149 - "1. Fase 0 — Yang Harus Selesai *Sebelum* Membuka Claude Code"
Cohesion: 0.14
Nodes (13): 0. Kenapa Dokumen Ini Ada, 1.1 Verifikasi kontrak API mobile vs backend aktual, 1.2 Kunci keputusan teknis terbuka, 1.3 `Mobile/CLAUDE.md` — root rules untuk Claude Code, 1.4 `Docs/22-Mobile-Folder-Structure.md`, 1.5 Agent routing — `Docs/agents/mobile-dev.md`, 1.6 SKILL.md yang paling relevan, 1.7 Pemecahan tiket di `.scratch/` (+5 more)

### Community 152 - "authMeEnvelope"
Cohesion: 0.17
Nodes (15): Captured, envelope(), FACTORY, makeUser(), mockUsersApi(), envelope(), makeItem(), mockConfirmationsApi() (+7 more)

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

### Community 159 - "rfid-data-source.ts"
Cohesion: 0.27
Nodes (11): enrollRfidCard(), fetchRfidCards(), revokeRfidCard(), useEnrollRfidCard(), useRevokeRfidCard(), useRfidCards(), EnrollRfidCardInput, EntityStatus (+3 more)

### Community 160 - "ApiSuccessBody"
Cohesion: 0.23
Nodes (10): ApiSuccessBody, masterDataKeys, createEmployee(), updateEmployee(), useCreateEmployee(), useUpdateEmployee(), CreateEmployeeInput, EntityStatus (+2 more)

### Community 162 - "storage-screen.test.tsx"
Cohesion: 0.15
Nodes (9): EXCHANGE_TYPE, FACTORY, MAPPING, mockedCreateStorageMapping, mockedFetchCurrentUser, mockedFetchMasterData, mockedFetchStorageMappings, STORAGE_LOCATION (+1 more)

### Community 235 - "devices-screen.tsx"
Cohesion: 0.09
Nodes (37): activateDevice(), fetchDevices(), reassignDevice(), registerDevice(), revokeDevice(), deviceKeys, useActivateDevice(), useDevices() (+29 more)

### Community 242 - "sync.service.spec.ts"
Cohesion: 0.22
Nodes (7): ClaimRequest, ClaimResult, build(), device, exchangeRow(), FakeStore, user

### Community 243 - "FlutterWindow"
Cohesion: 0.13
Nodes (15): DartProject, HWND, LPARAM, LRESULT, UINT, WPARAM, FlutterWindow, flutter_controller_ (+7 more)

### Community 244 - "trolley-screen.test.tsx"
Cohesion: 0.20
Nodes (7): FACTORY, LOCATION, mockedCreate, mockedFetchCurrentUser, mockedFetchMasterData, mockedUpdate, TROLLEY

### Community 245 - "mobile-response.dto.ts"
Cohesion: 0.18
Nodes (18): BootstrapDeviceDto, BootstrapExchangeTypeDto, BootstrapFactoryDto, BootstrapNeedleTypeDto, BootstrapResponseDto, BootstrapStorageMappingDto, BootstrapTrolleyDto, MasterDataVersionsDto (+10 more)

### Community 246 - "administration-roles.spec.ts"
Cohesion: 0.32
Nodes (7): Captured, envelope(), FACTORY, makeMember(), mockRolesApi(), PERMISSIONS, ROLES

### Community 247 - "trolley-data-source.ts"
Cohesion: 0.38
Nodes (7): createTrolley(), updateTrolley(), useCreateTrolley(), useUpdateTrolley(), CreateTrolleyInput, EntityStatus, UpdateTrolleyInput

### Community 248 - ".findAll"
Cohesion: 0.17
Nodes (10): RoleController, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, Controller, CurrentUser, Get (+2 more)

### Community 249 - "devices-screen.test.tsx"
Cohesion: 0.28
Nodes (7): makeDevice(), makePaged(), mockedFetchCurrentUser, mockedFetchDevices, mockedFetchMasterData, openDetail(), qrValues

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
Cohesion: 0.22
Nodes (9): _In_, _In_opt_, wWinMain(), wchar_t, CreateAndAttachConsole(), GetCommandLineArguments(), Utf8FromUtf16(), string (+1 more)

### Community 254 - "audit.service.spec.ts"
Cohesion: 0.12
Nodes (8): FindManyArgs, multiFactory, viewer, build(), user, withLocations(), createDto, user

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

### Community 267 - "HealthService"
Cohesion: 0.33
Nodes (3): HealthService, Injectable, InjectQueue

### Community 269 - "CLAUDE.md — nexa_mobile (Troli App)"
Cohesion: 0.22
Nodes (8): §1 Non-negotiable principles, §2 Locked decisions, §3 Module boundary (package-by-feature, mirrors Backend §4 / Doc 19), §4 Mandatory coding rules, §5 Testing required per feature, §6 References, §7 Before Fase 0 checklist items still open, CLAUDE.md — nexa_mobile (Troli App)

### Community 270 - "RfidCardQueryDto"
Cohesion: 0.25
Nodes (7): RfidCardQueryDto, ApiPropertyOptional, IsEnum, IsInt, IsOptional, IsUUID, Min

### Community 271 - "Flutter project rules — nexa_mobile"
Cohesion: 0.25
Nodes (7): Decisions this skill assumes (source: `nexa_mobile/CLAUDE.md` §2), Domain vocabulary in code, Flutter project rules — nexa_mobile, Mandatory rules beyond the generic baseline, Module boundary (mirrors `nexa_mobile/CLAUDE.md` §3), Testing (adds to generic baseline's "write code with testing in mind"), What's still generic (unchanged from `Docs/Flutter_rules/rules.md`)

### Community 273 - "mobile-dev.md"
Cohesion: 0.29
Nodes (6): Flag gaps and conflicts — don't silently paper over them, Flutter/Dart tooling — dart-flutter plugin, Provisional vs. locked decisions — stop before building on a TBD, Reuse before you build, Source of truth — read before deciding anything, The lifecycle

## Knowledge Gaps
- **975 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+970 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **114 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthenticatedUser` connect `AuthenticatedUser` to `exchange.service.ts`, `RequirePermissions`, `confirmation.controller.ts`, `.enroll`, `PrismaService`, `auth.controller.ts`, `app.module.ts`, `.uploadAdjustmentEvidence`, `AuthController`, `roles.e2e-spec.ts`, `UserService`, `evidence.controller.ts`, `evidence.service.ts`, `audit.decorator.ts`, `inventory-history.service.ts`, `scope.guard.ts`, `UserRepository`, `inventory.controller.ts`, `@nestjs/swagger`, `InventoryService`, `sync.service.ts`, `audit.controller.ts`, `count-session.controller.ts`, `DeviceService`, `employee.controller.ts`, `master-data.controller.ts`, `InventoryHistoryController`, `CountSessionController`, `confirmation.service.ts`, `.sync`, `sync.service.spec.ts`, `user.controller.ts`, `.findAll`, `authenticated-user.interface.ts`, `audit.service.spec.ts`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `adjustment-detail-dialog.tsx`, `dependencies`, `receiving-page.tsx`, `count-session-page.test.tsx`, `confirmation-panel.tsx`, `users/index.ts`, `user-write-queries.ts`, `auth/index.ts`, `devices-screen.tsx`, `auth/data-source.ts`, `cn`, `inventory/api/data-source.ts`, `permissions/index.ts`, `getApiErrorMessage`, `operation-history-types.ts`, `device-detail-dialog.tsx`, `chart.tsx`, `providers.tsx`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `PrismaService` connect `PrismaService` to `exchange.service.ts`, `prisma.service.ts`, `.constructor`, `HealthService`, `TokenService`, `forgot-password.e2e-spec.ts`, `app.module.ts`, `RetentionService`, `notification.service.ts`, `roles.e2e-spec.ts`, `UserService`, `evidence.service.ts`, `audit.decorator.ts`, `identity.module.ts`, `inventory-history.service.ts`, `UserRepository`, `InventoryService`, `sync.service.ts`, `NotificationService`, `audit.controller.ts`, `notification.module.ts`, `DeviceService`, `IdempotencyStore`, `master-data.controller.ts`, `AuthenticatedUser`, `confirmation.service.ts`, `sync.service.spec.ts`, `mobile-response.dto.ts`, `.findAll`, `authenticated-user.interface.ts`, `audit.service.spec.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _975 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `exchange.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06320197982105463 - nodes in this community are weakly interconnected._
- **Should `confirmation.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07918552036199095 - nodes in this community are weakly interconnected._
- **Should `prisma.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0454172366621067 - nodes in this community are weakly interconnected._