// ABOUTME: Supabase client configuration for browser-side usage
// ABOUTME: Provides typed client with auth and database access

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
