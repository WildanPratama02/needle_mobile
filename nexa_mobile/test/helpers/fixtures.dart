/// Backend payloads shaped exactly like `Backend/src` returns them (the
/// `data` part of the envelope).
library;

const deviceId = '3f1c2b7e-8a4d-4c1e-9b2a-6d5e4f3a2b1c';
const deviceCode = 'TAB-A-01';

Map<String, Object?> loginData({String accessToken = 'access-1'}) => {
  'accessToken': accessToken,
  'refreshToken': 'refresh-1',
  'expiresIn': 900,
  'user': {
    'id': 'user-1',
    'username': 'pic01',
    'name': 'Budi Santoso',
    'roles': ['PIC_TROLI'],
  },
};

Map<String, Object?> meData({List<String>? permissions}) => {
  'id': 'user-1',
  'username': 'pic01',
  'name': 'Budi Santoso',
  'roles': ['PIC_TROLI'],
  'permissions': permissions ?? ['MOBILE_OPERATE', 'EXCHANGE_CREATE'],
  'factoryIds': ['factory-1'],
  'locationIds': <String>[],
};

Map<String, Object?> bootstrapData({
  bool includeCollections = true,
  String status = 'ACTIVE',
}) => {
  'device': {
    'id': deviceId,
    'deviceCode': deviceCode,
    'deviceName': 'Tablet A-01',
    'status': status,
    'appVersion': '1.0.0',
    'lastSeenAt': null,
  },
  'factory': {
    'id': 'factory-1',
    'code': 'FAC-A',
    'name': 'Factory A',
    'timezone': 'Asia/Jakarta',
  },
  'trolley': {
    'id': 'trolley-1',
    'code': 'TROL-A-01',
    'name': 'Trolley A-01',
    'locationId': 'location-1',
  },
  'exchangeTypes': includeCollections
      ? [
          {
            'id': 'et-1',
            'code': 'BROKEN',
            'name': 'Broken',
            'requiresFragmentValidation': true,
          },
        ]
      : null,
  'needleTypes': includeCollections
      ? [
          {
            'id': 'nt-1',
            'code': 'DBX1-14',
            'name': 'DBx1 #14',
            'category': null,
            'unit': 'PCS',
            'minimumStock': '10.000',
          },
        ]
      : null,
  'storageMappings': includeCollections
      ? [
          {
            'id': 'sm-1',
            'exchangeTypeId': 'et-1',
            'storageLocationId': 'loc-used',
            'storageLocationCode': 'USED-A',
            'storageLocationName': 'Used Needle Box A',
          },
        ]
      : null,
  'masterDataVersions': {
    'needleTypes': 'nv1',
    'exchangeTypes': 'ev1',
    'storageMappings': 'sv1',
  },
  'serverTime': '2026-09-24T08:00:00.000Z',
  'syncCursor': 'cursor-1',
};

Map<String, Object?> heartbeatData({String status = 'ACTIVE'}) => {
  'deviceId': deviceId,
  'status': status,
  'lastSeenAt': '2026-09-24T08:00:01.000Z',
  'serverTime': '2026-09-24T08:00:01.000Z',
  'clockOffsetMs': 1000,
};
