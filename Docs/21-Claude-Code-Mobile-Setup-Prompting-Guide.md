# 21. Persiapan & Panduan Prompting Claude Code — Mobile Flutter (Troli App)

Status: Draft v1.0
Stack: Flutter / Dart, Android Tablet
Referensi: `07-SRS-Mobile-Android.md`, `13-RFID-Integration-Specification.md`, `15-Mobile-Offline-Sync-Specification.md`, `17-Mobile-UI-UX-Specification.md`, `09-API-Specification.md`, `12-OpenAPI-Swagger-Specification.md`, `Flutter_rules/rules.md`, `19-Backend-Folder-Structure.md` (pola yang direplikasi), `20-Claude-Code-Backend-Setup-Prompting-Guide.md` (pola prompting yang direplikasi)

---

## 0. Kenapa Dokumen Ini Ada

Backend dan WebApps sudah selesai dan stabil (lihat `Docs/agents/domain.md`). Backend adalah **stock authority** (ADR-004) dan **source of truth** untuk semua business rule — mobile hanya orkestrasi UI + offline cache. Pola yang berhasil untuk Backend (`CLAUDE.md` per-repo, ADR eksplisit, folder structure by-feature, panduan prompting bertahap di Doc 20, tiket di `.scratch/`) direplikasi di sini untuk Mobile, dengan penyesuaian untuk hal-hal yang backend tidak punya: state UI linear per layar, hardware (RFID, camera), local database, dan sync engine.

**Prinsip yang tidak berubah dari backend:** server tetap authoritative untuk stock dan state transisi (ADR-004, ADR-005 offline-first Android). Mobile tidak pernah menyelesaikan (`COMPLETED`) sebuah exchange berdasarkan asumsi lokal semata — lihat Doc 15 §7 dan §13.

---

## 1. Fase 0 — Yang Harus Selesai *Sebelum* Membuka Claude Code

Ini bukan pekerjaan coding — ini pekerjaan arsitek. Kalau dilewati, Claude Code akan menebak dan menebaknya sering salah pada hal yang mahal untuk diubah belakangan (local DB, state management, protokol RFID).

### 1.1 Verifikasi kontrak API mobile vs backend aktual

Doc `07-SRS-Mobile-Android.md` dan `15-Mobile-Offline-Sync-Specification.md` ditulis sebagai spesifikasi *sebelum* backend selesai. Backend sekarang sudah punya ADR sendiri yang mungkin menggeser kontrak (lihat `Docs/adr/0001...` dan `0002...`, serta `architecture/backend-webapps-gap-analysis.md` yang menunjukkan backend-webapps sempat divergen dari spec awal).

**Tindakan:** sebelum coding, minta Claude Code (mode read-only, tanpa buat kode) membuat `Docs/architecture/backend-mobile-contract-matrix.md` — bandingkan endpoint yang benar-benar ada di `Backend/` (via `openapi.json` atau route scan) dengan yang diasumsikan di Doc 09/12/15 (`/mobile/bootstrap`, `/mobile/sync`, `/rfid/cards/{uid}`, `/exchanges`, dst). Ini mencegah membangun UI/local-DB di atas kontrak yang sudah basi, persis pola yang sudah dipakai untuk WebApps (`architecture/backend-webapps-contract-matrix.md`).

### 1.2 Kunci keputusan teknis terbuka

Ini daftar "Open Decisions" yang tercecer di beberapa dokumen (Doc 15 §22, Doc 13 §15) plus keputusan Flutter-spesifik yang belum ada di dokumen manapun. Semua ini **berdampak luas** (mengubahnya belakangan = rewrite besar), jadi kunci dulu, tulis di `Mobile/CLAUDE.md` §Keputusan, baru mulai coding.

