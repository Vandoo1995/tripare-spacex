import { bundledCatalog } from '../api/seedCatalog';

describe('bundled catalog', () => {
  it('provides 1000+ launches with pads and rockets for API outages', () => {
    const catalog = bundledCatalog();
    expect(catalog.launches.length).toBeGreaterThanOrEqual(1000);
    expect(catalog.launchpads.length).toBeGreaterThan(0);
    expect(catalog.rockets.some((rocket) => rocket.name === 'Falcon 9')).toBe(true);
  });
});
