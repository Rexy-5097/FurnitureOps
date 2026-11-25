import type { Metadata } from 'next';
import { signInAction } from '@/features/lab/actions';
import { ROLE_COPY, ROLES } from '@/features/lab/auth';
import { getLabRole } from '@/features/lab/session';
import { cx } from '@/features/lab/utils/format';

export const metadata: Metadata = { title: 'Sign in' };

/**
 * Session management with an httpOnly cookie set by a Server Action
 * (INT257 Unit IV). The form works even before JavaScript loads.
 */
export default function SignInPage({ searchParams }: { searchParams: { next?: string; denied?: string } }) {
  const current = getLabRole();
  const next = searchParams.next?.startsWith('/lab') ? searchParams.next : '/lab/studio';

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-16 sm:px-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-lab-accent">Lab session</p>
      <h1 className="mt-4 font-display text-[3.2rem] leading-none">Choose who you are today</h1>
      <p className="mt-4 max-w-xl text-lab-muted">
        The lab uses a mock session so role-based access can be tested without real accounts. Production keeps its
        Supabase sign-in.
      </p>

      {searchParams.denied && (
        <p role="alert" className="mt-8 rounded-2xl border border-lab-danger/30 bg-lab-danger/5 px-5 py-4 text-sm text-lab-danger">
          The <strong>{searchParams.denied}</strong> role can&apos;t open the studio. Pick staff or admin.
        </p>
      )}

      <form action={signInAction} className="mt-10 grid gap-4 sm:grid-cols-3">
        <input type="hidden" name="next" value={next} />
        {ROLES.map((role) => (
          <button
            key={role}
            type="submit"
            name="role"
            value={role}
            className={cx(
              'group flex flex-col items-start rounded-[22px] border p-6 text-left transition-all hover:-translate-y-0.5 hover:border-lab-ink hover:shadow-lg',
              current === role ? 'border-lab-ink bg-lab-surface' : 'border-lab-line',
            )}
          >
            <span className="font-display text-2xl">{ROLE_COPY[role].title}</span>
            <span className="mt-2 text-sm leading-relaxed text-lab-muted">{ROLE_COPY[role].blurb}</span>
            <span className="mt-6 text-xs font-medium text-lab-accent">
              {current === role ? 'Current session' : 'Continue as ' + role + ' →'}
            </span>
          </button>
        ))}
      </form>
    </main>
  );
}
