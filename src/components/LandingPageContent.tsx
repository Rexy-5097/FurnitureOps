'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef, useEffect, useState, useCallback } from 'react';
import {
  ChevronRight,
  ArrowDown,
  Truck,
  BarChart3,
  ShieldCheck,
  Layers,
  Sparkles,
  Clock,
  Globe,
  Star,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   HOOKS
   ══════════════════════════════════════════════════════════════ */

/** Fires once when element enters viewport */
function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.15) {
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsInView(true);
      },
      { threshold }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return isInView;
}

/** Scroll progress 0→1 over first viewport height */
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

/** Parallax value for an element based on scroll position */
function useParallax(speed = 0.3) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const onScroll = () => setOffset(window.scrollY * speed);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [speed]);
  return offset;
}

/** Animated counter */
function useCounter(target: number, duration: number, start: boolean, suffix = '') {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return value;
}

/* ══════════════════════════════════════════════════════════════
   SECTION COMPONENTS
   ══════════════════════════════════════════════════════════════ */

/* ── Chapter Badge ── */
function ChapterBadge({ number, label, visible }: { number: string; label: string; visible: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-3 mb-8 transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <span className="text-xs font-mono tracking-[0.3em] uppercase text-amber-400/80 border border-amber-400/20 px-3 py-1 rounded-full bg-amber-400/5">
        {number}
      </span>
      <span className="text-xs tracking-[0.2em] uppercase text-white/30">{label}</span>
    </div>
  );
}

