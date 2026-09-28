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

class $LocalExchangeTable extends LocalExchange
    with TableInfo<$LocalExchangeTable, LocalExchangeRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalExchangeTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _clientTransactionIdMeta =
      const VerificationMeta('clientTransactionId');
  @override
  late final GeneratedColumn<String> clientTransactionId =
      GeneratedColumn<String>(
        'client_transaction_id',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _createIdempotencyKeyMeta =
      const VerificationMeta('createIdempotencyKey');
  @override
  late final GeneratedColumn<String> createIdempotencyKey =
      GeneratedColumn<String>(
        'create_idempotency_key',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
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
  static const VerificationMeta _serverExchangeIdMeta = const VerificationMeta(
    'serverExchangeId',
  );
  @override
  late final GeneratedColumn<String> serverExchangeId = GeneratedColumn<String>(
    'server_exchange_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _exchangeNumberMeta = const VerificationMeta(
    'exchangeNumber',
  );
  @override
  late final GeneratedColumn<String> exchangeNumber = GeneratedColumn<String>(
    'exchange_number',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _lastKnownStatusMeta = const VerificationMeta(
    'lastKnownStatus',
  );
  @override
  late final GeneratedColumn<String> lastKnownStatus = GeneratedColumn<String>(
    'last_known_status',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _operatorEmployeeNumberMeta =
      const VerificationMeta('operatorEmployeeNumber');
  @override
  late final GeneratedColumn<String> operatorEmployeeNumber =
      GeneratedColumn<String>(
        'operator_employee_number',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _operatorNameMeta = const VerificationMeta(
    'operatorName',
  );
  @override
  late final GeneratedColumn<String> operatorName = GeneratedColumn<String>(
    'operator_name',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
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
  static const VerificationMeta _serverSnapshotMeta = const VerificationMeta(
    'serverSnapshot',
  );
  @override
  late final GeneratedColumn<String> serverSnapshot = GeneratedColumn<String>(
    'server_snapshot',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _confirmationStatusMeta =
      const VerificationMeta('confirmationStatus');
  @override
  late final GeneratedColumn<String> confirmationStatus =
      GeneratedColumn<String>(
        'confirmation_status',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _closedAtMeta = const VerificationMeta(
    'closedAt',
  );
  @override
  late final GeneratedColumn<DateTime> closedAt = GeneratedColumn<DateTime>(
    'closed_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _syncConfirmedAtMeta = const VerificationMeta(
    'syncConfirmedAt',
  );
  @override
  late final GeneratedColumn<DateTime> syncConfirmedAt =
      GeneratedColumn<DateTime>(
        'sync_confirmed_at',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  @override
  List<GeneratedColumn> get $columns => [
    clientTransactionId,
    createIdempotencyKey,
    deviceId,
    serverExchangeId,
    exchangeNumber,
    lastKnownStatus,
    operatorEmployeeNumber,
    operatorName,
    createdAt,
    updatedAt,
    serverSnapshot,
    confirmationStatus,
    closedAt,
    syncConfirmedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_exchange';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalExchangeRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('client_transaction_id')) {
      context.handle(
        _clientTransactionIdMeta,
        clientTransactionId.isAcceptableOrUnknown(
          data['client_transaction_id']!,
          _clientTransactionIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_clientTransactionIdMeta);
    }
    if (data.containsKey('create_idempotency_key')) {
      context.handle(
        _createIdempotencyKeyMeta,
        createIdempotencyKey.isAcceptableOrUnknown(
          data['create_idempotency_key']!,
          _createIdempotencyKeyMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_createIdempotencyKeyMeta);
    }
    if (data.containsKey('device_id')) {
      context.handle(
        _deviceIdMeta,
        deviceId.isAcceptableOrUnknown(data['device_id']!, _deviceIdMeta),
      );
    } else if (isInserting) {
      context.missing(_deviceIdMeta);
    }
    if (data.containsKey('server_exchange_id')) {
      context.handle(
        _serverExchangeIdMeta,
        serverExchangeId.isAcceptableOrUnknown(
          data['server_exchange_id']!,
          _serverExchangeIdMeta,
        ),
      );
    }
    if (data.containsKey('exchange_number')) {
      context.handle(
        _exchangeNumberMeta,
        exchangeNumber.isAcceptableOrUnknown(
          data['exchange_number']!,
          _exchangeNumberMeta,
        ),
      );
    }
    if (data.containsKey('last_known_status')) {
      context.handle(
        _lastKnownStatusMeta,
        lastKnownStatus.isAcceptableOrUnknown(
          data['last_known_status']!,
          _lastKnownStatusMeta,
        ),
      );
    }
    if (data.containsKey('operator_employee_number')) {
      context.handle(
        _operatorEmployeeNumberMeta,
        operatorEmployeeNumber.isAcceptableOrUnknown(
          data['operator_employee_number']!,
          _operatorEmployeeNumberMeta,
        ),
      );
    }
    if (data.containsKey('operator_name')) {
      context.handle(
        _operatorNameMeta,
        operatorName.isAcceptableOrUnknown(
          data['operator_name']!,
          _operatorNameMeta,
        ),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    if (data.containsKey('server_snapshot')) {
      context.handle(
        _serverSnapshotMeta,
        serverSnapshot.isAcceptableOrUnknown(
          data['server_snapshot']!,
          _serverSnapshotMeta,
        ),
      );
    }
    if (data.containsKey('confirmation_status')) {
      context.handle(
        _confirmationStatusMeta,
        confirmationStatus.isAcceptableOrUnknown(
          data['confirmation_status']!,
          _confirmationStatusMeta,
        ),
      );
    }
    if (data.containsKey('closed_at')) {
      context.handle(
        _closedAtMeta,
        closedAt.isAcceptableOrUnknown(data['closed_at']!, _closedAtMeta),
      );
    }
    if (data.containsKey('sync_confirmed_at')) {
      context.handle(
        _syncConfirmedAtMeta,
        syncConfirmedAt.isAcceptableOrUnknown(
          data['sync_confirmed_at']!,
          _syncConfirmedAtMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {clientTransactionId};
  @override
  LocalExchangeRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalExchangeRow(
      clientTransactionId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}client_transaction_id'],
      )!,
      createIdempotencyKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}create_idempotency_key'],
      )!,
      deviceId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}device_id'],
      )!,
      serverExchangeId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}server_exchange_id'],
      ),
      exchangeNumber: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}exchange_number'],
      ),
      lastKnownStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}last_known_status'],
      ),
      operatorEmployeeNumber: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}operator_employee_number'],
      ),
      operatorName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}operator_name'],
      ),
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
      serverSnapshot: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}server_snapshot'],
      ),
      confirmationStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}confirmation_status'],
      ),
      closedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}closed_at'],
      ),
      syncConfirmedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}sync_confirmed_at'],
      ),
    );
  }

  @override
  $LocalExchangeTable createAlias(String alias) {
    return $LocalExchangeTable(attachedDatabase, alias);
  }
}

