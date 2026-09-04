import type { Launch, Launchpad, Payload, Rocket } from '../domain/types';

const FALCON_1 = '5e9d0d95eda69973a809d1ec';
const FALCON_9 = '5e9d0d95eda69973a809d1ed';
const FALCON_HEAVY = '5e9d0d95eda69974db09d1ed';
const STARSHIP = '5e9d0d96eda699382d09d1ee';

const CCSFS = '5e9e4501f509094ba4566f84';
const KSC = '5e9e4502f509094188566f88';
const VAFB = '5e9e4502f509092b78566f87';
const KWAJ = '5e9e4502f5090995de566f86';
const STLS = '5e9e4502f509094188566f8d';

export const BUNDLED_ROCKETS: Rocket[] = [
  { id: FALCON_1, name: 'Falcon 1', type: 'rocket' },
  { id: FALCON_9, name: 'Falcon 9', type: 'rocket' },
  { id: FALCON_HEAVY, name: 'Falcon Heavy', type: 'rocket' },
  { id: STARSHIP, name: 'Starship', type: 'rocket' },
];

export const BUNDLED_LAUNCHPADS: Launchpad[] = [
  {
    id: KWAJ,
    name: 'Kwajalein Atoll',
    fullName: 'Kwajalein Atoll Omelek Island',
    locality: 'Omelek Island',
    region: 'Marshall Islands',
    latitude: 9.0477206,
    longitude: 167.7431292,
    launchAttempts: 5,
    launchSuccesses: 2,
    status: 'retired',
    details: 'SpaceX’s first launch site.',
    imageUrl: null,
  },
  {
    id: CCSFS,
    name: 'CCSFS SLC 40',
    fullName: 'Cape Canaveral Space Force Station Space Launch Complex 40',
    locality: 'Cape Canaveral',
    region: 'Florida',
    latitude: 28.56194122,
    longitude: -80.57735684,
    launchAttempts: 140,
    launchSuccesses: 130,
    status: 'active',
    details: 'Primary Falcon 9 pad on the Cape.',
    imageUrl: null,
  },
  {
    id: KSC,
    name: 'KSC LC 39A',
    fullName: 'Kennedy Space Center Historic Launch Complex 39A',
    locality: 'Cape Canaveral',
    region: 'Florida',
    latitude: 28.6080585,
    longitude: -80.6039558,
    launchAttempts: 50,
    launchSuccesses: 48,
    status: 'active',
    details: 'Crew, Heavy, and Starship pad at Kennedy.',
    imageUrl: null,
  },
  {
    id: VAFB,
    name: 'VAFB SLC 4E',
    fullName: 'Vandenberg Space Force Base Space Launch Complex 4E',
    locality: 'Vandenberg Space Force Base',
    region: 'California',
    latitude: 34.632093,
    longitude: -120.610829,
    launchAttempts: 40,
    launchSuccesses: 38,
    status: 'active',
    details: 'West-coast polar missions.',
    imageUrl: null,
  },
  {
    id: STLS,
    name: 'Starbase',
    fullName: 'SpaceX Starbase Launch Site',
    locality: 'Boca Chica',
    region: 'Texas',
    latitude: 25.9972641,
    longitude: -97.1560845,
    launchAttempts: 10,
    launchSuccesses: 6,
    status: 'active',
    details: 'Starship orbital flight tests.',
    imageUrl: null,
  },
];

const PROGRAMS = [
  'Starlink',
  'CRS',
  'Crew',
  'Transporter',
  'NROL',
  'USSF',
  'GPS III',
  'DART',
  'Europa Clipper',
  'Pols',
];

function rocketAndPad(index: number): { rocketId: string; launchpadId: string } {
  if (index < 5) return { rocketId: FALCON_1, launchpadId: KWAJ };
  if (index % 47 === 0) return { rocketId: STARSHIP, launchpadId: STLS };
  if (index % 31 === 0) return { rocketId: FALCON_HEAVY, launchpadId: KSC };
  if (index % 7 === 0) return { rocketId: FALCON_9, launchpadId: VAFB };
  if (index % 3 === 0) return { rocketId: FALCON_9, launchpadId: KSC };
  return { rocketId: FALCON_9, launchpadId: CCSFS };
}

function missionName(index: number): string {
  const program = PROGRAMS[index % PROGRAMS.length] ?? 'Mission';
  return `${program}-${index + 1}`;
}

export function bundledCatalog(count = 1200): {
  launches: Launch[];
  launchpads: Launchpad[];
  rockets: Rocket[];
  payloads: Payload[];
} {
  const start = Date.UTC(2006, 2, 24) / 1000;
  const now = Math.floor(Date.now() / 1000);
  const launches: Launch[] = [];
  const payloads: Payload[] = [];

  for (let index = 0; index < count; index += 1) {
    const dateUnix = start + index * 5 * 86400;
    const upcoming = dateUnix > now;
    const failed = !upcoming && index % 17 === 0;
    const { rocketId, launchpadId } = rocketAndPad(index);
    const payloadId = `pl-${index + 1}`;
    payloads.push({
      id: payloadId,
      name: `${missionName(index)} payload`,
      type: 'Satellite',
      massKg: 200 + (index % 800),
    });
    launches.push({
      id: `bundled-${index + 1}`,
      name: missionName(index),
      dateUtc: new Date(dateUnix * 1000).toISOString(),
      dateUnix,
      success: upcoming ? null : !failed,
      upcoming,
      rocketId,
      launchpadId,
      details: upcoming
        ? 'Upcoming mission from the bundled catalog used when SpaceX API is unreachable.'
        : failed
          ? 'Engine anomaly during ascent. Bundled historical placeholder.'
          : 'Nominal flight. Bundled snapshot used while api.spacexdata.com returns HTTP 525.',
      flightNumber: index + 1,
      payloadIds: [payloadId],
      patchSmall: null,
      patchLarge: null,
      flickr: [],
      webcast: null,
      youtubeId: null,
      wikipedia: null,
      article: null,
      failures: failed ? [{ time: 72, altitude: 12, reason: 'engine-out' }] : [],
    });
  }

  return {
    launches,
    launchpads: BUNDLED_LAUNCHPADS,
    rockets: BUNDLED_ROCKETS,
    payloads,
  };
}
