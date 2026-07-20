import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const linkId = searchParams.get('link_id')
  const url = searchParams.get('url')

  if (!linkId || !url) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Log the click — fetch profile_id from the link first
  // so the clicks table FK constraint doesn't reject the insert
  try {
    const { data: linkData } = await supabase
      .from('links')
      .select('profile_id')
      .eq('id', linkId)
      .single()

    if (linkData?.profile_id) {
      await supabase.from('clicks').insert({
        link_id: linkId,
        profile_id: linkData.profile_id,
      })
    }
  } catch (error) {
    console.error("Failed to log click:", error)
  }

  // Always redirect even if click logging fails
  return NextResponse.redirect(url)
}