class LocalExchangeRow extends DataClass
    implements Insertable<LocalExchangeRow> {
  /// Client-generated, sent on `POST /exchanges` (UNIQUE per device on the
  /// backend, so a resend returns the original exchange — MG-12).
  final String clientTransactionId;

  /// The `Idempotency-Key` of the create attempt, reused when the create is
  /// resent after the app was killed before the answer arrived.
  final String createIdempotencyKey;

  /// Device the exchange was opened from; a row of another device (after
  /// re-provisioning) is never resumed.
  final String deviceId;

  /// `null` until `POST /exchanges` answered.
  final String? serverExchangeId;
  final String? exchangeNumber;
  final String? lastKnownStatus;

  /// Operator shown after the RFID lookup — the exchange row carries only
  /// `operatorId` (contract matrix MG-4), so a resumed summary needs these.
  final String? operatorEmployeeNumber;
  final String? operatorName;
  final DateTime createdAt;
  final DateTime updatedAt;

  /// The last exchange the backend returned (JSON, Docs/12 §10 shape), so an
  /// exchange can be resumed and its queued steps projected while offline.
  /// Replaced only by a newer server answer — never edited locally.
  final String? serverSnapshot;

  /// Confirmation status from sync results / pulls / `GET /confirmations`
  /// (`PENDING`/`APPROVED`/`REJECTED`/`EXPIRED`; `null` = not required or not
  /// known yet).
  final String? confirmationStatus;

  /// The PIC queued complete/cancel, or the server reported a terminal state:
  /// the wizard does not resume it by itself.
  final DateTime? closedAt;

  /// Terminal on the server and nothing left to send: start of the 7-day
  /// local retention (nexa_mobile/CLAUDE.md §2).
  final DateTime? syncConfirmedAt;
  const LocalExchangeRow({
    required this.clientTransactionId,
    required this.createIdempotencyKey,
    required this.deviceId,
    this.serverExchangeId,
    this.exchangeNumber,
    this.lastKnownStatus,
    this.operatorEmployeeNumber,
    this.operatorName,
    required this.createdAt,
    required this.updatedAt,
    this.serverSnapshot,
    this.confirmationStatus,
    this.closedAt,
    this.syncConfirmedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['client_transaction_id'] = Variable<String>(clientTransactionId);
    map['create_idempotency_key'] = Variable<String>(createIdempotencyKey);
    map['device_id'] = Variable<String>(deviceId);
    if (!nullToAbsent || serverExchangeId != null) {
      map['server_exchange_id'] = Variable<String>(serverExchangeId);
    }
    if (!nullToAbsent || exchangeNumber != null) {
      map['exchange_number'] = Variable<String>(exchangeNumber);
    }
    if (!nullToAbsent || lastKnownStatus != null) {
      map['last_known_status'] = Variable<String>(lastKnownStatus);
    }
    if (!nullToAbsent || operatorEmployeeNumber != null) {
      map['operator_employee_number'] = Variable<String>(
        operatorEmployeeNumber,
      );
    }
    if (!nullToAbsent || operatorName != null) {
      map['operator_name'] = Variable<String>(operatorName);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    if (!nullToAbsent || serverSnapshot != null) {
      map['server_snapshot'] = Variable<String>(serverSnapshot);
    }
    if (!nullToAbsent || confirmationStatus != null) {
      map['confirmation_status'] = Variable<String>(confirmationStatus);
    }
    if (!nullToAbsent || closedAt != null) {
      map['closed_at'] = Variable<DateTime>(closedAt);
    }
    if (!nullToAbsent || syncConfirmedAt != null) {
      map['sync_confirmed_at'] = Variable<DateTime>(syncConfirmedAt);
    }
    return map;
  }

  LocalExchangeCompanion toCompanion(bool nullToAbsent) {
    return LocalExchangeCompanion(
      clientTransactionId: Value(clientTransactionId),
      createIdempotencyKey: Value(createIdempotencyKey),
      deviceId: Value(deviceId),
      serverExchangeId: serverExchangeId == null && nullToAbsent
          ? const Value.absent()
          : Value(serverExchangeId),
      exchangeNumber: exchangeNumber == null && nullToAbsent
          ? const Value.absent()
          : Value(exchangeNumber),
      lastKnownStatus: lastKnownStatus == null && nullToAbsent
          ? const Value.absent()
          : Value(lastKnownStatus),
      operatorEmployeeNumber: operatorEmployeeNumber == null && nullToAbsent
          ? const Value.absent()
          : Value(operatorEmployeeNumber),
      operatorName: operatorName == null && nullToAbsent
          ? const Value.absent()
          : Value(operatorName),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
      serverSnapshot: serverSnapshot == null && nullToAbsent
          ? const Value.absent()
          : Value(serverSnapshot),
      confirmationStatus: confirmationStatus == null && nullToAbsent
          ? const Value.absent()
          : Value(confirmationStatus),
      closedAt: closedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(closedAt),
      syncConfirmedAt: syncConfirmedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(syncConfirmedAt),
    );
  }

  factory LocalExchangeRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalExchangeRow(
      clientTransactionId: serializer.fromJson<String>(
        json['clientTransactionId'],
      ),
      createIdempotencyKey: serializer.fromJson<String>(
        json['createIdempotencyKey'],
      ),
      deviceId: serializer.fromJson<String>(json['deviceId']),
      serverExchangeId: serializer.fromJson<String?>(json['serverExchangeId']),
      exchangeNumber: serializer.fromJson<String?>(json['exchangeNumber']),
      lastKnownStatus: serializer.fromJson<String?>(json['lastKnownStatus']),
      operatorEmployeeNumber: serializer.fromJson<String?>(
        json['operatorEmployeeNumber'],
      ),
      operatorName: serializer.fromJson<String?>(json['operatorName']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      serverSnapshot: serializer.fromJson<String?>(json['serverSnapshot']),
      confirmationStatus: serializer.fromJson<String?>(
        json['confirmationStatus'],
      ),
      closedAt: serializer.fromJson<DateTime?>(json['closedAt']),
      syncConfirmedAt: serializer.fromJson<DateTime?>(json['syncConfirmedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'clientTransactionId': serializer.toJson<String>(clientTransactionId),
      'createIdempotencyKey': serializer.toJson<String>(createIdempotencyKey),
      'deviceId': serializer.toJson<String>(deviceId),
      'serverExchangeId': serializer.toJson<String?>(serverExchangeId),
      'exchangeNumber': serializer.toJson<String?>(exchangeNumber),
      'lastKnownStatus': serializer.toJson<String?>(lastKnownStatus),
      'operatorEmployeeNumber': serializer.toJson<String?>(
        operatorEmployeeNumber,
      ),
      'operatorName': serializer.toJson<String?>(operatorName),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'serverSnapshot': serializer.toJson<String?>(serverSnapshot),
      'confirmationStatus': serializer.toJson<String?>(confirmationStatus),
      'closedAt': serializer.toJson<DateTime?>(closedAt),
      'syncConfirmedAt': serializer.toJson<DateTime?>(syncConfirmedAt),
    };
  }

  LocalExchangeRow copyWith({
    String? clientTransactionId,
    String? createIdempotencyKey,
    String? deviceId,
    Value<String?> serverExchangeId = const Value.absent(),
    Value<String?> exchangeNumber = const Value.absent(),
    Value<String?> lastKnownStatus = const Value.absent(),
    Value<String?> operatorEmployeeNumber = const Value.absent(),
    Value<String?> operatorName = const Value.absent(),
    DateTime? createdAt,
    DateTime? updatedAt,
    Value<String?> serverSnapshot = const Value.absent(),
    Value<String?> confirmationStatus = const Value.absent(),
    Value<DateTime?> closedAt = const Value.absent(),
    Value<DateTime?> syncConfirmedAt = const Value.absent(),
  }) => LocalExchangeRow(
    clientTransactionId: clientTransactionId ?? this.clientTransactionId,
    createIdempotencyKey: createIdempotencyKey ?? this.createIdempotencyKey,
    deviceId: deviceId ?? this.deviceId,
    serverExchangeId: serverExchangeId.present
        ? serverExchangeId.value
        : this.serverExchangeId,
    exchangeNumber: exchangeNumber.present
        ? exchangeNumber.value
        : this.exchangeNumber,
    lastKnownStatus: lastKnownStatus.present
        ? lastKnownStatus.value
        : this.lastKnownStatus,
    operatorEmployeeNumber: operatorEmployeeNumber.present
        ? operatorEmployeeNumber.value
        : this.operatorEmployeeNumber,
    operatorName: operatorName.present ? operatorName.value : this.operatorName,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
    serverSnapshot: serverSnapshot.present
        ? serverSnapshot.value
        : this.serverSnapshot,
    confirmationStatus: confirmationStatus.present
        ? confirmationStatus.value
        : this.confirmationStatus,
    closedAt: closedAt.present ? closedAt.value : this.closedAt,
    syncConfirmedAt: syncConfirmedAt.present
        ? syncConfirmedAt.value
        : this.syncConfirmedAt,
  );
  LocalExchangeRow copyWithCompanion(LocalExchangeCompanion data) {
    return LocalExchangeRow(
      clientTransactionId: data.clientTransactionId.present
          ? data.clientTransactionId.value
          : this.clientTransactionId,
      createIdempotencyKey: data.createIdempotencyKey.present
          ? data.createIdempotencyKey.value
          : this.createIdempotencyKey,
      deviceId: data.deviceId.present ? data.deviceId.value : this.deviceId,
      serverExchangeId: data.serverExchangeId.present
          ? data.serverExchangeId.value
          : this.serverExchangeId,
      exchangeNumber: data.exchangeNumber.present
          ? data.exchangeNumber.value
          : this.exchangeNumber,
      lastKnownStatus: data.lastKnownStatus.present
          ? data.lastKnownStatus.value
          : this.lastKnownStatus,
      operatorEmployeeNumber: data.operatorEmployeeNumber.present
          ? data.operatorEmployeeNumber.value
          : this.operatorEmployeeNumber,
      operatorName: data.operatorName.present
          ? data.operatorName.value
          : this.operatorName,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      serverSnapshot: data.serverSnapshot.present
          ? data.serverSnapshot.value
          : this.serverSnapshot,
      confirmationStatus: data.confirmationStatus.present
          ? data.confirmationStatus.value
          : this.confirmationStatus,
      closedAt: data.closedAt.present ? data.closedAt.value : this.closedAt,
      syncConfirmedAt: data.syncConfirmedAt.present
          ? data.syncConfirmedAt.value
          : this.syncConfirmedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalExchangeRow(')
          ..write('clientTransactionId: $clientTransactionId, ')
          ..write('createIdempotencyKey: $createIdempotencyKey, ')
          ..write('deviceId: $deviceId, ')
          ..write('serverExchangeId: $serverExchangeId, ')
          ..write('exchangeNumber: $exchangeNumber, ')
          ..write('lastKnownStatus: $lastKnownStatus, ')
          ..write('operatorEmployeeNumber: $operatorEmployeeNumber, ')
          ..write('operatorName: $operatorName, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('serverSnapshot: $serverSnapshot, ')
          ..write('confirmationStatus: $confirmationStatus, ')
          ..write('closedAt: $closedAt, ')
          ..write('syncConfirmedAt: $syncConfirmedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    clientTransactionId,
    createIdempotencyKey,
    deviceId,
    serverExchangeId,
    exchangeNumber,
    lastKnownStatus,
    operatorEmployeeNumber,
    operatorName,
    createdAt,
    updatedAt,
    serverSnapshot,
    confirmationStatus,
    closedAt,
    syncConfirmedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalExchangeRow &&
          other.clientTransactionId == this.clientTransactionId &&
          other.createIdempotencyKey == this.createIdempotencyKey &&
          other.deviceId == this.deviceId &&
          other.serverExchangeId == this.serverExchangeId &&
          other.exchangeNumber == this.exchangeNumber &&
          other.lastKnownStatus == this.lastKnownStatus &&
          other.operatorEmployeeNumber == this.operatorEmployeeNumber &&
          other.operatorName == this.operatorName &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.serverSnapshot == this.serverSnapshot &&
          other.confirmationStatus == this.confirmationStatus &&
          other.closedAt == this.closedAt &&
          other.syncConfirmedAt == this.syncConfirmedAt);
}

class LocalExchangeCompanion extends UpdateCompanion<LocalExchangeRow> {
  final Value<String> clientTransactionId;
  final Value<String> createIdempotencyKey;
  final Value<String> deviceId;
  final Value<String?> serverExchangeId;
  final Value<String?> exchangeNumber;
  final Value<String?> lastKnownStatus;
  final Value<String?> operatorEmployeeNumber;
  final Value<String?> operatorName;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<String?> serverSnapshot;
  final Value<String?> confirmationStatus;
  final Value<DateTime?> closedAt;
  final Value<DateTime?> syncConfirmedAt;
  final Value<int> rowid;
  const LocalExchangeCompanion({
    this.clientTransactionId = const Value.absent(),
    this.createIdempotencyKey = const Value.absent(),
    this.deviceId = const Value.absent(),
    this.serverExchangeId = const Value.absent(),
    this.exchangeNumber = const Value.absent(),
    this.lastKnownStatus = const Value.absent(),
    this.operatorEmployeeNumber = const Value.absent(),
    this.operatorName = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.serverSnapshot = const Value.absent(),
    this.confirmationStatus = const Value.absent(),
    this.closedAt = const Value.absent(),
    this.syncConfirmedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalExchangeCompanion.insert({
    required String clientTransactionId,
    required String createIdempotencyKey,
    required String deviceId,
    this.serverExchangeId = const Value.absent(),
    this.exchangeNumber = const Value.absent(),
    this.lastKnownStatus = const Value.absent(),
    this.operatorEmployeeNumber = const Value.absent(),
    this.operatorName = const Value.absent(),
    required DateTime createdAt,
    required DateTime updatedAt,
    this.serverSnapshot = const Value.absent(),
    this.confirmationStatus = const Value.absent(),
    this.closedAt = const Value.absent(),
    this.syncConfirmedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : clientTransactionId = Value(clientTransactionId),
       createIdempotencyKey = Value(createIdempotencyKey),
       deviceId = Value(deviceId),
       createdAt = Value(createdAt),
       updatedAt = Value(updatedAt);
  static Insertable<LocalExchangeRow> custom({
    Expression<String>? clientTransactionId,
    Expression<String>? createIdempotencyKey,
    Expression<String>? deviceId,
    Expression<String>? serverExchangeId,
    Expression<String>? exchangeNumber,
    Expression<String>? lastKnownStatus,
    Expression<String>? operatorEmployeeNumber,
    Expression<String>? operatorName,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<String>? serverSnapshot,
    Expression<String>? confirmationStatus,
    Expression<DateTime>? closedAt,
    Expression<DateTime>? syncConfirmedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (clientTransactionId != null)
        'client_transaction_id': clientTransactionId,
      if (createIdempotencyKey != null)
        'create_idempotency_key': createIdempotencyKey,
      if (deviceId != null) 'device_id': deviceId,
      if (serverExchangeId != null) 'server_exchange_id': serverExchangeId,
      if (exchangeNumber != null) 'exchange_number': exchangeNumber,
      if (lastKnownStatus != null) 'last_known_status': lastKnownStatus,
      if (operatorEmployeeNumber != null)
        'operator_employee_number': operatorEmployeeNumber,
      if (operatorName != null) 'operator_name': operatorName,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (serverSnapshot != null) 'server_snapshot': serverSnapshot,
      if (confirmationStatus != null) 'confirmation_status': confirmationStatus,
      if (closedAt != null) 'closed_at': closedAt,
      if (syncConfirmedAt != null) 'sync_confirmed_at': syncConfirmedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalExchangeCompanion copyWith({
    Value<String>? clientTransactionId,
    Value<String>? createIdempotencyKey,
    Value<String>? deviceId,
    Value<String?>? serverExchangeId,
    Value<String?>? exchangeNumber,
    Value<String?>? lastKnownStatus,
    Value<String?>? operatorEmployeeNumber,
    Value<String?>? operatorName,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<String?>? serverSnapshot,
    Value<String?>? confirmationStatus,
    Value<DateTime?>? closedAt,
    Value<DateTime?>? syncConfirmedAt,
    Value<int>? rowid,
  }) {
    return LocalExchangeCompanion(
      clientTransactionId: clientTransactionId ?? this.clientTransactionId,
      createIdempotencyKey: createIdempotencyKey ?? this.createIdempotencyKey,
      deviceId: deviceId ?? this.deviceId,
      serverExchangeId: serverExchangeId ?? this.serverExchangeId,
      exchangeNumber: exchangeNumber ?? this.exchangeNumber,
      lastKnownStatus: lastKnownStatus ?? this.lastKnownStatus,
      operatorEmployeeNumber:
          operatorEmployeeNumber ?? this.operatorEmployeeNumber,
      operatorName: operatorName ?? this.operatorName,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      serverSnapshot: serverSnapshot ?? this.serverSnapshot,
      confirmationStatus: confirmationStatus ?? this.confirmationStatus,
      closedAt: closedAt ?? this.closedAt,
      syncConfirmedAt: syncConfirmedAt ?? this.syncConfirmedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (clientTransactionId.present) {
      map['client_transaction_id'] = Variable<String>(
        clientTransactionId.value,
      );
    }
    if (createIdempotencyKey.present) {
      map['create_idempotency_key'] = Variable<String>(
        createIdempotencyKey.value,
      );
    }
    if (deviceId.present) {
      map['device_id'] = Variable<String>(deviceId.value);
    }
    if (serverExchangeId.present) {
      map['server_exchange_id'] = Variable<String>(serverExchangeId.value);
    }
    if (exchangeNumber.present) {
      map['exchange_number'] = Variable<String>(exchangeNumber.value);
    }
    if (lastKnownStatus.present) {
      map['last_known_status'] = Variable<String>(lastKnownStatus.value);
    }
    if (operatorEmployeeNumber.present) {
      map['operator_employee_number'] = Variable<String>(
        operatorEmployeeNumber.value,
      );
    }
    if (operatorName.present) {
      map['operator_name'] = Variable<String>(operatorName.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (serverSnapshot.present) {
      map['server_snapshot'] = Variable<String>(serverSnapshot.value);
    }
    if (confirmationStatus.present) {
      map['confirmation_status'] = Variable<String>(confirmationStatus.value);
    }
    if (closedAt.present) {
      map['closed_at'] = Variable<DateTime>(closedAt.value);
    }
    if (syncConfirmedAt.present) {
      map['sync_confirmed_at'] = Variable<DateTime>(syncConfirmedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalExchangeCompanion(')
          ..write('clientTransactionId: $clientTransactionId, ')
          ..write('createIdempotencyKey: $createIdempotencyKey, ')
          ..write('deviceId: $deviceId, ')
          ..write('serverExchangeId: $serverExchangeId, ')
          ..write('exchangeNumber: $exchangeNumber, ')
          ..write('lastKnownStatus: $lastKnownStatus, ')
          ..write('operatorEmployeeNumber: $operatorEmployeeNumber, ')
          ..write('operatorName: $operatorName, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('serverSnapshot: $serverSnapshot, ')
          ..write('confirmationStatus: $confirmationStatus, ')
          ..write('closedAt: $closedAt, ')
          ..write('syncConfirmedAt: $syncConfirmedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalExchangeEvidenceTable extends LocalExchangeEvidence
    with TableInfo<$LocalExchangeEvidenceTable, LocalExchangeEvidenceRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalExchangeEvidenceTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _clientTransactionIdMeta =
      const VerificationMeta('clientTransactionId');
  @override
  late final GeneratedColumn<String> clientTransactionId =
      GeneratedColumn<String>(
        'client_transaction_id',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _evidenceTypeMeta = const VerificationMeta(
    'evidenceType',
  );
  @override
  late final GeneratedColumn<String> evidenceType = GeneratedColumn<String>(
    'evidence_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _filePathMeta = const VerificationMeta(
    'filePath',
  );
  @override
  late final GeneratedColumn<String> filePath = GeneratedColumn<String>(
    'file_path',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _mimeTypeMeta = const VerificationMeta(
    'mimeType',
  );
  @override
  late final GeneratedColumn<String> mimeType = GeneratedColumn<String>(
    'mime_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _byteSizeMeta = const VerificationMeta(
    'byteSize',
  );
  @override
  late final GeneratedColumn<int> byteSize = GeneratedColumn<int>(
    'byte_size',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _capturedAtMeta = const VerificationMeta(
    'capturedAt',
  );
  @override
  late final GeneratedColumn<DateTime> capturedAt = GeneratedColumn<DateTime>(
    'captured_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _idempotencyKeyMeta = const VerificationMeta(
    'idempotencyKey',
  );
  @override
  late final GeneratedColumn<String> idempotencyKey = GeneratedColumn<String>(
    'idempotency_key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _uploadStatusMeta = const VerificationMeta(
    'uploadStatus',
  );
  @override
  late final GeneratedColumn<String> uploadStatus = GeneratedColumn<String>(
    'upload_status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    clientTransactionId,
    evidenceType,
    filePath,
    mimeType,
    byteSize,
    capturedAt,
    idempotencyKey,
    uploadStatus,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_exchange_evidence';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalExchangeEvidenceRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('client_transaction_id')) {
      context.handle(
        _clientTransactionIdMeta,
        clientTransactionId.isAcceptableOrUnknown(
          data['client_transaction_id']!,
          _clientTransactionIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_clientTransactionIdMeta);
    }
    if (data.containsKey('evidence_type')) {
      context.handle(
        _evidenceTypeMeta,
        evidenceType.isAcceptableOrUnknown(
          data['evidence_type']!,
          _evidenceTypeMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_evidenceTypeMeta);
    }
    if (data.containsKey('file_path')) {
      context.handle(
        _filePathMeta,
        filePath.isAcceptableOrUnknown(data['file_path']!, _filePathMeta),
      );
    } else if (isInserting) {
      context.missing(_filePathMeta);
    }
    if (data.containsKey('mime_type')) {
      context.handle(
        _mimeTypeMeta,
        mimeType.isAcceptableOrUnknown(data['mime_type']!, _mimeTypeMeta),
      );
    } else if (isInserting) {
      context.missing(_mimeTypeMeta);
    }
    if (data.containsKey('byte_size')) {
      context.handle(
        _byteSizeMeta,
        byteSize.isAcceptableOrUnknown(data['byte_size']!, _byteSizeMeta),
      );
    } else if (isInserting) {
      context.missing(_byteSizeMeta);
    }
    if (data.containsKey('captured_at')) {
      context.handle(
        _capturedAtMeta,
        capturedAt.isAcceptableOrUnknown(data['captured_at']!, _capturedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_capturedAtMeta);
    }
    if (data.containsKey('idempotency_key')) {
      context.handle(
        _idempotencyKeyMeta,
        idempotencyKey.isAcceptableOrUnknown(
          data['idempotency_key']!,
          _idempotencyKeyMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_idempotencyKeyMeta);
    }
    if (data.containsKey('upload_status')) {
      context.handle(
        _uploadStatusMeta,
        uploadStatus.isAcceptableOrUnknown(
          data['upload_status']!,
          _uploadStatusMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_uploadStatusMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalExchangeEvidenceRow map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalExchangeEvidenceRow(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      clientTransactionId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}client_transaction_id'],
      )!,
      evidenceType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}evidence_type'],
      )!,
      filePath: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}file_path'],
      )!,
      mimeType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}mime_type'],
      )!,
      byteSize: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}byte_size'],
      )!,
      capturedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}captured_at'],
      )!,
      idempotencyKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}idempotency_key'],
      )!,
      uploadStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}upload_status'],
      )!,
    );
  }

  @override
  $LocalExchangeEvidenceTable createAlias(String alias) {
    return $LocalExchangeEvidenceTable(attachedDatabase, alias);
  }
}

class LocalExchangeEvidenceRow extends DataClass
    implements Insertable<LocalExchangeEvidenceRow> {
  /// Local id (UUID).
  final String id;
  final String clientTransactionId;

  /// `OLD_NEEDLE` / `BROKEN_FRAGMENT` / `OTHER`.
  final String evidenceType;
  final String filePath;
  final String mimeType;
  final int byteSize;
  final DateTime capturedAt;

  /// One key per photo, reused on every resend of that photo.
  final String idempotencyKey;

  /// Local photo state (Doc 17 §48): `CAPTURED` / `UPLOAD_FAILED`. The row is
  /// deleted with its file once the upload is confirmed.
  final String uploadStatus;
  const LocalExchangeEvidenceRow({
    required this.id,
    required this.clientTransactionId,
    required this.evidenceType,
    required this.filePath,
    required this.mimeType,
    required this.byteSize,
    required this.capturedAt,
    required this.idempotencyKey,
    required this.uploadStatus,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['client_transaction_id'] = Variable<String>(clientTransactionId);
    map['evidence_type'] = Variable<String>(evidenceType);
    map['file_path'] = Variable<String>(filePath);
    map['mime_type'] = Variable<String>(mimeType);
    map['byte_size'] = Variable<int>(byteSize);
    map['captured_at'] = Variable<DateTime>(capturedAt);
    map['idempotency_key'] = Variable<String>(idempotencyKey);
    map['upload_status'] = Variable<String>(uploadStatus);
    return map;
  }

  LocalExchangeEvidenceCompanion toCompanion(bool nullToAbsent) {
    return LocalExchangeEvidenceCompanion(
      id: Value(id),
      clientTransactionId: Value(clientTransactionId),
      evidenceType: Value(evidenceType),
      filePath: Value(filePath),
      mimeType: Value(mimeType),
      byteSize: Value(byteSize),
      capturedAt: Value(capturedAt),
      idempotencyKey: Value(idempotencyKey),
      uploadStatus: Value(uploadStatus),
    );
  }

  factory LocalExchangeEvidenceRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalExchangeEvidenceRow(
      id: serializer.fromJson<String>(json['id']),
      clientTransactionId: serializer.fromJson<String>(
        json['clientTransactionId'],
      ),
      evidenceType: serializer.fromJson<String>(json['evidenceType']),
      filePath: serializer.fromJson<String>(json['filePath']),
      mimeType: serializer.fromJson<String>(json['mimeType']),
      byteSize: serializer.fromJson<int>(json['byteSize']),
      capturedAt: serializer.fromJson<DateTime>(json['capturedAt']),
      idempotencyKey: serializer.fromJson<String>(json['idempotencyKey']),
      uploadStatus: serializer.fromJson<String>(json['uploadStatus']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'clientTransactionId': serializer.toJson<String>(clientTransactionId),
      'evidenceType': serializer.toJson<String>(evidenceType),
      'filePath': serializer.toJson<String>(filePath),
      'mimeType': serializer.toJson<String>(mimeType),
      'byteSize': serializer.toJson<int>(byteSize),
      'capturedAt': serializer.toJson<DateTime>(capturedAt),
      'idempotencyKey': serializer.toJson<String>(idempotencyKey),
      'uploadStatus': serializer.toJson<String>(uploadStatus),
    };
  }

  LocalExchangeEvidenceRow copyWith({
    String? id,
    String? clientTransactionId,
    String? evidenceType,
    String? filePath,
    String? mimeType,
    int? byteSize,
    DateTime? capturedAt,
    String? idempotencyKey,
    String? uploadStatus,
  }) => LocalExchangeEvidenceRow(
    id: id ?? this.id,
    clientTransactionId: clientTransactionId ?? this.clientTransactionId,
    evidenceType: evidenceType ?? this.evidenceType,
    filePath: filePath ?? this.filePath,
    mimeType: mimeType ?? this.mimeType,
    byteSize: byteSize ?? this.byteSize,
    capturedAt: capturedAt ?? this.capturedAt,
    idempotencyKey: idempotencyKey ?? this.idempotencyKey,
    uploadStatus: uploadStatus ?? this.uploadStatus,
  );
  LocalExchangeEvidenceRow copyWithCompanion(
    LocalExchangeEvidenceCompanion data,
  ) {
    return LocalExchangeEvidenceRow(
      id: data.id.present ? data.id.value : this.id,
      clientTransactionId: data.clientTransactionId.present
          ? data.clientTransactionId.value
          : this.clientTransactionId,
      evidenceType: data.evidenceType.present
          ? data.evidenceType.value
          : this.evidenceType,
      filePath: data.filePath.present ? data.filePath.value : this.filePath,
      mimeType: data.mimeType.present ? data.mimeType.value : this.mimeType,
      byteSize: data.byteSize.present ? data.byteSize.value : this.byteSize,
      capturedAt: data.capturedAt.present
          ? data.capturedAt.value
          : this.capturedAt,
      idempotencyKey: data.idempotencyKey.present
          ? data.idempotencyKey.value
          : this.idempotencyKey,
      uploadStatus: data.uploadStatus.present
          ? data.uploadStatus.value
          : this.uploadStatus,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalExchangeEvidenceRow(')
          ..write('id: $id, ')
          ..write('clientTransactionId: $clientTransactionId, ')
          ..write('evidenceType: $evidenceType, ')
          ..write('filePath: $filePath, ')
          ..write('mimeType: $mimeType, ')
          ..write('byteSize: $byteSize, ')
          ..write('capturedAt: $capturedAt, ')
          ..write('idempotencyKey: $idempotencyKey, ')
          ..write('uploadStatus: $uploadStatus')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    clientTransactionId,
    evidenceType,
    filePath,
    mimeType,
    byteSize,
    capturedAt,
    idempotencyKey,
    uploadStatus,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalExchangeEvidenceRow &&
          other.id == this.id &&
          other.clientTransactionId == this.clientTransactionId &&
          other.evidenceType == this.evidenceType &&
          other.filePath == this.filePath &&
          other.mimeType == this.mimeType &&
          other.byteSize == this.byteSize &&
          other.capturedAt == this.capturedAt &&
          other.idempotencyKey == this.idempotencyKey &&
          other.uploadStatus == this.uploadStatus);
}

class LocalExchangeEvidenceCompanion
    extends UpdateCompanion<LocalExchangeEvidenceRow> {
  final Value<String> id;
  final Value<String> clientTransactionId;
  final Value<String> evidenceType;
  final Value<String> filePath;
  final Value<String> mimeType;
  final Value<int> byteSize;
  final Value<DateTime> capturedAt;
  final Value<String> idempotencyKey;
  final Value<String> uploadStatus;
  final Value<int> rowid;
  const LocalExchangeEvidenceCompanion({
    this.id = const Value.absent(),
    this.clientTransactionId = const Value.absent(),
    this.evidenceType = const Value.absent(),
    this.filePath = const Value.absent(),
    this.mimeType = const Value.absent(),
    this.byteSize = const Value.absent(),
    this.capturedAt = const Value.absent(),
    this.idempotencyKey = const Value.absent(),
    this.uploadStatus = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalExchangeEvidenceCompanion.insert({
    required String id,
    required String clientTransactionId,
    required String evidenceType,
    required String filePath,
    required String mimeType,
    required int byteSize,
    required DateTime capturedAt,
    required String idempotencyKey,
    required String uploadStatus,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       clientTransactionId = Value(clientTransactionId),
       evidenceType = Value(evidenceType),
       filePath = Value(filePath),
       mimeType = Value(mimeType),
       byteSize = Value(byteSize),
       capturedAt = Value(capturedAt),
       idempotencyKey = Value(idempotencyKey),
       uploadStatus = Value(uploadStatus);
  static Insertable<LocalExchangeEvidenceRow> custom({
    Expression<String>? id,
    Expression<String>? clientTransactionId,
    Expression<String>? evidenceType,
    Expression<String>? filePath,
    Expression<String>? mimeType,
    Expression<int>? byteSize,
    Expression<DateTime>? capturedAt,
    Expression<String>? idempotencyKey,
    Expression<String>? uploadStatus,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (clientTransactionId != null)
        'client_transaction_id': clientTransactionId,
      if (evidenceType != null) 'evidence_type': evidenceType,
      if (filePath != null) 'file_path': filePath,
      if (mimeType != null) 'mime_type': mimeType,
      if (byteSize != null) 'byte_size': byteSize,
      if (capturedAt != null) 'captured_at': capturedAt,
      if (idempotencyKey != null) 'idempotency_key': idempotencyKey,
      if (uploadStatus != null) 'upload_status': uploadStatus,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalExchangeEvidenceCompanion copyWith({
    Value<String>? id,
    Value<String>? clientTransactionId,
    Value<String>? evidenceType,
    Value<String>? filePath,
    Value<String>? mimeType,
    Value<int>? byteSize,
    Value<DateTime>? capturedAt,
    Value<String>? idempotencyKey,
    Value<String>? uploadStatus,
    Value<int>? rowid,
  }) {
    return LocalExchangeEvidenceCompanion(
      id: id ?? this.id,
      clientTransactionId: clientTransactionId ?? this.clientTransactionId,
      evidenceType: evidenceType ?? this.evidenceType,
      filePath: filePath ?? this.filePath,
      mimeType: mimeType ?? this.mimeType,
      byteSize: byteSize ?? this.byteSize,
      capturedAt: capturedAt ?? this.capturedAt,
      idempotencyKey: idempotencyKey ?? this.idempotencyKey,
      uploadStatus: uploadStatus ?? this.uploadStatus,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (clientTransactionId.present) {
      map['client_transaction_id'] = Variable<String>(
        clientTransactionId.value,
      );
    }
    if (evidenceType.present) {
      map['evidence_type'] = Variable<String>(evidenceType.value);
    }
    if (filePath.present) {
      map['file_path'] = Variable<String>(filePath.value);
    }
    if (mimeType.present) {
      map['mime_type'] = Variable<String>(mimeType.value);
    }
    if (byteSize.present) {
      map['byte_size'] = Variable<int>(byteSize.value);
    }
    if (capturedAt.present) {
      map['captured_at'] = Variable<DateTime>(capturedAt.value);
    }
    if (idempotencyKey.present) {
      map['idempotency_key'] = Variable<String>(idempotencyKey.value);
    }
    if (uploadStatus.present) {
      map['upload_status'] = Variable<String>(uploadStatus.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalExchangeEvidenceCompanion(')
          ..write('id: $id, ')
          ..write('clientTransactionId: $clientTransactionId, ')
          ..write('evidenceType: $evidenceType, ')
          ..write('filePath: $filePath, ')
          ..write('mimeType: $mimeType, ')
          ..write('byteSize: $byteSize, ')
          ..write('capturedAt: $capturedAt, ')
          ..write('idempotencyKey: $idempotencyKey, ')
          ..write('uploadStatus: $uploadStatus, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalSyncQueueTable extends LocalSyncQueue
    with TableInfo<$LocalSyncQueueTable, LocalSyncQueueRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalSyncQueueTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _sequenceMeta = const VerificationMeta(
    'sequence',
  );
  @override
  late final GeneratedColumn<int> sequence = GeneratedColumn<int>(
    'sequence',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _commandIdMeta = const VerificationMeta(
    'commandId',
  );
  @override
  late final GeneratedColumn<String> commandId = GeneratedColumn<String>(
    'command_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways('UNIQUE'),
  );
  static const VerificationMeta _clientTransactionIdMeta =
      const VerificationMeta('clientTransactionId');
  @override
  late final GeneratedColumn<String> clientTransactionId =
      GeneratedColumn<String>(
        'client_transaction_id',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _commandTypeMeta = const VerificationMeta(
    'commandType',
  );
  @override
  late final GeneratedColumn<String> commandType = GeneratedColumn<String>(
    'command_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _payloadMeta = const VerificationMeta(
    'payload',
  );
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
    'payload',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('{}'),
  );
  static const VerificationMeta _occurredAtMeta = const VerificationMeta(
    'occurredAt',
  );
  @override
  late final GeneratedColumn<DateTime> occurredAt = GeneratedColumn<DateTime>(
    'occurred_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
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
  static const VerificationMeta _attemptCountMeta = const VerificationMeta(
    'attemptCount',
  );
  @override
  late final GeneratedColumn<int> attemptCount = GeneratedColumn<int>(
    'attempt_count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _nextAttemptAtMeta = const VerificationMeta(
    'nextAttemptAt',
  );
  @override
  late final GeneratedColumn<DateTime> nextAttemptAt =
      GeneratedColumn<DateTime>(
        'next_attempt_at',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _lastResultMeta = const VerificationMeta(
    'lastResult',
  );
  @override
  late final GeneratedColumn<String> lastResult = GeneratedColumn<String>(
    'last_result',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _lastErrorCodeMeta = const VerificationMeta(
    'lastErrorCode',
  );
  @override
  late final GeneratedColumn<String> lastErrorCode = GeneratedColumn<String>(
    'last_error_code',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _lastErrorMessageMeta = const VerificationMeta(
    'lastErrorMessage',
  );
  @override
  late final GeneratedColumn<String> lastErrorMessage = GeneratedColumn<String>(
    'last_error_message',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _lastErrorContextMeta = const VerificationMeta(
    'lastErrorContext',
  );
  @override
  late final GeneratedColumn<String> lastErrorContext = GeneratedColumn<String>(
    'last_error_context',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
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
    sequence,
    commandId,
    clientTransactionId,
    commandType,
    payload,
    occurredAt,
    status,
    attemptCount,
    nextAttemptAt,
    lastResult,
    lastErrorCode,
    lastErrorMessage,
    lastErrorContext,
    createdAt,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_sync_queue';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalSyncQueueRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('sequence')) {
      context.handle(
        _sequenceMeta,
        sequence.isAcceptableOrUnknown(data['sequence']!, _sequenceMeta),
      );
    }
    if (data.containsKey('command_id')) {
      context.handle(
        _commandIdMeta,
        commandId.isAcceptableOrUnknown(data['command_id']!, _commandIdMeta),
      );
    } else if (isInserting) {
      context.missing(_commandIdMeta);
    }
    if (data.containsKey('client_transaction_id')) {
      context.handle(
        _clientTransactionIdMeta,
        clientTransactionId.isAcceptableOrUnknown(
          data['client_transaction_id']!,
          _clientTransactionIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_clientTransactionIdMeta);
    }
    if (data.containsKey('command_type')) {
      context.handle(
        _commandTypeMeta,
        commandType.isAcceptableOrUnknown(
          data['command_type']!,
          _commandTypeMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_commandTypeMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(
        _payloadMeta,
        payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta),
      );
    }
    if (data.containsKey('occurred_at')) {
      context.handle(
        _occurredAtMeta,
        occurredAt.isAcceptableOrUnknown(data['occurred_at']!, _occurredAtMeta),
      );
    } else if (isInserting) {
      context.missing(_occurredAtMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('attempt_count')) {
      context.handle(
        _attemptCountMeta,
        attemptCount.isAcceptableOrUnknown(
          data['attempt_count']!,
          _attemptCountMeta,
        ),
      );
    }
    if (data.containsKey('next_attempt_at')) {
      context.handle(
        _nextAttemptAtMeta,
        nextAttemptAt.isAcceptableOrUnknown(
          data['next_attempt_at']!,
          _nextAttemptAtMeta,
        ),
      );
    }
    if (data.containsKey('last_result')) {
      context.handle(
        _lastResultMeta,
        lastResult.isAcceptableOrUnknown(data['last_result']!, _lastResultMeta),
      );
    }
    if (data.containsKey('last_error_code')) {
      context.handle(
        _lastErrorCodeMeta,
        lastErrorCode.isAcceptableOrUnknown(
          data['last_error_code']!,
          _lastErrorCodeMeta,
        ),
      );
    }
    if (data.containsKey('last_error_message')) {
      context.handle(
        _lastErrorMessageMeta,
        lastErrorMessage.isAcceptableOrUnknown(
          data['last_error_message']!,
          _lastErrorMessageMeta,
        ),
      );
    }
    if (data.containsKey('last_error_context')) {
      context.handle(
        _lastErrorContextMeta,
        lastErrorContext.isAcceptableOrUnknown(
          data['last_error_context']!,
          _lastErrorContextMeta,
        ),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
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
  Set<GeneratedColumn> get $primaryKey => {sequence};
  @override
  LocalSyncQueueRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalSyncQueueRow(
      sequence: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}sequence'],
      )!,
      commandId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}command_id'],
      )!,
      clientTransactionId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}client_transaction_id'],
      )!,
      commandType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}command_type'],
      )!,
      payload: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}payload'],
      )!,
      occurredAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}occurred_at'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      attemptCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}attempt_count'],
      )!,
      nextAttemptAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}next_attempt_at'],
      ),
      lastResult: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}last_result'],
      ),
      lastErrorCode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}last_error_code'],
      ),
      lastErrorMessage: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}last_error_message'],
      ),
      lastErrorContext: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}last_error_context'],
      ),
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $LocalSyncQueueTable createAlias(String alias) {
    return $LocalSyncQueueTable(attachedDatabase, alias);
  }
}

class LocalSyncQueueRow extends DataClass
    implements Insertable<LocalSyncQueueRow> {
  /// Creation order = send order (per exchange strictly, Doc 15 §12).
  final int sequence;

  /// UUID, the command's idempotency key; generated once, never regenerated
  /// on retry.
  final String commandId;

  /// The exchange's key (the one `POST /exchanges` carried).
  final String clientTransactionId;
  final String commandType;

  /// JSON object, exactly the backend payload.
  final String payload;

  /// Device time the PIC took the step (audit metadata on the backend).
  final DateTime occurredAt;

  /// `QUEUED` / `ACCEPTED` / `REJECTED`.
  final String status;

  /// Technical failures so far (Doc 15 §9 `retryCount`).
  final int attemptCount;

  /// Earliest automatic resend after a technical failure (Doc 15 §14).
  final DateTime? nextAttemptAt;

  /// Wire status of the last answer, or `NETWORK`.
  final String? lastResult;
  final String? lastErrorCode;
  final String? lastErrorMessage;

  /// JSON object: `error.context` (e.g. `availableQuantity`).
  final String? lastErrorContext;
  final DateTime createdAt;
  final DateTime updatedAt;
  const LocalSyncQueueRow({
    required this.sequence,
    required this.commandId,
    required this.clientTransactionId,
    required this.commandType,
    required this.payload,
    required this.occurredAt,
    required this.status,
    required this.attemptCount,
    this.nextAttemptAt,
    this.lastResult,
    this.lastErrorCode,
    this.lastErrorMessage,
    this.lastErrorContext,
    required this.createdAt,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['sequence'] = Variable<int>(sequence);
    map['command_id'] = Variable<String>(commandId);
    map['client_transaction_id'] = Variable<String>(clientTransactionId);
    map['command_type'] = Variable<String>(commandType);
    map['payload'] = Variable<String>(payload);
    map['occurred_at'] = Variable<DateTime>(occurredAt);
    map['status'] = Variable<String>(status);
    map['attempt_count'] = Variable<int>(attemptCount);
    if (!nullToAbsent || nextAttemptAt != null) {
      map['next_attempt_at'] = Variable<DateTime>(nextAttemptAt);
    }
    if (!nullToAbsent || lastResult != null) {
      map['last_result'] = Variable<String>(lastResult);
    }
    if (!nullToAbsent || lastErrorCode != null) {
      map['last_error_code'] = Variable<String>(lastErrorCode);
    }
    if (!nullToAbsent || lastErrorMessage != null) {
      map['last_error_message'] = Variable<String>(lastErrorMessage);
    }
    if (!nullToAbsent || lastErrorContext != null) {
      map['last_error_context'] = Variable<String>(lastErrorContext);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  LocalSyncQueueCompanion toCompanion(bool nullToAbsent) {
    return LocalSyncQueueCompanion(
      sequence: Value(sequence),
      commandId: Value(commandId),
      clientTransactionId: Value(clientTransactionId),
      commandType: Value(commandType),
      payload: Value(payload),
      occurredAt: Value(occurredAt),
      status: Value(status),
      attemptCount: Value(attemptCount),
      nextAttemptAt: nextAttemptAt == null && nullToAbsent
          ? const Value.absent()
          : Value(nextAttemptAt),
      lastResult: lastResult == null && nullToAbsent
          ? const Value.absent()
          : Value(lastResult),
      lastErrorCode: lastErrorCode == null && nullToAbsent
          ? const Value.absent()
          : Value(lastErrorCode),
      lastErrorMessage: lastErrorMessage == null && nullToAbsent
          ? const Value.absent()
          : Value(lastErrorMessage),
      lastErrorContext: lastErrorContext == null && nullToAbsent
          ? const Value.absent()
          : Value(lastErrorContext),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
    );
  }

  factory LocalSyncQueueRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalSyncQueueRow(
      sequence: serializer.fromJson<int>(json['sequence']),
      commandId: serializer.fromJson<String>(json['commandId']),
      clientTransactionId: serializer.fromJson<String>(
        json['clientTransactionId'],
      ),
      commandType: serializer.fromJson<String>(json['commandType']),
      payload: serializer.fromJson<String>(json['payload']),
      occurredAt: serializer.fromJson<DateTime>(json['occurredAt']),
      status: serializer.fromJson<String>(json['status']),
      attemptCount: serializer.fromJson<int>(json['attemptCount']),
      nextAttemptAt: serializer.fromJson<DateTime?>(json['nextAttemptAt']),
      lastResult: serializer.fromJson<String?>(json['lastResult']),
      lastErrorCode: serializer.fromJson<String?>(json['lastErrorCode']),
      lastErrorMessage: serializer.fromJson<String?>(json['lastErrorMessage']),
      lastErrorContext: serializer.fromJson<String?>(json['lastErrorContext']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'sequence': serializer.toJson<int>(sequence),
      'commandId': serializer.toJson<String>(commandId),
      'clientTransactionId': serializer.toJson<String>(clientTransactionId),
      'commandType': serializer.toJson<String>(commandType),
      'payload': serializer.toJson<String>(payload),
      'occurredAt': serializer.toJson<DateTime>(occurredAt),
      'status': serializer.toJson<String>(status),
      'attemptCount': serializer.toJson<int>(attemptCount),
      'nextAttemptAt': serializer.toJson<DateTime?>(nextAttemptAt),
      'lastResult': serializer.toJson<String?>(lastResult),
      'lastErrorCode': serializer.toJson<String?>(lastErrorCode),
      'lastErrorMessage': serializer.toJson<String?>(lastErrorMessage),
      'lastErrorContext': serializer.toJson<String?>(lastErrorContext),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  LocalSyncQueueRow copyWith({
    int? sequence,
    String? commandId,
    String? clientTransactionId,
    String? commandType,
    String? payload,
    DateTime? occurredAt,
    String? status,
    int? attemptCount,
    Value<DateTime?> nextAttemptAt = const Value.absent(),
    Value<String?> lastResult = const Value.absent(),
    Value<String?> lastErrorCode = const Value.absent(),
    Value<String?> lastErrorMessage = const Value.absent(),
    Value<String?> lastErrorContext = const Value.absent(),
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => LocalSyncQueueRow(
    sequence: sequence ?? this.sequence,
    commandId: commandId ?? this.commandId,
    clientTransactionId: clientTransactionId ?? this.clientTransactionId,
    commandType: commandType ?? this.commandType,
    payload: payload ?? this.payload,
    occurredAt: occurredAt ?? this.occurredAt,
    status: status ?? this.status,
    attemptCount: attemptCount ?? this.attemptCount,
    nextAttemptAt: nextAttemptAt.present
        ? nextAttemptAt.value
        : this.nextAttemptAt,
    lastResult: lastResult.present ? lastResult.value : this.lastResult,
    lastErrorCode: lastErrorCode.present
        ? lastErrorCode.value
        : this.lastErrorCode,
    lastErrorMessage: lastErrorMessage.present
        ? lastErrorMessage.value
        : this.lastErrorMessage,
    lastErrorContext: lastErrorContext.present
        ? lastErrorContext.value
        : this.lastErrorContext,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  LocalSyncQueueRow copyWithCompanion(LocalSyncQueueCompanion data) {
    return LocalSyncQueueRow(
      sequence: data.sequence.present ? data.sequence.value : this.sequence,
      commandId: data.commandId.present ? data.commandId.value : this.commandId,
      clientTransactionId: data.clientTransactionId.present
          ? data.clientTransactionId.value
          : this.clientTransactionId,
      commandType: data.commandType.present
          ? data.commandType.value
          : this.commandType,
      payload: data.payload.present ? data.payload.value : this.payload,
      occurredAt: data.occurredAt.present
          ? data.occurredAt.value
          : this.occurredAt,
      status: data.status.present ? data.status.value : this.status,
      attemptCount: data.attemptCount.present
          ? data.attemptCount.value
          : this.attemptCount,
      nextAttemptAt: data.nextAttemptAt.present
          ? data.nextAttemptAt.value
          : this.nextAttemptAt,
      lastResult: data.lastResult.present
          ? data.lastResult.value
          : this.lastResult,
      lastErrorCode: data.lastErrorCode.present
          ? data.lastErrorCode.value
          : this.lastErrorCode,
      lastErrorMessage: data.lastErrorMessage.present
          ? data.lastErrorMessage.value
          : this.lastErrorMessage,
      lastErrorContext: data.lastErrorContext.present
          ? data.lastErrorContext.value
          : this.lastErrorContext,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalSyncQueueRow(')
          ..write('sequence: $sequence, ')
          ..write('commandId: $commandId, ')
          ..write('clientTransactionId: $clientTransactionId, ')
          ..write('commandType: $commandType, ')
          ..write('payload: $payload, ')
          ..write('occurredAt: $occurredAt, ')
          ..write('status: $status, ')
          ..write('attemptCount: $attemptCount, ')
          ..write('nextAttemptAt: $nextAttemptAt, ')
          ..write('lastResult: $lastResult, ')
          ..write('lastErrorCode: $lastErrorCode, ')
          ..write('lastErrorMessage: $lastErrorMessage, ')
          ..write('lastErrorContext: $lastErrorContext, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    sequence,
    commandId,
    clientTransactionId,
    commandType,
    payload,
    occurredAt,
    status,
    attemptCount,
    nextAttemptAt,
    lastResult,
    lastErrorCode,
    lastErrorMessage,
    lastErrorContext,
    createdAt,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalSyncQueueRow &&
          other.sequence == this.sequence &&
          other.commandId == this.commandId &&
          other.clientTransactionId == this.clientTransactionId &&
          other.commandType == this.commandType &&
          other.payload == this.payload &&
          other.occurredAt == this.occurredAt &&
          other.status == this.status &&
          other.attemptCount == this.attemptCount &&
          other.nextAttemptAt == this.nextAttemptAt &&
          other.lastResult == this.lastResult &&
          other.lastErrorCode == this.lastErrorCode &&
          other.lastErrorMessage == this.lastErrorMessage &&
          other.lastErrorContext == this.lastErrorContext &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt);
}

class LocalSyncQueueCompanion extends UpdateCompanion<LocalSyncQueueRow> {
  final Value<int> sequence;
  final Value<String> commandId;
  final Value<String> clientTransactionId;
  final Value<String> commandType;
  final Value<String> payload;
  final Value<DateTime> occurredAt;
  final Value<String> status;
  final Value<int> attemptCount;
  final Value<DateTime?> nextAttemptAt;
  final Value<String?> lastResult;
  final Value<String?> lastErrorCode;
  final Value<String?> lastErrorMessage;
  final Value<String?> lastErrorContext;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  const LocalSyncQueueCompanion({
    this.sequence = const Value.absent(),
    this.commandId = const Value.absent(),
    this.clientTransactionId = const Value.absent(),
    this.commandType = const Value.absent(),
    this.payload = const Value.absent(),
    this.occurredAt = const Value.absent(),
    this.status = const Value.absent(),
    this.attemptCount = const Value.absent(),
    this.nextAttemptAt = const Value.absent(),
    this.lastResult = const Value.absent(),
    this.lastErrorCode = const Value.absent(),
    this.lastErrorMessage = const Value.absent(),
    this.lastErrorContext = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
  });
  LocalSyncQueueCompanion.insert({
    this.sequence = const Value.absent(),
    required String commandId,
    required String clientTransactionId,
    required String commandType,
    this.payload = const Value.absent(),
    required DateTime occurredAt,
    required String status,
    this.attemptCount = const Value.absent(),
    this.nextAttemptAt = const Value.absent(),
    this.lastResult = const Value.absent(),
    this.lastErrorCode = const Value.absent(),
    this.lastErrorMessage = const Value.absent(),
    this.lastErrorContext = const Value.absent(),
    required DateTime createdAt,
    required DateTime updatedAt,
  }) : commandId = Value(commandId),
       clientTransactionId = Value(clientTransactionId),
       commandType = Value(commandType),
       occurredAt = Value(occurredAt),
       status = Value(status),
       createdAt = Value(createdAt),
       updatedAt = Value(updatedAt);
  static Insertable<LocalSyncQueueRow> custom({
    Expression<int>? sequence,
    Expression<String>? commandId,
    Expression<String>? clientTransactionId,
    Expression<String>? commandType,
    Expression<String>? payload,
    Expression<DateTime>? occurredAt,
    Expression<String>? status,
    Expression<int>? attemptCount,
    Expression<DateTime>? nextAttemptAt,
    Expression<String>? lastResult,
    Expression<String>? lastErrorCode,
    Expression<String>? lastErrorMessage,
    Expression<String>? lastErrorContext,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
  }) {
    return RawValuesInsertable({
      if (sequence != null) 'sequence': sequence,
      if (commandId != null) 'command_id': commandId,
      if (clientTransactionId != null)
        'client_transaction_id': clientTransactionId,
      if (commandType != null) 'command_type': commandType,
      if (payload != null) 'payload': payload,
      if (occurredAt != null) 'occurred_at': occurredAt,
      if (status != null) 'status': status,
      if (attemptCount != null) 'attempt_count': attemptCount,
      if (nextAttemptAt != null) 'next_attempt_at': nextAttemptAt,
      if (lastResult != null) 'last_result': lastResult,
      if (lastErrorCode != null) 'last_error_code': lastErrorCode,
      if (lastErrorMessage != null) 'last_error_message': lastErrorMessage,
      if (lastErrorContext != null) 'last_error_context': lastErrorContext,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
    });
  }

  LocalSyncQueueCompanion copyWith({
    Value<int>? sequence,
    Value<String>? commandId,
    Value<String>? clientTransactionId,
    Value<String>? commandType,
    Value<String>? payload,
    Value<DateTime>? occurredAt,
    Value<String>? status,
    Value<int>? attemptCount,
    Value<DateTime?>? nextAttemptAt,
    Value<String?>? lastResult,
    Value<String?>? lastErrorCode,
    Value<String?>? lastErrorMessage,
    Value<String?>? lastErrorContext,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
  }) {
    return LocalSyncQueueCompanion(
      sequence: sequence ?? this.sequence,
      commandId: commandId ?? this.commandId,
      clientTransactionId: clientTransactionId ?? this.clientTransactionId,
      commandType: commandType ?? this.commandType,
      payload: payload ?? this.payload,
      occurredAt: occurredAt ?? this.occurredAt,
      status: status ?? this.status,
      attemptCount: attemptCount ?? this.attemptCount,
      nextAttemptAt: nextAttemptAt ?? this.nextAttemptAt,
      lastResult: lastResult ?? this.lastResult,
      lastErrorCode: lastErrorCode ?? this.lastErrorCode,
      lastErrorMessage: lastErrorMessage ?? this.lastErrorMessage,
      lastErrorContext: lastErrorContext ?? this.lastErrorContext,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (sequence.present) {
      map['sequence'] = Variable<int>(sequence.value);
    }
    if (commandId.present) {
      map['command_id'] = Variable<String>(commandId.value);
    }
    if (clientTransactionId.present) {
      map['client_transaction_id'] = Variable<String>(
        clientTransactionId.value,
      );
    }
    if (commandType.present) {
      map['command_type'] = Variable<String>(commandType.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (occurredAt.present) {
      map['occurred_at'] = Variable<DateTime>(occurredAt.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (attemptCount.present) {
      map['attempt_count'] = Variable<int>(attemptCount.value);
    }
    if (nextAttemptAt.present) {
      map['next_attempt_at'] = Variable<DateTime>(nextAttemptAt.value);
    }
    if (lastResult.present) {
      map['last_result'] = Variable<String>(lastResult.value);
    }
    if (lastErrorCode.present) {
      map['last_error_code'] = Variable<String>(lastErrorCode.value);
    }
    if (lastErrorMessage.present) {
      map['last_error_message'] = Variable<String>(lastErrorMessage.value);
    }
    if (lastErrorContext.present) {
      map['last_error_context'] = Variable<String>(lastErrorContext.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalSyncQueueCompanion(')
          ..write('sequence: $sequence, ')
          ..write('commandId: $commandId, ')
          ..write('clientTransactionId: $clientTransactionId, ')
          ..write('commandType: $commandType, ')
          ..write('payload: $payload, ')
          ..write('occurredAt: $occurredAt, ')
          ..write('status: $status, ')
          ..write('attemptCount: $attemptCount, ')
          ..write('nextAttemptAt: $nextAttemptAt, ')
          ..write('lastResult: $lastResult, ')
          ..write('lastErrorCode: $lastErrorCode, ')
          ..write('lastErrorMessage: $lastErrorMessage, ')
          ..write('lastErrorContext: $lastErrorContext, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }
}

class $LocalSyncStateTable extends LocalSyncState
    with TableInfo<$LocalSyncStateTable, LocalSyncStateRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalSyncStateTable(this.attachedDatabase, [this._alias]);
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
  static const VerificationMeta _cursorMeta = const VerificationMeta('cursor');
  @override
  late final GeneratedColumn<String> cursor = GeneratedColumn<String>(
    'cursor',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _lastSyncAtMeta = const VerificationMeta(
    'lastSyncAt',
  );
  @override
  late final GeneratedColumn<DateTime> lastSyncAt = GeneratedColumn<DateTime>(
    'last_sync_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [slot, deviceId, cursor, lastSyncAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_sync_state';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalSyncStateRow> instance, {
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
    if (data.containsKey('cursor')) {
      context.handle(
        _cursorMeta,
        cursor.isAcceptableOrUnknown(data['cursor']!, _cursorMeta),
      );
    }
    if (data.containsKey('last_sync_at')) {
      context.handle(
        _lastSyncAtMeta,
        lastSyncAt.isAcceptableOrUnknown(
          data['last_sync_at']!,
          _lastSyncAtMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {slot};
  @override
  LocalSyncStateRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalSyncStateRow(
      slot: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}slot'],
      )!,
      deviceId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}device_id'],
      )!,
      cursor: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}cursor'],
      ),
      lastSyncAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_sync_at'],
      ),
    );
  }

  @override
  $LocalSyncStateTable createAlias(String alias) {
    return $LocalSyncStateTable(attachedDatabase, alias);
  }
}

class LocalSyncStateRow extends DataClass
    implements Insertable<LocalSyncStateRow> {
  final int slot;

  /// The device the cursor belongs to.
  final String deviceId;

  /// Opaque `nextCursor` of the last answered sync; `null` → start from the
  /// bootstrap `syncCursor`.
  final String? cursor;

  /// Local time of the last sync the backend answered ("Last sync HH:mm",
  /// Doc 15 §19).
  final DateTime? lastSyncAt;
  const LocalSyncStateRow({
    required this.slot,
    required this.deviceId,
    this.cursor,
    this.lastSyncAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['slot'] = Variable<int>(slot);
    map['device_id'] = Variable<String>(deviceId);
    if (!nullToAbsent || cursor != null) {
      map['cursor'] = Variable<String>(cursor);
    }
    if (!nullToAbsent || lastSyncAt != null) {
      map['last_sync_at'] = Variable<DateTime>(lastSyncAt);
    }
    return map;
  }

  LocalSyncStateCompanion toCompanion(bool nullToAbsent) {
    return LocalSyncStateCompanion(
      slot: Value(slot),
      deviceId: Value(deviceId),
      cursor: cursor == null && nullToAbsent
          ? const Value.absent()
          : Value(cursor),
      lastSyncAt: lastSyncAt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastSyncAt),
    );
  }

  factory LocalSyncStateRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalSyncStateRow(
      slot: serializer.fromJson<int>(json['slot']),
      deviceId: serializer.fromJson<String>(json['deviceId']),
      cursor: serializer.fromJson<String?>(json['cursor']),
      lastSyncAt: serializer.fromJson<DateTime?>(json['lastSyncAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'slot': serializer.toJson<int>(slot),
      'deviceId': serializer.toJson<String>(deviceId),
      'cursor': serializer.toJson<String?>(cursor),
      'lastSyncAt': serializer.toJson<DateTime?>(lastSyncAt),
    };
  }

  LocalSyncStateRow copyWith({
    int? slot,
    String? deviceId,
    Value<String?> cursor = const Value.absent(),
    Value<DateTime?> lastSyncAt = const Value.absent(),
  }) => LocalSyncStateRow(
    slot: slot ?? this.slot,
    deviceId: deviceId ?? this.deviceId,
    cursor: cursor.present ? cursor.value : this.cursor,
    lastSyncAt: lastSyncAt.present ? lastSyncAt.value : this.lastSyncAt,
  );
  LocalSyncStateRow copyWithCompanion(LocalSyncStateCompanion data) {
    return LocalSyncStateRow(
      slot: data.slot.present ? data.slot.value : this.slot,
      deviceId: data.deviceId.present ? data.deviceId.value : this.deviceId,
      cursor: data.cursor.present ? data.cursor.value : this.cursor,
      lastSyncAt: data.lastSyncAt.present
          ? data.lastSyncAt.value
          : this.lastSyncAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalSyncStateRow(')
          ..write('slot: $slot, ')
          ..write('deviceId: $deviceId, ')
          ..write('cursor: $cursor, ')
          ..write('lastSyncAt: $lastSyncAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(slot, deviceId, cursor, lastSyncAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalSyncStateRow &&
          other.slot == this.slot &&
          other.deviceId == this.deviceId &&
          other.cursor == this.cursor &&
          other.lastSyncAt == this.lastSyncAt);
}

class LocalSyncStateCompanion extends UpdateCompanion<LocalSyncStateRow> {
  final Value<int> slot;
  final Value<String> deviceId;
  final Value<String?> cursor;
  final Value<DateTime?> lastSyncAt;
  const LocalSyncStateCompanion({
    this.slot = const Value.absent(),
    this.deviceId = const Value.absent(),
    this.cursor = const Value.absent(),
    this.lastSyncAt = const Value.absent(),
  });
  LocalSyncStateCompanion.insert({
    this.slot = const Value.absent(),
    required String deviceId,
    this.cursor = const Value.absent(),
    this.lastSyncAt = const Value.absent(),
  }) : deviceId = Value(deviceId);
  static Insertable<LocalSyncStateRow> custom({
    Expression<int>? slot,
    Expression<String>? deviceId,
    Expression<String>? cursor,
    Expression<DateTime>? lastSyncAt,
  }) {
    return RawValuesInsertable({
      if (slot != null) 'slot': slot,
      if (deviceId != null) 'device_id': deviceId,
      if (cursor != null) 'cursor': cursor,
      if (lastSyncAt != null) 'last_sync_at': lastSyncAt,
    });
  }

  LocalSyncStateCompanion copyWith({
    Value<int>? slot,
    Value<String>? deviceId,
    Value<String?>? cursor,
    Value<DateTime?>? lastSyncAt,
  }) {
    return LocalSyncStateCompanion(
      slot: slot ?? this.slot,
      deviceId: deviceId ?? this.deviceId,
      cursor: cursor ?? this.cursor,
      lastSyncAt: lastSyncAt ?? this.lastSyncAt,
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
    if (cursor.present) {
      map['cursor'] = Variable<String>(cursor.value);
    }
    if (lastSyncAt.present) {
      map['last_sync_at'] = Variable<DateTime>(lastSyncAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalSyncStateCompanion(')
          ..write('slot: $slot, ')
          ..write('deviceId: $deviceId, ')
          ..write('cursor: $cursor, ')
          ..write('lastSyncAt: $lastSyncAt')
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
  late final $LocalExchangeTable localExchange = $LocalExchangeTable(this);
  late final $LocalExchangeEvidenceTable localExchangeEvidence =
      $LocalExchangeEvidenceTable(this);
  late final $LocalSyncQueueTable localSyncQueue = $LocalSyncQueueTable(this);
  late final $LocalSyncStateTable localSyncState = $LocalSyncStateTable(this);
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
    localExchange,
    localExchangeEvidence,
    localSyncQueue,
    localSyncState,
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
typedef $$LocalExchangeTableCreateCompanionBuilder =
    LocalExchangeCompanion Function({
      required String clientTransactionId,
      required String createIdempotencyKey,
      required String deviceId,
      Value<String?> serverExchangeId,
      Value<String?> exchangeNumber,
      Value<String?> lastKnownStatus,
      Value<String?> operatorEmployeeNumber,
      Value<String?> operatorName,
      required DateTime createdAt,
      required DateTime updatedAt,
      Value<String?> serverSnapshot,
      Value<String?> confirmationStatus,
      Value<DateTime?> closedAt,
      Value<DateTime?> syncConfirmedAt,
      Value<int> rowid,
    });
typedef $$LocalExchangeTableUpdateCompanionBuilder =
    LocalExchangeCompanion Function({
      Value<String> clientTransactionId,
      Value<String> createIdempotencyKey,
      Value<String> deviceId,
      Value<String?> serverExchangeId,
      Value<String?> exchangeNumber,
      Value<String?> lastKnownStatus,
      Value<String?> operatorEmployeeNumber,
      Value<String?> operatorName,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<String?> serverSnapshot,
      Value<String?> confirmationStatus,
      Value<DateTime?> closedAt,
      Value<DateTime?> syncConfirmedAt,
      Value<int> rowid,
    });

class $$LocalExchangeTableFilterComposer
    extends Composer<_$AppDatabase, $LocalExchangeTable> {
  $$LocalExchangeTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get clientTransactionId => $composableBuilder(
    column: $table.clientTransactionId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get createIdempotencyKey => $composableBuilder(
    column: $table.createIdempotencyKey,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get deviceId => $composableBuilder(
    column: $table.deviceId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get serverExchangeId => $composableBuilder(
    column: $table.serverExchangeId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get exchangeNumber => $composableBuilder(
    column: $table.exchangeNumber,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get lastKnownStatus => $composableBuilder(
    column: $table.lastKnownStatus,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get operatorEmployeeNumber => $composableBuilder(
    column: $table.operatorEmployeeNumber,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get operatorName => $composableBuilder(
    column: $table.operatorName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get serverSnapshot => $composableBuilder(
    column: $table.serverSnapshot,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get confirmationStatus => $composableBuilder(
    column: $table.confirmationStatus,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get closedAt => $composableBuilder(
    column: $table.closedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get syncConfirmedAt => $composableBuilder(
    column: $table.syncConfirmedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalExchangeTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalExchangeTable> {
  $$LocalExchangeTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get clientTransactionId => $composableBuilder(
    column: $table.clientTransactionId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get createIdempotencyKey => $composableBuilder(
    column: $table.createIdempotencyKey,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get deviceId => $composableBuilder(
    column: $table.deviceId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get serverExchangeId => $composableBuilder(
    column: $table.serverExchangeId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get exchangeNumber => $composableBuilder(
    column: $table.exchangeNumber,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get lastKnownStatus => $composableBuilder(
    column: $table.lastKnownStatus,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get operatorEmployeeNumber => $composableBuilder(
    column: $table.operatorEmployeeNumber,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get operatorName => $composableBuilder(
    column: $table.operatorName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get serverSnapshot => $composableBuilder(
    column: $table.serverSnapshot,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get confirmationStatus => $composableBuilder(
    column: $table.confirmationStatus,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get closedAt => $composableBuilder(
    column: $table.closedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get syncConfirmedAt => $composableBuilder(
    column: $table.syncConfirmedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalExchangeTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalExchangeTable> {
  $$LocalExchangeTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get clientTransactionId => $composableBuilder(
    column: $table.clientTransactionId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get createIdempotencyKey => $composableBuilder(
    column: $table.createIdempotencyKey,
    builder: (column) => column,
  );

  GeneratedColumn<String> get deviceId =>
      $composableBuilder(column: $table.deviceId, builder: (column) => column);

  GeneratedColumn<String> get serverExchangeId => $composableBuilder(
    column: $table.serverExchangeId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get exchangeNumber => $composableBuilder(
    column: $table.exchangeNumber,
    builder: (column) => column,
  );

  GeneratedColumn<String> get lastKnownStatus => $composableBuilder(
    column: $table.lastKnownStatus,
    builder: (column) => column,
  );

  GeneratedColumn<String> get operatorEmployeeNumber => $composableBuilder(
    column: $table.operatorEmployeeNumber,
    builder: (column) => column,
  );

  GeneratedColumn<String> get operatorName => $composableBuilder(
    column: $table.operatorName,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  GeneratedColumn<String> get serverSnapshot => $composableBuilder(
    column: $table.serverSnapshot,
    builder: (column) => column,
  );

  GeneratedColumn<String> get confirmationStatus => $composableBuilder(
    column: $table.confirmationStatus,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get closedAt =>
      $composableBuilder(column: $table.closedAt, builder: (column) => column);

  GeneratedColumn<DateTime> get syncConfirmedAt => $composableBuilder(
    column: $table.syncConfirmedAt,
    builder: (column) => column,
  );
}

class $$LocalExchangeTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalExchangeTable,
          LocalExchangeRow,
          $$LocalExchangeTableFilterComposer,
          $$LocalExchangeTableOrderingComposer,
          $$LocalExchangeTableAnnotationComposer,
          $$LocalExchangeTableCreateCompanionBuilder,
          $$LocalExchangeTableUpdateCompanionBuilder,
          (
            LocalExchangeRow,
            BaseReferences<
              _$AppDatabase,
              $LocalExchangeTable,
              LocalExchangeRow
            >,
          ),
          LocalExchangeRow,
          PrefetchHooks Function()
        > {
  $$LocalExchangeTableTableManager(_$AppDatabase db, $LocalExchangeTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalExchangeTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalExchangeTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalExchangeTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> clientTransactionId = const Value.absent(),
                Value<String> createIdempotencyKey = const Value.absent(),
                Value<String> deviceId = const Value.absent(),
                Value<String?> serverExchangeId = const Value.absent(),
                Value<String?> exchangeNumber = const Value.absent(),
                Value<String?> lastKnownStatus = const Value.absent(),
                Value<String?> operatorEmployeeNumber = const Value.absent(),
                Value<String?> operatorName = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<String?> serverSnapshot = const Value.absent(),
                Value<String?> confirmationStatus = const Value.absent(),
                Value<DateTime?> closedAt = const Value.absent(),
                Value<DateTime?> syncConfirmedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalExchangeCompanion(
                clientTransactionId: clientTransactionId,
                createIdempotencyKey: createIdempotencyKey,
                deviceId: deviceId,
                serverExchangeId: serverExchangeId,
                exchangeNumber: exchangeNumber,
                lastKnownStatus: lastKnownStatus,
                operatorEmployeeNumber: operatorEmployeeNumber,
                operatorName: operatorName,
                createdAt: createdAt,
                updatedAt: updatedAt,
                serverSnapshot: serverSnapshot,
                confirmationStatus: confirmationStatus,
                closedAt: closedAt,
                syncConfirmedAt: syncConfirmedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String clientTransactionId,
                required String createIdempotencyKey,
                required String deviceId,
                Value<String?> serverExchangeId = const Value.absent(),
                Value<String?> exchangeNumber = const Value.absent(),
                Value<String?> lastKnownStatus = const Value.absent(),
                Value<String?> operatorEmployeeNumber = const Value.absent(),
                Value<String?> operatorName = const Value.absent(),
                required DateTime createdAt,
                required DateTime updatedAt,
                Value<String?> serverSnapshot = const Value.absent(),
                Value<String?> confirmationStatus = const Value.absent(),
                Value<DateTime?> closedAt = const Value.absent(),
                Value<DateTime?> syncConfirmedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalExchangeCompanion.insert(
                clientTransactionId: clientTransactionId,
                createIdempotencyKey: createIdempotencyKey,
                deviceId: deviceId,
                serverExchangeId: serverExchangeId,
                exchangeNumber: exchangeNumber,
                lastKnownStatus: lastKnownStatus,
                operatorEmployeeNumber: operatorEmployeeNumber,
                operatorName: operatorName,
                createdAt: createdAt,
                updatedAt: updatedAt,
                serverSnapshot: serverSnapshot,
                confirmationStatus: confirmationStatus,
                closedAt: closedAt,
                syncConfirmedAt: syncConfirmedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$LocalExchangeTable, LocalExchangeRow>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $LocalExchangeTable,
                    LocalExchangeRow
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalExchangeTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalExchangeTable,
      LocalExchangeRow,
      $$LocalExchangeTableFilterComposer,
      $$LocalExchangeTableOrderingComposer,
      $$LocalExchangeTableAnnotationComposer,
      $$LocalExchangeTableCreateCompanionBuilder,
      $$LocalExchangeTableUpdateCompanionBuilder,
      (
        LocalExchangeRow,
        BaseReferences<_$AppDatabase, $LocalExchangeTable, LocalExchangeRow>,
      ),
      LocalExchangeRow,
      PrefetchHooks Function()
    >;
typedef $$LocalExchangeEvidenceTableCreateCompanionBuilder =
    LocalExchangeEvidenceCompanion Function({
      required String id,
      required String clientTransactionId,
      required String evidenceType,
      required String filePath,
      required String mimeType,
      required int byteSize,
      required DateTime capturedAt,
      required String idempotencyKey,
      required String uploadStatus,
      Value<int> rowid,
    });
typedef $$LocalExchangeEvidenceTableUpdateCompanionBuilder =
    LocalExchangeEvidenceCompanion Function({
      Value<String> id,
      Value<String> clientTransactionId,
      Value<String> evidenceType,
      Value<String> filePath,
      Value<String> mimeType,
      Value<int> byteSize,
      Value<DateTime> capturedAt,
      Value<String> idempotencyKey,
      Value<String> uploadStatus,
      Value<int> rowid,
    });

class $$LocalExchangeEvidenceTableFilterComposer
    extends Composer<_$AppDatabase, $LocalExchangeEvidenceTable> {
  $$LocalExchangeEvidenceTableFilterComposer({
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

  ColumnFilters<String> get clientTransactionId => $composableBuilder(
    column: $table.clientTransactionId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get evidenceType => $composableBuilder(
    column: $table.evidenceType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get filePath => $composableBuilder(
    column: $table.filePath,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get mimeType => $composableBuilder(
    column: $table.mimeType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get byteSize => $composableBuilder(
    column: $table.byteSize,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get capturedAt => $composableBuilder(
    column: $table.capturedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get idempotencyKey => $composableBuilder(
    column: $table.idempotencyKey,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get uploadStatus => $composableBuilder(
    column: $table.uploadStatus,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalExchangeEvidenceTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalExchangeEvidenceTable> {
  $$LocalExchangeEvidenceTableOrderingComposer({
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

  ColumnOrderings<String> get clientTransactionId => $composableBuilder(
    column: $table.clientTransactionId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get evidenceType => $composableBuilder(
    column: $table.evidenceType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get filePath => $composableBuilder(
    column: $table.filePath,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get mimeType => $composableBuilder(
    column: $table.mimeType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get byteSize => $composableBuilder(
    column: $table.byteSize,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get capturedAt => $composableBuilder(
    column: $table.capturedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get idempotencyKey => $composableBuilder(
    column: $table.idempotencyKey,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get uploadStatus => $composableBuilder(
    column: $table.uploadStatus,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalExchangeEvidenceTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalExchangeEvidenceTable> {
  $$LocalExchangeEvidenceTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get clientTransactionId => $composableBuilder(
    column: $table.clientTransactionId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get evidenceType => $composableBuilder(
    column: $table.evidenceType,
    builder: (column) => column,
  );

  GeneratedColumn<String> get filePath =>
      $composableBuilder(column: $table.filePath, builder: (column) => column);

  GeneratedColumn<String> get mimeType =>
      $composableBuilder(column: $table.mimeType, builder: (column) => column);

  GeneratedColumn<int> get byteSize =>
      $composableBuilder(column: $table.byteSize, builder: (column) => column);

  GeneratedColumn<DateTime> get capturedAt => $composableBuilder(
    column: $table.capturedAt,
    builder: (column) => column,
  );

  GeneratedColumn<String> get idempotencyKey => $composableBuilder(
    column: $table.idempotencyKey,
    builder: (column) => column,
  );

  GeneratedColumn<String> get uploadStatus => $composableBuilder(
    column: $table.uploadStatus,
    builder: (column) => column,
  );
}

class $$LocalExchangeEvidenceTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalExchangeEvidenceTable,
          LocalExchangeEvidenceRow,
          $$LocalExchangeEvidenceTableFilterComposer,
          $$LocalExchangeEvidenceTableOrderingComposer,
          $$LocalExchangeEvidenceTableAnnotationComposer,
          $$LocalExchangeEvidenceTableCreateCompanionBuilder,
          $$LocalExchangeEvidenceTableUpdateCompanionBuilder,
          (
            LocalExchangeEvidenceRow,
            BaseReferences<
              _$AppDatabase,
              $LocalExchangeEvidenceTable,
              LocalExchangeEvidenceRow
            >,
          ),
          LocalExchangeEvidenceRow,
          PrefetchHooks Function()
        > {
  $$LocalExchangeEvidenceTableTableManager(
    _$AppDatabase db,
    $LocalExchangeEvidenceTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalExchangeEvidenceTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              $$LocalExchangeEvidenceTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$LocalExchangeEvidenceTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> clientTransactionId = const Value.absent(),
                Value<String> evidenceType = const Value.absent(),
                Value<String> filePath = const Value.absent(),
                Value<String> mimeType = const Value.absent(),
                Value<int> byteSize = const Value.absent(),
                Value<DateTime> capturedAt = const Value.absent(),
                Value<String> idempotencyKey = const Value.absent(),
                Value<String> uploadStatus = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalExchangeEvidenceCompanion(
                id: id,
                clientTransactionId: clientTransactionId,
                evidenceType: evidenceType,
                filePath: filePath,
                mimeType: mimeType,
                byteSize: byteSize,
                capturedAt: capturedAt,
                idempotencyKey: idempotencyKey,
                uploadStatus: uploadStatus,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String clientTransactionId,
                required String evidenceType,
                required String filePath,
                required String mimeType,
                required int byteSize,
                required DateTime capturedAt,
                required String idempotencyKey,
                required String uploadStatus,
                Value<int> rowid = const Value.absent(),
              }) => LocalExchangeEvidenceCompanion.insert(
                id: id,
                clientTransactionId: clientTransactionId,
                evidenceType: evidenceType,
                filePath: filePath,
                mimeType: mimeType,
                byteSize: byteSize,
                capturedAt: capturedAt,
                idempotencyKey: idempotencyKey,
                uploadStatus: uploadStatus,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<
                    $LocalExchangeEvidenceTable,
                    LocalExchangeEvidenceRow
                  >(table),
                  BaseReferences<
                    _$AppDatabase,
                    $LocalExchangeEvidenceTable,
                    LocalExchangeEvidenceRow
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalExchangeEvidenceTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalExchangeEvidenceTable,
      LocalExchangeEvidenceRow,
      $$LocalExchangeEvidenceTableFilterComposer,
      $$LocalExchangeEvidenceTableOrderingComposer,
      $$LocalExchangeEvidenceTableAnnotationComposer,
      $$LocalExchangeEvidenceTableCreateCompanionBuilder,
      $$LocalExchangeEvidenceTableUpdateCompanionBuilder,
      (
        LocalExchangeEvidenceRow,
        BaseReferences<
          _$AppDatabase,
          $LocalExchangeEvidenceTable,
          LocalExchangeEvidenceRow
        >,
      ),
      LocalExchangeEvidenceRow,
      PrefetchHooks Function()
    >;
typedef $$LocalSyncQueueTableCreateCompanionBuilder =
    LocalSyncQueueCompanion Function({
      Value<int> sequence,
      required String commandId,
      required String clientTransactionId,
      required String commandType,
      Value<String> payload,
      required DateTime occurredAt,
      required String status,
      Value<int> attemptCount,
      Value<DateTime?> nextAttemptAt,
      Value<String?> lastResult,
      Value<String?> lastErrorCode,
      Value<String?> lastErrorMessage,
      Value<String?> lastErrorContext,
      required DateTime createdAt,
      required DateTime updatedAt,
    });
typedef $$LocalSyncQueueTableUpdateCompanionBuilder =
    LocalSyncQueueCompanion Function({
      Value<int> sequence,
      Value<String> commandId,
      Value<String> clientTransactionId,
      Value<String> commandType,
      Value<String> payload,
      Value<DateTime> occurredAt,
      Value<String> status,
      Value<int> attemptCount,
      Value<DateTime?> nextAttemptAt,
      Value<String?> lastResult,
      Value<String?> lastErrorCode,
      Value<String?> lastErrorMessage,
      Value<String?> lastErrorContext,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
    });

class $$LocalSyncQueueTableFilterComposer
    extends Composer<_$AppDatabase, $LocalSyncQueueTable> {
  $$LocalSyncQueueTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get sequence => $composableBuilder(
    column: $table.sequence,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get commandId => $composableBuilder(
    column: $table.commandId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get clientTransactionId => $composableBuilder(
    column: $table.clientTransactionId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get commandType => $composableBuilder(
    column: $table.commandType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get occurredAt => $composableBuilder(
    column: $table.occurredAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get attemptCount => $composableBuilder(
    column: $table.attemptCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get nextAttemptAt => $composableBuilder(
    column: $table.nextAttemptAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get lastResult => $composableBuilder(
    column: $table.lastResult,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get lastErrorCode => $composableBuilder(
    column: $table.lastErrorCode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get lastErrorMessage => $composableBuilder(
    column: $table.lastErrorMessage,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get lastErrorContext => $composableBuilder(
    column: $table.lastErrorContext,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalSyncQueueTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalSyncQueueTable> {
  $$LocalSyncQueueTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get sequence => $composableBuilder(
    column: $table.sequence,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get commandId => $composableBuilder(
    column: $table.commandId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get clientTransactionId => $composableBuilder(
    column: $table.clientTransactionId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get commandType => $composableBuilder(
    column: $table.commandType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get occurredAt => $composableBuilder(
    column: $table.occurredAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get attemptCount => $composableBuilder(
    column: $table.attemptCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get nextAttemptAt => $composableBuilder(
    column: $table.nextAttemptAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get lastResult => $composableBuilder(
    column: $table.lastResult,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get lastErrorCode => $composableBuilder(
    column: $table.lastErrorCode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get lastErrorMessage => $composableBuilder(
    column: $table.lastErrorMessage,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get lastErrorContext => $composableBuilder(
    column: $table.lastErrorContext,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalSyncQueueTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalSyncQueueTable> {
  $$LocalSyncQueueTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get sequence =>
      $composableBuilder(column: $table.sequence, builder: (column) => column);

  GeneratedColumn<String> get commandId =>
      $composableBuilder(column: $table.commandId, builder: (column) => column);

  GeneratedColumn<String> get clientTransactionId => $composableBuilder(
    column: $table.clientTransactionId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get commandType => $composableBuilder(
    column: $table.commandType,
    builder: (column) => column,
  );

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  GeneratedColumn<DateTime> get occurredAt => $composableBuilder(
    column: $table.occurredAt,
    builder: (column) => column,
  );

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<int> get attemptCount => $composableBuilder(
    column: $table.attemptCount,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get nextAttemptAt => $composableBuilder(
    column: $table.nextAttemptAt,
    builder: (column) => column,
  );

  GeneratedColumn<String> get lastResult => $composableBuilder(
    column: $table.lastResult,
    builder: (column) => column,
  );

  GeneratedColumn<String> get lastErrorCode => $composableBuilder(
    column: $table.lastErrorCode,
    builder: (column) => column,
  );

  GeneratedColumn<String> get lastErrorMessage => $composableBuilder(
    column: $table.lastErrorMessage,
    builder: (column) => column,
  );

  GeneratedColumn<String> get lastErrorContext => $composableBuilder(
    column: $table.lastErrorContext,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$LocalSyncQueueTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalSyncQueueTable,
          LocalSyncQueueRow,
          $$LocalSyncQueueTableFilterComposer,
          $$LocalSyncQueueTableOrderingComposer,
          $$LocalSyncQueueTableAnnotationComposer,
          $$LocalSyncQueueTableCreateCompanionBuilder,
          $$LocalSyncQueueTableUpdateCompanionBuilder,
          (
            LocalSyncQueueRow,
            BaseReferences<
              _$AppDatabase,
              $LocalSyncQueueTable,
              LocalSyncQueueRow
            >,
          ),
          LocalSyncQueueRow,
          PrefetchHooks Function()
        > {
  $$LocalSyncQueueTableTableManager(
    _$AppDatabase db,
    $LocalSyncQueueTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalSyncQueueTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalSyncQueueTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalSyncQueueTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> sequence = const Value.absent(),
                Value<String> commandId = const Value.absent(),
                Value<String> clientTransactionId = const Value.absent(),
                Value<String> commandType = const Value.absent(),
                Value<String> payload = const Value.absent(),
                Value<DateTime> occurredAt = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<int> attemptCount = const Value.absent(),
                Value<DateTime?> nextAttemptAt = const Value.absent(),
                Value<String?> lastResult = const Value.absent(),
                Value<String?> lastErrorCode = const Value.absent(),
                Value<String?> lastErrorMessage = const Value.absent(),
                Value<String?> lastErrorContext = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
              }) => LocalSyncQueueCompanion(
                sequence: sequence,
                commandId: commandId,
                clientTransactionId: clientTransactionId,
                commandType: commandType,
                payload: payload,
                occurredAt: occurredAt,
                status: status,
                attemptCount: attemptCount,
                nextAttemptAt: nextAttemptAt,
                lastResult: lastResult,
                lastErrorCode: lastErrorCode,
                lastErrorMessage: lastErrorMessage,
                lastErrorContext: lastErrorContext,
                createdAt: createdAt,
                updatedAt: updatedAt,
              ),
          createCompanionCallback:
              ({
                Value<int> sequence = const Value.absent(),
                required String commandId,
                required String clientTransactionId,
                required String commandType,
                Value<String> payload = const Value.absent(),
                required DateTime occurredAt,
                required String status,
                Value<int> attemptCount = const Value.absent(),
                Value<DateTime?> nextAttemptAt = const Value.absent(),
                Value<String?> lastResult = const Value.absent(),
                Value<String?> lastErrorCode = const Value.absent(),
                Value<String?> lastErrorMessage = const Value.absent(),
                Value<String?> lastErrorContext = const Value.absent(),
                required DateTime createdAt,
                required DateTime updatedAt,
              }) => LocalSyncQueueCompanion.insert(
                sequence: sequence,
                commandId: commandId,
                clientTransactionId: clientTransactionId,
                commandType: commandType,
                payload: payload,
                occurredAt: occurredAt,
                status: status,
                attemptCount: attemptCount,
                nextAttemptAt: nextAttemptAt,
                lastResult: lastResult,
                lastErrorCode: lastErrorCode,
                lastErrorMessage: lastErrorMessage,
                lastErrorContext: lastErrorContext,
                createdAt: createdAt,
                updatedAt: updatedAt,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$LocalSyncQueueTable, LocalSyncQueueRow>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $LocalSyncQueueTable,
                    LocalSyncQueueRow
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalSyncQueueTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalSyncQueueTable,
      LocalSyncQueueRow,
      $$LocalSyncQueueTableFilterComposer,
      $$LocalSyncQueueTableOrderingComposer,
      $$LocalSyncQueueTableAnnotationComposer,
      $$LocalSyncQueueTableCreateCompanionBuilder,
      $$LocalSyncQueueTableUpdateCompanionBuilder,
      (
        LocalSyncQueueRow,
        BaseReferences<_$AppDatabase, $LocalSyncQueueTable, LocalSyncQueueRow>,
      ),
      LocalSyncQueueRow,
      PrefetchHooks Function()
    >;
typedef $$LocalSyncStateTableCreateCompanionBuilder =
    LocalSyncStateCompanion Function({
      Value<int> slot,
      required String deviceId,
      Value<String?> cursor,
      Value<DateTime?> lastSyncAt,
    });
typedef $$LocalSyncStateTableUpdateCompanionBuilder =
    LocalSyncStateCompanion Function({
      Value<int> slot,
      Value<String> deviceId,
      Value<String?> cursor,
      Value<DateTime?> lastSyncAt,
    });

class $$LocalSyncStateTableFilterComposer
    extends Composer<_$AppDatabase, $LocalSyncStateTable> {
  $$LocalSyncStateTableFilterComposer({
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

  ColumnFilters<String> get cursor => $composableBuilder(
    column: $table.cursor,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastSyncAt => $composableBuilder(
    column: $table.lastSyncAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalSyncStateTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalSyncStateTable> {
  $$LocalSyncStateTableOrderingComposer({
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

  ColumnOrderings<String> get cursor => $composableBuilder(
    column: $table.cursor,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastSyncAt => $composableBuilder(
    column: $table.lastSyncAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalSyncStateTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalSyncStateTable> {
  $$LocalSyncStateTableAnnotationComposer({
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

  GeneratedColumn<String> get cursor =>
      $composableBuilder(column: $table.cursor, builder: (column) => column);

  GeneratedColumn<DateTime> get lastSyncAt => $composableBuilder(
    column: $table.lastSyncAt,
    builder: (column) => column,
  );
}

class $$LocalSyncStateTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalSyncStateTable,
          LocalSyncStateRow,
          $$LocalSyncStateTableFilterComposer,
          $$LocalSyncStateTableOrderingComposer,
          $$LocalSyncStateTableAnnotationComposer,
          $$LocalSyncStateTableCreateCompanionBuilder,
          $$LocalSyncStateTableUpdateCompanionBuilder,
          (
            LocalSyncStateRow,
            BaseReferences<
              _$AppDatabase,
              $LocalSyncStateTable,
              LocalSyncStateRow
            >,
          ),
          LocalSyncStateRow,
          PrefetchHooks Function()
        > {
  $$LocalSyncStateTableTableManager(
    _$AppDatabase db,
    $LocalSyncStateTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalSyncStateTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalSyncStateTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalSyncStateTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> slot = const Value.absent(),
                Value<String> deviceId = const Value.absent(),
                Value<String?> cursor = const Value.absent(),
                Value<DateTime?> lastSyncAt = const Value.absent(),
              }) => LocalSyncStateCompanion(
                slot: slot,
                deviceId: deviceId,
                cursor: cursor,
                lastSyncAt: lastSyncAt,
              ),
          createCompanionCallback:
              ({
                Value<int> slot = const Value.absent(),
                required String deviceId,
                Value<String?> cursor = const Value.absent(),
                Value<DateTime?> lastSyncAt = const Value.absent(),
              }) => LocalSyncStateCompanion.insert(
                slot: slot,
                deviceId: deviceId,
                cursor: cursor,
                lastSyncAt: lastSyncAt,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$LocalSyncStateTable, LocalSyncStateRow>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $LocalSyncStateTable,
                    LocalSyncStateRow
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalSyncStateTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalSyncStateTable,
      LocalSyncStateRow,
      $$LocalSyncStateTableFilterComposer,
      $$LocalSyncStateTableOrderingComposer,
      $$LocalSyncStateTableAnnotationComposer,
      $$LocalSyncStateTableCreateCompanionBuilder,
      $$LocalSyncStateTableUpdateCompanionBuilder,
      (
        LocalSyncStateRow,
        BaseReferences<_$AppDatabase, $LocalSyncStateTable, LocalSyncStateRow>,
      ),
      LocalSyncStateRow,
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
  $$LocalExchangeTableTableManager get localExchange =>
      $$LocalExchangeTableTableManager(_db, _db.localExchange);
  $$LocalExchangeEvidenceTableTableManager get localExchangeEvidence =>
      $$LocalExchangeEvidenceTableTableManager(_db, _db.localExchangeEvidence);
  $$LocalSyncQueueTableTableManager get localSyncQueue =>
      $$LocalSyncQueueTableTableManager(_db, _db.localSyncQueue);
  $$LocalSyncStateTableTableManager get localSyncState =>
      $$LocalSyncStateTableTableManager(_db, _db.localSyncState);
}
