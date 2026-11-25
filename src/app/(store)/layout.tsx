import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import SiteShell from '@/features/lab/components/SiteShell';

/**
 * Layout for the live site: home, shop, product pages, login and the studio
 * dashboard. A route group, so URLs stay /, /shop, /login and /dashboard.
 */
export const metadata: Metadata = {
  title: { template: '%s · FurnitureOps', default: 'FurnitureOps · Honest furniture, honest stock' },
  description: 'Hand-picked furniture with live stock from the showroom floor.',
  openGraph: { title: 'FurnitureOps', images: ['/images/hero-living-room.png'] },
};

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <SiteShell site="store">
      {children}
    </SiteShell>
  );
}
