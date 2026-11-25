'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { CONTAINER, Notice, buttonClass } from '@/features/lab/components/StateViews';
import { useAdminSession } from './admin';

/**
 * Admin pages render only for a signed-in session. Whether that session is an
 * *admin* is decided by the API (403), which each page handles; this gate just
 * avoids showing an empty console to signed-out visitors.
 */
export default function AdminGate({ children }: { children: (session: Session) => ReactNode }) {
  const state = useAdminSession();

  if (state.status === 'loading') {
    return (
      <div className={`${CONTAINER} pt-12`} aria-busy="true">
        <div className="h-3 w-20 animate-pulse rounded bg-lab-line/70" />
        <div className="mt-4 h-14 w-72 animate-pulse rounded bg-lab-line/70" />
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-lab-line/50" />
          ))}
        </div>
      </div>
    );
  }

  if (state.status === 'signed-out') {
    return (
      <div className={`${CONTAINER} py-24`}>
        <Notice
          title="Admins only"
          action={
            <Link href="/login" className={buttonClass.primary}>
              Sign in
            </Link>
          }
        >
          Sign in with an admin account to open the console.
        </Notice>
      </div>
    );
  }

  return <>{children(state.session)}</>;
}

/** Shown when the API says the signed-in user is not an admin. */
export function NotAdminNotice() {
  return (
    <Notice
      tone="danger"
      title="This account isn't an admin"
      action={
        <Link href="/dashboard" className={buttonClass.ghost}>
          Back to the studio
        </Link>
      }
    >
      Ask an existing admin to add you, then sign in again.
    </Notice>
  );
}
