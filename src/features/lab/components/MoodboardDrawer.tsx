'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useMoodboard, selectTotal } from '../state/moodboard-store';
import { Price } from './client-bits';
import { titleCase } from '../utils/format';

/** Lazy-loaded side drawer driven entirely by the Zustand store. */
export default function MoodboardDrawer() {
  const pinned = useMoodboard((s) => s.pinned);
  const total = useMoodboard(selectTotal);
  const { remove, clear, setOpen } = useMoodboard.getState();
  const panelRef = useRef<HTMLDivElement>(null);

  // Effect with cleanup: Escape to close, lock page scroll, move focus in.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [setOpen]);

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close moodboard" className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="moodboard-title"
        className="lab-rise absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-lab-paper shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-lab-line px-6 py-5">
          <div>
            <h2 id="moodboard-title" className="font-display text-2xl">
              Moodboard
            </h2>
            <p className="text-xs text-lab-muted">Saved in this browser with Zustand + persist.</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-lab-line px-3 py-1.5 text-xs">
            Close
          </button>
        </div>

        {pinned.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <p className="font-display text-xl">Nothing saved yet</p>
            <p className="mt-2 text-sm text-lab-muted">Tap the heart on any piece to collect it here.</p>
            <Link href="/lab/collection" onClick={() => setOpen(false)} className="mt-6 text-sm underline underline-offset-4">
              Browse the collection
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-lab-line overflow-y-auto px-6">
              {pinned.map((p) => (
                <li key={p.id} className="flex items-center gap-4 py-4">
                  <span className="h-14 w-14 shrink-0 rounded-xl" style={{ backgroundColor: p.tone }} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <Link href={`/lab/collection/${p.id}`} onClick={() => setOpen(false)} className="block truncate font-display text-lg hover:underline">
                      {p.name}
                    </Link>
                    <p className="text-xs text-lab-muted">{titleCase(p.category)}</p>
                  </div>
                  <div className="text-right">
                    <Price amount={p.price} className="block text-sm tabular-nums" />
                    <button type="button" onClick={() => remove(p.id)} className="text-xs text-lab-muted hover:text-lab-danger">
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-lab-line px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-lab-muted">{pinned.length} pieces</span>
                <Price amount={total} className="font-display text-2xl tabular-nums" />
              </div>
              <button type="button" onClick={clear} className="mt-4 w-full rounded-full border border-lab-line py-2.5 text-sm hover:border-lab-ink">
                Clear moodboard
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
