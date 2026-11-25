'use client';

import { useEffect } from 'react';
import { Notice, buttonClass } from '@/features/lab/components/StateViews';

/** Error UI for the lab segment (INT257 Unit I) with basic error logging (Unit V). */
export default function LabError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // In production this is where Sentry / a log drain would be called.
    console.error('[lab] render error', { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 py-24">
      <Notice
        tone="danger"
        title="This room didn't load"
        action={
          <button type="button" onClick={reset} className={buttonClass.primary}>
            Try again
          </button>
        }
      >
        {error.message || 'Something went wrong while rendering this page.'}
        {error.digest && <p className="mt-2 font-mono text-xs">ref {error.digest}</p>}
      </Notice>
    </div>
  );
}
