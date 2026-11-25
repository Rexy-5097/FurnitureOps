'use client';

import { memo, useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useRenderCount } from '@/features/lab/hooks';
import { buttonClass } from '@/features/lab/components/StateViews';
import { cx } from '@/features/lab/utils/format';

/**
 * The Hooks Bench: small, observable experiments for INT252 Units I, III and IV.
 * Each panel shows a concept and a number you can watch change.
 */

function Panel({ unit, title, children, note }: { unit: string; title: string; children: ReactNode; note: ReactNode }) {
  return (
    <section className="flex flex-col rounded-[24px] border border-lab-line bg-lab-surface p-7">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-lab-accent">{unit}</p>
      <h2 className="mt-2 font-display text-2xl">{title}</h2>
      <div className="mt-6 flex-1">{children}</div>
      <p className="mt-6 border-t border-lab-line pt-4 text-sm leading-relaxed text-lab-muted">{note}</p>
    </section>
  );
}

const Stat = ({ label, value, tone }: { label: string; value: ReactNode; tone?: 'accent' | 'moss' | 'danger' }) => (
  <div className="rounded-2xl border border-lab-line px-4 py-3">
    <p className="text-[11px] uppercase tracking-[0.14em] text-lab-muted">{label}</p>
    <p className={cx('mt-1 font-display text-2xl tabular-nums', tone === 'accent' && 'text-lab-accent', tone === 'moss' && 'text-lab-moss', tone === 'danger' && 'text-lab-danger')}>
      {value}
    </p>
  </div>
);

/* ── 1. React.memo + useCallback ───────────────────────────── */

const MemoSwatch = memo(function MemoSwatch({ onPick, label }: { onPick: () => void; label: string }) {
  const renders = useRenderCount();
  return (
    <button type="button" onClick={onPick} className="flex w-full items-center justify-between rounded-2xl border border-lab-line px-4 py-3 text-left text-sm hover:border-lab-ink">
      <span>{label}</span>
      <span className="text-xs text-lab-muted">
        child renders <strong className="tabular-nums text-lab-ink">{renders}</strong>
      </span>
    </button>
  );
});

