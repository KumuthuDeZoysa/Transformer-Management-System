import { createClient } from '@supabase/supabase-js'

// Client for browser usage (uses public anon key). Use only safe operations with RLS enforced.
export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return createClient(supabaseUrl, supabaseKey)
}

// Server-side client. For now we also use anon key; for privileged ops consider service role via server env.
export const createServerClient = () => {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) as string
  const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY) as string
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE URL or ANON KEY for server client')
  }
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })
}

// Server-side admin client for privileged operations (bypasses RLS). Use only in server code.
export const createAdminClient = () => {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) as string
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined
  const keyToUse = serviceRole || (process.env.SUPABASE_ANON_KEY as string) || (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string)
  if (!supabaseUrl || !keyToUse) {
    throw new Error('Missing SUPABASE URL or KEY for admin client')
  }
  return createClient(supabaseUrl, keyToUse, { auth: { persistSession: false } })
}
