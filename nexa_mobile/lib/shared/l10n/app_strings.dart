/// Every UI string, in Indonesian operational language (Doc 17 §35).
///
/// One place so `flutter_localizations` / ARB files can replace it later
/// without hunting through widgets.
abstract final class AppStrings {
  static const appName = 'NEXA Troli';

  // Status (Doc 07 §32, Doc 17 §29)
  static const online = 'ONLINE';
  static const offline = 'OFFLINE';
  static const syncAllDone = 'Sinkronisasi: semua transaksi tersinkron';
  static const cachedContextSince = 'Data dari cache, diperbarui';

  // Startup
  static const startupChecking = 'Memeriksa device…';
  static const startupValidating = 'Memvalidasi device dan memuat data troli…';
  static const retry = 'COBA LAGI';

  // Provisioning (MG-1)
  static const provisionTitle = 'Registrasi Device';
  static const provisionScanHint =
      'Scan QR device dari WebApps (Administrasi → Device → Detail).';
  static const provisionManualToggle = 'MASUKKAN ID MANUAL';
  static const provisionScanToggle = 'SCAN QR';
  static const provisionManualLabel = 'Device ID (UUID)';
  static const provisionManualHint = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
  static const provisionManualSave = 'SIMPAN DEVICE';
  static const provisionConfirmTitle = 'Device ditemukan';
  static const provisionConfirmAction = 'GUNAKAN DEVICE INI';
  static const provisionRescan = 'SCAN ULANG';
  static const provisionCodeUnknown = '(kode tidak tersedia)';
  static const provisionCameraUnavailable =
      'Kamera tidak tersedia. Gunakan input manual.';
  static const qrNotJson = 'Bukan QR code device.';
  static const qrNotDeviceQr = 'Bukan QR code device.';
  static const qrUnsupportedVersion =
      'Versi QR code device tidak dikenal. Perbarui aplikasi.';
  static const qrInvalidDeviceId = 'QR code device tidak berisi ID yang valid.';
  static const manualInvalidDeviceId =
      'Device ID harus berformat UUID (36 karakter).';
  static const deviceNotRegisteredNotice =
      'DEVICE BELUM TERDAFTAR. Hubungi System Admin untuk melakukan '
      'registrasi device, lalu scan ulang.';

  // Login (FR-MOB-001, MG-2)
  static const loginTitle = 'Masuk';
  static const username = 'Username';
  static const password = 'Password';
  static const loginAction = 'MASUK';
  static const loginFieldsRequired = 'Username dan password wajib diisi.';
  static const loginInvalidCredentials =
      'Username atau password salah, atau akun tidak aktif.';
  static const sessionExpired =
      'Sesi Anda telah berakhir. Silakan login kembali.';
  static const loginDevice = 'Device';

  // Device blocked (FR-MOB-002, Doc 17 §41–42)
  static const blockedTitle = 'LOGIN DIBLOKIR';
  static const blockedInactive =
      'Device ini tidak aktif. Transaksi tidak dapat dilakukan dari device ini. '
      'Hubungi System Admin.';
  static const blockedRevoked =
      'Device ini telah dicabut (revoked). Transaksi tidak dapat dilakukan dari '
      'device ini. Hubungi System Admin.';
  static const accessDeniedTitle = 'AKSES DITOLAK';
  static const accessDeniedBody =
      'Akun Anda tidak memiliki akses ke device / trolley ini. '
      'Silakan hubungi System Admin.';
  static const unavailableTitle = 'TIDAK DAPAT MEMUAT DATA TROLI';
  static const unavailableBody =
      'Data device belum pernah dimuat dan server tidak dapat dihubungi. '
      'Periksa koneksi lalu coba lagi.';
  static const logout = 'KELUAR';
  static const checkAgain = 'PERIKSA ULANG';

