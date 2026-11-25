'use client';

import dynamic from 'next/dynamic';
import { GridSkeleton } from '@/features/lab/components/StateViews';

// Route-level code splitting, client-only: render counters differ between the
// server render and Strict Mode's double client render, so skip SSR entirely.
const BenchDemos = dynamic(() => import('./BenchDemos'), {
  ssr: false,
  loading: () => <GridSkeleton count={4} />,
});

export default BenchDemos;
