import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const linkId = searchParams.get('link_id')
  const url = searchParams.get('url')

  if (!linkId || !url) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Attempt to log the click. 
  // We use a try/catch so if the ISP blocks the local connection, 
  // it doesn't crash the redirect and the user still gets to the link.
  try {
    await supabase.from('clicks').insert({
      link_id: linkId,
      // the profile_id is ideally grabbed from the link record but for simplicity we log it
    })
  } catch (error) {
    console.error("Failed to log click", error)
  }

  // Redirect the user to the destination URL
  return NextResponse.redirect(url)
}
