import 'package:flutter/material.dart';
import 'package:nexa_mobile/features/exchange/presentation/widgets/needle_type_picker.dart';
import 'package:nexa_mobile/features/exchange/presentation/widgets/step_layout.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';

/// "Type Jarum" (Doc 17 §12): pick a card, then LANJUTKAN. The pick itself
/// is ephemeral UI state; only LANJUTKAN hands it to the controller.
class NeedleTypeGridStep extends StatefulWidget {
  const NeedleTypeGridStep({
    super.key,
    required this.title,
    required this.needleTypes,
    required this.onContinue,
    required this.busy,
    this.initial,
    this.onCancel,
  });

  final String title;
  final List<NeedleType> needleTypes;
  final NeedleType? initial;
  final ValueChanged<NeedleType> onContinue;
  final bool busy;
  final VoidCallback? onCancel;

  @override
  State<NeedleTypeGridStep> createState() => _NeedleTypeGridStepState();
}

class _NeedleTypeGridStepState extends State<NeedleTypeGridStep> {
  late NeedleType? _selected = widget.initial;

  @override
  Widget build(BuildContext context) {
    final selected = _selected;
    return StepLayout(
      title: widget.title,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          NeedleTypePicker(
            needleTypes: widget.needleTypes,
            selectedId: selected?.id,
            onSelected: (needle) => setState(() => _selected = needle),
          ),
          if (selected != null) ...[
            const SizedBox(height: 12),
            Text(
              '${AppStrings.needleSelected}: ${selected.code}',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ],
        ],
      ),
      primaryLabel: AppStrings.continueAction,
      onPrimary: selected == null ? null : () => widget.onContinue(selected),
      busy: widget.busy,
      onCancel: widget.onCancel,
    );
  }
}