/* ── Feature Pill ── */
function FeaturePill({
  icon: Icon,
  title,
  description,
  delay,
  visible,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
  visible: boolean;
}) {
  return (
    <div
      className={`group relative p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-500 cursor-default ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white/90 mb-1">{title}</h4>
          <p className="text-sm text-white/40 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({
  value,
  label,
  suffix,
  delay,
  visible,
}: {
  value: string;
  label: string;
  suffix?: string;
  delay: number;
  visible: boolean;
}) {
  return (
    <div
      className={`text-center transition-all duration-700 ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="text-4xl md:text-5xl font-bold tracking-tight text-white tabular-nums">
        {value}
        {suffix && <span className="text-amber-400">{suffix}</span>}
      </div>
      <div className="mt-2 text-sm text-white/30 tracking-wide">{label}</div>
    </div>
  );
}

/* ── Testimonial ── */
function Testimonial({
  quote,
  author,
  role,
  delay,
  visible,
}: {
  quote: string;
  author: string;
  role: string;
  delay: number;
  visible: boolean;
}) {
  return (
    <div
      className={`p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-white/70 leading-relaxed text-sm italic mb-6">&ldquo;{quote}&rdquo;</p>
      <div>
        <div className="text-sm font-semibold text-white/90">{author}</div>
        <div className="text-xs text-white/30">{role}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */

export default function LandingPageContent() {
  // Section refs
  const storyRef = useRef<HTMLDivElement>(null);
  const craftRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const showroomRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Visibility
  const storyVisible = useInView(storyRef, 0.2);
  const craftVisible = useInView(craftRef, 0.15);
  const featuresVisible = useInView(featuresRef, 0.1);
  const statsVisible = useInView(statsRef, 0.2);
  const showroomVisible = useInView(showroomRef, 0.15);
  const testimonialsVisible = useInView(testimonialsRef, 0.1);
  const ctaVisible = useInView(ctaRef, 0.2);

  // Scroll mechanics
  const scrollProgress = useScrollProgress();
  const parallaxSlow = useParallax(0.15);
  const parallaxMid = useParallax(0.25);

  // Counters
  const countItems = useCounter(12000, 2000, statsVisible);
  const countCountries = useCounter(34, 1800, statsVisible);
  const countUptime = useCounter(99, 1500, statsVisible);

  // Nav opacity
  const navBg = `rgba(0,0,0,${Math.min(0.3 + scrollProgress * 0.6, 0.92)})`;

  return (
    <div className="relative bg-black text-white overflow-x-hidden">
      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[45%] h-[45%] bg-amber-900/10 rounded-full blur-[140px] animate-drift" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-900/10 rounded-full blur-[120px] animate-drift"
          style={{ animationDelay: '4s' }}
        />
        <div
          className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-yellow-900/5 rounded-full blur-[100px] animate-drift"
          style={{ animationDelay: '7s' }}
        />
        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* ═══════════════════════════════════════════════════════
          NAVIGATION — scroll-aware glassmorphism
         ═══════════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 border-b border-white/5 transition-all duration-500"
        style={{
          backgroundColor: navBg,
          backdropFilter: `blur(${8 + scrollProgress * 14}px)`,
          WebkitBackdropFilter: `blur(${8 + scrollProgress * 14}px)`,
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">FurnitureOps</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="hidden sm:inline-block text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-medium border rounded-full border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all duration-300"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════
          CHAPTER 1 — HERO
          ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-24 overflow-hidden">
        {/* Hero background image with parallax */}
        <div
          className="absolute inset-0 z-0"
          style={{ transform: `translateY(${parallaxSlow}px)` }}
        >
          <Image
            src="/images/hero-living-room.png"
            alt="Premium living room"
            fill
            className="object-cover opacity-30"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        </div>

        {/* Text content that fades as you scroll */}
        <div
          className="relative z-10 text-center max-w-5xl"
          style={{
            opacity: 1 - scrollProgress * 1.8,
            transform: `translateY(${scrollProgress * -80}px)`,
            willChange: 'transform, opacity',
          }}
        >
          {/* Overline */}
          <div className="animate-fade-up">
            <span className="inline-block text-xs font-mono tracking-[0.4em] uppercase text-amber-400/70 border border-amber-400/15 px-4 py-1.5 rounded-full bg-amber-400/5 mb-8">
              Est. 2024 · Premium Furniture Operations
            </span>
          </div>

          {/* Heading */}
          <h1
            className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight leading-[0.9] animate-fade-up"
            style={{ animationDelay: '0.1s' }}
          >
            <span className="block text-white">Where Craft</span>
            <span className="block bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400 bg-clip-text text-transparent">
              Meets Control.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="mt-8 text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed animate-fade-up"
            style={{ animationDelay: '0.25s' }}
          >
            The operating system for furniture businesses that refuse to compromise.
            Track every grain, every joint, every journey.
          </p>

          {/* CTAs */}
          <div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up"
            style={{ animationDelay: '0.4s' }}
          >
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-full font-semibold text-sm hover:shadow-xl hover:shadow-amber-500/20 hover:scale-105 transition-all duration-300"
            >
              Explore Dashboard
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/15 text-white/70 rounded-full text-sm hover:bg-white/5 hover:text-white transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-10 z-10 flex flex-col items-center gap-3 transition-opacity duration-500"
          style={{ opacity: Math.max(1 - scrollProgress * 4, 0) }}
        >
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-amber-400/40" />
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/20">Scroll to explore</span>
          <ArrowDown className="w-4 h-4 text-white/20 animate-bounce" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CHAPTER 2 — THE STORY
          ═══════════════════════════════════════════════════════ */}
      <section
        ref={storyRef}
        className="relative z-20 px-6 py-32 md:py-40"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left — Text */}
          <div>
            <ChapterBadge number="01" label="Our Philosophy" visible={storyVisible} />
            <h2
              className={`text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-8 transition-all duration-700 ${
                storyVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
              }`}
            >
              Every piece of furniture
              <br />
              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                tells a story.
              </span>
            </h2>
            <div
              className={`space-y-5 transition-all duration-700 delay-200 ${
                storyVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
              }`}
            >
              <p className="text-white/50 leading-relaxed">
                From the moment raw timber is selected to the final polish before delivery,
                every step matters. FurnitureOps captures this journey — preserving the
                craftsmanship while giving you complete operational control.
              </p>
              <p className="text-white/50 leading-relaxed">
                We built this for artisans who think in grain patterns and operators who
                think in supply chains. Because the best furniture businesses do both.
              </p>
            </div>
            {/* Decorative line */}
            <div
              className={`mt-10 h-px bg-gradient-to-r from-amber-500/30 to-transparent transition-all duration-1000 ${
                storyVisible ? 'w-full' : 'w-0'
              }`}
              style={{ transitionDelay: '500ms' }}
            />
          </div>

          {/* Right — Image with reveal */}
          <div
            className={`relative aspect-[4/5] rounded-3xl overflow-hidden transition-all duration-1000 ${
              storyVisible ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-95 rotate-1'
            }`}
            style={{ transitionDelay: '300ms' }}
          >
            <Image
              src="/images/craftsmanship.png"
              alt="Walnut table craftsmanship"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            {/* Floating label */}
            <div className="absolute bottom-8 left-8 right-8">
              <div
                className={`inline-block px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs text-white/60 transition-all duration-700 ${
                  storyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: '800ms' }}
              >
                ✦ Hand-selected solid walnut
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CHAPTER 3 — CRAFTSMANSHIP SPOTLIGHT
          ═══════════════════════════════════════════════════════ */}
      <section
        ref={craftRef}
        className="relative z-20 px-6 py-32 md:py-40"
      >
        {/* Full-width image band */}
        <div
          className={`relative w-full max-w-7xl mx-auto aspect-[21/9] rounded-3xl overflow-hidden mb-20 transition-all duration-1000 ${
            craftVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97]'
          }`}
        >
          <div style={{ transform: `translateY(${-parallaxMid + parallaxSlow}px)` }}>
            <Image
              src="/images/showroom.png"
              alt="Furniture showroom"
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-black/80" />
          {/* Overlay text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h3
                className={`text-3xl md:text-5xl font-bold tracking-tight transition-all duration-700 ${
                  craftVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: '300ms' }}
              >
                Curated for the <span className="text-amber-400">discerning</span> eye.
              </h3>
              <p
                className={`mt-4 text-white/40 max-w-lg mx-auto transition-all duration-700 ${
                  craftVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: '500ms' }}
              >
                Every item in your catalog, tracked with museum-grade precision.
              </p>
            </div>
          </div>
        </div>

        {/* Process steps */}
        <div className="max-w-5xl mx-auto">
          <ChapterBadge number="02" label="The Journey" visible={craftVisible} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {[
              {
                step: '01',
                title: 'Source',
                desc: 'Raw materials are catalogued the moment they arrive. Wood species, origin, grade — every detail captured.',
                icon: Globe,
              },
              {
                step: '02',
                title: 'Craft',
                desc: 'As artisans shape each piece, production status updates flow in real-time. No clipboards, no lag.',
                icon: Sparkles,
              },
              {
                step: '03',
                title: 'Deliver',
                desc: 'From warehouse to doorstep, track logistics with military precision and white-glove care.',
                icon: Truck,
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className={`relative p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all duration-700 ${
                  craftVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
                style={{ transitionDelay: `${i * 150 + 400}ms` }}
              >
                {/* Step number */}
                <span className="text-6xl font-bold text-white/[0.03] absolute top-4 right-6">{item.step}</span>
                <item.icon className="w-8 h-8 text-amber-400/80 mb-4" />
                <h4 className="text-lg font-semibold text-white/90 mb-2">{item.title}</h4>
                <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CHAPTER 4 — FEATURES DEEP DIVE
          ═══════════════════════════════════════════════════════ */}
      <section
        ref={featuresRef}
        className="relative z-20 px-6 py-32 md:py-40"
      >
        <div className="max-w-6xl mx-auto">
          <ChapterBadge number="03" label="Capabilities" visible={featuresVisible} />
          <h2
            className={`text-4xl md:text-5xl font-bold tracking-tight mb-4 transition-all duration-700 ${
              featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Built for scale.
            <br />
            <span className="text-white/30">Designed for clarity.</span>
          </h2>
          <p
            className={`text-white/40 max-w-xl mb-16 transition-all duration-700 delay-200 ${
              featuresVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Every feature exists because a furniture operator needed it. Nothing more, nothing less.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeaturePill
              icon={BarChart3}
              title="Real-time Analytics"
              description="Live dashboards showing stock levels, sales velocity, and aging inventory — updated every 5 seconds."
              delay={0}
              visible={featuresVisible}
            />
            <FeaturePill
              icon={ShieldCheck}
              title="Enterprise Security"
              description="Row-level security, JWT authentication, rate limiting, and full audit logs for every operation."
              delay={100}
              visible={featuresVisible}
            />
            <FeaturePill
              icon={Clock}
              title="Instant Sync"
              description="Supabase Realtime ensures every team member sees the same data. No manual refresh ever needed."
              delay={200}
              visible={featuresVisible}
            />
            <FeaturePill
              icon={Layers}
              title="Multi-location Support"
              description="Track inventory across warehouses, showrooms, and transit — all in one unified view."
              delay={300}
              visible={featuresVisible}
            />
            <FeaturePill
              icon={Truck}
              title="Supply Chain Tracking"
              description="From manufacturer to your front door. Full provenance and logistics visibility."
              delay={400}
              visible={featuresVisible}
            />
            <FeaturePill
              icon={Sparkles}
              title="Smart Categorization"
              description="Auto-classify by material, collection, era, and style. Find any piece in seconds."
              delay={500}
              visible={featuresVisible}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CHAPTER 5 — STATS BANNER
          ═══════════════════════════════════════════════════════ */}
      <section
        ref={statsRef}
        className="relative z-20 px-6 py-24"
      >
        <div className="max-w-5xl mx-auto rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-12 md:p-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <StatCard value={`${countItems.toLocaleString()}+`} label="Items Tracked" delay={0} visible={statsVisible} />
            <StatCard value={`${countCountries}+`} label="Countries" delay={100} visible={statsVisible} />
            <StatCard value={`${countUptime}.9`} label="Uptime %" suffix="%" delay={200} visible={statsVisible} />
            <StatCard value="<5" label="Sec Sync Time" suffix="s" delay={300} visible={statsVisible} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CHAPTER 6 — SHOWROOM PARALLAX
          ═══════════════════════════════════════════════════════ */}
      <section
        ref={showroomRef}
        className="relative z-20 px-6 py-32 md:py-40"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div
            className={`relative aspect-square rounded-3xl overflow-hidden transition-all duration-1000 order-2 md:order-1 ${
              showroomVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}
          >
            <Image
              src="/images/hero-living-room.png"
              alt="Premium furniture showcase"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/80" />
          </div>

          {/* Text */}
          <div className="order-1 md:order-2">
            <ChapterBadge number="04" label="The Experience" visible={showroomVisible} />
            <h2
              className={`text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-8 transition-all duration-700 ${
                showroomVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
              }`}
            >
              Your showroom,
              <br />
              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                digitized.
              </span>
            </h2>
            <div
              className={`space-y-5 transition-all duration-700 delay-200 ${
                showroomVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
            >
              <p className="text-white/50 leading-relaxed">
                Each item lives in a rich digital card — complete with high-resolution imagery,
                material specs, pricing, and real-time stock counts. It&apos;s like walking through
                your showroom, but from anywhere.
              </p>
              <p className="text-white/50 leading-relaxed">
                Add, edit, and organize with intuitive modals. No training manuals required.
                If you can swipe a phone, you can run your inventory.
              </p>
            </div>

            <div
              className={`mt-10 transition-all duration-700 delay-500 ${
                showroomVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-medium border border-amber-500/30 text-amber-300 rounded-full hover:bg-amber-500/10 transition-all duration-300"
              >
                See it in action
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CHAPTER 7 — TESTIMONIALS
          ═══════════════════════════════════════════════════════ */}
      <section
        ref={testimonialsRef}
        className="relative z-20 px-6 py-32 md:py-40"
      >
        <div className="max-w-6xl mx-auto">
          <ChapterBadge number="05" label="Voices" visible={testimonialsVisible} />
          <h2
            className={`text-4xl md:text-5xl font-bold tracking-tight mb-16 transition-all duration-700 ${
              testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Trusted by <span className="text-amber-400">craftspeople</span>
            <br />
            <span className="text-white/30">worldwide.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Testimonial
              quote="FurnitureOps replaced three separate tools for us. Our warehouse team went from daily spreadsheet chaos to real-time clarity overnight."
              author="Priya Sharma"
              role="Operations Head, Woodcraft Studio"
              delay={0}
              visible={testimonialsVisible}
            />
            <Testimonial
              quote="The real-time sync is a game changer. When a piece sells in the showroom, the website updates instantly. No more overselling."
              author="Marco Bianchi"
              role="Founder, Casa Moderna"
              delay={150}
              visible={testimonialsVisible}
            />
            <Testimonial
              quote="Beautiful, fast, and actually designed for furniture people. It understands materials, origins, and collections — not just SKUs."
              author="Elena Kovács"
              role="Creative Director, Nordic Living"
              delay={300}
              visible={testimonialsVisible}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CHAPTER 8 — FINAL CTA
          ═══════════════════════════════════════════════════════ */}
      <section
        ref={ctaRef}
        className="relative z-20 flex flex-col items-center justify-center min-h-[80vh] px-6 py-24 text-center"
      >
        {/* Background accent */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
        </div>

        <div
          className={`relative z-10 max-w-3xl transition-all duration-1000 ${
            ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <span className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-amber-400/60 mb-8">
            Ready to begin?
          </span>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[0.95]">
            Your inventory
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400 bg-clip-text text-transparent">
              deserves better.
            </span>
          </h2>
          <p className="text-xl text-white/40 mb-12 max-w-lg mx-auto">
            Join the furniture businesses already running smarter, faster, and more beautifully.
          </p>

          {/* CTA with glow */}
          <div className="relative inline-block">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 blur-2xl animate-glow-pulse opacity-30" />
            <Link
              href="/dashboard"
              className="group relative inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-amber-500/25 hover:scale-105 transition-all duration-300"
            >
              Enter Dashboard
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-20 py-10 text-center border-t border-white/5 bg-black">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Layers className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-semibold">FurnitureOps</span>
            </div>
            <p className="text-xs text-white/20">
              © {new Date().getFullYear()} FurnitureOps. Crafted with precision for the furniture industry.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-xs text-white/30 hover:text-white/60 transition-colors">
                Dashboard
              </Link>
              <Link href="/login" className="text-xs text-white/30 hover:text-white/60 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