  // Home (Doc 07 §8, Doc 17 §7). The dashboard layout follows the NEXA ·
  // Troli reference design; `newExchange`/`trolleyStock`/`history` stay as
  // the FR-MOB-003/011/014 action names (route titles, semantics), while the
  // dashboard card copy below is the on-screen label the PIC actually reads.
  static const homeTitle = 'PENUKARAN JARUM';
  static const newExchange = '+ PENUKARAN BARU';
  static const trolleyStock = 'STOK TROLI';
  static const history = 'RIWAYAT';
  static const factory = 'Factory';
  static const trolley = 'Trolley';
  static const pic = 'PIC';
  static const settings = 'Pengaturan';

  // Home dashboard cards (reference design: NEXA.png)
  static const homeWordmark = 'NEXA · Troli';
  static const homeCtaTitle = 'TUKAR JARUM';
  static const homeCtaSubtitle =
      'Mulai transaksi baru — operator tap kartu RFID';
  static const homeStockTitle = 'STOK TROLI SAAT INI';
  static const homeStockUnavailable = 'Data stok tidak tersedia saat ini.';
  static const homeStockEmpty = 'Belum ada data stok untuk troli ini.';
  static const homeExchangesTodayTitle = 'PENUKARAN HARI INI';
  static const homeExchangesTodayUnavailable =
      'Rincian per jenis penukaran belum tersedia di versi ini.';
  static const homeHistoryCardTitle = 'Riwayat';
  static const homeHistorySubtitlePrefix = 'Transaksi hari ini: ';
  static const homeHistoryCountUnavailable = 'Tidak tersedia offline';
  static const homeSyncCardTitle = 'Status Sinkron';
  static const homeSyncPending = 'data menunggu sinkronisasi';

  // Navigation
  static const back = 'KEMBALI';

  // Settings
  static const settingsTitle = 'Pengaturan';
  static const appVersion = 'Versi aplikasi';
  static const environment = 'Environment';
  static const deviceId = 'Device ID';
  static const deviceCode = 'Kode device';
  static const user = 'Pengguna';
  static const reprovision = 'GANTI DEVICE (ADMIN)';
  static const reprovisionOnlyAdmin =
      'Ganti device hanya dapat dilakukan oleh pengguna dengan akses '
      'DEVICE_MANAGE.';
  static const reprovisionConfirmTitle = 'Ganti device?';
  static const reprovisionConfirmBody =
      'Device ID yang tersimpan dan data troli di tablet ini akan dihapus, '
      'lalu Anda keluar. Tablet harus di-scan ulang dengan QR device.';
  static const logoutConfirmTitle = 'Keluar?';
  static const logoutConfirmBody =
      'Anda harus login kembali untuk bertransaksi.';
  static const cancel = 'BATAL';
  static const confirm = 'YA, LANJUTKAN';

  // Exchange flow (Doc 07 §9–29, Doc 17 §8–26)
  static const exchangeTitle = 'Penukaran Jarum';
  static const exchangeStarting = 'Membuka transaksi…';
  static const exchangeNeedsConnection =
      'Penukaran jarum membutuhkan koneksi ke server. Tablet sedang offline, '
      'periksa jaringan lalu coba lagi.';
  static const exchangeNoDeviceContext =
      'Data device belum tersedia. Kembali ke Home lalu coba lagi.';
  static const exchangeGone =
      'Transaksi sebelumnya tidak ditemukan di server. Silakan mulai '
      'penukaran baru.';
  static const exchangeResynced =
      'Status transaksi sudah berubah di server. Layar disesuaikan dengan '
      'status terbaru.';
  static const backToHome = 'KEMBALI KE HOME';
  static const cancelExchange = 'BATALKAN';
  static const cancelExchangeTitle = 'Batalkan transaksi?';
  static const cancelExchangeBody =
      'Transaksi akan dibatalkan di server. Alasan pembatalan wajib diisi.';
  static const cancelExchangeAfterIssue =
      'Jarum baru sudah diberikan: server akan mengembalikan stok ke troli '
      '(reversal).';
  static const cancelReasonLabel = 'Alasan pembatalan';
  static const cancelReasonPresets = [
    'Operator membatalkan penukaran',
    'Salah input data',
    'Stok jarum tidak tersedia',
    'Konfirmasi ditolak pengawas',
  ];
  static const cancelConfirm = 'YA, BATALKAN';
  static const keepExchange = 'TIDAK';
  static const leaveTitle = 'Transaksi belum selesai';
  static const leaveBody =
      'Apakah Anda yakin ingin keluar? Transaksi tersimpan dan dapat '
      'dilanjutkan dari tombol TUKAR JARUM.';
  static const leaveStay = 'LANJUTKAN';
  static const leaveKeep = 'SIMPAN & KELUAR';
  static const leaveCancel = 'BATALKAN TRANSAKSI';

