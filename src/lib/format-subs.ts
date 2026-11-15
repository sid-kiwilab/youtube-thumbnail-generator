export function formatSubscribers(count: number | undefined): string {
  const n = count ?? 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M subs`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K subs`;
  if (n > 0) return `${n.toLocaleString()} subs`;
  return "Subs hidden";
}