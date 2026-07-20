"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SortableList } from "@/components/sortable-list"
import { LinkForm } from "@/components/link-form"
import type { Link, Profile } from "@/types"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { LogOut, ExternalLink, Plus, PaintBucket, Link2, BarChart3, DollarSign, Clock } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [links, setLinks] = useState<Link[]>([])
  const [analyticsData, setAnalyticsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [usernameInput, setUsernameInput] = useState("")
  const [activeTab, setActiveTab] = useState<"links" | "appearance" | "analytics" | "monetize">("links")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/")
    if (status === "authenticated" && session?.user) {
      loadData()
    }
  }, [status, session])

  const loadData = async () => {
    try {
      const userId = (session?.user as any).id
      
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, show creation screen
          setLoading(false)
        } else {
          console.error("Supabase error:", error)
          alert("Database error: " + error.message)
          setLoading(false)
        }
        return
      }

      if (profileData) {
        setProfile(profileData)
        const { data: linksData } = await supabase
          .from("links")
          .select("*")
          .eq("profile_id", profileData.id)
          .order("position", { ascending: true })
          
        if (linksData) setLinks(linksData)

        // Try fetching real clicks
        const { data: clicksData } = await supabase
          .from("clicks")
          .select("*")
          
        const chart = [
          { name: 'Today', views: profileData.views || 0, clicks: clicksData?.length || 0 }
        ]
        setAnalyticsData(chart)
        setLoading(false)
        return
      }
    } catch (e) {
      console.error("Failed to load data:", e)
      setLoading(false)
    }
  }

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        user_id: (session?.user as any).id,
        username: usernameInput.toLowerCase().replace(/[^a-z0-9]/g, ""),
        display_name: session?.user?.name,
        avatar_url: session?.user?.image,
        views: 0
      })
      .select()
      .single()
      
    if (error) {
      alert("Failed to create profile: " + error.message)
      return
    }
    
    if (data) {
      setProfile(data)
    }
  }

  const handleAddLink = async (data: { title: string, url: string }) => {
    if (!profile) return
    const { data: newLink, error } = await supabase
      .from("links")
      .insert({
        profile_id: profile.id,
        ...data,
        link_type: "url",
        position: links.length
      })
      .select()
      .single()
      
    if (error) {
      alert("Failed to add link: " + error.message)
      return
    }
      
    if (newLink) {
      setLinks([...links, newLink])
      setShowAddForm(false)
    }
  }

  const handleEditLink = async (data: { id: string, title: string, url: string }) => {
    const { data: updated, error } = await supabase
      .from("links")
      .update({ title: data.title, url: data.url })
      .eq("id", data.id)
      .select()
      .single()
      
    if (error) {
      alert("Failed to update link: " + error.message)
      return
    }
      
    if (updated) {
      setLinks(links.map(l => l.id === updated.id ? updated : l))
    }
  }

  const handleDeleteLink = async (id: string) => {
    const { error } = await supabase.from("links").delete().eq("id", id)
    if (error) {
      alert("Failed to delete link: " + error.message)
      return
    }
    setLinks(links.filter(l => l.id !== id))
  }

  const handleReorder = async (newItems: Link[]) => {
    // Optimistic update
    setLinks(newItems)
    
    for (const item of newItems) {
      const { error } = await supabase.from("links").update({ position: item.position }).eq("id", item.id)
      if (error) {
        console.error("Failed to reorder link:", error.message)
      }
    }
  }

  const handleUpdateAppearance = async (updates: Partial<Profile>) => {
    if (!profile) return
    // Optimistic update for snappy UI
    const newProfile = { ...profile, ...updates }
    setProfile(newProfile as any)
    
    const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id)
    if (error) {
      alert("Failed to save appearance: " + error.message)
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
          
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-[var(--accent)] relative z-10" />
          ) : (
            <div className="w-24 h-24 bg-zinc-800 rounded-full border-4 border-zinc-700 relative z-10" />
          )}
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
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'links' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
          >
            <Link2 className="w-5 h-5" /> Links
          </button>
          <button 
            onClick={() => setActiveTab("appearance")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'appearance' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
          >
            <PaintBucket className="w-5 h-5" /> Appearance
          </button>
          <button 
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'analytics' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
          >
            <BarChart3 className="w-5 h-5" /> Analytics
          </button>
          <button 
            onClick={() => setActiveTab("monetize")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${activeTab === 'monetize' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
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
                  className="w-full bg-[var(--accent)] text-white py-5 rounded-2xl font-bold transition-colors mb-12 shadow-[0_0_20px_var(--accent-glow)] flex items-center justify-center gap-2 cursor-pointer hover:opacity-90"
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

                  {/* Particle Effects */}
                  <div className="pt-4 border-t border-zinc-800">
                    <label className="block text-sm font-semibold text-zinc-300 mb-3">Particle Effects</label>
                    <div className="grid grid-cols-3 gap-4">
                      {["none", "stars", "snow"].map(effect => (
                        <button
                          key={effect}
                          onClick={() => handleUpdateAppearance({ particle_effect: effect })}
                          className={`py-3 px-4 rounded-xl font-bold cursor-pointer transition-colors ${profile.particle_effect === effect ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_var(--accent-glow)]' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
                        >
                          {effect.charAt(0).toUpperCase() + effect.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Custom Audio */}
                  <div className="pt-4 border-t border-zinc-800">
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">Background Audio URL (Optional)</label>
                    <input
                      type="url"
                      value={profile.audio_url || ""}
                      onChange={e => handleUpdateAppearance({ audio_url: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent)] outline-none text-white placeholder-zinc-600 transition-shadow"
                      placeholder="Spotify embed link or raw mp3"
                    />
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
