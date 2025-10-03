import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
export const supabaseConfigError = new Error("Supabase credentials are not configured")

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn("Supabase environment variables are missing. Auth and persistence will be disabled.")
}

const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

export default supabase
