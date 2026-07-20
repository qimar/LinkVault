"use client"

import { useState } from "react"

type Props = {
  avatarUrl?: string | null
  displayName?: string | null
  username: string
  size?: "sm" | "lg"
  accentColor?: string
}

export function AvatarImage({ avatarUrl, displayName, username, size = "lg", accentColor }: Props) {
  const [failed, setFailed] = useState(false)
  const initial = (displayName?.[0] || username[0] || "?").toUpperCase()

  const sizeClass = size === "lg"
    ? "w-28 h-28 mb-6 text-3xl"
    : "w-20 h-20 text-2xl"

  if (avatarUrl && !failed) {
    return (
      <img
        src={avatarUrl}
        alt={displayName || username}
        className={`${sizeClass} rounded-full border-4 object-cover`}
        style={{
          borderColor: accentColor || "var(--accent)",
          boxShadow: `0 0 40px ${accentColor || "var(--accent-glow)"}80`
        }}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full border-4 border-zinc-700 shadow-2xl flex items-center justify-center font-bold text-zinc-400 bg-zinc-800`}
      style={size === "lg" ? { marginBottom: "1.5rem" } : {}}
    >
      {initial}
    </div>
  )
}
