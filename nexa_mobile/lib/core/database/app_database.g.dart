// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $LocalUserSessionTable extends LocalUserSession
    with TableInfo<$LocalUserSessionTable, UserSessionRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalUserSessionTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _slotMeta = const VerificationMeta('slot');
  @override
  late final GeneratedColumn<int> slot = GeneratedColumn<int>(
    'slot',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _userIdMeta = const VerificationMeta('userId');
  @override
  late final GeneratedColumn<String> userId = GeneratedColumn<String>(
    'user_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _usernameMeta = const VerificationMeta(
    'username',
  );
  @override
  late final GeneratedColumn<String> username = GeneratedColumn<String>(
    'username',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _rolesMeta = const VerificationMeta('roles');
  @override
  late final GeneratedColumn<String> roles = GeneratedColumn<String>(
    'roles',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _permissionsMeta = const VerificationMeta(
    'permissions',
  );
  @override
  late final GeneratedColumn<String> permissions = GeneratedColumn<String>(
    'permissions',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('[]'),
  );
  static const VerificationMeta _factoryIdsMeta = const VerificationMeta(
    'factoryIds',
  );
  @override
  late final GeneratedColumn<String> factoryIds = GeneratedColumn<String>(
    'factory_ids',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('[]'),
  );
  static const VerificationMeta _locationIdsMeta = const VerificationMeta(
    'locationIds',
  );
  @override
  late final GeneratedColumn<String> locationIds = GeneratedColumn<String>(
    'location_ids',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('[]'),
  );
  static const VerificationMeta _profileLoadedMeta = const VerificationMeta(
    'profileLoaded',
  );
  @override
  late final GeneratedColumn<bool> profileLoaded = GeneratedColumn<bool>(
    'profile_loaded',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("profile_loaded" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    slot,
    userId,
    username,
    name,
    roles,
    permissions,
    factoryIds,
    locationIds,
    profileLoaded,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_user_session';
  @override
  VerificationContext validateIntegrity(
    Insertable<UserSessionRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('slot')) {
      context.handle(
        _slotMeta,
        slot.isAcceptableOrUnknown(data['slot']!, _slotMeta),
      );
    }
    if (data.containsKey('user_id')) {
      context.handle(
        _userIdMeta,
        userId.isAcceptableOrUnknown(data['user_id']!, _userIdMeta),
      );
    } else if (isInserting) {
      context.missing(_userIdMeta);
    }
    if (data.containsKey('username')) {
      context.handle(
        _usernameMeta,
        username.isAcceptableOrUnknown(data['username']!, _usernameMeta),
      );
    } else if (isInserting) {
      context.missing(_usernameMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('roles')) {
      context.handle(
        _rolesMeta,
        roles.isAcceptableOrUnknown(data['roles']!, _rolesMeta),
      );
    } else if (isInserting) {
      context.missing(_rolesMeta);
    }
    if (data.containsKey('permissions')) {
      context.handle(
        _permissionsMeta,
        permissions.isAcceptableOrUnknown(
          data['permissions']!,
          _permissionsMeta,
        ),
      );
    }
    if (data.containsKey('factory_ids')) {
      context.handle(
        _factoryIdsMeta,
        factoryIds.isAcceptableOrUnknown(data['factory_ids']!, _factoryIdsMeta),
      );
    }
    if (data.containsKey('location_ids')) {
      context.handle(
        _locationIdsMeta,
        locationIds.isAcceptableOrUnknown(
          data['location_ids']!,
          _locationIdsMeta,
        ),
      );
    }
    if (data.containsKey('profile_loaded')) {
      context.handle(
        _profileLoadedMeta,
        profileLoaded.isAcceptableOrUnknown(
          data['profile_loaded']!,
          _profileLoadedMeta,
        ),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {slot};
  @override
  UserSessionRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return UserSessionRow(
      slot: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}slot'],
      )!,
      userId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}user_id'],
      )!,
      username: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}username'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      roles: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}roles'],
      )!,
      permissions: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}permissions'],
      )!,
      factoryIds: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}factory_ids'],
      )!,
      locationIds: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}location_ids'],
      )!,
      profileLoaded: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}profile_loaded'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $LocalUserSessionTable createAlias(String alias) {
    return $LocalUserSessionTable(attachedDatabase, alias);
  }
}

class UserSessionRow extends DataClass implements Insertable<UserSessionRow> {
  final int slot;
  final String userId;
  final String username;
  final String name;

