import { retryDelayMs } from '../domain/backoff';

describe('backoff', () => {
  it('grows exponentially without exceeding max', () => {
    const delays = [0, 1, 2, 3, 8].map((attempt) =>
      retryDelayMs(attempt, { baseMs: 400, maxMs: 3000, jitterRatio: 0 }),
    );
    expect(delays).toEqual([400, 800, 1600, 3000, 3000]);
  });

  it('applies jitter using the injected rng', () => {
    const delay = retryDelayMs(0, { baseMs: 1000, jitterRatio: 0.5, random: () => 1 });
    expect(delay).toBe(1500);
  });
});
