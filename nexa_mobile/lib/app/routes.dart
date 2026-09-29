abstract final class Routes {
  static const startup = '/startup';
  static const provision = '/provision';
  static const login = '/login';
  static const blocked = '/blocked';
  static const home = '/home';
  static const settings = '/settings';

  /// The exchange wizard (Docs/21 Phase 6–8): opens a new exchange, or
  /// resumes this tablet's unfinished one.
  static const newExchange = '/home/exchange';

  /// Pending Sync (Doc 17 §28): queued / failed / rejected exchanges.
  static const syncQueue = '/home/sync';

  /// Trolley stock view (FR-MOB-015, Docs/21 Phase 10).
  static const trolleyStock = '/home/stock';

  /// Transaction history (FR-MOB-014, Docs/21 Phase 10).
  static const history = '/home/history';

  /// Read-only detail of one history row; the row travels as `extra`.
  static const historyDetail = '/home/history/detail';
}
