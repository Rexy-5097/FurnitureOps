import Image from 'next/image';
import type { Category, LabItem } from '../schema';
import { cx } from '../utils/format';

/**
 * Presentational component with no state: renders on the server or the client.
 * Photos use next/image (lazy, responsive, optimised). Pieces without a photo
 * get a "cut-out" illustration filled with the piece's material tone, sitting
 * on a soft floor shadow, so the grid reads like product photography on white.
 */

// Closed shapes are filled with the tone; open strokes (legs, seams) are lines.
const GLYPHS: Record<Category, (tone: string, edge: string) => JSX.Element> = {
  seating: (tone, edge) => (
    <>
      <path d="M20 40V24a7 7 0 0 1 7-7h66a7 7 0 0 1 7 7v16Z" fill={tone} />
      <rect x="12" y="36" width="96" height="22" rx="8" fill={tone} />
      <rect x="6" y="30" width="16" height="28" rx="7" fill={tone} />
      <rect x="98" y="30" width="16" height="28" rx="7" fill={tone} />
      <path d="M60 38v18" stroke={edge} opacity="0.35" />
      <path d="M20 58v6M100 58v6" stroke={edge} strokeWidth="3" />
    </>
  ),
  tables: (tone, edge) => (
    <>
      <rect x="8" y="22" width="104" height="9" rx="4" fill={tone} />
      <path d="M22 31v33M98 31v33" stroke={edge} strokeWidth="4" />
      <path d="M22 54h76" stroke={edge} strokeWidth="2" opacity="0.6" />
    </>
  ),
  lighting: (tone, edge) => (
    <>
      <path d="M36 40a24 22 0 0 1 48 0Z" fill={tone} />
      <path d="M60 40v24" stroke={edge} strokeWidth="3" />
      <rect x="44" y="62" width="32" height="5" rx="2.5" fill={tone} />
    </>
  ),
  storage: (tone, edge) => (
    <>
      <rect x="12" y="14" width="96" height="44" rx="4" fill={tone} />
      <path d="M44 14v44M76 14v44" stroke={edge} opacity="0.4" />
      <path d="M39 33v8M49 33v8M71 33v8M81 33v8" stroke={edge} strokeWidth="2" opacity="0.6" />
      <path d="M22 58v7M98 58v7" stroke={edge} strokeWidth="3" />
    </>
  ),
  beds: (tone, edge) => (
    <>
      <rect x="8" y="12" width="16" height="50" rx="5" fill={tone} />
      <rect x="22" y="34" width="92" height="18" rx="6" fill={tone} />
      <rect x="28" y="27" width="24" height="10" rx="5" fill="#fffaf2" stroke={edge} strokeOpacity="0.25" />
      <path d="M30 52v12M106 52v12" stroke={edge} strokeWidth="3" />
    </>
  ),
};

/** Darkens a hex colour for legs and seams. */
const shade = (hex: string, amount = 0.45) => {
  const channel = (i: number) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount));
  return `rgb(${channel(1)}, ${channel(3)}, ${channel(5)})`;
};

type Props = {
  item: Pick<LabItem, 'name' | 'tone' | 'category' | 'image_url'>;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** "cutout" draws on the card surface; "swatch" fills the box with the tone. */
  variant?: 'cutout' | 'swatch';
};

export default function PieceVisual({ item: { name, tone, category, image_url }, sizes, priority, className, variant = 'cutout' }: Props) {
  if (image_url) {
    return (
      <div className={cx('relative overflow-hidden bg-lab-sand', className)}>
        <Image
          src={image_url}
          alt={name}
          fill
          priority={priority}
          sizes={sizes ?? '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      </div>
    );
  }

  const edge = shade(tone);
  return (
    <div
      role="img"
      aria-label={`${name}, ${category} illustration`}
      className={cx('relative flex items-center justify-center overflow-hidden', variant === 'cutout' ? 'bg-lab-surface' : '', className)}
      style={variant === 'swatch' ? { backgroundColor: tone } : undefined}
    >
      <svg
        viewBox="0 0 120 80"
        className="w-[64%] transition-transform duration-500 ease-out group-hover:scale-[1.05]"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {variant === 'cutout' && <ellipse cx="60" cy="68" rx="50" ry="4" fill="#000" opacity="0.07" />}
        {GLYPHS[category](variant === 'swatch' ? 'rgba(255,250,240,0.85)' : tone, variant === 'swatch' ? 'rgba(255,250,240,0.9)' : edge)}
      </svg>
    </div>
  );
}
