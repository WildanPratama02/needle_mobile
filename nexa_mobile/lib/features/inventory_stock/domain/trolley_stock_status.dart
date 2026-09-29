/// Backend `stockStatus` on `GET /inventory/trolleys/{trolleyId}` (Docs/12
/// §"Inventory"). The contract matrix (row "Trolley stock view", FR-MOB-015)
/// flags a DRIFT: the backend sends `NORMAL/LOW/OUT`, Doc 07's wireframe
/// names them `AVAILABLE/LOW STOCK/OUT OF STOCK` — the matrix says follow
/// the backend field values, so this enum matches the wire, not the doc.
enum TrolleyStockStatus {
  normal,
  low,

  /// Backend `OUT` (zero on hand) — shown as "KRITIS" (critical) in the
  /// Home dashboard per the reference design.
  critical,
  unknown;

  static TrolleyStockStatus fromWire(String? value) => switch (value) {
    'NORMAL' => TrolleyStockStatus.normal,
    'LOW' => TrolleyStockStatus.low,
    'OUT' => TrolleyStockStatus.critical,
    _ => TrolleyStockStatus.unknown,
  };
}
