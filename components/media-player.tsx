"use client"

import { useEffect, useRef, useState } from "react"
import { AudioPlayer } from "./audio-player"

// ── Global API type declarations ──────────────────────────────────────────────
declare global {
  interface Window {
    YT: any
    SC: any
    onYouTubeIframeAPIReady?: () => void
    _ytReadyCallbacks?: Array<() => void>
  }
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function formatTime(secs: number) {
  if (!secs || isNaN(secs)) return "0:00"
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
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

function getSpotifyEmbedUrl(url: string): string {
  const clean = url.split("?")[0]
  return clean
    .replace("open.spotify.com/track/", "open.spotify.com/embed/track/")
    .replace("open.spotify.com/album/", "open.spotify.com/embed/album/")
    .replace("open.spotify.com/playlist/", "open.spotify.com/embed/playlist/")
}

// ── Source badge components ───────────────────────────────────────────────────
function YouTubeBadge() {
  return (
    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#FF0000" }}>
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.5 6.2s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.8 2 12 2 12 2s-4.8 0-7.3.1c-.6.1-1.9.1-3 1.3C.8 4.2.5 6.2.5 6.2S.2 8.5.2 10.8v2.1c0 2.3.3 4.6.3 4.6s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7 21.6 12 21.7 12 21.7s4.8 0 7.3-.2c.6-.1 1.9-.1 3-1.2.9-.8 1.2-2.8 1.2-2.8s.3-2.3.3-4.6v-2.1c0-2.3-.3-4.6-.3-4.6zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z" />
      </svg>
      YouTube
    </span>
  )
}

function SoundCloudBadge() {
  return (
    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#FF5500" }}>
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.56 8.87V17h8.76c.97-.05 1.74-.81 1.74-1.76 0-.85-.57-1.57-1.36-1.76.06-.23.09-.47.09-.71 0-1.67-1.32-3.02-2.95-3.02-.3 0-.58.05-.85.12-.51-1.63-2.03-2.82-3.82-2.82-.74 0-1.44.22-2.02.6l-.59.22zM0 15.24c0 .97.78 1.76 1.74 1.76s1.74-.79 1.74-1.76V11.7C3.48 10.73 2.7 9.94 1.74 9.94S0 10.73 0 11.7v3.54zm3.49.68v-5.7c0-.97.78-1.76 1.74-1.76s1.74.79 1.74 1.76v5.7c0 .97-.78 1.76-1.74 1.76S3.49 16.89 3.49 15.92zm3.49.52V9.31c0-.97.78-1.76 1.74-1.76s1.74.79 1.74 1.76v7.13c0 .97-.78 1.76-1.74 1.76s-1.74-.79-1.74-1.76z" />
      </svg>
      SoundCloud
    </span>
  )
}

// ── Shared Player UI (same visual as AudioPlayer) ─────────────────────────────
type SharedUIProps = {
  title?: string | null
  image?: string | null
  accent: string
  badge: React.ReactNode
  playing: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  loading: boolean
  onPlayPause: () => void
  onSeek: (ratio: number) => void
  onVolumeChange: (vol: number) => void
  onMuteToggle: () => void
}

function SharedPlayerUI({ title, image, accent, badge, playing, currentTime, duration, volume, muted, loading, onPlayPause, onSeek, onVolumeChange, onMuteToggle }: SharedUIProps) {
  const seekRef = useRef<HTMLDivElement>(null)
  const progress = duration ? (currentTime / duration) * 100 : 0

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekRef.current || !duration) return
    const rect = seekRef.current.getBoundingClientRect()
    onSeek((e.clientX - rect.left) / rect.width)
  }

  return (
    <div
      className="w-full mt-8 rounded-2xl overflow-hidden border border-white/10"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(20px)", borderColor: `${accent}40` }}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Album Art */}
        <div
          className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border"
          style={{ borderColor: `${accent}40`, boxShadow: `0 0 20px ${accent}40` }}
        >
          {image ? (
            <img src={image} alt={title || "Track"} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}40, ${accent}20)` }}>
              <svg className="w-7 h-7" style={{ color: accent }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate mb-0.5">{title || "Now Playing"}</p>
          <div className="mb-2">{badge}</div>

          {/* Seekbar */}
          <div
            ref={seekRef}
            className="w-full h-1.5 bg-white/10 rounded-full cursor-pointer mb-2 relative group"
            onClick={handleSeekClick}
          >
            <div className="h-full rounded-full relative" style={{ width: `${progress}%`, backgroundColor: accent }}>
              <div className="absolute right-0 top-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: accent, transform: "translate(50%, -50%)" }} />
            </div>
          </div>

          {/* Buttons row */}
          <div className="flex items-center gap-3">
            <button
              onClick={onPlayPause}
              disabled={loading}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-40 flex-shrink-0"
              style={{ backgroundColor: accent }}
            >
              {loading ? (
                <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : playing ? (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>

            <span className="text-xs text-zinc-400 font-mono flex-shrink-0">{formatTime(currentTime)} / {formatTime(duration)}</span>
            <div className="flex-1" />

            {/* Mute */}
            <button onClick={onMuteToggle} className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors flex-shrink-0">
              {muted || volume === 0 ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
              ) : volume < 50 ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
              )}
            </button>

            {/* Volume slider */}
            <div className="w-20 flex-shrink-0">
              <input
                type="range" min={0} max={100} step={1}
                value={muted ? 0 : volume}
                onChange={e => onVolumeChange(parseInt(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, ${accent} 0%, ${accent} ${muted ? 0 : volume}%, rgba(255,255,255,0.1) ${muted ? 0 : volume}%, rgba(255,255,255,0.1) 100%)` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── YouTube Audio Player (hidden iframe + IFrame API) ─────────────────────────
function YouTubeAudioPlayer({ videoId, title, image, accentColor }: {
  videoId: string; title?: string | null; image?: string | null; accentColor?: string
}) {
  const accent = accentColor || "#8b5cf6"
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [muted, setMuted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initPlayer = () => {
      if (!containerRef.current || playerRef.current) return
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        width: "1",
        height: "1",
        playerVars: { autoplay: 0, controls: 0, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (e: any) => {
            e.target.setVolume(80)
            setDuration(e.target.getDuration() || 0)
            setLoading(false)
          },
          onStateChange: (e: any) => {
            if (e.data === 1) { // PLAYING
              setPlaying(true)
              setDuration(playerRef.current?.getDuration() || 0)
              if (!intervalRef.current) {
                intervalRef.current = setInterval(() => {
                  setCurrentTime(playerRef.current?.getCurrentTime() || 0)
                }, 250)
              }
            } else {
              setPlaying(false)
              if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
              if (e.data === 0) setCurrentTime(0) // ENDED
            }
          }
        }
      })
    }

    if (window.YT?.Player) {
      initPlayer()
    } else {
      if (!window._ytReadyCallbacks) window._ytReadyCallbacks = []
      window._ytReadyCallbacks.push(initPlayer)
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script")
        tag.src = "https://www.youtube.com/iframe_api"
        document.head.appendChild(tag)
        window.onYouTubeIframeAPIReady = () => {
          window._ytReadyCallbacks?.forEach(cb => cb())
          window._ytReadyCallbacks = []
        }
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      playerRef.current?.destroy?.()
    }
  }, [videoId])

  const togglePlay = () => {
    if (!playerRef.current) return
    playing ? playerRef.current.pauseVideo() : playerRef.current.playVideo()
  }
  const handleSeek = (ratio: number) => {
    if (!playerRef.current || !duration) return
    const t = ratio * duration
    playerRef.current.seekTo(t, true)
    setCurrentTime(t)
  }
  const handleVolume = (vol: number) => {
    setVolume(vol)
    playerRef.current?.setVolume(vol)
    setMuted(vol === 0)
  }
  const toggleMute = () => {
    if (!playerRef.current) return
    if (muted) { playerRef.current.unMute(); setMuted(false) }
    else { playerRef.current.mute(); setMuted(true) }
  }

  return (
    <>
      {/* Hidden YouTube player */}
      <div style={{ position: "fixed", top: -9999, left: -9999, width: 1, height: 1, overflow: "hidden" }}>
        <div ref={containerRef} />
      </div>
      <SharedPlayerUI
        title={title} image={image || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
        accent={accent} badge={<YouTubeBadge />}
        playing={playing} currentTime={currentTime} duration={duration}
        volume={volume} muted={muted} loading={loading}
        onPlayPause={togglePlay} onSeek={handleSeek}
        onVolumeChange={handleVolume} onMuteToggle={toggleMute}
      />
    </>
  )
}

