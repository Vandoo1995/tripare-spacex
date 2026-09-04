type Extra = Record<string, unknown>;

function normalize(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

export function logInfo(scope: string, message: string, extra?: Extra): void {
  if (extra) {
    console.log(`[${scope}] ${message}`, extra);
    return;
  }
  console.log(`[${scope}] ${message}`);
}

export function logWarn(scope: string, message: string, extra?: Extra): void {
  if (extra) {
    console.warn(`[${scope}] ${message}`, extra);
    return;
  }
  console.warn(`[${scope}] ${message}`);
}

export function logError(scope: string, error: unknown, extra?: Extra): void {
  const normalized = normalize(error);
  console.error(`[${scope}] ${normalized.message}`, { ...extra, stack: normalized.stack });
}

export function toUserMessage(error: unknown): string {
  if (error instanceof Error && /525/.test(error.message)) {
    return 'SpaceX API is down (Cloudflare 525). Showing bundled catalog.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
}
