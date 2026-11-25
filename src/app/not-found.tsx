import Link from 'next/link';
import StandaloneFrame from '@/features/lab/components/StandaloneFrame';
import { buttonClass } from '@/features/lab/components/StateViews';

/** Global 404 for any URL that matches no route. */
export default function NotFound() {
  return (
    <StandaloneFrame>
      <div className="max-w-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lab-muted">Error 404</p>
        <h1 className="mt-3 text-[clamp(3.2rem,7vw,5.4rem)]">
          This room
          <em className="block italic text-lab-accent">doesn&apos;t exist.</em>
        </h1>
        <p className="mt-6 text-[17px] leading-relaxed text-lab-muted">
          The page may have moved, or the link has a typo. The collection is still right where you left it.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className={buttonClass.primary}>
            Back to home
          </Link>
          <Link href="/shop" className={buttonClass.ghost}>
            Shop the collection
          </Link>
        </div>
      </div>
    </StandaloneFrame>
  );
}
