'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { ThemeProvider, useTheme } from '../state/theme-context';
import { useMoodboard, selectCount, type Currency } from '../state/moodboard-store';
import { useHasHydrated } from '../hooks';
import { signOutAction } from '../actions';
import { ROLE_COPY, type Role } from '../auth';
import { CATEGORIES } from '../schema';
import { cx } from '../utils/format';

// Code splitting / lazy loading: the drawer's JS is only fetched when opened.
const MoodboardDrawer = dynamic(() => import('./MoodboardDrawer'), { ssr: false });

import { CONTAINER } from './StateViews';

const NAV = [
  { href: '/lab', label: 'Home', exact: true },
  { href: '/lab/collection', label: 'Shop all' },
  { href: '/lab/studio', label: 'Studio' },
  { href: '/lab/bench', label: 'Hooks bench' },
  { href: '/lab/syllabus', label: 'Syllabus map' },
];

export default function LabShell({ role, fontClasses, children }: { role: Role; fontClasses: string; children: ReactNode }) {
  return (
    <ThemeProvider>
      {(theme) => (
        <div data-theme={theme} className={cx('lab-root flex min-h-screen flex-col bg-lab-paper font-body text-lab-ink antialiased', fontClasses)}>
          <a href="#lab-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-lab-forest focus:px-4 focus:py-2 focus:text-lab-on-dark">
            Skip to content
          </a>
          <UtilityBar />
          <Header role={role} />
          <div id="lab-main" className="flex-1">
            {children}
          </div>
          <Footer />
          <DrawerHost />
        </div>
      )}
    </ThemeProvider>
  );
}

