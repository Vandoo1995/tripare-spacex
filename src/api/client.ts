import { retryDelayMs, sleep } from '../domain/backoff';

export class HttpError extends Error {
  status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export type FetchJsonOptions = {
  timeoutMs?: number;
  retries?: number;
  fetchImpl?: typeof fetch;
  delayFn?: (attempt: number) => number;
};

const inflight = new Map<string, Promise<unknown>>();

export function clearInflight(): void {
  inflight.clear();
}

async function fetchOnce(
  url: string,
  timeoutMs: number,
  fetchImpl: typeof fetch,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { signal: controller.signal });
    if (!response.ok) {
      throw new HttpError(`Request failed (${response.status})`, response.status);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new HttpError(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function shouldRetry(error: unknown): boolean {
  if (!(error instanceof HttpError) || error.status == null) return true;
  return [408, 429, 500, 502, 503, 504].includes(error.status);
}

async function fetchWithRetry(url: string, options: FetchJsonOptions): Promise<unknown> {
  const timeoutMs = options.timeoutMs ?? 20_000;
  const retries = options.retries ?? 3;
  const fetchImpl = options.fetchImpl ?? fetch;
  const delayFn = options.delayFn ?? ((attempt: number) => retryDelayMs(attempt, { jitterRatio: 0.2 }));

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchOnce(url, timeoutMs, fetchImpl);
    } catch (error) {
      lastError = error;
      if (attempt === retries || !shouldRetry(error)) break;
      await sleep(delayFn(attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new HttpError('Request failed');
}

export function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const existing = inflight.get(url);
  if (existing) {
    return existing as Promise<T>;
  }
  const promise = fetchWithRetry(url, options).finally(() => {
    inflight.delete(url);
  });
  inflight.set(url, promise);
  return promise as Promise<T>;
}
