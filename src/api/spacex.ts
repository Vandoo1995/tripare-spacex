import { config } from '../config';
import { fetchJson } from './client';
import {
  launchApiSchema,
  launchpadApiSchema,
  parseCollection,
  payloadApiSchema,
  rocketApiSchema,
  toLaunch,
  toLaunchpad,
  toPayload,
  toRocket,
} from './schemas';
import type { Launch, Launchpad, Payload, Rocket } from '../domain/types';
import { logWarn } from '../logging/logger';

function url(path: string): string {
  return `${config.apiBase.replace(/\/$/, '')}${path}`;
}

const requestOptions = {
  timeoutMs: config.timeoutMs,
  retries: config.retries,
};

export async function fetchLaunches(): Promise<Launch[]> {
  const raw = await fetchJson<unknown>(url('/v5/launches'), requestOptions);
  const parsed = parseCollection(launchApiSchema, raw);
  if (parsed.skipped > 0) {
    logWarn('api', `Skipped ${parsed.skipped} invalid launches`);
  }
  return parsed.items.map(toLaunch);
}

export async function fetchLaunchpads(): Promise<Launchpad[]> {
  const raw = await fetchJson<unknown>(url('/v4/launchpads'), requestOptions);
  const parsed = parseCollection(launchpadApiSchema, raw);
  if (parsed.skipped > 0) {
    logWarn('api', `Skipped ${parsed.skipped} invalid launchpads`);
  }
  return parsed.items.map(toLaunchpad);
}

export async function fetchLaunchpadById(id: string): Promise<Launchpad> {
  const raw = await fetchJson<unknown>(url(`/v4/launchpads/${id}`), requestOptions);
  const parsed = launchpadApiSchema.parse(raw);
  return toLaunchpad(parsed);
}

export async function fetchRockets(): Promise<Rocket[]> {
  const raw = await fetchJson<unknown>(url('/v4/rockets'), requestOptions);
  const parsed = parseCollection(rocketApiSchema, raw);
  return parsed.items.map(toRocket);
}

export async function fetchPayloads(): Promise<Payload[]> {
  const raw = await fetchJson<unknown>(url('/v4/payloads'), requestOptions);
  const parsed = parseCollection(payloadApiSchema, raw);
  return parsed.items.map(toPayload);
}
