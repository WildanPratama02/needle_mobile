import 'package:flutter/material.dart';

/// A small rounded-rect badge with a background color and text — used for
/// the trolley-ID badge in the Home header, reusable anywhere else a compact
/// tagged label is needed.
///
/// The reference design's badge (`TROLI A-01`) is a tight rounded
/// rectangle, not a full stadium/capsule pill — [borderRadius] defaults to
/// that shape; pass a larger value for an actual capsule if a future usage
/// needs one.
class PillBadge extends StatelessWidget {
  const PillBadge({
    super.key,
    required this.label,
    required this.backgroundColor,
    this.textColor = Colors.white,
    this.borderRadius = const BorderRadius.all(Radius.circular(8)),
  });

  final String label;
  final Color backgroundColor;
  final Color textColor;
  final BorderRadius borderRadius;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: borderRadius,
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: textColor,
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
      ),
    );
  }
}
