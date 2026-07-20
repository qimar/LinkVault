import { NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

// Direct image extensions — return the URL as-is
const IMAGE_EXTS = /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)(\?.*)?$/i

// Block private IP ranges and localhost to prevent SSRF
function isSafeUrl(urlString: string) {
  try {
    const parsed = new URL(urlString)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false
    
    const hostname = parsed.hostname.toLowerCase()
    
    // Basic SSRF blocks (localhost, private IP ranges)
    if (
      hostname === "localhost" ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local") ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "169.254.169.254" || // AWS metadata
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  // Rate limiting by IP
  const ip = req.headers.get("x-forwarded-for") || "unknown"
  const { success } = await rateLimit.limit(`resolve-image_${ip}`)
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const url = req.nextUrl.searchParams.get("url")
  if (!url) return NextResponse.json({ error: "No URL provided" }, { status: 400 })

  if (!isSafeUrl(url)) {
    return NextResponse.json({ error: "Invalid or unsafe URL" }, { status: 400 })
  }

  // If it's already a direct image link, just pass it through
  try {
    const parsed = new URL(url)
    if (IMAGE_EXTS.test(parsed.pathname)) {
      return NextResponse.json({ imageUrl: url })
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Fetch failed: ${response.status}` }, { status: 400 })
    }

    const html = await response.text()

    // Priority 1: og:image
    const ogImage =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]

    if (ogImage) return NextResponse.json({ imageUrl: decodeHtmlEntities(ogImage) })

    // Priority 2: twitter:image
    const twitterImage =
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i)?.[1]

    if (twitterImage) return NextResponse.json({ imageUrl: decodeHtmlEntities(twitterImage) })

    // Priority 3: JSON-LD image
    const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1])
        const img = jsonLd?.image?.url || jsonLd?.image || jsonLd?.thumbnailUrl
        if (typeof img === "string") return NextResponse.json({ imageUrl: img })
      } catch {}
    }

    return NextResponse.json({ error: "No image found on this page" }, { status: 404 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch URL" }, { status: 500 })
  }
}

function decodeHtmlEntities(str: string) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}
