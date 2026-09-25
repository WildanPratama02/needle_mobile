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

  // Home buttons whose features land in a later phase (Docs/21 Phase 10).
  static const trolleyStock = '/home/stock';
  static const history = '/home/history';
}
