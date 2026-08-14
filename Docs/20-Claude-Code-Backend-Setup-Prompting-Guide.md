# 20. Panduan Prompting Claude Code — Setup Backend Needle Mobile System

> **Superseded (2026-08-13).** Backend setup selesai — semua fase di dokumen ini sudah dijalankan lewat tiket 01–17 di `.scratch/exchange/issues/`. Keputusan "Fase 0" (DBMS, ORM, auth) sudah dikunci: PostgreSQL, Prisma, JWT custom. Referensi `CLAUDE.md` §3/§5/§6 di bawah menunjuk penomoran lama; aturan yang berlaku sekarang ada di `Backend/CLAUDE.md` §2 (ADR), §3 (batas modul) dan §4 (aturan coding). Dokumen ini disimpan sebagai catatan historis — jangan jalankan promptnya lagi.

Urutan ini disusun berdasarkan dependency antar modul (Identity duluan karena semua modul lain butuh auth+RBAC; Master Data sebelum Exchange karena Exchange butuh needle type/exchange type; Inventory sebelum Exchange selesai karena Exchange men-trigger mutasi stok, dst).

Sebelum mulai: pastikan folder repo backend sudah berisi `CLAUDE.md` (di root) dan Anda punya akses ke folder `Docs/` yang berisi 19 dokumen sumber, karena semua prompt di bawah mengasumsikan Claude Code bisa membaca keduanya.

---

## Fase 0 — Kunci Keputusan Terbuka (lakukan di luar Claude Code, atau sebagai prompt pertama)

Sebelum coding, putuskan 3 hal yang paling berdampak luas (lihat `CLAUDE.md` §6): DBMS final, ORM, mekanisme auth. Sisanya (provider WhatsApp/storage/RFID) bisa menyusul karena sudah diisolasi di `integrations/`.

**Prompt:**
```
Baca CLAUDE.md dan Docs/05-System-Architecture.md §36 dan §39 (Open Architecture
Decisions). Rangkum keputusan yang masih terbuka terkait DBMS, ORM, dan mekanisme
auth, beserta trade-off masing-masing opsi. Jangan buat kode apa pun di step ini,
saya perlu memutuskan dulu.
```

Setelah Anda memutuskan, update `CLAUDE.md` §6 secara manual (atau minta Claude Code melakukannya) sebelum lanjut ke Fase 1.

---

## Fase 1 — Scaffold Project

**Prompt:**
```
Scaffold project NestJS baru di folder backend/ menggunakan struktur folder yang
didefinisikan di Docs/19-Backend-Folder-Structure.md. Install dependency dasar:
@nestjs/config, @nestjs/swagger, class-validator, class-transformer, dan
[ORM pilihan hasil Fase 0]. Buat app.module.ts kosong, main.ts dengan global
ValidationPipe dan Swagger setup mengarah ke /docs. Jangan implementasi modul
domain apa pun dulu — hanya kerangka project.
```

**Prompt lanjutan (config & env):**
```
Buat src/config/configuration.ts dan validation.schema.ts untuk env variables:
DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, PORT, NODE_ENV. Buat .env.example
sesuai itu. Ikuti konvensi di CLAUDE.md §3.
```

---

## Fase 2 — Cross-Cutting Layer (`common/`)

Modul domain nanti akan bergantung ke layer ini, jadi harus jadi duluan.

**Prompt:**
```
Baca CLAUDE.md §5 (Aturan Coding Wajib) dan Docs/05-System-Architecture.md §23
(Synchronization & Idempotency), §25 (Authorization Architecture), §27 (Audit
Architecture). Implementasikan di src/common/:
1. middleware/idempotency-key.middleware.ts — cek client_transaction_id/
   Idempotency-Key header, simpan hasil request pertama, return hasil yang sama
   pada retry.
2. guards/jwt-auth.guard.ts dan guards/rbac.guard.ts — validasi token + cek
   permission berdasarkan role + factory scope + location scope (5 dimensi,
   jangan asumsikan permission saling mengimplikasikan).
3. interceptors/audit-log.interceptor.ts — catat event dari daftar critical
   events di CLAUDE.md §5 ke tabel audit_logs.
4. filters/http-exception.filter.ts — format error response konsisten.
Belum perlu entity database nyata, buat interface/DTO placeholder dulu.
```

---

## Fase 3 — Database Schema & Migration

