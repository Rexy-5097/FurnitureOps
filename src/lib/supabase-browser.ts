import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Client-side Supabase client for Browser only.
// Uses public ANON key. strictly for RLS-protected access.
// NEVER use service role key here.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

let browserClient: SupabaseClient<Database, 'public'> | null = null;

export function createBrowserClient(): SupabaseClient<Database, 'public'> {
  if (typeof window === 'undefined') {
    // Return a new client for server-side rendering to avoid sharing state
    // But this file is explicitly for browser usage per instructions.
    // We'll return a new instance anyway to be safe against accidental server usage leaking state.
    // However, the prompt says "Browser Only", so we should ideally check headers/cookies if we were doing SSR auth,
    // but the prompt demands using createClient from supabase-js.
    return createClient<Database, 'public'>(supabaseUrl, supabaseAnonKey);
  }

  if (!browserClient) {
    browserClient = createClient<Database, 'public'>(supabaseUrl, supabaseAnonKey, {
        auth: {
            flowType: 'pkce',
            persistSession: true, // Browser should persist session
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });
  }

  return browserClient;
}
