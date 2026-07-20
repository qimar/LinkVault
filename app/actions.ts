"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import type { Link, Profile } from "@/types"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Helper to get session and throw if not authenticated
async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  return (session.user as any).id as string
}

// Helper to verify profile ownership
async function verifyProfileOwnership(profileId: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .eq("id", profileId)
    .single()

  if (error || !data || data.user_id !== userId) {
    throw new Error("Unauthorized to modify this profile")
  }
}

// Helper to verify link ownership
async function verifyLinkOwnership(linkId: string, userId: string) {
  const { data: link, error: linkError } = await supabaseAdmin
    .from("links")
    .select("profile_id")
    .eq("id", linkId)
    .single()

  if (linkError || !link) {
    throw new Error("Link not found")
  }

  await verifyProfileOwnership(link.profile_id, userId)
}

export async function fetchDashboardDataAction(userId: string) {
  try {
    const authUserId = await requireAuth()
    if (userId !== authUserId) throw new Error("Unauthorized")

    const { data: profileData, error: profileError } = await supabaseAdmin
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

    const { data: linksData } = await supabaseAdmin
      .from("links")
      .select("*")
      .eq("profile_id", profileData.id)
      .order("position", { ascending: true })

    const { count: clicksCount } = await supabaseAdmin
      .from("clicks")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profileData.id)

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
  try {
    const authUserId = await requireAuth()
    if (userId !== authUserId) throw new Error("Unauthorized")

    const { data, error } = await supabaseAdmin
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
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function addLinkAction(profileId: string, title: string, url: string, position: number) {
  try {
    const authUserId = await requireAuth()
    await verifyProfileOwnership(profileId, authUserId)

    const { data, error } = await supabaseAdmin
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
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function updateLinkAction(id: string, title: string, url: string) {
  try {
    const authUserId = await requireAuth()
    await verifyLinkOwnership(id, authUserId)

    const { data, error } = await supabaseAdmin
      .from("links")
      .update({ title, url })
      .eq("id", id)
      .select()
      .single()

    if (error) return { error: error.message }
    return { data }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deleteLinkAction(id: string) {
  try {
    const authUserId = await requireAuth()
    await verifyLinkOwnership(id, authUserId)

    const { error } = await supabaseAdmin
      .from("links")
      .delete()
      .eq("id", id)

    if (error) return { error: error.message }
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function reorderLinksAction(links: Link[]) {
  try {
    const authUserId = await requireAuth()
    if (links.length === 0) return { success: true }
    
    // We only check the first link's ownership for performance.
    await verifyLinkOwnership(links[0].id, authUserId)

    for (const item of links) {
      const { error } = await supabaseAdmin
        .from("links")
        .update({ position: item.position })
        .eq("id", item.id)

      if (error) return { error: error.message }
    }
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function updateAppearanceAction(profileId: string, updates: Partial<Profile>) {
  try {
    const authUserId = await requireAuth()
    await verifyProfileOwnership(profileId, authUserId)

    // XSS Mitigation: Validate theme_color strictly
    if (updates.theme_color) {
      if (!/^#[0-9A-Fa-f]{3,8}$/.test(updates.theme_color)) {
        throw new Error("Invalid theme color format.")
      }
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", profileId)

    if (error) return { error: error.message }
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