**Prompt:**
```
Baca Docs/11-Database-ERD-Physical-Schema.md secara penuh. Buat migration
[ORM pilihan] di src/database/migrations/ untuk seluruh tabel yang didefinisikan
di dokumen tersebut (users, roles, permissions, factories, trolleys, devices,
employees, rfid_cards, needles, exchange_types, storage_locations,
needle_exchanges, exchange_photos, confirmations, approval_actions,
inventory_balances, stock_movements, stock_transfers, stock_adjustments,
physical_counts, notifications, audit_logs, system_configurations). Ikuti tipe
kolom, constraint, dan relasi persis seperti di dokumen — jangan modifikasi
skema tanpa flag ke saya. Buat juga src/database/seeds/ untuk data awal: roles,
permissions dasar, dan minimal satu factory + trolley untuk development.
```

---

## Fase 4 — Modul Identity (fondasi semua modul lain)

**Prompt:**
```
Implementasikan modul src/modules/identity/ sesuai Docs/09-API-Specification.md
§7-10 (auth endpoints, users, roles, permissions) dan Docs/05-System-Architecture.md
§25 (Authorization). Endpoint: POST /api/v1/auth/login, POST /api/v1/auth/refresh,
CRUD /api/v1/users terbatas sesuai permission. Gunakan guard dan middleware dari
Fase 2. Sertakan unit test untuk logic login + refresh token, dan e2e test untuk
endpoint login.
```

---

## Fase 5 — Modul Pendukung: Device, Employee, Master Data

Ketiganya relatif independen satu sama lain, bisa diminta sekaligus atau berurutan.

**Prompt:**
```
Implementasikan tiga modul berikut sesuai Docs/09-API-Specification.md dan
Docs/05-System-Architecture.md §9:
1. src/modules/device/ — registrasi & binding device trolley (endpoint /api/v1/devices).
2. src/modules/employee/ — master operator + mapping RFID card (endpoint
   /api/v1/employees, /api/v1/rfid).
3. src/modules/master-data/ — needle types, exchange types, storage locations,
   factories, trolleys (/api/v1/needles, /exchange-types, /factories, /trolleys).
Semua endpoint tulis (create/update/delete) wajib dilindungi RBAC guard dan
tercatat di audit log (CHANGE_MASTER, DEVICE_BIND, DEVICE_REVOKE). Sertakan unit
test dan e2e test dasar per modul.
```

---

## Fase 6 — Modul Inventory (harus ada sebelum Exchange bisa validasi stok)

**Prompt:**
```
Implementasikan src/modules/inventory/ sesuai Docs/05-System-Architecture.md
§11-14 (Inventory & Stock Ledger Architecture) dan Docs/09-API-Specification.md.
Endpoint: /api/v1/inventory (balance), /stock-movements, /transfers, /returns,
/adjustments, /physical-counts. Aturan wajib: setiap mutasi balance HARUS disertai
entri stock_movements (ledger), tidak boleh update balance langsung tanpa ledger
entry. Semua endpoint mutasi wajib pakai Idempotency-Key middleware dari Fase 2.
Sertakan test untuk memastikan tidak ada race condition / stok minus pada
concurrent request (gunakan transaction + row lock).
```

---

## Fase 7 — Modul Exchange & Approval (state machine, paling kompleks)

**Prompt:**
```
Baca CLAUDE.md §5 (state machine Exchange) dan Docs/05-System-Architecture.md §10
secara detail. Implementasikan src/modules/exchange/ dan src/modules/approval/
sebagai satu alur transaksi yang mengikuti state machine ini persis:
DRAFT → OPERATOR_IDENTIFIED → NEEDLE_SELECTED → EXCHANGE_SELECTED →
(BROKEN | BENT/CHANGEOVER) → [jika BROKEN: FRAGMENT_STATUS →
(FOUND | NOT_FOUND → WAITING_CONFIRMATION → APPROVAL → APPROVED/REJECTED)] →
PHOTO → NEW_NEEDLE_SELECTED → STOCK_VALIDATION → (ISSUE | BLOCKED) →
USED_NEEDLE_STORED → COMPLETED.
Setiap transisi state harus divalidasi di service layer (bukan hanya di DTO) —
tolak transisi yang melompati urutan. STOCK_VALIDATION harus memanggil modul
inventory dari Fase 6 (jangan duplikasi logic stok). Endpoint mengikuti
Docs/09-API-Specification.md untuk /api/v1/exchanges, /confirmations, /approvals.
Sertakan unit test untuk setiap transisi state valid dan invalid, plus e2e test
untuk alur penuh DRAFT sampai COMPLETED (jalur normal dan jalur BROKEN+APPROVED).
```

