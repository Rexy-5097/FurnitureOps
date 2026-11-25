'use client';

import Link from 'next/link';
import { Fragment, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ArrowLeft, ChevronDown, RefreshCw, Search } from 'lucide-react';
import { CONTAINER, Eyebrow, Notice, buttonClass } from '@/features/lab/components/StateViews';
import { useDebounce, useNow } from '@/features/lab/hooks';
import { cx } from '@/features/lab/utils/format';
import AdminGate, { NotAdminNotice } from '@/features/store/AdminGate';
import { AdminAccessError, TONE_CLASS, describeAction, summarizeDetails, timeAgo, useAuditLogs } from '@/features/store/admin';

export default function AuditPage() {
  return <AdminGate>{(session) => <AuditLog session={session} />}</AdminGate>;
}

function AuditLog({ session }: { session: Session }) {
  const logs = useAuditLogs(session);
  const now = useNow(30_000);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const q = useDebounce(search, 200).trim().toLowerCase();

  // Distinct event labels present in the data, for the filter chips.
  const labels = useMemo(
    () => Array.from(new Set((logs.data ?? []).map((l) => describeAction(l.action).label))).sort(),
    [logs.data],
  );

  // Derived during render: filter + search over the fetched entries.
  const visible = useMemo(
    () =>
      (logs.data ?? [])
        .filter((l) => filter === 'all' || describeAction(l.action).label === filter)
        .filter((l) =>
          q
            ? [l.action, l.actor_id ?? '', JSON.stringify(l.details ?? {})].some((field) => field.toLowerCase().includes(q))
            : true,
        ),
    [logs.data, filter, q],
  );

  const forbidden = logs.error instanceof AdminAccessError;

  return (
    <main className={`${CONTAINER} pt-12`}>
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-lab-muted hover:text-lab-ink">
        <ArrowLeft className="h-4 w-4" /> Console
      </Link>

      <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>Admin</Eyebrow>
          <h1 className="mt-2 text-[3.2rem] leading-none sm:text-[4.2rem]">Audit log</h1>
          <p className="mt-3 text-[15px] text-lab-muted">The latest 50 recorded events. Refreshes every 30 seconds.</p>
        </div>
        {!forbidden && (
          <button type="button" onClick={() => logs.refetch()} disabled={logs.isFetching} className={buttonClass.ghost}>
            <RefreshCw className={cx('h-4 w-4', logs.isFetching && 'animate-spin')} />
            {logs.isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        )}
      </header>

      {forbidden ? (
        <div className="mt-12">
          <NotAdminNotice />
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="z-30 -mx-4 mt-8 border-b border-lab-line bg-lab-paper/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8 lg:sticky lg:top-[72px]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <label className="relative flex-1 lg:max-w-sm">
                <span className="sr-only">Search events</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-lab-muted" aria-hidden />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by piece, action or user id"
                  className="h-12 w-full rounded-full border border-lab-line bg-lab-surface pl-11 pr-4 text-sm text-lab-ink placeholder:text-lab-muted/70 focus:border-lab-ink focus:outline-none"
                />
              </label>
              <div role="group" aria-label="Event type" className="lab-scroll-x -mx-1 flex gap-1 overflow-x-auto px-1">
                {['all', ...labels].map((label) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={filter === label}
                    onClick={() => setFilter(label)}
                    className={cx(
                      'h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm transition-colors',
                      filter === label ? 'bg-lab-forest text-lab-on-dark' : 'text-lab-muted hover:text-lab-ink',
                    )}
                  >
                    {label === 'all' ? 'All events' : label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p aria-live="polite" className="py-5 text-xs text-lab-muted">
            {logs.isPending ? 'Loading events…' : `${visible.length} of ${logs.data?.length ?? 0} events`}
          </p>

          {logs.isPending ? (
            <div className="space-y-2" aria-busy="true">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-lab-line/40" />
              ))}
            </div>
          ) : logs.isError ? (
            <Notice
              tone="danger"
              title="The audit log didn't load"
              action={
                <button type="button" onClick={() => logs.refetch()} className={buttonClass.primary}>
                  Try again
                </button>
              }
            >
              {logs.error.message}
            </Notice>
          ) : visible.length === 0 ? (
            <Notice title={logs.data.length ? 'No matching events' : 'No events yet'}>
              {logs.data.length ? 'Try another filter or clear the search.' : 'Changes to stock and pieces will appear here.'}
            </Notice>
          ) : (
            <div className="overflow-hidden rounded-[24px] bg-lab-surface">
              <table className="w-full text-sm">
                <caption className="sr-only">Audit events, newest first</caption>
                <thead>
                  <tr className="border-b border-lab-line text-left text-[11px] uppercase tracking-[0.16em] text-lab-muted">
                    <th scope="col" className="px-5 py-3 font-semibold">Event</th>
                    <th scope="col" className="hidden px-3 py-3 font-semibold md:table-cell">Details</th>
                    <th scope="col" className="hidden px-3 py-3 font-semibold lg:table-cell">By</th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lab-line">
                  {visible.map((log) => {
                    const { label, tone } = describeAction(log.action);
                    const open = openId === log.id;
                    return (
                      <Fragment key={log.id}>
                        <tr className="align-middle">
                          <td className="px-5 py-3">
                            <button
                              type="button"
                              onClick={() => setOpenId(open ? null : log.id)}
                              aria-expanded={open}
                              className="flex items-center gap-2 text-left"
                            >
                              <ChevronDown className={cx('h-4 w-4 shrink-0 text-lab-muted transition-transform', open && 'rotate-180')} aria-hidden />
                              <span className={cx('rounded-full px-2.5 py-1 text-[11px] font-semibold', TONE_CLASS[tone])}>{label}</span>
                            </button>
                          </td>
                          <td className="hidden max-w-[320px] truncate px-3 py-3 md:table-cell">
                            {summarizeDetails(log.details) || <span className="text-lab-muted">—</span>}
                          </td>
                          <td className="hidden px-3 py-3 font-mono text-xs text-lab-muted lg:table-cell">
                            {log.actor_id ? `${log.actor_id.slice(0, 8)}…` : 'system'}
                          </td>
                          <td className="px-5 py-3 text-right text-xs text-lab-muted">
                            <time dateTime={log.timestamp} title={new Date(log.timestamp).toLocaleString()}>
                              {timeAgo(log.timestamp, now)}
                            </time>
                          </td>
                        </tr>
                        {open && (
                          <tr className="bg-lab-paper/60">
                            <td colSpan={4} className="px-5 py-4">
                              <dl className="grid gap-2 text-xs sm:grid-cols-[120px_1fr]">
                                <dt className="text-lab-muted">Action</dt>
                                <dd className="font-mono">{log.action}</dd>
                                <dt className="text-lab-muted">Time</dt>
                                <dd>{new Date(log.timestamp).toLocaleString()}</dd>
                                <dt className="text-lab-muted">Actor</dt>
                                <dd className="break-all font-mono">{log.actor_id ?? 'system'}</dd>
                                <dt className="text-lab-muted">Details</dt>
                                <dd>
                                  <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-xl bg-lab-surface p-3 font-mono text-[11px] leading-relaxed">
                                    {JSON.stringify(log.details ?? {}, null, 2)}
                                  </pre>
                                </dd>
                              </dl>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
