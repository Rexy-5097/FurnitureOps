/** Loading UI shown while the piece page streams in (INT257 Unit I). */
export default function PieceLoading() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 grid animate-pulse gap-16 pt-16 lg:grid-cols-12" aria-busy="true" aria-label="Loading piece">
      <div className="aspect-[4/5] rounded-[24px] bg-lab-line/70 lg:col-span-7" />
      <div className="space-y-5 lg:col-span-5 lg:pt-6">
        <div className="h-3 w-24 rounded bg-lab-line/70" />
        <div className="h-12 w-4/5 rounded bg-lab-line/70" />
        <div className="h-8 w-32 rounded bg-lab-line/70" />
        <div className="h-24 w-full rounded bg-lab-line/50" />
      </div>
    </div>
  );
}
