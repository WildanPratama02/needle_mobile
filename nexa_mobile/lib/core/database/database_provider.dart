import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/database/app_database.dart';

/// The one database instance. Tests override it with an in-memory database.
final appDatabaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase.open();
  ref.onDispose(db.close);
  return db;
});
