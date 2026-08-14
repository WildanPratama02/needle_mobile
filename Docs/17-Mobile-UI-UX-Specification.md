# 17 — Mobile UI/UX Specification
# Needle Management System — Android Tablet / PIC Troli

**Version:** 1.0  
**Status:** Draft / UI-UX Baseline  
**Platform:** Android Tablet  
**Framework:** Flutter  
**Primary User:** PIC Troli  
**Related Documents:** PRD, Use Case, Functional Requirement, SRS Mobile, Mobile Architecture, API/OpenAPI, RFID Integration, WhatsApp Integration, Mobile Offline Sync, Security Architecture

---

## 1. Purpose

Dokumen ini mendefinisikan standar UI/UX untuk aplikasi Android Tablet yang digunakan PIC Troli dalam proses management penukaran jarum.

UI harus dioptimalkan untuk:

- Tablet Android
- penggunaan di area produksi/factory
- transaksi cepat
- operator/PIC melakukan transaksi sambil berdiri
- tombol besar dan mudah disentuh
- jumlah input manual seminimal mungkin
- RFID sebagai identifikasi operator
- kamera tablet sebagai evidence
- koneksi jaringan yang dapat berubah
- feedback status yang jelas

Prinsip utama:

> **Simple, Large, Fast, Guided, and Error-Proof.**

---

# 2. UX Principles

## 2.1 Large Touch Target

Menu dan action utama harus berukuran besar.

Prioritas:

```text
Primary Action
      ↓
Large Button
      ↓
Clear Label
      ↓
Minimum Text
```

Hindari tombol kecil yang sulit ditekan ketika PIC bekerja di area produksi.

---

## 2.2 One Main Decision Per Screen

Setiap screen sebaiknya mempunyai satu tujuan utama.

Contoh:

```text
Identify Operator
```

bukan:

```text
Identify Operator
+ Select Needle
+ Take Photo
+ Submit
```

Semua proses dibuat step-by-step.

---

## 2.3 Guided Transaction

Flow harus mengarahkan PIC secara berurutan:

```text
START
  ↓
RFID
  ↓
EXCHANGE TYPE
  ↓
OLD NEEDLE TYPE
  ↓
FRAGMENT CHECK
  ↓
PHOTO
  ↓
NEW NEEDLE TYPE
  ↓
ISSUE
  ↓
STORE USED NEEDLE
  ↓
COMPLETE
```

PIC tidak perlu mengingat langkah berikutnya.

---

## 2.4 Visual Feedback

Setiap action penting harus memberikan feedback:

```text
Loading
Success
Warning
Error
Offline
Syncing
Pending Confirmation
```

---

# 3. Device Orientation

Recommended:

```text
Landscape
```

Landscape menjadi baseline karena:

- area horizontal lebih luas
- tombol besar dapat ditampilkan lebih nyaman
- cocok untuk tablet yang digunakan pada trolley
- memudahkan camera/evidence preview

Portrait dapat dipertimbangkan hanya jika hardware trolley membutuhkan mode tersebut.

---

# 4. Screen Layout Standard

Baseline:

```text
┌───────────────────────────────────────────────┐
│ Header / Status                               │
├───────────────────────────────────────────────┤
│                                               │
│                                               │
│              MAIN CONTENT                     │
│                                               │
│         [ LARGE PRIMARY ACTION ]              │
│                                               │
│                                               │
├───────────────────────────────────────────────┤
│ Back                    Step        Next      │
└───────────────────────────────────────────────┘
```

---

# 5. Header

Header minimum:

```text
Factory
Trolley
PIC
Network Status
Sync Status
```

Contoh:

```text
Factory 01 | Trolley 02 | PIC: Budi
● Online     Sync OK
```

Header tidak boleh terlalu tinggi karena area transaksi harus tetap dominan.

---

# 6. Global Navigation

Karena aplikasi fokus pada operasional PIC Troli, navigation harus sederhana.

Recommended:

```text
Home
Transactions
Pending Sync
Settings
```

Namun menu utama tidak perlu menampilkan seluruh WebApp functionality.

Master data, inventory management, user management, dan analytics tetap berada di WebApps.

