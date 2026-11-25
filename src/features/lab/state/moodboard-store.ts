import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LabItem } from '../schema';

/**
 * Zustand for lightweight global client state (INT252 Unit VI).
 * The moodboard is shared by cards, the detail page, the quick-view modal and
 * the header counter: components that are far apart in the tree.
 * Server data stays in React Query; this store only holds user choices.
 */

export type Currency = 'INR' | 'USD' | 'EUR';
type Pinned = Pick<LabItem, 'id' | 'name' | 'price' | 'tone' | 'category'>;

type MoodboardState = {
  pinned: Pinned[];
  currency: Currency;
  isOpen: boolean;
  toggle: (item: Pinned) => void;
  remove: (id: string) => void;
  clear: () => void;
  setCurrency: (currency: Currency) => void;
  setOpen: (open: boolean) => void;
};

export const useMoodboard = create<MoodboardState>()(
  persist(
    (set) => ({
      pinned: [],
      currency: 'INR',
      isOpen: false,
      // Immutable updates: always return new arrays.
      toggle: ({ id, name, price, tone, category }) =>
        set(({ pinned }) => ({
          pinned: pinned.some((p) => p.id === id)
            ? pinned.filter((p) => p.id !== id)
            : [...pinned, { id, name, price, tone, category }],
        })),
      remove: (id) => set(({ pinned }) => ({ pinned: pinned.filter((p) => p.id !== id) })),
      clear: () => set({ pinned: [] }),
      setCurrency: (currency) => set({ currency }),
      setOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: 'fo-lab-moodboard',
      partialize: ({ pinned, currency }) => ({ pinned, currency }),
    },
  ),
);

// Selectors keep subscribers narrow: a component re-renders only when its slice changes.
export const selectIsPinned = (id: string) => (s: MoodboardState) => s.pinned.some((p) => p.id === id);
export const selectCount = (s: MoodboardState) => s.pinned.length;
export const selectTotal = (s: MoodboardState) => s.pinned.reduce((sum, { price }) => sum + price, 0);
