'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductCard from '@/features/lab/components/ProductCard';
import { GridSkeleton, Notice, buttonClass } from '@/features/lab/components/StateViews';
import { useDebounce, useNow } from '@/features/lab/hooks';
import { useLabInventory, type InventoryFilters } from '@/features/lab/hooks/use-lab-inventory';
import { CATEGORIES } from '@/features/lab/schema';
import { cx } from '@/features/lab/utils/format';

const COLLECTION_PATH = '/lab/collection';
let lastCollectionQuery = '';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'name', label: 'Name' },
];

export default function CollectionView() {
  const router = useRouter();
  const pathname = usePathname();
  const liveParams = useSearchParams();
  const onCollection = pathname === COLLECTION_PATH;

  // While the quick-view modal is open the URL is /lab/collection/[id], which has
  // no filters. Keep the last collection params so the grid underneath stays put.
  // (Module-level memo, because the view can remount when the modal opens.)
  const [params, setParams] = useState(() => (onCollection ? liveParams : new URLSearchParams(lastCollectionQuery)));
  useEffect(() => {
    if (!onCollection) return;
    lastCollectionQuery = liveParams.toString();
    setParams(liveParams);
  }, [liveParams, onCollection]);

  // The URL is the source of truth for filters (query parameter handling).
  const category = params.get('category') ?? 'all';
  const sort = params.get('sort') ?? 'newest';
  const inStock = params.get('inStock') === '1';

  // Controlled search input: local state for instant typing, debounced into the URL.
  const [search, setSearch] = useState(params.get('q') ?? '');
  const q = useDebounce(search, 300);

  // Lab-only switches to exercise loading / error / background-sync states.
  const [sim, setSim] = useState({ delay: 0, fail: false, live: true });

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === '' || value === 'all') next.delete(key);
      else next.set(key, value);
      router.replace(`${COLLECTION_PATH}${next.size ? `?${next}` : ''}`, { scroll: false });
    },
    [params, router],
  );

  // Sync debounced search into the URL (side effect with dependency array).
  useEffect(() => {
    if (onCollection && (params.get('q') ?? '') !== q) setParam('q', q);
  }, [q, params, setParam, onCollection]);

  const filters: InventoryFilters = useMemo(
    () => ({ q, category, sort, inStock, delay: sim.delay, fail: sim.fail }),
    [q, category, sort, inStock, sim.delay, sim.fail],
  );

  const { data, isPending, isError, error, isFetching, dataUpdatedAt, refetch, isPlaceholderData } = useLabInventory(filters, {
    live: sim.live,
  });

  // Derived state: computed from data during render, never stored in state.
  const priceRange = useMemo(() => {
    if (!data?.items.length) return null;
    const prices = data.items.map(({ price }) => price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [data]);

  const now = useNow(1000);
  const syncedAgo = dataUpdatedAt ? Math.max(0, Math.round((now - dataUpdatedAt) / 1000)) : null;
  const filtersActive = q || category !== 'all' || inStock;

  return (
    <div className="mt-10">
      {/* Toolbar */}
      <div className="z-30 -mx-4 border-b border-lab-line bg-lab-paper/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8 lg:sticky lg:top-[72px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <label className="relative flex-1 lg:max-w-sm">
            <span className="sr-only">Search pieces</span>
            <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lab-muted" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              autoFocus={params.get("focus") === "search" || liveParams.get("focus") === "search"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, origin or material"
              className="h-12 w-full rounded-full border border-lab-line bg-lab-surface pl-11 pr-4 text-sm text-lab-ink placeholder:text-lab-muted/70 focus:border-lab-ink focus:outline-none"
            />
          </label>

          <div role="group" aria-label="Category" className="-mx-1 flex gap-1 overflow-x-auto px-1">
            {['all', ...CATEGORIES].map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setParam('category', c)}
                className={cx(
                  'h-9 shrink-0 rounded-full px-4 text-sm capitalize transition-colors',
                  category === c ? 'bg-lab-forest text-lab-on-dark' : 'text-lab-muted hover:text-lab-ink',
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 lg:ml-auto">
            <label className="flex items-center gap-2 text-sm text-lab-muted">
              <input type="checkbox" checked={inStock} onChange={(e) => setParam('inStock', e.target.checked ? '1' : null)} className="h-4 w-4 accent-[rgb(var(--lab-accent))]" />
              In stock
            </label>
            <label>
              <span className="sr-only">Sort</span>
              <select value={sort} onChange={(e) => setParam('sort', e.target.value)} className="h-9 rounded-full border border-lab-line bg-transparent px-3 text-sm">
                {SORTS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Status line + lab switches */}
      <div className="flex flex-col gap-3 py-6 text-xs text-lab-muted sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="flex items-center gap-2">
          <span className={cx('h-1.5 w-1.5 rounded-full', isFetching ? 'animate-pulse bg-lab-accent' : 'bg-lab-moss')} aria-hidden />
          {isFetching ? 'Syncing stock…' : syncedAgo !== null ? `Synced ${syncedAgo}s ago` : 'Waiting'}
          {data && ` · ${data.count} piece${data.count === 1 ? '' : 's'}`}
          {priceRange && data!.count > 1 && ` · ₹${priceRange.min.toLocaleString('en-IN')}–${priceRange.max.toLocaleString('en-IN')}`}
        </p>
        <details className="group sm:text-right">
          <summary className="cursor-pointer list-none select-none hover:text-lab-ink">Lab switches ▾</summary>
          <div className="mt-3 flex flex-wrap gap-4 sm:justify-end">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={sim.delay > 0} onChange={(e) => setSim((s) => ({ ...s, delay: e.target.checked ? 1200 : 0 }))} />
              Slow network (1.2 s)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={sim.fail} onChange={(e) => setSim((s) => ({ ...s, fail: e.target.checked }))} />
              Fail requests (503)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={sim.live} onChange={(e) => setSim((s) => ({ ...s, live: e.target.checked }))} />
              Background sync every 10 s
            </label>
          </div>
        </details>
      </div>

      {/* Loading → error → empty → grid */}
      {isPending ? (
        <GridSkeleton />
      ) : isError ? (
        <Notice
          tone="danger"
          title="We couldn't reach the showroom"
          action={
            <button type="button" className={buttonClass.primary} onClick={() => refetch()}>
              Retry
            </button>
          }
        >
          {error.message}. Turn off “Fail requests” in Lab switches, then retry.
        </Notice>
      ) : data.items.length === 0 ? (
        <Notice
          title="No pieces match"
          action={
            filtersActive ? (
              <button
                type="button"
                className={buttonClass.ghost}
                onClick={() => {
                  setSearch('');
                  router.replace(COLLECTION_PATH, { scroll: false });
                }}
              >
                Clear filters
              </button>
            ) : undefined
          }
        >
          {q ? `Nothing for “${q}”.` : 'Try another room or include sold-out pieces.'}
        </Notice>
      ) : (
        <div className={cx('grid grid-cols-2 gap-x-4 gap-y-8 transition-opacity md:grid-cols-3 lg:grid-cols-4', isPlaceholderData && 'opacity-60')}>
          {data.items.map((item, i) => (
            <ProductCard key={item.id} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
