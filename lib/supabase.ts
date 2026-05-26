import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazily created singleton — won't throw at import time, only when first used
let _db: SupabaseClient | undefined

export function db(): SupabaseClient {
  if (!_db) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error(
        'Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local'
      )
    }
    _db = createClient(url, key, { auth: { persistSession: false } })
  }
  return _db
}
