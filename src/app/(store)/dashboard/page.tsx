'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, PackageOpen, Settings, LogOut, Camera, X, Loader2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { InventoryItem } from '@/types/database';
import InventoryCard from '@/components/InventoryCard';
import InventoryModal from '@/components/InventoryModal';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useInventory } from '@/hooks/useInventory';
import { getImageHash, rankByVisualSimilarity, ScoredItem } from '@/lib/image-search';
import { CONTAINER, Notice, buttonClass } from '@/features/lab/components/StateViews';
import { cx } from '@/features/lab/utils/format';

// Defer non-critical JS: admin tools load only when opened.
const AdminToolsDeferred = dynamic(() => import('@/components/AdminTools'), { ssr: false, loading: () => null });

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

function InventoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Loading inventory">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] rounded-2xl bg-lab-line/70" />
          <div className="mt-3 h-4 w-2/3 rounded bg-lab-line/70" />
          <div className="mt-2 h-3 w-1/3 rounded bg-lab-line/70" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { items, isLoading, error } = useInventory();
  const [search, setSearch] = useState('');
  const [user, setUser] = useState<User | null>(null);

  // Image search state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSearchPreview, setImageSearchPreview] = useState<string | null>(null);
  const [imageSearchResults, setImageSearchResults] = useState<ScoredItem<InventoryItem>[] | null>(null);
  const [isImageSearching, setIsImageSearching] = useState(false);

  // Modal state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await createBrowserClient().auth.signOut();
    setUser(null);
    window.location.href = '/login';
  };

  const handleCreate = () => {
    if (!user) return;
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    if (!user) return; // guests cannot edit
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  // ── Image search ─────────────────────────────────────────
  const handleImageSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImageSearchPreview(URL.createObjectURL(file));
      setSearch('');
      setIsImageSearching(true);
      try {
        const queryHash = await getImageHash(file);
        setImageSearchResults(await rankByVisualSimilarity(queryHash, items, (item) => item.image_url, 15));
      } catch (err) {
        console.error('Image search failed:', err);
        setImageSearchResults(null);
      } finally {
        setIsImageSearching(false);
      }
    },
    [items],
  );

  const clearImageSearch = useCallback(() => {
    setImageSearchPreview(null);
    setImageSearchResults(null);
    setIsImageSearching(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ── Derived data ─────────────────────────────────────────
  const filteredItems = useMemo(() => {
    if (imageSearchResults) return imageSearchResults.map((r) => r.item);
    if (!search) return items;
    const needle = search.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(needle) || item.origin?.toLowerCase().includes(needle));
  }, [items, search, imageSearchResults]);

  const stats = useMemo(
    () =>
      items.reduce(
        (acc, { quantity_available, quantity_sold, price }) => ({
          pieces: acc.pieces + 1,
          units: acc.units + quantity_available,
          sold: acc.sold + quantity_sold,
          value: acc.value + quantity_available * Number(price),
          soldOut: acc.soldOut + (quantity_available === 0 ? 1 : 0),
        }),
        { pieces: 0, units: 0, sold: 0, value: 0, soldOut: 0 },
      ),
    [items],
  );

  const similarityById = useMemo(
    () => new Map(imageSearchResults?.map((r) => [r.item.id, r.similarity]) ?? []),
    [imageSearchResults],
  );

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0];

  return (
    <main className={`${CONTAINER} pt-12`}>
      {/* Header */}
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lab-muted">Studio</p>
          <h1 className="mt-2 text-[3.2rem] leading-none sm:text-[4.2rem]">Inventory</h1>
          <p className="mt-3 text-[15px] text-lab-muted">
            {user ? `Signed in as ${displayName}. Click a piece to edit it.` : 'Viewing as a guest. Sign in to add or edit pieces.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user ? (
            <>
              {user.user_metadata?.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.user_metadata.avatar_url} alt="" referrerPolicy="no-referrer" className="h-10 w-10 rounded-full border border-lab-line" />
              )}
              <button type="button" onClick={() => setIsAdminModalOpen(true)} className={buttonClass.ghost} aria-label="Admin tools">
                <Settings className="h-4 w-4" /> Admin
              </button>
              <button type="button" onClick={handleLogout} className={buttonClass.ghost}>
                <LogOut className="h-4 w-4" /> Sign out
              </button>
              <button type="button" onClick={handleCreate} className={buttonClass.primary}>
                <Plus className="h-4 w-4" /> Add a piece
              </button>
            </>
          ) : (
            <Link href="/login" className={buttonClass.primary}>
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* Stats */}
      <section aria-label="Inventory at a glance" className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Pieces', String(stats.pieces), stats.soldOut ? `${stats.soldOut} sold out` : 'All in stock'],
          ['Units in stock', String(stats.units), 'Across the floor'],
          ['Units sold', String(stats.sold), 'All time'],
          ['Stock value', usd(stats.value), 'At list price'],
        ].map(([label, value, hint]) => (
          <div key={label} className="rounded-2xl bg-lab-surface p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lab-muted">{label}</p>
            <p className="mt-2 font-display text-[2.2rem] leading-none tabular-nums">{isLoading || error ? '–' : value}</p>
            <p className="mt-1 text-xs text-lab-muted">{hint}</p>
          </div>
        ))}
      </section>

      {/* Toolbar */}
      <div className="z-30 -mx-4 mt-8 border-b border-lab-line bg-lab-paper/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8 lg:sticky lg:top-[72px]">
        {imageSearchPreview ? (
          <div className="flex max-w-xl items-center gap-3 rounded-full border border-lab-accent/40 bg-lab-accent/10 py-1.5 pl-1.5 pr-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageSearchPreview} alt="Your search photo" className="h-9 w-9 rounded-full object-cover" />
            <span className="truncate text-sm font-semibold text-lab-accent">
              {isImageSearching
                ? 'Comparing your photo with the floor…'
                : `${imageSearchResults?.length ?? 0} visual match${imageSearchResults?.length === 1 ? '' : 'es'}`}
            </span>
            {isImageSearching && <Loader2 className="h-4 w-4 animate-spin text-lab-accent" />}
            <button
              type="button"
              onClick={clearImageSearch}
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-lab-ink hover:bg-lab-ink/[0.08]"
              aria-label="Clear photo search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="relative block max-w-xl">
            <span className="sr-only">Search inventory</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-lab-muted" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or origin"
              className="h-12 w-full rounded-full border border-lab-line bg-lab-surface pl-11 pr-14 text-sm text-lab-ink placeholder:text-lab-muted/70 focus:border-lab-ink focus:outline-none"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-lab-muted transition-colors hover:bg-lab-ink/[0.06] hover:text-lab-accent"
              aria-label="Search by photo"
              title="Search by photo"
            >
              <Camera className="h-4 w-4" />
            </button>
          </label>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
      </div>

      <div className="pt-8">
        {error && (
          <div role="alert" className="mb-6 rounded-2xl bg-lab-danger/10 px-5 py-4 text-sm text-lab-danger">
            {error instanceof Error ? error.message : 'Something went wrong loading inventory.'}
          </div>
        )}

        {isLoading ? (
          <InventoryGridSkeleton />
        ) : filteredItems.length === 0 ? (
          <Notice
            title={items.length === 0 ? 'No pieces yet' : 'No matches'}
            action={
              user && items.length === 0 ? (
                <button type="button" onClick={handleCreate} className={buttonClass.primary}>
                  <PackageOpen className="h-4 w-4" /> Add the first piece
                </button>
              ) : undefined
            }
          >
            {imageSearchPreview
              ? 'No visual matches. Try a different photo.'
              : search
                ? `Nothing matches “${search}”.`
                : 'The inventory is empty.'}
          </Notice>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.04 }}
                >
                  <InventoryCard item={item} onClick={user ? () => handleEdit(item) : undefined} similarity={similarityById.get(item.id) ?? null} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Mobile add button */}
      {user && (
        <button
          type="button"
          onClick={handleCreate}
          className={cx('fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-lab-forest text-lab-on-dark shadow-lg sm:hidden')}
          aria-label="Add a piece"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <InventoryModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} onSuccess={() => {}} editingItem={editingItem} />

      <Suspense fallback={null}>
        {isAdminModalOpen && <AdminToolsDeferred isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} onSuccess={() => {}} />}
      </Suspense>
    </main>
  );
}