| Keputusan | Opsi | Sumber |
|---|---|---|
| Local database | Drift (SQLite + type-safe query) vs Isar vs sqflite mentah | Doc 15 §22 — rekomendasi: **Drift**, karena butuh query relasional untuk sync queue + cache master data, dan generate code cocok dengan `build_runner` yang sudah direkomendasikan `Flutter_rules/rules.md` |
| Enkripsi local DB | SQLCipher vs enkripsi field-level vs `flutter_secure_storage` untuk token saja | Doc 15 §4, §22; Doc 07 §45 |
| Protokol RFID reader | USB/Serial vs Bluetooth vs Vendor SDK | Doc 13 §5, §15 — tergantung hardware yang sudah/akan dibeli untuk trolley tablet |
| Offline stock policy | Issue selalu perlu online-confirm (rekomendasi Doc 15 §7) vs reservasi offline penuh | Doc 15 §7, §22 |
| State management | `Flutter_rules/rules.md` default ke built-in (ValueNotifier/ChangeNotifier); tapi state machine 12-state (Doc 07 §28) + sync engine + offline queue butuh sesuatu yang lebih terstruktur | Rekomendasi: **Riverpod** atau **Bloc** — putuskan eksplisit, jangan biarkan Claude Code memilih sendiri per fase |
| Routing | `go_router` (sudah direkomendasikan `Flutter_rules/rules.md`) | — |
| Max offline duration, retry limit, foto max size, retention period lokal | — | Doc 15 §22 |
| Build flavor / environment | dev/staging/prod, base URL per flavor | Belum ada dokumen — tentukan sebelum Fase 1 |
| Distribusi APK ke tablet factory | Play Store internal track vs MDM sideload vs manual APK | Belum ada dokumen — pertimbangkan sejak awal karena memengaruhi signing & update mechanism |

### 1.3 `Mobile/CLAUDE.md` — root rules untuk Claude Code

Backend punya `Backend/CLAUDE.md` (ADR §2, module boundary §3, aturan coding §4). Mobile butuh yang setara, isi minimum:

```
§1 Prinsip non-negotiable
   - Backend is authoritative (ADR-004): mobile TIDAK PERNAH menyelesaikan
     stock deduction atau menandai COMPLETED tanpa response backend.
   - Offline-first Android (ADR-005): app harus tetap usable saat offline
     sesuai batas di Doc 15 §6, tapi offline != bypass business rule.
   - Local state mobile (LOCAL_DRAFT/QUEUED/SYNCING/SERVER_ACCEPTED/
     SERVER_REJECTED/COMPLETED — Doc 15 §8) TIDAK BOLEH dicampur dengan
     server state (DRAFT..COMPLETED — Doc 07 §28). Mapping keduanya harus
     eksplisit di satu tempat (mis. `SyncStateMapper`), jangan tersebar.

§2 Keputusan terkunci (hasil Fase 0 §1.2 di atas)
   - Local DB: [isi]
   - State management: [isi]
   - RFID protocol: [isi]
   - dst.

§3 Batas modul (mirror package-by-feature Backend §4 di Doc 19)
   lib/features/{auth, device_context, rfid, exchange, photo_evidence,
   inventory_stock, history, sync, settings}
   Setiap fitur: presentation/ domain/ data/ — tidak boleh widget
   memanggil API client langsung, harus lewat repository (Doc 07 §39).

§4 Aturan coding wajib
   - Setiap command mutasi (CREATE_EXCHANGE, ISSUE_NEEDLE, dst) WAJIB
     membawa clientTransactionId + Idempotency-Key (Doc 15 §10).
   - Command dependen dieksekusi berurutan sesuai Doc 15 §12, tidak paralel.
   - Retry otomatis HANYA untuk error di whitelist Doc 07 §41
     (NETWORK_TIMEOUT, TEMPORARY_SERVER_ERROR) — bukan business rejection.
   - Satu layar = satu keputusan = satu primary action (Doc 07 §43).
   - RFID/camera access diisolasi di adapter (interface di domain layer,
     implementasi platform-specific di data layer) — lihat Doc 13 §6.

§5 Testing wajib per fitur
   unit test (domain+data), widget test (presentation),
   integration_test untuk end-to-end flow (Doc 07 §59).

§6 Referensi
   Docs/07, 13, 15, 17 untuk requirement; Docs/09, 12 untuk kontrak API;
   Docs/adr/ + Backend/CLAUDE.md §2 untuk ADR lintas-sistem.
```

Simpan dokumen ini di root repo Mobile (`Mobile/CLAUDE.md`), bukan di `Docs/`, sama seperti Backend.

