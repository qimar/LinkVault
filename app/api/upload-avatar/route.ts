import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown"
    const { success } = await checkRateLimit(`upload_${ip}`)
    if (!success) {
      return NextResponse.json({ error: "Too many upload requests" }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, WebP, and GIF images are allowed" }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 })
    }

    const userId = (session.user as any).id
    const ext = file.name.split(".").pop() || "jpg"
    const fileName = `${userId}-${Date.now()}.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data, error } = await supabaseAdmin.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      console.error("Storage upload error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: publicData } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(data.path)

    return NextResponse.json({ url: publicData.publicUrl })
  } catch (err: any) {
    console.error("Upload error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
