import { parseCollection, launchApiSchema, toLaunch, toLaunchpad, toPayload, toRocket } from '../api/schemas';

describe('spacex schemas', () => {
  const valid = {
    id: 'abc',
    name: 'FalconSat',
    date_utc: '2006-03-24T22:30:00.000Z',
    date_unix: 1143239400,
    success: false,
    upcoming: false,
    rocket: 'falcon1',
    launchpad: 'kwaj',
    details: 'Engine failure',
    flight_number: 1,
    payloads: ['sat-1'],
    failures: [{ time: 33, altitude: null, reason: 'merlin-1a' }],
    links: {
      patch: { small: 'https://img/small.png', large: null },
      flickr: { original: [] },
      webcast: null,
      youtube_id: null,
      wikipedia: 'https://en.wikipedia.org',
      article: null,
    },
    extra_unknown: true,
  };

  it('accepts a SpaceX launch and maps to the app model', () => {
    const parsed = launchApiSchema.parse(valid);
    const launch = toLaunch(parsed);
    expect(launch.name).toBe('FalconSat');
    expect(launch.success).toBe(false);
    expect(launch.patchSmall).toBe('https://img/small.png');
    expect(launch.failures[0]?.reason).toBe('merlin-1a');
  });

  it('skips invalid rows instead of failing the catalog', () => {
    const result = parseCollection(launchApiSchema, [valid, { nope: true }, 'bad']);
    expect(result.items).toHaveLength(1);
    expect(result.skipped).toBe(2);
  });

  it('rejects a non-array payload', () => {
    expect(() => parseCollection(launchApiSchema, { docs: [] })).toThrow('API response was not an array');
  });

  it('maps launchpads, rockets, and payloads', () => {
    expect(
      toLaunchpad({
        id: 'p1',
        name: 'LC-39A',
        full_name: 'Kennedy Space Center LC-39A',
        locality: 'Cape Canaveral',
        region: 'Florida',
        latitude: 28.6,
        longitude: -80.6,
        launch_attempts: 10,
        launch_successes: 9,
        status: 'active',
        details: 'Historic pad',
        images: { large: ['https://img/pad.png'] },
      }).imageUrl,
    ).toBe('https://img/pad.png');
    expect(toRocket({ id: 'r1', name: 'Falcon 9', type: 'rocket' }).name).toBe('Falcon 9');
    expect(toPayload({ id: 'pl1', name: 'Starlink', type: 'Satellite', mass_kg: 800 }).massKg).toBe(800);
  });
});
