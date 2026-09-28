/// Fixed Indonesian-style date/time text for the tablet UI, in the tablet's
/// local time. Kept dependency-free (no `intl`) — the app shows numeric dates
/// only.
library;

String _two(int v) => v.toString().padLeft(2, '0');

/// `dd/MM/yyyy`.
String formatDate(DateTime at) {
  final l = at.toLocal();
  return '${_two(l.day)}/${_two(l.month)}/${l.year}';
}

/// `dd/MM`.
String formatShortDate(DateTime at) {
  final l = at.toLocal();
  return '${_two(l.day)}/${_two(l.month)}';
}

/// `HH:mm`.
String formatTime(DateTime at) {
  final l = at.toLocal();
  return '${_two(l.hour)}:${_two(l.minute)}';
}

/// `dd/MM/yyyy HH:mm`.
String formatDateTime(DateTime at) => '${formatDate(at)} ${formatTime(at)}';