### 1.4 `Docs/22-Mobile-Folder-Structure.md`

Analog Doc 19 untuk backend. Usulan struktur (package-by-feature, sesuai `Flutter_rules/rules.md` §Application Architecture):

```
mobile/
├── lib/
│   ├── main.dart
│   ├── app/                      # MaterialApp, router, theme, DI root
│   ├── core/                     # network client, local db instance,
│   │                              #   secure storage, error types, constants
│   ├── features/
│   │   ├── auth/                 # login, session, device validation
│   │   ├── device_context/       # factory/trolley/device binding
│   │   ├── rfid/                 # RfidReader interface + adapter
│   │   ├── master_data/          # needle types, exchange types, storage mapping cache
│   │   ├── exchange/             # state-machine screens (Doc 07 §9-28)
│   │   ├── photo_evidence/       # camera capture, compress, local file mgmt
│   │   ├── inventory_stock/      # trolley stock view, stock validation call
│   │   ├── history/              # transaction history + filter
│   │   ├── sync/                 # command queue, sync engine, conflict UI
│   │   └── settings/
│   └── shared/                   # design tokens, reusable widgets, enums
├── test/
│   ├── unit/
│   ├── widget/
│   └── integration/
├── android/                      # platform channel untuk RFID SDK jika perlu
└── pubspec.yaml
```

Setiap `features/<name>/` berisi `presentation/ domain/ data/` — identik prinsipnya dengan pemisahan Backend controllers/services/entities, supaya business logic (state machine, idempotency, mapping) tidak bocor ke widget.

### 1.5 Agent routing — `Docs/agents/mobile-dev.md`

`Docs/agents/domain.md` sudah merujuk `.claude/agents/webapps-dev.md` untuk routing kerja di `WebApps/`. Buat padanannya untuk `Mobile/` (`.claude/agents/mobile-dev.md`) supaya sesi Claude Code yang dibuka dari root repo otomatis tahu: baca `Mobile/CLAUDE.md`, `Docs/07/13/15/17`, dan pola tiket `.scratch/`. Tambahkan juga baris di `Docs/agents/domain.md` §File structure untuk `Mobile/`.

### 1.6 SKILL.md yang paling relevan

Skill = instruksi reusable yang dipanggil Claude Code tanpa harus re-explain tiap sesi. Yang paling bernilai untuk project ini, urut prioritas:

1. **`exchange-state-machine` skill** — encode diagram state Doc 07 §28 + urutan command Doc 15 §12 secara mekanis (state graph, transisi valid/invalid, aturan "NEEDLE_SELECTED tidak punya endpoint sendiri"). Ini state machine paling kompleks dan paling gampang diimplementasi salah kalau hanya mengandalkan Claude membaca dokumen prosa tiap kali.
2. **`offline-sync-engine` skill** — encode Doc 15 §9-14: bentuk command queue, idempotency key wajib, retry policy dengan backoff, conflict response codes (`IDEMPOTENT_SUCCESS`, `EXCHANGE_INVALID_STATE`, `NEEDLE_TYPE_NOT_FOUND`, `INVENTORY_INSUFFICIENT_STOCK`).
3. **`rfid-integration` skill** — encode Doc 13 §6-9: interface `RfidReader`, debounce rule, error mapping (`RFID_NOT_FOUND`, `RFID_INACTIVE`, dst), larangan RFID UID jadi otorisasi.
4. **`flutter-project-rules` skill** — versi project-scoped dari `Flutter_rules/rules.md` (yang saat ini generik/template) digabung dengan keputusan terkunci di §1.2 (state management, routing, local DB) supaya tidak ambigu lagi.

`Flutter_rules/rules.md` yang ada sekarang bagus sebagai *baseline* coding style, tapi belum project-aware (tidak tahu soal RFID/offline/state machine spesifik Needle Mobile System) — jangan andalkan dia sendirian.

### 1.7 Pemecahan tiket di `.scratch/`

Doc 07 §61 sudah punya breakdown EPIC 01–14. Sebelum sesi coding pertama, pecah setiap EPIC jadi tiket bernomor mengikuti konvensi `Docs/agents/issue-tracker.md`:

