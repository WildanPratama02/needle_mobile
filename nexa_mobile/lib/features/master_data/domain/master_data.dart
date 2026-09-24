/// Master data the tablet caches from `GET /mobile/bootstrap` (Docs/12 §18).
/// Only ACTIVE rows are ever sent.
library;

final class NeedleType {
  const NeedleType({
    required this.id,
    required this.code,
    required this.name,
    required this.unit,
    required this.minimumStock,
    this.category,
  });

  final String id;
  final String code;
  final String name;
  final String? category;
  final String unit;

  /// Decimal as a string, as the backend sends it — never used as a stock
  /// figure on the tablet (ADR-004).
  final String minimumStock;
}

final class ExchangeType {
  const ExchangeType({
    required this.id,
    required this.code,
    required this.name,
    required this.requiresFragmentValidation,
  });

  final String id;

  /// `BROKEN`, `BENT`, `CHANGEOVER` (CONTEXT.md "Exchange Type").
  final String code;
  final String name;
  final bool requiresFragmentValidation;
}

final class StorageMapping {
  const StorageMapping({
    required this.id,
    required this.exchangeTypeId,
    required this.storageLocationId,
    required this.storageLocationCode,
    required this.storageLocationName,
  });

  final String id;
  final String exchangeTypeId;
  final String storageLocationId;
  final String storageLocationCode;
  final String storageLocationName;
}
