'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export default function GlassCard({
  children,
  className,
  onClick,
  hoverEffect = true,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass-card glass-card-glow relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-lg transition-all duration-300',
        hoverEffect && 'hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl',
        onClick && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50',
        className
      )}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none" />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
