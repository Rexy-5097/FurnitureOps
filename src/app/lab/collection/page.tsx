import type { Metadata } from 'next';
import { Suspense } from 'react';
import CollectionView from './CollectionView';
import { GridSkeleton } from '@/features/lab/components/StateViews';

export const metadata: Metadata = {
  title: 'Collection',
  description: 'Every piece on the FurnitureOps floor, with live stock.',
};

/** Server wrapper; the interactive grid is a Client Component (CSR + React Query). */
export default function CollectionPage() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 pt-12">
      <header className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lab-muted">The collection</p>
        <h1 className="mt-2 text-[3.2rem] leading-none sm:text-[4.2rem]">Everything on the floor</h1>
        <p className="mt-4 text-lab-muted">
          Filters live in the URL, so any view can be bookmarked or shared. Stock refreshes in the background.
        </p>
      </header>
      {/* useSearchParams() needs a Suspense boundary in the App Router. */}
      <Suspense fallback={<div className="mt-14"><GridSkeleton /></div>}>
        <CollectionView />
      </Suspense>
    </main>
  );
}
