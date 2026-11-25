import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PieceDetail from '@/features/lab/components/PieceDetail';
import ProductCard from '@/features/lab/components/ProductCard';
import { getItem, listItems } from '@/features/lab/data/store';
import { SEED_ITEMS } from '@/features/lab/data/seed';

/**
 * Dynamic route /lab/collection/[id] (INT257 Unit I).
 * SSG for known ids via generateStaticParams, ISR via revalidate, and new ids
 * created in the studio are rendered on demand (dynamicParams defaults to true).
 */
export const revalidate = 60;

export function generateStaticParams() {
  return SEED_ITEMS.map(({ id }) => ({ id }));
}

type Props = { params: { id: string } };

// Per-page metadata for SEO (Metadata API, INT257 Unit V).
export function generateMetadata({ params }: Props): Metadata {
  const item = getItem(params.id);
  if (!item) return { title: 'Piece not found' };
  return {
    title: item.name,
    description: item.description || `${item.name} in ${item.material}, made in ${item.origin}.`,
    openGraph: { title: item.name, images: item.image_url ? [item.image_url] : undefined },
  };
}

export default function PiecePage({ params }: Props) {
  const item = getItem(params.id);
  if (!item) notFound();

  const related = listItems({ category: item.category })
    .filter(({ id }) => id !== item.id)
    .slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 pt-8">
      <nav aria-label="Breadcrumb" className="mb-10 text-sm text-lab-muted">
        <ol className="flex gap-2">
          <li>
            <Link href="/lab" className="hover:text-lab-ink">Lab</Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/lab/collection" className="hover:text-lab-ink">Collection</Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="truncate text-lab-ink">{item.name}</li>
        </ol>
      </nav>

      <PieceDetail item={item} />

      {related.length > 0 && (
        <section className="mt-28">
          <h2 className="mb-10 font-display text-[2.8rem] leading-none">Pairs well with</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {related.map((r, i) => (
              <ProductCard key={r.id} item={r} index={i} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
