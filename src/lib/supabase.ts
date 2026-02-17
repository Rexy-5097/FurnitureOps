import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

let serviceClient: SupabaseClient<Database, 'public'> | null = null;

export function getServiceSupabase(): SupabaseClient<Database, 'public'> {
  if (!serviceClient) {
    serviceClient = createClient<Database, 'public'>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      // DEV ONLY: Bypass SSL for local Supabase Docker
      ...((process.env.NODE_ENV !== 'production' || process.env.BYPASS_SSL === 'true') && {
        global: {
          fetch: (url, options) => {
            return fetch(url, { ...options, referrerPolicy: 'no-referrer' } as any);
          }
        }
      })
    });
  }
  return serviceClient;
}
