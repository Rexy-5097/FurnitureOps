import type { Metadata } from 'next';
import Link from 'next/link';
import { COURSES, COVERAGE, type Course } from '@/features/lab/syllabus';
import { cx } from '@/features/lab/utils/format';

export const metadata: Metadata = {
  title: 'Syllabus map',
  description: 'Where each INT252 and INT257 topic is implemented in the FurnitureOps lab.',
};

const STATUS = {
  covered: { label: 'Covered', className: 'bg-lab-moss/10 text-lab-moss' },
  partial: { label: 'Partial', className: 'bg-lab-accent/10 text-lab-accent' },
  'not-applicable': { label: 'Elsewhere', className: 'bg-lab-ink/5 text-lab-muted' },
} as const;

/** Server Component filtered by a query parameter (?course=INT252). */
export default function SyllabusPage({ searchParams }: { searchParams: { course?: string } }) {
  const course = (Object.keys(COURSES) as Course[]).find((c) => c === searchParams.course);
  const rows = course ? COVERAGE.filter((r) => r.course === course) : COVERAGE;
  const covered = rows.filter((r) => (r.status ?? 'covered') === 'covered').length;

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 pt-12">
      <header className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-lab-accent">Syllabus map</p>
          <h1 className="mt-4 font-display text-[3.2rem] leading-none sm:text-[4.2rem]">Every topic, on the floor</h1>
          <p className="mt-4 text-lab-muted">
            Each row links a syllabus topic to the file that implements it and a place to try it. {covered} of {rows.length} topics
            shown are fully covered.
          </p>
        </div>
        <nav aria-label="Filter by course" className="flex gap-1 rounded-full border border-lab-line p-1">
          {[undefined, 'INT252', 'INT257'].map((c) => (
            <Link
              key={c ?? 'all'}
              href={c ? `/lab/syllabus?course=${c}` : '/lab/syllabus'}
              aria-current={course === c ? 'page' : undefined}
              className={cx('rounded-full px-4 py-2 text-sm', course === c ? 'bg-lab-ink text-lab-paper' : 'text-lab-muted hover:text-lab-ink')}
            >
              {c ?? 'Both courses'}
            </Link>
          ))}
        </nav>
      </header>

      {(course ? [course] : (Object.keys(COURSES) as Course[])).map((c) => (
        <section key={c} className="mt-16" aria-labelledby={`course-${c}`}>
          <h2 id={`course-${c}`} className="flex items-baseline gap-3 border-b border-lab-line pb-4">
            <span className="font-display text-3xl">{c}</span>
            <span className="text-sm text-lab-muted">{COURSES[c]}</span>
          </h2>
          <ol className="divide-y divide-lab-line">
            {rows
              .filter((r) => r.course === c)
              .map((r) => {
                const status = STATUS[r.status ?? 'covered'];
                return (
                  <li key={r.topic} className="grid gap-4 py-7 md:grid-cols-12">
                    <div className="md:col-span-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-lab-muted">Unit {r.unit}</p>
                      <h3 className="mt-1 font-display text-xl leading-snug">{r.topic}</h3>
                      <span className={cx('mt-3 inline-block rounded-full px-3 py-1 text-xs', status.className)}>{status.label}</span>
                    </div>
                    <div className="md:col-span-6">
                      <p className="text-[15px] leading-relaxed">{r.how}</p>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {r.files.map((f) => (
                          <li key={f}>
                            <code className="rounded-md bg-lab-ink/[0.05] px-2 py-1 font-mono text-[11px] text-lab-muted">{f}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="md:col-span-2 md:text-right">
                      {r.try && (
                        <a href={r.try.href} className="text-sm font-medium text-lab-accent underline-offset-4 hover:underline">
                          {r.try.label} →
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
          </ol>
        </section>
      ))}
    </main>
  );
}
