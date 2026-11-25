'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import craft from '../../../../public/images/craftsmanship.png';
import { CONTAINER } from '@/features/lab/components/StateViews';

/* ── Google Logo SVG ── */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

// Loaded on demand: lib/supabase-browser throws at import when env vars are missing,
// which would otherwise take the whole page down in local previews.
const getSupabase = async () => (await import('@/lib/supabase-browser')).createBrowserClient();

const field =
  'mt-2 block h-12 w-full rounded-xl border border-lab-line bg-lab-surface px-4 text-[15px] text-lab-ink placeholder:text-lab-muted/60 transition-colors focus:border-lab-ink focus:outline-none disabled:opacity-60';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const supabase = await getSupabase();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        // Straight to the dashboard: detectSessionInUrl exchanges the PKCE code there.
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (authError) throw authError;
    } catch (err) {
      setError((err as Error).message || 'Google sign-in is unavailable right now.');
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = await getSupabase();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      window.location.href = '/dashboard';
    } catch (err) {
      setError((err as Error).message || 'Sign-in is unavailable right now.');
      setLoading(false);
    }
  };

  const busy = loading || googleLoading;

  return (
    <main className={`${CONTAINER} pt-10 sm:pt-16`}>
      <div className="grid overflow-hidden rounded-[28px] bg-lab-surface shadow-[0_20px_60px_-30px_rgba(60,40,20,0.35)] lg:grid-cols-2">
        <div className="relative hidden min-h-[560px] lg:block">
          <Image src={craft} alt="A walnut slab table in the workshop" fill placeholder="blur" sizes="50vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-0 p-10 text-lab-on-dark">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-75">The studio</p>
            <p className="mt-3 font-display text-[2.6rem] leading-[1.05]">
              Where the floor
              <em className="block italic">is kept honest.</em>
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lab-muted">Staff sign-in</p>
          <h1 className="mt-2 text-[3rem] leading-none">Welcome back</h1>
          <p className="mt-3 text-[15px] text-lab-muted">Sign in to manage stock, prices and photos.</p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={busy}
            className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-full border border-lab-line bg-white text-[15px] font-semibold text-[#292725] transition-colors hover:border-lab-ink disabled:opacity-60"
          >
            {googleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
            Continue with Google
          </button>

          <div className="my-7 flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-lab-muted">
            <span className="h-px flex-1 bg-lab-line" />
            or with email
            <span className="h-px flex-1 bg-lab-line" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <label className="block text-sm font-semibold">
              Email address
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                placeholder="you@furnitureops.com"
                className={field}
              />
            </label>
            <label className="block text-sm font-semibold">
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                placeholder="••••••••"
                className={field}
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-lab-forest text-[15px] font-semibold text-lab-on-dark transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p aria-live="assertive" className="mt-4 min-h-[1.25rem] text-sm text-lab-danger">
            {error}
          </p>

          <p className="mt-6 text-sm text-lab-muted">
            Just browsing?{' '}
            <Link href="/shop" className="font-semibold text-lab-ink underline underline-offset-4">
              Shop the collection
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
