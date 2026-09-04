import type {
  DatePreset,
  FilterMode,
  Launch,
  LaunchFilters,
  LaunchStatus,
  SortKey,
} from './types';

export const DEFAULT_FILTERS: LaunchFilters = {
  search: '',
  datePreset: 'all_time',
  statuses: [],
  rocketIds: [],
  launchpadIds: [],
  sort: 'date_desc',
  filterMode: 'AND',
};

export const ROW_HEIGHT = 84;
export const HEADER_HEIGHT = 40;

export type ListRow =
  | { type: 'header'; id: string; title: string; length: number }
  | { type: 'launch'; id: string; launchId: string; length: number };

export function statusOf(launch: Launch): LaunchStatus {
  if (launch.upcoming) return 'upcoming';
  if (launch.success === true) return 'success';
  return 'failure';
}

export function inDateRange(
  dateUnix: number,
  preset: DatePreset,
  nowMs: number = Date.now(),
): boolean {
  if (preset === 'all_time') return true;
  const nowSec = Math.floor(nowMs / 1000);
  const windowSec = preset === 'last_30_days' ? 30 * 86400 : 365 * 86400;
  return dateUnix >= nowSec - windowSec && dateUnix <= nowSec + 30 * 86400;
}

export function matchesSearch(launch: Launch, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return launch.name.toLowerCase().includes(q);
}

function matchesStatus(launch: Launch, statuses: LaunchStatus[]): boolean {
  if (statuses.length === 0) return true;
  return statuses.includes(statusOf(launch));
}

function matchesRocket(launch: Launch, rocketIds: string[]): boolean {
  if (rocketIds.length === 0) return true;
  return launch.rocketId != null && rocketIds.includes(launch.rocketId);
}

function matchesPad(launch: Launch, launchpadIds: string[]): boolean {
  if (launchpadIds.length === 0) return true;
  return launch.launchpadId != null && launchpadIds.includes(launch.launchpadId);
}

function matchesDate(launch: Launch, preset: DatePreset, nowMs: number): boolean {
  return inDateRange(launch.dateUnix, preset, nowMs);
}

export function matchesLaunch(
  launch: Launch,
  filters: LaunchFilters,
  nowMs: number = Date.now(),
): boolean {
  if (!matchesSearch(launch, filters.search)) return false;

  const facets: boolean[] = [];
  if (filters.datePreset !== 'all_time') {
    facets.push(matchesDate(launch, filters.datePreset, nowMs));
  }
  if (filters.statuses.length > 0) {
    facets.push(matchesStatus(launch, filters.statuses));
  }
  if (filters.rocketIds.length > 0) {
    facets.push(matchesRocket(launch, filters.rocketIds));
  }
  if (filters.launchpadIds.length > 0) {
    facets.push(matchesPad(launch, filters.launchpadIds));
  }

  if (facets.length === 0) return true;
  return filters.filterMode === 'AND' ? facets.every(Boolean) : facets.some(Boolean);
}

export function sortLaunches(launches: Launch[], sort: SortKey): Launch[] {
  const copy = launches.slice();
  copy.sort((a, b) => {
    switch (sort) {
      case 'date_asc':
        return a.dateUnix - b.dateUnix;
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'date_desc':
      default:
        return b.dateUnix - a.dateUnix;
    }
  });
  return copy;
}

export function applyFilters(
  launches: Launch[],
  filters: LaunchFilters,
  nowMs: number = Date.now(),
): Launch[] {
  const matched = launches.filter((launch) => matchesLaunch(launch, filters, nowMs));
  return sortLaunches(matched, filters.sort);
}

function monthTitle(dateUnix: number): { key: string; title: string } {
  const date = new Date(dateUnix * 1000);
  const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  const title = date.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return { key, title };
}

function letterTitle(name: string): { key: string; title: string } {
  const letter = name.trim().charAt(0).toUpperCase() || '#';
  const key = /[A-Z]/.test(letter) ? letter : '#';
  return { key, title: key };
}

export function buildGroupedRows(launches: Launch[], sort: SortKey): ListRow[] {
  const rows: ListRow[] = [];
  let currentKey = '';
  const byLetter = sort === 'name_asc' || sort === 'name_desc';

  for (const launch of launches) {
    const group = byLetter ? letterTitle(launch.name) : monthTitle(launch.dateUnix);
    if (group.key !== currentKey) {
      currentKey = group.key;
      rows.push({
        type: 'header',
        id: `h-${group.key}`,
        title: group.title,
        length: HEADER_HEIGHT,
      });
    }
    rows.push({
      type: 'launch',
      id: launch.id,
      launchId: launch.id,
      length: ROW_HEIGHT,
    });
  }
  return rows;
}

export function stickyHeaderIndices(rows: ListRow[]): number[] {
  const indices: number[] = [];
  rows.forEach((row, index) => {
    if (row.type === 'header') indices.push(index);
  });
  return indices;
}

export function offsetsFor(rows: ListRow[]): number[] {
  const offsets: number[] = [];
  let acc = 0;
  for (const row of rows) {
    offsets.push(acc);
    acc += row.length;
  }
  return offsets;
}

export function activeFilterCount(filters: LaunchFilters): number {
  let count = 0;
  if (filters.datePreset !== 'all_time') count += 1;
  if (filters.statuses.length > 0) count += 1;
  if (filters.rocketIds.length > 0) count += 1;
  if (filters.launchpadIds.length > 0) count += 1;
  if (filters.sort !== 'date_desc') count += 1;
  if (filters.filterMode === 'OR') count += 1;
  return count;
}

export function countsByLaunchpad(launches: Launch[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const launch of launches) {
    if (!launch.launchpadId) continue;
    counts[launch.launchpadId] = (counts[launch.launchpadId] ?? 0) + 1;
  }
  return counts;
}
