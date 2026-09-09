export const usd = (value: number) =>
  `$${value.toFixed(2)}`;

export const pct = (value: number) => `${Math.round(value * 100)}%`;

export function formatCountdown(msRemaining: number) {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function timeAgo(at: number) {
  const mins = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (mins < 1) return "just now";
  if (mins === 1) return "1m ago";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  return hours === 1 ? "1h ago" : `${hours}h ago`;
}

export const shortAddress = (address: string) =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;
