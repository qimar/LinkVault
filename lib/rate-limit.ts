import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

let rateLimit: Ratelimit | null = null
let initialized = false

function getRateLimiter() {
  if (initialized) return rateLimit
  initialized = true

  try {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (url && token) {
      rateLimit = new Ratelimit({
        // Explicitly pass credentials instead of Redis.fromEnv() 
        // to ensure Next.js Edge runtime correctly bundles the env vars
        redis: new Redis({
          url: url,
          token: token,
        }),
        limiter: Ratelimit.slidingWindow(20, "10 s"),
        ephemeralCache: new Map(),
        analytics: true,
      })
    }
  } catch (error) {
    console.warn("Failed to initialize Upstash Rate Limiter:", error)
  }

  return rateLimit
}

/**
 * Safe wrapper: returns { success: true } if rate limiting is unavailable.
 */
export async function checkRateLimit(key: string): Promise<{ success: boolean }> {
  const limiter = getRateLimiter()
  if (!limiter) return { success: true }
  
  try {
    return await limiter.limit(key)
  } catch (error) {
    console.error("Rate limit check failed:", error)
    return { success: true }
  }
}