```
.scratch/mobile-troli-app/
├── spec.md
└── issues/
    ├── 01-scaffold-project.md
    ├── 02-auth-device-context.md
    ├── 03-rfid-integration.md
    ├── 04-master-data-cache.md
    ├── 05-exchange-state-machine-ui.md
    ├── 06-photo-evidence.md
    ├── 07-stock-validation-issue.md
    ├── 08-offline-local-db.md
    ├── 09-sync-engine.md
    ├── 10-history-stock-view.md
    ├── 11-security-hardening.md
    ├── 12-logging-monitoring.md
    ├── 13-testing-uat.md
    └── 14-release-packaging.md
```

Urutan ini mengikuti dependency: scaffold → auth/context (semua butuh ini) → RFID & master data (independen, bisa paralel) → exchange state machine (butuh RFID+master data) → photo & stock/issue (bagian dari flow exchange) → offline+sync (butuh seluruh flow online berjalan dulu, supaya jelas apa yang di-cache) → history/stock view → hardening/testing/release.

---

## 2. Fase Prompting Claude Code (setelah Fase 0 selesai)

Jalankan tiap fase di sesi terpisah, sama seperti catatan penggunaan Doc 20. Selalu pastikan Claude Code sudah membaca `Mobile/CLAUDE.md` (auto-load jika di root repo Mobile) sebelum lanjut.

**Fase 1 — Scaffold**
```
Scaffold project Flutter baru di folder mobile/ mengikuti struktur di
Docs/22-Mobile-Folder-Structure.md. Setup go_router, [state management
pilihan], tema Material 3 (ColorScheme.fromSeed), build flavor dev/staging/
prod dengan base URL berbeda. Jangan implementasi fitur domain apa pun dulu.
```

**Fase 2 — Core layer**
```
Baca Mobile/CLAUDE.md §2-4. Implementasikan lib/core/: HTTP client dengan
interceptor auth token + refresh, error mapper (Technical/Business/Network/
Auth/Conflict — Doc 07 §40), instance [Drift/pilihan lain] dengan skema
awal mengikuti local storage tables Doc 15 §38, secure storage untuk token.
```

**Fase 3 — Auth & Device/Trolley Context**
```
Baca Docs/07-SRS-Mobile-Android.md §6-8 dan Docs/15 §16 (Bootstrap).
Implementasikan lib/features/auth/ dan device_context/: login, device
validation (ACTIVE/INACTIVE/REVOKED/UNKNOWN), consume GET /mobile/bootstrap
untuk load factory/trolley/device/master data awal. Home screen sesuai
layout Doc 07 §8. Sertakan widget test untuk login flow dan blocked-device
flow.
```

**Fase 4 — RFID Module**
```
Gunakan skill rfid-integration jika tersedia; jika belum, baca
Docs/13-RFID-Integration-Specification.md §6-9 penuh. Implementasikan
lib/features/rfid/: interface RfidReader, adapter [protokol hasil Fase 0],
debounce [nilai hasil Fase 0], GET /rfid/cards/{uid} lookup, error mapping.
Hardware-specific code tidak boleh bocor ke luar adapter.
```

**Fase 5 — Master Data Cache**
```
Implementasikan lib/features/master_data/: cache needle types, exchange
types, storage mappings dari bootstrap, refresh berbasis version/cursor
sesuai Docs/15 §17.
```

**Fase 6 — Exchange State Machine (paling kompleks)**
```
Gunakan skill exchange-state-machine jika tersedia; jika belum, baca
Docs/07-SRS-Mobile-Android.md §9-30 dan §28 (state diagram) secara detail.
Implementasikan lib/features/exchange/ sebagai wizard linear satu-layar-
satu-keputusan (Doc 07 §43): Create Exchange -> RFID Operator -> Old Needle
-> Exchange Type -> [Broken: Fragment Validation -> Confirmation jika perlu]
-> New Needle -> Stock Validation -> Issue -> Used Needle Storage ->
Complete. State lokal (LOCAL_DRAFT/QUEUED/...) dan state server harus
dipetakan eksplisit lewat satu SyncStateMapper, tidak dicampur di widget.
Transisi tidak valid harus ditolak di domain layer, bukan hanya UI.
```

