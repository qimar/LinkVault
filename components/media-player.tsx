"use client"

import { useEffect, useState } from "react"
import { AudioPlayer } from "./audio-player"

type Props = {
  audioUrl: string
  audioTitle?: string | null
  audioImage?: string | null
  accentColor?: string
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function getSoundCloudUrl(url: string): string {
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%238b5cf6&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`
}

function getSpotifyEmbedUrl(url: string): string {
  const clean = url.split("?")[0]
  return clean
    .replace("open.spotify.com/track/", "open.spotify.com/embed/track/")
    .replace("open.spotify.com/album/", "open.spotify.com/embed/album/")
    .replace("open.spotify.com/playlist/", "open.spotify.com/embed/playlist/")
}

type MediaType = "youtube" | "soundcloud" | "spotify" | "audio"

function detectType(url: string): MediaType {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube"
  if (url.includes("soundcloud.com")) return "soundcloud"
  if (url.includes("spotify.com")) return "spotify"
  return "audio"
}

export function MediaPlayer({ audioUrl, audioTitle, audioImage, accentColor }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const type = detectType(audioUrl)

  if (type === "youtube") {
    const videoId = getYouTubeId(audioUrl)
    if (!videoId) return null
    return (
      <div className="w-full mt-8 rounded-2xl overflow-hidden border border-white/10" style={{ aspectRatio: "16/9" }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={audioTitle || "YouTube Video"}
        />
      </div>
    )
  }

  if (type === "soundcloud") {
    return (
      <div className="w-full mt-8">
        <iframe
          src={getSoundCloudUrl(audioUrl)}
          width="100%"
          height="120"
          style={{ borderRadius: "16px" }}
          frameBorder="0"
          allow="autoplay"
          title={audioTitle || "SoundCloud Player"}
        />
      </div>
    )
  }

  if (type === "spotify") {
    return (
      <div className="w-full mt-8">
        <iframe
          style={{ borderRadius: "16px" }}
          src={getSpotifyEmbedUrl(audioUrl)}
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title={audioTitle || "Spotify Player"}
        />
      </div>
    )
  }

  // Raw audio file (mp3, wav, ogg, etc.)
  return (
    <AudioPlayer
      src={audioUrl}
      title={audioTitle}
      image={audioImage}
      accentColor={accentColor}
    />
  )
}
