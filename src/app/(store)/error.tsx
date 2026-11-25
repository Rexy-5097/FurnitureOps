'use client';

import { useEffect } from 'react';
import { CONTAINER, Notice, buttonClass } from '@/features/lab/components/StateViews';

/** Error UI for live store pages. */
export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[store] render error', { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className={`${CONTAINER} py-24`}>
      <Notice
        tone="danger"
        title="Something went wrong"
        action={
          <button type="button" onClick={reset} className={buttonClass.primary}>
            Try again
          </button>
        }
      >
        This page didn&apos;t load. Please try again in a moment.
        {error.digest && <span className="mt-2 block font-mono text-xs">ref {error.digest}</span>}
      </Notice>
    </div>
  );
}
