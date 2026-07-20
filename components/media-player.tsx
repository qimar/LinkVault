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
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%238b5cf6&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`
}

function getSpotifyEmbedUrl(url: string): string {
  const clean = url.split("?")[0]
  return clean
    .replace("open.spotify.com/track/", "open.spotify.com/embed/track/")
    .replace("open.spotify.com/album/", "open.spotify.com/embed/album/")
    .replace("open.spotify.com/playlist/", "open.spotify.com/embed/playlist/")
}

// ── Styled wrapper used by YouTube + SoundCloud ──────────────────────────────
function EmbedWrapper({
  title, image, accent, badge, children,
}: {
  title?: string | null
  image?: string | null
  accent: string
  badge: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      className="w-full mt-8 rounded-2xl overflow-hidden border"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(20px)", borderColor: `${accent}40` }}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border"
          style={{ borderColor: `${accent}40`, boxShadow: `0 0 16px ${accent}40` }}
        >
          {image ? (
            <img src={image} alt={title || ""} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${accent}40, ${accent}20)` }}
            >
              {badge}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{title || "Now Playing"}</p>
          <div className="flex items-center gap-1.5 mt-0.5">{badge}</div>
        </div>
      </div>
      {/* Embed */}
      <div className="px-3 pb-3">{children}</div>
    </div>
  )
}

// ── YouTube: click-to-play to avoid autoloading ──────────────────────────────
function YouTubePlayer({ videoId, title, image, accentColor }: {
  videoId: string; title?: string | null; image?: string | null; accentColor?: string
}) {
  const accent = accentColor || "#8b5cf6"
  const [playing, setPlaying] = useState(false)
  const thumbnail = image || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

  const badge = (
    <span className="flex items-center gap-1 text-zinc-400 text-xs font-medium">
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.5 6.2s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.8 2 12 2 12 2s-4.8 0-7.3.1c-.6.1-1.9.1-3 1.3C.8 4.2.5 6.2.5 6.2S.2 8.5.2 10.8v2.1c0 2.3.3 4.6.3 4.6s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7 21.6 12 21.7 12 21.7s4.8 0 7.3-.2c.6-.1 1.9-.1 3-1.2.9-.8 1.2-2.8 1.2-2.8s.3-2.3.3-4.6v-2.1c0-2.3-.3-4.6-.3-4.6zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z"/></svg>
      YouTube
    </span>
  )

  return (
    <EmbedWrapper title={title} image={thumbnail} accent={accent} badge={badge}>
      {playing ? (
        <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title || "YouTube Video"}
          />
        </div>
      ) : (
        <div
          className="relative rounded-xl overflow-hidden cursor-pointer group"
          style={{ aspectRatio: "16/9" }}
          onClick={() => setPlaying(true)}
        >
          <img src={thumbnail} alt={title || "Video thumbnail"} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform"
              style={{ backgroundColor: accent }}
            >
              <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </EmbedWrapper>
  )
}

// ── SoundCloud: wrap native embed in our styled container ────────────────────
function SoundCloudPlayer({ url, title, image, accentColor }: {
  url: string; title?: string | null; image?: string | null; accentColor?: string
}) {
  const accent = accentColor || "#8b5cf6"

  const badge = (
    <span className="flex items-center gap-1 text-zinc-400 text-xs font-medium">
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="#FF5500"><path d="M11.56 8.87V17h8.76c.97-.05 1.74-.81 1.74-1.76 0-.85-.57-1.57-1.36-1.76.06-.23.09-.47.09-.71 0-1.67-1.32-3.02-2.95-3.02-.3 0-.58.05-.85.12-.51-1.63-2.03-2.82-3.82-2.82-.74 0-1.44.22-2.02.6l-.59.22zM0 15.24c0 .97.78 1.76 1.74 1.76s1.74-.79 1.74-1.76V11.7C3.48 10.73 2.7 9.94 1.74 9.94S0 10.73 0 11.7v3.54zm3.49.68v-5.7c0-.97.78-1.76 1.74-1.76s1.74.79 1.74 1.76v5.7c0 .97-.78 1.76-1.74 1.76S3.49 16.89 3.49 15.92zm3.49.52V9.31c0-.97.78-1.76 1.74-1.76s1.74.79 1.74 1.76v7.13c0 .97-.78 1.76-1.74 1.76s-1.74-.79-1.74-1.76z"/></svg>
      SoundCloud
    </span>
  )

  return (
    <EmbedWrapper title={title} image={image} accent={accent} badge={badge}>
      <iframe
        src={getSoundCloudEmbedUrl(url)}
        width="100%"
        height="80"
        style={{ borderRadius: "12px" }}
        frameBorder="0"
        allow="autoplay"
        title={title || "SoundCloud Track"}
      />
    </EmbedWrapper>
  )
}

// ── Spotify: timeout fallback ─────────────────────────────────────────────────
function SpotifyEmbed({ url, title, accentColor }: { url: string; title?: string | null; accentColor?: string }) {
  const [timedOut, setTimedOut] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const accent = accentColor || "#8b5cf6"

  useEffect(() => {
    const timer = setTimeout(() => { if (!loaded) setTimedOut(true) }, 6000)
    return () => clearTimeout(timer)
  }, [loaded])

  if (timedOut) {
    return (
      <div
        className="w-full mt-8 rounded-2xl border p-4 flex items-center gap-4"
        style={{ background: "rgba(0,0,0,0.6)", borderColor: `${accent}40` }}
      >
        <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "#1DB954" }}>
          <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{title || "Spotify Track"}</p>
          <p className="text-zinc-400 text-xs mt-0.5">Player unavailable in your region</p>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex-shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all hover:opacity-80"
          style={{ backgroundColor: "#1DB954", color: "#000" }}>
          Open
        </a>
      </div>
    )
  }

  return (
    <div className="w-full mt-8 relative min-h-[152px]">
      {!loaded && (
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
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

// ── Main export ───────────────────────────────────────────────────────────────
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
    return <YouTubePlayer videoId={videoId} title={audioTitle} image={audioImage} accentColor={accentColor} />
  }

  if (type === "soundcloud") {
    return <SoundCloudPlayer url={audioUrl} title={audioTitle} image={audioImage} accentColor={accentColor} />
  }

  if (type === "spotify") {
    return <SpotifyEmbed url={audioUrl} title={audioTitle} accentColor={accentColor} />
  }

  return (
    <AudioPlayer src={audioUrl} title={audioTitle} image={audioImage} accentColor={accentColor} />
  )
}
