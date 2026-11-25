import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import SiteShell from '@/features/lab/components/SiteShell';
import { fontClasses } from '@/features/lab/fonts';
import { getLabRole } from '@/features/lab/session';
import '@/features/lab/lab.css';

/**
 * Layout route for /lab (INT257 Unit I). It wraps every lab page and also
 * receives the `modal` parallel-route slot (INT257 Unit VI).
 */

// Metadata API (INT257 Unit V): child pages fill in %s.
export const metadata: Metadata = {
  title: { template: '%s · FurnitureOps Lab', default: 'FurnitureOps Lab' },
  description: 'The FurnitureOps design lab: sample catalogue, studio and React/Next.js experiments.',
  robots: { index: false, follow: false }, // keep the sandbox out of search results
  openGraph: { title: 'FurnitureOps Lab', images: ['/images/hero-living-room.png'] },
};

export default function LabLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  return (
    <SiteShell site="lab" labRole={getLabRole()} fontClasses={fontClasses}>
      {children}
      {modal}
    </SiteShell>
  );
}
