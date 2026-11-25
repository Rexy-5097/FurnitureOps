import type { InventoryItem } from '@/types/database';
import type { LabItem } from '@/features/lab/schema';
import { inferCategory, toneFor } from '@/features/lab/categories';

/**
 * Maps an `inventory` row to the shape the storefront components render.
 * Pure and dependency-free, so both the server loader and the browser
 * (React Query `select`) use the same mapping.
 */
export const toStorefrontItem = (row: InventoryItem): LabItem => ({
  id: row.id,
  name: row.name,
  origin: row.origin ?? '',
  price: Number(row.price),
  quantity_available: row.quantity_available,
  quantity_sold: row.quantity_sold,
  image_url: row.image_url || null,
  created_at: row.created_at,
  updated_at: row.updated_at,
  // Not stored yet: derived so the design has something sensible to show.
  category: inferCategory(row.name),
  tone: toneFor(row.id),
  material: '',
  description: '',
});
