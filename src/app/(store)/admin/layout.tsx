import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// The pages are Client Components, so metadata lives here. A layout that sets
// its own title must also pass the template on, or /admin/audit loses the suffix.
export const metadata: Metadata = {
  title: { absolute: 'Admin console · FurnitureOps', template: '%s · FurnitureOps' },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
