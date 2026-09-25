import 'package:flutter/material.dart';

/// A small colored dot used to indicate an at-a-glance status (e.g. sync
/// status in the Home header). Purely presentational — the caller decides
/// the color and label; pair it with a text label, never color alone
/// (Doc 07 §44, Doc 17 §36).
class StatusDot extends StatelessWidget {
  const StatusDot({super.key, required this.color, this.size = 8});

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}
