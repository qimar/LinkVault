import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"

export async function GET() {
  const url = process.env.UPSTASH_REDIS_REST_URL || ""
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || ""

  // Mask token for security
  const maskedToken = token.length > 10 ? `${token.slice(0, 5)}...${token.slice(-5)}` : "MISSING or TOO SHORT"

  const diagnostics: any = {
    envVarsFound: {
      url: url, // Show exact URL string to check for quotes
      urlLength: url.length,
      urlHasQuotes: url.startsWith('"') || url.endsWith('"'),
      token: maskedToken,
      tokenLength: token.length,
    },
    redisInit: "pending",
    pingTest: "pending",
    rateLimitTest: "pending",
    errors: []
  }

  if (!url || !token) {
    diagnostics.errors.push("Missing Upstash URL or Token in environment")
    return NextResponse.json(diagnostics)
  }

  let redis
  try {
    redis = new Redis({ url, token })
    diagnostics.redisInit = "success"
  } catch (e: any) {
    diagnostics.redisInit = "failed"
    diagnostics.errors.push(`Redis Init Error: ${e.message}`)
    return NextResponse.json(diagnostics)
  }

  try {
    const ping = await redis.ping()
    diagnostics.pingTest = `success (${ping})`
  } catch (e: any) {
    diagnostics.pingTest = "failed"
    diagnostics.errors.push(`Redis Ping Error: ${e.message}`)
  }

  try {
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "10 s"),
      ephemeralCache: new Map(),
      analytics: true,
    })
    const res = await ratelimit.limit("debug_test")
    diagnostics.rateLimitTest = `success (remaining: ${res.remaining})`
  } catch (e: any) {
    diagnostics.rateLimitTest = "failed"
    diagnostics.errors.push(`Ratelimit Test Error: ${e.message}`)
  }

  return NextResponse.json(diagnostics)
}