  // Progress (Doc 17 §44)
  static const stageOperator = 'Operator';
  static const stageOldNeedle = 'Jarum Lama';
  static const stageExchangeType = 'Penukaran';
  static const stageFragment = 'Patahan';
  static const stagePhoto = 'Foto';
  static const stageNewNeedle = 'Jarum Baru';
  static const stageIssue = 'Berikan';
  static const stageStore = 'Simpan';

  // RFID (FR-MOB-004, Doc 13 §9, Doc 17 §8–10)
  static const rfidTapTitle = 'TAP KARTU RFID';
  static const rfidWaiting = 'Menunggu kartu operator…';
  static const rfidManualLabel = 'Atau ketik UID kartu';
  static const rfidLookup = 'CARI OPERATOR';
  static const rfidOfflineTitle = 'IDENTIFIKASI OPERATOR BUTUH KONEKSI';
  static const rfidOffline =
      'Tablet sedang offline. Operator hanya dapat diidentifikasi saat '
      'online, jadi transaksi tidak dapat dilanjutkan sampai koneksi kembali.';
  static const rfidRejectedTitle = 'KARTU TIDAK DITEMUKAN';
  static const rfidRejected =
      'RFID tidak dikenali. Silakan tap ulang kartu atau hubungi PIC.';
  static const operatorFound = 'OPERATOR DITEMUKAN';
  static const operatorConfirm = 'KONFIRMASI OPERATOR';
  static const operatorRescan = 'TAP ULANG';
  static const employeeNumber = 'No. Karyawan';
  static const employeeName = 'Nama';

  // Needle / exchange type (FR-MOB-005/006, Doc 17 §11–13)
  static const oldNeedleQuestion = 'Type jarum yang ditukar';
  static const needleSearch = 'Cari type jarum';
  static const needleSelected = 'Type dipilih';
  static const needleNoneFound = 'Tidak ada type jarum yang cocok.';
  static const needleCatalogEmpty =
      'Data type jarum belum tersedia di tablet. Hubungkan ke server untuk '
      'memuat master data.';
  static const continueAction = 'LANJUTKAN';
  static const exchangeTypeQuestion = 'Apa type penukarannya?';
  static const changeNeedle = 'GANTI JARUM';
  static const typeUnavailable =
      'TYPE JARUM TIDAK TERSEDIA. Data type jarum sudah berubah, silakan '
      'pilih type lainnya.';
  static const exchangeTypeBroken = 'JARUM PATAH';
  static const exchangeTypeBent = 'JARUM BENGKOK';
  static const exchangeTypeChangeover = 'CHANGEOVER';

