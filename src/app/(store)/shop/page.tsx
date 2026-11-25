import type { Metadata } from 'next';
import { Suspense } from 'react';
import ShopView from './ShopView';
import SourceNotice from '@/features/store/SourceNotice';
import { getStorefrontInventory } from '@/features/store/inventory';
import { CONTAINER, GridSkeleton } from '@/features/lab/components/StateViews';

export const metadata: Metadata = {
  title: 'Shop all',
  description: 'Every piece on the FurnitureOps floor, with live stock.',
};

export const dynamic = 'force-dynamic';

/**
 * Server-rendered first paint (good for SEO and slow phones), then the client
 * takes over: React Query re-syncs stock in the background.
 */
export default async function ShopPage() {
  const { items, source } = await getStorefrontInventory();

  return (
    <>
      <SourceNotice source={source} />
      <main className={`${CONTAINER} pt-12`}>
        <header className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lab-muted">The collection</p>
          <h1 className="mt-2 text-[3.2rem] leading-none sm:text-[4.2rem]">Everything on the floor</h1>
          <p className="mt-4 text-lab-muted">Search, filter and sort every piece. Stock counts refresh while you browse.</p>
        </header>
        {/* useSearchParams() needs a Suspense boundary in the App Router. */}
        <Suspense fallback={<div className="mt-14"><GridSkeleton /></div>}>
          <ShopView initialItems={items} live={source === 'live'} />
        </Suspense>
      </main>
    </>
  );
}
