// Gemini free tier: 15 requests/min. We cap at 12 to leave a buffer.
const MAX_REQUESTS_PER_MINUTE = 12;
const WINDOW_MS = 60_000;

const timestamps = [];

export async function withRateLimit(fn) {
  const now = Date.now();

  // Drop timestamps older than the rolling 1-minute window
  while (timestamps.length && now - timestamps[0] >= WINDOW_MS) {
    timestamps.shift();
  }

  if (timestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    const waitMs = WINDOW_MS - (now - timestamps[0]) + 50;
    console.log(`[RateLimit] Gemini free tier cap reached — waiting ${(waitMs / 1000).toFixed(1)}s`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  timestamps.push(Date.now());
  return fn();
}
