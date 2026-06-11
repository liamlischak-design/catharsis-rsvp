import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(supabaseUrl, supabasePublishableKey)

export function getSupabaseAdmin() {
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!
  return createClient(supabaseUrl, supabaseSecretKey)
}
