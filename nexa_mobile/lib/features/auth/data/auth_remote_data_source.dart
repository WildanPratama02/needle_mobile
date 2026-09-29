import 'package:nexa_mobile/core/network/api_client.dart';
import 'package:nexa_mobile/core/network/api_result.dart';

List<String> _strings(Object? value) =>
    (value as List<Object?>).map((e) => e! as String).toList(growable: false);

/// `data` of `POST /auth/login` (Backend `LoginResponseDto`).
final class LoginResponseDto {
  const LoginResponseDto({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresInSeconds,
    required this.userId,
    required this.username,
    required this.name,
    required this.roles,
  });

  factory LoginResponseDto.fromJson(Object? json) {
    final map = json! as Map<String, Object?>;
    final user = map['user']! as Map<String, Object?>;
    return LoginResponseDto(
      accessToken: map['accessToken']! as String,
      refreshToken: map['refreshToken']! as String,
      expiresInSeconds: (map['expiresIn']! as num).toInt(),
      userId: user['id']! as String,
      username: user['username']! as String,
      name: user['name']! as String,
      roles: _strings(user['roles']),
    );
  }

  final String accessToken;
  final String refreshToken;
  final int expiresInSeconds;
  final String userId;
  final String username;
  final String name;
  final List<String> roles;
}

/// `data` of `GET /auth/me` (Backend `MeResponseDto`).
final class MeResponseDto {
  const MeResponseDto({
    required this.id,
    required this.username,
    required this.name,
    required this.roles,
    required this.permissions,
    required this.factoryIds,
    required this.locationIds,
  });

  factory MeResponseDto.fromJson(Object? json) {
    final map = json! as Map<String, Object?>;
    return MeResponseDto(
      id: map['id']! as String,
      username: map['username']! as String,
      name: map['name']! as String,
      roles: _strings(map['roles']),
      permissions: _strings(map['permissions']),
      factoryIds: _strings(map['factoryIds']),
      locationIds: _strings(map['locationIds']),
    );
  }

  final String id;
  final String username;
  final String name;
  final List<String> roles;
  final List<String> permissions;
  final List<String> factoryIds;
  final List<String> locationIds;
}

/// `/auth/*` calls, all through the shared [ApiClient].
class AuthRemoteDataSource {
  const AuthRemoteDataSource(this._api);

  final ApiClient _api;

  Future<ApiResult<LoginResponseDto>> login(String username, String password) =>
      _api.post(
        '/auth/login',
        body: {'username': username, 'password': password},
        authenticated: false,
        decode: LoginResponseDto.fromJson,
      );

  Future<ApiResult<MeResponseDto>> me() =>
      _api.get('/auth/me', decode: MeResponseDto.fromJson);

  /// 204 on success; revokes the refresh token server-side.
  Future<ApiResult<void>> logout(String refreshToken) => _api.post<void>(
    '/auth/logout',
    body: {'refreshToken': refreshToken},
    authenticated: false,
    decode: (_) {},
  );
}
