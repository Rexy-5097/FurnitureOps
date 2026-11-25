'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductCard from '@/features/lab/components/ProductCard';
import { Notice, buttonClass } from '@/features/lab/components/StateViews';
import { useDebounce, useNow } from '@/features/lab/hooks';
import { CATEGORY_LABELS } from '@/features/lab/categories';
import { CATEGORIES, type LabItem } from '@/features/lab/schema';
import { toStorefrontItem } from '@/features/store/map';
import type { InventoryItem } from '@/types/database';
import { cx } from '@/features/lab/utils/format';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'name', label: 'Name' },
] as const;

const SORTERS: Record<string, (a: LabItem, b: LabItem) => number> = {
  newest: (a, b) => b.created_at.localeCompare(a.created_at),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name),
};

async function fetchInventory({ signal }: { signal: AbortSignal }) {
  const res = await fetch('/api/inventory', { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not refresh stock (${res.status})`);
  return (await res.json()) as InventoryItem[];
}

export default function ShopView({ initialItems, live }: { initialItems: LabItem[]; live: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // The URL is the source of truth for filters, so every view can be shared.
  const category = params.get('category') ?? 'all';
  const sort = params.get('sort') ?? 'newest';
  const inStock = params.get('inStock') === '1';

  // Controlled search input; debounced into the URL.
  const [search, setSearch] = useState(params.get('q') ?? '');
  const q = useDebounce(search, 250);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      next.delete('focus');
      if (value === null || value === '' || value === 'all') next.delete(key);
      else next.set(key, value);
      router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false });
    },
    [params, pathname, router],
  );

  useEffect(() => {
    if ((params.get('q') ?? '') !== q) setParam('q', q);
  }, [q, params, setParam]);

  // Server state: seeded from the server render, then refreshed in the background.
  const { data: items = initialItems, isFetching, isError, dataUpdatedAt } = useQuery({
    queryKey: ['storefront', 'inventory'],
    queryFn: fetchInventory,
    select: (rows) => rows.map(toStorefrontItem),
    enabled: live, // dev sample data has no API behind it
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  // Derived state: filtering and sorting happen during render, nothing is stored.
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items
      .filter((it) =>
        needle ? [it.name, it.origin, CATEGORY_LABELS[it.category]].some((field) => field.toLowerCase().includes(needle)) : true,
      )
      .filter((it) => (category === 'all' ? true : it.category === category))
      .filter((it) => (inStock ? it.quantity_available > 0 : true))
      .toSorted(SORTERS[sort] ?? SORTERS.newest);
  }, [items, q, category, inStock, sort]);

  const presentCategories = useMemo(() => CATEGORIES.filter((c) => items.some((it) => it.category === c)), [items]);
  const now = useNow(5000);
  const syncedAgo = dataUpdatedAt ? Math.max(0, Math.round((now - dataUpdatedAt) / 1000)) : null;
  const filtersActive = Boolean(q || category !== 'all' || inStock);

  return (
    <div className="mt-10">
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
              autoFocus={params.get('focus') === 'search'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or origin"
              className="h-12 w-full rounded-full border border-lab-line bg-lab-surface pl-11 pr-4 text-sm text-lab-ink placeholder:text-lab-muted/70 focus:border-lab-ink focus:outline-none"
            />
          </label>

          <div role="group" aria-label="Category" className="lab-scroll-x -mx-1 flex gap-1 overflow-x-auto px-1">
            {(['all', ...presentCategories] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setParam('category', c)}
                className={cx(
                  'h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm transition-colors',
                  category === c ? 'bg-lab-forest text-lab-on-dark' : 'text-lab-muted hover:text-lab-ink',
                )}
              >
                {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
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

      <p aria-live="polite" className="flex items-center gap-2 py-6 text-xs text-lab-muted">
        <span className={cx('h-1.5 w-1.5 rounded-full', isFetching ? 'animate-pulse bg-lab-accent' : isError ? 'bg-lab-danger' : 'bg-lab-moss')} aria-hidden />
        {visible.length} piece{visible.length === 1 ? '' : 's'}
        {live && (isFetching ? ' · Syncing stock…' : isError ? ' · Showing the last known stock' : syncedAgo !== null ? ` · Synced ${syncedAgo}s ago` : '')}
      </p>

      {visible.length === 0 ? (
        <Notice
          title={items.length === 0 ? 'The floor is being restocked' : 'No pieces match'}
          action={
            filtersActive ? (
              <button
                type="button"
                className={buttonClass.ghost}
                onClick={() => {
                  setSearch('');
                  router.replace(pathname, { scroll: false });
                }}
              >
                Clear filters
              </button>
            ) : undefined
          }
        >
          {items.length === 0 ? 'Please check back soon.' : q ? `Nothing for “${q}”.` : 'Try another category or include sold-out pieces.'}
        </Notice>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((item, i) => (
            <ProductCard key={item.id} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