  // Fragment + confirmation (FR-MOB-007/008, Doc 17 §14–18, §49)
  static const fragmentQuestion = 'Apakah patahan jarum dibawa oleh operator?';
  static const fragmentFound = 'ADA / DIBAWA';
  static const fragmentNotFound = 'TIDAK ADA';
  static const fragmentNotFoundHint =
      'Memilih TIDAK ADA mengirim permintaan konfirmasi ke pengawas.';
  static const noApprover =
      'Tidak ada pengawas (approver) aktif untuk factory ini, sehingga '
      'konfirmasi tidak dapat dikirim. Hubungi System Admin.';
  static const awaitingTitle = 'MENUNGGU KONFIRMASI';
  static const awaitingBody =
      'Patahan jarum tidak ditemukan. Permintaan konfirmasi telah dikirim '
      'kepada pengawas. Status diperiksa otomatis.';
  static const checkStatus = 'CEK STATUS';
  static const confirmationPendingLabel = 'Menunggu Pengawas';
  static const confirmationApproved = 'KONFIRMASI DISETUJUI';
  static const confirmationApprovedBody =
      'Pengawas telah menyetujui proses penukaran. Lanjutkan dengan foto '
      'jarum.';
  static const exchangeBlockedTitle = 'PENUKARAN BELUM DAPAT DILANJUTKAN';
  static const confirmationRejected = 'Pengawas menolak konfirmasi.';
  static const confirmationExpired =
      'Permintaan konfirmasi sudah kadaluarsa tanpa keputusan.';
  static const confirmationReason = 'Alasan';
  static const blockedCancelHint =
      'Transaksi ini hanya dapat dibatalkan. Mulai penukaran baru setelah '
      'dibatalkan.';
  static const confirmationRejectedReason = 'Konfirmasi ditolak pengawas';
  static const confirmationExpiredReason = 'Konfirmasi kadaluarsa';

  // Evidence (FR-MOB-009, Doc 17 §19–20, §38, §48)
  static const photoOldNeedle = 'Foto jarum lama';
  static const photoBrokenFragment = 'Foto patahan jarum';
  static const photoOther = 'Foto lainnya';
  static const photoRequired = 'Foto wajib untuk transaksi.';
  static const photoCapture = 'AMBIL FOTO';
  static const photoUse = 'GUNAKAN FOTO';
  static const photoRetake = 'ULANGI';
  static const photoUploadFailed = 'Foto belum berhasil dikirim.';
  static const photoCameraStarting = 'Membuka kamera…';
  static const photoPermissionDenied =
      'Kamera diperlukan untuk foto jarum. Izinkan akses kamera di '
      'Pengaturan Android, lalu coba lagi.';
  static const photoCameraUnavailable = 'Kamera tidak dapat dibuka.';
  static const photoPreviewUnavailable = 'Pratinjau foto tidak tersedia';
  static const photoOf = 'dari';

  // New needle + stock (FR-MOB-010/011, Doc 07 §24, Doc 17 §21–23)
  static const newNeedleTitle = 'Jarum baru untuk operator';
  static const oldNeedleLabel = 'Type Jarum Lama';
  static const newNeedleLabel = 'Type Jarum Baru';
  static const changeNewNeedle = 'GANTI TYPE';
  static const chooseNewNeedle = 'PILIH JARUM BARU';
  static const stockOnTrolley = 'Stok di troli';
  static const stockUnknown = 'Stok belum dapat dimuat';
  static const stockHintNote =
      'Angka stok hanya informasi; server yang memutuskan ketersediaan.';
  static const stockUnavailableTitle = 'STOCK TIDAK TERSEDIA';
  static const stockUnavailable =
      'Stock jarum tidak tersedia pada trolley ini.';
  static const stockUnavailableContact = 'Hubungi PIC Inventory.';
  static const stockAvailableLabel = 'Stock';

  // Issue (FR-MOB-012, Doc 17 §24)
  static const issueTitle = 'Konfirmasi Penukaran';
  static const issueHint =
      'Pastikan jarum baru diberikan kepada operator. Stok troli dikurangi '
      'oleh server saat dikonfirmasi.';
  static const issueAction = 'KONFIRMASI & BERIKAN JARUM';
  static const issueDone =
      'Jarum baru berhasil diberikan. Stok troli sudah diperbarui oleh '
      'server.';
  static const summaryOperator = 'Operator';
  static const summaryExchangeType = 'Penukaran';
  static const summaryOldNeedle = 'Jarum Lama';
  static const summaryNewNeedle = 'Jarum Baru';
  static const summaryExchangeNumber = 'No. Transaksi';