**Fase 7 — Photo Evidence**
```
Baca Docs/07 §19-20 dan Docs/15 §15. Implementasikan lib/features/
photo_evidence/: camera capture, compress/validate, simpan local file,
queue upload, jangan hapus file lokal sebelum upload sukses dikonfirmasi.
```

**Fase 8 — Stock Validation & Issue**
```
Baca Docs/07 §22-26 dan Docs/15 §7 (Stock Safety Rule). Implementasikan
lib/features/inventory_stock/: validasi stock SELALU lewat backend
(request Issue -> backend validasi -> backend buat movement -> tablet
terima hasil authoritative). TIDAK ADA local stock deduction yang jadi
final.
```

**Fase 9 — Offline & Sync Engine**
```
Gunakan skill offline-sync-engine jika tersedia; jika belum, baca
Docs/15-Mobile-Offline-Sync-Specification.md penuh. Implementasikan lib/
features/sync/: command queue lokal, POST /mobile/sync (cursor-based),
idempotency wajib per command, retry policy Doc 15 §14, UI conflict sesuai
Doc 15 §13 (tidak boleh silent overwrite). Sertakan test: retry tidak
duplicate, command dependen tidak dieksekusi out of order, business
rejection tidak di-retry otomatis.
```

**Fase 10 — History & Trolley Stock View**
```
Baca Docs/07 §30-31. Implementasikan lib/features/history/ dan bagian
read-only inventory_stock/ sesuai kolom dan filter yang didefinisikan.
```

**Fase 11 — Testing Menyeluruh**
```
Jalankan seluruh unit/widget/integration test. Tambahkan integration_test
untuk skenario end-to-end Doc 07 §59 (jalur normal, jalur BROKEN+APPROVED,
jalur offline->sync). Laporkan coverage per fitur.
```

**Fase 12 — Packaging & Release**
```
Setup app icon, splash screen, build flavor signing (dev/staging/prod),
CI build APK/AAB. Buat README.md dengan instruksi setup lokal, run, test,
dan build release sesuai keputusan distribusi Fase 0 §1.2.
```

---

## 3. Hal yang Tidak Bisa Diselesaikan Claude Code Sendirian

- **Verifikasi hardware nyata** (RFID reader fisik, kamera tablet target) — agent bisa menulis adapter dan mock/fake untuk test, tapi validasi akhir wajib manual di device fisik (lihat Doc 07 §58 Hardware test scope).
- **Keputusan Fase 0 §1.2** — kalau Claude Code mengusulkan pilihan (mis. "saya pakai Isar") tanpa diminta, hentikan dan konfirmasi dulu, sama seperti aturan Doc 20 "Catatan Penggunaan".
- **Kontrak API yang sudah divergen dari spec** — kalau Fase 0 §1.1 menemukan gap antara backend aktual dan Doc 07/09/15, itu harus diselesaikan sebelum Fase 3, bukan ditemukan di tengah Fase 6.

---

## 4. Checklist Ringkas Sebelum Sesi Coding Pertama

- [ ] `Docs/architecture/backend-mobile-contract-matrix.md` dibuat, gap dikonfirmasi
- [ ] Semua baris tabel §1.2 terisi dan dikunci
- [ ] `Mobile/CLAUDE.md` ditulis (§1-6 di atas)
- [ ] `Docs/22-Mobile-Folder-Structure.md` ditulis
- [ ] `Docs/agents/mobile-dev.md` + `.claude/agents/mobile-dev.md` dibuat, `domain.md` diupdate
- [ ] Minimal skill `exchange-state-machine` dan `offline-sync-engine` disiapkan (bisa disusun setelah Fase 0 selesai, sebelum Fase 6/9)
- [ ] `.scratch/mobile-troli-app/spec.md` + tiket EPIC 01-14 dipecah
- [ ] Repo `mobile/` dibuat, terhubung git, `pubspec.yaml` belum diisi (scaffold jadi Fase 1)

**End of Mobile Claude Code Setup & Prompting Guide**
