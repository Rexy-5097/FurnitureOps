import type { Category } from './schema';

/** Display copy per category, shared by the lab and the live store. */

export const CATEGORY_LABELS: Record<Category, string> = {
  seating: 'Sofas & chairs',
  tables: 'Tables',
  lighting: 'Lighting',
  storage: 'Storage',
  beds: 'Beds',
  decor: 'Objects & decor',
};

export const CATEGORY_PROMOS: Record<Category, string> = {
  seating: 'Sink in and stay a while.',
  tables: 'Made for long dinners.',
  lighting: 'Light that knows its place.',
  storage: 'Storage that hides nothing.',
  beds: 'Low, calm and built to last.',
  decor: 'The finishing touches.',
};

// Keyword rules for live inventory, which has no category column yet.
const RULES: Array<[Category, RegExp]> = [
  ['beds', /\b(bed|headboard|mattress|daybed)\b/i],
  ['lighting', /\b(lamp|light|lighting|pendant|sconce|chandelier|lantern)\b/i],
  ['tables', /\b(table|desk|console)\b/i],
  ['storage', /\b(shelf|shelves|shelving|bookcase|bookshelf|cabinet|sideboard|dresser|drawers?|wardrobe|credenza|chest|storage|rack)\b/i],
  ['seating', /\b(sofa|couch|chair|armchair|lounge|stool|bench|ottoman|seat|sectional|loveseat|pouf)\b/i],
];

/** Best-guess category from a piece's name. Falls back to decor. */
export const inferCategory = (name: string): Category => RULES.find(([, re]) => re.test(name))?.[0] ?? 'decor';

// Warm material palette for pieces without a stored colour.
const TONES = ['#8A4F2A', '#5B3A26', '#B49A7A', '#C9B79C', '#B8893E', '#4A3B2F', '#9C6B43', '#D6C6AE', '#C4A57E', '#6F7A63'];

/** Stable tone per id, so a piece keeps its colour between renders and visits. */
export const toneFor = (id: string) => {
  const hash = Array.from(id).reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  return TONES[hash % TONES.length];
};
