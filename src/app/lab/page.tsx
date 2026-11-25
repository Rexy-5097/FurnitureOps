import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import hero from '../../../public/images/hero-living-room.png';
import showroom from '../../../public/images/showroom.png';
import { getStats, listItems } from '@/features/lab/data/store';
import ProductCard from '@/features/lab/components/ProductCard';
import PieceVisual from '@/features/lab/components/PieceVisual';
import NewsletterForm from '@/features/lab/components/NewsletterForm';
import { CONTAINER, Eyebrow } from '@/features/lab/components/StateViews';
import { formatPrice } from '@/features/lab/utils/format';
import { CATEGORIES, type Category, type LabItem } from '@/features/lab/schema';

/**
 * Server Component (INT257 Unit II): data is read on the server and no
 * data-fetching JS ships. ISR: rendered statically and regenerated at most
 * every 60 s, or immediately when a Server Action calls revalidatePath.
 */
export const revalidate = 60;

const CATEGORY_COPY: Record<Category, { label: string; promo: string }> = {
  seating: { label: 'Sofas & chairs', promo: 'Sink in and stay a while.' },
  tables: { label: 'Tables', promo: 'Made for long dinners.' },
  lighting: { label: 'Lighting', promo: 'Light that knows its place.' },
  storage: { label: 'Storage', promo: 'Storage that hides nothing.' },
  beds: { label: 'Beds', promo: 'Low, calm and built to last.' },
};

const QUICK_LINKS: Array<[string, string]> = [
  ['Lounge chairs', '/lab/collection?category=seating'],
  ['Dining tables', '/lab/collection?category=tables'],
  ['Brass lamps', '/lab/collection?q=brass'],
  ['Walnut', '/lab/collection?q=walnut'],
  ['In stock now', '/lab/collection?inStock=1'],
];