---

## Fase 8 — Modul Notification, Audit (read), Reporting

**Prompt:**
```
Implementasikan:
1. src/modules/notification/ — kirim WhatsApp via adapter di src/integrations/whatsapp/
   (buat interface adapter dulu, implementasi provider konkret menyusul di Fase 9).
   Ikuti Docs/14-WhatsApp-Integration-Specification.md untuk template
   BROKEN_NEEDLE_CONFIRMATION dan status QUEUED/SENT/DELIVERED/READ/FAILED.
2. src/modules/audit/ — endpoint read-only /api/v1/audit untuk query audit_logs
   yang sudah ditulis oleh AuditLogInterceptor.
3. src/modules/reporting/ — endpoint async export sesuai
   Docs/09-API-Specification.md §45: POST /api/v1/reports/export mengembalikan
   job_id, GET /api/v1/reports/export/{job_id} mengembalikan status
   QUEUED/PROCESSING/COMPLETED/FAILED. Gunakan job processor di src/jobs/.
```

---

## Fase 9 — Integrasi Eksternal (RFID, WhatsApp provider, Object Storage)

Baru dikerjakan setelah provider dipilih (lihat CLAUDE.md §6).

**Prompt:**
```
Baca Docs/13-RFID-Integration-Specification.md dan Docs/14-WhatsApp-Integration-Specification.md.
Implementasikan adapter konkret di src/integrations/: rfid-adapter (opsi:
[USB/Serial | Bluetooth | Vendor SDK — isi sesuai keputusan]), whatsapp
(provider: [isi nama provider]), object-storage (provider: [isi nama provider]).
Adapter harus mengimplementasikan interface yang sudah didefinisikan di Fase 8,
supaya modul domain tidak perlu berubah.
```

---

## Fase 10 — Modul Synchronization (offline sync mobile)

**Prompt:**
```
Baca Docs/15-Mobile-Offline-Sync-Specification.md secara penuh. Implementasikan
src/modules/synchronization/ dengan endpoint GET /api/v1/mobile/bootstrap dan
POST /api/v1/mobile/sync (cursor-based push/pull). Setiap command dari mobile
membawa clientTransactionId + Idempotency-Key — backend WAJIB dedupe berdasarkan
ini (pakai middleware dari Fase 2). Command dependen (mis. CREATE_EXCHANGE
sebelum ISSUE_NEEDLE) harus dieksekusi berurutan, bukan paralel. Implementasikan
response code yang didefinisikan di dokumen: IDEMPOTENT_SUCCESS,
EXCHANGE_INVALID_STATE, NEEDLE_TYPE_NOT_FOUND, INVENTORY_INSUFFICIENT_STOCK.
Ingat: data dari mobile adalah cached snapshot, backend tetap re-validasi semua
business rule, tidak pernah override stok server dengan data mobile.
```

---

## Fase 11 — Kontrak API & Dokumentasi

**Prompt:**
```
Bandingkan seluruh endpoint yang sudah diimplementasikan dengan
Docs/12-OpenAPI-Swagger-Specification.md. Laporkan semua perbedaan (endpoint
hilang, field berbeda, response code berbeda) tanpa langsung mengubah apa pun.
Setelah saya konfirmasi, generate openapi.json dari @nestjs/swagger dan
selaraskan.
```

---

## Fase 12 — Test Menyeluruh & Docker

**Prompt:**
```
Jalankan seluruh unit test dan e2e test yang sudah dibuat, laporkan coverage
per modul. Buat Dockerfile dan docker-compose.yml (backend + PostgreSQL) untuk
dev lokal sesuai Docs/05-System-Architecture.md §29-31. Buat README.md dengan
instruksi setup lokal (env, migration, seed, run, test).
```

---

## Catatan Penggunaan

Jalankan fase secara berurutan dalam sesi/percakapan terpisah agar konteks tidak terlalu besar — tiap fase sudah dirancang idempotent (aman diulang/dilanjutkan). Selalu mulai sesi baru dengan memastikan Claude Code sudah membaca `CLAUDE.md` (otomatis ter-load jika ada di root repo). Jika Claude Code mengusulkan keputusan yang termasuk daftar "keputusan terbuka" di `CLAUDE.md` §6 tanpa Anda minta, hentikan dan konfirmasi dulu sebelum lanjut.
