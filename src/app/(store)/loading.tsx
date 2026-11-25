import { CONTAINER, GridSkeleton } from '@/features/lab/components/StateViews';

/** Loading UI for live store pages while server data streams in. */
export default function StoreLoading() {
  return (
    <div className={`${CONTAINER} pt-12`} aria-busy="true">
      <div className="h-3 w-28 animate-pulse rounded bg-lab-line/70" />
      <div className="mt-4 h-14 w-2/3 max-w-xl animate-pulse rounded bg-lab-line/70" />
      <div className="mt-14">
        <GridSkeleton count={8} />
      </div>
    </div>
  );
}