// ── SoundCloud Audio Player (hidden iframe + Widget API) ──────────────────────
function SoundCloudAudioPlayer({ url, title, image, accentColor }: {
  url: string; title?: string | null; image?: string | null; accentColor?: string
}) {
  const accent = accentColor || "#8b5cf6"
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const widgetRef = useRef<any>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [muted, setMuted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initWidget = () => {
      if (!iframeRef.current || !window.SC) return
      const widget = window.SC.Widget(iframeRef.current)
      widgetRef.current = widget

      widget.bind(window.SC.Widget.Events.READY, () => {
        widget.getDuration((d: number) => setDuration(d / 1000))
        widget.setVolume(80)
        setLoading(false)
      })
      widget.bind(window.SC.Widget.Events.PLAY, () => setPlaying(true))
      widget.bind(window.SC.Widget.Events.PAUSE, () => setPlaying(false))
      widget.bind(window.SC.Widget.Events.FINISH, () => { setPlaying(false); setCurrentTime(0) })
      widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, (state: any) => {
        setCurrentTime(state.currentPosition / 1000)
      })
    }

    if (window.SC) {
      initWidget()
    } else if (!document.querySelector('script[src*="soundcloud.com/player/api"]')) {
      const script = document.createElement("script")
      script.src = "https://w.soundcloud.com/player/api.js"
      script.onload = initWidget
      document.head.appendChild(script)
    } else {
      // Script tag exists but SC not ready yet - poll
      const poll = setInterval(() => {
        if (window.SC) { clearInterval(poll); initWidget() }
      }, 100)
    }
  }, [url])

  const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&hide_related=true&show_comments=false&show_user=false`

  const togglePlay = () => {
    if (!widgetRef.current) return
    playing ? widgetRef.current.pause() : widgetRef.current.play()
  }
  const handleSeek = (ratio: number) => {
    if (!widgetRef.current || !duration) return
    widgetRef.current.seekTo(ratio * duration * 1000)
    setCurrentTime(ratio * duration)
  }
  const handleVolume = (vol: number) => {
    setVolume(vol)
    widgetRef.current?.setVolume(vol)
    setMuted(vol === 0)
  }
  const toggleMute = () => {
    const newMuted = !muted
    setMuted(newMuted)
    widgetRef.current?.setVolume(newMuted ? 0 : volume)
  }

  return (
    <>
      {/* Hidden SoundCloud iframe */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        style={{ position: "fixed", top: -9999, left: -9999, width: 1, height: 1 }}
        allow="autoplay"
        title="sc-audio"
      />
      <SharedPlayerUI
        title={title} image={image}
        accent={accent} badge={<SoundCloudBadge />}
        playing={playing} currentTime={currentTime} duration={duration}
        volume={volume} muted={muted} loading={loading}
        onPlayPause={togglePlay} onSeek={handleSeek}
        onVolumeChange={handleVolume} onMuteToggle={toggleMute}
      />
    </>
  )
}

// ── Spotify: timeout fallback ─────────────────────────────────────────────────
function SpotifyEmbed({ url, title, accentColor }: { url: string; title?: string | null; accentColor?: string }) {
  const [timedOut, setTimedOut] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const accent = accentColor || "#8b5cf6"

  useEffect(() => {
    const t = setTimeout(() => { if (!loaded) setTimedOut(true) }, 6000)
    return () => clearTimeout(t)
  }, [loaded])

  if (timedOut) {
    return (
      <div className="w-full mt-8 rounded-2xl border p-4 flex items-center gap-4" style={{ background: "rgba(0,0,0,0.6)", borderColor: `${accent}40` }}>
        <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "#1DB954" }}>
          <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{title || "Spotify Track"}</p>
          <p className="text-zinc-400 text-xs mt-0.5">Player unavailable in your region</p>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all hover:opacity-80" style={{ backgroundColor: "#1DB954", color: "#000" }}>
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
type Props = { audioUrl: string; audioTitle?: string | null; audioImage?: string | null; accentColor?: string }

function detectType(url: string) {
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
    return <YouTubeAudioPlayer videoId={videoId} title={audioTitle} image={audioImage} accentColor={accentColor} />
  }
  if (type === "soundcloud") {
    return <SoundCloudAudioPlayer url={audioUrl} title={audioTitle} image={audioImage} accentColor={accentColor} />
  }
  if (type === "spotify") {
    return <SpotifyEmbed url={audioUrl} title={audioTitle} accentColor={accentColor} />
  }
  return <AudioPlayer src={audioUrl} title={audioTitle} image={audioImage} accentColor={accentColor} />
}
