import { clusterPoints, densityColor, radiusKmForDelta } from '../domain/clustering';

describe('clustering', () => {
  const slc40 = { id: 'slc40', latitude: 28.5619, longitude: -80.5774, weight: 120 };
  const lc39a = { id: 'lc39a', latitude: 28.6081, longitude: -80.6041, weight: 80 };
  const kwaj = { id: 'kwaj', latitude: 9.0477, longitude: 167.7431, weight: 5 };

  it('keeps distant pads separate', () => {
    const result = clusterPoints([slc40, kwaj], 25);
    expect(result).toHaveLength(2);
    expect(result.every((item) => item.type === 'point')).toBe(true);
  });

  it('clusters nearby Florida pads', () => {
    const result = clusterPoints([slc40, lc39a, kwaj], 10);
    const clustered = result.filter((item) => item.type === 'cluster');
    const points = result.filter((item) => item.type === 'point');
    expect(clustered).toHaveLength(1);
    expect(points).toHaveLength(1);
    expect(clustered[0]?.weight).toBe(200);
    expect(points[0]?.id).toBe('kwaj');
  });

  it('maps density to color buckets', () => {
    expect(densityColor(0, 0)).toBe('#64748B');
    expect(densityColor(0, 100)).toBe('#64748B');
    expect(densityColor(10, 100)).toBe('#22C55E');
    expect(densityColor(50, 100)).toBe('#EAB308');
    expect(densityColor(90, 100)).toBe('#E11D48');
  });

  it('derives a sane radius from map delta', () => {
    expect(radiusKmForDelta(0)).toBe(25);
    expect(radiusKmForDelta(-1)).toBe(25);
    expect(radiusKmForDelta(0.5)).toBeGreaterThan(2);
    expect(radiusKmForDelta(20)).toBeLessThanOrEqual(400);
  });
});
