import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import LabShell from '@/features/lab/components/LabShell';
import { getLabRole } from '@/features/lab/session';
import '@/features/lab/lab.css';

/**
 * Layout route for /lab (INT257 Unit I). It wraps every lab page and also
 * receives the `modal` parallel-route slot (INT257 Unit VI).
 */

// next/font self-hosts both families at build time: no layout shift, no Google request at runtime.
const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-lab-display',
  display: 'swap',
});
const body = Manrope({ subsets: ['latin'], variable: '--font-lab-body', display: 'swap' });

// Metadata API (INT257 Unit V): child pages fill in %s.
export const metadata: Metadata = {
  title: { template: '%s · FurnitureOps Lab', default: 'FurnitureOps Lab' },
  description: 'A preview of the FurnitureOps redesign: curated furniture, live stock and a showroom studio.',
  robots: { index: false, follow: false }, // keep the sandbox out of search results
  openGraph: { title: 'FurnitureOps Lab', images: ['/images/hero-living-room.png'] },
};

export default function LabLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  const role = getLabRole();
  return (
    <LabShell role={role} fontClasses={`${display.variable} ${body.variable}`}>
      {children}
      {modal}
    </LabShell>
  );
}
