import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { can, ROLE_COPY } from '@/features/lab/auth';
import { getLabRole } from '@/features/lab/session';
import ItemForm from './ItemForm';
import StockLedger from './StockLedger';

export const metadata: Metadata = { title: 'Studio' };
export const dynamic = 'force-dynamic';

/**
 * Protected route. Middleware already redirects guests at the edge; this
 * server-side check is defence in depth in case the matcher changes.
 */
export default function StudioPage() {
  const role = getLabRole();
  if (!can(role, 'create')) redirect('/lab/sign-in?next=/lab/studio');

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 pt-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-lab-accent">Studio</p>
          <h1 className="mt-4 font-display text-[3.2rem] leading-none sm:text-[4.2rem]">Manage the floor</h1>
        </div>
        <p className="rounded-full border border-lab-line px-4 py-2 text-sm text-lab-muted">
          Signed in as <span className="text-lab-ink">{ROLE_COPY[role].title}</span>
          {can(role, 'delete') ? ' · can delete and reset' : ' · cannot delete'}
        </p>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-12">
        <section aria-labelledby="new-piece" className="lg:col-span-5">
          <h2 id="new-piece" className="font-display text-2xl">
            Add a piece
          </h2>
          <p className="mt-1 text-sm text-lab-muted">Validated with Zod in the browser, then again in the Server Action.</p>
          <ItemForm />
        </section>

        <section aria-labelledby="ledger" className="lg:col-span-7">
          <StockLedger canDelete={can(role, 'delete')} canReset={can(role, 'reset')} />
        </section>
      </div>
    </main>
  );
}
