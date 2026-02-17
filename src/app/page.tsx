'use client';

import dynamic from 'next/dynamic';

const LandingPageContent = dynamic(
  () => import('@/components/LandingPageContent'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-white/20 border-t-white/80 animate-spin" />
      </div>
    ),
  }
);

export default function LandingPage() {
  return <LandingPageContent />;
}
