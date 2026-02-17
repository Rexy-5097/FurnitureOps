'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-200">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        
        <h2 className="mb-2 text-xl font-bold text-gray-900">Something went wrong</h2>
        
        <p className="mb-6 text-sm text-gray-500">
            {error.message.length > 150 
                ? `${error.message.substring(0, 150)}...` 
                : error.message}
        </p>

        <button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
          className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
