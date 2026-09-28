import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/exchange/data/exchange_providers.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_repository.dart';
import 'package:nexa_mobile/features/history/domain/history_entry.dart';
import 'package:nexa_mobile/features/photo_evidence/data/evidence_providers.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence.dart';

/// The evidence section of the detail: presigned URLs are online-only.
sealed class DetailEvidence {
  const DetailEvidence();
}

final class EvidenceLoading extends DetailEvidence {
  const EvidenceLoading();
}

final class EvidenceOffline extends DetailEvidence {
  const EvidenceOffline();
}

/// `POST /exchanges` never answered: the server has no photos to list.
final class EvidenceNotOnServer extends DetailEvidence {
  const EvidenceNotOnServer();
}

final class EvidenceLoaded extends DetailEvidence {
  const EvidenceLoaded(this.items);

  final List<ServerEvidence> items;
}

final class EvidenceFailed extends DetailEvidence {
  const EvidenceFailed(this.error);

  final AppError error;
}

final class HistoryDetailState {
  const HistoryDetailState({
    this.fresh,
    this.refreshError,
    this.confirmation,
    this.evidence = const EvidenceLoading(),
  });

  /// `GET /exchanges/{id}` read when the detail opened (online).
  final ExchangeSnapshot? fresh;

  /// The fresh read failed; the row's last known data is shown.
  final AppError? refreshError;

  /// `GET /confirmations/{id}` when the exchange raised one.
  final ConfirmationStatus? confirmation;
  final DetailEvidence evidence;
}

/// Read-only detail of one history row (FR-MOB-014): re-reads the exchange,
/// its confirmation and its evidence from the server when online, through
/// the existing exchange and evidence repositories. Never writes anything.
class HistoryDetailController extends Notifier<HistoryDetailState> {
  HistoryDetailController(this.entry);

  final HistoryEntry entry;

  @override
  HistoryDetailState build() {
    final offline = ref.watch(
      connectivityStatusProvider.select(
        (s) => s.value == ConnectivityStatus.offline,
      ),
    );
    final serverId = entry.serverExchangeId;
    if (serverId == null) {
      return const HistoryDetailState(evidence: EvidenceNotOnServer());
    }
    if (offline) return const HistoryDetailState(evidence: EvidenceOffline());
    unawaited(Future.microtask(() => _load(serverId)));
    return const HistoryDetailState();
  }

  Future<void> _load(String serverId) async {
    final exchanges = ref.read(exchangeRepositoryProvider);
    final fetched = await exchanges.fetch(serverId);
    if (!ref.mounted) return;
    ExchangeSnapshot? fresh;
    AppError? refreshError;
    switch (fetched) {
      case CommandOk(:final value):
        fresh = value;
      case CommandFailed(:final error):
        refreshError = error;
    }

    ConfirmationStatus? confirmation;
    final confirmationId = (fresh ?? entry.server)?.confirmationId;
    if (confirmationId != null) {
      final read = await exchanges.fetchConfirmation(confirmationId);
      if (!ref.mounted) return;
      if (read case CommandOk(:final value)) confirmation = value.status;
    }

    final evidence = await ref
        .read(evidenceRepositoryProvider)
        .serverEvidence(serverId);
    if (!ref.mounted) return;
    state = HistoryDetailState(
      fresh: fresh,
      refreshError: refreshError,
      confirmation: confirmation,
      evidence: switch (evidence) {
        CommandOk(:final value) => EvidenceLoaded(value),
        CommandFailed(:final error) => EvidenceFailed(error),
      },
    );
  }
}

final historyDetailControllerProvider = NotifierProvider.autoDispose
    .family<HistoryDetailController, HistoryDetailState, HistoryEntry>(
      HistoryDetailController.new,
    );
