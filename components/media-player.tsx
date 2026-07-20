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

function getSoundCloudEmbedUrl(url: string): string {
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%238b5cf6&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`
}

function getSpotifyEmbedUrl(url: string): string {
  const clean = url.split("?")[0]
  return clean
    .replace("open.spotify.com/track/", "open.spotify.com/embed/track/")
    .replace("open.spotify.com/album/", "open.spotify.com/embed/album/")
    .replace("open.spotify.com/playlist/", "open.spotify.com/embed/playlist/")
}

function SpotifyEmbed({ url, title, accentColor }: { url: string; title?: string | null; accentColor?: string }) {
  const [timedOut, setTimedOut] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const accent = accentColor || "#8b5cf6"

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loaded) setTimedOut(true)
    }, 6000)
    return () => clearTimeout(timer)
  }, [loaded])

  if (timedOut) {
    return (
      <div
        className="w-full mt-8 rounded-2xl border border-white/10 p-5 flex items-center gap-4"
        style={{ background: "rgba(0,0,0,0.6)" }}
      >
        {/* Spotify logo */}
        <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "#1DB954" }}>
          <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{title || "Spotify Track"}</p>
          <p className="text-zinc-400 text-xs mt-0.5">Player unavailable in your region</p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all hover:opacity-80"
          style={{ backgroundColor: "#1DB954", color: "#000" }}
        >
          Open
        </a>
      </div>
    )
  }

  return (
    <div className="w-full mt-8 relative">
      {!loaded && (
        <div
          className="absolute inset-0 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)", minHeight: "152px" }}
        >
          <svg className="w-6 h-6 animate-spin" style={{ color: accent }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}
      <iframe
        style={{ borderRadius: "16px" }}
        src={getSpotifyEmbedUrl(url)}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title={title || "Spotify Player"}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
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
          src={getSoundCloudEmbedUrl(audioUrl)}
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
      <SpotifyEmbed
        url={audioUrl}
        title={audioTitle}
        accentColor={accentColor}
      />
    )
  }

  // Raw audio file — use our custom player
  return (
    <AudioPlayer
      src={audioUrl}
      title={audioTitle}
      image={audioImage}
      accentColor={accentColor}
    />
  )
}
