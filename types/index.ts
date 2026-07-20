export type Profile = {
  id: string
  user_id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  theme_color: string | null
  bg_image_url: string | null
  bg_video_url: string | null
  particle_effect: string | null
  custom_cursor: string | null
  audio_url: string | null
  audio_title: string | null
  audio_image: string | null
  stripe_account_id: string | null
  views: number | null
  created_at: string
}

export type Click = {
  id: string
  link_id: string
  profile_id: string
  referrer: string | null
  created_at: string
}

export type Link = {
  id: string
  profile_id: string
  title: string
  url: string
  link_type: "url" | "youtube" | "spotify"
  position: number
  created_at: string
}
