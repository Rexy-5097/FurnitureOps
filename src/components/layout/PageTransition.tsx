'use client';

import { useEffect, useState, ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`w-full ${mounted ? 'animate-page-in' : ''}`}>
      {children}
    </div>
  );
}
