import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/core/network/idempotency_attempts.dart';
import 'package:nexa_mobile/core/network/retry_policy.dart';

AppError _error(String code, ErrorCategory category) =>
    AppError(category: category, code: code, userMessage: 'x');

final _timeout = _error(ClientErrorCodes.networkTimeout, ErrorCategory.network);
final _serverError = _error(
  ClientErrorCodes.temporaryServerError,
  ErrorCategory.technical,
);
final _noStock = _error(
  BackendErrorCodes.inventoryInsufficientStock,
  ErrorCategory.business,
);
final _invalidState = _error(
  BackendErrorCodes.exchangeInvalidState,
  ErrorCategory.conflict,
);

void main() {
  group('IdempotencyAttempts (Docs/12 §25, Doc 15 §10)', () {
    late int counter;
    late IdempotencyAttempts attempts;
    const issue = 'POST /exchanges/e1/issue';

    setUp(() {
      counter = 0;
      attempts = IdempotencyAttempts(newKey: () => 'key-${++counter}');
    });

    test('same command + same body while open → same key', () {
      final first = attempts.keyFor(issue, const {});
      attempts.settle(issue, _timeout);
      expect(attempts.keyFor(issue, const {}), first);
      attempts.settle(issue, _serverError);
      expect(attempts.keyFor(issue, const {}), first);
      expect(attempts.isOpen(issue), isTrue);
    });

    test('after a success the next send is a new attempt', () {
      final first = attempts.keyFor(issue, const {});
      attempts.settle(issue, null);
      expect(attempts.isOpen(issue), isFalse);
      expect(attempts.keyFor(issue, const {}), isNot(first));
    });

    test('after a business rejection the next send is a new attempt', () {
      for (final rejection in [_noStock, _invalidState]) {
        final key = attempts.keyFor(issue, const {});
        attempts.settle(issue, rejection);
        expect(attempts.keyFor(issue, const {}), isNot(key));
        attempts.settle(issue, null);
      }
    });

    test('a different body never reuses the key (422 IDEMPOTENCY_KEY_REUSED '
        'otherwise)', () {
      const command = 'POST /exchanges/e1/new-needle';
      final a = attempts.keyFor(command, {'needleTypeId': 'nt-1'});
      attempts.settle(command, _timeout);
      final b = attempts.keyFor(command, {'needleTypeId': 'nt-2'});
      expect(b, isNot(a));
    });

    test('key order in the body does not make a new attempt', () {
      const command = 'POST /exchanges/e1/type';
      final a = attempts.keyFor(command, {
        'exchangeTypeId': 'x',
        'oldNeedleTypeId': 'y',
      });
      attempts.settle(command, _timeout);
      final b = attempts.keyFor(command, {
        'oldNeedleTypeId': 'y',
        'exchangeTypeId': 'x',
      });
      expect(b, a);
    });

    test('attempts are scoped per command', () {
      final a = attempts.keyFor(
        'POST /exchanges/e1/store-used-needle',
        const {},
      );
      final b = attempts.keyFor('POST /exchanges/e1/complete', const {});
      expect(a, isNot(b));
    });

    test('default keys are UUID v4', () {
      final key = IdempotencyAttempts().keyFor(issue, const {});
      expect(
        key,
        matches(
          RegExp(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
          ),
        ),
      );
    });
  });

  group('RetryPolicy (Doc 07 §41 whitelist)', () {
    const policy = RetryPolicy.immediate();

    Future<(ApiResult<int>, int)> run(List<ApiResult<int>> answers) async {
      var calls = 0;
      final result = await policy.run(() async => answers[calls++]);
      return (result, calls);
    }

    test(
      'retries NETWORK_TIMEOUT and TEMPORARY_SERVER_ERROR, then succeeds',
      () async {
        final (result, calls) = await run([
          ApiFailure(_timeout),
          ApiFailure(_serverError),
          const ApiSuccess(1),
        ]);
        expect(result, isA<ApiSuccess<int>>());
        expect(calls, 3);
      },
    );

    test('gives up after the configured retries', () async {
      final (result, calls) = await run([
        ApiFailure(_timeout),
        ApiFailure(_timeout),
        ApiFailure(_timeout),
        const ApiSuccess(1),
      ]);
      expect(result, isA<ApiFailure<int>>());
      expect(calls, 3);
    });

    test('never retries a business rejection', () async {
      for (final rejection in [_noStock, _invalidState]) {
        final (result, calls) = await run([
          ApiFailure(rejection),
          const ApiSuccess(1),
        ]);
        expect((result as ApiFailure<int>).error.code, rejection.code);
        expect(calls, 1);
      }
    });

    test('a first success is returned as is', () async {
      final (_, calls) = await run([const ApiSuccess(1)]);
      expect(calls, 1);
    });
  });
}
