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

  // Placeholders
  static const featurePending = 'Fitur ini belum tersedia di versi ini.';
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
}
