import Link from 'next/link';
import type { ReactNode } from 'react';
import { CONTAINER } from './StateViews';

/**
 * Minimal branded frame for screens that render outside the site layouts:
 * the global 404, the root loading state and the root error boundary.
 */
export default function StandaloneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="lab-root flex min-h-screen flex-col bg-lab-paper font-body text-lab-ink antialiased">
      <div className="h-9 bg-lab-forest" aria-hidden />
      <header className="border-b border-lab-line/70">
        <div className={`${CONTAINER} flex h-[72px] items-center`}>
          <Link href="/" className="font-brand text-[1.95rem] leading-none">
            FurnitureOps
          </Link>
        </div>
      </header>
      <main className={`${CONTAINER} flex flex-1 items-center py-16`}>{children}</main>
    </div>
  );
}
