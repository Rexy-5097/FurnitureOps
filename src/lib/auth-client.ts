import { createBrowserClient } from '@/lib/supabase-browser';

export async function getSession() {
  const supabase = createBrowserClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Auth check failed', error);
    return null;
  }
  
  return session;
}

export async function isAuthenticated() {
    const session = await getSession();
    return !!session;
}
