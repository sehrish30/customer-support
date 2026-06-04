// Groq free tier: 30 requests/min. We cap at 25 to leave a buffer.
const MAX_REQUESTS_PER_MINUTE = 25;
const WINDOW_MS = 60_000;

const timestamps: number[] = [];

export async function withRateLimit<T>(fn: () => T): Promise<Awaited<T>> {
  const now = Date.now();

  while (timestamps.length > 0 && now - (timestamps[0] as number) >= WINDOW_MS) {
    timestamps.shift();
  }

  if (timestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    const oldestTimestamp = timestamps[0] as number;
    const waitMs = WINDOW_MS - (now - oldestTimestamp) + 50;
    console.log(`[RateLimit] Gemini free tier cap reached — waiting ${(waitMs / 1000).toFixed(1)}s`);
    await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
  }

  timestamps.push(Date.now());
  return fn() as Awaited<T>;
}