function MemoDemo() {
  const [ticks, setTicks] = useState(0);
  const [picks, setPicks] = useState(0);
  const [stable, setStable] = useState(true);
  const parentRenders = useRenderCount();

  const stableHandler = useCallback(() => setPicks((p) => p + 1), []);
  const freshHandler = () => setPicks((p) => p + 1); // new function every render
  const onPick = stable ? stableHandler : freshHandler;

  return (
    <Panel
      unit="Unit III · Performance"
      title="React.memo needs stable props"
      note={
        <>
          The child is wrapped in <code>React.memo</code>. With <code>useCallback</code> its <code>onPick</code> prop keeps the same
          reference, so re-rendering the parent skips the child. Turn it off and every parent render creates a new function, so the
          memo check fails.
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Parent renders" value={parentRenders} />
        <Stat label="Picks" value={picks} tone="accent" />
      </div>
      <div className="mt-4 space-y-3">
        <MemoSwatch onPick={onPick} label="Pick this swatch" />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={buttonClass.primary} onClick={() => setTicks((t) => t + 1)}>
            Re-render parent ({ticks})
          </button>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={stable} onChange={(e) => setStable(e.target.checked)} />
            useCallback
          </label>
        </div>
      </div>
    </Panel>
  );
}

/* ── 2. State batching + functional updates ────────────────── */

function BatchingDemo() {
  const [count, setCount] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const renders = useRenderCount();

  const addThreeStale = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
    setLog((l) => [`count + 1 ×3 → ${count + 1}`, ...l].slice(0, 4));
  };
  const addThreeFunctional = () => {
    setCount((c) => c + 1);
    setCount((c) => c + 1);
    setCount((c) => c + 1);
    setLog((l) => [`c => c + 1 ×3 → ${count + 3}`, ...l].slice(0, 4));
  };

  return (
    <Panel
      unit="Unit III · States and events"
      title="Batching and stale state"
      note={
        <>
          Both buttons call the setter three times plus <code>setLog</code>, yet the component renders once per click: React batches
          updates. Only the functional form <code>c =&gt; c + 1</code> sees the previous value; the other reads the same stale{' '}
          <code>count</code> three times.
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Count" value={count} tone="accent" />
        <Stat label="Renders" value={renders} />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={buttonClass.ghost} onClick={addThreeStale}>
          count + 1, three times
        </button>
        <button type="button" className={buttonClass.primary} onClick={addThreeFunctional}>
          c =&gt; c + 1, three times
        </button>
      </div>
      <ul className="mt-4 space-y-1 font-mono text-xs text-lab-muted">
        {log.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </Panel>
  );
}

/* ── 3. useEffect dependencies + cleanup ───────────────────── */

function KilnTimer({ speed, onLog }: { speed: number; onLog: (msg: string) => void }) {
  const [temp, setTemp] = useState(20);
  useEffect(() => {
    onLog(`effect: start interval @ ${speed}ms`);
    const id = setInterval(() => setTemp((t) => (t >= 120 ? 20 : t + 5)), speed);
    return () => {
      clearInterval(id);
      onLog(`cleanup: clear interval @ ${speed}ms`);
    };
  }, [speed, onLog]);
  return <Stat label="Kiln temperature" value={`${temp}°C`} tone={temp > 90 ? 'danger' : 'accent'} />;
}

function EffectDemo() {
  const [mounted, setMounted] = useState(true);
  const [speed, setSpeed] = useState(400);
  const [log, setLog] = useState<string[]>([]);
  const onLog = useCallback((msg: string) => setLog((l) => [msg, ...l].slice(0, 6)), []);

  return (
    <Panel
      unit="Unit III · Side effects"
      title="Effects clean up after themselves"
      note={
        <>
          The interval is created in <code>useEffect</code> with <code>[speed]</code> as a dependency. Changing the speed runs the
          cleanup for the old interval before starting a new one; unmounting runs cleanup once more, so no timer leaks. In
          development, Strict Mode mounts twice, so you may see an extra start/cleanup pair.
        </>
      }
    >
      {mounted ? <KilnTimer speed={speed} onLog={onLog} /> : <Stat label="Kiln" value="Unmounted" />}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" className={buttonClass.ghost} onClick={() => setMounted((m) => !m)}>
          {mounted ? 'Unmount' : 'Mount'}
        </button>
        <label className="flex items-center gap-2 text-sm">
          Speed
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="rounded-full border border-lab-line bg-transparent px-3 py-1.5">
            <option value={200}>Fast</option>
            <option value={400}>Normal</option>
            <option value={900}>Slow</option>
          </select>
        </label>
      </div>
      <ul className="mt-4 space-y-1 font-mono text-xs text-lab-muted">
        {log.map((line, i) => (
          <li key={i} className={line.startsWith('cleanup') ? 'text-lab-danger' : 'text-lab-moss'}>
            {line}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ── 4. Controlled vs uncontrolled ─────────────────────────── */

function FormsDemo() {
  const [controlled, setControlled] = useState('');
  const uncontrolledRef = useRef<HTMLInputElement>(null);
  const [submittedValue, setSubmittedValue] = useState<string | null>(null);
  const renders = useRenderCount();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSubmittedValue(String(data.get('uncontrolled') ?? ''));
  };

  return (
    <Panel
      unit="Unit IV · Form handling"
      title="Controlled vs uncontrolled"
      note={
        <>
          The controlled input lives in React state, so every keystroke re-renders and the value is always available (good for live
          validation). The uncontrolled input keeps its value in the DOM; React reads it once on submit through{' '}
          <code>FormData</code> or a ref.
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          Controlled
          <input
            value={controlled}
            onChange={(e) => setControlled(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-lab-line bg-lab-paper px-4"
            placeholder="Type a material"
          />
          <span className="mt-1 block text-xs text-lab-muted">
            state: “{controlled}” · {controlled.length} chars · renders {renders}
          </span>
        </label>
        <label className="block text-sm">
          Uncontrolled
          <input ref={uncontrolledRef} name="uncontrolled" defaultValue="Walnut" className="mt-1.5 h-11 w-full rounded-xl border border-lab-line bg-lab-paper px-4" />
        </label>
        <div className="flex items-center gap-3">
          <button type="submit" className={buttonClass.primary}>
            Submit
          </button>
          {submittedValue !== null && <span className="text-sm text-lab-muted">read on submit: “{submittedValue}”</span>}
        </div>
      </form>
    </Panel>
  );
}

/* ── 5. Shallow vs deep copy, referential equality ─────────── */

type Piece = { name: string; dims: { w: number } };

function CopyDemo() {
  const [result, setResult] = useState<null | { original: number; shallow: number; deep: number; sameRef: boolean; sameNested: boolean }>(null);

  const run = () => {
    const original: Piece = { name: 'Kaya', dims: { w: 200 } };
    const shallow = { ...original };
    const deep = structuredClone(original);
    shallow.dims.w = 240; // mutates the shared nested object!
    deep.dims.w = 180;
    setResult({
      original: original.dims.w,
      shallow: shallow.dims.w,
      deep: deep.dims.w,
      sameRef: Object.is(original, shallow),
      sameNested: Object.is(original.dims, shallow.dims),
    });
  };

  return (
    <Panel
      unit="Unit I · Immutability"
      title="Shallow copies share their insides"
      note={
        <>
          Spread copies only the top level, so <code>shallow.dims</code> is the same object as <code>original.dims</code>; writing
          to it changes the original too. <code>structuredClone</code> copies all the way down. React compares state with{' '}
          <code>Object.is</code>, so mutating nested data can hide changes from React.
        </>
      }
    >
      <button type="button" className={buttonClass.primary} onClick={run}>
        Run the experiment
      </button>
      {result && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="original.w" value={result.original} tone={result.original !== 200 ? 'danger' : 'moss'} />
          <Stat label="shallow.w" value={result.shallow} />
          <Stat label="deep.w" value={result.deep} />
          <p className="col-span-3 font-mono text-xs text-lab-muted">
            Object.is(original, shallow) = {String(result.sameRef)} · Object.is(original.dims, shallow.dims) = {String(result.sameNested)}
          </p>
        </div>
      )}
    </Panel>
  );
}

export default function BenchDemos() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <MemoDemo />
      <BatchingDemo />
      <EffectDemo />
      <FormsDemo />
      <div className="lg:col-span-2">
        <CopyDemo />
      </div>
    </div>
  );
}
