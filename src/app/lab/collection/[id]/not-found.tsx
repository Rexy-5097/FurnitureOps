import Link from 'next/link';
import { Notice, buttonClass } from '@/features/lab/components/StateViews';

export default function PieceNotFound() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 py-24">
      <Notice
        title="That piece has left the floor"
        action={
          <Link href="/lab/collection" className={buttonClass.primary}>
            Back to the collection
          </Link>
        }
      >
        It may have been removed in the studio, or the lab data was reset after a restart.
      </Notice>
    </div>
  );
}
