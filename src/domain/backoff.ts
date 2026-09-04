export type BackoffOptions = {
  baseMs?: number;
  maxMs?: number;
  jitterRatio?: number;
  random?: () => number;
};

export function retryDelayMs(attempt: number, options: BackoffOptions = {}): number {
  const baseMs = options.baseMs ?? 400;
  const maxMs = options.maxMs ?? 8000;
  const jitterRatio = options.jitterRatio ?? 0.25;
  const random = options.random ?? Math.random;
  const exp = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt));
  const jitter = jitterRatio > 0 ? random() * jitterRatio * exp : 0;
  return Math.round(exp + jitter);
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
