import { CONTAINER } from '@/features/lab/components/StateViews';
import type { InventorySource } from './inventory';

/** Tells developers (sample data) and visitors (outage) why the floor looks the way it does. */
export default function SourceNotice({ source }: { source: InventorySource }) {
  if (source === 'live') return null;
  const sample = source === 'sample';
  return (
    <div role="status" className={sample ? 'bg-lab-sand' : 'bg-lab-danger/10'}>
      <p className={`${CONTAINER} py-2.5 text-[13px] font-semibold ${sample ? 'text-lab-muted' : 'text-lab-danger'}`}>
        {sample
          ? 'Development preview: Supabase keys are not set, so the store is showing the lab sample catalogue.'
          : 'We could not load live stock just now. Please refresh in a moment.'}
      </p>
    </div>
  );
}
