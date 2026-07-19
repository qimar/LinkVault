import type { Metadata, ResolvingMetadata } from "next"
import { supabase } from "@/lib/supabase"

type Props = {
  params: Promise<{ username: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params
  const username = resolvedParams.username
  
  // fetch data
  let profile = null
  
  try {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single()
      
    if (data) profile = data
  } catch (e) {
    // ignore
  }

  // Fallback if not found or network error (for local dev)
  if (!profile && username === "johndoe") {
    profile = {
      display_name: "John Doe",
      bio: "Software Developer & Designer exploring the intersection of code and aesthetics.",
      avatar_url: "https://lh3.googleusercontent.com/a/ACg8ocKk9-63wXGg8pP6kG1g_lDqW9D2Q5Y8Z6T4Qz=s96-c"
    }
  }

  const title = profile?.display_name ? `${profile.display_name} | LinkVault` : `@${username} | LinkVault`
  const description = profile?.bio || "Check out my links on LinkVault."
  const image = profile?.avatar_url || "https://linkvault.com/default-og.png" // fallback image

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://linkvault.com/${username}`,
      siteName: 'LinkVault',
      images: [
        {
          url: image,
          width: 800,
          height: 600,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
