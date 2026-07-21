import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Gracefully handle missing Upstash env vars so routes don't crash at import time.
// If the env vars aren't configured, rate limiting is skipped (all requests are allowed).
let rateLimit: Ratelimit | null = null

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    rateLimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(20, "10 s"),
      ephemeralCache: new Map(),
      analytics: true,
    })
  }
} catch {
  // Silently fall through — rate limiting will be disabled
}

/**
 * Safe wrapper: returns { success: true } if rate limiting is unavailable.
 */
export async function checkRateLimit(key: string): Promise<{ success: boolean }> {
  if (!rateLimit) return { success: true }
  try {
    return await rateLimit.limit(key)
  } catch {
    return { success: true }
  }
}
