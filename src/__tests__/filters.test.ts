import {
  activeFilterCount,
  applyFilters,
  buildGroupedRows,
  countsByLaunchpad,
  DEFAULT_FILTERS,
  matchesLaunch,
  offsetsFor,
  stickyHeaderIndices,
  statusOf,
} from '../domain/filters';
import type { Launch, LaunchFilters } from '../domain/types';

function launch(partial: Partial<Launch> & Pick<Launch, 'id' | 'name' | 'dateUnix'>): Launch {
  return {
    dateUtc: new Date(partial.dateUnix * 1000).toISOString(),
    success: true,
    upcoming: false,
    rocketId: 'falcon9',
    launchpadId: 'ksc',
    details: null,
    flightNumber: 1,
    payloadIds: [],
    patchSmall: null,
    patchLarge: null,
    flickr: [],
    webcast: null,
    youtubeId: null,
    wikipedia: null,
    article: null,
    failures: [],
    ...partial,
  };
}

const now = Date.UTC(2026, 8, 4) / 1000;
const NOW_MS = now * 1000;

const catalog: Launch[] = [
  launch({ id: '1', name: 'Starlink-1', dateUnix: now - 10 * 86400, success: true }),
  launch({ id: '2', name: 'CRS-10', dateUnix: now - 200 * 86400, success: false, rocketId: 'falcon-heavy' }),
  launch({ id: '3', name: 'Polaris', dateUnix: now + 20 * 86400, upcoming: true, success: null }),
];

describe('filters', () => {
  it('classifies launch status', () => {
    expect(statusOf(catalog[0]!)).toBe('success');
    expect(statusOf(catalog[1]!)).toBe('failure');
    expect(statusOf(catalog[2]!)).toBe('upcoming');
  });

  it('debounced-style search matches mission name case-insensitively', () => {
    const filters: LaunchFilters = { ...DEFAULT_FILTERS, search: 'star' };
    expect(applyFilters(catalog, filters, NOW_MS).map((l) => l.id)).toEqual(['1']);
  });

  it('filters last 30 days including near-future upcoming', () => {
    const filters: LaunchFilters = { ...DEFAULT_FILTERS, datePreset: 'last_30_days' };
    expect(applyFilters(catalog, filters, NOW_MS).map((l) => l.id)).toEqual(['3', '1']);
  });

  it('ANDs facets by default', () => {
    const filters: LaunchFilters = {
      ...DEFAULT_FILTERS,
      statuses: ['failure'],
      rocketIds: ['falcon9'],
      filterMode: 'AND',
    };
    expect(applyFilters(catalog, filters, NOW_MS)).toEqual([]);
  });

  it('ORs facets when filterMode is OR', () => {
    const filters: LaunchFilters = {
      ...DEFAULT_FILTERS,
      statuses: ['failure'],
      rocketIds: ['falcon9'],
      filterMode: 'OR',
    };
    expect(applyFilters(catalog, filters, NOW_MS).map((l) => l.id).sort()).toEqual(['1', '2', '3']);
  });

  it('sorts by name and groups by letter', () => {
    const rows = buildGroupedRows(applyFilters(catalog, { ...DEFAULT_FILTERS, sort: 'name_asc' }, NOW_MS), 'name_asc');
    expect(rows[0]).toMatchObject({ type: 'header', title: 'C' });
    expect(rows.some((row) => row.type === 'launch' && row.launchId === '2')).toBe(true);
  });

  it('counts active filters', () => {
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0);
    expect(activeFilterCount({ ...DEFAULT_FILTERS, datePreset: 'last_year', statuses: ['success'] })).toBe(2);
  });

  it('filters 1000 launches in well under a frame budget', () => {
    const lots = Array.from({ length: 1200 }, (_, index) =>
      launch({
        id: `l-${index}`,
        name: index % 7 === 0 ? `Starlink-${index}` : `Mission-${index}`,
        dateUnix: now - index * 86400,
        success: index % 5 !== 0,
        upcoming: index < 3,
      }),
    );
    const started = Date.now();
    const result = applyFilters(lots, { ...DEFAULT_FILTERS, search: 'star', statuses: ['success'] }, NOW_MS);
    expect(Date.now() - started).toBeLessThan(50);
    expect(result.length).toBeGreaterThan(0);
  });

  it('filters by launchpad, sorts oldest first, and builds offsets', () => {
    const filters: LaunchFilters = {
      ...DEFAULT_FILTERS,
      launchpadIds: ['ksc'],
      sort: 'date_asc',
    };
    const result = applyFilters(catalog, filters, NOW_MS);
    expect(result.map((l) => l.id)).toEqual(['2', '1', '3']);
    const rows = buildGroupedRows(result, 'date_asc');
    expect(stickyHeaderIndices(rows)[0]).toBe(0);
    expect(offsetsFor(rows)[0]).toBe(0);
    expect(countsByLaunchpad(result).ksc).toBe(3);
    expect(matchesLaunch(catalog[0]!, DEFAULT_FILTERS, NOW_MS)).toBe(true);
  });

  it('sorts names descending', () => {
    const names = applyFilters(catalog, { ...DEFAULT_FILTERS, sort: 'name_desc' }, NOW_MS).map((l) => l.name);
    expect(names[0]).toBe('Starlink-1');
  });
});
