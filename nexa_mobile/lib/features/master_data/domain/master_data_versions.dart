import 'package:nexa_mobile/features/master_data/domain/master_data.dart';

/// The three versioned collections of `GET /mobile/bootstrap` (Doc 15 §17).
enum MasterDataCollection {
  needleTypes('needleTypesVersion'),
  exchangeTypes('exchangeTypesVersion'),
  storageMappings('storageMappingsVersion');

  const MasterDataCollection(this.queryParameter);

  /// Query parameter that carries the version the tablet already holds.
  final String queryParameter;
}

/// Opaque version strings, one per collection (`masterDataVersions`).
final class MasterDataVersions {
  const MasterDataVersions([this._values = const {}]);

  final Map<MasterDataCollection, String> _values;

  String? of(MasterDataCollection collection) => _values[collection];

  bool get isEmpty => _values.isEmpty;

  /// Bootstrap query: only the versions actually held. A collection without a
  /// stored version is omitted, so the backend sends it in full.
  Map<String, String> toQuery() => {
    for (final entry in _values.entries) entry.key.queryParameter: entry.value,
  };
}

/// The master-data part of one bootstrap answer. A `null` list means
/// "unchanged since the version you sent — keep your cache".
final class MasterDataPayload {
  const MasterDataPayload({
    required this.versions,
    this.needleTypes,
    this.exchangeTypes,
    this.storageMappings,
  });

  final MasterDataVersions versions;
  final List<NeedleType>? needleTypes;
  final List<ExchangeType>? exchangeTypes;
  final List<StorageMapping>? storageMappings;

  bool isPresent(MasterDataCollection collection) => switch (collection) {
    MasterDataCollection.needleTypes => needleTypes != null,
    MasterDataCollection.exchangeTypes => exchangeTypes != null,
    MasterDataCollection.storageMappings => storageMappings != null,
  };
}

/// What to do with one cached collection after a bootstrap.
sealed class CollectionUpdate {
  const CollectionUpdate();
}

/// Full list received: replace every cached row and store [version].
final class ReplaceCollection extends CollectionUpdate {
  const ReplaceCollection(this.version);

  final String? version;
}

/// `null` for the version we sent: the cache is current, touch nothing.
final class KeepCollection extends CollectionUpdate {
  const KeepCollection();
}

/// `null` although we did not hold that version (inconsistent answer): keep
/// the rows for offline use but drop the stored version, so the next bootstrap
/// asks for the full collection instead of trusting a stale cache.
final class InvalidateCollectionVersion extends CollectionUpdate {
  const InvalidateCollectionVersion();
}

/// Decides, per collection, how a bootstrap answer updates the cache
/// (Doc 15 §17, Docs/12 §18: "a collection whose version is unchanged comes
/// back as null"). Pure, so the versioning rule is unit-tested on its own.
Map<MasterDataCollection, CollectionUpdate> planMasterDataUpdate({
  required MasterDataVersions sent,
  required MasterDataPayload received,
}) {
  return {
    for (final collection in MasterDataCollection.values)
      collection: _planOne(collection, sent, received),
  };
}

CollectionUpdate _planOne(
  MasterDataCollection collection,
  MasterDataVersions sent,
  MasterDataPayload received,
) {
  if (received.isPresent(collection)) {
    return ReplaceCollection(received.versions.of(collection));
  }
  final sentVersion = sent.of(collection);
  if (sentVersion != null && sentVersion == received.versions.of(collection)) {
    return const KeepCollection();
  }
  return const InvalidateCollectionVersion();
}
