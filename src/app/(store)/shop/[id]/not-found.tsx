import Link from 'next/link';
import { CONTAINER, Notice, buttonClass } from '@/features/lab/components/StateViews';

export default function PieceNotFound() {
  return (
    <div className={`${CONTAINER} py-24`}>
      <Notice
        title="That piece has left the floor"
        action={
          <Link href="/shop" className={buttonClass.primary}>
            Back to the collection
          </Link>
        }
      >
        It may have sold out and been retired, or the link is out of date.
      </Notice>
    </div>
  );
}
