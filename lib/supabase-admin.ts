import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Ensure we use the service role key which bypasses RLS
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

// This client must ONLY be used on the server (API routes, Server Actions, Server Components)
export const supabaseAdmin = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
})
