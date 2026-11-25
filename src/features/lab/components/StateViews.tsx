import type { ReactNode } from 'react';

/** Reusable loading / error / empty states (INT252 Unit V, INT257 Unit I). */

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Loading pieces">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] rounded-2xl bg-lab-line/70" />
          <div className="mt-3 h-4 w-2/3 rounded bg-lab-line/70" />
          <div className="mt-2 h-3 w-1/3 rounded bg-lab-line/70" />
        </div>
      ))}
    </div>
  );
}

export function Notice({
  tone = 'neutral',
  title,
  children,
  action,
}: {
  tone?: 'neutral' | 'danger';
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={
        'flex flex-col items-center rounded-[22px] border px-6 py-16 text-center ' +
        (tone === 'danger' ? 'border-lab-danger/30 bg-lab-danger/5' : 'border-lab-line bg-lab-surface')
      }
    >
      <p className="font-display text-2xl text-lab-ink">{title}</p>
      {children && <div className="mt-2 max-w-md text-sm leading-relaxed text-lab-muted">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export const buttonClass = {
  primary:
    'inline-flex h-11 items-center justify-center gap-2 rounded-full bg-lab-forest px-6 text-sm font-semibold text-lab-on-dark transition-opacity hover:opacity-90 disabled:opacity-40',
  ghost:
    'inline-flex h-11 items-center justify-center gap-2 rounded-full border border-lab-line bg-lab-surface px-6 text-sm font-semibold text-lab-ink transition-colors hover:border-lab-ink disabled:opacity-40',
  danger:
    'inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-medium text-lab-danger transition-colors hover:bg-lab-danger/10 disabled:opacity-40',
};

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lab-muted">{children}</p>;
}

/** Page-width wrapper shared by the shell and every lab page. */
export const CONTAINER = 'mx-auto w-full max-w-[1280px] px-4 sm:px-8';
