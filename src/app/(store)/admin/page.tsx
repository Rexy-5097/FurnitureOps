'use client';

import Link from 'next/link';
import { useMemo, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ArrowRight, FileText, LayoutGrid, Store, Users } from 'lucide-react';
import { CONTAINER, Eyebrow } from '@/features/lab/components/StateViews';
import { useNow } from '@/features/lab/hooks';
import { cx } from '@/features/lab/utils/format';
import AdminGate, { NotAdminNotice } from '@/features/store/AdminGate';
import { AdminAccessError, TONE_CLASS, describeAction, timeAgo, useAuditLogs, useInventoryList } from '@/features/store/admin';

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export default function AdminPage() {
  return <AdminGate>{(session) => <Console session={session} />}</AdminGate>;
}

function Console({ session }: { session: Session }) {
  const logs = useAuditLogs(session);
  const inventory = useInventoryList();
  const now = useNow(30_000);

  const forbidden = logs.error instanceof AdminAccessError;

  const stats = useMemo(() => {
    const items = inventory.data ?? [];
    const dayAgo = now - 86_400_000;
    return {
      pieces: items.length,
      units: items.reduce((sum, it) => sum + it.quantity_available, 0),
      soldOut: items.filter((it) => it.quantity_available === 0).length,
      value: items.reduce((sum, it) => sum + it.quantity_available * Number(it.price), 0),
      events24h: (logs.data ?? []).filter((l) => new Date(l.timestamp).getTime() > dayAgo).length,
    };
  }, [inventory.data, logs.data, now]);

  const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'admin';

  return (
    <main className={`${CONTAINER} pt-12`}>
      <header>
        <Eyebrow>Admin</Eyebrow>
        <h1 className="mt-2 text-[3.2rem] leading-none sm:text-[4.2rem]">Console</h1>
        <p className="mt-3 text-[15px] text-lab-muted">Welcome back, {name}. Here&apos;s the floor at a glance.</p>
      </header>

      {forbidden ? (
        <div className="mt-12">
          <NotAdminNotice />
        </div>
      ) : (
        <>
          <section aria-label="Overview" className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Pieces" value={stats.pieces} hint={stats.soldOut ? `${stats.soldOut} sold out` : 'All in stock'} missing={!inventory.data} />
            <Stat label="Units in stock" value={stats.units} hint="Across the floor" missing={!inventory.data} />
            <Stat label="Stock value" value={usd(stats.value)} hint="At list price" missing={!inventory.data} />
            <Stat label="Events, last 24 h" value={stats.events24h} hint="From the audit log" missing={!logs.data} />
          </section>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {/* Recent activity */}
            <section aria-labelledby="recent" className="rounded-[24px] bg-lab-surface p-7 lg:col-span-2">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 id="recent" className="text-[2.2rem] leading-none">
                    Recent activity
                  </h2>
                  <p className="mt-2 text-sm text-lab-muted">Every change to stock and pieces is recorded.</p>
                </div>
                <Link href="/admin/audit" className="flex shrink-0 items-center gap-2 text-sm font-semibold hover:underline hover:underline-offset-4">
                  Full log <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <ul className="mt-6 divide-y divide-lab-line">
                {logs.isPending
                  ? Array.from({ length: 5 }, (_, i) => <li key={i} className="h-14 animate-pulse bg-lab-line/30" />)
                  : logs.isError
                    ? <li className="py-6 text-sm text-lab-danger">{logs.error.message}</li>
                    : logs.data.length === 0
                      ? <li className="py-6 text-sm text-lab-muted">No activity yet.</li>
                      : logs.data.slice(0, 6).map((log) => {
                          const { label, tone } = describeAction(log.action);
                          const detailName = typeof log.details?.name === 'string' ? log.details.name : null;
                          return (
                            <li key={log.id} className="flex items-center gap-4 py-3.5">
                              <span className={cx('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold', TONE_CLASS[tone])}>{label}</span>
                              <span className="min-w-0 flex-1 truncate text-sm">{detailName ?? <span className="text-lab-muted">—</span>}</span>
                              <time dateTime={log.timestamp} title={new Date(log.timestamp).toLocaleString()} className="shrink-0 text-xs text-lab-muted">
                                {timeAgo(log.timestamp, now)}
                              </time>
                            </li>
                          );
                        })}
              </ul>
            </section>

            {/* Shortcuts */}
            <nav aria-label="Admin shortcuts" className="grid gap-4">
              <Shortcut href="/admin/audit" icon={<FileText className="h-5 w-5" />} title="Audit log" body="Search and filter every recorded event." tone="bg-lab-sage" />
              <Shortcut href="/dashboard" icon={<LayoutGrid className="h-5 w-5" />} title="Inventory studio" body="Add pieces, edit stock and photos, reset the floor." tone="bg-lab-sand" />
              <Shortcut href="/" icon={<Store className="h-5 w-5" />} title="Storefront" body="See the site the way customers do." tone="bg-lab-sage" />
              <div className="flex items-start gap-4 rounded-[24px] border border-dashed border-lab-line p-6 text-lab-muted">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lab-surface">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-lab-ink">User management</p>
                  <p className="mt-1 text-sm">Roles and invitations. Coming soon.</p>
                </div>
              </div>
            </nav>
          </div>
        </>
      )}
    </main>
  );
}

function Stat({ label, value, hint, missing }: { label: string; value: ReactNode; hint: string; missing?: boolean }) {
  return (
    <div className="rounded-2xl bg-lab-surface p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lab-muted">{label}</p>
      <p className="mt-2 font-display text-[2.2rem] leading-none tabular-nums">{missing ? '–' : value}</p>
      <p className="mt-1 text-xs text-lab-muted">{missing ? 'Unavailable' : hint}</p>
    </div>
  );
}

function Shortcut({ href, icon, title, body, tone }: { href: string; icon: ReactNode; title: string; body: string; tone: string }) {
  return (
    <Link href={href} className={cx('group flex items-start gap-4 rounded-[24px] p-6 transition-shadow hover:shadow-[0_12px_32px_-16px_rgba(60,40,20,0.35)]', tone)}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lab-paper">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-semibold">
          {title}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </p>
        <p className="mt-1 text-sm text-lab-muted">{body}</p>
      </div>
    </Link>
  );
}
