export function formatDate(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return 'No expiration';
  return new Intl.DateTimeFormat(undefined, options).format(new Date(value));
}
export function isExpired(value) { return Boolean(value && new Date(value) <= new Date()); }
export function shortenText(value, max = 52) { return value?.length > max ? `${value.slice(0, max - 1)}…` : value; }
export async function copyText(value) { await navigator.clipboard.writeText(value); }
