"use client"

import { useEffect, useState } from "react"

type Props = {
  audioUrl: string
}

export function SpotifyPlayer({ audioUrl }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Strip query params like ?si= that cause upstream errors
  const cleanUrl = audioUrl.split('?')[0]

  // Only support Spotify track embeds for now
  if (!cleanUrl.includes("spotify.com/track/")) {
    return null
  }

  const embedUrl = cleanUrl.replace("open.spotify.com/track/", "open.spotify.com/embed/track/")

  return (
    <div className="w-full mt-8">
      <iframe
        style={{ borderRadius: '16px' }}
        src={embedUrl}
        width="100%"
        height="152"
        frameBorder="0"
        allowFullScreen={false}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title="Spotify Player"
      />
    </div>
  )
}