---

# 7. Home Screen

Purpose:

Memulai transaksi secepat mungkin.

Layout:

```text
┌───────────────────────────────────────────────┐
│ Factory 01 | Trolley 02       ● Online        │
├───────────────────────────────────────────────┤
│                                               │
│                                               │
│          PENUKARAN JARUM                      │
│                                               │
│       ┌───────────────────────┐               │
│       │                       │               │
│       │   + PENUKARAN BARU    │               │
│       │                       │               │
│       └───────────────────────┘               │
│                                               │
│       ┌──────────────┐  ┌──────────────┐      │
│       │ TRANSAKSI    │  │ PENDING SYNC │      │
│       └──────────────┘  └──────────────┘      │
│                                               │
└───────────────────────────────────────────────┘
```

Primary action harus paling dominan:

```text
+ PENUKARAN BARU
```

---

# 8. Start Exchange Screen

When PIC taps:

```text
PENUKARAN BARU
```

System creates a draft exchange.

Screen:

```text
┌───────────────────────────────────────────────┐
│ Penukaran Jarum                     Step 1/8  │
├───────────────────────────────────────────────┤
│                                               │
│              TAP KARTU RFID                   │
│                                               │
│          ┌─────────────────────┐              │
│          │                     │              │
│          │    TAP ID CARD      │              │
│          │        HERE         │              │
│          │                     │              │
│          └─────────────────────┘              │
│                                               │
│          Menunggu kartu operator...           │
│                                               │
├───────────────────────────────────────────────┤
│ Batal                                      →  │
└───────────────────────────────────────────────┘
```

No manual employee search should be required as the primary flow.

---

# 9. RFID Success Screen

After successful RFID:

```text
┌───────────────────────────────────────────────┐
│ Operator Identified                  Step 1/8  │
├───────────────────────────────────────────────┤
│                                               │
│             ✓ OPERATOR DITEMUKAN              │
│                                               │
│             EMP001                            │
│             Operator Name                     │
│             Factory 01                        │
│                                               │
│        [ LANJUTKAN TRANSAKSI ]                │
│                                               │
└───────────────────────────────────────────────┘
```

Show enough information for PIC to confirm identity.

---

# 10. RFID Error

Example:

```text
KARTU TIDAK DITEMUKAN

Kartu RFID belum terdaftar atau tidak aktif.

[ TAP ULANG ]
[ BATAL ]
```

Do not expose technical error codes to PIC.

---

# 11. Exchange Type Screen

Options:

```text
JARUM PATAH
JARUM BENGKOK
CHANGEOVER
```

Layout:

```text
┌───────────────────────────────────────────────┐
│ Type Penukaran                       Step 2/8  │
├───────────────────────────────────────────────┤
│                                               │
│  ┌────────────────┐  ┌────────────────┐       │
│  │                │  │                │       │
│  │   JARUM PATAH  │  │  JARUM BENGKOK │       │
│  │                │  │                │       │
│  └────────────────┘  └────────────────┘       │
│                                               │
│          ┌────────────────────┐               │
│          │                    │               │
│          │     CHANGEOVER     │               │
│          │                    │               │
│          └────────────────────┘               │
│                                               │
└───────────────────────────────────────────────┘
```

Use large cards/buttons.

---

# 12. Old Needle Type Screen

Purpose:

PIC selects the needle type being exchanged.

Screen:

```text
┌───────────────────────────────────────────────┐
│ Type Jarum                             Step 3  │
├───────────────────────────────────────────────┤
│ Cari type jarum                               │
│ ┌───────────────────────────────────────────┐ │
│ │ DBX1                                      │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ [ DBX1 ] [ DBXK5 ] [ DCx27 ] [ ... ]        │
│                                               │
│          Type dipilih: DBX1                   │
│                                               │
│              [ LANJUTKAN ]                    │
└───────────────────────────────────────────────┘
```

Because needle types can be numerous:

- provide search
- provide category/filter where useful
- show recently used types
- use large selectable cards
- avoid tiny dropdown controls

---

# 13. Type Validation

The backend remains authoritative.

Tablet must not assume that a locally cached needle type is still active.

