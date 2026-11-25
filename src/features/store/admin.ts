'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import type { AuditLog, InventoryItem } from '@/types/database';

/**
 * Client data hooks for the admin console.
 * The Supabase browser client is imported lazily because lib/supabase-browser
 * throws at import time when env vars are missing (local previews).
 */

const getSupabase = async () => (await import('@/lib/supabase-browser')).createBrowserClient();

export type SessionState = { status: 'loading' } | { status: 'signed-out' } | { status: 'signed-in'; session: Session };

/** Current Supabase session, kept in sync with sign-in/out in other tabs. */
export function useAdminSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    const apply = (session: Session | null) =>
      !cancelled && setState(session ? { status: 'signed-in', session } : { status: 'signed-out' });

    getSupabase()
      .then((supabase) => {
        supabase.auth.getSession().then(({ data }) => apply(data.session));
        const { data } = supabase.auth.onAuthStateChange((_event, session) => apply(session));
        unsubscribe = () => data.subscription.unsubscribe();
      })
      .catch(() => apply(null));

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return state;
}

export class AdminAccessError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Latest 50 audit entries. Throws AdminAccessError(401/403) for non-admins. */
export function useAuditLogs(session: Session | null) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', session?.user.id],
    enabled: Boolean(session),
    staleTime: 10_000,
    refetchInterval: 30_000,
    retry: (count, error) => !(error instanceof AdminAccessError) && count < 2,
    queryFn: async ({ signal }) => {
      const res = await fetch('/api/admin/audit-logs', {
        signal,
        headers: { Authorization: `Bearer ${session!.access_token}` },
        cache: 'no-store',
      });
      if (res.status === 401 || res.status === 403) {
        const body = await res.json().catch(() => ({}));
        throw new AdminAccessError(res.status, body.error ?? 'Admins only');
      }
      if (!res.ok) throw new Error(`Could not load the audit log (${res.status})`);
      return (await res.json()) as AuditLog[];
    },
  });
}

/** Public inventory list; shares the dashboard's React Query cache key. */
export function useInventoryList() {
  return useQuery({
    queryKey: ['inventory', 'list'],
    staleTime: 15_000,
    queryFn: async ({ signal }) => {
      const res = await fetch('/api/inventory', { signal, cache: 'no-store' });
      if (!res.ok) throw new Error(`Could not load inventory (${res.status})`);
      return (await res.json()) as InventoryItem[];
    },
  });
}

/* ── Presentation helpers ─────────────────────────────────── */

export type ActionTone = 'moss' | 'accent' | 'danger' | 'muted';

const ACTIONS: Record<string, { label: string; tone: ActionTone }> = {
  CREATE_ITEM: { label: 'Piece added', tone: 'moss' },
  UPDATE_ITEM: { label: 'Piece edited', tone: 'accent' },
  UPDATE: { label: 'Piece edited', tone: 'accent' },
  DELETE_ITEM: { label: 'Piece deleted', tone: 'danger' },
  DECREMENT: { label: 'Stock reserved', tone: 'muted' },
  STOCK_DECREMENT: { label: 'Stock reserved', tone: 'muted' },
  KILL_SWITCH_ACTIVATED: { label: 'Inventory reset', tone: 'danger' },
  LOGIN_ATTEMPT: { label: 'Sign-in attempt', tone: 'muted' },
  LOGIN_SUCCESS: { label: 'Signed in', tone: 'moss' },
  IDEMPOTENCY_HIT: { label: 'Duplicate request blocked', tone: 'muted' },
};

export const describeAction = (action: string) =>
  ACTIONS[action] ?? {
    label: action
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase()),
    tone: 'muted' as const,
  };

export const TONE_CLASS: Record<ActionTone, string> = {
  moss: 'bg-lab-moss/10 text-lab-moss',
  accent: 'bg-lab-accent/10 text-lab-accent',
  danger: 'bg-lab-danger/10 text-lab-danger',
  muted: 'bg-lab-ink/[0.06] text-lab-muted',
};

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

/** "3 minutes ago", "yesterday", or "just now". */
export const timeAgo = (iso: string, now = Date.now()) => {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'just now';
};

/** Short, readable summary of an entry's details object. */
export const summarizeDetails = (details: Record<string, unknown> | null | undefined) => {
  if (!details) return '';
  const name = typeof details.name === 'string' ? details.name : undefined;
  const qty = details.quantity ?? details.p_quantity;
  const parts = [name, qty !== undefined ? `qty ${String(qty)}` : undefined].filter(Boolean);
  return parts.length ? parts.join(' · ') : '';
};
