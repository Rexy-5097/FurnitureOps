'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import StandaloneFrame from '@/features/lab/components/StandaloneFrame';
import { buttonClass } from '@/features/lab/components/StateViews';

/** Root error boundary: catches failures in layouts below the root. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <StandaloneFrame>
      <div className="max-w-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lab-danger">Something went wrong</p>
        <h1 className="mt-3 text-[clamp(3rem,6vw,4.6rem)]">
          We dropped
          <em className="block italic text-lab-accent">something heavy.</em>
        </h1>
        <p className="mt-6 text-[17px] leading-relaxed text-lab-muted">
          {error.message && error.message.length <= 150 ? error.message : 'An unexpected error stopped this page from loading.'}
        </p>
        {error.digest && <p className="mt-2 font-mono text-xs text-lab-muted">ref {error.digest}</p>}
        <div className="mt-10 flex flex-wrap gap-3">
          <button type="button" onClick={() => reset()} className={buttonClass.primary}>
            Try again
          </button>
          <Link href="/" className={buttonClass.ghost}>
            Back to home
          </Link>
        </div>
      </div>
    </StandaloneFrame>
  );
}
