function numberEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  apiBase: process.env.EXPO_PUBLIC_SPACEX_API_BASE ?? 'https://api.spacexdata.com',
  timeoutMs: numberEnv(process.env.EXPO_PUBLIC_SYNC_TIMEOUT_MS, 20_000),
  retries: numberEnv(process.env.EXPO_PUBLIC_SYNC_RETRIES, 3),
} as const;
