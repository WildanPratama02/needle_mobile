import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/sync/domain/sync_command.dart';

/// Everything the tablet knows locally about one exchange's synchronisation:
/// the last authoritative server state plus its queued steps and photos.
/// Input of `SyncStateMapper.forExchange`; rows of the Pending Sync screen
/// (Doc 17 §28).
final class ExchangeSyncView {
  const ExchangeSyncView({
    required this.clientTransactionId,
    required this.createdAt,
    this.exchangeNumber,
    this.serverState,
    this.confirmationStatus,
    this.hasServerRecord = false,
    this.commands = const [],
    this.photosAwaitingUpload = 0,
    this.closed = false,
    this.operatorName,
    this.operatorEmployeeNumber,
    this.deviceId,
    this.serverExchangeId,
    this.snapshot,
  });

  final String clientTransactionId;
  final DateTime createdAt;
  final String? exchangeNumber;

  /// Last Exchange State the backend reported — never a local guess.
  final ExchangeState? serverState;
  final ConfirmationStatus? confirmationStatus;

  /// `POST /exchanges` answered: the server knows this exchange.
  final bool hasServerRecord;

  /// This exchange's commands still on the tablet, in send order.
  final List<SyncCommand> commands;

  /// Photos the PIC accepted that are not uploaded yet (MG-7).
  final int photosAwaitingUpload;

  /// The PIC queued `COMPLETE_EXCHANGE` / `CANCEL_EXCHANGE`, or the server
  /// reported a terminal state.
  final bool closed;
  final String? operatorName;
  final String? operatorEmployeeNumber;

  /// Device the exchange was opened from (history is scoped to this device).
  final String? deviceId;

  /// The server's id once `POST /exchanges` answered — the key a history row
  /// of `GET /exchanges` is matched on.
  final String? serverExchangeId;

  /// Last server answer kept on the tablet; never edited locally.
  final ExchangeSnapshot? snapshot;

  /// The same view with a newer server-reported state (a history page read
  /// after the last sync). Only ever fed from a server answer.
  ExchangeSyncView withServerState(ExchangeState state) => ExchangeSyncView(
    clientTransactionId: clientTransactionId,
    createdAt: createdAt,
    exchangeNumber: exchangeNumber,
    serverState: state,
    confirmationStatus: confirmationStatus,
    hasServerRecord: true,
    commands: commands,
    photosAwaitingUpload: photosAwaitingUpload,
    closed: closed,
    operatorName: operatorName,
    operatorEmployeeNumber: operatorEmployeeNumber,
    deviceId: deviceId,
    serverExchangeId: serverExchangeId,
    snapshot: snapshot,
  );

  Iterable<SyncCommand> get queued => commands.where((c) => c.isQueued);

  SyncCommand? get rejected {
    for (final c in commands) {
      if (c.isRejected) return c;
    }
    return null;
  }

  /// The command whose technical failure holds this exchange back.
  SyncCommand? get failing {
    for (final c in commands) {
      if (c.isQueued) return c.hasTechnicalFailure ? c : null;
    }
    return null;
  }

  /// Something is still to be sent or decided.
  bool get unresolved =>
      queued.isNotEmpty || rejected != null || photosAwaitingUpload > 0;
}
