import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/features/rfid/data/keyboard_wedge_rfid_reader.dart';
import 'package:nexa_mobile/features/rfid/data/rfid_remote_data_source.dart';
import 'package:nexa_mobile/features/rfid/data/rfid_repository_impl.dart';
import 'package:nexa_mobile/features/rfid/domain/operator_lookup.dart';
import 'package:nexa_mobile/features/rfid/domain/rfid_reader.dart';

final rfidRepositoryProvider = Provider<RfidRepository>(
  (ref) => RfidRepositoryImpl(
    RfidRemoteDataSource(ref.watch(apiClientProvider)),
    ref.watch(retryPolicyProvider),
  ),
);

/// The active reader, alive while the scan screen is shown. v1: the
/// keyboard-wedge / manual reader; the hardware adapter (TBD) replaces this
/// provider's body only. Debounce window from `RFID_DEBOUNCE_MS` (Doc 13 §7).
final rfidReaderProvider = Provider.autoDispose<RfidReader>((ref) {
  final reader = KeyboardWedgeRfidReader(
    debounce: ref.watch(appConfigProvider).rfidDebounce,
  );
  ref.onDispose(reader.dispose);
  return reader;
});
