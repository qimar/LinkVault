import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Create a new ratelimiter that allows 10 requests per 10 seconds.
// We use an ephemeral cache to avoid constant Redis roundtrips.
export const rateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "10 s"),
  ephemeralCache: new Map(),
  analytics: true,
})
