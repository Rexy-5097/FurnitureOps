import StorefrontHome from '@/features/lab/components/StorefrontHome';
import { listItems } from '@/features/lab/data/store';

/**
 * Lab home: the same storefront as the live site, fed by the in-memory sample
 * catalogue. ISR: regenerated at most every 60 s, or immediately when a
 * Server Action calls revalidatePath.
 */
export const revalidate = 60;

export default function LabHome() {
  return <StorefrontHome site="lab" items={listItems()} />;
}
