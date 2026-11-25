'use client';

import Link from 'next/link';
import { memo } from 'react';
import PieceVisual from './PieceVisual';
import { PinButton, Price } from './client-bits';
import type { LabItem } from '../schema';
import { cx, stockLabel } from '../utils/format';

/**
 * Props-driven, reusable card (INT252 Unit II). Wrapped in React.memo so the
 * grid can re-render (e.g. while typing a search) without re-rendering cards
 * whose `item` reference did not change (referential equality, Unit I).
 */

type Props = { item: LabItem; index?: number };

function ProductCard({ item, index = 0 }: Props) {
  const soldOut = item.quantity_available === 0;
  const low = !soldOut && item.quantity_available <= 2;

  return (
    <article className="lab-rise group" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      {/* Soft navigation: the @modal slot intercepts this and opens a quick view. */}
      <Link href={`/lab/collection/${item.id}`} scroll={false} className="block rounded-2xl">
        <div className="relative overflow-hidden rounded-2xl bg-lab-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-300 group-hover:shadow-[0_10px_30px_-12px_rgba(60,40,20,0.25)]">
          <PieceVisual item={item} className="aspect-[3/4] w-full" />

          <div className="absolute right-3 top-3">
            <PinButton item={item} />
          </div>

          {(soldOut || low) && (
            <span
              className={cx(
                'absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                soldOut ? 'bg-lab-ink text-lab-paper' : 'bg-lab-paper text-lab-accent',
              )}
            >
              {soldOut ? 'Sold out' : stockLabel(item)}
            </span>
          )}
        </div>

        <div className="px-0.5 pt-3">
          <h3 className="text-[15px] font-semibold leading-snug text-lab-ink">{item.name}</h3>
          <p className="mt-0.5 text-[13px] text-lab-muted">
            {item.material} · {item.origin.split(',')[0]}
          </p>
          <Price amount={item.price} className="mt-1 block text-[15px] tabular-nums text-lab-ink" />
        </div>
      </Link>
    </article>
  );
}

export default memo(ProductCard);
