'use client';

import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Shield, TrendingUp, Zap, ChevronRight, ArrowDown } from 'lucide-react';

/* ── Intersection Observer hook (fires once) ── */
function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.15) {
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsInView(true); },
      { threshold }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return isInView;
}

/* ── Scroll-progress hook (0-1 over first viewport height) ── */
function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const vh = window.innerHeight;
      setProgress(Math.min(window.scrollY / vh, 1));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return progress;
}

/* ── Animated counter hook ── */
function useCounter(target: number, duration: number, start: boolean, decimals = 1) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration, decimals]);
  return value;
}

/* ── Floating particles ── */
const PARTICLES = [
  { size: 4,  top: '15%', left: '10%', delay: '0s',   duration: '7s' },
  { size: 3,  top: '25%', left: '80%', delay: '1s',   duration: '8s' },
  { size: 5,  top: '60%', left: '15%', delay: '2s',   duration: '6s' },
  { size: 3,  top: '70%', left: '75%', delay: '0.5s', duration: '9s' },
  { size: 4,  top: '40%', left: '50%', delay: '1.5s', duration: '7s' },
  { size: 2,  top: '80%', left: '30%', delay: '3s',   duration: '8s' },
  { size: 3,  top: '10%', left: '60%', delay: '2.5s', duration: '6s' },
];

export default function LandingPageContent() {
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const s2Visible = useInView(section2Ref);
  const s3Visible = useInView(section3Ref);
  const scrollProgress = useScrollProgress();

  // Animated stat counters
  const accuracy = useCounter(99.9, 2000, s2Visible, 1);

  // Nav opacity on scroll
  const navBg = `rgba(0,0,0,${Math.min(0.4 + scrollProgress * 0.5, 0.9)})`;

  return (
    <div className="relative bg-black text-white overflow-x-hidden">
      {/* ── Animated ambient gradients ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] animate-drift" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] animate-drift" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[50%] left-[50%] w-[30%] h-[30%] bg-indigo-900/10 rounded-full blur-[100px] animate-drift" style={{ animationDelay: '5s' }} />
      </div>

      {/* ── Floating particles ── */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="particle animate-float"
            style={{
              width: p.size,
              height: p.size,
              top: p.top,
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              opacity: 0.4,
            }}
          />
        ))}
      </div>

      {/* ── Navigation with scroll-aware blur ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-12 border-b border-white/5 transition-all duration-500"
        style={{
          backgroundColor: navBg,
          backdropFilter: `blur(${8 + scrollProgress * 12}px)`,
          WebkitBackdropFilter: `blur(${8 + scrollProgress * 12}px)`,
        }}
      >
        <div className="text-xl font-bold tracking-tighter">FurnitureOps</div>
        <Link
          href="/login"
          className="px-5 py-2 text-sm font-medium transition-all duration-300 border rounded-full border-white/20 bg-white/5 hover:bg-white/15 hover:border-white/40 hover:shadow-lg hover:shadow-white/5"
        >
          Sign In
        </Link>
      </nav>

      {/* ════════════════════════════════════
          SECTION 1 — HERO  (normal flow)
         ════════════════════════════════════ */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-24">
        <div
          className="text-center max-w-4xl"
          style={{
            opacity: 1 - scrollProgress * 1.5,
            transform: `translateY(${scrollProgress * -60}px)`,
            willChange: 'transform, opacity',
          }}
        >
          {/* Shimmer heading */}
          <h1 className="text-6xl font-bold tracking-tight md:text-8xl text-shimmer animate-fade-up">
            Inventory Intelligence.
          </h1>
          <p
            className="mt-6 text-xl text-white/60 md:text-2xl animate-fade-up"
            style={{ animationDelay: '0.15s' }}
          >
            The premium operating system for modern furniture logistics.
          </p>

          {/* Ghost CTA button — appears below subtitle */}
          <div className="mt-10 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 px-7 py-3 text-sm font-medium border rounded-full border-white/20 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-all duration-300"
            >
              Explore Dashboard
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Scroll indicator — fades as you scroll */}
        <div
          className="absolute bottom-12 flex flex-col items-center gap-2 transition-opacity duration-500"
          style={{ opacity: Math.max(1 - scrollProgress * 3, 0) }}
        >
          <span className="text-sm text-white/30 animate-fade-up" style={{ animationDelay: '0.5s' }}>
            Scroll to explore
          </span>
          <ArrowDown className="w-5 h-5 text-white/30 animate-bounce" style={{ animationDelay: '0.6s' }} />
        </div>
      </section>

      {/* ════════════════════════════════════
          SECTION 2 — FEATURES  (covers hero)
         ════════════════════════════════════ */}
      <section
        ref={section2Ref}
        className="relative z-20 flex items-center justify-center min-h-screen px-6 py-24 bg-black"
      >
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left column — text */}
          <div className={`transition-all duration-700 ${s2Visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Real-time<br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Inventory Sync</span>
            </h2>
            <p className="text-lg text-white/60 leading-relaxed">
              Experience zero-latency updates across your entire supply chain.
              Our atomic guarantee ensures that what you see is exactly what you have.
            </p>
            <ul className="mt-8 space-y-4">
              {['Supabase Realtime', 'Edge Caching', 'Instant Revalidation'].map((item, i) => (
                <li
                  key={item}
                  className={`flex items-center gap-3 text-white/80 transition-all duration-500 ${s2Visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-5'}`}
                  style={{ transitionDelay: `${i * 120 + 300}ms` }}
                >
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-glow-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right column — stat cards */}
          <div className={`grid gap-6 transition-all duration-700 ${s2Visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`} style={{ transitionDelay: '200ms' }}>
            <GlassCard className="glass-card-glow p-8 h-64 flex flex-col justify-between">
              <TrendingUp className="h-10 w-10 text-blue-400" />
              <div>
                <div className="text-5xl font-bold tabular-nums">
                  {s2Visible ? `${accuracy}%` : '0%'}
                </div>
                <div className="text-sm text-white/40 mt-1">Accuracy Rate</div>
              </div>
            </GlassCard>
            <GlassCard className="glass-card-glow p-8 h-48 flex items-center gap-6">
              <Zap className="h-10 w-10 text-yellow-400 animate-icon-float" />
              <div>
                <div className="text-2xl font-bold">Sub-ms Latency</div>
                <div className="text-sm text-white/40">Global Edge Network</div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          SECTION 3 — CTA  (covers above)
         ════════════════════════════════════ */}
      <section
        ref={section3Ref}
        className="relative z-20 flex flex-col items-center justify-center min-h-[80vh] px-6 py-24 text-center bg-gradient-to-b from-black via-gray-950 to-black"
      >
        <div className={`max-w-3xl transition-all duration-700 ${s3Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Shield className="h-16 w-16 mx-auto text-purple-400 mb-8 animate-icon-float" />
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
            Ready to scale?
          </h2>
          <p className="text-xl text-white/60 mb-12">
            Join the future of furniture operations today.
          </p>

          {/* CTA button with glow pulse ring */}
          <div className="relative inline-block">
            {/* Glow ring behind button */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 blur-xl animate-glow-pulse opacity-40" />
            <Link
              href="/dashboard"
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-semibold text-lg hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/20"
            >
              Enter Dashboard
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-20 py-8 text-center text-sm text-white/20 border-t border-white/5 bg-black">
        © {new Date().getFullYear()} FurnitureOps. Built with precision.
      </footer>
    </div>
  );
}
