import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { getIconForUrl } from "@/components/social-icons"
import { SpotifyPlayer } from "@/components/spotify-player"

type Props = {
  params: Promise<{ username: string }>
}

export default async function PublicProfile({ params }: Props) {
  const resolvedParams = await params
  
  let profile = null
  let links: any[] = []
  
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", resolvedParams.username)
      .single()

    if (error || !data) throw new Error("Not found")
    profile = data

    const { data: linksData } = await supabase
      .from("links")
      .select("*")
      .eq("profile_id", profile.id)
      .order("position", { ascending: true })
      
    links = linksData || []
  } catch (e) {
    if (resolvedParams.username === "johndoe") {
      profile = {
        id: "mock-id",
        username: "johndoe",
        display_name: "John Doe",
        bio: "Software Developer & Designer exploring the intersection of code and aesthetics.",
        avatar_url: "https://lh3.googleusercontent.com/a/ACg8ocKk9-63wXGg8pP6kG1g_lDqW9D2Q5Y8Z6T4Qz=s96-c",
        theme_color: "#10b981",
        bg_image_url: null, 
        particle_effect: "none",
        audio_url: null,
        stripe_account_id: "mock-stripe",
        views: 485,
      }
      links = [
        { id: "1", title: "My Portfolio", url: "https://example.com", link_type: "url" },
        { id: "2", title: "Twitter", url: "https://twitter.com/johndoe", link_type: "url" },
        { id: "3", title: "GitHub", url: "https://github.com/johndoe", link_type: "url" },
      ]
    } else {
      notFound()
    }
  }

  // Analytics View Increment Logic
  // Using a try-catch so it fails gracefully locally if offline/isp blocked
  try {
    if (profile.id !== "mock-id") {
      // In a real app we'd debounce this or use redis, but this works for our scale
      await supabase.rpc('increment_views', { profile_uuid: profile.id })
    }
  } catch (e) {
    console.error("Failed to increment view count", e)
  }

  const themeColor = profile.theme_color || "#8b5cf6"
  
  return (
    <div 
      className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col items-center py-20 px-4 relative overflow-hidden font-sans"
      style={{
        backgroundImage: profile.bg_image_url ? `url(${profile.bg_image_url})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --accent: ${themeColor};
          --accent-glow: ${themeColor}80;
        }
        @keyframes snow {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}} />

      {profile.bg_image_url && <div className="absolute inset-0 bg-black/60 pointer-events-none" />}

      {!profile.bg_image_url && (
        <>
          <div 
            className="fixed top-0 inset-x-0 h-[500px] pointer-events-none opacity-50"
            style={{ background: `linear-gradient(to bottom, var(--accent-glow), transparent)` }} 
          />
          <div 
            className="fixed top-1/4 right-1/4 w-96 h-96 rounded-full mix-blend-screen filter blur-[128px] pointer-events-none opacity-30"
            style={{ backgroundColor: 'var(--accent)' }}
          />
        </>
      )}
      
      {profile.particle_effect === "stars" && (
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 40px 70px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 50px 160px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 90px 40px, #ffffff, rgba(0,0,0,0))', backgroundRepeat: 'repeat', backgroundSize: '200px 200px', animation: 'snow 10s linear infinite' }} />
      )}
      {profile.particle_effect === "snow" && (
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(2px 2px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(2px 2px at 40px 70px, #ffffff, rgba(0,0,0,0)), radial-gradient(2px 2px at 50px 160px, #ffffff, rgba(0,0,0,0))', backgroundRepeat: 'repeat', backgroundSize: '150px 150px', animation: 'snow 6s linear infinite' }} />
      )}

      <div className="w-full max-w-lg flex flex-col items-center relative z-10 animate-fade-in-up">
        {profile.avatar_url ? (
          <img 
            src={profile.avatar_url} 
            alt={profile.display_name || profile.username} 
            className="w-28 h-28 rounded-full mb-6 border-4 border-[var(--accent)] object-cover"
            style={{ boxShadow: `0 0 40px var(--accent-glow)` }}
          />
        ) : (
          <div className="w-28 h-28 bg-zinc-800 rounded-full mb-6 border-4 border-zinc-700 shadow-2xl flex items-center justify-center text-3xl font-bold text-zinc-500">
            {profile.display_name?.[0]?.toUpperCase() || profile.username[0].toUpperCase()}
          </div>
        )}
        
        <h1 className="text-3xl font-extrabold text-white mb-3 text-center drop-shadow-lg">{profile.display_name || `@${profile.username}`}</h1>
        {profile.bio && (
          <p className="text-zinc-300 text-center mb-10 max-w-sm leading-relaxed drop-shadow-md">{profile.bio}</p>
        )}

        <div className="w-full space-y-4">
          {links.map((link) => (
            <a
              key={link.id}
              href={`/api/click?link_id=${link.id}&url=${encodeURIComponent(link.url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-5 bg-zinc-900/60 backdrop-blur-xl border border-zinc-700 hover:border-[var(--accent)] rounded-2xl shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <span
                className="font-bold text-lg transition-colors group-hover:text-[var(--accent)]"
                style={{ color: themeColor === '#ffffff' ? '#000000' : '#ffffff' }}
              >
                {link.title}
              </span>
              {getIconForUrl(link.url, "w-5 h-5 text-zinc-400 group-hover:text-[var(--accent)] transition-colors")}
            </a>
          ))}
        </div>

        {profile.audio_url && profile.audio_url.includes("spotify.com") && (
          <SpotifyPlayer audioUrl={profile.audio_url} />
        )}
      </div>
      
      <div className="mt-20 text-sm font-semibold text-zinc-500 hover:text-zinc-300 transition-colors relative z-10 drop-shadow-md">
        <a href="/" target="_blank" className="cursor-pointer">Built with LinkVault</a>
      </div>
    </div>
  )
}
