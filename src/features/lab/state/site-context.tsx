'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { StoreApi } from 'zustand';
import { getMoodboardStore, type Currency, type MoodboardState } from './moodboard-store';

/**
 * Which site a component is rendering for. The lab sandbox and the live store
 * share every component; only these settings differ.
 */
export type SiteKind = 'lab' | 'store';

type SiteConfig = {
  kind: SiteKind;
  /** Link to a piece's page. */
  productHref: (id: string) => string;
  /** Link to the full catalogue. */
  shopHref: string;
  /** Currency prices are stored in. Lab sample data is INR; live inventory is USD. */
  priceBase: Currency;
  moodboard: StoreApi<MoodboardState>;
};

const SITES: Record<SiteKind, Omit<SiteConfig, 'moodboard'> & { storageKey: string }> = {
  lab: {
    kind: 'lab',
    productHref: (id) => `/lab/collection/${id}`,
    shopHref: '/lab/collection',
    priceBase: 'INR',
    storageKey: 'fo-lab-moodboard',
  },
  store: {
    kind: 'store',
    productHref: (id) => `/shop/${encodeURIComponent(id)}`,
    shopHref: '/shop',
    priceBase: 'USD',
    storageKey: 'fo-store-moodboard',
  },
};

const SiteContext = createContext<SiteConfig | null>(null);

export function SiteProvider({ kind, children }: { kind: SiteKind; children: ReactNode }) {
  const value = useMemo<SiteConfig>(() => {
    const { storageKey, ...rest } = SITES[kind];
    return { ...rest, moodboard: getMoodboardStore(storageKey, rest.priceBase) };
  }, [kind]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used inside <SiteProvider>');
  return ctx;
}