const arrow = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default function LabHome() {
  const all = listItems();
  const { pieces, inStock } = getStats();

  // Group once, derive everything else from it (array methods, no mutation).
  const byCategory = CATEGORIES.map((category) => {
    const items = all.filter((it) => it.category === category);
    return {
      category,
      items,
      // Prefer an illustrated piece for the category tile: it reads like a cut-out.
      cover: items.find((it) => !it.image_url) ?? items[0],
      from: items.length ? Math.min(...items.map(({ price }) => price)) : 0,
    };
  }).filter(({ items }) => items.length > 0);

  const favourites = all.toSorted((a, b) => b.quantity_sold - a.quantity_sold).slice(0, 8);
  const promos = byCategory.filter(({ category }) => ['seating', 'storage', 'lighting'].includes(category));

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="bg-lab-plum text-lab-on-dark">
        <div className={`${CONTAINER} grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20`}>
          <div className="lab-rise">
            <h1 className="text-[clamp(3.2rem,6.6vw,5.4rem)]">
              Honest design.
              <em className="block italic text-[#e9c9b4]">Honest stock.</em>
            </h1>

            {/* A plain GET form: works before hydration and lands on /lab/collection?q=… */}
            <form action="/lab/collection" method="get" role="search" className="mt-8 flex max-w-xl items-center rounded-full bg-lab-on-dark p-1.5 pl-5 shadow-lg">
              <label htmlFor="hero-search" className="sr-only">
                Search the collection
              </label>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5c534a" strokeWidth="1.8" aria-hidden>
                <circle cx="11" cy="11" r="6.5" />
                <path d="m20 20-4-4" />
              </svg>
              <input
                id="hero-search"
                name="q"
                type="search"
                placeholder="What are you looking for?"
                className="h-11 min-w-0 flex-1 bg-transparent px-3 text-[15px] text-[#292725] placeholder:text-[#8a837a] focus:outline-none"
              />
              <button type="submit" className="h-11 shrink-0 rounded-full bg-lab-plum px-6 text-sm font-semibold text-lab-on-dark hover:opacity-90">
                Search
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-[13px]">
              <span className="mr-1 opacity-75">Jump to:</span>
              {QUICK_LINKS.map(([label, href]) => (
                <Link key={href} href={href} className="rounded-full border border-white/30 px-3.5 py-1.5 font-semibold transition-colors hover:bg-white/10">
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="lab-rise relative" style={{ animationDelay: '120ms' }}>
            <div className="relative aspect-[16/11] overflow-hidden rounded-[28px] shadow-2xl shadow-black/40">
              <Image
                src={hero}
                alt="Cognac leather sofa by a fireplace, with a walnut coffee table"
                fill
                priority
                placeholder="blur"
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────── */}
      <section aria-label="Shop by category" className="bg-lab-surface">
        <div className={`${CONTAINER} py-12 sm:py-16`}>
          <ul className="grid grid-cols-3 gap-x-3 gap-y-8 sm:gap-x-6 lg:grid-cols-5">
            {byCategory.map(({ category, cover, items }) =>
              cover ? (
                <li key={category}>
                  <Link href={`/lab/collection?category=${category}`} className="group block text-center">
                    <PieceVisual item={{ ...cover, image_url: null }} className="mx-auto aspect-[4/3] w-full max-w-[220px]" />
                    <p className="mt-2 text-[13px] font-semibold sm:text-[15px]">{CATEGORY_COPY[category].label}</p>
                    <p className="text-[13px] text-lab-muted">
                      {items.length} piece{items.length === 1 ? '' : 's'}
                    </p>
                  </Link>
                </li>
              ) : null,
            )}
          </ul>

          <div className="lab-scroll-x -mx-4 mt-12 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
            {[
              ['Newest first', '/lab/collection?sort=newest'],
              ['Price: low to high', '/lab/collection?sort=price-asc'],
              ['In stock only', '/lab/collection?inStock=1'],
              ['A to Z', '/lab/collection?sort=name'],
            ].map(([label, href]) => (
              <Pill key={href} href={href}>
                {label}
              </Pill>
            ))}
            <Pill href="/lab/collection" dark>
              Shop all {pieces}
            </Pill>
          </div>
        </div>
      </section>

      {/* ── Favourites ───────────────────────────────────── */}
      <section className={`${CONTAINER} pt-20`}>
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <Eyebrow>Hand-picked</Eyebrow>
            <h2 className="mt-2 text-[2.6rem] leading-none sm:text-[3.2rem]">Floor favourites</h2>
          </div>
          <Link href="/lab/collection" className="flex shrink-0 items-center gap-2 text-sm font-semibold hover:underline hover:underline-offset-4">
            See all {arrow}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {favourites.map((item, i) => (
            <ProductCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </section>

      {/* ── Promo trio ───────────────────────────────────── */}
      <section aria-label="Featured rooms" className={`${CONTAINER} grid gap-4 pt-20 md:grid-cols-3`}>
        {promos.map(({ category, cover, from }) => (
          <PromoCard key={category} category={category} cover={cover!} from={from} />
        ))}
      </section>

      {/* ── Benefits ─────────────────────────────────────── */}
      <section aria-label="Why FurnitureOps" className={`${CONTAINER} grid gap-4 pt-20 sm:grid-cols-2`}>
        <Benefit tone="sage" icon={<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4ZM18 15l.8 2 2 .8-2 .8L18 21l-.8-2.4-2-.8 2-.8Z" />} title="Curated, not crowded">
          {pieces} pieces from {new Set(all.map(({ origin }) => origin.split(', ').at(-1))).size} countries, each one chosen by hand.
        </Benefit>
        <Benefit tone="sand" icon={<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />} title="Live stock">
          {inStock} units on the floor right now. Counts refresh in the background while you browse.
        </Benefit>
        <Benefit tone="sand" icon={<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6Zm-3 9 2 2 4-4" />} title="Never double-sold">
          Every purchase reserves stock atomically, so two people can never buy the last piece.
        </Benefit>
        <Benefit tone="sage" icon={<path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H5a1 1 0 0 1-1-1Zm16 0h-3v5h2a1 1 0 0 0 1-1Z" />} title="Run by the showroom team">
          Staff update prices and stock from the studio in seconds. <Link href="/lab/studio" className="underline underline-offset-4">Open the studio</Link>
        </Benefit>
      </section>

      {/* ── Newsletter ───────────────────────────────────── */}
      <section className={`${CONTAINER} pt-20`}>
        <div className="grid overflow-hidden rounded-[28px] bg-lab-moss text-white md:grid-cols-[2fr_3fr]">
          <div className="relative min-h-[220px]">
            <Image src={showroom} alt="A furnished showroom corner" fill placeholder="blur" sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" />
          </div>
          <div className="p-8 sm:p-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-75">FurnitureOps letters</p>
            <h2 className="mt-3 text-[2.3rem] leading-[1.05] sm:text-[2.9rem]">First look at new pieces, once a month.</h2>
            <p className="mt-3 max-w-md text-[15px] opacity-85">No sales calendar, no noise. Just what arrived on the floor and where it came from.</p>
            <NewsletterForm />
          </div>
        </div>
      </section>
    </main>
  );
}

function Pill({ href, dark, children }: { href: string; dark?: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={
        'inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors ' +
        (dark ? 'border-lab-forest bg-lab-forest text-lab-on-dark hover:opacity-90' : 'border-lab-line bg-lab-surface hover:border-lab-ink')
      }
    >
      {children}
      {arrow}
    </Link>
  );
}

function PromoCard({ category, cover, from }: { category: Category; cover: LabItem; from: number }) {
  return (
    <Link href={`/lab/collection?category=${category}`} className="group flex flex-col rounded-[24px] bg-lab-surface p-7 transition-shadow hover:shadow-[0_12px_32px_-14px_rgba(60,40,20,0.3)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lab-muted">
        {CATEGORY_COPY[category].label} · from {formatPrice(from)}
      </p>
      <p className="mt-3 font-display text-[2.1rem] leading-[1.05]">{CATEGORY_COPY[category].promo}</p>
      <PieceVisual item={{ ...cover, image_url: null }} className="my-6 aspect-[4/3] w-full" />
      <span className="mt-auto flex items-center gap-2 text-sm font-semibold">
        Explore {CATEGORY_COPY[category].label.toLowerCase()} {arrow}
      </span>
    </Link>
  );
}

function Benefit({ tone, icon, title, children }: { tone: 'sage' | 'sand'; icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className={(tone === 'sage' ? 'bg-lab-sage' : 'bg-lab-sand') + ' rounded-[24px] p-8'}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lab-paper">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {icon}
        </svg>
      </span>
      <h3 className="mt-6 text-[17px] font-semibold">{title}</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-lab-muted">{children}</p>
    </div>
  );
}
