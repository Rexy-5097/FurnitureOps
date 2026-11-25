import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PieceDetail from '@/features/lab/components/PieceDetail';
import ProductCard from '@/features/lab/components/ProductCard';
import { CONTAINER } from '@/features/lab/components/StateViews';
import { getStorefrontInventory, getStorefrontItem } from '@/features/store/inventory';

export const dynamic = 'force-dynamic';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { item } = await getStorefrontItem(decodeURIComponent(params.id));
  if (!item) return { title: 'Piece not found' };
  return {
    title: item.name,
    description: `${item.name}${item.origin ? `, made in ${item.origin}` : ''}. ${item.quantity_available > 0 ? 'In stock now.' : 'Currently sold out.'}`,
    openGraph: { title: item.name, images: item.image_url ? [item.image_url] : undefined },
  };
}

export default async function PiecePage({ params }: Props) {
  const id = decodeURIComponent(params.id);
  const { items } = await getStorefrontInventory();
  const item = items.find((it) => it.id === id);
  if (!item) notFound();

  const related = items.filter((it) => it.id !== item.id && it.category === item.category).slice(0, 4);

  return (
    <main className={`${CONTAINER} pt-8`}>
      <nav aria-label="Breadcrumb" className="mb-10 text-sm text-lab-muted">
        <ol className="flex min-w-0 gap-2">
          <li>
            <Link href="/" className="hover:text-lab-ink">Home</Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/shop" className="hover:text-lab-ink">Shop</Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="truncate text-lab-ink">{item.name}</li>
        </ol>
      </nav>

      <PieceDetail item={item} />

      {related.length > 0 && (
        <section className="mt-28">
          <h2 className="mb-10 text-[2.8rem] leading-none">Pairs well with</h2>
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