If selected type is invalid:

```text
TYPE JARUM TIDAK TERSEDIA

Data type jarum sudah berubah.
Silakan pilih type lainnya.
```

---

# 14. Broken Needle Fragment Screen

This screen is only required for:

```text
JARUM PATAH
```

Question:

```text
Apakah patahan jarum dibawa oleh operator?
```

Large options:

```text
┌────────────────────┐
│                    │
│   ✓ ADA / DIBAWA   │
│                    │
└────────────────────┘

┌────────────────────┐
│                    │
│   ✕ TIDAK ADA      │
│                    │
└────────────────────┘
```

For other exchange types:

```text
NOT_REQUIRED
```

and the flow continues.

---

# 15. Broken Fragment Found

If:

```text
FOUND
```

continue to evidence.

Display:

```text
✓ Patahan jarum tersedia.

Silakan lanjut ke foto jarum.
```

---

# 16. Broken Fragment Not Found

If:

```text
NOT_FOUND
```

the UI must clearly indicate:

```text
KONFIRMASI PENGAWAS DIPERLUKAN
```

Flow:

```text
NOT FOUND
    ↓
Create Confirmation
    ↓
WhatsApp Notification
    ↓
Wait
```

Screen:

```text
┌───────────────────────────────────────────────┐
│ Menunggu Konfirmasi                           │
├───────────────────────────────────────────────┤
│                                               │
│  Patahan jarum tidak ditemukan.               │
│                                               │
│  Permintaan konfirmasi telah dikirim          │
│  kepada pengawas.                             │
│                                               │
│        ● MENUNGGU KONFIRMASI                  │
│                                               │
│        [ CEK STATUS ]                         │
│                                               │
└───────────────────────────────────────────────┘
```

Exchange cannot proceed to completion until required approval is received.

---

# 17. Confirmation Approved

Display:

```text
✓ KONFIRMASI DISETUJUI

Pengawas telah menyetujui proses
penukaran.

[ LANJUTKAN ]
```

---

# 18. Confirmation Rejected

Display:

```text
✕ PENUKARAN BELUM DAPAT DILANJUTKAN

Pengawas menolak konfirmasi.

Alasan:
{{reason}}

[ KEMBALI ]
```

Business policy determines whether PIC may restart or cancel the exchange.

---

# 19. Camera / Evidence Screen

Purpose:

PIC takes photo of old needle.

Screen:

```text
┌───────────────────────────────────────────────┐
│ Foto Jarum                            Step 5  │
├───────────────────────────────────────────────┤
│                                               │
│        ┌─────────────────────────────┐        │
│        │                             │        │
│        │       CAMERA PREVIEW        │        │
│        │                             │        │
│        └─────────────────────────────┘        │
│                                               │
│             [ ● AMBIL FOTO ]                 │
│                                               │
│        Foto wajib untuk transaksi.            │
└───────────────────────────────────────────────┘
```

---

# 20. Photo Review

After capture:

```text
┌───────────────────────────────────────────────┐
│ Review Foto                                   │
├───────────────────────────────────────────────┤
│                                               │
│             [ PHOTO PREVIEW ]                 │
│                                               │
│      [ ULANGI ]       [ GUNAKAN FOTO ]       │
│                                               │
└───────────────────────────────────────────────┘
```

Do not delete local photo until successful upload is confirmed.

---

# 21. New Needle Type Screen

The new needle must match the selected exchange requirements.

Recommended default:

```text
New Needle Type
=
Old Needle Type
```

unless business rules explicitly permit a different type.

UI:

```text
┌───────────────────────────────────────────────┐
│ Jarum Baru                            Step 6  │
├───────────────────────────────────────────────┤
│                                               │
│ Type Jarum Lama                               │
│ DBX1                                          │
│                                               │
│ Type Jarum Baru                               │
│ ┌───────────────────────────────────────────┐ │
│ │ DBX1                                  ✓  │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ Stock tersedia: 25 pcs                        │
│                                               │
│             [ BERIKAN JARUM ]                 │
└───────────────────────────────────────────────┘
```

---

# 22. Needle Type Mismatch

