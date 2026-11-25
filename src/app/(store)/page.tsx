import StorefrontHome from '@/features/lab/components/StorefrontHome';
import SourceNotice from '@/features/store/SourceNotice';
import { getStorefrontInventory } from '@/features/store/inventory';

/**
 * Live home page. Rendered per request (never at build time, when Supabase
 * isn't reachable); the inventory query itself is cached for 30 s.
 */
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { items, source } = await getStorefrontInventory();
  return <StorefrontHome site="store" items={items} notice={<SourceNotice source={source} />} />;
}
