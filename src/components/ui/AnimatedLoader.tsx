'use client';

import { cn } from '@/lib/utils';

interface AnimatedLoaderProps {
  className?: string;
}

export default function AnimatedLoader({ className }: AnimatedLoaderProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="relative h-12 w-12 rounded-full border-4 border-white/20 border-t-white/80 animate-spin">
        <div className="absolute inset-0 rounded-full border-4 border-white/10 blur-[1px]" />
      </div>
    </div>
  );
}
