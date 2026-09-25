import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_status.dart';

/// One row of `GET /inventory/trolleys/{trolleyId}` (Docs/12), joined with
/// the needle type's display name from the bootstrap master-data cache —
/// the endpoint itself returns only `needleTypeCode` (contract matrix,
/// "Trolley stock view").
///
/// Read-only display data. Per ADR-004 / `nexa_mobile/CLAUDE.md` §1, these
/// numbers are a UI hint from the backend, never a client-computed balance,
/// and never used to allow/deny an exchange locally.
final class TrolleyStockItem {
  const TrolleyStockItem({
    required this.needleTypeId,
    required this.needleTypeCode,
    required this.displayName,
    required this.quantity,
    required this.minimumStock,
    required this.status,
  });

  final String needleTypeId;
  final String needleTypeCode;

  /// Bootstrap needle-type name when known, else [needleTypeCode].
  final String displayName;
  final int quantity;
  final int minimumStock;
  final TrolleyStockStatus status;
}