If business rule requires exact matching:

```text
Type jarum baru harus sama dengan
type jarum yang ditukar.

Type lama : DBX1
Type dipilih: DBXK5
```

Disable final issue.

Backend must also validate this rule.

---

# 23. Stock Availability

Before issue:

```text
Available Stock
```

should be visible.

Example:

```text
Stock tersedia: 25 pcs
```

If unavailable:

```text
STOCK TIDAK TERSEDIA

Type: DBX1
Stock: 0

Hubungi PIC Inventory.
```

The tablet must not allow an issue that backend cannot authorize.

---

# 24. Issue Confirmation

Before final issue:

```text
┌───────────────────────────────────────────────┐
│ Konfirmasi Penukaran                          │
├───────────────────────────────────────────────┤
│ Operator     EMP001                           │
│ Penukaran    JARUM PATAH                      │
│ Jarum Lama   DBX1                              │
│ Jarum Baru   DBX1                              │
│                                               │
│ Pastikan jarum baru sudah diberikan.          │
│                                               │
│       [ BATAL ]     [ KONFIRMASI ]            │
└───────────────────────────────────────────────┘
```

---

# 25. Used Needle Storage Screen

After issue:

```text
Jarum yang ditukar harus dimasukkan
ke lubang penyimpanan sesuai type
penukarannya.
```

Display clear instruction:

```text
Type Penukaran:
JARUM PATAH

Masukkan jarum ke:
LUBANG JARUM PATAH
```

Large visual/status indicator:

```text
[ SELESAI MENYIMPAN ]
```

The physical storage mapping is backend master data.

---

# 26. Complete Screen

Final summary:

```text
┌───────────────────────────────────────────────┐
│ ✓ PENUKARAN BERHASIL                         │
├───────────────────────────────────────────────┤
│                                               │
│ Exchange No : EXC-20260805-000001             │
│ Operator    : EMP001                          │
│ Penukaran   : JARUM PATAH                     │
│ Jarum Lama  : DBX1                            │
│ Jarum Baru  : DBX1                            │
│                                               │
│ Stock berhasil diperbarui.                   │
│                                               │
│             [ SELESAI ]                       │
└───────────────────────────────────────────────┘
```

---

# 27. Transaction History

PIC can view transactions handled by the trolley.

Cards:

```text
EXC-0001
Operator Name
DBX1 → DBX1
JARUM PATAH
08:30
✓ Completed
```

Statuses:

```text
Draft
Pending Confirmation
Pending Sync
Completed
Failed
Cancelled
```

---

# 28. Pending Sync Screen

When offline:

```text
┌───────────────────────────────────────────────┐
│ Pending Sync                                  │
├───────────────────────────────────────────────┤
│                                               │
│ 3 transaksi menunggu sinkronisasi             │
│                                               │
│ EXC-001   Pending                             │
│ EXC-002   Pending                             │
│ EXC-003   Failed                              │
│                                               │
│       [ SINKRONKAN SEKARANG ]                 │
└───────────────────────────────────────────────┘
```

---

# 29. Global Network Indicator

Header:

```text
● Online
● Offline
↻ Syncing
!
Sync Error
```

Offline state must be obvious but should not block unrelated local UI.

---

# 30. Sync Error UX

Example:

```text
Sinkronisasi gagal.

3 transaksi belum tersinkronisasi.

[ COBA LAGI ]
```

Business rejection must be distinguished from network failure:

```text
NETWORK ERROR
```

vs.

```text
TRANSACTION REJECTED
```

---

# 31. Loading UX

For normal API request:

```text
Loading...
```

For transaction submission:

```text
Memproses penukaran...
Mohon jangan menutup aplikasi.
```

Avoid indefinite loading.

Recommended timeout handling:

```text
Request timeout
   |
   v
Transaction status check
   |
   v
Do not blindly create a new transaction
```

---

# 32. Error UX Principles

Technical error:

```text
Something went wrong.
Silakan coba lagi.
```

Business error:

```text
Stock tidak tersedia.
```

Authorization:

```text
Anda tidak memiliki akses untuk proses ini.
```

Network:

