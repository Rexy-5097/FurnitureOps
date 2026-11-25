import React from 'react';
import Image from 'next/image';
import { InventoryItem } from '@/types/database';

interface InventoryCardProps {
  item: InventoryItem;
  /** When set, the card is an "edit" button; otherwise it's read-only. */
  onClick?: () => void;
  /** Visual-search match score, 0–100. */
  similarity?: number | null;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: Number.isInteger(amount) ? 0 : 2 }).format(amount);

/** Studio card: same visual language as the storefront ProductCard, but opens the editor. */
export default function InventoryCard({ item, onClick, similarity = null }: InventoryCardProps) {
  const soldOut = item.quantity_available === 0;
  const low = !soldOut && item.quantity_available <= 2;

  const body = (
    <>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-lab-sand shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-300 group-hover:shadow-[0_10px_30px_-12px_rgba(60,40,20,0.25)]">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : null}

        <span
          className={
            'absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ' +
            (soldOut ? 'bg-lab-ink text-lab-paper' : low ? 'bg-lab-paper text-lab-accent' : 'bg-lab-paper/90 text-lab-ink')
          }
        >
          {soldOut ? 'Sold out' : `${item.quantity_available} in stock`}
        </span>

        {similarity !== null && (
          <span className="absolute right-3 top-3 rounded-full bg-lab-accent px-2.5 py-1 text-[11px] font-bold text-white">{similarity}% match</span>
        )}

        {onClick && (
          <span className="absolute bottom-3 right-3 rounded-full bg-lab-paper px-3 py-1.5 text-xs font-semibold text-lab-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            Edit
          </span>
        )}
      </div>

      <div className="px-0.5 pt-3 text-left">
        <h3 className="truncate text-[15px] font-semibold leading-snug text-lab-ink">{item.name}</h3>
        <p className="mt-0.5 truncate text-[13px] text-lab-muted">
          {item.origin || 'Origin not set'} · {item.quantity_sold} sold
        </p>
        <p className="mt-1 text-[15px] tabular-nums text-lab-ink">{formatCurrency(Number(item.price))}</p>
      </div>
    </>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className="group block w-full rounded-2xl" aria-label={`Edit ${item.name}`}>
      {body}
    </button>
  ) : (
    <div className="group">{body}</div>
  );
}
