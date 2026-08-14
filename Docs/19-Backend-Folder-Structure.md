# 19. Backend Project Folder Structure — Needle Mobile System

Status: Draft v1.0
Stack: Node.js + NestJS (TypeScript)
Referensi: `05-System-Architecture.md`, `06-Application-Architecture.md`, `09-API-Specification.md`, `10-Database-Design.md`, `11-Database-ERD-Physical-Schema.md`, `12-OpenAPI-Swagger-Specification.md`, `13-RFID-Integration-Specification.md`, `14-WhatsApp-Integration-Specification.md`, `15-Mobile-Offline-Sync-Specification.md`

---

## 1. Dasar Keputusan

Struktur ini mengikuti ADR-001 di `05-System-Architecture.md`: **Modular Monolith**, satu REST API service, satu database PostgreSQL, modul-modul dipisah secara logis (bukan microservices) agar konsistensi transaksi inventory lebih mudah dijaga, tapi tetap bisa diekstrak jadi service terpisah kelak jika skala menuntut.

Prinsip "Backend Is Authoritative" (ADR-004) berarti semua business rule dan state inventory hidup di backend — mobile/web hanya orkestrasi UI. Ini memengaruhi struktur: setiap modul domain punya lapisan `services` yang tebal (business logic), bukan sekadar CRUD tipis di controller.

Ada beberapa keputusan yang masih terbuka di dokumen (DBMS belum dikunci, ORM belum ditentukan, mekanisme auth OAuth2/JWT belum final, provider object storage & WhatsApp belum dipilih). Struktur di bawah dibuat agar keputusan-keputusan itu bisa "dicolokkan" tanpa mengubah arsitektur folder — lihat §5.

---

## 2. Struktur Folder

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── config/                          # Env & app configuration
│   │   ├── configuration.ts
│   │   ├── validation.schema.ts
│   │   └── database.config.ts
│   │
│   ├── common/                          # Cross-cutting concern, dipakai lintas modul
│   │   ├── decorators/                  # @Roles(), @FactoryScope(), @CurrentUser()
│   │   ├── guards/                      # JwtAuthGuard, RbacGuard, FactoryScopeGuard
│   │   ├── interceptors/                # AuditLogInterceptor, ResponseFormatInterceptor
│   │   ├── filters/                     # HttpExceptionFilter (error format konsisten)
│   │   ├── pipes/                       # ValidationPipe kustom
│   │   ├── middleware/                  # IdempotencyKeyMiddleware
│   │   ├── dto/                         # PaginationDto, ApiResponseDto (base/shared)
│   │   └── interfaces/
│   │
│   ├── database/
│   │   ├── migrations/                  # Selaras dgn 11-Database-ERD-Physical-Schema.md
│   │   ├── seeds/                       # Roles, permissions, factories, needle types awal
│   │   └── data-source.ts
│   │
│   ├── modules/                         # 1 folder = 1 modul domain (module boundary sesuai 06 §34)
│   │   │
│   │   ├── identity/                    # Auth, users, roles, permissions, sessions, device auth
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── repositories/
│   │   │   ├── strategies/              # JwtStrategy, RefreshTokenStrategy
│   │   │   └── identity.module.ts
│   │   │
│   │   ├── device/                      # Registrasi & binding device trolley, status device
│   │   │
│   │   ├── employee/                    # Master operator + mapping kartu RFID ke pegawai
│   │   │
│   │   ├── master-data/                 # Needle type, exchange type, storage location, factory, trolley
│   │   │
│   │   ├── exchange/                    # Transaksi tukar jarum: create, fragment validation,
│   │   │                                 #   photo evidence, issue, complete, cancel (state machine)
│   │   │
│   │   ├── approval/                    # Confirmation & approval broken-fragment (alur supervisor)
│   │   │
│   │   ├── inventory/                   # Stock balance & ledger: receiving, transfer, return,
│   │   │                                 #   adjustment, physical count
│   │   │
│   │   ├── notification/                # Notifikasi keluar (WhatsApp), template, delivery status
│   │   │
│   │   ├── audit/                       # Query/read audit log (penulisan lewat AuditLogInterceptor)
│   │   │
│   │   ├── reporting/                   # Dashboard, analytics, export job async
│   │   │
│   │   ├── synchronization/             # Mobile offline sync: bootstrap, push/pull, conflict handling
│   │   │
│   │   └── rfid/                        # Endpoint validasi RFID → lookup employee
│   │
│   ├── integrations/                    # Adapter ke sistem eksternal (provider bisa diganti tanpa
│   │   │                                 #   ubah modul domain — lihat §5 keputusan terbuka)
│   │   ├── whatsapp/                    # Provider client + webhook handler
│   │   ├── object-storage/              # Adapter upload foto evidence exchange
│   │   └── rfid-adapter/                # Adapter USB/Serial, Bluetooth, atau Vendor SDK
│   │
│   ├── jobs/                            # Background job / async processor
│   │   ├── report-export.processor.ts   # Job QUEUED → PROCESSING → COMPLETED/FAILED
│   │   └── notification-retry.processor.ts  # Retry WhatsApp dgn exponential backoff
│   │
│   └── shared/                          # Konstanta, enum, util murni (tanpa dependency ke modul lain)
│       ├── constants/
│       ├── enums/
│       └── utils/
│
├── test/
│   ├── unit/                            # Unit test per modul (business logic services)
│   └── e2e/                             # Integration test end-to-end per endpoint
│
├── docs/
│   └── openapi.json                     # Auto-generated dari @nestjs/swagger, harus selaras
│                                          #   dengan 12-OpenAPI-Swagger-Specification.md
│
├── scripts/                             # Migration runner, seed runner, utilitas ops
│
├── .env.example
├── docker-compose.yml                   # PostgreSQL + backend untuk dev lokal
├── Dockerfile
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## 3. Pemetaan Modul ke Dokumen Sumber

