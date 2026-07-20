"use server"

import { supabase } from "@/lib/supabase"
import type { Link, Profile } from "@/types"

export async function fetchDashboardDataAction(userId: string) {
  try {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return { profileData: null, linksData: [], clicksCount: 0 }
      }
      return { error: profileError.message }
    }

    const { data: linksData } = await supabase
      .from("links")
      .select("*")
      .eq("profile_id", profileData.id)
      .order("position", { ascending: true })

    const { count: clicksCount } = await supabase
      .from("clicks")
      .select("*", { count: "exact", head: true })

    return { 
      profileData, 
      linksData: linksData || [], 
      clicksCount: clicksCount || 0 
    }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function createProfileAction(userId: string, username: string, name: string | null | undefined, image: string | null | undefined) {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      user_id: userId,
      username: username,
      display_name: name || username,
      avatar_url: image,
      views: 0
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function addLinkAction(profileId: string, title: string, url: string, position: number) {
  const { data, error } = await supabase
    .from("links")
    .insert({
      profile_id: profileId,
      title,
      url,
      link_type: "url",
      position
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function updateLinkAction(id: string, title: string, url: string) {
  const { data, error } = await supabase
    .from("links")
    .update({ title, url })
    .eq("id", id)
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function deleteLinkAction(id: string) {
  const { error } = await supabase
    .from("links")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function reorderLinksAction(links: Link[]) {
  // We process these sequentially. In a high-traffic prod app, a bulk UPSERT would be better,
  // but this is extremely safe and reliable for our scale.
  for (const item of links) {
    const { error } = await supabase
      .from("links")
      .update({ position: item.position })
      .eq("id", item.id)

    if (error) return { error: error.message }
  }
  return { success: true }
}

export async function updateAppearanceAction(profileId: string, updates: Partial<Profile>) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", profileId)

  if (error) return { error: error.message }
  return { success: true }
}
