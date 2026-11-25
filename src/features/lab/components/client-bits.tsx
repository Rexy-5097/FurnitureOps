'use client';

import { memo } from 'react';
import { useMoodboard, selectIsPinned, type Pinned } from '../state/moodboard-store';
import { useSite } from '../state/site-context';
import { useHasHydrated } from '../hooks';
import { cx, formatPrice } from '../utils/format';

/** Price reads the global currency preference from Zustand. */
export const Price = memo(function Price({ amount, className }: { amount: number; className?: string }) {
  const { priceBase } = useSite();
  const currency = useMoodboard((s) => s.currency);
  const hydrated = useHasHydrated();
  // Server render uses the stored currency; after hydration we switch to the saved preference.
  return <span className={className}>{formatPrice(amount, hydrated ? currency : priceBase, priceBase)}</span>;
});

type PinProps = {
  item: Pinned;
  variant?: 'icon' | 'button';
};

/** Toggles a piece on the moodboard. Subscribes to one boolean, not the whole list. */
export function PinButton({ item, variant = 'icon' }: PinProps) {
  const hydrated = useHasHydrated();
  const pinned = useMoodboard(selectIsPinned(item.id)) && hydrated;
  const toggle = useMoodboard((s) => s.toggle);

  const label = pinned ? `Remove ${item.name} from moodboard` : `Save ${item.name} to moodboard`;

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={() => toggle(item)}
        aria-pressed={pinned}
        className={cx(
          'inline-flex h-12 items-center justify-center gap-2 rounded-full border px-6 text-sm font-medium transition-colors',
          pinned
            ? 'border-lab-accent bg-lab-accent text-white'
            : 'border-lab-line bg-transparent text-lab-ink hover:border-lab-ink',
        )}
      >
        <Heart filled={pinned} />
        {pinned ? 'On your moodboard' : 'Save to moodboard'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        // The card is a link; stop the click from navigating.
        e.preventDefault();
        e.stopPropagation();
        toggle(item);
      }}
      aria-pressed={pinned}
      aria-label={label}
      title={label}
      className={cx(
        'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
        pinned ? 'bg-lab-accent text-white' : 'bg-lab-paper text-lab-ink hover:bg-lab-sand',
      )}
    >
      <Heart filled={pinned} />
    </button>
  );
}

export function Heart({ filled }: { filled?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" strokeLinejoin="round" />
    </svg>
  );
}
