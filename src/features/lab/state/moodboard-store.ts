import { createStore, useStore, type StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LabItem } from '../schema';
import { useSite } from './site-context';

/**
 * Zustand for lightweight global client state (INT252 Unit VI).
 * The moodboard is shared by cards, the detail page, the drawer and the
 * header counter: components that are far apart in the tree.
 * Server data stays in React Query; this store only holds user choices.
 *
 * Each site (lab sandbox, live store) gets its own persisted store, chosen by
 * SiteProvider, so sample pieces never mix with real ones.
 */

export type Currency = 'INR' | 'USD' | 'EUR';
export type Pinned = Pick<LabItem, 'id' | 'name' | 'price' | 'tone' | 'category'> & { image_url?: string | null };

export type MoodboardState = {
  pinned: Pinned[];
  currency: Currency;
  isOpen: boolean;
  toggle: (item: Pinned) => void;
  remove: (id: string) => void;
  clear: () => void;
  setCurrency: (currency: Currency) => void;
  setOpen: (open: boolean) => void;
};

const createMoodboard = (storageKey: string, currency: Currency) =>
  createStore<MoodboardState>()(
    persist(
      (set) => ({
        pinned: [],
        currency,
        isOpen: false,
        // Immutable updates: always return new arrays.
        toggle: ({ id, name, price, tone, category, image_url }) =>
          set(({ pinned }) => ({
            pinned: pinned.some((p) => p.id === id)
              ? pinned.filter((p) => p.id !== id)
              : [...pinned, { id, name, price, tone, category, image_url: image_url ?? null }],
          })),
        remove: (id) => set(({ pinned }) => ({ pinned: pinned.filter((p) => p.id !== id) })),
        clear: () => set({ pinned: [] }),
        setCurrency: (next) => set({ currency: next }),
        setOpen: (isOpen) => set({ isOpen }),
      }),
      { name: storageKey, partialize: ({ pinned, currency }) => ({ pinned, currency }) },
    ),
  );

// Created lazily so server rendering never touches localStorage-backed stores.
const stores = new Map<string, StoreApi<MoodboardState>>();
export const getMoodboardStore = (storageKey: string, currency: Currency) => {
  let store = stores.get(storageKey);
  if (!store) {
    store = createMoodboard(storageKey, currency);
    stores.set(storageKey, store);
  }
  return store;
};

/** Selector hook bound to the current site's store. */
export function useMoodboard<T>(selector: (state: MoodboardState) => T): T {
  return useStore(useSite().moodboard, selector);
}

/** Direct access for event handlers that don't need to subscribe. */
export const useMoodboardApi = () => useSite().moodboard;

// Selectors keep subscribers narrow: a component re-renders only when its slice changes.
export const selectIsPinned = (id: string) => (s: MoodboardState) => s.pinned.some((p) => p.id === id);
export const selectCount = (s: MoodboardState) => s.pinned.length;
export const selectTotal = (s: MoodboardState) => s.pinned.reduce((sum, { price }) => sum + price, 0);
