'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useRef, useEffect } from 'react';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Skip animation on the very first mount to avoid hydration mismatch,
  // but animate on subsequent route changes.
  const isFirstMount = useRef(true);

  useEffect(() => {
    isFirstMount.current = false;
  }, []);

  return (
    <motion.div
      key={pathname}
      initial={isFirstMount.current ? false : { opacity: 0, y: 16, scale: 0.98, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, scale: 0.98, filter: 'blur(6px)' }}
      transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
      className="w-full"
      suppressHydrationWarning
    >
      {children}
    </motion.div>
  );
}