  // Storage + complete (Doc 07 §26–27, Doc 17 §25–26)
  static const storeTitle =
      'Masukkan jarum lama ke lubang penyimpanan sesuai type penukarannya.';
  static const storeInto = 'Masukkan jarum ke';
  static const storeUnknownLocation =
      'Lokasi penyimpanan belum ada di data tablet. Ikuti label lubang pada '
      'troli; server mencatat lokasi yang benar.';
  static const noStorageMapping =
      'Belum ada lokasi penyimpanan aktif untuk troli dan type penukaran '
      'ini. Hubungi System Admin.';
  static const storeAction = 'SELESAI MENYIMPAN';
  static const completeTitle = 'Periksa lalu selesaikan transaksi';
  static const completeAction = 'SELESAIKAN PENUKARAN';
  static const doneTitle = 'PENUKARAN BERHASIL';
  static const doneStock = 'Stock berhasil diperbarui.';
  static const doneAction = 'SELESAI';
  static const cancelledTitle = 'TRANSAKSI DIBATALKAN';
  static const cancelledBody = 'Transaksi sudah dibatalkan di server.';
  static const cancelledReversed =
      'Jarum yang sudah diberikan dikembalikan ke stok troli oleh server '
      '(reversal).';
  static const stuckTitle = 'STATUS TRANSAKSI TIDAK DIKENALI';
  static const stuckBody =
      'Muat ulang status dari server, atau batalkan transaksi.';
  static const reload = 'MUAT ULANG';

  // Offline queue + sync (Phase 9 — Doc 15 §8, §19; Doc 17 §28–30, §47)
  static const pendingSyncTitle = 'MENUNGGU SINKRONISASI';
  static const savedOffline =
      'Tablet offline. Langkah ini tersimpan di tablet dan dikirim ke server '
      'otomatis saat online. Belum dikonfirmasi server.';
  static const savedNotSent =
      'Server belum dapat dihubungi. Langkah ini tersimpan di tablet dan '
      'dikirim ulang otomatis. Belum dikonfirmasi server.';
  static const pendingStepBanner =
      'Tersimpan di tablet — menunggu sinkronisasi. Langkah yang ditandai '
      'belum dikonfirmasi server.';
  static const issuePendingBanner =
      'Pengeluaran jarum BELUM dikonfirmasi server. Stok diperiksa server saat '
      'sinkronisasi; bila stok tidak cukup, transaksi kembali ke langkah '
      'pengeluaran jarum.';
  static const photoSavedOffline =
      'Foto tersimpan di tablet dan dikirim ke server sebelum langkah '
      'berikutnya.';
  static const awaitingOffline =
      'Tablet offline. Menunggu persetujuan pengawas — status diperbarui '
      'otomatis saat tablet online.';
  static const awaitingQueuedBody =
      'Patahan jarum tidak ditemukan. Permintaan konfirmasi dikirim ke '
      'pengawas saat tablet online; keputusan muncul di sini setelah '
      'sinkronisasi.';
  static const awaitingSyncTitle = 'TERSIMPAN — MENUNGGU SINKRONISASI';
  static const awaitingSyncBody =
      'Transaksi tersimpan di tablet dan dikirim otomatis saat online. '
      'Transaksi BELUM selesai sampai server mengonfirmasi.';
  static const awaitingSyncCancelTitle = 'PEMBATALAN MENUNGGU SINKRONISASI';
  static const awaitingSyncCancelBody =
      'Pembatalan tersimpan di tablet dan dikirim otomatis saat online. '
      'Transaksi belum dibatalkan di server.';
  static const syncNow = 'SINKRONKAN SEKARANG';
  static const syncRejectedTitle = 'DITOLAK SERVER';

