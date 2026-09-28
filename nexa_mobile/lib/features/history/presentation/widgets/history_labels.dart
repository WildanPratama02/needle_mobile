import 'package:nexa_mobile/features/history/data/history_providers.dart';
import 'package:nexa_mobile/features/history/domain/history_entry.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';

/// Display text of a history row's cells, from the entry plus the cached
/// catalogue. Pure, so list, detail and tests agree.
typedef TwoLine = ({String title, String? subtitle});

/// Needle name + code from the bootstrap cache; the id when the type is no
/// longer cached (deactivated since); "—" when not chosen yet.
TwoLine needleLabel(HistoryCatalog catalog, String? needleTypeId) {
  if (needleTypeId == null) {
    return (title: AppStrings.historyNoValue, subtitle: null);
  }
  final needle = catalog.needle(needleTypeId);
  if (needle == null) return (title: needleTypeId, subtitle: null);
  return (title: needle.name, subtitle: needle.code);
}

/// The row's own `exchangeTypeName`/`Code` (sent on every exchange), else
/// the cached type, else "—".
String exchangeTypeLabel(HistoryCatalog catalog, HistoryEntry entry) =>
    entry.exchangeTypeName ??
    entry.exchangeTypeCode ??
    catalog.exchangeType(entry.exchangeTypeId)?.name ??
    AppStrings.historyNoValue;

/// Employee number + name (MG-4). A backend without MG-4 sends neither: an
/// assigned operator then reads "(nama belum tersedia)", never a bare id.
TwoLine operatorLabel(HistoryEntry entry) {
  final number = entry.operatorEmployeeNumber;
  final name = entry.operatorName;
  if (number == null && name == null) {
    return (
      title: entry.hasOperator
          ? AppStrings.historyOperatorUnnamed
          : AppStrings.historyNoOperator,
      subtitle: null,
    );
  }
  return (title: name ?? number!, subtitle: name == null ? null : number);
}
