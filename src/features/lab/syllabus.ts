/** Where each syllabus topic lives in the lab. Rendered by /lab/syllabus. */

export type Course = 'INT252' | 'INT257';
export type Coverage = {
  course: Course;
  unit: string;
  topic: string;
  how: string;
  files: string[];
  try?: { label: string; href: string };
  status?: 'covered' | 'partial' | 'not-applicable';
};

export const COURSES: Record<Course, string> = {
  INT252: 'Web App Development with ReactJS',
  INT257: 'Modern Web Application Development',
};

export const COVERAGE: Coverage[] = [
  // ── INT252 ────────────────────────────────────────────
  {
    course: 'INT252', unit: 'I', topic: 'ES6+, array methods, destructuring, spread/rest',
    how: 'Pure helpers and the store use arrow functions, filter/map/reduce/toSorted, destructuring in parameters and spread for copies.',
    files: ['src/features/lab/utils/format.ts', 'src/features/lab/data/store.ts'],
  },
  {
    course: 'INT252', unit: 'I', topic: 'Immutability, shallow vs deep copy, referential equality',
    how: 'Store writes replace arrays; the seed is frozen and deep-copied with structuredClone. The bench shows a spread copy leaking a nested change.',
    files: ['src/features/lab/data/store.ts', 'src/app/lab/bench/BenchDemos.tsx'],
    try: { label: 'Copy experiment', href: '/lab/bench' },
  },
  {
    course: 'INT252', unit: 'I', topic: 'SPA vs MPA, Virtual DOM, feature-based folders',
    how: 'App Router gives server-rendered pages with client-side transitions. Lab code is grouped by feature under src/features/lab. (The project uses Next.js, so Vite set-up is not part of this repo.)',
    files: ['src/features/lab/'], status: 'partial',
  },
  {
    course: 'INT252', unit: 'II', topic: 'Reusable components, composition, conditional rendering',
    how: 'ProductCard, PieceVisual, Field and Notice are props-driven. PieceDetail is composed into both a full page and a modal. PieceVisual renders a photo or a swatch.',
    files: ['src/features/lab/components/ProductCard.tsx', 'src/features/lab/components/PieceDetail.tsx', 'src/features/lab/components/PieceVisual.tsx'],
    try: { label: 'Collection', href: '/lab/collection' },
  },
  {
    course: 'INT252', unit: 'II', topic: 'Tailwind, responsive breakpoints, accessibility, semantic HTML',
    how: 'Theme tokens are Tailwind colours backed by CSS variables. Layouts use sm/lg breakpoints. Labels, aria-invalid, aria-live, dialog roles, a table caption and breadcrumbs are in place.',
    files: ['tailwind.config.ts', 'src/features/lab/lab.css', 'src/features/lab/components/Field.tsx'],
  },
  {
    course: 'INT252', unit: 'III', topic: 'useState, events, batching, derived state',
    how: 'The form derives its errors from values instead of storing them. The bench shows batching and stale vs functional updates.',
    files: ['src/app/lab/studio/ItemForm.tsx', 'src/app/lab/bench/BenchDemos.tsx'],
    try: { label: 'Batching demo', href: '/lab/bench' },
  },
  {
    course: 'INT252', unit: 'III', topic: 'useEffect, dependency arrays, cleanup',
    how: 'The theme effect restores the saved choice and syncs other tabs through a storage listener removed on cleanup. The modal and drawer lock scrolling and restore it. The kiln timer logs every start and cleanup.',
    files: ['src/features/lab/state/theme-context.tsx', 'src/features/lab/components/Modal.tsx', 'src/app/lab/bench/BenchDemos.tsx'],
    try: { label: 'Effect demo', href: '/lab/bench' },
  },
  {
    course: 'INT252', unit: 'III', topic: 'useMemo, useCallback, React.memo, custom hooks',
    how: 'ProductCard is memoised. useDebounce, useHasHydrated, useRenderCount and useNow are custom hooks. The bench toggles useCallback to show memo breaking.',
    files: ['src/features/lab/hooks/index.ts', 'src/features/lab/components/ProductCard.tsx'],
    try: { label: 'Memo demo', href: '/lab/bench' },
  },
  {
    course: 'INT252', unit: 'IV', topic: 'Controlled and uncontrolled forms, reusable fields',
    how: 'The studio form is fully controlled. The bench reads an uncontrolled input through FormData. Field components share label, hint and error wiring.',
    files: ['src/app/lab/studio/ItemForm.tsx', 'src/features/lab/components/Field.tsx'],
    try: { label: 'Studio form', href: '/lab/studio' },
  },
  {
    course: 'INT252', unit: 'IV', topic: 'Schema validation with Zod',
    how: 'One schema validates in the browser, in the Server Action and in the Route Handlers. Errors appear for touched fields and again after submit.',
    files: ['src/features/lab/schema.ts'],
    try: { label: 'Submit an empty form', href: '/lab/studio' },
  },
  {
    course: 'INT252', unit: 'V', topic: 'REST, fetch, loading/error/empty states',
    how: 'The collection fetches /api/lab/inventory. Lab switches add latency or force a 503 so each state can be inspected.',
    files: ['src/app/lab/collection/CollectionView.tsx', 'src/features/lab/components/StateViews.tsx'],
    try: { label: 'Toggle Lab switches', href: '/lab/collection' },
  },
  {
    course: 'INT252', unit: 'V', topic: 'React Query: caching, background sync, optimistic updates',
    how: 'Queries are keyed by filters, cached for 15 s and refetched every 10 s. Stock changes and deletes update the cache first and roll back on error.',
    files: ['src/features/lab/hooks/use-lab-inventory.ts', 'src/app/lab/studio/StockLedger.tsx'],
    try: { label: 'Stock ledger', href: '/lab/studio' },
  },
  {
    course: 'INT252', unit: 'V', topic: 'Routing: dynamic, nested, query params, protected, code splitting',
    how: 'Filters live in the URL. /lab/collection/[id] is dynamic and nested under the lab layout. /lab/studio is protected. The bench and drawer load as separate chunks.',
    files: ['src/app/lab/', 'src/middleware.ts'],
    try: { label: 'Filtered link', href: '/lab/collection?category=lighting&sort=price-asc' },
  },
  {
    course: 'INT252', unit: 'VI', topic: 'Context, Zustand, local vs global vs server state',
    how: 'Theme uses Context. Moodboard and currency use Zustand with persist and selectors. Inventory is server state in React Query. Form values stay local. (Redux Toolkit is not used: Zustand covers this app’s needs.)',
    files: ['src/features/lab/state/theme-context.tsx', 'src/features/lab/state/moodboard-store.ts'],
    try: { label: 'Save to moodboard', href: '/lab/collection' },
  },
  {
    course: 'INT252', unit: 'VI', topic: 'Debugging, env vars, production build',
    how: 'Render counters pair with React DevTools Profiler. The edge health route reports NEXT_PUBLIC_LAB_ENV. The lab error boundary logs errors with their digest.',
    files: ['src/app/api/lab/health/route.ts', 'src/app/lab/error.tsx'],
    try: { label: 'Edge health', href: '/api/lab/health' },
  },
  // ── INT257 ────────────────────────────────────────────
  {
    course: 'INT257', unit: 'I', topic: 'App Router, file-based routing, layouts, loading and error UI',
    how: 'src/app/lab has its own layout, error.tsx, loading.tsx and not-found.tsx, plus a breadcrumb trail on the detail page.',
    files: ['src/app/lab/layout.tsx', 'src/app/lab/error.tsx', 'src/app/lab/collection/[id]/loading.tsx'],
  },
  {
    course: 'INT257', unit: 'II', topic: 'SSR, SSG, ISR, CSR and choosing between them',
    how: 'Home and detail pages are static with revalidate = 60 (ISR); known ids are prebuilt via generateStaticParams. The studio is force-dynamic (SSR). The collection grid is client-rendered.',
    files: ['src/app/lab/page.tsx', 'src/app/lab/collection/[id]/page.tsx', 'src/app/lab/studio/page.tsx'],
  },
  {
    course: 'INT257', unit: 'II', topic: 'Server vs Client Components, caching and revalidation',
    how: 'Pages read data directly on the server; only interactive parts are marked “use client”. Server Actions call revalidatePath after writes.',
    files: ['src/app/lab/page.tsx', 'src/features/lab/actions.ts'],
  },
  {
    course: 'INT257', unit: 'III', topic: 'Route Handlers, REST methods, dynamic handlers',
    how: 'GET/POST on /api/lab/inventory and GET/PATCH/DELETE on /api/lab/inventory/[id], with 403, 404 and 422 responses.',
    files: ['src/app/api/lab/inventory/route.ts', 'src/app/api/lab/inventory/[id]/route.ts'],
    try: { label: 'GET inventory JSON', href: '/api/lab/inventory?category=seating' },
  },
  {
    course: 'INT257', unit: 'III', topic: 'Server Actions, form handling, mutations, optimistic UI',
    how: 'createItemAction validates and inserts; sign-in and sign-out are form actions that work without JavaScript. The stock ledger updates optimistically.',
    files: ['src/features/lab/actions.ts', 'src/app/lab/sign-in/page.tsx'],
    try: { label: 'Add a piece', href: '/lab/studio' },
  },
  {
    course: 'INT257', unit: 'III', topic: 'File upload',
    how: 'Not in the lab: the production dashboard already uploads images to Supabase Storage. The lab uses colour swatches so it needs no storage keys.',
    files: ['src/components/InventoryModal.tsx'], status: 'not-applicable',
  },
  {
    course: 'INT257', unit: 'IV', topic: 'Sessions, protected routes, role-based access control',
    how: 'An httpOnly cookie holds the lab role. Middleware redirects guests away from the studio; pages and handlers check permissions again. Guest, staff and admin see different controls.',
    files: ['src/features/lab/auth.ts', 'src/middleware.ts', 'src/app/lab/studio/page.tsx'],
    try: { label: 'Switch role', href: '/lab/sign-in' },
  },
  {
    course: 'INT257', unit: 'IV', topic: 'Database layer, CRUD, validation, env vars',
    how: 'An in-memory repository stands in for the ORM so the lab runs without credentials; the production app keeps Supabase. All CRUD inputs pass through Zod.',
    files: ['src/features/lab/data/store.ts'], status: 'partial',
  },
  {
    course: 'INT257', unit: 'V', topic: 'Image optimisation, Metadata API, lazy loading, SEO',
    how: 'next/image with static imports and blur placeholders, next/font, a metadata title template, generateMetadata per piece, noindex for the sandbox, and dynamic() imports.',
    files: ['src/app/lab/layout.tsx', 'src/app/lab/collection/[id]/page.tsx'],
  },
  {
    course: 'INT257', unit: 'VI', topic: 'Parallel routes, intercepting routes, Edge runtime, proxy/middleware',
    how: 'The @modal slot with (.)collection/[id] turns card clicks into a quick view. /api/lab/health runs on the Edge runtime. Middleware guards the studio.',
    files: ['src/app/lab/@modal/(.)collection/[id]/page.tsx', 'src/app/api/lab/health/route.ts'],
    try: { label: 'Click any card', href: '/lab/collection' },
  },
  {
    course: 'INT257', unit: 'VI', topic: 'Internationalisation',
    how: 'Prices format through Intl.NumberFormat in en-IN, en-US or de-DE depending on the chosen currency. Full locale routing is not included.',
    files: ['src/features/lab/utils/format.ts'], status: 'partial',
  },
];
