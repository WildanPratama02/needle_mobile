import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/core/error/error_mapper.dart';
import 'package:nexa_mobile/core/network/envelope.dart';

Map<String, Object?> _failure(String code, {Map<String, Object?>? context}) => {
  'success': false,
  'error': {
    'code': code,
    'message': 'Backend English message',
    'details': ['field must not be empty'],
    'context': ?context,
  },
  'meta': {'requestId': 'req-9'},
};

void main() {
  const mapper = ErrorMapper();

  group('Envelope.tryParse (Docs/12 §7)', () {
    test('parses success with data and meta', () {
      final envelope = Envelope.tryParse({
        'success': true,
        'data': {'a': 1},
        'meta': {'requestId': 'r', 'page': 2, 'total': 40},
      });
      expect(envelope, isA<SuccessEnvelope>());
      final success = envelope! as SuccessEnvelope;
      expect(success.data, {'a': 1});
      expect(success.meta.requestId, 'r');
      expect(success.meta.page, 2);
      expect(success.meta.total, 40);
    });

    test('parses failure with details and context', () {
      final envelope = Envelope.tryParse(
        _failure('DEVICE_INACTIVE', context: {'status': 'REVOKED'}),
      );
      final failure = envelope! as FailureEnvelope;
      expect(failure.error.code, 'DEVICE_INACTIVE');
      expect(failure.error.details, ['field must not be empty']);
      expect(failure.error.context, {'status': 'REVOKED'});
    });

    test('returns null for anything that is not an envelope', () {
      expect(Envelope.tryParse('<html>'), isNull);
      expect(Envelope.tryParse({'data': 1}), isNull);
      expect(Envelope.tryParse({'success': false}), isNull);
      expect(Envelope.tryParse(null), isNull);
    });
  });

  group('ErrorMapper categories (Doc 07 §40)', () {
    final cases = <(int, String, ErrorCategory)>[
      (401, 'UNAUTHORIZED', ErrorCategory.authentication),
      (403, 'FORBIDDEN', ErrorCategory.authorization),
      (403, 'FACTORY_SCOPE_DENIED', ErrorCategory.authorization),
      (403, 'DEVICE_INACTIVE', ErrorCategory.authorization),
      (403, 'DEVICE_MISMATCH', ErrorCategory.authorization),
      (409, 'EXCHANGE_INVALID_STATE', ErrorCategory.conflict),
      (409, 'CONFLICT', ErrorCategory.conflict),
      (409, 'INVENTORY_INSUFFICIENT_STOCK', ErrorCategory.business),
      (422, 'IDEMPOTENCY_KEY_REUSED', ErrorCategory.technical),
      (400, 'DEVICE_CONTEXT_REQUIRED', ErrorCategory.technical),
      (400, 'VALIDATION_ERROR', ErrorCategory.business),
      (404, 'DEVICE_NOT_FOUND', ErrorCategory.business),
      (422, 'RFID_INACTIVE', ErrorCategory.business),
      (429, 'RATE_LIMITED', ErrorCategory.technical),
    ];
    for (final (status, code, category) in cases) {
      test('$status $code → ${category.name}', () {
        final error = mapper.fromResponse(status, _failure(code));
        expect(error.code, code);
        expect(error.category, category);
        expect(error.httpStatus, status);
        expect(error.requestId, 'req-9');
        expect(error.isRetryable, isFalse);
      });
    }

    test('keeps structured context and the server message for logs', () {
      final error = mapper.fromResponse(
        409,
        _failure(
          'INVENTORY_INSUFFICIENT_STOCK',
          context: {'availableQuantity': 0, 'requestedQuantity': 1},
        ),
      );
      expect(error.context['availableQuantity'], 0);
      expect(error.serverMessage, 'Backend English message');
      expect(
        error.userMessage,
        'Stock jarum yang dipilih tidak tersedia pada trolley.',
      );
    });

    test('5xx → TEMPORARY_SERVER_ERROR, retryable', () {
      final error = mapper.fromResponse(500, _failure('INTERNAL_ERROR'));
      expect(error.code, ClientErrorCodes.temporaryServerError);
      expect(error.isRetryable, isTrue);
      expect(error.userMessage, isNot(contains('INTERNAL')));
    });

    test('no response → NETWORK_TIMEOUT, retryable', () {
      final error = mapper.fromDioException(
        DioException.connectionTimeout(
          timeout: const Duration(seconds: 10),
          requestOptions: RequestOptions(path: '/x'),
        ),
      );
      expect(error.code, ClientErrorCodes.networkTimeout);
      expect(error.category, ErrorCategory.network);
      expect(error.isRetryable, isTrue);
    });

    test('4xx without an envelope is categorised by status only', () {
      final error = mapper.fromResponse(403, '<html>proxy</html>');
      expect(error.code, BackendErrorCodes.forbidden);
      expect(error.category, ErrorCategory.authorization);
    });

    test('a 2xx without an envelope is a malformed response', () {
      final error = mapper.fromResponse(200, 'ok');
      expect(error.code, ClientErrorCodes.malformedResponse);
      expect(error.isRetryable, isFalse);
    });

    test('user messages never leak backend internals', () {
      for (final code in [
        'UNAUTHORIZED',
        'FORBIDDEN',
        'VALIDATION_ERROR',
        'SOMETHING_NEW',
      ]) {
        final error = mapper.fromResponse(400, _failure(code));
        expect(error.userMessage, isNot(contains('Backend English message')));
        expect(error.userMessage, isNotEmpty);
      }
    });
  });

  group('Doc 07 error names → backend codes (contract matrix, MG-8)', () {
    AppError of(int status, String code) =>
        mapper.fromResponse(status, _failure(code));

    test('maps every row of the matrix table', () {
      expect(
        of(409, 'INVENTORY_INSUFFICIENT_STOCK').specName,
        SpecErrorName.stockNotAvailable,
      );
      expect(
        of(409, 'EXCHANGE_INVALID_STATE').specName,
        SpecErrorName.invalidState,
      );
      expect(
        of(409, 'EXCHANGE_FRAGMENT_CONFIRMATION_REQUIRED').specName,
        SpecErrorName.confirmationRejected,
      );
      expect(of(403, 'DEVICE_INACTIVE').specName, SpecErrorName.deviceRevoked);
      expect(of(403, 'FORBIDDEN').specName, SpecErrorName.accessDenied);
      expect(
        of(403, 'FACTORY_SCOPE_DENIED').specName,
        SpecErrorName.accessDenied,
      );
      expect(
        of(503, 'SERVICE_UNAVAILABLE').specName,
        SpecErrorName.temporaryServerError,
      );
    });

    test(
      'only NETWORK_TIMEOUT and TEMPORARY_SERVER_ERROR retry (Doc 07 §41)',
      () {
        final notRetryable = [
          of(409, 'INVENTORY_INSUFFICIENT_STOCK'),
          of(403, 'FORBIDDEN'),
          of(403, 'DEVICE_INACTIVE'),
          of(409, 'EXCHANGE_FRAGMENT_CONFIRMATION_REQUIRED'),
          of(409, 'EXCHANGE_INVALID_STATE'),
        ];
        expect(notRetryable.where((e) => e.isRetryable), isEmpty);
      },
    );
  });
}