```text
Koneksi sedang bermasalah.
Transaksi akan disimpan untuk sinkronisasi.
```

Never expose:

```text
SQL error
Stack trace
JWT details
Internal API URL
Database error
```

---

# 33. Button Hierarchy

### Primary

Large filled button:

```text
LANJUTKAN
KONFIRMASI
AMBIL FOTO
BERIKAN JARUM
SELESAI
```

### Secondary

```text
KEMBALI
ULANGI
BATAL
```

### Destructive

Only when necessary:

```text
BATALKAN TRANSAKSI
```

Destructive action requires confirmation.

---

# 34. Touch Target

All primary interactive controls must be comfortable for tablet operation.

Recommended baseline:

```text
Primary action height >= 56dp
```

For the main transaction buttons, use larger sizes according to available screen area.

Spacing should prevent accidental taps.

---

# 35. Typography

Typography should prioritize readability from normal operating distance.

Hierarchy:

```text
Screen Title
Large
Medium
Body
Caption
```

Avoid long paragraphs.

Use Indonesian operational language consistently.

---

# 36. Color Semantics

Color must communicate status, but not be the only indicator.

Use semantic combinations:

```text
Success  = icon + label + color
Warning  = icon + label + color
Error    = icon + label + color
Offline  = icon + label
```

Do not depend on color alone.

---

# 37. Accessibility

Baseline:

- large touch targets
- readable typography
- sufficient contrast
- clear labels
- icon + text
- no color-only status
- support Android accessibility where practical

---

# 38. Camera UX

Camera must:

- request permission gracefully
- show clear preview
- allow retake
- validate image
- handle camera failure
- preserve photo while offline
- upload asynchronously where appropriate

If permission denied:

```text
Kamera diperlukan untuk foto jarum.

[ BUKA PENGATURAN ]
[ KEMBALI ]
```

---

# 39. Device Permission UX

Required permissions may include:

```text
Camera
Bluetooth
USB/Accessory
Notification
Storage/File access
```

Exact permission list depends on selected RFID hardware and Android version.

Request permission at contextual point rather than all at first launch.

---

# 40. Session / Security UX

If session expires:

```text
Sesi Anda telah berakhir.

Silakan login kembali.
```

Do not lose a transaction draft where safe recovery is possible.

Sensitive local data must follow Security Architecture.

---

# 41. Device Registration

If device is not registered:

```text
DEVICE BELUM TERDAFTAR

Hubungi System Admin untuk melakukan
registrasi device.
```

No normal transaction should be allowed.

---

# 42. Trolley Binding

Tablet must show its assigned trolley:

```text
Factory 01
Trolley 02
```

If backend detects mismatch:

```text
DEVICE / TROLLEY TIDAK SESUAI

Silakan hubungi System Admin.
```

---

# 43. App Startup

Startup sequence:

```text
Launch
  ↓
Device Check
  ↓
Authentication
  ↓
Trolley/Factory Validation
  ↓
Bootstrap
  ↓
Sync Pending Transactions
  ↓
Home
```

---

# 44. Transaction Progress Indicator

Recommended:

```text
1 Operator
2 Exchange
3 Needle
4 Fragment
5 Photo
6 New Needle
7 Issue
8 Store
```

Current step highlighted.

For conditional steps, the progress indicator may dynamically skip steps.

Example non-broken exchange:

```text
Operator
  ↓
Exchange
  ↓
Needle
  ↓
Photo
  ↓
New Needle
  ↓
Issue
  ↓
Store
```

---

# 45. Transaction Guard

Before leaving active transaction:

```text
Transaksi belum selesai.

Apakah Anda yakin ingin keluar?
```

Options:

```text
LANJUTKAN
SIMPAN DRAFT
BATALKAN
```

Do not accidentally discard transaction.

---

# 46. State-Based UI

UI must render from domain state, not from arbitrary button sequence.

Example:

```text
ExchangeState
```

controls available actions.