  // Sync status (header / footer / card / Pending Sync screen)
  static const syncOnline = 'Online';
  static const syncOffline = 'Offline';
  static const syncSyncing = 'Menyinkronkan…';
  static const syncError = 'Sync error';
  static const syncPendingLabel = 'Pending';
  static const syncFailedLabel = 'Gagal';
  static const syncLastLabel = 'Sinkron terakhir';
  static const syncNever = 'belum pernah';
  static const syncScreenTitle = 'Pending Sync';
  static const syncScreenEmpty = 'Semua transaksi sudah tersinkron.';
  static const syncWaitingSuffix = 'transaksi menunggu sinkronisasi';
  static const syncNoNumber = 'Belum bernomor';
  static const syncOpenExchange = 'BUKA TRANSAKSI';
  static const syncRetryItem = 'COBA LAGI';
  static const syncCancelExchange = 'BATALKAN';
  static const syncTechnicalFailure =
      'Gagal terkirim (jaringan/server). Dicoba ulang otomatis';
  static const syncNextAttempt = 'percobaan berikutnya';
  static const syncPhotosWaiting = 'foto menunggu upload';
  static const syncRejectedHint =
      'Ditolak server — tidak dikirim ulang otomatis. Buka transaksi untuk '
      'melanjutkan, coba lagi, atau batalkan.';
  static const syncNeedsOnline = 'Sinkronisasi membutuhkan koneksi.';
  static const localSyncDraft = 'Draft';
  static const localSyncQueued = 'Menunggu sync';
  static const localSyncSyncing = 'Sedang sync';
  static const localSyncAccepted = 'Diterima server';
  static const localSyncRejected = 'Ditolak server';
  static const localSyncCompleted = 'Selesai (server)';

  // Trolley stock view (FR-MOB-015, contract matrix "Stock status labels":
  // NORMAL → Available, LOW → Low stock, OUT → Out of stock)
  static const stockScreenTitle = 'Stok Troli';
  static const stockStatusAvailable = 'Tersedia';
  static const stockStatusLow = 'Stok menipis';
  static const stockStatusOut = 'Stok habis';
  static const stockStatusUnknown = 'Tidak diketahui';
  static const stockColumnNeedle = 'Type Jarum';
  static const stockColumnQuantity = 'Jumlah';
  static const stockColumnMinimum = 'Stok Minimum';
  static const stockColumnStatus = 'Status';
  static const stockReadOnlyNote =
      'Hanya informasi. Stok diubah oleh server, tidak dari tablet.';
  static const stockUpdatedAt = 'Diperbarui';
  static const stockStaleOffline =
      'OFFLINE — menampilkan data stok tersimpan, belum tentu terkini.';
  static const stockStaleFailed =
      'Server tidak dapat dihubungi — menampilkan data stok tersimpan, belum '
      'tentu terkini.';
  static const stockSavedAt = 'Tersimpan';
  static const stockScreenEmpty = 'Belum ada data stok untuk troli ini.';
  static const stockNoCacheOffline =
      'Tablet offline dan belum ada data stok tersimpan. Hubungkan ke server '
      'untuk memuat stok troli.';
  static const stockLoadFailed = 'Data stok tidak dapat dimuat.';