const Icon = ({ d, size = 18 }: { d: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
);

const ICONS = {
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4-4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.5 18.5a6.5 6.5 0 0 1 11 0" />
    </>
  ),
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  truck: (
    <>
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" />
      <circle cx="7" cy="17.5" r="1.5" />
      <circle cx="17" cy="17.5" r="1.5" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
};

const iconButton = 'relative flex h-10 w-10 items-center justify-center rounded-full text-lab-ink transition-colors hover:bg-lab-ink/[0.06]';

function UtilityBar() {
  return (
    <div className="bg-lab-forest text-lab-on-dark">
      <div className={cx(CONTAINER, 'flex h-9 items-center justify-between gap-4 text-[12px] font-semibold')}>
        <p className="flex min-w-0 items-center gap-2">
          <Icon d={ICONS.truck} size={15} />
          <span className="truncate">
            Lab preview · <code className="font-mono text-[11px] font-normal opacity-80">redesign/syllabus-lab</code>
          </span>
        </p>
        <p className="hidden shrink-0 sm:block">Mock data. Production is untouched.</p>
      </div>
    </div>
  );
}

function Header({ role }: { role: Role }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Close the menu whenever the route changes.
  useEffect(() => setMenuOpen(false), [pathname]);

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-lab-line/70 bg-lab-paper/95 backdrop-blur">
      <div className={cx(CONTAINER, 'flex h-16 items-center gap-3 sm:h-[72px] sm:gap-6')}>
        <Link href="/lab" className="shrink-0 font-brand text-[1.6rem] leading-none sm:text-[1.95rem]" aria-label="FurnitureOps lab home">
          FurnitureOps
        </Link>

        <nav aria-label="Lab" className="hidden items-center gap-1 xl:flex">
          {NAV.map(({ href, label, exact }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href, exact) ? 'page' : undefined}
              className={cx(
                'whitespace-nowrap rounded-full px-3.5 py-2 text-[14px] font-semibold transition-colors',
                isActive(href, exact) ? 'bg-lab-ink/[0.07]' : 'text-lab-muted hover:text-lab-ink',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center sm:gap-1">
          <Link href="/lab/collection?focus=search" className={iconButton} aria-label="Search the collection">
            <Icon d={ICONS.search} />
          </Link>
          <CurrencySelect />
          <button type="button" onClick={toggleTheme} className={cx(iconButton, 'hidden sm:flex')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            <Icon d={theme === 'dark' ? ICONS.sun : ICONS.moon} />
          </button>
          <Link
            href="/lab/sign-in"
            className={iconButton}
            aria-label={role === 'guest' ? 'Sign in' : `Signed in as ${ROLE_COPY[role].title}`}
            title={role === 'guest' ? 'Sign in' : ROLE_COPY[role].title}
          >
            <Icon d={ICONS.user} />
            {role !== 'guest' && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-lab-moss ring-2 ring-lab-paper" aria-hidden />}
          </Link>
          <MoodboardButton />
          <button
            type="button"
            className={cx(iconButton, 'xl:hidden')}
            aria-expanded={menuOpen}
            aria-controls="lab-menu"
            aria-label="Menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon d={menuOpen ? ICONS.close : ICONS.menu} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="lab-menu" className="border-t border-lab-line bg-lab-paper xl:hidden">
          <nav aria-label="Lab menu" className={cx(CONTAINER, 'grid gap-1 py-4')}>
            {NAV.map(({ href, label, exact }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href, exact) ? 'page' : undefined}
                className={cx('rounded-xl px-3 py-3 text-base font-semibold', isActive(href, exact) ? 'bg-lab-ink/[0.06]' : 'text-lab-muted')}
              >
                {label}
              </Link>
            ))}
            <button type="button" onClick={toggleTheme} className="rounded-xl px-3 py-3 text-left text-base font-semibold text-lab-muted sm:hidden">
              {theme === 'dark' ? 'Light theme' : 'Dark theme'}
            </button>
            {role !== 'guest' && (
              <form action={signOutAction} className="px-3 pt-2">
                <button type="submit" className="text-sm text-lab-muted underline underline-offset-4">
                  Sign out ({ROLE_COPY[role].title})
                </button>
              </form>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function CurrencySelect() {
  const hydrated = useHasHydrated();
  const currency = useMoodboard((s) => s.currency);
  const setCurrency = useMoodboard((s) => s.setCurrency);
  return (
    <label className="hidden sm:block">
      <span className="sr-only">Display currency</span>
      <select
        value={hydrated ? currency : 'INR'}
        onChange={(e) => setCurrency(e.target.value as Currency)}
        className="h-10 cursor-pointer rounded-full bg-transparent px-2 text-[13px] font-semibold text-lab-ink hover:bg-lab-ink/[0.06]"
      >
        <option value="INR">₹ INR</option>
        <option value="USD">$ USD</option>
        <option value="EUR">€ EUR</option>
      </select>
    </label>
  );
}

function MoodboardButton() {
  const hydrated = useHasHydrated();
  const count = useMoodboard(selectCount);
  const setOpen = useMoodboard((s) => s.setOpen);
  const shown = hydrated ? count : 0;
  return (
    <button type="button" onClick={() => setOpen(true)} className={iconButton} aria-label={`Moodboard, ${shown} saved`}>
      <Icon d={ICONS.heart} />
      {shown > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-lab-accent px-1 text-[10px] font-bold text-white">
          {shown}
        </span>
      )}
    </button>
  );
}

function DrawerHost() {
  const isOpen = useMoodboard((s) => s.isOpen);
  return isOpen ? <MoodboardDrawer /> : null;
}

function Footer() {
  const columns: Array<{ title: string; links: Array<[string, string]> }> = [
    { title: 'Shop', links: [...CATEGORIES.map((c): [string, string] => [c[0].toUpperCase() + c.slice(1), `/lab/collection?category=${c}`]), ['Shop all', '/lab/collection']] },
    { title: 'Lab', links: [['Studio', '/lab/studio'], ['Hooks bench', '/lab/bench'], ['Syllabus map', '/lab/syllabus'], ['Sign in', '/lab/sign-in']] },
    { title: 'Developers', links: [['Inventory API', '/api/lab/inventory'], ['Edge health', '/api/lab/health'], ['Current site', '/']] },
  ];

  return (
    <footer className="mt-24 bg-lab-forest text-lab-on-dark">
      <div className={cx(CONTAINER, 'grid gap-12 py-16 lg:grid-cols-12')}>
        <div className="lg:col-span-5">
          <p className="font-brand text-[2rem] leading-none">FurnitureOps</p>
          <p className="mt-6 font-display text-[2.6rem] leading-[1.05]">
            Honest furniture.
            <em className="block italic opacity-60">Tracked to the last unit.</em>
          </p>
        </div>
        {columns.map(({ title, links }) => (
          <nav key={title} aria-label={title} className="lg:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60">{title}</p>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              {links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="opacity-90 hover:underline hover:underline-offset-4">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className={cx(CONTAINER, 'flex flex-col gap-2 py-6 text-[13px] opacity-70 sm:flex-row sm:justify-between')}>
          <p>© 2026 FurnitureOps. Redesign lab for INT252 × INT257.</p>
          <p>Next.js 14 · React Query · Zustand · Zod</p>
        </div>
      </div>
    </footer>
  );
}
