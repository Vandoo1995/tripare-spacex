import { z } from 'zod';
import type { Launch, Launchpad, Payload, Rocket } from '../domain/types';

export const launchApiSchema = z.object({
  id: z.string(),
  name: z.string(),
  date_utc: z.string(),
  date_unix: z.number(),
  success: z.boolean().nullable().optional(),
  upcoming: z.boolean(),
  rocket: z.string().nullable().optional(),
  launchpad: z.string().nullable().optional(),
  details: z.string().nullable().optional(),
  flight_number: z.number(),
  payloads: z.array(z.string()).optional(),
  failures: z
    .array(
      z.object({
        time: z.number().optional(),
        altitude: z.number().nullable().optional(),
        reason: z.string().optional(),
      }),
    )
    .optional(),
  links: z
    .object({
      patch: z
        .object({
          small: z.string().nullable().optional(),
          large: z.string().nullable().optional(),
        })
        .optional(),
      flickr: z
        .object({
          original: z.array(z.string()).optional(),
        })
        .optional(),
      webcast: z.string().nullable().optional(),
      youtube_id: z.string().nullable().optional(),
      wikipedia: z.string().nullable().optional(),
      article: z.string().nullable().optional(),
    })
    .optional(),
});

export const launchpadApiSchema = z.object({
  id: z.string(),
  name: z.string(),
  full_name: z.string(),
  locality: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  launch_attempts: z.number().optional(),
  launch_successes: z.number().optional(),
  status: z.string().nullable().optional(),
  details: z.string().nullable().optional(),
  images: z
    .object({
      large: z.array(z.string()).optional(),
    })
    .optional(),
});

export const rocketApiSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().nullable().optional(),
});

export const payloadApiSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().nullable().optional(),
  mass_kg: z.number().nullable().optional(),
});

export type LaunchApi = z.infer<typeof launchApiSchema>;
export type LaunchpadApi = z.infer<typeof launchpadApiSchema>;
export type RocketApi = z.infer<typeof rocketApiSchema>;
export type PayloadApi = z.infer<typeof payloadApiSchema>;

export function parseCollection<T>(
  schema: z.ZodType<T>,
  raw: unknown,
): { items: T[]; skipped: number } {
  if (!Array.isArray(raw)) {
    throw new Error('API response was not an array');
  }
  const items: T[] = [];
  let skipped = 0;
  for (const row of raw) {
    const result = schema.safeParse(row);
    if (result.success) {
      items.push(result.data);
    } else {
      skipped += 1;
    }
  }
  return { items, skipped };
}

export function toLaunch(api: LaunchApi): Launch {
  return {
    id: api.id,
    name: api.name,
    dateUtc: api.date_utc,
    dateUnix: api.date_unix,
    success: api.success ?? null,
    upcoming: api.upcoming,
    rocketId: api.rocket ?? null,
    launchpadId: api.launchpad ?? null,
    details: api.details ?? null,
    flightNumber: api.flight_number,
    payloadIds: api.payloads ?? [],
    patchSmall: api.links?.patch?.small ?? null,
    patchLarge: api.links?.patch?.large ?? null,
    flickr: api.links?.flickr?.original ?? [],
    webcast: api.links?.webcast ?? null,
    youtubeId: api.links?.youtube_id ?? null,
    wikipedia: api.links?.wikipedia ?? null,
    article: api.links?.article ?? null,
    failures: (api.failures ?? []).map((failure) => ({
      time: failure.time ?? null,
      altitude: failure.altitude ?? null,
      reason: failure.reason ?? null,
    })),
  };
}

export function toLaunchpad(api: LaunchpadApi): Launchpad {
  return {
    id: api.id,
    name: api.name,
    fullName: api.full_name,
    locality: api.locality ?? null,
    region: api.region ?? null,
    latitude: api.latitude ?? null,
    longitude: api.longitude ?? null,
    launchAttempts: api.launch_attempts ?? 0,
    launchSuccesses: api.launch_successes ?? 0,
    status: api.status ?? null,
    details: api.details ?? null,
    imageUrl: api.images?.large?.[0] ?? null,
  };
}

export function toRocket(api: RocketApi): Rocket {
  return {
    id: api.id,
    name: api.name,
    type: api.type ?? null,
  };
}

export function toPayload(api: PayloadApi): Payload {
  return {
    id: api.id,
    name: api.name,
    type: api.type ?? null,
    massKg: api.mass_kg ?? null,
  };
}
