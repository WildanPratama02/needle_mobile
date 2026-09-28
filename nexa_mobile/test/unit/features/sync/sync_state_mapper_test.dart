import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/sync/domain/exchange_sync_view.dart';
import 'package:nexa_mobile/features/sync/domain/sync_command.dart';
import 'package:nexa_mobile/features/sync/domain/sync_result.dart';
import 'package:nexa_mobile/features/sync/domain/sync_state_mapper.dart';

import 'sync_planner_test.dart' show cmd;

SyncCommandResult result(
  SyncResultStatus status, {
  SyncCommandType type = SyncCommandType.issueNeedle,
  String? code,
  Map<String, Object?> context = const {},
}) => SyncCommandResult(
  commandId: 'c1',
  clientTransactionId: 'A',
  commandType: type,
  status: status,
  error: code == null ? null : SyncCommandError(code: code, context: context),
);

AppError _error(String code, {int? status}) => AppError(
  category: ErrorCategory.technical,
  code: code,
  userMessage: '-',
  httpStatus: status,
);

void main() {
  group(
    'SyncStateMapper.forResult — the matrix "Sync result → local state"',
    () {
      test('SUCCESS and IDEMPOTENT_SUCCESS are accepted', () {
        expect(
          SyncStateMapper.forResult(
            result(SyncResultStatus.success),
            evidencePending: false,
          ),
          isA<AcceptCommand>(),
        );
        expect(
          SyncStateMapper.forResult(
            result(SyncResultStatus.idempotentSuccess),
            evidencePending: false,
          ),
          isA<AcceptCommand>(),
        );
      });

      test('REJECTED is a rejection with its error, never a retry', () {
        final t = SyncStateMapper.forResult(
          result(
            SyncResultStatus.rejected,
            code: BackendErrorCodes.inventoryInsufficientStock,
            context: {'availableQuantity': 0},
          ),
          evidencePending: false,
        );
        expect(t, isA<RejectCommand>());
        final error = (t as RejectCommand).error;
        expect(error.code, BackendErrorCodes.inventoryInsufficientStock);
        expect(error.context['availableQuantity'], 0);
      });

      test(
        'FAILED stays queued for a retry; SKIPPED stays queued without one',
        () {
          expect(
            SyncStateMapper.forResult(
              result(SyncResultStatus.failed, code: 'INTERNAL_ERROR'),
              evidencePending: false,
            ),
            isA<RetryCommandLater>(),
          );
          expect(
            SyncStateMapper.forResult(
              result(SyncResultStatus.skipped),
              evidencePending: false,
            ),
            isA<KeepCommandQueued>(),
          );
        },
      );

      test('SELECT_NEW_NEEDLE refused for the evidence phase while photos wait '
          'is "upload, then resend" — not a user-facing rejection (MG-7)', () {
        for (final state in [
          'EXCHANGE_TYPE_SELECTED',
          'FRAGMENT_CHECK',
          'CONFIRMATION_PENDING',
        ]) {
          final r = result(
            SyncResultStatus.rejected,
            type: SyncCommandType.selectNewNeedle,
            code: BackendErrorCodes.exchangeInvalidState,
            context: {'currentState': state, 'action': 'SELECT_NEW_NEEDLE'},
          );
          expect(
            SyncStateMapper.forResult(r, evidencePending: true),
            isA<UploadEvidenceThenResend>(),
            reason: state,
          );
          // No photos waiting: a real rejection the PIC must see.
          expect(
            SyncStateMapper.forResult(r, evidencePending: false),
            isA<RejectCommand>(),
            reason: state,
          );
        }
        // Other states / codes / commands are ordinary rejections.
        expect(
          SyncStateMapper.forResult(
            result(
              SyncResultStatus.rejected,
              type: SyncCommandType.selectNewNeedle,
              code: BackendErrorCodes.exchangeInvalidState,
              context: {'currentState': 'NEW_NEEDLE_SELECTED'},
            ),
            evidencePending: true,
          ),
          isA<RejectCommand>(),
        );
        expect(
          SyncStateMapper.forResult(
            result(
              SyncResultStatus.rejected,
              type: SyncCommandType.selectNewNeedle,
              code: BackendErrorCodes.inventoryInsufficientStock,
            ),
            evidencePending: true,
          ),
          isA<RejectCommand>(),
        );
        expect(
          SyncStateMapper.forResult(
            result(
              SyncResultStatus.rejected,
              type: SyncCommandType.fragmentValidation,
              code: BackendErrorCodes.exchangeInvalidState,
              context: {'currentState': 'EXCHANGE_TYPE_SELECTED'},
            ),
            evidencePending: true,
          ),
          isA<RejectCommand>(),
        );
      });
    },
  );

  group('SyncStateMapper.forRequestFailure — whole request', () {
    test(
      'no answer / 5xx retry; DEVICE_INACTIVE blocks; 401 waits for login',
      () {
        expect(
          SyncStateMapper.forRequestFailure(
            _error(ClientErrorCodes.networkTimeout),
          ),
          SyncRequestFailure.retryLater,
        );
        expect(
          SyncStateMapper.forRequestFailure(
            _error(ClientErrorCodes.temporaryServerError, status: 503),
          ),
          SyncRequestFailure.retryLater,
        );
        expect(
          SyncStateMapper.forRequestFailure(
            _error(BackendErrorCodes.deviceInactive, status: 403),
          ),
          SyncRequestFailure.deviceBlocked,
        );
        expect(
          SyncStateMapper.forRequestFailure(
            _error(BackendErrorCodes.unauthorized, status: 401),
          ),
          SyncRequestFailure.sessionLost,
        );
        expect(
          SyncStateMapper.forRequestFailure(
            _error(BackendErrorCodes.validationError, status: 400),
          ),
          SyncRequestFailure.badRequest,
        );
      },
    );
  });

  group('SyncStateMapper.forExchange — local state (Doc 15 §8)', () {
    ExchangeSyncView view({
      ExchangeState? server = ExchangeState.operatorIdentified,
      bool onServer = true,
      List<SyncCommand> commands = const [],
      int photos = 0,
    }) => ExchangeSyncView(
      clientTransactionId: 'A',
      createdAt: DateTime(2026),
      serverState: server,
      hasServerRecord: onServer,
      commands: commands,
      photosAwaitingUpload: photos,
    );

    test('not on the server yet → LOCAL_DRAFT', () {
      expect(
        SyncStateMapper.forExchange(view(server: null, onServer: false)),
        LocalSyncState.localDraft,
      );
    });

    test('queued steps or photos → QUEUED, or SYNCING while in flight', () {
      final queued = view(commands: [cmd(1, 'A', SyncCommandType.issueNeedle)]);
      expect(SyncStateMapper.forExchange(queued), LocalSyncState.queued);
      expect(
        SyncStateMapper.forExchange(queued, syncing: true),
        LocalSyncState.syncing,
      );
      expect(
        SyncStateMapper.forExchange(view(photos: 1)),
        LocalSyncState.queued,
      );
    });

    test('a rejection wins → SERVER_REJECTED', () {
      expect(
        SyncStateMapper.forExchange(
          view(
            commands: [
              cmd(
                1,
                'A',
                SyncCommandType.issueNeedle,
                status: SyncCommandStatus.rejected,
              ),
              cmd(2, 'A', SyncCommandType.storeUsedNeedle),
            ],
          ),
          syncing: true,
        ),
        LocalSyncState.serverRejected,
      );
    });

    test('everything accepted → SERVER_ACCEPTED; COMPLETED only from the '
        'server state', () {
      final accepted = [
        cmd(
          1,
          'A',
          SyncCommandType.completeExchange,
          status: SyncCommandStatus.accepted,
        ),
      ];
      expect(
        SyncStateMapper.forExchange(
          view(server: ExchangeState.usedNeedleStored, commands: accepted),
        ),
        LocalSyncState.serverAccepted,
      );
      expect(
        SyncStateMapper.forExchange(
          view(server: ExchangeState.completed, commands: accepted),
        ),
        LocalSyncState.completed,
      );
      // A queued complete is never COMPLETED.
      expect(
        SyncStateMapper.forExchange(
          view(
            server: ExchangeState.usedNeedleStored,
            commands: [cmd(1, 'A', SyncCommandType.completeExchange)],
          ),
        ),
        LocalSyncState.queued,
      );
      expect(
        SyncStateMapper.forExchange(view(server: ExchangeState.cancelled)),
        LocalSyncState.serverAccepted,
      );
    });

    test('Pending vs Failed counts are disjoint', () {
      final pending = view(
        commands: [cmd(1, 'A', SyncCommandType.issueNeedle)],
      );
      final retrying = view(
        commands: [cmd(1, 'A', SyncCommandType.issueNeedle, attempts: 1)],
      );
      final rejected = view(
        commands: [
          cmd(
            1,
            'A',
            SyncCommandType.issueNeedle,
            status: SyncCommandStatus.rejected,
          ),
        ],
      );
      expect(SyncStateMapper.isPending(pending), isTrue);
      expect(SyncStateMapper.isFailed(pending), isFalse);
      expect(SyncStateMapper.isPending(retrying), isFalse);
      expect(SyncStateMapper.isFailed(retrying), isTrue);
      expect(SyncStateMapper.isFailed(rejected), isTrue);
      expect(SyncStateMapper.isPending(view()), isFalse);
      expect(SyncStateMapper.isFailed(view()), isFalse);
    });
  });
}
