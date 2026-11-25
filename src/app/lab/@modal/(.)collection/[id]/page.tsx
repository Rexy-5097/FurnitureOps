import { notFound } from 'next/navigation';
import Modal from '@/features/lab/components/Modal';
import PieceDetail from '@/features/lab/components/PieceDetail';
import { getItem } from '@/features/lab/data/store';

/**
 * Intercepting route + parallel route (INT257 Unit VI).
 * Clicking a card inside the lab renders this quick view in the `modal` slot,
 * while the collection stays mounted underneath. A refresh or a direct visit
 * renders the full page at /lab/collection/[id] instead.
 */
export const dynamic = 'force-dynamic';

export default function QuickView({ params }: { params: { id: string } }) {
  const item = getItem(params.id);
  if (!item) notFound();
  return (
    <Modal label={`${item.name} quick view`}>
      <PieceDetail item={item} compact fullPageHref={`/lab/collection/${item.id}`} />
    </Modal>
  );
}
