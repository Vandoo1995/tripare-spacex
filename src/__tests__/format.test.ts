import { lastSyncedLabel, timeAgo, formatLaunchDate } from '../domain/format';

describe('format', () => {
  const now = Date.parse('2026-09-04T12:00:00.000Z');

  it('describes recent timestamps', () => {
    expect(timeAgo(now - 10_000, now)).toBe('just now');
    expect(timeAgo(now - 2 * 60 * 60 * 1000, now)).toBe('2 hours ago');
  });

  it('covers longer relative times and bad dates', () => {
    expect(timeAgo(now - 90 * 1000, now)).toBe('1 minute ago');
    expect(timeAgo(now - 3 * 24 * 60 * 60 * 1000, now)).toBe('3 days ago');
    expect(timeAgo(now - 60 * 24 * 60 * 60 * 1000, now)).toBe('2 months ago');
    expect(formatLaunchDate('not-a-date')).toBe('Unknown date');
    expect(formatLaunchDate('2024-06-01T12:00:00.000Z')).toContain('2024');
  });

  it('labels last sync', () => {
    expect(lastSyncedLabel(null, now)).toBe('Never synced');
    expect(lastSyncedLabel(now - 2 * 60 * 60 * 1000, now)).toBe('Last synced 2 hours ago');
  });
});
