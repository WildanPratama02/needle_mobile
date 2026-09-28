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
