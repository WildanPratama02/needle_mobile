import 'package:flutter/material.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';

/// Search + large selectable cards, no tiny dropdown (Doc 17 §12). Reads the
/// cached master data only (active rows, Doc 15 §4).
class NeedleTypePicker extends StatefulWidget {
  const NeedleTypePicker({
    super.key,
    required this.needleTypes,
    required this.selectedId,
    required this.onSelected,
  });

  final List<NeedleType> needleTypes;
  final String? selectedId;
  final ValueChanged<NeedleType> onSelected;

  @override
  State<NeedleTypePicker> createState() => _NeedleTypePickerState();
}

class _NeedleTypePickerState extends State<NeedleTypePicker> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    if (widget.needleTypes.isEmpty) {
      return Text(
        AppStrings.needleCatalogEmpty,
        style: theme.textTheme.bodyLarge,
      );
    }
    final q = _query.trim().toLowerCase();
    final visible = q.isEmpty
        ? widget.needleTypes
        : widget.needleTypes
              .where(
                (n) =>
                    n.code.toLowerCase().contains(q) ||
                    n.name.toLowerCase().contains(q) ||
                    (n.category?.toLowerCase().contains(q) ?? false),
              )
              .toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        TextField(
          key: const Key('needle.search'),
          decoration: const InputDecoration(
            labelText: AppStrings.needleSearch,
            prefixIcon: Icon(Icons.search),
          ),
          onChanged: (value) => setState(() => _query = value),
        ),
        SizedBox(height: tokens.spacingMd),
        if (visible.isEmpty)
          Text(AppStrings.needleNoneFound, style: theme.textTheme.bodyLarge)
        else
          Wrap(
            spacing: tokens.spacingSm,
            runSpacing: tokens.spacingSm,
            children: [
              for (final needle in visible)
                _NeedleCard(
                  key: Key('needle.${needle.id}'),
                  needle: needle,
                  selected: needle.id == widget.selectedId,
                  onTap: () => widget.onSelected(needle),
                ),
            ],
          ),
      ],
    );
  }
}

class _NeedleCard extends StatelessWidget {
  const _NeedleCard({
    super.key,
    required this.needle,
    required this.selected,
    required this.onTap,
  });

  final NeedleType needle;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = context.tokens;
    final color = selected
        ? theme.colorScheme.primary
        : theme.colorScheme.outlineVariant;
    return Material(
      color: selected
          ? theme.colorScheme.primaryContainer
          : theme.colorScheme.surface,
      borderRadius: BorderRadius.circular(tokens.radius),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(tokens.radius),
        child: Container(
          width: 200,
          constraints: const BoxConstraints(minHeight: 72),
          padding: EdgeInsets.all(tokens.spacingSm),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(tokens.radius),
            border: Border.all(color: color, width: selected ? 3 : 1.5),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      needle.code,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      needle.name,
                      style: theme.textTheme.bodySmall,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              if (selected)
                Icon(Icons.check_circle, color: theme.colorScheme.primary),
            ],
          ),
        ),
      ),
    );
  }
}

/// "GANTI TYPE" on the new-needle screen.
Future<NeedleType?> showNeedleTypePickerDialog(
  BuildContext context, {
  required List<NeedleType> needleTypes,
  required String? selectedId,
}) => showDialog<NeedleType>(
  context: context,
  builder: (context) => AlertDialog(
    title: const Text(AppStrings.newNeedleLabel),
    scrollable: true,
    content: SizedBox(
      width: 700,
      child: NeedleTypePicker(
        needleTypes: needleTypes,
        selectedId: selectedId,
        onSelected: (needle) => Navigator.of(context).pop(needle),
      ),
    ),
    actions: [
      TextButton(
        onPressed: () => Navigator.of(context).pop(),
        child: const Text(AppStrings.cancel),
      ),
    ],
  ),
);
