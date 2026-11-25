'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ItemPatch, LabItem } from '../schema';

/**
 * Server state with React Query (INT252 Unit V, practical 12).
 * React Query owns caching, background refetching and retries, which is the
 * part useEffect + useState handles poorly (races, no cache, no dedupe).
 */

export type InventoryFilters = {
  q: string;
  category: string;
  sort: string;
  inStock: boolean;
  delay?: number;
  fail?: boolean;
};

type ListResponse = { items: LabItem[]; count: number; servedAt: string };

export const labKeys = {
  all: ['lab-inventory'] as const,
  list: (filters: InventoryFilters) => [...labKeys.all, 'list', filters] as const,
};

async function http<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body as T;
}

const toQueryString = ({ q, category, sort, inStock, delay, fail }: InventoryFilters) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category && category !== 'all') params.set('category', category);
  if (sort) params.set('sort', sort);
  if (inStock) params.set('inStock', '1');
  if (delay) params.set('delay', String(delay));
  if (fail) params.set('fail', '1');
  return params.toString();
};

export function useLabInventory(filters: InventoryFilters, { live = false } = {}) {
  return useQuery({
    queryKey: labKeys.list(filters),
    queryFn: ({ signal }) => http<ListResponse>(`/api/lab/inventory?${toQueryString(filters)}`, { signal }),
    staleTime: 15_000, // cached results are "fresh" for 15 s
    gcTime: 5 * 60_000, // unused cache entries kept for 5 min
    refetchInterval: live ? 10_000 : false, // background synchronisation
    placeholderData: keepPreviousData, // keep the old grid while new filters load
    retry: filters.fail ? 0 : 2,
  });
}

/** Optimistic update: change the cache first, roll back if the server refuses. */
export function useUpdateStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ItemPatch }) =>
      http<LabItem>(`/api/lab/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: labKeys.all });
      const snapshot = qc.getQueriesData<ListResponse>({ queryKey: labKeys.all });
      qc.setQueriesData<ListResponse>({ queryKey: labKeys.all }, (old) =>
        old ? { ...old, items: old.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) } : old,
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: () => qc.invalidateQueries({ queryKey: labKeys.all }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http<void>(`/api/lab/inventory/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: labKeys.all });
      const snapshot = qc.getQueriesData<ListResponse>({ queryKey: labKeys.all });
      qc.setQueriesData<ListResponse>({ queryKey: labKeys.all }, (old) =>
        old ? { ...old, items: old.items.filter((it) => it.id !== id), count: old.count - 1 } : old,
      );
      return { snapshot };
    },
    onError: (_err, _id, ctx) => ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: () => qc.invalidateQueries({ queryKey: labKeys.all }),
  });
}
