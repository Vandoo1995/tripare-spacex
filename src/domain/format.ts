export function timeAgo(fromMs: number, nowMs: number = Date.now()): string {
  const delta = Math.max(0, nowMs - fromMs);
  const seconds = Math.floor(delta / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

export function formatLaunchDate(dateUtc: string): string {
  const date = new Date(dateUtc);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}

export function lastSyncedLabel(lastSyncedAt: number | null, nowMs: number = Date.now()): string {
  if (!lastSyncedAt) return 'Never synced';
  return `Last synced ${timeAgo(lastSyncedAt, nowMs)}`;
}
