import 'server-only';
import { unstable_cache } from 'next/cache';
import type { InventoryItem } from '@/types/database';
import type { LabItem } from '@/features/lab/schema';
import { toStorefrontItem } from './map';
import { SEED_ITEMS } from '@/features/lab/data/seed';
import { logger } from '@/lib/logger';

/**
 * Server-side inventory for the live storefront.
 *
 * - Production: reads the `inventory` table with the service client, cached
 *   for 30 s (tag "inventory") so a busy home page doesn't hit Supabase on
 *   every request.
 * - Local development without Supabase keys: falls back to the lab's sample
 *   catalogue (priced in USD) so the pages can still be designed and tested.
 *   This branch can never run in production.
 */

export type InventorySource = 'live' | 'sample' | 'unavailable';
export type StorefrontInventory = { items: LabItem[]; source: InventorySource };

const hasSupabase = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const shouldUseSampleData = () => process.env.NODE_ENV !== 'production' && !hasSupabase();

// Lab sample prices are INR; convert so the dev fallback looks like USD data.
const sampleItems = (): LabItem[] => SEED_ITEMS.map((item) => ({ ...item, price: Math.round(item.price / 84) }));

const fetchLive = unstable_cache(
  async (): Promise<InventoryItem[]> => {
    // Imported lazily: lib/supabase throws at import time when keys are missing.
    const { getServiceSupabase } = await import('@/lib/supabase');
    const { data, error } = await getServiceSupabase().from('inventory').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as InventoryItem[];
  },
  ['storefront-inventory'],
  { revalidate: 30, tags: ['inventory'] },
);

export async function getStorefrontInventory(): Promise<StorefrontInventory> {
  if (shouldUseSampleData()) return { items: sampleItems(), source: 'sample' };
  try {
    const rows = await fetchLive();
    return { items: rows.map(toStorefrontItem), source: 'live' };
  } catch (error) {
    logger.error('Storefront inventory fetch failed', { details: { message: (error as Error).message } });
    return { items: [], source: 'unavailable' };
  }
}

export async function getStorefrontItem(id: string): Promise<{ item: LabItem | null; source: InventorySource }> {
  const { items, source } = await getStorefrontInventory();
  return { item: items.find((it) => it.id === id) ?? null, source };
}
