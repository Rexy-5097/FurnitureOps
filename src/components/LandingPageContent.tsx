'use client';

import { motion, useScroll, useTransform, useReducedMotion, useSpring, useMotionValue } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';

export default function LandingPageContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  // Global cursor tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for cursor to avoid jitter
  const smoothMouseX = useSpring(mouseX, { damping: 50, stiffness: 400 });
  const smoothMouseY = useSpring(mouseY, { damping: 50, stiffness: 400 });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile || prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Normalize to -1 to 1 range
      const x = (e.clientX / innerWidth) * 2 - 1;
      const y = (e.clientY / innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile, prefersReducedMotion, mouseX, mouseY]);

  // Scroll animations
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const getScrollTransform = (safeVal: any, mobileVal: any) => 
    prefersReducedMotion || isMobile ? mobileVal : safeVal;

  const heroZ = useTransform(scrollYProgress, [0, 0.2], getScrollTransform([0, -500], [0, 0]));
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  const problemY = useTransform(scrollYProgress, [0.1, 0.3], getScrollTransform([100, 0], [0, 0]));
  const problemOpacity = useTransform(scrollYProgress, [0.1, 0.2, 0.3], [0, 1, 0]);

  const solutionY = useTransform(scrollYProgress, [0.3, 0.5], getScrollTransform([100, 0], [0, 0]));
  const solutionOpacity = useTransform(scrollYProgress, [0.3, 0.4, 0.5], [0, 1, 0]);

  const engineY = useTransform(scrollYProgress, [0.5, 0.7], getScrollTransform([100, 0], [0, 0]));
  const engineOpacity = useTransform(scrollYProgress, [0.5, 0.6, 0.7], [0, 1, 0]);

  const scaleZoom = useTransform(scrollYProgress, [0.7, 0.9], getScrollTransform([0.8, 1.2], [1, 1]));
  const scaleOpacity = useTransform(scrollYProgress, [0.7, 0.8, 0.9], [0, 1, 0]);

  const ctaY = useTransform(scrollYProgress, [0.85, 1], getScrollTransform([100, 0], [0, 0]));
  const ctaOpacity = useTransform(scrollYProgress, [0.85, 1], [0, 1]);

  // Depth Layers based on mouse
  const bgDepthX = useTransform(smoothMouseX, [-1, 1], [-15, 15]);
  const bgDepthY = useTransform(smoothMouseY, [-1, 1], [-15, 15]);

  const midDepthX = useTransform(smoothMouseX, [-1, 1], [-30, 30]);
  const midDepthY = useTransform(smoothMouseY, [-1, 1], [-30, 30]);

  const fgDepthX = useTransform(smoothMouseX, [-1, 1], [-50, 50]);
  const fgDepthY = useTransform(smoothMouseY, [-1, 1], [-50, 50]);

  return (
    <div 
      ref={containerRef} 
      className="bg-[#0B0F19] text-white min-h-[700vh] relative font-sans selection:bg-[#4F8CFF]/30"
    >
      {/* Dynamic Background with Cursor Parallax */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden hidden md:flex items-center justify-center">
        <motion.div 
          className="w-full h-full absolute inset-0"
          style={{ x: bgDepthX, y: bgDepthY }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#4F8CFF]/5 rounded-full blur-[120px] opacity-40" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] opacity-30" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
        </motion.div>
      </div>

      {/* Glass Navbar */}
      <header className="fixed top-0 left-0 w-full z-50 p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.1)] pointer-events-auto transition-colors duration-300 hover:bg-white/[0.05]">
          <div className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            FurnitureOps
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200">
              Log in
            </Link>
            <Link 
              href="/dashboard"
              className="text-sm font-medium bg-[#4F8CFF] text-white px-5 py-2 rounded-full hover:bg-[#3d6ecc] transition-all duration-200 hover:scale-[0.97] shadow-[0_0_20px_rgba(79,140,255,0.3)]"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* SECTION 1: HERO */}
      <motion.section 
        className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden z-10 px-4"
        style={{ opacity: heroOpacity, z: heroZ }}
      >
        <div className="relative w-full max-w-7xl mx-auto text-center perspective-1000 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10"
            style={{ x: isMobile ? 0 : midDepthX, y: isMobile ? 0 : midDepthY }}
          >
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 mb-6 px-2 drop-shadow-sm">
              Inventory. <br className="hidden sm:block" /> Perfectly Controlled.
            </h1>
            <p className="text-lg md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto tracking-tight px-4 font-light">
              Atomic operations. Real-time sync. Zero inconsistencies.
            </p>
            <Link 
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 mx-auto rounded-full bg-white text-[#0B0F19] font-medium text-base md:text-lg hover:scale-[0.97] transition-all duration-200 ring-1 ring-white/20 hover:shadow-[0_0_40px_8px_rgba(255,255,255,0.15)] shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
            >
              Enter Dashboard
            </Link>
          </motion.div>

          {/* Floating Glass Cards - Desktop Only with Cursor Depth */}
          {!isMobile && !prefersReducedMotion && (
            <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10 mt-16 perspective-1000">
              <motion.div 
                className="absolute left-[15%] top-[10%] w-64 h-40 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-[inset_0_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.5)]"
                style={{ x: fgDepthX, y: fgDepthY }}
              >
                <div className="h-2 w-12 bg-white/20 rounded-full mb-4" />
                <div className="h-4 w-32 bg-white/40 rounded-full mb-2" />
                <div className="h-8 w-24 bg-[#4F8CFF]/20 text-[#4F8CFF] rounded-lg flex items-center justify-center text-xs font-mono border border-[#4F8CFF]/30 mt-4 font-medium uppercase tracking-wider">
                  Verified
                </div>
              </motion.div>

              <motion.div 
                className="absolute right-[10%] top-[30%] w-72 h-48 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-[inset_0_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.5)]"
                style={{ x: fgDepthX, y: fgDepthY }}
              >
                <div className="h-2 w-16 bg-white/20 rounded-full mb-6" />
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white/10" />
                  <div className="flex-1 space-y-3">
                    <div className="h-3 w-full bg-white/20 rounded-full" />
                    <div className="h-3 w-2/3 bg-white/20 rounded-full" />
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </motion.section>

      {/* SECTION 2: THE PROBLEM */}
      <motion.section 
        className="sticky top-0 h-screen flex items-center justify-center overflow-hidden z-20 pointer-events-none px-4"
        style={{ opacity: problemOpacity, y: problemY }}
      >
        <div className="max-w-4xl mx-auto text-center w-full">
          <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-8 md:mb-16 text-gray-500">
            Traditional systems <span className="text-white">fail</span> under pressure.
          </h2>
          
          <div className="relative w-full max-w-2xl mx-auto h-[300px] md:h-[400px] flex items-center justify-center perspective-1000">
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                className="absolute w-[90%] max-w-[320px] h-32 bg-[#140b0b]/80 backdrop-blur-xl border border-red-500/20 rounded-xl p-6 shadow-[0_8px_32px_rgba(255,0,0,0.05)]"
                animate={i === 0 && !isMobile && !prefersReducedMotion ? { x: [-5, 5, -5] } : {}}
                transition={{ duration: 0.1, repeat: Infinity, repeatType: 'reverse' }}
                style={{ 
                  zIndex: i === 0 ? 10 : 5,
                  rotateZ: i === 0 ? -2 : 2,
                  y: i === 0 ? -20 : 20,
                  opacity: i === 0 ? 1 : 0.5
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2 w-full">
                    <div className="h-3 w-20 bg-red-500/20 rounded" />
                    <div className="text-red-400/80 font-mono text-xs mt-4 tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      DATA COLLISION
                    </div>
                  </div>
                  <div className="text-lg md:text-2xl text-red-500/40 font-mono select-none">ERR</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* SECTION 3: THE SOLUTION */}
      <motion.section 
        className="sticky top-0 h-screen flex items-center justify-center overflow-hidden z-30 pointer-events-none px-4"
        style={{ opacity: solutionOpacity, y: solutionY }}
      >
        <div className="max-w-5xl mx-auto flex flex-col items-center w-full">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#4F8CFF] to-purple-400 px-2">
              FurnitureOps ensures consistency.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full max-w-4xl px-4 md:px-0">
            {[0, 1, 2].map((i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="h-32 md:h-48 bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 backdrop-blur-2xl relative overflow-hidden group shadow-[inset_0_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 pointer-events-auto"
                whileHover={!isMobile ? { y: -2, scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' } : {}}
              >
                <div className="h-6 w-6 md:h-8 md:w-8 rounded-lg bg-[#4F8CFF]/10 flex items-center justify-center mb-4 md:mb-6">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#4F8CFF]" />
                </div>
                <div className="h-3 md:h-4 w-2/3 bg-white/20 rounded mb-2" />
                <div className="h-2 md:h-3 w-1/3 bg-white/10 rounded" />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* SECTION 4: CORE ENGINE */}
      <motion.section 
        className="sticky top-0 h-screen flex items-center justify-center overflow-hidden z-40 px-4 pointer-events-none"
        style={{ opacity: engineOpacity, y: engineY }}
      >
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-8">
              Engineered for <br className="hidden md:block"/> Absolute Truth.
            </h2>
            <div className="space-y-6 md:space-y-8 flex flex-col items-center md:items-start">
              {[
                { title: "Atomic Updates", desc: "Transactions never partially fail." },
                { title: "Idempotency", desc: "Safe retries. No duplicate mutations." },
                { title: "Queue Processing", desc: "Asynchronous load leveling." },
                { title: "Audit Logs", desc: "Immutable state transition records." }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="pl-4 md:pl-6 border-l-2 w-full md:w-[300px] border-white/10 transition-colors duration-300 pointer-events-auto hover:border-white/40"
                >
                  <h3 className="text-white font-medium text-base md:text-lg mb-1">{item.title}</h3>
                  <p className="text-gray-400 text-xs md:text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="hidden md:flex relative h-[500px] w-full perspective-1000 items-center justify-center">
            <motion.div 
              className="w-full max-w-sm flex flex-col items-center gap-4"
              style={{ x: midDepthX, y: midDepthY }}
            >
               <div className="w-full h-20 bg-white/[0.02] border border-white/10 rounded-2xl backdrop-blur-2xl flex items-center px-6 shadow-[inset_0_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.5)]">
                 <div className="font-mono text-sm text-[#4F8CFF] font-medium">BEGIN TRANSACTION</div>
               </div>
               <div className="w-0.5 h-6 bg-gradient-to-b from-[#4F8CFF]/40 to-indigo-500/40" />
               <div className="w-full h-28 bg-white/[0.04] border border-white/10 rounded-2xl backdrop-blur-2xl flex items-center px-6 text-white/80 font-mono text-xs leading-loose shadow-[inset_0_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.5)] ring-1 ring-[#4F8CFF]/20">
                 UPDATE inventory <br/>
                 SET qty = qty - 1 <br/>
                 WHERE id = 'sku_089'
               </div>
               <div className="w-0.5 h-6 bg-gradient-to-b from-indigo-500/40 to-purple-500/40" />
               <div className="w-full h-20 bg-white/[0.02] border border-white/10 rounded-2xl backdrop-blur-2xl flex items-center px-6 shadow-[inset_0_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.5)]">
                 <div className="font-mono text-sm text-purple-400 font-medium">COMMIT (ATOMIC)</div>
               </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 5: REAL-TIME SYSTEM & SCALE */}
      <motion.section 
        className="sticky top-0 h-screen flex items-center justify-center overflow-hidden z-50 px-4 pointer-events-none"
        style={{ opacity: scaleOpacity, scale: scaleZoom }}
      >
        <div className="text-center w-full max-w-7xl">
          <div className="mb-12 md:mb-20">
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-4 md:mb-6">
              Instant updates.<br className="md:hidden" /> <span className="text-gray-500">Everywhere.</span>
            </h2>
            <p className="text-base md:text-xl text-gray-400 font-light">From one operation to millions.</p>
          </div>

          <div className="relative w-full h-[30vh] md:h-[40vh] max-h-[400px]">
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-24 md:h-24 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-xl flex items-center justify-center shadow-[inset_0_1px_rgba(255,255,255,0.3),0_20px_40px_rgba(0,0,0,0.6)] z-10"
              style={{ x: fgDepthX, y: fgDepthY }}
            >
              <div className="w-6 h-6 md:w-8 md:h-8 font-bold text-white text-xl md:text-2xl flex items-center justify-center">DB</div>
            </motion.div>
            
            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
              <motion.div 
                key={deg}
                className="absolute top-1/2 left-1/2 border border-white/5 rounded-2xl w-10 h-10 md:w-16 md:h-16 bg-white/[0.02] backdrop-blur-xl flex items-center justify-center shadow-[inset_0_1px_rgba(255,255,255,0.1)]"
                style={{ 
                  x: `calc(-50% + ${Math.cos(deg * Math.PI / 180) * (typeof window !== 'undefined' && window.innerWidth < 768 ? 120 : 220)}px)`,
                  y: `calc(-50% + ${Math.sin(deg * Math.PI / 180) * (typeof window !== 'undefined' && window.innerWidth < 768 ? 120 : 220)}px)`,
                }}
                animate={!prefersReducedMotion ? {
                  boxShadow: ['inset 0 1px rgba(255,255,255,0.1)', 'inset 0 1px rgba(255,255,255,0.1), 0 0 20px rgba(79,140,255,0.2)', 'inset 0 1px rgba(255,255,255,0.1)']
                } : {}}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
              >
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#4F8CFF]" />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* SECTION 6: FINAL CTA */}
      <motion.section 
        className="sticky top-0 h-screen flex items-center justify-center overflow-hidden z-50 px-4 pointer-events-auto"
        style={{ opacity: ctaOpacity, y: ctaY }}
      >
        <div className="w-full max-w-4xl mx-auto perspective-1000">
          <motion.div 
            className="w-full rounded-3xl bg-white/5 border border-white/10 backdrop-blur-2xl p-8 sm:p-12 md:p-20 text-center ring-1 ring-white/5 shadow-[inset_0_1px_rgba(255,255,255,0.1),0_20px_60px_rgba(0,0,0,0.6)] safe-area-padding"
            whileHover={!isMobile && !prefersReducedMotion ? { rotateX: 2, rotateY: -2, scale: 1.01 } : {}}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{ x: mix(midDepthX, mouseX, 0.5), y: mix(midDepthY, mouseY, 0.5) }} // Subtle tie to cursor
          >
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 md:mb-10 text-white drop-shadow-sm leading-tight">
              Run your inventory like a system. <br className="hidden md:block" />
              <span className="text-gray-400">Not a spreadsheet.</span>
            </h2>
            <Link 
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 md:px-10 py-4 md:py-5 rounded-full bg-white text-[#0B0F19] font-medium text-lg hover:scale-[0.97] hover:bg-gray-100 transition-all duration-200 ring-2 ring-transparent active:scale-[0.95]"
            >
              Launch Dashboard
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}

// Utility to mix motion values for very subtle effects
function mix(val1: any, val2: any, amount = 0.5) {
  return useTransform([val1, val2], ([v1, v2]: any[]) => v1 + (v2 - v1) * amount);
}
