import type { Metadata } from 'next';
import BenchDemos from './BenchLoader';

export const metadata: Metadata = {
  title: 'Hooks bench',
  description: 'Interactive experiments for React rendering, hooks, forms and immutability.',
};

export default function BenchPage() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 pt-12">
      <header className="max-w-2xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-lab-accent">Hooks bench</p>
        <h1 className="mt-4 font-display text-[3.2rem] leading-none sm:text-[4.2rem]">See React think</h1>
        <p className="mt-4 text-lab-muted">
          Five small experiments from the INT252 practicals. Each one exposes a render count or a log so you can watch the
          behaviour instead of taking it on trust. Open React DevTools → Profiler alongside for the full picture.
        </p>
      </header>
      <div className="mt-12">
        <BenchDemos />
      </div>
    </main>
  );
}
