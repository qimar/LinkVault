"use client"

import { useState } from "react"
import type { Link } from "@/types"

export function LinkForm({
  onSubmit,
  initialData,
  onCancel
}: {
  onSubmit: (data: { title: string, url: string }) => Promise<void>
  initialData?: Link
  onCancel?: () => void
}) {
  const [title, setTitle] = useState(initialData?.title || "")
  const [url, setUrl] = useState(initialData?.url || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit({ title, url })
    setLoading(false)
    if (!initialData) {
      setTitle("")
      setUrl("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--card-bg)] backdrop-blur-md p-6 rounded-3xl border border-[var(--card-border)] shadow-xl mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full mix-blend-screen filter blur-3xl pointer-events-none" />
      
      <div className="space-y-5 relative z-10">
        <div>
          <label className="block text-sm font-semibold text-zinc-300 mb-2">Title</label>
          <input
            required
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all text-white placeholder-zinc-500 font-medium"
            placeholder="e.g. My Twitter"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-zinc-300 mb-2">URL</label>
          <input
            required
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all text-white placeholder-zinc-500 font-medium"
            placeholder="https://..."
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[var(--accent)] px-6 py-3 rounded-xl font-bold disabled:opacity-50 transition-all shadow-[0_0_15px_var(--accent-glow)] hover:opacity-90 hover:shadow-[0_0_25px_var(--accent-glow)] cursor-pointer"
            style={{ color: 'var(--btn-text)' }}
          >
            {loading ? "Saving..." : initialData ? "Update Link" : "Add Link"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl font-bold transition-colors border border-transparent hover:border-zinc-700 cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