```text
CREATED
 -> identify operator

OPERATOR_IDENTIFIED
 -> select exchange type

EXCHANGE_TYPE_SELECTED
 -> select needle / fragment

CONFIRMATION_PENDING
 -> wait

EVIDENCE_CAPTURED
 -> select new needle

NEW_NEEDLE_SELECTED
 -> issue

NEEDLE_ISSUED
 -> store used needle

USED_NEEDLE_STORED
 -> complete
```

---

# 47. Offline UI Rules

Offline banner:

```text
⚠ Offline
```

Pending synchronization:

```text
↻ 3 transaksi menunggu sync
```

The UI must clearly distinguish:

```text
Saved locally
```

from:

```text
Completed by server
```

Do not display a server-success state before backend confirmation.

---

# 48. Photo / File State

Recommended states:

```text
PHOTO_REQUIRED
PHOTO_CAPTURED
UPLOAD_PENDING
UPLOADED
UPLOAD_FAILED
```

If upload failed:

```text
Foto belum berhasil dikirim.

[ COBA LAGI ]
```

---

# 49. Confirmation State

Recommended:

```text
NOT_REQUIRED
PENDING
APPROVED
REJECTED
EXPIRED
```

UI mapping:

```text
PENDING  → Menunggu Pengawas
APPROVED → Disetujui
REJECTED → Ditolak
EXPIRED  → Kadaluarsa
```

---

# 50. Exchange Completion Guard

The Complete button is enabled only if required conditions are true.

Conceptually:

```text
operatorValid
AND exchangeTypeValid
AND oldNeedleTypeValid
AND fragmentRuleSatisfied
AND evidenceValid
AND newNeedleTypeValid
AND issueConfirmed
AND usedNeedleStored
```

Backend performs the authoritative validation again.

---

# 51. UI Architecture

Recommended Flutter structure:

```text
lib/
├── core/
│   ├── theme/
│   ├── routing/
│   ├── network/
│   ├── storage/
│   ├── security/
│   └── error/
│
├── features/
│   ├── authentication/
│   ├── home/
│   ├── exchange/
│   │   ├── presentation/
│   │   ├── application/
│   │   ├── domain/
│   │   └── data/
│   ├── rfid/
│   ├── camera/
│   ├── sync/
│   └── settings/
│
└── shared/
    ├── widgets/
    ├── models/
    └── services/
```

---

# 52. Component Guidelines

Reusable components:

```text
PrimaryActionButton
SecondaryActionButton
LargeSelectionCard
StatusBadge
NetworkIndicator
SyncIndicator
StepIndicator
NeedleTypeCard
ExchangeTypeCard
OperatorCard
ConfirmationCard
PhotoPreview
ErrorDialog
LoadingOverlay
```

---

# 53. Navigation

Recommended:

```text
GoRouter
```

or equivalent declarative routing solution.

Navigation must respect transaction state.

Do not allow arbitrary navigation into screens that require missing prerequisites.

---

# 54. State Management

The project may use the team's selected Flutter state management standard.

The implementation must support:

```text
Transaction state
RFID state
Camera state
Network state
Sync queue state
Authentication state
```

Business logic should not be placed directly inside UI widgets.

---

# 55. Design Tokens

Define central tokens for:

```text
Spacing
Radius
Typography
Button Height
Icon Size
Elevation
Animation Duration
```

Example:

```text
spacing.xs
spacing.sm
spacing.md
spacing.lg
spacing.xl
```

This prevents inconsistent screens.

---

# 56. Animation

Animations should be minimal and operational.

Use for:

```text
Success
Step transition
Loading
Sync
```

Avoid decorative animation that slows transactions.

---

# 57. Performance

The app should prioritize:

```text
Fast startup
Fast screen transition
Fast RFID response
Fast camera launch
Low memory usage
Stable long-running operation
```

Tablet may operate for long periods in a factory environment.

---

# 58. Long-Running Operation

The app should be resilient to:

```text
Many transactions per day
Continuous RFID reads
Repeated camera usage
Network fluctuation
Background sync
```

Memory leaks and repeated hardware initialization must be avoided.

---

# 59. Logging UX

PIC must not see technical logs.

For support:

```text
Settings
 → Device Information
 → Diagnostics
```

may expose:

```text
App Version
Device ID
Trolley
Factory
Last Sync
Network Status
RFID Status
Camera Status
```

