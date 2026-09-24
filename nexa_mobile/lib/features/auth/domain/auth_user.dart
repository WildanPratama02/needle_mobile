/// Permission codes the tablet checks locally (Backend
/// `src/shared/constants/permissions.ts`). The backend enforces them anyway;
/// the tablet only uses them to hide actions a user cannot take.
abstract final class PermissionCodes {
  static const mobileOperate = 'MOBILE_OPERATE';
  static const deviceManage = 'DEVICE_MANAGE';
}

/// The signed-in user: the `user` of `POST /auth/login`, enriched with
/// `GET /auth/me` (permissions and factory/location scopes) once that loads.
final class AuthUser {
  const AuthUser({
    required this.id,
    required this.username,
    required this.name,
    required this.roles,
    this.permissions = const [],
    this.factoryIds = const [],
    this.locationIds = const [],
    this.profileLoaded = false,
  });

  final String id;
  final String username;
  final String name;
  final List<String> roles;
  final List<String> permissions;
  final List<String> factoryIds;
  final List<String> locationIds;

  /// `false` until a `GET /auth/me` answer has been stored.
  final bool profileLoaded;

  bool hasPermission(String code) => permissions.contains(code);

  /// Admin re-provisioning (MG-1 follow-up) is limited to users who manage
  /// devices in the WebApps.
  bool get canReprovisionDevice => hasPermission(PermissionCodes.deviceManage);

  AuthUser withProfile({
    required List<String> roles,
    required List<String> permissions,
    required List<String> factoryIds,
    required List<String> locationIds,
  }) => AuthUser(
    id: id,
    username: username,
    name: name,
    roles: roles,
    permissions: permissions,
    factoryIds: factoryIds,
    locationIds: locationIds,
    profileLoaded: true,
  );
}
