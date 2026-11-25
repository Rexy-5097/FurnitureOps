'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';

/** Route-driven modal: closing it is just navigating back. */
export default function Modal({ children, label }: { children: ReactNode; label: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => router.back(), [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus(); // return focus to the card that opened the modal
    };
  }, [close]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" aria-label="Close quick view" onClick={close} className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="lab-rise relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-[28px] bg-lab-paper p-6 shadow-2xl outline-none sm:rounded-[28px] sm:p-10"
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-lab-line bg-lab-paper text-lab-ink hover:border-lab-ink"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
