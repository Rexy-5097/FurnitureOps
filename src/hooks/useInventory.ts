import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createBrowserClient } from '@/lib/supabase-browser';
import { InventoryItem } from '@/types/database';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

const INVENTORY_KEYS = {
  all: ['inventory'] as const,
  lists: () => [...INVENTORY_KEYS.all, 'list'] as const,
};

export function useInventory() {
  const supabase = createBrowserClient();
  const queryClient = useQueryClient();

  // 1. Query
  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: INVENTORY_KEYS.lists(),
    queryFn: async () => {
      const res = await fetch('/api/inventory', {
          // Edge caching hint (handled by Next.js if configured)
          next: { revalidate: 5 } 
      });
      if (!res.ok) throw new Error('Failed to fetch inventory');
      return res.json() as Promise<InventoryItem[]>;
    },
    staleTime: 5000, // 5 seconds
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData,
  });

  // 2. Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel('inventory-updates-hook')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        (payload) => {
          logger.info('Realtime Change received (Hook)', { details: payload });

          // Optimistically update the cache based on the event
          if (payload.eventType === 'INSERT') {
            queryClient.setQueryData(INVENTORY_KEYS.lists(), (old: InventoryItem[] | undefined) => {
              const newItem = payload.new as InventoryItem;
              return old ? [newItem, ...old] : [newItem];
            });
          } else if (payload.eventType === 'UPDATE') {
            queryClient.setQueryData(INVENTORY_KEYS.lists(), (old: InventoryItem[] | undefined) => {
                if (!old) return old;
                return old.map(item => item.id === payload.new.id ? (payload.new as InventoryItem) : item);
            });
          } else if (payload.eventType === 'DELETE') {
             queryClient.setQueryData(INVENTORY_KEYS.lists(), (old: InventoryItem[] | undefined) => {
                if (!old) return old;
                return old.filter(item => item.id !== payload.old.id);
             });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase]);

  // 3. Mutations (Optimistic UI)

  // CREATE
  const createItem = useMutation({
    mutationFn: async (newItem: Partial<InventoryItem>) => {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        const res = await fetch('/api/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(newItem),
        });
        if (!res.ok) throw new Error('Failed to create item');
        return res.json();
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: INVENTORY_KEYS.lists() });
      const previousItems = queryClient.getQueryData<InventoryItem[]>(INVENTORY_KEYS.lists());
      
      // Optimistic update
      queryClient.setQueryData(INVENTORY_KEYS.lists(), (old: InventoryItem[] | undefined) => {
         const optimisticItem = {
            ...newItem,
            id: 'temp-' + Date.now(),
            created_at: new Date().toISOString(),
            // defaults
            quantity_sold: 0,
         } as InventoryItem;
         return old ? [optimisticItem, ...old] : [optimisticItem];
      });

      return { previousItems };
    },
    onError: (err, newItem, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(INVENTORY_KEYS.lists(), context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.lists() });
    },
  });

  // UPDATE
  const updateItem = useMutation({
      mutationFn: async ({ id, updates }: { id: string; updates: Partial<InventoryItem> }) => {
          const { data: session } = await supabase.auth.getSession();
          const token = session.session?.access_token;
          const res = await fetch(`/api/inventory/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(updates),
          });
          if (!res.ok) throw new Error('Failed to update item');
          return res.json();
      },
      onMutate: async ({ id, updates }) => {
          await queryClient.cancelQueries({ queryKey: INVENTORY_KEYS.lists() });
          const previousItems = queryClient.getQueryData<InventoryItem[]>(INVENTORY_KEYS.lists());

          queryClient.setQueryData(INVENTORY_KEYS.lists(), (old: InventoryItem[] | undefined) => {
              if (!old) return [];
              return old.map(item => item.id === id ? { ...item, ...updates } : item);
          });
          
          return { previousItems };
      },
      onError: (err, vars, context) => {
          if (context?.previousItems) {
              queryClient.setQueryData(INVENTORY_KEYS.lists(), context.previousItems);
          }
      },
      onSettled: () => {
          queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.lists() });
      }
  });

  // DELETE
  const deleteItem = useMutation({
      mutationFn: async (id: string) => {
          const { data: session } = await supabase.auth.getSession();
          const token = session.session?.access_token;
          const res = await fetch(`/api/inventory/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('Failed to delete item');
          return true;
      },
      onMutate: async (id) => {
          await queryClient.cancelQueries({ queryKey: INVENTORY_KEYS.lists() });
          const previousItems = queryClient.getQueryData<InventoryItem[]>(INVENTORY_KEYS.lists());

          queryClient.setQueryData(INVENTORY_KEYS.lists(), (old: InventoryItem[] | undefined) => {
              if (!old) return [];
              return old.filter(item => item.id !== id);
          });

          return { previousItems };
      },
      onError: (err, id, context) => {
          if (context?.previousItems) {
              queryClient.setQueryData(INVENTORY_KEYS.lists(), context.previousItems);
          }
      },
       onSettled: () => {
          queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.lists() });
      }
  });

  return {
    items,
    isLoading,
    error,
    createItem,
    updateItem,
    deleteItem,
  };
}
