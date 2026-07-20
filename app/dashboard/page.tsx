"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { SortableList } from "@/components/sortable-list"
import { LinkForm } from "@/components/link-form"
import type { Link, Profile } from "@/types"
import { AvatarImage } from "@/components/avatar-image"
import { 
  fetchDashboardDataAction, 
  createProfileAction, 
  addLinkAction, 
  updateLinkAction, 
  deleteLinkAction, 
  reorderLinksAction, 
  updateAppearanceAction 
} from "@/app/actions"
import { motion, AnimatePresence } from "framer-motion"
import { LogOut, ExternalLink, Plus, PaintBucket, Link2, BarChart3, DollarSign, Clock } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [links, setLinks] = useState<Link[]>([])
  const [analyticsData, setAnalyticsData] = useState<any[]>([])
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [resolvingAvatar, setResolvingAvatar] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [usernameInput, setUsernameInput] = useState("")
  const [activeTab, setActiveTab] = useState<"links" | "appearance" | "analytics" | "monetize">("links")

  // Debounce refs for appearance saves — prevents text-field reversion bug
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingUpdates = useRef<Partial<Profile>>({})
  const profileIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
    if (status === "authenticated" && session?.user) {
      loadData()
    }
  }, [status, session])

  const loadData = async () => {
    try {
      const userId = (session?.user as any).id
      
      const { profileData, linksData, clicksCount, error } = await fetchDashboardDataAction(userId)

      if (error) {
        console.error("Supabase error:", error)
        alert("Database error: " + error)
        setLoading(false)
        return
      }

      if (profileData) {
        setProfile(profileData)
        profileIdRef.current = profileData.id
        if (linksData) setLinks(linksData)

        const chart = [
          { name: 'Today', views: profileData.views || 0, clicks: clicksCount || 0 }
        ]
        setAnalyticsData(chart)
      }
      setLoading(false)
    } catch (e) {
      console.error("Failed to load data:", e)
      setLoading(false)
    }
  }

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const userId = (session?.user as any).id
    const username = usernameInput.toLowerCase().replace(/[^a-z0-9]/g, "")
    const { data, error } = await createProfileAction(userId, username, session?.user?.name, session?.user?.image)
      
    if (error) {
      alert("Failed to create profile: " + error)
      return
    }
    
    if (data) {
      setProfile(data)
    }
  }

  const handleAddLink = async (linkData: { title: string, url: string }) => {
    if (!profile) return
    const { data: newLink, error } = await addLinkAction(profile.id, linkData.title, linkData.url, links.length)
      
    if (error) {
      alert("Failed to add link: " + error)
      return
    }
      
    if (newLink) {
      setLinks([...links, newLink])
      setShowAddForm(false)
    }
  }

  const handleEditLink = async (linkData: { id: string, title: string, url: string }) => {
    const { data: updated, error } = await updateLinkAction(linkData.id, linkData.title, linkData.url)
      
    if (error) {
      alert("Failed to update link: " + error)
      return
    }
      
    if (updated) {
      setLinks(links.map(l => l.id === updated.id ? updated : l))
    }
  }

  const handleDeleteLink = async (id: string) => {
    const { error } = await deleteLinkAction(id)
    if (error) {
      alert("Failed to delete link: " + error)
      return
    }
    setLinks(links.filter(l => l.id !== id))
  }

  const handleReorder = async (newItems: Link[]) => {
    // Optimistic update
    setLinks(newItems)
    
    const { error } = await reorderLinksAction(newItems)
    if (error) {
      console.error("Failed to reorder link:", error)
      alert("Failed to reorder: " + error)
    }
  }

  // Debounced appearance save — UI updates instantly, DB write fires 700ms after
  // last keystroke. Batches rapid changes (e.g. typing) into a single DB call.
  const handleUpdateAppearance = (updates: Partial<Profile>) => {
    if (!profile) return

    // Immediate optimistic update so the input feels responsive
    setProfile(prev => prev ? { ...prev, ...updates } : prev)

    // Accumulate all changes since last save
    pendingUpdates.current = { ...pendingUpdates.current, ...updates }

    // Reset the debounce window
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(async () => {
      const toSave = pendingUpdates.current
      pendingUpdates.current = {}
      const id = profileIdRef.current
      if (!id) return
      const { error } = await updateAppearanceAction(id, toSave)
      if (error) alert("Failed to save appearance: " + error)
    }, 700)
  }

  // Smart avatar URL handler — resolves Pinterest/social URLs to direct image URLs
  const handleAvatarUrlChange = async (rawUrl: string) => {
    // Always update the input field immediately
    handleUpdateAppearance({ avatar_url: rawUrl })

    if (!rawUrl) return

    // Check if it's already a direct image URL
    const DIRECT_IMAGE = /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i
    try {
      const parsed = new URL(rawUrl)
      if (DIRECT_IMAGE.test(parsed.pathname)) return // already direct, no need to resolve
    } catch { return }

    // Resolve social/Pinterest/other page URLs to their og:image
    setResolvingAvatar(true)
    try {
      const res = await fetch(`/api/resolve-image?url=${encodeURIComponent(rawUrl)}`)
      const json = await res.json()
      if (json.imageUrl && json.imageUrl !== rawUrl) {
        handleUpdateAppearance({ avatar_url: json.imageUrl })
      }
    } catch { /* silent — keep original URL */ } finally {
      setResolvingAvatar(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Loading...</div>

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-glow rounded-full mix-blend-screen filter blur-[128px] opacity-20" />
        <motion.form 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onSubmit={handleCreateProfile} 
          className="bg-[var(--card-bg)] backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-[var(--card-border)] max-w-md w-full relative z-10"
        >
          <h2 className="text-3xl font-extrabold mb-2 text-white">Claim your link</h2>
          <p className="text-zinc-400 mb-8">Choose a unique username for your public page.</p>
          <div className="flex items-center mb-8 bg-black/50 border border-[var(--card-border)] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-accent focus-within:border-accent transition-all">
            <span className="px-4 text-zinc-500 bg-zinc-900/50 border-r border-[var(--card-border)] font-medium">linkvault.com/</span>
            <input
              type="text"
              required
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              className="flex-1 px-4 py-3 outline-none bg-transparent text-white font-medium placeholder-zinc-600"
              placeholder="username"
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            Create Profile
          </motion.button>
        </motion.form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* DYNAMIC CSS INJECTION */}
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --accent: ${profile.theme_color || '#8b5cf6'};
          --accent-glow: ${profile.theme_color || '#8b5cf6'}80;
          --btn-text: ${profile.theme_color === '#ffffff' ? '#000000' : '#ffffff'};
        }
      `}} />

      {/* Glassmorphism Nav */}
      <nav className="bg-background/80 backdrop-blur-md border-b border-[var(--card-border)] px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
          LinkVault
        </div>
        <div className="flex gap-4 items-center">
          <motion.a 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={`/${profile.username}`} 
            target="_blank" 
            className="text-sm font-semibold text-zinc-300 hover:text-white flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800 cursor-pointer hover:border-[var(--accent)] transition-colors"
          >
            Live View <ExternalLink className="w-4 h-4" />
          </motion.a>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => signOut()} 
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full border border-zinc-800 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 mt-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-[var(--card-bg)] backdrop-blur-md p-8 rounded-3xl border border-[var(--card-border)] shadow-xl flex items-center gap-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-glow)] rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none" />
          
          <AvatarImage
            avatarUrl={profile.avatar_url}
            displayName={profile.display_name}
            username={profile.username}
            size="sm"
          />
          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold text-white mb-1">{profile.display_name}</h1>
            <a href={`/${profile.username}`} target="_blank" className="text-[var(--accent)] font-medium hover:underline flex items-center gap-1 cursor-pointer">
              linkvault.com/{profile.username}
            </a>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 bg-zinc-900/50 p-2 rounded-2xl border border-[var(--card-border)] w-fit relative z-10">
          <button 
            onClick={() => setActiveTab("links")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'links' ? 'bg-[var(--accent)] shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            style={activeTab === 'links' ? { color: 'var(--btn-text)' } : {}}
          >
            <Link2 className="w-5 h-5" /> Links
          </button>
          <button
            onClick={() => setActiveTab("appearance")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'appearance' ? 'bg-[var(--accent)] shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            style={activeTab === 'appearance' ? { color: 'var(--btn-text)' } : {}}
          >
            <PaintBucket className="w-5 h-5" /> Appearance
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'analytics' ? 'bg-[var(--accent)] shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            style={activeTab === 'analytics' ? { color: 'var(--btn-text)' } : {}}
          >
            <BarChart3 className="w-5 h-5" /> Analytics
          </button>
          <button 
            onClick={() => setActiveTab("monetize")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'monetize' ? 'bg-[var(--accent)] shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            style={activeTab === 'monetize' ? { color: 'var(--btn-text)' } : {}}
          >
            <DollarSign className="w-5 h-5" /> Monetize
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "links" && (
            <motion.div 
              key="links"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {!showAddForm ? (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddForm(true)}
                  className="w-full bg-[var(--accent)] py-5 rounded-2xl font-bold transition-colors mb-12 shadow-[0_0_20px_var(--accent-glow)] flex items-center justify-center gap-2 cursor-pointer hover:opacity-90"
                  style={{ color: 'var(--btn-text)' }}
                >
                  <Plus className="w-6 h-6" /> Add New Link
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-12"
                >
                  <LinkForm onSubmit={handleAddLink} onCancel={() => setShowAddForm(false)} />
                </motion.div>
              )}

              {links.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <SortableList 
                    items={links} 
                    setItems={setLinks} 
                    onEdit={handleEditLink}
                    onDelete={handleDeleteLink}
                    onReorder={handleReorder}
                  />
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl"
                >
                  <div className="text-zinc-500 font-medium text-lg">Your vault is empty.</div>
                  <div className="text-zinc-600 mt-2">Add your first link above to get started.</div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === "appearance" && (
            <motion.div 
              key="appearance"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-[var(--card-bg)] backdrop-blur-md p-8 rounded-3xl border border-[var(--card-border)] shadow-xl">
                <h2 className="text-2xl font-extrabold text-white mb-6">Theme Profile</h2>
                
                <div className="space-y-6">
                  {/* Profile Identity */}
                  <div className="pb-6 border-b border-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-300 mb-4">Profile Identity</h3>
                    <div className="flex items-start gap-6">
                      {/* Avatar preview (URL only) */}
                      <div className="flex-shrink-0">
                        <AvatarImage
                          avatarUrl={profile.avatar_url}
                          displayName={profile.display_name}
                          username={profile.username}
                          size="sm"
                        />
                      </div>

                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">Display Name</label>
                          <input
                            type="text"
                            value={profile.display_name || ""}
                            onChange={e => handleUpdateAppearance({ display_name: e.target.value })}
                            className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent)] outline-none text-white placeholder-zinc-600 transition-shadow text-sm"
                            placeholder="Your Name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">Bio</label>
                          <input
                            type="text"
                            value={profile.bio || ""}
                            onChange={e => handleUpdateAppearance({ bio: e.target.value })}
                            className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent)] outline-none text-white placeholder-zinc-600 transition-shadow text-sm"
                            placeholder="A short bio..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">
                            Profile Picture URL
                            {resolvingAvatar && <span className="ml-2 text-[var(--accent)] animate-pulse">Resolving image...</span>}
                          </label>
                          <input
                            type="text"
                            value={profile.avatar_url || ""}
                            onChange={e => handleAvatarUrlChange(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent)] outline-none text-white placeholder-zinc-600 transition-shadow text-sm"
                            placeholder="Direct image URL, Pinterest link, or any page with an image..."
                          />
                          <p className="text-xs text-zinc-600 mt-1">Supports direct images, Pinterest pins, and most social pages</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Theme Color */}
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-3">Accent Color</label>
                    <div className="flex gap-3">
                      {["#8b5cf6", "#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#ec4899", "#ffffff"].map(color => (
                        <button
                          key={color}
                          onClick={() => handleUpdateAppearance({ theme_color: color })}
                          className={`w-12 h-12 rounded-full cursor-pointer transition-transform ${profile.theme_color === color ? 'scale-110 ring-4 ring-white/20 shadow-lg' : 'hover:scale-105'} border border-zinc-700`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Background Options */}
                  <div className="pt-4 border-t border-zinc-800">
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">Background Image URL</label>
                    <input
                      type="url"
                      value={profile.bg_image_url || ""}
                      onChange={e => handleUpdateAppearance({ bg_image_url: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent)] outline-none text-white placeholder-zinc-600 transition-shadow"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="pt-4 border-t border-zinc-800">
                    <label className="block text-sm font-semibold text-zinc-300 mb-3">Particle Effects</label>
                    <div className="grid grid-cols-3 gap-4">
                      {["none", "stars", "snow"].map(effect => (
                        <button
                          key={effect}
                          onClick={() => handleUpdateAppearance({ particle_effect: effect })}
                          className={`py-3 px-4 rounded-xl font-bold cursor-pointer transition-all ${
                            profile.particle_effect === effect 
                              ? profile.theme_color === "#ffffff" 
                                ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                                : "bg-[var(--accent)] shadow-[0_0_15px_var(--accent-glow)]" 
                              : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                          }`}
                          style={profile.particle_effect === effect ? { color: 'var(--btn-text)' } : {}}
                        >
                          {effect.charAt(0).toUpperCase() + effect.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Background Audio */}
                  <div className="pt-4 border-t border-zinc-800 space-y-3">
                    <label className="block text-sm font-semibold text-zinc-300">Background Audio / Media</label>
                    <p className="text-xs text-zinc-500">Supports YouTube, SoundCloud, Spotify, or any direct MP3/audio link</p>
                    <input
                      type="url"
                      value={profile.audio_url || ""}
                      onChange={e => handleUpdateAppearance({ audio_url: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent)] outline-none text-white placeholder-zinc-600 transition-shadow"
                      placeholder="YouTube / SoundCloud / Spotify / direct .mp3 URL"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Player Title (for MP3)</label>
                        <input
                          type="text"
                          value={profile.audio_title || ""}
                          onChange={e => handleUpdateAppearance({ audio_title: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent)] outline-none text-white placeholder-zinc-600 transition-shadow text-sm"
                          placeholder="Song title..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Album Art URL (for MP3)</label>
                        <input
                          type="url"
                          value={profile.audio_image || ""}
                          onChange={e => handleUpdateAppearance({ audio_image: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent)] outline-none text-white placeholder-zinc-600 transition-shadow text-sm"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-[var(--card-bg)] backdrop-blur-md p-8 rounded-3xl border border-[var(--card-border)] shadow-xl">
                <h2 className="text-2xl font-extrabold text-white mb-2">Analytics Overview</h2>
                <p className="text-zinc-400 mb-8">Real-time data from your live profile.</p>
                
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="name" stroke="#71717a" />
                      <YAxis stroke="#71717a" />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }} />
                      <Line type="monotone" dataKey="views" stroke="var(--accent)" strokeWidth={3} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[var(--accent-glow)] opacity-0 group-hover:opacity-10 transition-opacity" />
                    <div className="text-4xl font-extrabold text-white mb-1">{analyticsData[0]?.views || 0}</div>
                    <div className="text-zinc-500 font-medium">Total Views</div>
                  </div>
                  <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[var(--accent-glow)] opacity-0 group-hover:opacity-10 transition-opacity" />
                    <div className="text-4xl font-extrabold text-white mb-1">{analyticsData[0]?.clicks || 0}</div>
                    <div className="text-zinc-500 font-medium">Total Clicks</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "monetize" && (
            <motion.div 
              key="monetize"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-[var(--card-bg)] backdrop-blur-md p-12 rounded-3xl border border-[var(--card-border)] shadow-xl text-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50" />
                
                <div className="w-20 h-20 bg-zinc-900/80 rounded-full flex items-center justify-center mx-auto mb-6 border border-[var(--card-border)] shadow-[0_0_30px_var(--accent-glow)]">
                  <Clock className="w-10 h-10 text-[var(--accent)] animate-pulse" />
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Coming Soon</h2>
                <p className="text-zinc-400 max-w-md mx-auto text-lg leading-relaxed">
                  We are building an ultra-sleek, built-in tip jar and subscription engine so you can monetize your audience directly.
                </p>
                <div className="mt-8">
                  <span className="inline-flex items-center px-4 py-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-bold uppercase tracking-widest">
                    In Development
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
