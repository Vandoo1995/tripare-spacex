import { clearInflight, fetchJson, HttpError } from '../api/client';

describe('http client', () => {
  beforeEach(() => {
    clearInflight();
  });

  it('returns JSON and retries after a failure', async () => {
    const fetchImpl = jest
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      });

    const result = await fetchJson<{ ok: boolean }>('https://api.example/v5/launches', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      retries: 2,
      delayFn: () => 0,
    });
    expect(result).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('deduplicates in-flight requests', async () => {
    let resolveJson: ((value: unknown) => void) | undefined;
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        new Promise((resolve) => {
          resolveJson = resolve;
        }),
    });

    const a = fetchJson('https://api.example/same', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      retries: 0,
      timeoutMs: 1000,
    });
    const b = fetchJson('https://api.example/same', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      retries: 0,
      timeoutMs: 1000,
    });
    await Promise.resolve();
    await Promise.resolve();
    if (!resolveJson) {
      throw new Error('json() was never called');
    }
    resolveJson({ shared: true });
    expect(await Promise.all([a, b])).toEqual([{ shared: true }, { shared: true }]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('throws HttpError on non-2xx', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(
      fetchJson('https://api.example/fail', {
        fetchImpl: fetchImpl as unknown as typeof fetch,
        retries: 0,
      }),
    ).rejects.toBeInstanceOf(HttpError);
  });

  it('does not retry Cloudflare 525 SSL failures', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 525 });
    await expect(
      fetchJson('https://api.spacexdata.com/v5/launches', {
        fetchImpl: fetchImpl as unknown as typeof fetch,
        retries: 3,
        delayFn: () => 0,
      }),
    ).rejects.toMatchObject({ status: 525 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