  /// JSON arrays of strings.
  final String roles;
  final String permissions;
  final String factoryIds;
  final String locationIds;
  final bool profileLoaded;
  final DateTime updatedAt;
  const UserSessionRow({
    required this.slot,
    required this.userId,
    required this.username,
    required this.name,
    required this.roles,
    required this.permissions,
    required this.factoryIds,
    required this.locationIds,
    required this.profileLoaded,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['slot'] = Variable<int>(slot);
    map['user_id'] = Variable<String>(userId);
    map['username'] = Variable<String>(username);
    map['name'] = Variable<String>(name);
    map['roles'] = Variable<String>(roles);
    map['permissions'] = Variable<String>(permissions);
    map['factory_ids'] = Variable<String>(factoryIds);
    map['location_ids'] = Variable<String>(locationIds);
    map['profile_loaded'] = Variable<bool>(profileLoaded);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  LocalUserSessionCompanion toCompanion(bool nullToAbsent) {
    return LocalUserSessionCompanion(
      slot: Value(slot),
      userId: Value(userId),
      username: Value(username),
      name: Value(name),
      roles: Value(roles),
      permissions: Value(permissions),
      factoryIds: Value(factoryIds),
      locationIds: Value(locationIds),
      profileLoaded: Value(profileLoaded),
      updatedAt: Value(updatedAt),
    );
  }

  factory UserSessionRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return UserSessionRow(
      slot: serializer.fromJson<int>(json['slot']),
      userId: serializer.fromJson<String>(json['userId']),
      username: serializer.fromJson<String>(json['username']),
      name: serializer.fromJson<String>(json['name']),
      roles: serializer.fromJson<String>(json['roles']),
      permissions: serializer.fromJson<String>(json['permissions']),
      factoryIds: serializer.fromJson<String>(json['factoryIds']),
      locationIds: serializer.fromJson<String>(json['locationIds']),
      profileLoaded: serializer.fromJson<bool>(json['profileLoaded']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'slot': serializer.toJson<int>(slot),
      'userId': serializer.toJson<String>(userId),
      'username': serializer.toJson<String>(username),
      'name': serializer.toJson<String>(name),
      'roles': serializer.toJson<String>(roles),
      'permissions': serializer.toJson<String>(permissions),
      'factoryIds': serializer.toJson<String>(factoryIds),
      'locationIds': serializer.toJson<String>(locationIds),
      'profileLoaded': serializer.toJson<bool>(profileLoaded),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  UserSessionRow copyWith({
    int? slot,
    String? userId,
    String? username,
    String? name,
    String? roles,
    String? permissions,
    String? factoryIds,
    String? locationIds,
    bool? profileLoaded,
    DateTime? updatedAt,
  }) => UserSessionRow(
    slot: slot ?? this.slot,
    userId: userId ?? this.userId,
    username: username ?? this.username,
    name: name ?? this.name,
    roles: roles ?? this.roles,
    permissions: permissions ?? this.permissions,
    factoryIds: factoryIds ?? this.factoryIds,
    locationIds: locationIds ?? this.locationIds,
    profileLoaded: profileLoaded ?? this.profileLoaded,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  UserSessionRow copyWithCompanion(LocalUserSessionCompanion data) {
    return UserSessionRow(
      slot: data.slot.present ? data.slot.value : this.slot,
      userId: data.userId.present ? data.userId.value : this.userId,
      username: data.username.present ? data.username.value : this.username,
      name: data.name.present ? data.name.value : this.name,
      roles: data.roles.present ? data.roles.value : this.roles,
      permissions: data.permissions.present
          ? data.permissions.value
          : this.permissions,
      factoryIds: data.factoryIds.present
          ? data.factoryIds.value
          : this.factoryIds,
      locationIds: data.locationIds.present
          ? data.locationIds.value
          : this.locationIds,
      profileLoaded: data.profileLoaded.present
          ? data.profileLoaded.value
          : this.profileLoaded,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('UserSessionRow(')
          ..write('slot: $slot, ')
          ..write('userId: $userId, ')
          ..write('username: $username, ')
          ..write('name: $name, ')
          ..write('roles: $roles, ')
          ..write('permissions: $permissions, ')
          ..write('factoryIds: $factoryIds, ')
          ..write('locationIds: $locationIds, ')
          ..write('profileLoaded: $profileLoaded, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    slot,
    userId,
    username,
    name,
    roles,
    permissions,
    factoryIds,
    locationIds,
    profileLoaded,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is UserSessionRow &&
          other.slot == this.slot &&
          other.userId == this.userId &&
          other.username == this.username &&
          other.name == this.name &&
          other.roles == this.roles &&
          other.permissions == this.permissions &&
          other.factoryIds == this.factoryIds &&
          other.locationIds == this.locationIds &&
          other.profileLoaded == this.profileLoaded &&
          other.updatedAt == this.updatedAt);
}

class LocalUserSessionCompanion extends UpdateCompanion<UserSessionRow> {
  final Value<int> slot;
  final Value<String> userId;
  final Value<String> username;
  final Value<String> name;
  final Value<String> roles;
  final Value<String> permissions;
  final Value<String> factoryIds;
  final Value<String> locationIds;
  final Value<bool> profileLoaded;
  final Value<DateTime> updatedAt;
  const LocalUserSessionCompanion({
    this.slot = const Value.absent(),
    this.userId = const Value.absent(),
    this.username = const Value.absent(),
    this.name = const Value.absent(),
    this.roles = const Value.absent(),
    this.permissions = const Value.absent(),
    this.factoryIds = const Value.absent(),
    this.locationIds = const Value.absent(),
    this.profileLoaded = const Value.absent(),
    this.updatedAt = const Value.absent(),
  });
  LocalUserSessionCompanion.insert({
    this.slot = const Value.absent(),
    required String userId,
    required String username,
    required String name,
    required String roles,
    this.permissions = const Value.absent(),
    this.factoryIds = const Value.absent(),
    this.locationIds = const Value.absent(),
    this.profileLoaded = const Value.absent(),
    required DateTime updatedAt,
  }) : userId = Value(userId),
       username = Value(username),
       name = Value(name),
       roles = Value(roles),
       updatedAt = Value(updatedAt);
  static Insertable<UserSessionRow> custom({
    Expression<int>? slot,
    Expression<String>? userId,
    Expression<String>? username,
    Expression<String>? name,
    Expression<String>? roles,
    Expression<String>? permissions,
    Expression<String>? factoryIds,
    Expression<String>? locationIds,
    Expression<bool>? profileLoaded,
    Expression<DateTime>? updatedAt,
  }) {
    return RawValuesInsertable({
      if (slot != null) 'slot': slot,
      if (userId != null) 'user_id': userId,
      if (username != null) 'username': username,
      if (name != null) 'name': name,
      if (roles != null) 'roles': roles,
      if (permissions != null) 'permissions': permissions,
      if (factoryIds != null) 'factory_ids': factoryIds,
      if (locationIds != null) 'location_ids': locationIds,
      if (profileLoaded != null) 'profile_loaded': profileLoaded,
      if (updatedAt != null) 'updated_at': updatedAt,
    });
  }

  LocalUserSessionCompanion copyWith({
    Value<int>? slot,
    Value<String>? userId,
    Value<String>? username,
    Value<String>? name,
    Value<String>? roles,
    Value<String>? permissions,
    Value<String>? factoryIds,
    Value<String>? locationIds,
    Value<bool>? profileLoaded,
    Value<DateTime>? updatedAt,
  }) {
    return LocalUserSessionCompanion(
      slot: slot ?? this.slot,
      userId: userId ?? this.userId,
      username: username ?? this.username,
      name: name ?? this.name,
      roles: roles ?? this.roles,
      permissions: permissions ?? this.permissions,
      factoryIds: factoryIds ?? this.factoryIds,
      locationIds: locationIds ?? this.locationIds,
      profileLoaded: profileLoaded ?? this.profileLoaded,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (slot.present) {
      map['slot'] = Variable<int>(slot.value);
    }
    if (userId.present) {
      map['user_id'] = Variable<String>(userId.value);
    }
    if (username.present) {
      map['username'] = Variable<String>(username.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (roles.present) {
      map['roles'] = Variable<String>(roles.value);
    }
    if (permissions.present) {
      map['permissions'] = Variable<String>(permissions.value);
    }
    if (factoryIds.present) {
      map['factory_ids'] = Variable<String>(factoryIds.value);
    }
    if (locationIds.present) {
      map['location_ids'] = Variable<String>(locationIds.value);
    }
    if (profileLoaded.present) {
      map['profile_loaded'] = Variable<bool>(profileLoaded.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalUserSessionCompanion(')
          ..write('slot: $slot, ')
          ..write('userId: $userId, ')
          ..write('username: $username, ')
          ..write('name: $name, ')
          ..write('roles: $roles, ')
          ..write('permissions: $permissions, ')
          ..write('factoryIds: $factoryIds, ')
          ..write('locationIds: $locationIds, ')
          ..write('profileLoaded: $profileLoaded, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }
}

class $LocalDeviceContextTable extends LocalDeviceContext
    with TableInfo<$LocalDeviceContextTable, DeviceContextRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalDeviceContextTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _slotMeta = const VerificationMeta('slot');
  @override
  late final GeneratedColumn<int> slot = GeneratedColumn<int>(
    'slot',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _deviceIdMeta = const VerificationMeta(
    'deviceId',
  );
  @override
  late final GeneratedColumn<String> deviceId = GeneratedColumn<String>(
    'device_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _deviceCodeMeta = const VerificationMeta(
    'deviceCode',
  );
  @override
  late final GeneratedColumn<String> deviceCode = GeneratedColumn<String>(
    'device_code',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _deviceNameMeta = const VerificationMeta(
    'deviceName',
  );
  @override
  late final GeneratedColumn<String> deviceName = GeneratedColumn<String>(
    'device_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _factoryIdMeta = const VerificationMeta(
    'factoryId',
  );
  @override
  late final GeneratedColumn<String> factoryId = GeneratedColumn<String>(
    'factory_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _factoryCodeMeta = const VerificationMeta(
    'factoryCode',
  );
  @override
  late final GeneratedColumn<String> factoryCode = GeneratedColumn<String>(
    'factory_code',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _factoryNameMeta = const VerificationMeta(
    'factoryName',
  );
  @override
  late final GeneratedColumn<String> factoryName = GeneratedColumn<String>(
    'factory_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _factoryTimezoneMeta = const VerificationMeta(
    'factoryTimezone',
  );
  @override
  late final GeneratedColumn<String> factoryTimezone = GeneratedColumn<String>(
    'factory_timezone',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _trolleyIdMeta = const VerificationMeta(
    'trolleyId',
  );
  @override
  late final GeneratedColumn<String> trolleyId = GeneratedColumn<String>(
    'trolley_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _trolleyCodeMeta = const VerificationMeta(
    'trolleyCode',
  );
  @override
  late final GeneratedColumn<String> trolleyCode = GeneratedColumn<String>(
    'trolley_code',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _trolleyNameMeta = const VerificationMeta(
    'trolleyName',
  );
  @override
  late final GeneratedColumn<String> trolleyName = GeneratedColumn<String>(
    'trolley_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _trolleyLocationIdMeta = const VerificationMeta(
    'trolleyLocationId',
  );
  @override
  late final GeneratedColumn<String> trolleyLocationId =
      GeneratedColumn<String>(
        'trolley_location_id',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _serverTimeMeta = const VerificationMeta(
    'serverTime',
  );
  @override
  late final GeneratedColumn<DateTime> serverTime = GeneratedColumn<DateTime>(
    'server_time',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _syncCursorMeta = const VerificationMeta(
    'syncCursor',
  );
  @override
  late final GeneratedColumn<String> syncCursor = GeneratedColumn<String>(
    'sync_cursor',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _fetchedAtMeta = const VerificationMeta(
    'fetchedAt',
  );
  @override
  late final GeneratedColumn<DateTime> fetchedAt = GeneratedColumn<DateTime>(
    'fetched_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    slot,
    deviceId,
    deviceCode,
    deviceName,
    factoryId,
    factoryCode,
    factoryName,
    factoryTimezone,
    trolleyId,
    trolleyCode,
    trolleyName,
    trolleyLocationId,
    serverTime,
    syncCursor,
    fetchedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_device_context';
  @override
  VerificationContext validateIntegrity(
    Insertable<DeviceContextRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('slot')) {
      context.handle(
        _slotMeta,
        slot.isAcceptableOrUnknown(data['slot']!, _slotMeta),
      );
    }
    if (data.containsKey('device_id')) {
      context.handle(
        _deviceIdMeta,
        deviceId.isAcceptableOrUnknown(data['device_id']!, _deviceIdMeta),
      );
    } else if (isInserting) {
      context.missing(_deviceIdMeta);
    }
    if (data.containsKey('device_code')) {
      context.handle(
        _deviceCodeMeta,
        deviceCode.isAcceptableOrUnknown(data['device_code']!, _deviceCodeMeta),
      );
    } else if (isInserting) {
      context.missing(_deviceCodeMeta);
    }
    if (data.containsKey('device_name')) {
      context.handle(
        _deviceNameMeta,
        deviceName.isAcceptableOrUnknown(data['device_name']!, _deviceNameMeta),
      );
    } else if (isInserting) {
      context.missing(_deviceNameMeta);
    }
    if (data.containsKey('factory_id')) {
      context.handle(
        _factoryIdMeta,
        factoryId.isAcceptableOrUnknown(data['factory_id']!, _factoryIdMeta),
      );
    } else if (isInserting) {
      context.missing(_factoryIdMeta);
    }
    if (data.containsKey('factory_code')) {
      context.handle(
        _factoryCodeMeta,
        factoryCode.isAcceptableOrUnknown(
          data['factory_code']!,
          _factoryCodeMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_factoryCodeMeta);
    }
    if (data.containsKey('factory_name')) {
      context.handle(
        _factoryNameMeta,
        factoryName.isAcceptableOrUnknown(
          data['factory_name']!,
          _factoryNameMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_factoryNameMeta);
    }
    if (data.containsKey('factory_timezone')) {
      context.handle(
        _factoryTimezoneMeta,
        factoryTimezone.isAcceptableOrUnknown(
          data['factory_timezone']!,
          _factoryTimezoneMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_factoryTimezoneMeta);
    }
    if (data.containsKey('trolley_id')) {
      context.handle(
        _trolleyIdMeta,
        trolleyId.isAcceptableOrUnknown(data['trolley_id']!, _trolleyIdMeta),
      );
    } else if (isInserting) {
      context.missing(_trolleyIdMeta);
    }
    if (data.containsKey('trolley_code')) {
      context.handle(
        _trolleyCodeMeta,
        trolleyCode.isAcceptableOrUnknown(
          data['trolley_code']!,
          _trolleyCodeMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_trolleyCodeMeta);
    }
    if (data.containsKey('trolley_name')) {
      context.handle(
        _trolleyNameMeta,
        trolleyName.isAcceptableOrUnknown(
          data['trolley_name']!,
          _trolleyNameMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_trolleyNameMeta);
    }
    if (data.containsKey('trolley_location_id')) {
      context.handle(
        _trolleyLocationIdMeta,
        trolleyLocationId.isAcceptableOrUnknown(
          data['trolley_location_id']!,
          _trolleyLocationIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_trolleyLocationIdMeta);
    }
    if (data.containsKey('server_time')) {
      context.handle(
        _serverTimeMeta,
        serverTime.isAcceptableOrUnknown(data['server_time']!, _serverTimeMeta),
      );
    } else if (isInserting) {
      context.missing(_serverTimeMeta);
    }
    if (data.containsKey('sync_cursor')) {
      context.handle(
        _syncCursorMeta,
        syncCursor.isAcceptableOrUnknown(data['sync_cursor']!, _syncCursorMeta),
      );
    } else if (isInserting) {
      context.missing(_syncCursorMeta);
    }
    if (data.containsKey('fetched_at')) {
      context.handle(
        _fetchedAtMeta,
        fetchedAt.isAcceptableOrUnknown(data['fetched_at']!, _fetchedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_fetchedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {slot};
  @override
  DeviceContextRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return DeviceContextRow(
      slot: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}slot'],
      )!,
      deviceId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}device_id'],
      )!,
      deviceCode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}device_code'],
      )!,
      deviceName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}device_name'],
      )!,
      factoryId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}factory_id'],
      )!,
      factoryCode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}factory_code'],
      )!,
      factoryName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}factory_name'],
      )!,
      factoryTimezone: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}factory_timezone'],
      )!,
      trolleyId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}trolley_id'],
      )!,
      trolleyCode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}trolley_code'],
      )!,
      trolleyName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}trolley_name'],
      )!,
      trolleyLocationId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}trolley_location_id'],
      )!,
      serverTime: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}server_time'],
      )!,
      syncCursor: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sync_cursor'],
      )!,
      fetchedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}fetched_at'],
      )!,
    );
  }

  @override
  $LocalDeviceContextTable createAlias(String alias) {
    return $LocalDeviceContextTable(attachedDatabase, alias);
  }
}

class DeviceContextRow extends DataClass
    implements Insertable<DeviceContextRow> {
  final int slot;
  final String deviceId;
  final String deviceCode;
  final String deviceName;
  final String factoryId;
  final String factoryCode;
  final String factoryName;
  final String factoryTimezone;
  final String trolleyId;
  final String trolleyCode;
  final String trolleyName;
  final String trolleyLocationId;
  final DateTime serverTime;
  final String syncCursor;

  /// Local time the bootstrap answer arrived — drives the "cached since" hint.
  final DateTime fetchedAt;
  const DeviceContextRow({
    required this.slot,
    required this.deviceId,
    required this.deviceCode,
    required this.deviceName,
    required this.factoryId,
    required this.factoryCode,
    required this.factoryName,
    required this.factoryTimezone,
    required this.trolleyId,
    required this.trolleyCode,
    required this.trolleyName,
    required this.trolleyLocationId,
    required this.serverTime,
    required this.syncCursor,
    required this.fetchedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['slot'] = Variable<int>(slot);
    map['device_id'] = Variable<String>(deviceId);
    map['device_code'] = Variable<String>(deviceCode);
    map['device_name'] = Variable<String>(deviceName);
    map['factory_id'] = Variable<String>(factoryId);
    map['factory_code'] = Variable<String>(factoryCode);
    map['factory_name'] = Variable<String>(factoryName);
    map['factory_timezone'] = Variable<String>(factoryTimezone);
    map['trolley_id'] = Variable<String>(trolleyId);
    map['trolley_code'] = Variable<String>(trolleyCode);
    map['trolley_name'] = Variable<String>(trolleyName);
    map['trolley_location_id'] = Variable<String>(trolleyLocationId);
    map['server_time'] = Variable<DateTime>(serverTime);
    map['sync_cursor'] = Variable<String>(syncCursor);
    map['fetched_at'] = Variable<DateTime>(fetchedAt);
    return map;
  }

  LocalDeviceContextCompanion toCompanion(bool nullToAbsent) {
    return LocalDeviceContextCompanion(
      slot: Value(slot),
      deviceId: Value(deviceId),
      deviceCode: Value(deviceCode),
      deviceName: Value(deviceName),
      factoryId: Value(factoryId),
      factoryCode: Value(factoryCode),
      factoryName: Value(factoryName),
      factoryTimezone: Value(factoryTimezone),
      trolleyId: Value(trolleyId),
      trolleyCode: Value(trolleyCode),
      trolleyName: Value(trolleyName),
      trolleyLocationId: Value(trolleyLocationId),
      serverTime: Value(serverTime),
      syncCursor: Value(syncCursor),
      fetchedAt: Value(fetchedAt),
    );
  }

  factory DeviceContextRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return DeviceContextRow(
      slot: serializer.fromJson<int>(json['slot']),
      deviceId: serializer.fromJson<String>(json['deviceId']),
      deviceCode: serializer.fromJson<String>(json['deviceCode']),
      deviceName: serializer.fromJson<String>(json['deviceName']),
      factoryId: serializer.fromJson<String>(json['factoryId']),
      factoryCode: serializer.fromJson<String>(json['factoryCode']),
      factoryName: serializer.fromJson<String>(json['factoryName']),
      factoryTimezone: serializer.fromJson<String>(json['factoryTimezone']),
      trolleyId: serializer.fromJson<String>(json['trolleyId']),
      trolleyCode: serializer.fromJson<String>(json['trolleyCode']),
      trolleyName: serializer.fromJson<String>(json['trolleyName']),
      trolleyLocationId: serializer.fromJson<String>(json['trolleyLocationId']),
      serverTime: serializer.fromJson<DateTime>(json['serverTime']),
      syncCursor: serializer.fromJson<String>(json['syncCursor']),
      fetchedAt: serializer.fromJson<DateTime>(json['fetchedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'slot': serializer.toJson<int>(slot),
      'deviceId': serializer.toJson<String>(deviceId),
      'deviceCode': serializer.toJson<String>(deviceCode),
      'deviceName': serializer.toJson<String>(deviceName),
      'factoryId': serializer.toJson<String>(factoryId),
      'factoryCode': serializer.toJson<String>(factoryCode),
      'factoryName': serializer.toJson<String>(factoryName),
      'factoryTimezone': serializer.toJson<String>(factoryTimezone),
      'trolleyId': serializer.toJson<String>(trolleyId),
      'trolleyCode': serializer.toJson<String>(trolleyCode),
      'trolleyName': serializer.toJson<String>(trolleyName),
      'trolleyLocationId': serializer.toJson<String>(trolleyLocationId),
      'serverTime': serializer.toJson<DateTime>(serverTime),
      'syncCursor': serializer.toJson<String>(syncCursor),
      'fetchedAt': serializer.toJson<DateTime>(fetchedAt),
    };
  }

  DeviceContextRow copyWith({
    int? slot,
    String? deviceId,
    String? deviceCode,
    String? deviceName,
    String? factoryId,
    String? factoryCode,
    String? factoryName,
    String? factoryTimezone,
    String? trolleyId,
    String? trolleyCode,
    String? trolleyName,
    String? trolleyLocationId,
    DateTime? serverTime,
    String? syncCursor,
    DateTime? fetchedAt,
  }) => DeviceContextRow(
    slot: slot ?? this.slot,
    deviceId: deviceId ?? this.deviceId,
    deviceCode: deviceCode ?? this.deviceCode,
    deviceName: deviceName ?? this.deviceName,
    factoryId: factoryId ?? this.factoryId,
    factoryCode: factoryCode ?? this.factoryCode,
    factoryName: factoryName ?? this.factoryName,
    factoryTimezone: factoryTimezone ?? this.factoryTimezone,
    trolleyId: trolleyId ?? this.trolleyId,
    trolleyCode: trolleyCode ?? this.trolleyCode,
    trolleyName: trolleyName ?? this.trolleyName,
    trolleyLocationId: trolleyLocationId ?? this.trolleyLocationId,
    serverTime: serverTime ?? this.serverTime,
    syncCursor: syncCursor ?? this.syncCursor,
    fetchedAt: fetchedAt ?? this.fetchedAt,
  );
  DeviceContextRow copyWithCompanion(LocalDeviceContextCompanion data) {
    return DeviceContextRow(
      slot: data.slot.present ? data.slot.value : this.slot,
      deviceId: data.deviceId.present ? data.deviceId.value : this.deviceId,
      deviceCode: data.deviceCode.present
          ? data.deviceCode.value
          : this.deviceCode,
      deviceName: data.deviceName.present
          ? data.deviceName.value
          : this.deviceName,
      factoryId: data.factoryId.present ? data.factoryId.value : this.factoryId,
      factoryCode: data.factoryCode.present
          ? data.factoryCode.value
          : this.factoryCode,
      factoryName: data.factoryName.present
          ? data.factoryName.value
          : this.factoryName,
      factoryTimezone: data.factoryTimezone.present
          ? data.factoryTimezone.value
          : this.factoryTimezone,
      trolleyId: data.trolleyId.present ? data.trolleyId.value : this.trolleyId,
      trolleyCode: data.trolleyCode.present
          ? data.trolleyCode.value
          : this.trolleyCode,
      trolleyName: data.trolleyName.present
          ? data.trolleyName.value
          : this.trolleyName,
      trolleyLocationId: data.trolleyLocationId.present
          ? data.trolleyLocationId.value
          : this.trolleyLocationId,
      serverTime: data.serverTime.present
          ? data.serverTime.value
          : this.serverTime,
      syncCursor: data.syncCursor.present
          ? data.syncCursor.value
          : this.syncCursor,
      fetchedAt: data.fetchedAt.present ? data.fetchedAt.value : this.fetchedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('DeviceContextRow(')
          ..write('slot: $slot, ')
          ..write('deviceId: $deviceId, ')
          ..write('deviceCode: $deviceCode, ')
          ..write('deviceName: $deviceName, ')
          ..write('factoryId: $factoryId, ')
          ..write('factoryCode: $factoryCode, ')
          ..write('factoryName: $factoryName, ')
          ..write('factoryTimezone: $factoryTimezone, ')
          ..write('trolleyId: $trolleyId, ')
          ..write('trolleyCode: $trolleyCode, ')
          ..write('trolleyName: $trolleyName, ')
          ..write('trolleyLocationId: $trolleyLocationId, ')
          ..write('serverTime: $serverTime, ')
          ..write('syncCursor: $syncCursor, ')
          ..write('fetchedAt: $fetchedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    slot,
    deviceId,
    deviceCode,
    deviceName,
    factoryId,
    factoryCode,
    factoryName,
    factoryTimezone,
    trolleyId,
    trolleyCode,
    trolleyName,
    trolleyLocationId,
    serverTime,
    syncCursor,
    fetchedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is DeviceContextRow &&
          other.slot == this.slot &&
          other.deviceId == this.deviceId &&
          other.deviceCode == this.deviceCode &&
          other.deviceName == this.deviceName &&
          other.factoryId == this.factoryId &&
          other.factoryCode == this.factoryCode &&
          other.factoryName == this.factoryName &&
          other.factoryTimezone == this.factoryTimezone &&
          other.trolleyId == this.trolleyId &&
          other.trolleyCode == this.trolleyCode &&
          other.trolleyName == this.trolleyName &&
          other.trolleyLocationId == this.trolleyLocationId &&
          other.serverTime == this.serverTime &&
          other.syncCursor == this.syncCursor &&
          other.fetchedAt == this.fetchedAt);
}

class LocalDeviceContextCompanion extends UpdateCompanion<DeviceContextRow> {
  final Value<int> slot;
  final Value<String> deviceId;
  final Value<String> deviceCode;
  final Value<String> deviceName;
  final Value<String> factoryId;
  final Value<String> factoryCode;
  final Value<String> factoryName;
  final Value<String> factoryTimezone;
  final Value<String> trolleyId;
  final Value<String> trolleyCode;
  final Value<String> trolleyName;
  final Value<String> trolleyLocationId;
  final Value<DateTime> serverTime;
  final Value<String> syncCursor;
  final Value<DateTime> fetchedAt;
  const LocalDeviceContextCompanion({
    this.slot = const Value.absent(),
    this.deviceId = const Value.absent(),
    this.deviceCode = const Value.absent(),
    this.deviceName = const Value.absent(),
    this.factoryId = const Value.absent(),
    this.factoryCode = const Value.absent(),
    this.factoryName = const Value.absent(),
    this.factoryTimezone = const Value.absent(),
    this.trolleyId = const Value.absent(),
    this.trolleyCode = const Value.absent(),
    this.trolleyName = const Value.absent(),
    this.trolleyLocationId = const Value.absent(),
    this.serverTime = const Value.absent(),
    this.syncCursor = const Value.absent(),
    this.fetchedAt = const Value.absent(),
  });
  LocalDeviceContextCompanion.insert({
    this.slot = const Value.absent(),
    required String deviceId,
    required String deviceCode,
    required String deviceName,
    required String factoryId,
    required String factoryCode,
    required String factoryName,
    required String factoryTimezone,
    required String trolleyId,
    required String trolleyCode,
    required String trolleyName,
    required String trolleyLocationId,
    required DateTime serverTime,
    required String syncCursor,
    required DateTime fetchedAt,
  }) : deviceId = Value(deviceId),
       deviceCode = Value(deviceCode),
       deviceName = Value(deviceName),
       factoryId = Value(factoryId),
       factoryCode = Value(factoryCode),
       factoryName = Value(factoryName),
       factoryTimezone = Value(factoryTimezone),
       trolleyId = Value(trolleyId),
       trolleyCode = Value(trolleyCode),
       trolleyName = Value(trolleyName),
       trolleyLocationId = Value(trolleyLocationId),
       serverTime = Value(serverTime),
       syncCursor = Value(syncCursor),
       fetchedAt = Value(fetchedAt);
  static Insertable<DeviceContextRow> custom({
    Expression<int>? slot,
    Expression<String>? deviceId,
    Expression<String>? deviceCode,
    Expression<String>? deviceName,
    Expression<String>? factoryId,
    Expression<String>? factoryCode,
    Expression<String>? factoryName,
    Expression<String>? factoryTimezone,
    Expression<String>? trolleyId,
    Expression<String>? trolleyCode,
    Expression<String>? trolleyName,
    Expression<String>? trolleyLocationId,
    Expression<DateTime>? serverTime,
    Expression<String>? syncCursor,
    Expression<DateTime>? fetchedAt,
  }) {
    return RawValuesInsertable({
      if (slot != null) 'slot': slot,
      if (deviceId != null) 'device_id': deviceId,
      if (deviceCode != null) 'device_code': deviceCode,
      if (deviceName != null) 'device_name': deviceName,
      if (factoryId != null) 'factory_id': factoryId,
      if (factoryCode != null) 'factory_code': factoryCode,
      if (factoryName != null) 'factory_name': factoryName,
      if (factoryTimezone != null) 'factory_timezone': factoryTimezone,
      if (trolleyId != null) 'trolley_id': trolleyId,
      if (trolleyCode != null) 'trolley_code': trolleyCode,
      if (trolleyName != null) 'trolley_name': trolleyName,
      if (trolleyLocationId != null) 'trolley_location_id': trolleyLocationId,
      if (serverTime != null) 'server_time': serverTime,
      if (syncCursor != null) 'sync_cursor': syncCursor,
      if (fetchedAt != null) 'fetched_at': fetchedAt,
    });
  }

  LocalDeviceContextCompanion copyWith({
    Value<int>? slot,
    Value<String>? deviceId,
    Value<String>? deviceCode,
    Value<String>? deviceName,
    Value<String>? factoryId,
    Value<String>? factoryCode,
    Value<String>? factoryName,
    Value<String>? factoryTimezone,
    Value<String>? trolleyId,
    Value<String>? trolleyCode,
    Value<String>? trolleyName,
    Value<String>? trolleyLocationId,
    Value<DateTime>? serverTime,
    Value<String>? syncCursor,
    Value<DateTime>? fetchedAt,
  }) {
    return LocalDeviceContextCompanion(
      slot: slot ?? this.slot,
      deviceId: deviceId ?? this.deviceId,
      deviceCode: deviceCode ?? this.deviceCode,
      deviceName: deviceName ?? this.deviceName,
      factoryId: factoryId ?? this.factoryId,
      factoryCode: factoryCode ?? this.factoryCode,
      factoryName: factoryName ?? this.factoryName,
      factoryTimezone: factoryTimezone ?? this.factoryTimezone,
      trolleyId: trolleyId ?? this.trolleyId,
      trolleyCode: trolleyCode ?? this.trolleyCode,
      trolleyName: trolleyName ?? this.trolleyName,
      trolleyLocationId: trolleyLocationId ?? this.trolleyLocationId,
      serverTime: serverTime ?? this.serverTime,
      syncCursor: syncCursor ?? this.syncCursor,
      fetchedAt: fetchedAt ?? this.fetchedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (slot.present) {
      map['slot'] = Variable<int>(slot.value);
    }
    if (deviceId.present) {
      map['device_id'] = Variable<String>(deviceId.value);
    }
    if (deviceCode.present) {
      map['device_code'] = Variable<String>(deviceCode.value);
    }
    if (deviceName.present) {
      map['device_name'] = Variable<String>(deviceName.value);
    }
    if (factoryId.present) {
      map['factory_id'] = Variable<String>(factoryId.value);
    }
    if (factoryCode.present) {
      map['factory_code'] = Variable<String>(factoryCode.value);
    }
    if (factoryName.present) {
      map['factory_name'] = Variable<String>(factoryName.value);
    }
    if (factoryTimezone.present) {
      map['factory_timezone'] = Variable<String>(factoryTimezone.value);
    }
    if (trolleyId.present) {
      map['trolley_id'] = Variable<String>(trolleyId.value);
    }
    if (trolleyCode.present) {
      map['trolley_code'] = Variable<String>(trolleyCode.value);
    }
    if (trolleyName.present) {
      map['trolley_name'] = Variable<String>(trolleyName.value);
    }
    if (trolleyLocationId.present) {
      map['trolley_location_id'] = Variable<String>(trolleyLocationId.value);
    }
    if (serverTime.present) {
      map['server_time'] = Variable<DateTime>(serverTime.value);
    }
    if (syncCursor.present) {
      map['sync_cursor'] = Variable<String>(syncCursor.value);
    }
    if (fetchedAt.present) {
      map['fetched_at'] = Variable<DateTime>(fetchedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalDeviceContextCompanion(')
          ..write('slot: $slot, ')
          ..write('deviceId: $deviceId, ')
          ..write('deviceCode: $deviceCode, ')
          ..write('deviceName: $deviceName, ')
          ..write('factoryId: $factoryId, ')
          ..write('factoryCode: $factoryCode, ')
          ..write('factoryName: $factoryName, ')
          ..write('factoryTimezone: $factoryTimezone, ')
          ..write('trolleyId: $trolleyId, ')
          ..write('trolleyCode: $trolleyCode, ')
          ..write('trolleyName: $trolleyName, ')
          ..write('trolleyLocationId: $trolleyLocationId, ')
          ..write('serverTime: $serverTime, ')
          ..write('syncCursor: $syncCursor, ')
          ..write('fetchedAt: $fetchedAt')
          ..write(')'))
        .toString();
  }
}

class $LocalDeviceValidationTable extends LocalDeviceValidation
    with TableInfo<$LocalDeviceValidationTable, DeviceValidationRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalDeviceValidationTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _slotMeta = const VerificationMeta('slot');
  @override
  late final GeneratedColumn<int> slot = GeneratedColumn<int>(
    'slot',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _deviceIdMeta = const VerificationMeta(
    'deviceId',
  );
  @override
  late final GeneratedColumn<String> deviceId = GeneratedColumn<String>(
    'device_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _checkedAtMeta = const VerificationMeta(
    'checkedAt',
  );
  @override
  late final GeneratedColumn<DateTime> checkedAt = GeneratedColumn<DateTime>(
    'checked_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [slot, deviceId, status, checkedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_device_validation';
  @override
  VerificationContext validateIntegrity(
    Insertable<DeviceValidationRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('slot')) {
      context.handle(
        _slotMeta,
        slot.isAcceptableOrUnknown(data['slot']!, _slotMeta),
      );
    }
    if (data.containsKey('device_id')) {
      context.handle(
        _deviceIdMeta,
        deviceId.isAcceptableOrUnknown(data['device_id']!, _deviceIdMeta),
      );
    } else if (isInserting) {
      context.missing(_deviceIdMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('checked_at')) {
      context.handle(
        _checkedAtMeta,
        checkedAt.isAcceptableOrUnknown(data['checked_at']!, _checkedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_checkedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {slot};
  @override
  DeviceValidationRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return DeviceValidationRow(
      slot: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}slot'],
      )!,
      deviceId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}device_id'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      checkedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}checked_at'],
      )!,
    );
  }

  @override
  $LocalDeviceValidationTable createAlias(String alias) {
    return $LocalDeviceValidationTable(attachedDatabase, alias);
  }
}

class DeviceValidationRow extends DataClass
    implements Insertable<DeviceValidationRow> {
  final int slot;
  final String deviceId;

  /// `ACTIVE` / `INACTIVE` / `REVOKED`.
  final String status;
  final DateTime checkedAt;
  const DeviceValidationRow({
    required this.slot,
    required this.deviceId,
    required this.status,
    required this.checkedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['slot'] = Variable<int>(slot);
    map['device_id'] = Variable<String>(deviceId);
    map['status'] = Variable<String>(status);
    map['checked_at'] = Variable<DateTime>(checkedAt);
    return map;
  }

  LocalDeviceValidationCompanion toCompanion(bool nullToAbsent) {
    return LocalDeviceValidationCompanion(
      slot: Value(slot),
      deviceId: Value(deviceId),
      status: Value(status),
      checkedAt: Value(checkedAt),
    );
  }

  factory DeviceValidationRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return DeviceValidationRow(
      slot: serializer.fromJson<int>(json['slot']),
      deviceId: serializer.fromJson<String>(json['deviceId']),
      status: serializer.fromJson<String>(json['status']),
      checkedAt: serializer.fromJson<DateTime>(json['checkedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'slot': serializer.toJson<int>(slot),
      'deviceId': serializer.toJson<String>(deviceId),
      'status': serializer.toJson<String>(status),
      'checkedAt': serializer.toJson<DateTime>(checkedAt),
    };
  }

  DeviceValidationRow copyWith({
    int? slot,
    String? deviceId,
    String? status,
    DateTime? checkedAt,
  }) => DeviceValidationRow(
    slot: slot ?? this.slot,
    deviceId: deviceId ?? this.deviceId,
    status: status ?? this.status,
    checkedAt: checkedAt ?? this.checkedAt,
  );
  DeviceValidationRow copyWithCompanion(LocalDeviceValidationCompanion data) {
    return DeviceValidationRow(
      slot: data.slot.present ? data.slot.value : this.slot,
      deviceId: data.deviceId.present ? data.deviceId.value : this.deviceId,
      status: data.status.present ? data.status.value : this.status,
      checkedAt: data.checkedAt.present ? data.checkedAt.value : this.checkedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('DeviceValidationRow(')
          ..write('slot: $slot, ')
          ..write('deviceId: $deviceId, ')
          ..write('status: $status, ')
          ..write('checkedAt: $checkedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(slot, deviceId, status, checkedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is DeviceValidationRow &&
          other.slot == this.slot &&
          other.deviceId == this.deviceId &&
          other.status == this.status &&
          other.checkedAt == this.checkedAt);
}

class LocalDeviceValidationCompanion
    extends UpdateCompanion<DeviceValidationRow> {
  final Value<int> slot;
  final Value<String> deviceId;
  final Value<String> status;
  final Value<DateTime> checkedAt;
  const LocalDeviceValidationCompanion({
    this.slot = const Value.absent(),
    this.deviceId = const Value.absent(),
    this.status = const Value.absent(),
    this.checkedAt = const Value.absent(),
  });
  LocalDeviceValidationCompanion.insert({
    this.slot = const Value.absent(),
    required String deviceId,
    required String status,
    required DateTime checkedAt,
  }) : deviceId = Value(deviceId),
       status = Value(status),
       checkedAt = Value(checkedAt);
  static Insertable<DeviceValidationRow> custom({
    Expression<int>? slot,
    Expression<String>? deviceId,
    Expression<String>? status,
    Expression<DateTime>? checkedAt,
  }) {
    return RawValuesInsertable({
      if (slot != null) 'slot': slot,
      if (deviceId != null) 'device_id': deviceId,
      if (status != null) 'status': status,
      if (checkedAt != null) 'checked_at': checkedAt,
    });
  }

  LocalDeviceValidationCompanion copyWith({
    Value<int>? slot,
    Value<String>? deviceId,
    Value<String>? status,
    Value<DateTime>? checkedAt,
  }) {
    return LocalDeviceValidationCompanion(
      slot: slot ?? this.slot,
      deviceId: deviceId ?? this.deviceId,
      status: status ?? this.status,
      checkedAt: checkedAt ?? this.checkedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (slot.present) {
      map['slot'] = Variable<int>(slot.value);
    }
    if (deviceId.present) {
      map['device_id'] = Variable<String>(deviceId.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (checkedAt.present) {
      map['checked_at'] = Variable<DateTime>(checkedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalDeviceValidationCompanion(')
          ..write('slot: $slot, ')
          ..write('deviceId: $deviceId, ')
          ..write('status: $status, ')
          ..write('checkedAt: $checkedAt')
          ..write(')'))
        .toString();
  }
}

class $LocalNeedleTypeTable extends LocalNeedleType
    with TableInfo<$LocalNeedleTypeTable, NeedleTypeRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalNeedleTypeTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _codeMeta = const VerificationMeta('code');
  @override
  late final GeneratedColumn<String> code = GeneratedColumn<String>(
    'code',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _categoryMeta = const VerificationMeta(
    'category',
  );
  @override
  late final GeneratedColumn<String> category = GeneratedColumn<String>(
    'category',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _unitMeta = const VerificationMeta('unit');
  @override
  late final GeneratedColumn<String> unit = GeneratedColumn<String>(
    'unit',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _minimumStockMeta = const VerificationMeta(
    'minimumStock',
  );
  @override
  late final GeneratedColumn<String> minimumStock = GeneratedColumn<String>(
    'minimum_stock',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    code,
    name,
    category,
    unit,
    minimumStock,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_needle_type';
  @override
  VerificationContext validateIntegrity(
    Insertable<NeedleTypeRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('code')) {
      context.handle(
        _codeMeta,
        code.isAcceptableOrUnknown(data['code']!, _codeMeta),
      );
    } else if (isInserting) {
      context.missing(_codeMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('category')) {
      context.handle(
        _categoryMeta,
        category.isAcceptableOrUnknown(data['category']!, _categoryMeta),
      );
    }
    if (data.containsKey('unit')) {
      context.handle(
        _unitMeta,
        unit.isAcceptableOrUnknown(data['unit']!, _unitMeta),
      );
    } else if (isInserting) {
      context.missing(_unitMeta);
    }
    if (data.containsKey('minimum_stock')) {
      context.handle(
        _minimumStockMeta,
        minimumStock.isAcceptableOrUnknown(
          data['minimum_stock']!,
          _minimumStockMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_minimumStockMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  NeedleTypeRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return NeedleTypeRow(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      code: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}code'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      category: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}category'],
      ),
      unit: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}unit'],
      )!,
      minimumStock: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}minimum_stock'],
      )!,
    );
  }

  @override
  $LocalNeedleTypeTable createAlias(String alias) {
    return $LocalNeedleTypeTable(attachedDatabase, alias);
  }
}

class NeedleTypeRow extends DataClass implements Insertable<NeedleTypeRow> {
  final String id;
  final String code;
  final String name;
  final String? category;
  final String unit;

  /// Decimal as a string, exactly as the backend sends it.
  final String minimumStock;
  const NeedleTypeRow({
    required this.id,
    required this.code,
    required this.name,
    this.category,
    required this.unit,
    required this.minimumStock,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['code'] = Variable<String>(code);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || category != null) {
      map['category'] = Variable<String>(category);
    }
    map['unit'] = Variable<String>(unit);
    map['minimum_stock'] = Variable<String>(minimumStock);
    return map;
  }

  LocalNeedleTypeCompanion toCompanion(bool nullToAbsent) {
    return LocalNeedleTypeCompanion(
      id: Value(id),
      code: Value(code),
      name: Value(name),
      category: category == null && nullToAbsent
          ? const Value.absent()
          : Value(category),
      unit: Value(unit),
      minimumStock: Value(minimumStock),
    );
  }

  factory NeedleTypeRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return NeedleTypeRow(
      id: serializer.fromJson<String>(json['id']),
      code: serializer.fromJson<String>(json['code']),
      name: serializer.fromJson<String>(json['name']),
      category: serializer.fromJson<String?>(json['category']),
      unit: serializer.fromJson<String>(json['unit']),
      minimumStock: serializer.fromJson<String>(json['minimumStock']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'code': serializer.toJson<String>(code),
      'name': serializer.toJson<String>(name),
      'category': serializer.toJson<String?>(category),
      'unit': serializer.toJson<String>(unit),
      'minimumStock': serializer.toJson<String>(minimumStock),
    };
  }

  NeedleTypeRow copyWith({
    String? id,
    String? code,
    String? name,
    Value<String?> category = const Value.absent(),
    String? unit,
    String? minimumStock,
  }) => NeedleTypeRow(
    id: id ?? this.id,
    code: code ?? this.code,
    name: name ?? this.name,
    category: category.present ? category.value : this.category,
    unit: unit ?? this.unit,
    minimumStock: minimumStock ?? this.minimumStock,
  );
  NeedleTypeRow copyWithCompanion(LocalNeedleTypeCompanion data) {
    return NeedleTypeRow(
      id: data.id.present ? data.id.value : this.id,
      code: data.code.present ? data.code.value : this.code,
      name: data.name.present ? data.name.value : this.name,
      category: data.category.present ? data.category.value : this.category,
      unit: data.unit.present ? data.unit.value : this.unit,
      minimumStock: data.minimumStock.present
          ? data.minimumStock.value
          : this.minimumStock,
    );
  }

  @override
  String toString() {
    return (StringBuffer('NeedleTypeRow(')
          ..write('id: $id, ')
          ..write('code: $code, ')
          ..write('name: $name, ')
          ..write('category: $category, ')
          ..write('unit: $unit, ')
          ..write('minimumStock: $minimumStock')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, code, name, category, unit, minimumStock);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is NeedleTypeRow &&
          other.id == this.id &&
          other.code == this.code &&
          other.name == this.name &&
          other.category == this.category &&
          other.unit == this.unit &&
          other.minimumStock == this.minimumStock);
}

class LocalNeedleTypeCompanion extends UpdateCompanion<NeedleTypeRow> {
  final Value<String> id;
  final Value<String> code;
  final Value<String> name;
  final Value<String?> category;
  final Value<String> unit;
  final Value<String> minimumStock;
  final Value<int> rowid;
  const LocalNeedleTypeCompanion({
    this.id = const Value.absent(),
    this.code = const Value.absent(),
    this.name = const Value.absent(),
    this.category = const Value.absent(),
    this.unit = const Value.absent(),
    this.minimumStock = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalNeedleTypeCompanion.insert({
    required String id,
    required String code,
    required String name,
    this.category = const Value.absent(),
    required String unit,
    required String minimumStock,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       code = Value(code),
       name = Value(name),
       unit = Value(unit),
       minimumStock = Value(minimumStock);
  static Insertable<NeedleTypeRow> custom({
    Expression<String>? id,
    Expression<String>? code,
    Expression<String>? name,
    Expression<String>? category,
    Expression<String>? unit,
    Expression<String>? minimumStock,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (code != null) 'code': code,
      if (name != null) 'name': name,
      if (category != null) 'category': category,
      if (unit != null) 'unit': unit,
      if (minimumStock != null) 'minimum_stock': minimumStock,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalNeedleTypeCompanion copyWith({
    Value<String>? id,
    Value<String>? code,
    Value<String>? name,
    Value<String?>? category,
    Value<String>? unit,
    Value<String>? minimumStock,
    Value<int>? rowid,
  }) {
    return LocalNeedleTypeCompanion(
      id: id ?? this.id,
      code: code ?? this.code,
      name: name ?? this.name,
      category: category ?? this.category,
      unit: unit ?? this.unit,
      minimumStock: minimumStock ?? this.minimumStock,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (code.present) {
      map['code'] = Variable<String>(code.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (category.present) {
      map['category'] = Variable<String>(category.value);
    }
    if (unit.present) {
      map['unit'] = Variable<String>(unit.value);
    }
    if (minimumStock.present) {
      map['minimum_stock'] = Variable<String>(minimumStock.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalNeedleTypeCompanion(')
          ..write('id: $id, ')
          ..write('code: $code, ')
          ..write('name: $name, ')
          ..write('category: $category, ')
          ..write('unit: $unit, ')
          ..write('minimumStock: $minimumStock, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalExchangeTypeTable extends LocalExchangeType
    with TableInfo<$LocalExchangeTypeTable, ExchangeTypeRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalExchangeTypeTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _codeMeta = const VerificationMeta('code');
  @override
  late final GeneratedColumn<String> code = GeneratedColumn<String>(
    'code',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _requiresFragmentValidationMeta =
      const VerificationMeta('requiresFragmentValidation');
  @override
  late final GeneratedColumn<bool> requiresFragmentValidation =
      GeneratedColumn<bool>(
        'requires_fragment_validation',
        aliasedName,
        false,
        type: DriftSqlType.bool,
        requiredDuringInsert: true,
        defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("requires_fragment_validation" IN (0, 1))',
        ),
      );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    code,
    name,
    requiresFragmentValidation,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_exchange_type';
  @override
  VerificationContext validateIntegrity(
    Insertable<ExchangeTypeRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('code')) {
      context.handle(
        _codeMeta,
        code.isAcceptableOrUnknown(data['code']!, _codeMeta),
      );
    } else if (isInserting) {
      context.missing(_codeMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('requires_fragment_validation')) {
      context.handle(
        _requiresFragmentValidationMeta,
        requiresFragmentValidation.isAcceptableOrUnknown(
          data['requires_fragment_validation']!,
          _requiresFragmentValidationMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_requiresFragmentValidationMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  ExchangeTypeRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return ExchangeTypeRow(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      code: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}code'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      requiresFragmentValidation: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}requires_fragment_validation'],
      )!,
    );
  }

  @override
  $LocalExchangeTypeTable createAlias(String alias) {
    return $LocalExchangeTypeTable(attachedDatabase, alias);
  }
}

class ExchangeTypeRow extends DataClass implements Insertable<ExchangeTypeRow> {
  final String id;
  final String code;
  final String name;
  final bool requiresFragmentValidation;
  const ExchangeTypeRow({
    required this.id,
    required this.code,
    required this.name,
    required this.requiresFragmentValidation,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['code'] = Variable<String>(code);
    map['name'] = Variable<String>(name);
    map['requires_fragment_validation'] = Variable<bool>(
      requiresFragmentValidation,
    );
    return map;
  }

  LocalExchangeTypeCompanion toCompanion(bool nullToAbsent) {
    return LocalExchangeTypeCompanion(
      id: Value(id),
      code: Value(code),
      name: Value(name),
      requiresFragmentValidation: Value(requiresFragmentValidation),
    );
  }

  factory ExchangeTypeRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return ExchangeTypeRow(
      id: serializer.fromJson<String>(json['id']),
      code: serializer.fromJson<String>(json['code']),
      name: serializer.fromJson<String>(json['name']),
      requiresFragmentValidation: serializer.fromJson<bool>(
        json['requiresFragmentValidation'],
      ),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'code': serializer.toJson<String>(code),
      'name': serializer.toJson<String>(name),
      'requiresFragmentValidation': serializer.toJson<bool>(
        requiresFragmentValidation,
      ),
    };
  }

  ExchangeTypeRow copyWith({
    String? id,
    String? code,
    String? name,
    bool? requiresFragmentValidation,
  }) => ExchangeTypeRow(
    id: id ?? this.id,
    code: code ?? this.code,
    name: name ?? this.name,
    requiresFragmentValidation:
        requiresFragmentValidation ?? this.requiresFragmentValidation,
  );
  ExchangeTypeRow copyWithCompanion(LocalExchangeTypeCompanion data) {
    return ExchangeTypeRow(
      id: data.id.present ? data.id.value : this.id,
      code: data.code.present ? data.code.value : this.code,
      name: data.name.present ? data.name.value : this.name,
      requiresFragmentValidation: data.requiresFragmentValidation.present
          ? data.requiresFragmentValidation.value
          : this.requiresFragmentValidation,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ExchangeTypeRow(')
          ..write('id: $id, ')
          ..write('code: $code, ')
          ..write('name: $name, ')
          ..write('requiresFragmentValidation: $requiresFragmentValidation')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, code, name, requiresFragmentValidation);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ExchangeTypeRow &&
          other.id == this.id &&
          other.code == this.code &&
          other.name == this.name &&
          other.requiresFragmentValidation == this.requiresFragmentValidation);
}

class LocalExchangeTypeCompanion extends UpdateCompanion<ExchangeTypeRow> {
  final Value<String> id;
  final Value<String> code;
  final Value<String> name;
  final Value<bool> requiresFragmentValidation;
  final Value<int> rowid;
  const LocalExchangeTypeCompanion({
    this.id = const Value.absent(),
    this.code = const Value.absent(),
    this.name = const Value.absent(),
    this.requiresFragmentValidation = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalExchangeTypeCompanion.insert({
    required String id,
    required String code,
    required String name,
    required bool requiresFragmentValidation,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       code = Value(code),
       name = Value(name),
       requiresFragmentValidation = Value(requiresFragmentValidation);
  static Insertable<ExchangeTypeRow> custom({
    Expression<String>? id,
    Expression<String>? code,
    Expression<String>? name,
    Expression<bool>? requiresFragmentValidation,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (code != null) 'code': code,
      if (name != null) 'name': name,
      if (requiresFragmentValidation != null)
        'requires_fragment_validation': requiresFragmentValidation,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalExchangeTypeCompanion copyWith({
    Value<String>? id,
    Value<String>? code,
    Value<String>? name,
    Value<bool>? requiresFragmentValidation,
    Value<int>? rowid,
  }) {
    return LocalExchangeTypeCompanion(
      id: id ?? this.id,
      code: code ?? this.code,
      name: name ?? this.name,
      requiresFragmentValidation:
          requiresFragmentValidation ?? this.requiresFragmentValidation,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (code.present) {
      map['code'] = Variable<String>(code.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (requiresFragmentValidation.present) {
      map['requires_fragment_validation'] = Variable<bool>(
        requiresFragmentValidation.value,
      );
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalExchangeTypeCompanion(')
          ..write('id: $id, ')
          ..write('code: $code, ')
          ..write('name: $name, ')
          ..write('requiresFragmentValidation: $requiresFragmentValidation, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalStorageMappingTable extends LocalStorageMapping
    with TableInfo<$LocalStorageMappingTable, StorageMappingRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalStorageMappingTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _exchangeTypeIdMeta = const VerificationMeta(
    'exchangeTypeId',
  );
  @override
  late final GeneratedColumn<String> exchangeTypeId = GeneratedColumn<String>(
    'exchange_type_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _storageLocationIdMeta = const VerificationMeta(
    'storageLocationId',
  );
  @override
  late final GeneratedColumn<String> storageLocationId =
      GeneratedColumn<String>(
        'storage_location_id',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _storageLocationCodeMeta =
      const VerificationMeta('storageLocationCode');
  @override
  late final GeneratedColumn<String> storageLocationCode =
      GeneratedColumn<String>(
        'storage_location_code',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _storageLocationNameMeta =
      const VerificationMeta('storageLocationName');
  @override
  late final GeneratedColumn<String> storageLocationName =
      GeneratedColumn<String>(
        'storage_location_name',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    exchangeTypeId,
    storageLocationId,
    storageLocationCode,
    storageLocationName,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_storage_mapping';
  @override
  VerificationContext validateIntegrity(
    Insertable<StorageMappingRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('exchange_type_id')) {
      context.handle(
        _exchangeTypeIdMeta,
        exchangeTypeId.isAcceptableOrUnknown(
          data['exchange_type_id']!,
          _exchangeTypeIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_exchangeTypeIdMeta);
    }
    if (data.containsKey('storage_location_id')) {
      context.handle(
        _storageLocationIdMeta,
        storageLocationId.isAcceptableOrUnknown(
          data['storage_location_id']!,
          _storageLocationIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_storageLocationIdMeta);
    }
    if (data.containsKey('storage_location_code')) {
      context.handle(
        _storageLocationCodeMeta,
        storageLocationCode.isAcceptableOrUnknown(
          data['storage_location_code']!,
          _storageLocationCodeMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_storageLocationCodeMeta);
    }
    if (data.containsKey('storage_location_name')) {
      context.handle(
        _storageLocationNameMeta,
        storageLocationName.isAcceptableOrUnknown(
          data['storage_location_name']!,
          _storageLocationNameMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_storageLocationNameMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  StorageMappingRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return StorageMappingRow(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      exchangeTypeId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}exchange_type_id'],
      )!,
      storageLocationId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}storage_location_id'],
      )!,
      storageLocationCode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}storage_location_code'],
      )!,
      storageLocationName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}storage_location_name'],
      )!,
    );
  }

  @override
  $LocalStorageMappingTable createAlias(String alias) {
    return $LocalStorageMappingTable(attachedDatabase, alias);
  }
}

class StorageMappingRow extends DataClass
    implements Insertable<StorageMappingRow> {
  final String id;
  final String exchangeTypeId;
  final String storageLocationId;
  final String storageLocationCode;
  final String storageLocationName;
  const StorageMappingRow({
    required this.id,
    required this.exchangeTypeId,
    required this.storageLocationId,
    required this.storageLocationCode,
    required this.storageLocationName,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['exchange_type_id'] = Variable<String>(exchangeTypeId);
    map['storage_location_id'] = Variable<String>(storageLocationId);
    map['storage_location_code'] = Variable<String>(storageLocationCode);
    map['storage_location_name'] = Variable<String>(storageLocationName);
    return map;
  }

  LocalStorageMappingCompanion toCompanion(bool nullToAbsent) {
    return LocalStorageMappingCompanion(
      id: Value(id),
      exchangeTypeId: Value(exchangeTypeId),
      storageLocationId: Value(storageLocationId),
      storageLocationCode: Value(storageLocationCode),
      storageLocationName: Value(storageLocationName),
    );
  }

  factory StorageMappingRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return StorageMappingRow(
      id: serializer.fromJson<String>(json['id']),
      exchangeTypeId: serializer.fromJson<String>(json['exchangeTypeId']),
      storageLocationId: serializer.fromJson<String>(json['storageLocationId']),
      storageLocationCode: serializer.fromJson<String>(
        json['storageLocationCode'],
      ),
      storageLocationName: serializer.fromJson<String>(
        json['storageLocationName'],
      ),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'exchangeTypeId': serializer.toJson<String>(exchangeTypeId),
      'storageLocationId': serializer.toJson<String>(storageLocationId),
      'storageLocationCode': serializer.toJson<String>(storageLocationCode),
      'storageLocationName': serializer.toJson<String>(storageLocationName),
    };
  }

  StorageMappingRow copyWith({
    String? id,
    String? exchangeTypeId,
    String? storageLocationId,
    String? storageLocationCode,
    String? storageLocationName,
  }) => StorageMappingRow(
    id: id ?? this.id,
    exchangeTypeId: exchangeTypeId ?? this.exchangeTypeId,
    storageLocationId: storageLocationId ?? this.storageLocationId,
    storageLocationCode: storageLocationCode ?? this.storageLocationCode,
    storageLocationName: storageLocationName ?? this.storageLocationName,
  );
  StorageMappingRow copyWithCompanion(LocalStorageMappingCompanion data) {
    return StorageMappingRow(
      id: data.id.present ? data.id.value : this.id,
      exchangeTypeId: data.exchangeTypeId.present
          ? data.exchangeTypeId.value
          : this.exchangeTypeId,
      storageLocationId: data.storageLocationId.present
          ? data.storageLocationId.value
          : this.storageLocationId,
      storageLocationCode: data.storageLocationCode.present
          ? data.storageLocationCode.value
          : this.storageLocationCode,
      storageLocationName: data.storageLocationName.present
          ? data.storageLocationName.value
          : this.storageLocationName,
    );
  }

  @override
  String toString() {
    return (StringBuffer('StorageMappingRow(')
          ..write('id: $id, ')
          ..write('exchangeTypeId: $exchangeTypeId, ')
          ..write('storageLocationId: $storageLocationId, ')
          ..write('storageLocationCode: $storageLocationCode, ')
          ..write('storageLocationName: $storageLocationName')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    exchangeTypeId,
    storageLocationId,
    storageLocationCode,
    storageLocationName,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is StorageMappingRow &&
          other.id == this.id &&
          other.exchangeTypeId == this.exchangeTypeId &&
          other.storageLocationId == this.storageLocationId &&
          other.storageLocationCode == this.storageLocationCode &&
          other.storageLocationName == this.storageLocationName);
}

class LocalStorageMappingCompanion extends UpdateCompanion<StorageMappingRow> {
  final Value<String> id;
  final Value<String> exchangeTypeId;
  final Value<String> storageLocationId;
  final Value<String> storageLocationCode;
  final Value<String> storageLocationName;
  final Value<int> rowid;
  const LocalStorageMappingCompanion({
    this.id = const Value.absent(),
    this.exchangeTypeId = const Value.absent(),
    this.storageLocationId = const Value.absent(),
    this.storageLocationCode = const Value.absent(),
    this.storageLocationName = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalStorageMappingCompanion.insert({
    required String id,
    required String exchangeTypeId,
    required String storageLocationId,
    required String storageLocationCode,
    required String storageLocationName,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       exchangeTypeId = Value(exchangeTypeId),
       storageLocationId = Value(storageLocationId),
       storageLocationCode = Value(storageLocationCode),
       storageLocationName = Value(storageLocationName);
  static Insertable<StorageMappingRow> custom({
    Expression<String>? id,
    Expression<String>? exchangeTypeId,
    Expression<String>? storageLocationId,
    Expression<String>? storageLocationCode,
    Expression<String>? storageLocationName,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (exchangeTypeId != null) 'exchange_type_id': exchangeTypeId,
      if (storageLocationId != null) 'storage_location_id': storageLocationId,
      if (storageLocationCode != null)
        'storage_location_code': storageLocationCode,
      if (storageLocationName != null)
        'storage_location_name': storageLocationName,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalStorageMappingCompanion copyWith({
    Value<String>? id,
    Value<String>? exchangeTypeId,
    Value<String>? storageLocationId,
    Value<String>? storageLocationCode,
    Value<String>? storageLocationName,
    Value<int>? rowid,
  }) {
    return LocalStorageMappingCompanion(
      id: id ?? this.id,
      exchangeTypeId: exchangeTypeId ?? this.exchangeTypeId,
      storageLocationId: storageLocationId ?? this.storageLocationId,
      storageLocationCode: storageLocationCode ?? this.storageLocationCode,
      storageLocationName: storageLocationName ?? this.storageLocationName,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (exchangeTypeId.present) {
      map['exchange_type_id'] = Variable<String>(exchangeTypeId.value);
    }
    if (storageLocationId.present) {
      map['storage_location_id'] = Variable<String>(storageLocationId.value);
    }
    if (storageLocationCode.present) {
      map['storage_location_code'] = Variable<String>(
        storageLocationCode.value,
      );
    }
    if (storageLocationName.present) {
      map['storage_location_name'] = Variable<String>(
        storageLocationName.value,
      );
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalStorageMappingCompanion(')
          ..write('id: $id, ')
          ..write('exchangeTypeId: $exchangeTypeId, ')
          ..write('storageLocationId: $storageLocationId, ')
          ..write('storageLocationCode: $storageLocationCode, ')
          ..write('storageLocationName: $storageLocationName, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalMasterDataVersionTable extends LocalMasterDataVersion
    with TableInfo<$LocalMasterDataVersionTable, MasterDataVersionRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalMasterDataVersionTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _collectionMeta = const VerificationMeta(
    'collection',
  );
  @override
  late final GeneratedColumn<String> collection = GeneratedColumn<String>(
    'collection',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _versionMeta = const VerificationMeta(
    'version',
  );
  @override
  late final GeneratedColumn<String> version = GeneratedColumn<String>(
    'version',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [collection, version];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_master_data_version';
  @override
  VerificationContext validateIntegrity(
    Insertable<MasterDataVersionRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('collection')) {
      context.handle(
        _collectionMeta,
        collection.isAcceptableOrUnknown(data['collection']!, _collectionMeta),
      );
    } else if (isInserting) {
      context.missing(_collectionMeta);
    }
    if (data.containsKey('version')) {
      context.handle(
        _versionMeta,
        version.isAcceptableOrUnknown(data['version']!, _versionMeta),
      );
    } else if (isInserting) {
      context.missing(_versionMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {collection};
  @override
  MasterDataVersionRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return MasterDataVersionRow(
      collection: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}collection'],
      )!,
      version: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}version'],
      )!,
    );
  }

  @override
  $LocalMasterDataVersionTable createAlias(String alias) {
    return $LocalMasterDataVersionTable(attachedDatabase, alias);
  }
}

class MasterDataVersionRow extends DataClass
    implements Insertable<MasterDataVersionRow> {
  final String collection;
  final String version;
  const MasterDataVersionRow({required this.collection, required this.version});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['collection'] = Variable<String>(collection);
    map['version'] = Variable<String>(version);
    return map;
  }

  LocalMasterDataVersionCompanion toCompanion(bool nullToAbsent) {
    return LocalMasterDataVersionCompanion(
      collection: Value(collection),
      version: Value(version),
    );
  }

  factory MasterDataVersionRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return MasterDataVersionRow(
      collection: serializer.fromJson<String>(json['collection']),
      version: serializer.fromJson<String>(json['version']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'collection': serializer.toJson<String>(collection),
      'version': serializer.toJson<String>(version),
    };
  }

  MasterDataVersionRow copyWith({String? collection, String? version}) =>
      MasterDataVersionRow(
        collection: collection ?? this.collection,
        version: version ?? this.version,
      );
  MasterDataVersionRow copyWithCompanion(LocalMasterDataVersionCompanion data) {
    return MasterDataVersionRow(
      collection: data.collection.present
          ? data.collection.value
          : this.collection,
      version: data.version.present ? data.version.value : this.version,
    );
  }

  @override
  String toString() {
    return (StringBuffer('MasterDataVersionRow(')
          ..write('collection: $collection, ')
          ..write('version: $version')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(collection, version);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is MasterDataVersionRow &&
          other.collection == this.collection &&
          other.version == this.version);
}

class LocalMasterDataVersionCompanion
    extends UpdateCompanion<MasterDataVersionRow> {
  final Value<String> collection;
  final Value<String> version;
  final Value<int> rowid;
  const LocalMasterDataVersionCompanion({
    this.collection = const Value.absent(),
    this.version = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalMasterDataVersionCompanion.insert({
    required String collection,
    required String version,
    this.rowid = const Value.absent(),
  }) : collection = Value(collection),
       version = Value(version);
  static Insertable<MasterDataVersionRow> custom({
    Expression<String>? collection,
    Expression<String>? version,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (collection != null) 'collection': collection,
      if (version != null) 'version': version,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalMasterDataVersionCompanion copyWith({
    Value<String>? collection,
    Value<String>? version,
    Value<int>? rowid,
  }) {
    return LocalMasterDataVersionCompanion(
      collection: collection ?? this.collection,
      version: version ?? this.version,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (collection.present) {
      map['collection'] = Variable<String>(collection.value);
    }
    if (version.present) {
      map['version'] = Variable<String>(version.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalMasterDataVersionCompanion(')
          ..write('collection: $collection, ')
          ..write('version: $version, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $LocalUserSessionTable localUserSession = $LocalUserSessionTable(
    this,
  );
  late final $LocalDeviceContextTable localDeviceContext =
      $LocalDeviceContextTable(this);
  late final $LocalDeviceValidationTable localDeviceValidation =
      $LocalDeviceValidationTable(this);
  late final $LocalNeedleTypeTable localNeedleType = $LocalNeedleTypeTable(
    this,
  );
  late final $LocalExchangeTypeTable localExchangeType =
      $LocalExchangeTypeTable(this);
  late final $LocalStorageMappingTable localStorageMapping =
      $LocalStorageMappingTable(this);
  late final $LocalMasterDataVersionTable localMasterDataVersion =
      $LocalMasterDataVersionTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    localUserSession,
    localDeviceContext,
    localDeviceValidation,
    localNeedleType,
    localExchangeType,
    localStorageMapping,
    localMasterDataVersion,
  ];
}

typedef $$LocalUserSessionTableCreateCompanionBuilder =
    LocalUserSessionCompanion Function({
      Value<int> slot,
      required String userId,
      required String username,
      required String name,
      required String roles,
      Value<String> permissions,
      Value<String> factoryIds,
      Value<String> locationIds,
      Value<bool> profileLoaded,
      required DateTime updatedAt,
    });
typedef $$LocalUserSessionTableUpdateCompanionBuilder =
    LocalUserSessionCompanion Function({
      Value<int> slot,
      Value<String> userId,
      Value<String> username,
      Value<String> name,
      Value<String> roles,
      Value<String> permissions,
      Value<String> factoryIds,
      Value<String> locationIds,
      Value<bool> profileLoaded,
      Value<DateTime> updatedAt,
    });

class $$LocalUserSessionTableFilterComposer
    extends Composer<_$AppDatabase, $LocalUserSessionTable> {
  $$LocalUserSessionTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get slot => $composableBuilder(
    column: $table.slot,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get userId => $composableBuilder(
    column: $table.userId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get username => $composableBuilder(
    column: $table.username,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get roles => $composableBuilder(
    column: $table.roles,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get permissions => $composableBuilder(
    column: $table.permissions,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get factoryIds => $composableBuilder(
    column: $table.factoryIds,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get locationIds => $composableBuilder(
    column: $table.locationIds,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get profileLoaded => $composableBuilder(
    column: $table.profileLoaded,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalUserSessionTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalUserSessionTable> {
  $$LocalUserSessionTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get slot => $composableBuilder(
    column: $table.slot,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get userId => $composableBuilder(
    column: $table.userId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get username => $composableBuilder(
    column: $table.username,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get roles => $composableBuilder(
    column: $table.roles,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get permissions => $composableBuilder(
    column: $table.permissions,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get factoryIds => $composableBuilder(
    column: $table.factoryIds,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get locationIds => $composableBuilder(
    column: $table.locationIds,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get profileLoaded => $composableBuilder(
    column: $table.profileLoaded,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalUserSessionTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalUserSessionTable> {
  $$LocalUserSessionTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get slot =>
      $composableBuilder(column: $table.slot, builder: (column) => column);

  GeneratedColumn<String> get userId =>
      $composableBuilder(column: $table.userId, builder: (column) => column);

  GeneratedColumn<String> get username =>
      $composableBuilder(column: $table.username, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get roles =>
      $composableBuilder(column: $table.roles, builder: (column) => column);

  GeneratedColumn<String> get permissions => $composableBuilder(
    column: $table.permissions,
    builder: (column) => column,
  );

  GeneratedColumn<String> get factoryIds => $composableBuilder(
    column: $table.factoryIds,
    builder: (column) => column,
  );

  GeneratedColumn<String> get locationIds => $composableBuilder(
    column: $table.locationIds,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get profileLoaded => $composableBuilder(
    column: $table.profileLoaded,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$LocalUserSessionTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalUserSessionTable,
          UserSessionRow,
          $$LocalUserSessionTableFilterComposer,
          $$LocalUserSessionTableOrderingComposer,
          $$LocalUserSessionTableAnnotationComposer,
          $$LocalUserSessionTableCreateCompanionBuilder,
          $$LocalUserSessionTableUpdateCompanionBuilder,
          (
            UserSessionRow,
            BaseReferences<
              _$AppDatabase,
              $LocalUserSessionTable,
              UserSessionRow
            >,
          ),
          UserSessionRow,
          PrefetchHooks Function()
        > {
  $$LocalUserSessionTableTableManager(
    _$AppDatabase db,
    $LocalUserSessionTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalUserSessionTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalUserSessionTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalUserSessionTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> slot = const Value.absent(),
                Value<String> userId = const Value.absent(),
                Value<String> username = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<String> roles = const Value.absent(),
                Value<String> permissions = const Value.absent(),
                Value<String> factoryIds = const Value.absent(),
                Value<String> locationIds = const Value.absent(),
                Value<bool> profileLoaded = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
              }) => LocalUserSessionCompanion(
                slot: slot,
                userId: userId,
                username: username,
                name: name,
                roles: roles,
                permissions: permissions,
                factoryIds: factoryIds,
                locationIds: locationIds,
                profileLoaded: profileLoaded,
                updatedAt: updatedAt,
              ),
          createCompanionCallback:
              ({
                Value<int> slot = const Value.absent(),
                required String userId,
                required String username,
                required String name,
                required String roles,
                Value<String> permissions = const Value.absent(),
                Value<String> factoryIds = const Value.absent(),
                Value<String> locationIds = const Value.absent(),
                Value<bool> profileLoaded = const Value.absent(),
                required DateTime updatedAt,
              }) => LocalUserSessionCompanion.insert(
                slot: slot,
                userId: userId,
                username: username,
                name: name,
                roles: roles,
                permissions: permissions,
                factoryIds: factoryIds,
                locationIds: locationIds,
                profileLoaded: profileLoaded,
                updatedAt: updatedAt,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$LocalUserSessionTable, UserSessionRow>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $LocalUserSessionTable,
                    UserSessionRow
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalUserSessionTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalUserSessionTable,
      UserSessionRow,
      $$LocalUserSessionTableFilterComposer,
      $$LocalUserSessionTableOrderingComposer,
      $$LocalUserSessionTableAnnotationComposer,
      $$LocalUserSessionTableCreateCompanionBuilder,
      $$LocalUserSessionTableUpdateCompanionBuilder,
      (
        UserSessionRow,
        BaseReferences<_$AppDatabase, $LocalUserSessionTable, UserSessionRow>,
      ),
      UserSessionRow,
      PrefetchHooks Function()
    >;
typedef $$LocalDeviceContextTableCreateCompanionBuilder =
    LocalDeviceContextCompanion Function({
      Value<int> slot,
      required String deviceId,
      required String deviceCode,
      required String deviceName,
      required String factoryId,
      required String factoryCode,
      required String factoryName,
      required String factoryTimezone,
      required String trolleyId,
      required String trolleyCode,
      required String trolleyName,
      required String trolleyLocationId,
      required DateTime serverTime,
      required String syncCursor,
      required DateTime fetchedAt,
    });
typedef $$LocalDeviceContextTableUpdateCompanionBuilder =
    LocalDeviceContextCompanion Function({
      Value<int> slot,
      Value<String> deviceId,
      Value<String> deviceCode,
      Value<String> deviceName,
      Value<String> factoryId,
      Value<String> factoryCode,
      Value<String> factoryName,
      Value<String> factoryTimezone,
      Value<String> trolleyId,
      Value<String> trolleyCode,
      Value<String> trolleyName,
      Value<String> trolleyLocationId,
      Value<DateTime> serverTime,
      Value<String> syncCursor,
      Value<DateTime> fetchedAt,
    });

class $$LocalDeviceContextTableFilterComposer
    extends Composer<_$AppDatabase, $LocalDeviceContextTable> {
  $$LocalDeviceContextTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get slot => $composableBuilder(
    column: $table.slot,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get deviceId => $composableBuilder(
    column: $table.deviceId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get deviceCode => $composableBuilder(
    column: $table.deviceCode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get deviceName => $composableBuilder(
    column: $table.deviceName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get factoryId => $composableBuilder(
    column: $table.factoryId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get factoryCode => $composableBuilder(
    column: $table.factoryCode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get factoryName => $composableBuilder(
    column: $table.factoryName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get factoryTimezone => $composableBuilder(
    column: $table.factoryTimezone,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get trolleyId => $composableBuilder(
    column: $table.trolleyId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get trolleyCode => $composableBuilder(
    column: $table.trolleyCode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get trolleyName => $composableBuilder(
    column: $table.trolleyName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get trolleyLocationId => $composableBuilder(
    column: $table.trolleyLocationId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get serverTime => $composableBuilder(
    column: $table.serverTime,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get syncCursor => $composableBuilder(
    column: $table.syncCursor,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get fetchedAt => $composableBuilder(
    column: $table.fetchedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalDeviceContextTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalDeviceContextTable> {
  $$LocalDeviceContextTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get slot => $composableBuilder(
    column: $table.slot,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get deviceId => $composableBuilder(
    column: $table.deviceId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get deviceCode => $composableBuilder(
    column: $table.deviceCode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get deviceName => $composableBuilder(
    column: $table.deviceName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get factoryId => $composableBuilder(
    column: $table.factoryId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get factoryCode => $composableBuilder(
    column: $table.factoryCode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get factoryName => $composableBuilder(
    column: $table.factoryName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get factoryTimezone => $composableBuilder(
    column: $table.factoryTimezone,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get trolleyId => $composableBuilder(
    column: $table.trolleyId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get trolleyCode => $composableBuilder(
    column: $table.trolleyCode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get trolleyName => $composableBuilder(
    column: $table.trolleyName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get trolleyLocationId => $composableBuilder(
    column: $table.trolleyLocationId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get serverTime => $composableBuilder(
    column: $table.serverTime,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get syncCursor => $composableBuilder(
    column: $table.syncCursor,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get fetchedAt => $composableBuilder(
    column: $table.fetchedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalDeviceContextTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalDeviceContextTable> {
  $$LocalDeviceContextTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get slot =>
      $composableBuilder(column: $table.slot, builder: (column) => column);

  GeneratedColumn<String> get deviceId =>
      $composableBuilder(column: $table.deviceId, builder: (column) => column);

  GeneratedColumn<String> get deviceCode => $composableBuilder(
    column: $table.deviceCode,
    builder: (column) => column,
  );

  GeneratedColumn<String> get deviceName => $composableBuilder(
    column: $table.deviceName,
    builder: (column) => column,
  );

  GeneratedColumn<String> get factoryId =>
      $composableBuilder(column: $table.factoryId, builder: (column) => column);

  GeneratedColumn<String> get factoryCode => $composableBuilder(
    column: $table.factoryCode,
    builder: (column) => column,
  );

  GeneratedColumn<String> get factoryName => $composableBuilder(
    column: $table.factoryName,
    builder: (column) => column,
  );

  GeneratedColumn<String> get factoryTimezone => $composableBuilder(
    column: $table.factoryTimezone,
    builder: (column) => column,
  );

  GeneratedColumn<String> get trolleyId =>
      $composableBuilder(column: $table.trolleyId, builder: (column) => column);

  GeneratedColumn<String> get trolleyCode => $composableBuilder(
    column: $table.trolleyCode,
    builder: (column) => column,
  );

  GeneratedColumn<String> get trolleyName => $composableBuilder(
    column: $table.trolleyName,
    builder: (column) => column,
  );

  GeneratedColumn<String> get trolleyLocationId => $composableBuilder(
    column: $table.trolleyLocationId,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get serverTime => $composableBuilder(
    column: $table.serverTime,
    builder: (column) => column,
  );

  GeneratedColumn<String> get syncCursor => $composableBuilder(
    column: $table.syncCursor,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get fetchedAt =>
      $composableBuilder(column: $table.fetchedAt, builder: (column) => column);
}

class $$LocalDeviceContextTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalDeviceContextTable,
          DeviceContextRow,
          $$LocalDeviceContextTableFilterComposer,
          $$LocalDeviceContextTableOrderingComposer,
          $$LocalDeviceContextTableAnnotationComposer,
          $$LocalDeviceContextTableCreateCompanionBuilder,
          $$LocalDeviceContextTableUpdateCompanionBuilder,
          (
            DeviceContextRow,
            BaseReferences<
              _$AppDatabase,
              $LocalDeviceContextTable,
              DeviceContextRow
            >,
          ),
          DeviceContextRow,
          PrefetchHooks Function()
        > {
  $$LocalDeviceContextTableTableManager(
    _$AppDatabase db,
    $LocalDeviceContextTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalDeviceContextTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalDeviceContextTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalDeviceContextTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<int> slot = const Value.absent(),
                Value<String> deviceId = const Value.absent(),
                Value<String> deviceCode = const Value.absent(),
                Value<String> deviceName = const Value.absent(),
                Value<String> factoryId = const Value.absent(),
                Value<String> factoryCode = const Value.absent(),
                Value<String> factoryName = const Value.absent(),
                Value<String> factoryTimezone = const Value.absent(),
                Value<String> trolleyId = const Value.absent(),
                Value<String> trolleyCode = const Value.absent(),
                Value<String> trolleyName = const Value.absent(),
                Value<String> trolleyLocationId = const Value.absent(),
                Value<DateTime> serverTime = const Value.absent(),
                Value<String> syncCursor = const Value.absent(),
                Value<DateTime> fetchedAt = const Value.absent(),
              }) => LocalDeviceContextCompanion(
                slot: slot,
                deviceId: deviceId,
                deviceCode: deviceCode,
                deviceName: deviceName,
                factoryId: factoryId,
                factoryCode: factoryCode,
                factoryName: factoryName,
                factoryTimezone: factoryTimezone,
                trolleyId: trolleyId,
                trolleyCode: trolleyCode,
                trolleyName: trolleyName,
                trolleyLocationId: trolleyLocationId,
                serverTime: serverTime,
                syncCursor: syncCursor,
                fetchedAt: fetchedAt,
              ),
          createCompanionCallback:
              ({
                Value<int> slot = const Value.absent(),
                required String deviceId,
                required String deviceCode,
                required String deviceName,
                required String factoryId,
                required String factoryCode,
                required String factoryName,
                required String factoryTimezone,
                required String trolleyId,
                required String trolleyCode,
                required String trolleyName,
                required String trolleyLocationId,
                required DateTime serverTime,
                required String syncCursor,
                required DateTime fetchedAt,
              }) => LocalDeviceContextCompanion.insert(
                slot: slot,
                deviceId: deviceId,
                deviceCode: deviceCode,
                deviceName: deviceName,
                factoryId: factoryId,
                factoryCode: factoryCode,
                factoryName: factoryName,
                factoryTimezone: factoryTimezone,
                trolleyId: trolleyId,
                trolleyCode: trolleyCode,
                trolleyName: trolleyName,
                trolleyLocationId: trolleyLocationId,
                serverTime: serverTime,
                syncCursor: syncCursor,
                fetchedAt: fetchedAt,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$LocalDeviceContextTable, DeviceContextRow>(
                    table,
                  ),
                  BaseReferences<
                    _$AppDatabase,
                    $LocalDeviceContextTable,
                    DeviceContextRow
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalDeviceContextTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalDeviceContextTable,
      DeviceContextRow,
      $$LocalDeviceContextTableFilterComposer,
      $$LocalDeviceContextTableOrderingComposer,
      $$LocalDeviceContextTableAnnotationComposer,
      $$LocalDeviceContextTableCreateCompanionBuilder,
      $$LocalDeviceContextTableUpdateCompanionBuilder,
      (
        DeviceContextRow,
        BaseReferences<
          _$AppDatabase,
          $LocalDeviceContextTable,
          DeviceContextRow
        >,
      ),
      DeviceContextRow,
      PrefetchHooks Function()
    >;
typedef $$LocalDeviceValidationTableCreateCompanionBuilder =
    LocalDeviceValidationCompanion Function({
      Value<int> slot,
      required String deviceId,
      required String status,
      required DateTime checkedAt,
    });
typedef $$LocalDeviceValidationTableUpdateCompanionBuilder =
    LocalDeviceValidationCompanion Function({
      Value<int> slot,
      Value<String> deviceId,
      Value<String> status,
      Value<DateTime> checkedAt,
    });

class $$LocalDeviceValidationTableFilterComposer
    extends Composer<_$AppDatabase, $LocalDeviceValidationTable> {
  $$LocalDeviceValidationTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get slot => $composableBuilder(
    column: $table.slot,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get deviceId => $composableBuilder(
    column: $table.deviceId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get checkedAt => $composableBuilder(
    column: $table.checkedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalDeviceValidationTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalDeviceValidationTable> {
  $$LocalDeviceValidationTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get slot => $composableBuilder(
    column: $table.slot,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get deviceId => $composableBuilder(
    column: $table.deviceId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get checkedAt => $composableBuilder(
    column: $table.checkedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalDeviceValidationTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalDeviceValidationTable> {
  $$LocalDeviceValidationTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get slot =>
      $composableBuilder(column: $table.slot, builder: (column) => column);

  GeneratedColumn<String> get deviceId =>
      $composableBuilder(column: $table.deviceId, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<DateTime> get checkedAt =>
      $composableBuilder(column: $table.checkedAt, builder: (column) => column);
}

class $$LocalDeviceValidationTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalDeviceValidationTable,
          DeviceValidationRow,
          $$LocalDeviceValidationTableFilterComposer,
          $$LocalDeviceValidationTableOrderingComposer,
          $$LocalDeviceValidationTableAnnotationComposer,
          $$LocalDeviceValidationTableCreateCompanionBuilder,
          $$LocalDeviceValidationTableUpdateCompanionBuilder,
          (
            DeviceValidationRow,
            BaseReferences<
              _$AppDatabase,
              $LocalDeviceValidationTable,
              DeviceValidationRow
            >,
          ),
          DeviceValidationRow,
          PrefetchHooks Function()
        > {
  $$LocalDeviceValidationTableTableManager(
    _$AppDatabase db,
    $LocalDeviceValidationTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalDeviceValidationTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              $$LocalDeviceValidationTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$LocalDeviceValidationTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<int> slot = const Value.absent(),
                Value<String> deviceId = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<DateTime> checkedAt = const Value.absent(),
              }) => LocalDeviceValidationCompanion(
                slot: slot,
                deviceId: deviceId,
                status: status,
                checkedAt: checkedAt,
              ),
          createCompanionCallback:
              ({
                Value<int> slot = const Value.absent(),
                required String deviceId,
                required String status,
                required DateTime checkedAt,
              }) => LocalDeviceValidationCompanion.insert(
                slot: slot,
                deviceId: deviceId,
                status: status,
                checkedAt: checkedAt,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$LocalDeviceValidationTable, DeviceValidationRow>(
                    table,
                  ),
                  BaseReferences<
                    _$AppDatabase,
                    $LocalDeviceValidationTable,
                    DeviceValidationRow
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalDeviceValidationTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalDeviceValidationTable,
      DeviceValidationRow,
      $$LocalDeviceValidationTableFilterComposer,
      $$LocalDeviceValidationTableOrderingComposer,
      $$LocalDeviceValidationTableAnnotationComposer,
      $$LocalDeviceValidationTableCreateCompanionBuilder,
      $$LocalDeviceValidationTableUpdateCompanionBuilder,
      (
        DeviceValidationRow,
        BaseReferences<
          _$AppDatabase,
          $LocalDeviceValidationTable,
          DeviceValidationRow
        >,
      ),
      DeviceValidationRow,
      PrefetchHooks Function()
    >;
typedef $$LocalNeedleTypeTableCreateCompanionBuilder =
    LocalNeedleTypeCompanion Function({
      required String id,
      required String code,
      required String name,
      Value<String?> category,
      required String unit,
      required String minimumStock,
      Value<int> rowid,
    });
typedef $$LocalNeedleTypeTableUpdateCompanionBuilder =
    LocalNeedleTypeCompanion Function({
      Value<String> id,
      Value<String> code,
      Value<String> name,
      Value<String?> category,
      Value<String> unit,
      Value<String> minimumStock,
      Value<int> rowid,
    });

class $$LocalNeedleTypeTableFilterComposer
    extends Composer<_$AppDatabase, $LocalNeedleTypeTable> {
  $$LocalNeedleTypeTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get code => $composableBuilder(
    column: $table.code,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get category => $composableBuilder(
    column: $table.category,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get unit => $composableBuilder(
    column: $table.unit,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get minimumStock => $composableBuilder(
    column: $table.minimumStock,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalNeedleTypeTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalNeedleTypeTable> {
  $$LocalNeedleTypeTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get code => $composableBuilder(
    column: $table.code,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get category => $composableBuilder(
    column: $table.category,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get unit => $composableBuilder(
    column: $table.unit,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get minimumStock => $composableBuilder(
    column: $table.minimumStock,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalNeedleTypeTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalNeedleTypeTable> {
  $$LocalNeedleTypeTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get code =>
      $composableBuilder(column: $table.code, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get category =>
      $composableBuilder(column: $table.category, builder: (column) => column);

  GeneratedColumn<String> get unit =>
      $composableBuilder(column: $table.unit, builder: (column) => column);

  GeneratedColumn<String> get minimumStock => $composableBuilder(
    column: $table.minimumStock,
    builder: (column) => column,
  );
}

class $$LocalNeedleTypeTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalNeedleTypeTable,
          NeedleTypeRow,
          $$LocalNeedleTypeTableFilterComposer,
          $$LocalNeedleTypeTableOrderingComposer,
          $$LocalNeedleTypeTableAnnotationComposer,
          $$LocalNeedleTypeTableCreateCompanionBuilder,
          $$LocalNeedleTypeTableUpdateCompanionBuilder,
          (
            NeedleTypeRow,
            BaseReferences<_$AppDatabase, $LocalNeedleTypeTable, NeedleTypeRow>,
          ),
          NeedleTypeRow,
          PrefetchHooks Function()
        > {
  $$LocalNeedleTypeTableTableManager(
    _$AppDatabase db,
    $LocalNeedleTypeTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalNeedleTypeTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalNeedleTypeTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalNeedleTypeTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> code = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<String?> category = const Value.absent(),
                Value<String> unit = const Value.absent(),
                Value<String> minimumStock = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalNeedleTypeCompanion(
                id: id,
                code: code,
                name: name,
                category: category,
                unit: unit,
                minimumStock: minimumStock,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String code,
                required String name,
                Value<String?> category = const Value.absent(),
                required String unit,
                required String minimumStock,
                Value<int> rowid = const Value.absent(),
              }) => LocalNeedleTypeCompanion.insert(
                id: id,
                code: code,
                name: name,
                category: category,
                unit: unit,
                minimumStock: minimumStock,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$LocalNeedleTypeTable, NeedleTypeRow>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $LocalNeedleTypeTable,
                    NeedleTypeRow
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalNeedleTypeTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalNeedleTypeTable,
      NeedleTypeRow,
      $$LocalNeedleTypeTableFilterComposer,
      $$LocalNeedleTypeTableOrderingComposer,
      $$LocalNeedleTypeTableAnnotationComposer,
      $$LocalNeedleTypeTableCreateCompanionBuilder,
      $$LocalNeedleTypeTableUpdateCompanionBuilder,
      (
        NeedleTypeRow,
        BaseReferences<_$AppDatabase, $LocalNeedleTypeTable, NeedleTypeRow>,
      ),
      NeedleTypeRow,
      PrefetchHooks Function()
    >;
typedef $$LocalExchangeTypeTableCreateCompanionBuilder =
    LocalExchangeTypeCompanion Function({
      required String id,
      required String code,
      required String name,
      required bool requiresFragmentValidation,
      Value<int> rowid,
    });
typedef $$LocalExchangeTypeTableUpdateCompanionBuilder =
    LocalExchangeTypeCompanion Function({
      Value<String> id,
      Value<String> code,
      Value<String> name,
      Value<bool> requiresFragmentValidation,
      Value<int> rowid,
    });

class $$LocalExchangeTypeTableFilterComposer
    extends Composer<_$AppDatabase, $LocalExchangeTypeTable> {
  $$LocalExchangeTypeTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get code => $composableBuilder(
    column: $table.code,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get requiresFragmentValidation => $composableBuilder(
    column: $table.requiresFragmentValidation,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalExchangeTypeTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalExchangeTypeTable> {
  $$LocalExchangeTypeTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get code => $composableBuilder(
    column: $table.code,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get requiresFragmentValidation => $composableBuilder(
    column: $table.requiresFragmentValidation,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalExchangeTypeTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalExchangeTypeTable> {
  $$LocalExchangeTypeTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get code =>
      $composableBuilder(column: $table.code, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<bool> get requiresFragmentValidation => $composableBuilder(
    column: $table.requiresFragmentValidation,
    builder: (column) => column,
  );
}

class $$LocalExchangeTypeTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalExchangeTypeTable,
          ExchangeTypeRow,
          $$LocalExchangeTypeTableFilterComposer,
          $$LocalExchangeTypeTableOrderingComposer,
          $$LocalExchangeTypeTableAnnotationComposer,
          $$LocalExchangeTypeTableCreateCompanionBuilder,
          $$LocalExchangeTypeTableUpdateCompanionBuilder,
          (
            ExchangeTypeRow,
            BaseReferences<
              _$AppDatabase,
              $LocalExchangeTypeTable,
              ExchangeTypeRow
            >,
          ),
          ExchangeTypeRow,
          PrefetchHooks Function()
        > {
  $$LocalExchangeTypeTableTableManager(
    _$AppDatabase db,
    $LocalExchangeTypeTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalExchangeTypeTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalExchangeTypeTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalExchangeTypeTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> code = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<bool> requiresFragmentValidation = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalExchangeTypeCompanion(
                id: id,
                code: code,
                name: name,
                requiresFragmentValidation: requiresFragmentValidation,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String code,
                required String name,
                required bool requiresFragmentValidation,
                Value<int> rowid = const Value.absent(),
              }) => LocalExchangeTypeCompanion.insert(
                id: id,
                code: code,
                name: name,
                requiresFragmentValidation: requiresFragmentValidation,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$LocalExchangeTypeTable, ExchangeTypeRow>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $LocalExchangeTypeTable,
                    ExchangeTypeRow
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalExchangeTypeTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalExchangeTypeTable,
      ExchangeTypeRow,
      $$LocalExchangeTypeTableFilterComposer,
      $$LocalExchangeTypeTableOrderingComposer,
      $$LocalExchangeTypeTableAnnotationComposer,
      $$LocalExchangeTypeTableCreateCompanionBuilder,
      $$LocalExchangeTypeTableUpdateCompanionBuilder,
      (
        ExchangeTypeRow,
        BaseReferences<_$AppDatabase, $LocalExchangeTypeTable, ExchangeTypeRow>,
      ),
      ExchangeTypeRow,
      PrefetchHooks Function()
    >;
typedef $$LocalStorageMappingTableCreateCompanionBuilder =
    LocalStorageMappingCompanion Function({
      required String id,
      required String exchangeTypeId,
      required String storageLocationId,
      required String storageLocationCode,
      required String storageLocationName,
      Value<int> rowid,
    });
typedef $$LocalStorageMappingTableUpdateCompanionBuilder =
    LocalStorageMappingCompanion Function({
      Value<String> id,
      Value<String> exchangeTypeId,
      Value<String> storageLocationId,
      Value<String> storageLocationCode,
      Value<String> storageLocationName,
      Value<int> rowid,
    });

class $$LocalStorageMappingTableFilterComposer
    extends Composer<_$AppDatabase, $LocalStorageMappingTable> {
  $$LocalStorageMappingTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get exchangeTypeId => $composableBuilder(
    column: $table.exchangeTypeId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get storageLocationId => $composableBuilder(
    column: $table.storageLocationId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get storageLocationCode => $composableBuilder(
    column: $table.storageLocationCode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get storageLocationName => $composableBuilder(
    column: $table.storageLocationName,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalStorageMappingTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalStorageMappingTable> {
  $$LocalStorageMappingTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get exchangeTypeId => $composableBuilder(
    column: $table.exchangeTypeId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get storageLocationId => $composableBuilder(
    column: $table.storageLocationId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get storageLocationCode => $composableBuilder(
    column: $table.storageLocationCode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get storageLocationName => $composableBuilder(
    column: $table.storageLocationName,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalStorageMappingTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalStorageMappingTable> {
  $$LocalStorageMappingTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get exchangeTypeId => $composableBuilder(
    column: $table.exchangeTypeId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get storageLocationId => $composableBuilder(
    column: $table.storageLocationId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get storageLocationCode => $composableBuilder(
    column: $table.storageLocationCode,
    builder: (column) => column,
  );

  GeneratedColumn<String> get storageLocationName => $composableBuilder(
    column: $table.storageLocationName,
    builder: (column) => column,
  );
}

class $$LocalStorageMappingTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalStorageMappingTable,
          StorageMappingRow,
          $$LocalStorageMappingTableFilterComposer,
          $$LocalStorageMappingTableOrderingComposer,
          $$LocalStorageMappingTableAnnotationComposer,
          $$LocalStorageMappingTableCreateCompanionBuilder,
          $$LocalStorageMappingTableUpdateCompanionBuilder,
          (
            StorageMappingRow,
            BaseReferences<
              _$AppDatabase,
              $LocalStorageMappingTable,
              StorageMappingRow
            >,
          ),
          StorageMappingRow,
          PrefetchHooks Function()
        > {
  $$LocalStorageMappingTableTableManager(
    _$AppDatabase db,
    $LocalStorageMappingTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalStorageMappingTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalStorageMappingTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$LocalStorageMappingTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> exchangeTypeId = const Value.absent(),
                Value<String> storageLocationId = const Value.absent(),
                Value<String> storageLocationCode = const Value.absent(),
                Value<String> storageLocationName = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalStorageMappingCompanion(
                id: id,
                exchangeTypeId: exchangeTypeId,
                storageLocationId: storageLocationId,
                storageLocationCode: storageLocationCode,
                storageLocationName: storageLocationName,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String exchangeTypeId,
                required String storageLocationId,
                required String storageLocationCode,
                required String storageLocationName,
                Value<int> rowid = const Value.absent(),
              }) => LocalStorageMappingCompanion.insert(
                id: id,
                exchangeTypeId: exchangeTypeId,
                storageLocationId: storageLocationId,
                storageLocationCode: storageLocationCode,
                storageLocationName: storageLocationName,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$LocalStorageMappingTable, StorageMappingRow>(
                    table,
                  ),
                  BaseReferences<
                    _$AppDatabase,
                    $LocalStorageMappingTable,
                    StorageMappingRow
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalStorageMappingTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalStorageMappingTable,
      StorageMappingRow,
      $$LocalStorageMappingTableFilterComposer,
      $$LocalStorageMappingTableOrderingComposer,
      $$LocalStorageMappingTableAnnotationComposer,
      $$LocalStorageMappingTableCreateCompanionBuilder,
      $$LocalStorageMappingTableUpdateCompanionBuilder,
      (
        StorageMappingRow,
        BaseReferences<
          _$AppDatabase,
          $LocalStorageMappingTable,
          StorageMappingRow
        >,
      ),
      StorageMappingRow,
      PrefetchHooks Function()
    >;
typedef $$LocalMasterDataVersionTableCreateCompanionBuilder =
    LocalMasterDataVersionCompanion Function({
      required String collection,
      required String version,
      Value<int> rowid,
    });
typedef $$LocalMasterDataVersionTableUpdateCompanionBuilder =
    LocalMasterDataVersionCompanion Function({
      Value<String> collection,
      Value<String> version,
      Value<int> rowid,
    });

class $$LocalMasterDataVersionTableFilterComposer
    extends Composer<_$AppDatabase, $LocalMasterDataVersionTable> {
  $$LocalMasterDataVersionTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get collection => $composableBuilder(
    column: $table.collection,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get version => $composableBuilder(
    column: $table.version,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalMasterDataVersionTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalMasterDataVersionTable> {
  $$LocalMasterDataVersionTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get collection => $composableBuilder(
    column: $table.collection,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get version => $composableBuilder(
    column: $table.version,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalMasterDataVersionTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalMasterDataVersionTable> {
  $$LocalMasterDataVersionTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get collection => $composableBuilder(
    column: $table.collection,
    builder: (column) => column,
  );

  GeneratedColumn<String> get version =>
      $composableBuilder(column: $table.version, builder: (column) => column);
}

class $$LocalMasterDataVersionTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalMasterDataVersionTable,
          MasterDataVersionRow,
          $$LocalMasterDataVersionTableFilterComposer,
          $$LocalMasterDataVersionTableOrderingComposer,
          $$LocalMasterDataVersionTableAnnotationComposer,
          $$LocalMasterDataVersionTableCreateCompanionBuilder,
          $$LocalMasterDataVersionTableUpdateCompanionBuilder,
          (
            MasterDataVersionRow,
            BaseReferences<
              _$AppDatabase,
              $LocalMasterDataVersionTable,
              MasterDataVersionRow
            >,
          ),
          MasterDataVersionRow,
          PrefetchHooks Function()
        > {
  $$LocalMasterDataVersionTableTableManager(
    _$AppDatabase db,
    $LocalMasterDataVersionTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalMasterDataVersionTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              $$LocalMasterDataVersionTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$LocalMasterDataVersionTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> collection = const Value.absent(),
                Value<String> version = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalMasterDataVersionCompanion(
                collection: collection,
                version: version,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String collection,
                required String version,
                Value<int> rowid = const Value.absent(),
              }) => LocalMasterDataVersionCompanion.insert(
                collection: collection,
                version: version,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<
                    $LocalMasterDataVersionTable,
                    MasterDataVersionRow
                  >(table),
                  BaseReferences<
                    _$AppDatabase,
                    $LocalMasterDataVersionTable,
                    MasterDataVersionRow
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalMasterDataVersionTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalMasterDataVersionTable,
      MasterDataVersionRow,
      $$LocalMasterDataVersionTableFilterComposer,
      $$LocalMasterDataVersionTableOrderingComposer,
      $$LocalMasterDataVersionTableAnnotationComposer,
      $$LocalMasterDataVersionTableCreateCompanionBuilder,
      $$LocalMasterDataVersionTableUpdateCompanionBuilder,
      (
        MasterDataVersionRow,
        BaseReferences<
          _$AppDatabase,
          $LocalMasterDataVersionTable,
          MasterDataVersionRow
        >,
      ),
      MasterDataVersionRow,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$LocalUserSessionTableTableManager get localUserSession =>
      $$LocalUserSessionTableTableManager(_db, _db.localUserSession);
  $$LocalDeviceContextTableTableManager get localDeviceContext =>
      $$LocalDeviceContextTableTableManager(_db, _db.localDeviceContext);
  $$LocalDeviceValidationTableTableManager get localDeviceValidation =>
      $$LocalDeviceValidationTableTableManager(_db, _db.localDeviceValidation);
  $$LocalNeedleTypeTableTableManager get localNeedleType =>
      $$LocalNeedleTypeTableTableManager(_db, _db.localNeedleType);
  $$LocalExchangeTypeTableTableManager get localExchangeType =>
      $$LocalExchangeTypeTableTableManager(_db, _db.localExchangeType);
  $$LocalStorageMappingTableTableManager get localStorageMapping =>
      $$LocalStorageMappingTableTableManager(_db, _db.localStorageMapping);
  $$LocalMasterDataVersionTableTableManager get localMasterDataVersion =>
      $$LocalMasterDataVersionTableTableManager(
        _db,
        _db.localMasterDataVersion,
      );
}