| Modul (`src/modules/...`) | Sumber kebutuhan | Entitas/endpoint kunci |
|---|---|---|
| `identity` | 05 §9, 09 §7-10 | users, roles, permissions, sessions, device auth, `/auth/login`, `/auth/refresh` |
| `device` | 06 §34 | devices, status registrasi trolley |
| `employee` | 05 §15, 13 | employees, rfid_cards |
| `master-data` | 05 §15 | needles, exchange_types, storage_locations, factories, trolleys |
| `exchange` | 06 §34, 05 §15 | needle_exchanges, exchange_photos (state machine create→issue→complete/cancel) |
| `approval` | 06 §34, 05 §15 | confirmations, approval_actions (broken-fragment supervisor) |
| `inventory` | 05 §15 | inventory_balances, stock_movements, stock_transfers, stock_adjustments, physical_counts |
| `notification` | 14 | WhatsApp template `BROKEN_NEEDLE_CONFIRMATION`, status QUEUED/SENT/DELIVERED/READ/FAILED |
| `audit` | 05 §27 | audit_logs — event kritikal (LOGIN, CREATE_EXCHANGE, APPROVE/REJECT, ISSUE_NEEDLE, dst.) |
| `reporting` | 04 (FR-REPORT-005), 09 §45 | `/reports/export`, `/reports/export/{job_id}` |
| `synchronization` | 15 | `/mobile/bootstrap`, `/mobile/sync` (cursor-based, clientTransactionId, Idempotency-Key) |
| `rfid` | 13 §5 | `GET /rfid/{rfidUid}/employee` |

---

## 4. Kenapa Bukan Struktur "by Layer" (controllers/ services/ terpisah di root)

Untuk modular monolith dengan rencana kemungkinan ekstraksi ke microservices (disebutkan eksplisit di 05 §36), struktur **package-by-feature** (per modul domain) lebih tepat dibanding package-by-layer (semua controller di satu folder, semua service di folder lain). Alasan:

Setiap modul jadi unit yang bisa dipahami, ditest, dan (jika perlu) diekstrak sendiri tanpa membongkar seluruh tree. Batas modul di folder ini sengaja dibuat identik dengan batas modul konseptual di `06-Application-Architecture.md` §34, supaya dokumen arsitektur dan struktur kode tidak pernah divergen.

---

## 5. Titik yang Masih Bergantung pada Keputusan Terbuka

Beberapa item di dokumen sumber masih berstatus "belum dikunci" dan berdampak langsung ke isi (bukan bentuk) folder ini:

DBMS PostgreSQL direkomendasikan (ADR-002) tapi belum final (10 §32) — memengaruhi `database/migrations` dan driver di `data-source.ts`. ORM/query builder belum dipilih — akan menentukan apakah `entities/` berisi TypeORM entity, Prisma schema, atau Drizzle schema. Mekanisme auth (JWT custom vs OAuth2/OIDC) belum final (09, Open Decisions) — memengaruhi isi `identity/strategies/`. Provider object storage dan provider WhatsApp belum dipilih (05 §16, 14) — karena sudah diisolasi di `integrations/`, penggantian provider tidak akan menyentuh modul domain manapun. Opsi koneksi RFID (USB/Serial, Bluetooth, Vendor SDK) belum final (13 §5) — sama, diisolasi di `integrations/rfid-adapter/`.

Rekomendasi: kunci DBMS + ORM sebelum coding dimulai (memengaruhi banyak file), tapi provider WhatsApp/storage/RFID bisa menyusul karena sudah dibungkus adapter.

---

## 6. Catatan untuk Persiapan Sebelum Coding di Claude Code

Struktur folder ini adalah satu bagian dari persiapan; dokumen terpisah dibutuhkan untuk: `CLAUDE.md` (aturan project-level: konvensi penamaan modul, prinsip "Backend Is Authoritative", larangan bisnis-logic di controller, referensi ke ADR di `05-System-Architecture.md`), skill khusus coding-agent per modul kompleks (mis. state machine `exchange`, cursor-sync `synchronization`), dan checklist keputusan terbuka di §5 yang perlu dikunci sebelum sprint pertama.