No secrets.

---

# 60. UI Acceptance Criteria

## Home

- [ ] New Exchange is the dominant action.
- [ ] Buttons are large.
- [ ] Factory/Trolley visible.
- [ ] Network status visible.

## RFID

- [ ] RFID waiting state is obvious.
- [ ] Successful operator is shown.
- [ ] Invalid RFID can be retried.
- [ ] Duplicate scan does not create duplicate transaction.

## Exchange

- [ ] Three exchange types are easy to select.
- [ ] Needle Type is mandatory.
- [ ] Needle Type supports many values.
- [ ] Search/filter is available where needed.

## Broken Needle

- [ ] Fragment question only appears for BROKEN.
- [ ] FOUND continues normally.
- [ ] NOT_FOUND creates confirmation workflow.
- [ ] Pending confirmation blocks prohibited next actions.
- [ ] Approval/rejection is visible.

## Camera

- [ ] Photo capture is easy.
- [ ] Retake is available.
- [ ] Photo upload state is visible.
- [ ] Offline photo is preserved.

## New Needle

- [ ] New type is visible.
- [ ] Stock availability is visible.
- [ ] Mismatch is prevented.
- [ ] Issue is confirmed by backend.

## Storage

- [ ] Correct storage mapping is displayed.
- [ ] PIC receives clear physical instruction.
- [ ] Completion requires storage step.

## Offline

- [ ] Offline state is visible.
- [ ] Pending sync count is visible.
- [ ] Local vs server-completed state is clear.
- [ ] Failed sync can be retried.

## Security

- [ ] Session expiration is handled.
- [ ] Device registration is validated.
- [ ] Trolley binding is validated.
- [ ] Sensitive information is not exposed.

---

# 61. UX Testing Scenarios

Minimum UAT scenarios:

```text
1. Normal Changeover
2. Bent Needle
3. Broken Needle + Fragment Found
4. Broken Needle + Fragment Not Found
5. Supervisor Approval
6. Supervisor Rejection
7. RFID Unknown
8. RFID Inactive
9. Needle Type Inactive
10. Stock Available
11. Stock Insufficient
12. Camera Permission Denied
13. Network Lost Before Submit
14. Network Lost During Submit
15. Network Lost During Photo Upload
16. Duplicate Retry
17. Device/Trolley Mismatch
18. Session Expired
19. Sync Failure
20. Successful Complete
```

---

# 62. Recommended Screen Inventory

```text
01 Splash
02 Login / Session
03 Device Registration Error
04 Home
05 New Exchange
06 RFID Scan
07 Operator Identified
08 Exchange Type
09 Old Needle Type
10 Broken Fragment Check
11 Confirmation Pending
12 Confirmation Approved
13 Confirmation Rejected
14 Camera Capture
15 Photo Review
16 New Needle Type
17 Issue Confirmation
18 Used Needle Storage
19 Exchange Complete
20 Transaction History
21 Transaction Detail
22 Pending Sync
23 Sync Error
24 Settings
25 Device Diagnostics
26 Generic Error
```

---

# 63. UX Definition of Done

- [ ] Screen inventory approved.
- [ ] User journey approved.
- [ ] Landscape tablet layout approved.
- [ ] Large-button standard approved.
- [ ] Typography/token system approved.
- [ ] Exchange flow prototype approved.
- [ ] RFID UX approved.
- [ ] Camera UX approved.
- [ ] Confirmation UX approved.
- [ ] Offline UX approved.
- [ ] Error states approved.
- [ ] Accessibility reviewed.
- [ ] UAT scenarios mapped to screens.
- [ ] Flutter component architecture aligned.
- [ ] Backend state contract aligned.

---

# 64. Next Step

After this document:

```text
17 Mobile UI/UX
      ↓
18 WebApps UI/UX Specification
      ↓
19 Test Strategy & UAT
      ↓
20 Deployment & DevOps Architecture
```

The Mobile UI/UX implementation should not introduce business rules that conflict with the backend API, SRS, exchange state machine, inventory rules, offline-sync contract, or security architecture.

**End of Mobile UI/UX Specification**
