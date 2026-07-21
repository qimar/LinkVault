import { supabaseAdmin } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const linkId = searchParams.get('link_id')
  const url = searchParams.get('url')

  if (!linkId || !url) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Rate limit click tracking to prevent DB spam
  const ip = request.headers.get("x-forwarded-for") || "unknown"
  const { success } = await checkRateLimit(`click_${ip}`)

  // Only log the click if they haven't exceeded the rate limit
  if (success) {
    try {
      const { data: linkData } = await supabaseAdmin
        .from('links')
        .select('profile_id')
        .eq('id', linkId)
        .single()

      if (linkData?.profile_id) {
        await supabaseAdmin.from('clicks').insert({
          link_id: linkId,
          profile_id: linkData.profile_id,
        })
      }
    } catch (error) {
      console.error("Failed to log click:", error)
    }
  }

  // Always redirect to destination even if click logging fails or is rate limited
  const response = NextResponse.redirect(new URL(url))
  if (!success) {
    response.headers.set("X-RateLimit-Exceeded", "1")
  }
  return response
}
