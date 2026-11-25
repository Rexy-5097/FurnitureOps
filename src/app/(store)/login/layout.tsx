import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// The page is a Client Component, so its metadata lives in this layout.
export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
