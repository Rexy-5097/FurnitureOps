'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Custom hooks for logic reuse (INT252 Unit III, practical 8).
 * Each follows the rules of hooks: called unconditionally, at the top level.
 */

/** Delays a fast-changing value (search input) so we don't refetch on every keystroke. */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // cleanup cancels the previous timer
  }, [value, delay]);
  return debounced;
}

/** True after the first client render; avoids hydration mismatches with persisted stores. */
export function useHasHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

/** Counts renders without causing one (a ref, not state). Used by the Hooks Bench. */
export function useRenderCount() {
  const count = useRef(0);
  count.current += 1;
  return count.current;
}

/** Re-renders every `ms` so relative timestamps stay fresh. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
