import 'package:nexa_mobile/core/error/app_error.dart';

/// Indonesian user-facing text per error code, falling back per category
/// (Doc 17 §32, §35). The backend's English `error.message` is kept for logs
/// only.
abstract final class ErrorMessages {
  static const Map<String, String> _byCode = {
    ClientErrorCodes.networkTimeout:
        'Koneksi sedang bermasalah. Periksa jaringan lalu coba lagi.',
    ClientErrorCodes.temporaryServerError:
        'Server sedang bermasalah. Silakan coba lagi.',
    ClientErrorCodes.malformedResponse: 'Terjadi kesalahan. Silakan coba lagi.',
    BackendErrorCodes.unauthorized:
        'Sesi Anda telah berakhir. Silakan login kembali.',
    BackendErrorCodes.authInvalidToken:
        'Sesi Anda telah berakhir. Silakan login kembali.',
    BackendErrorCodes.forbidden: 'Anda tidak memiliki akses untuk proses ini.',
    BackendErrorCodes.authForbidden:
        'Anda tidak memiliki akses untuk proses ini.',
    BackendErrorCodes.factoryScopeDenied:
        'Anda tidak memiliki akses ke factory ini.',
    BackendErrorCodes.rateLimited:
        'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
    BackendErrorCodes.validationError: 'Data yang dikirim tidak valid.',
    BackendErrorCodes.deviceInactive:
        'Device ini tidak aktif. Hubungi System Admin.',
    BackendErrorCodes.deviceNotFound:
        'Device belum terdaftar. Hubungi System Admin untuk registrasi device.',
    BackendErrorCodes.deviceMismatch:
        'Device / trolley tidak sesuai. Silakan hubungi System Admin.',
    BackendErrorCodes.deviceContextRequired:
        'Device belum dikenali. Lakukan registrasi device ulang.',
    BackendErrorCodes.inventoryInsufficientStock:
        'Stock jarum yang dipilih tidak tersedia pada trolley.',
    BackendErrorCodes.exchangeInvalidState:
        'Status transaksi sudah berubah. Muat ulang transaksi.',
    BackendErrorCodes.exchangeFragmentConfirmationRequired:
        'Transaksi menunggu konfirmasi patahan jarum.',
    BackendErrorCodes.idempotencyKeyReused:
        'Terjadi kesalahan. Silakan coba lagi.',
    BackendErrorCodes.rfidNotFound: 'Kartu RFID tidak terdaftar.',
    BackendErrorCodes.rfidInactive: 'Kartu RFID tidak aktif.',
    BackendErrorCodes.employeeInactive: 'Operator tidak aktif.',
  };

  static String forCode(String code, ErrorCategory category) =>
      _byCode[code] ?? forCategory(category);

  static String forCategory(ErrorCategory category) => switch (category) {
    ErrorCategory.technical => 'Terjadi kesalahan. Silakan coba lagi.',
    ErrorCategory.business => 'Permintaan tidak dapat diproses.',
    ErrorCategory.network =>
      'Koneksi sedang bermasalah. Periksa jaringan lalu coba lagi.',
    ErrorCategory.authentication =>
      'Sesi Anda telah berakhir. Silakan login kembali.',
    ErrorCategory.authorization =>
      'Anda tidak memiliki akses untuk proses ini.',
    ErrorCategory.conflict =>
      'Data sudah berubah di server. Muat ulang lalu coba lagi.',
  };
}
