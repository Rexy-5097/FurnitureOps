import 'server-only';
import { SEED_ITEMS } from './seed';
import type { Category, ItemInput, ItemPatch, LabItem } from '../schema';

/**
 * In-memory "database" for the lab (stands in for the ORM layer, INT257 Unit IV).
 * It lives on globalThis so Route Handlers, Server Components and Server Actions
 * in the same Node process share one copy. It resets on restart / per serverless
 * instance, which is fine for a sandbox and keeps production data untouched.
 *
 * Every write replaces the array instead of mutating it (immutability, INT252 Unit I).
 */

type Store = { items: readonly LabItem[] };
const globalForLab = globalThis as unknown as { __furnitureOpsLab?: Store };

const store: Store = (globalForLab.__furnitureOpsLab ??= {
  // structuredClone = deep copy, so the frozen seed is never touched.
  items: structuredClone(SEED_ITEMS) as LabItem[],
});

export type ListQuery = {
  q?: string;
  category?: Category | 'all';
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'name';
  inStock?: boolean;
};

const sorters: Record<NonNullable<ListQuery['sort']>, (a: LabItem, b: LabItem) => number> = {
  newest: (a, b) => b.created_at.localeCompare(a.created_at),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name),
};

export const listItems = ({ q = '', category = 'all', sort = 'newest', inStock = false }: ListQuery = {}) => {
  const needle = q.trim().toLowerCase();
  return store.items
    .filter(({ name, origin, material }) =>
      needle ? [name, origin, material].some((field) => field.toLowerCase().includes(needle)) : true,
    )
    .filter((item) => (category === 'all' ? true : item.category === category))
    .filter((item) => (inStock ? item.quantity_available > 0 : true))
    .toSorted(sorters[sort] ?? sorters.newest);
};

export const getItem = (id: string) => store.items.find((item) => item.id === id) ?? null;

export const getStats = () =>
  store.items.reduce(
    (acc, { quantity_available, quantity_sold, price }) => ({
      pieces: acc.pieces + 1,
      inStock: acc.inStock + quantity_available,
      sold: acc.sold + quantity_sold,
      stockValue: acc.stockValue + quantity_available * price,
    }),
    { pieces: 0, inStock: 0, sold: 0, stockValue: 0 },
  );

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const createItem = (input: ItemInput): LabItem => {
  const base = slugify(input.name) || 'piece';
  const id = getItem(base) ? `${base}-${Date.now().toString(36)}` : base;
  const item: LabItem = {
    ...input,
    id,
    quantity_sold: 0,
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: null,
  };
  store.items = [item, ...store.items];
  return item;
};

export const updateItem = (id: string, patch: ItemPatch): LabItem | null => {
  const current = getItem(id);
  if (!current) return null;
  const next = { ...current, ...patch, updated_at: new Date().toISOString() };
  store.items = store.items.map((item) => (item.id === id ? next : item));
  return next;
};

export const deleteItem = (id: string): boolean => {
  const before = store.items.length;
  store.items = store.items.filter((item) => item.id !== id);
  return store.items.length < before;
};

export const resetStore = () => {
  store.items = structuredClone(SEED_ITEMS) as LabItem[];
};
