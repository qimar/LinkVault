/**
 * LinkVault Rate Limiter Test Script
 * 
 * Tests each rate-limited endpoint by sending rapid requests
 * and verifying that the limiter kicks in (HTTP 429).
 * 
 * Usage: node test-rate-limit.mjs <your-vercel-url>
 * Example: node test-rate-limit.mjs https://link-vault-liard.vercel.app
 */

const BASE_URL = process.argv[2] || "http://localhost:3000"
const TOTAL_REQUESTS = 30  // Our limit is 20 per 10s, so 30 should trigger it
const CONCURRENCY = 5      // Fire 5 at a time

console.log(`\n🔒 LinkVault Rate Limiter Test`)
console.log(`   Target: ${BASE_URL}`)
console.log(`   Sending ${TOTAL_REQUESTS} requests per endpoint (limit is 20/10s)\n`)
console.log(`${"─".repeat(60)}\n`)

async function testEndpoint(name, url, method = "GET") {
  console.log(`⏳ Testing: ${name}`)
  console.log(`   ${method} ${url}\n`)

  let passed = 0
  let blocked = 0
  let errors = 0

  const sendRequest = async (i) => {
    try {
      const res = await fetch(url, {
        method,
        redirect: "manual", // Don't follow redirects (click endpoint redirects)
      })
      if (res.status === 429 || res.headers.has("X-RateLimit-Exceeded")) {
        blocked++
      } else {
        passed++
      }
      const isBlocked = res.status === 429 || res.headers.has("X-RateLimit-Exceeded")
      const status = isBlocked ? "🛑 BLOCKED (Rate Limited)" : `✅ OK (${res.status})`
      console.log(`   Request #${String(i + 1).padStart(2, "0")} → ${status}`)
    } catch (err) {
      errors++
      console.log(`   Request #${String(i + 1).padStart(2, "0")} → ❌ ERROR: ${err.message}`)
    }
  }

  // Send requests in batches
  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENCY) {
    const batch = []
    for (let j = 0; j < CONCURRENCY && i + j < TOTAL_REQUESTS; j++) {
      batch.push(sendRequest(i + j))
    }
    await Promise.all(batch)
  }

  console.log(`\n   📊 Results: ${passed} passed, ${blocked} blocked, ${errors} errors`)

  if (blocked > 0) {
    console.log(`   ✅ RATE LIMITER IS WORKING — blocked ${blocked} requests\n`)
  } else {
    console.log(`   ⚠️  NO REQUESTS WERE BLOCKED — rate limiter may not be active\n`)
  }

  console.log(`${"─".repeat(60)}\n`)
  return { name, passed, blocked, errors }
}

async function main() {
  const results = []

  // Test 1: Click endpoint (GET)
  results.push(await testEndpoint(
    "/api/click",
    `${BASE_URL}/api/click?link_id=test-id&url=https://example.com`
  ))

  // Wait 1 second between endpoint tests
  await new Promise(r => setTimeout(r, 1000))

  // Test 2: Resolve-image endpoint (GET)
  results.push(await testEndpoint(
    "/api/resolve-image",
    `${BASE_URL}/api/resolve-image?url=https://github.com`
  ))

  // Summary
  console.log(`\n${"═".repeat(60)}`)
  console.log(`📋 SUMMARY`)
  console.log(`${"═".repeat(60)}\n`)

  for (const r of results) {
    const status = r.blocked > 0 ? "✅ PROTECTED" : "⚠️  UNPROTECTED"
    console.log(`   ${status}  ${r.name} (${r.blocked}/${r.passed + r.blocked} blocked)`)
  }

  const allProtected = results.every(r => r.blocked > 0)
  console.log(`\n${allProtected
    ? "🎉 All endpoints are rate-limited! Your app is protected against spam."
    : "⚠️  Some endpoints are NOT rate-limited. Check your Upstash env vars on Vercel."
  }\n`)
}

main().catch(console.error)
