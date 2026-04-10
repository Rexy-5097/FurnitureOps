'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { InventoryItem } from '@/types/database';
import InventoryCard from '@/components/InventoryCard';
import InventoryModal from '@/components/InventoryModal';
import AdminTools from '@/components/AdminTools';
import { Search, Plus, PackageOpen, Settings, LogOut, LayoutGrid, Camera, X, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { User } from '@supabase/supabase-js';
import GlassCard from '@/components/ui/GlassCard';
import { useInventory } from '@/hooks/useInventory';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { getImageHash, rankByVisualSimilarity, ScoredItem } from '@/lib/image-search';

// Defer non-critical JS
const AdminToolsDeferred = dynamic(() => import('@/components/AdminTools'), {
  ssr: false,
  loading: () => null,
});

// Skeleton Loader Component
function InventoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-[4/5] rounded-2xl bg-white/5 animate-pulse border border-white/5">
           <div className="h-[60%] w-full bg-white/5 rounded-t-2xl" />
           <div className="p-4 space-y-3">
               <div className="h-4 w-3/4 bg-white/10 rounded" />
               <div className="h-3 w-1/2 bg-white/5 rounded" />
               <div className="pt-2 flex justify-between">
                   <div className="h-5 w-1/3 bg-white/10 rounded" />
                   <div className="h-5 w-1/4 bg-white/5 rounded-full" />
               </div>
           </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  // Use React Query Hook
  const { items, isLoading, error } = useInventory();
  const [search, setSearch] = useState('');
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);

  // Image Search State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSearchPreview, setImageSearchPreview] = useState<string | null>(null);
  const [imageSearchResults, setImageSearchResults] = useState<ScoredItem<InventoryItem>[] | null>(null);
  const [isImageSearching, setIsImageSearching] = useState(false);

  // Modal States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();

    // 🔐 Auth state listener
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    return () => {
      authSub.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/login';
  };

  const handleCreate = () => {
    if (!user) return;
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    if (!user) return; // Guests cannot edit
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  // ── Image Search Handler ────────────────────────────────────
  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setImageSearchPreview(previewUrl);
    setSearch(''); // Clear text search
    setIsImageSearching(true);

    try {
      const queryHash = await getImageHash(file);
      const scored = await rankByVisualSimilarity(
        queryHash,
        items,
        (item) => item.image_url,
        15 // minimum 15% similarity threshold
      );
      setImageSearchResults(scored);
    } catch (err) {
      console.error('Image search failed:', err);
      setImageSearchResults(null);
    } finally {
      setIsImageSearching(false);
    }
  }, [items]);

  const clearImageSearch = useCallback(() => {
    setImageSearchPreview(null);
    setImageSearchResults(null);
    setIsImageSearching(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ── Filtered Items (text search OR image search) ───────────
  const filteredItems = useMemo(() => {
    // Image search takes priority
    if (imageSearchResults) {
      return imageSearchResults.map((r) => r.item);
    }
    if (!search) return items;
    const lowerSearch = search.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerSearch) ||
        (item.origin && item.origin.toLowerCase().includes(lowerSearch))
    );
  }, [items, search, imageSearchResults]);

  // Helper to get similarity score for an item (for badges)
  const getSimilarity = useCallback((itemId: string): number | null => {
    if (!imageSearchResults) return null;
    const match = imageSearchResults.find((r) => r.item.id === itemId);
    return match ? match.similarity : null;
  }, [imageSearchResults]);




  return (
    <div className="min-h-screen pb-24">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
         <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-amber-900/10 rounded-full blur-[100px] animate-pulse" />
         <div className="absolute bottom-[30%] right-[15%] w-[25%] h-[25%] bg-orange-900/8 rounded-full blur-[80px] animate-drift" style={{ animationDelay: '2s' }} />
      </div>

      {/* Top Bar - Sticky */}
      <div 
        className="sticky top-0 z-20 bg-black/60 backdrop-blur-xl border-b border-white/10 px-4 py-4 shadow-sm animate-fade-up"
      >
        <div className="mx-auto max-w-7xl flex items-center gap-4">
          <div className="flex items-center gap-2 text-white/80">
            <LayoutGrid className="h-6 w-6" />
            <span className="font-bold text-lg tracking-tight hidden md:block">Dashboard</span>
          </div>

          <div className="relative flex-1 max-w-2xl mx-auto">
            {/* Image Search Preview — shown when image search is active */}
            {imageSearchPreview ? (
              <div className="flex items-center gap-3 rounded-full border border-amber-500/30 bg-amber-500/10 py-1.5 px-3 animate-fade-up">
                <img
                  src={imageSearchPreview}
                  alt="Search query"
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-amber-500/50"
                />
                <span className="text-sm text-amber-200 font-medium truncate">
                  {isImageSearching ? 'Analyzing image...' : `${imageSearchResults?.length ?? 0} match${imageSearchResults?.length === 1 ? '' : 'es'} found`}
                </span>
                {isImageSearching && (
                  <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />
                )}
                <button
                  onClick={clearImageSearch}
                  className="ml-auto flex items-center justify-center h-7 w-7 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
                  aria-label="Clear image search"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-white/40" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-12 text-white placeholder:text-white/30 focus:bg-white/10 focus:ring-2 focus:ring-amber-500/50 focus:border-transparent sm:text-sm transition-all outline-none"
                  placeholder="Search inventory..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {/* Camera Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 group"
                  aria-label="Search by photo"
                  title="Search by photo"
                >
                  <Camera className="h-5 w-5 text-white/30 group-hover:text-amber-400 transition-colors" />
                </button>
              </div>
            )}

            {/* Hidden file input for image capture */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>
          
          {/* Admin Controls */}
          {user ? (
            <div className="flex items-center gap-3">
                {/* User Avatar + Name */}
                {user?.user_metadata?.avatar_url ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata.full_name || 'User'}
                      className="w-8 h-8 rounded-full border border-white/20"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-sm text-white/70 hidden sm:block max-w-[120px] truncate">
                      {user.user_metadata.full_name || user.email?.split('@')[0]}
                    </span>
                  </div>
                ) : user?.email ? (
                  <span className="text-sm text-white/50 hidden sm:block max-w-[120px] truncate">
                    {user.email.split('@')[0]}
                  </span>
                ) : null}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAdminModalOpen(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors border border-white/5"
                    aria-label="Admin Tools"
                >
                    <Settings className="h-5 w-5" />
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/10"
                    aria-label="Sign Out"
                >
                    <LogOut className="h-5 w-5" />
                </motion.button>
            </div>
          ) : (
            <a
                href="/login"
                className="flex items-center justify-center px-4 h-10 rounded-full bg-amber-600 text-white text-sm font-semibold hover:bg-amber-500 transition-colors shadow-lg shadow-amber-600/20"
            >
                Login
            </a>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        
        {/* Error State */}
        {error && (
          <GlassCard className="mb-6 p-4 border-red-500/20 bg-red-500/10 text-red-200">
             {error instanceof Error ? error.message : 'An error occurred'}
          </GlassCard>
        )}

        {/* Loading State with Suspense-like Skeleton */}
        {isLoading ? (
          <InventoryGridSkeleton />
        ) : (
          <>
            {/* Empty State */}
            {!isLoading && filteredItems.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex h-64 w-full flex-col items-center justify-center space-y-3 text-center text-white/40"
              >
                <div className="rounded-full bg-white/5 p-4">
                  <PackageOpen className="h-8 w-8" />
                </div>
                <h3 className="mt-2 text-sm font-semibold text-white">No items found</h3>
                <p className="text-sm">
                  {imageSearchPreview ? 'No visual matches found. Try a different photo.' : search ? `No matches for "${search}"` : 'Your inventory is empty.'}
                </p>
              </motion.div>
            ) : (
              /* Grid Layout */
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
                <AnimatePresence mode='popLayout'>
                  {filteredItems.map((item, index) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      key={item.id}
                    >
                      <div className="relative">
                        <InventoryCard
                          item={item}
                          onClick={() => handleEdit(item)}
                        />
                        {/* Match Score Badge */}
                        {getSimilarity(item.id) !== null && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-amber-600/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-white shadow-lg shadow-amber-900/30"
                          >
                            {getSimilarity(item.id)}% match
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Action Button - Only for Auth Users */}
      <AnimatePresence>
        {user && (
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCreate}
                className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-amber-600 text-white shadow-lg shadow-amber-600/30 hover:bg-amber-500"
                aria-label="Add Item"
            >
                <Plus className="h-7 w-7" />
            </motion.button>
        )}
      </AnimatePresence>

      {/* Item Modal */}
      <InventoryModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSuccess={() => {}} // Success handled by hook's queries invalidation
        editingItem={editingItem}
      />

      {/* Admin Tools Modal (Lazy Loaded) */}
      <Suspense fallback={null}>
         {isAdminModalOpen && (
             <AdminToolsDeferred
                isOpen={isAdminModalOpen}
                onClose={() => setIsAdminModalOpen(false)}
                onSuccess={() => {}} 
             />
         )}
      </Suspense>
    </div>
  );
}
