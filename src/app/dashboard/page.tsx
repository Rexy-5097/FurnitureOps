'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem } from '@/types/database';
import InventoryCard from '@/components/InventoryCard';
import InventoryModal from '@/components/InventoryModal';
import AdminTools from '@/components/AdminTools';
import { Search, Plus, PackageOpen, Settings, LogOut, LayoutGrid } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { logger } from '@/lib/logger';
import { User } from '@supabase/supabase-js';
import AnimatedLoader from '@/components/ui/AnimatedLoader';
import GlassCard from '@/components/ui/GlassCard';

export default function DashboardPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);

  // Modal States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    fetchItems();

    const supabase = createBrowserClient();

    // 🔐 Auth state listener — handles OAuth redirects + session refresh
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    // Also check initial session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // ⚡️ Supabase Realtime Subscription (Optimized)
    const channel = supabase
      .channel('inventory-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        (payload) => {
          logger.info('Realtime Change received', { details: payload });
          
          if (payload.eventType === 'INSERT') {
            setItems((prev) => [payload.new as InventoryItem, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setItems((prev) => 
                prev.map((item) => 
                    item.id === payload.new.id ? (payload.new as InventoryItem) : item
                )
            );
          } else if (payload.eventType === 'DELETE') {
             setItems((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      authSub.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/login';
  };

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/inventory');
      
      if (!res.ok) {
        throw new Error('Failed to fetch inventory');
      }
      
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
      setError('Could not load inventory items.');
    } finally {
      setLoading(false);
    }
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

  const handleAdminOpen = () => {
    if (!user) return;
    setIsAdminModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchItems();
  };

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const lowerSearch = search.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerSearch) ||
        (item.origin && item.origin.toLowerCase().includes(lowerSearch))
    );
  }, [items, search]);

  return (
    <div className="min-h-screen pb-24">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
         <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      {/* Top Bar - Sticky */}
      <div className="sticky top-0 z-20 bg-black/50 backdrop-blur-xl border-b border-white/10 px-4 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center gap-4">
          <div className="flex items-center gap-2 text-white/80">
            <LayoutGrid className="h-6 w-6" />
            <span className="font-bold text-lg tracking-tight hidden md:block">Dashboard</span>
          </div>

          <div className="relative flex-1 max-w-2xl mx-auto">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-white/40" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="block w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-white placeholder:text-white/30 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent sm:text-sm transition-all outline-none"
              placeholder="Search inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                <button
                    onClick={handleAdminOpen}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors border border-white/5"
                    aria-label="Admin Tools"
                    title="Admin Tools"
                >
                    <Settings className="h-5 w-5" />
                </button>
                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/10"
                    aria-label="Sign Out"
                    title="Sign Out"
                >
                    <LogOut className="h-5 w-5" />
                </button>
            </div>
          ) : (
            <a
                href="/login"
                className="flex items-center justify-center px-4 h-10 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
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
            {error}
            <button 
                onClick={fetchItems}
                className="ml-2 font-medium underline hover:text-red-100"
            >
                Retry
            </button>
          </GlassCard>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex h-64 w-full flex-col items-center justify-center space-y-4">
            <AnimatedLoader />
            <p className="text-sm font-medium text-white/40">Loading inventory...</p>
          </div>
        ) : (
          <>
            {/* Empty State */}
            {!loading && filteredItems.length === 0 ? (
              <div className="flex h-64 w-full flex-col items-center justify-center space-y-3 text-center text-white/40">
                <div className="rounded-full bg-white/5 p-4">
                  <PackageOpen className="h-8 w-8" />
                </div>
                <h3 className="mt-2 text-sm font-semibold text-white">No items found</h3>
                <p className="text-sm">
                  {search ? `No matches for "${search}"` : 'Your inventory is empty.'}
                </p>
              </div>
            ) : (
              /* Grid Layout */
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
                {filteredItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="animate-card-in"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <InventoryCard
                      item={item}
                      onClick={() => handleEdit(item)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Action Button - Only for Auth Users */}
      {user && (
        <button
            onClick={handleCreate}
            className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-transform hover:scale-110 active:scale-95 hover:bg-blue-500 animate-bounce-in"
            style={{ animationDelay: '0.5s' }}
            aria-label="Add Item"
        >
            <Plus className="h-7 w-7" />
        </button>
      )}

      {/* Item Modal */}
      <InventoryModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSuccess={handleModalSuccess}
        editingItem={editingItem}
      />

      {/* Admin Tools Modal */}
      <AdminTools
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
