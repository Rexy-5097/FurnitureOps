import PieceVisual from './PieceVisual';
import { PinButton, Price } from './client-bits';
import type { LabItem } from '../schema';
import { cx, formatDate, stockLabel, titleCase } from '../utils/format';

/**
 * Shared by the full detail page and the intercepted quick-view modal
 * (component composition: same content, two different containers).
 */
export default function PieceDetail({ item, compact = false }: { item: LabItem; compact?: boolean }) {
  const soldOut = item.quantity_available === 0;
  const specs: Array<[string, string]> = [
    ['Category', titleCase(item.category)],
    ['Material', item.material],
    ['Origin', item.origin],
    ['Availability', stockLabel(item)],
    ['Sold to date', `${item.quantity_sold} units`],
    ['Listed', formatDate(item.created_at)],
  ];

  return (
    <div className={cx('grid gap-10', compact ? 'md:grid-cols-2' : 'lg:grid-cols-12 lg:gap-16')}>
      <PieceVisual
        item={item}
        priority
        sizes="(max-width: 1024px) 100vw, 55vw"
        className={cx('w-full rounded-[24px]', compact ? 'aspect-square' : 'aspect-[4/5] lg:col-span-7')}
      />

      <div className={cx('flex flex-col', !compact && 'lg:col-span-5 lg:pt-6')}>
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-lab-accent">{item.origin}</p>
        <h1 className={cx('mt-4 font-display leading-none', compact ? 'text-[2.8rem]' : 'text-[3.2rem] sm:text-[4.2rem]')}>
          {item.name}
        </h1>
        <Price amount={item.price} className="mt-6 block font-display text-[2.4rem] leading-none tabular-nums" />
        {item.description && <p className="mt-6 max-w-prose text-[16px] leading-relaxed text-lab-muted">{item.description}</p>}

        <div className="mt-8 flex flex-wrap gap-3">
          <PinButton item={item} variant="button" />
          <span
            className={cx(
              'inline-flex h-12 items-center rounded-full px-5 text-sm',
              soldOut ? 'bg-lab-danger/10 text-lab-danger' : 'bg-lab-moss/10 text-lab-moss',
            )}
          >
            {stockLabel(item)}
          </span>
        </div>

        <dl className="mt-10 divide-y divide-lab-line border-y border-lab-line text-sm">
          {specs.map(([term, value]) => (
            <div key={term} className="flex justify-between gap-6 py-3">
              <dt className="text-lab-muted">{term}</dt>
              <dd className="text-right">{value}</dd>
            </div>
          ))}
        </dl>

        {compact && (
          // A plain <a> does a hard navigation, which bypasses the intercepting route.
          <a href={`/lab/collection/${item.id}`} className="mt-8 text-sm underline underline-offset-4">
            Open full page →
          </a>
        )}
      </div>
    </div>
  );
}