  // Transaction history (FR-MOB-014, Doc 17 §27)
  static const historyScreenTitle = 'Riwayat Transaksi';
  static const historyColumnDate = 'Tanggal';
  static const historyColumnTime = 'Jam';
  static const historyColumnOperator = 'Operator';
  static const historyColumnOldNeedle = 'Jarum Lama';
  static const historyColumnExchangeType = 'Penukaran';
  static const historyColumnNewNeedle = 'Jarum Baru';
  static const historyColumnStatus = 'Status';
  static const historyColumnSync = 'Sinkron';
  static const historyFilterToday = 'Hari ini';
  static const historyFilterRange = 'Rentang tanggal';
  static const historyFilterStatus = 'Status';
  static const historyFilterExchangeType = 'Jenis penukaran';
  static const historyFilterNeedle = 'Type jarum';
  static const historyFilterAll = 'Semua';
  static const historyNeedleOld = 'Jarum lama';
  static const historyNeedleNew = 'Jarum baru';
  static const historyFilterReset = 'RESET FILTER';
  static const historyEmpty = 'Tidak ada transaksi untuk filter ini.';
  static const historyOffline =
      'OFFLINE — menampilkan data tersimpan di tablet saja. Riwayat lengkap '
      'tampil saat online.';
  static const historyServerUnreachable =
      'Server tidak dapat dihubungi — menampilkan data tersimpan di tablet '
      'saja.';
  static const historyLoadFailed = 'Riwayat dari server tidak dapat dimuat.';
  static const historyLoadMoreFailed = 'Halaman berikutnya gagal dimuat.';
  static const historyLoadMore = 'MUAT LAGI';
  static const historyShownOf = 'ditampilkan dari';
  static const historyNoOperator = '—';
  static const historyOperatorUnnamed = '(nama belum tersedia)';
  static const historyNotOnServer = 'Belum di server';
  static const historyNoValue = '—';

  // Exchange State labels (server state, CONTEXT.md — kept apart from the
  // local sync labels above)
  static const stateCreated = 'Dibuat';
  static const stateOperatorIdentified = 'Operator teridentifikasi';
  static const stateNeedleSelected = 'Jarum dipilih';
  static const stateExchangeTypeSelected = 'Penukaran dipilih';
  static const stateFragmentCheck = 'Cek patahan';
  static const stateConfirmationPending = 'Menunggu konfirmasi';
  static const stateEvidenceCaptured = 'Foto tersimpan';
  static const stateNewNeedleSelected = 'Jarum baru dipilih';
  static const stateNeedleIssued = 'Jarum diberikan';
  static const stateUsedNeedleStored = 'Jarum lama disimpan';
  static const stateCompleted = 'Selesai';
  static const stateCancelled = 'Dibatalkan';

  // Transaction detail (read-only)
  static const historyDetailTitle = 'Detail Transaksi';
  static const historyDetailMissing =
      'Data transaksi tidak tersedia. Kembali ke riwayat lalu pilih lagi.';
  static const historyDetailRefreshFailed =
      'Data terbaru dari server tidak dapat dimuat — menampilkan data '
      'terakhir yang diketahui.';
  static const historyDetailFragment = 'Status Patahan';
  static const historyDetailFragmentFound = 'Ditemukan';
  static const historyDetailFragmentNotFound = 'Tidak ditemukan';
  static const historyDetailConfirmation = 'Konfirmasi';
  static const historyDetailConfirmationNone = 'Tidak diperlukan';
  static const historyDetailConfirmationUnknown =
      'Ada (status belum diketahui)';
  static const confirmationStatusPending = 'Menunggu pengawas';
  static const confirmationStatusApproved = 'Disetujui';
  static const confirmationStatusRejected = 'Ditolak';
  static const confirmationStatusExpired = 'Kadaluarsa';
  static const historyDetailCreatedAt = 'Dibuat';
  static const historyDetailCompletedAt = 'Selesai';
  static const historyDetailCancelledAt = 'Dibatalkan';
  static const historyDetailPendingSteps = 'langkah menunggu sinkronisasi';
  static const historyDetailEvidence = 'Foto Bukti';
  static const historyDetailEvidenceOffline =
      'Foto hanya dapat dilihat saat online.';
  static const historyDetailEvidenceNone = 'Belum ada foto di server.';
  static const historyDetailEvidenceFailed = 'Foto tidak dapat dimuat.';
  static const historyDetailEvidenceNotReady = 'Belum terupload';
  static const historyDetailNotOnServer =
      'Transaksi ini belum tercatat di server; foto dan status tampil setelah '
      'sinkronisasi.';
  static const historyResume = 'LANJUTKAN TRANSAKSI';
}
