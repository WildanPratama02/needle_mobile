/**
 * The history lists take `dateFrom`/`dateTo` as **inclusive ISO bounds on
 * `createdAt`** (spec "API contract"). A date input yields a bare
 * `yyyy-MM-dd`, which the backend would read as midnight UTC — so "to 15 Sep"
 * would silently drop everything created on the 15th. This widens a picked day
 * to the user's local start/end of day instead.
 *
 * "" (no date picked) stays `undefined`, i.e. the param is omitted.
 */
export function toDateBound(date: string, edge: "start" | "end"): string | undefined {
  if (!date) return undefined;
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return undefined;

  const bound =
    edge === "start"
      ? new Date(year, month - 1, day, 0, 0, 0, 0)
      : new Date(year, month - 1, day, 23, 59, 59, 999);
  return bound.toISOString();
}
