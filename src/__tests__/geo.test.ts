import { formatDistance, haversineKm, isValidCoord, readCoord } from '../domain/geo';

describe('geo', () => {
  it('computes distance between nearby Florida pads', () => {
    const km = haversineKm(28.5619, -80.5774, 28.6081, -80.6041);
    expect(km).toBeGreaterThan(4);
    expect(km).toBeLessThan(8);
  });

  it('formats meters and kilometers', () => {
    expect(formatDistance(0.4)).toBe('400 m');
    expect(formatDistance(3.21)).toBe('3.2 km');
    expect(formatDistance(42.2)).toBe('42 km');
    expect(formatDistance(Number.NaN)).toBe('Unknown');
  });

  it('rejects incomplete coordinates', () => {
    expect(isValidCoord(null, 1)).toBe(false);
    expect(readCoord(28.5, -80.6)).toEqual({ latitude: 28.5, longitude: -80.6 });
  });
});
