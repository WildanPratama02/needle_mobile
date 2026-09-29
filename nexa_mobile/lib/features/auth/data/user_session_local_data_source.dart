import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/features/auth/domain/auth_user.dart';

/// The cached signed-in user (`local_user_session`, one row).
class UserSessionLocalDataSource {
  const UserSessionLocalDataSource(this._db);

  final AppDatabase _db;

  Future<AuthUser?> read() async {
    final row = await _db.select(_db.localUserSession).getSingleOrNull();
    if (row == null) return null;
    return AuthUser(
      id: row.userId,
      username: row.username,
      name: row.name,
      roles: _decode(row.roles),
      permissions: _decode(row.permissions),
      factoryIds: _decode(row.factoryIds),
      locationIds: _decode(row.locationIds),
      profileLoaded: row.profileLoaded,
    );
  }

  Future<void> write(AuthUser user) => _db
      .into(_db.localUserSession)
      .insertOnConflictUpdate(
        LocalUserSessionCompanion.insert(
          slot: const Value(0),
          userId: user.id,
          username: user.username,
          name: user.name,
          roles: jsonEncode(user.roles),
          permissions: Value(jsonEncode(user.permissions)),
          factoryIds: Value(jsonEncode(user.factoryIds)),
          locationIds: Value(jsonEncode(user.locationIds)),
          profileLoaded: Value(user.profileLoaded),
          updatedAt: DateTime.now(),
        ),
      );

  Future<void> clear() => _db.delete(_db.localUserSession).go();

  static List<String> _decode(String json) =>
      (jsonDecode(json) as List<Object?>).cast<String>();
}
