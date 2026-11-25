import type { Currency } from '../state/moodboard-store';

/**
 * Pure utility functions (INT252 practical 1): arrow functions, destructuring,
 * array methods, no mutation. Safe to import on server or client.
 */

// Indicative rates for display only, expressed as units per 1 INR.
const RATES: Record<Currency, { rate: number; locale: string }> = {
  INR: { rate: 1, locale: 'en-IN' },
  USD: { rate: 1 / 84, locale: 'en-US' },
  EUR: { rate: 1 / 91, locale: 'de-DE' },
};

/**
 * Formats a stored price for display.
 * `base` is the currency the amount is stored in (lab data: INR, live data: USD).
 */
export const formatPrice = (amount: number, currency: Currency = 'INR', base: Currency = 'INR') => {
  const { rate, locale } = RATES[currency];
  const converted = currency === base ? amount : (amount / RATES[base].rate) * rate;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === base && !Number.isInteger(amount) ? 2 : 0,
  }).format(converted);
};

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

export const stockLabel = ({ quantity_available: qty }: { quantity_available: number }) =>
  qty === 0 ? 'Sold out' : qty <= 2 ? `Last ${qty}` : `${qty} in stock`;

export const titleCase = (value: string) => value.replace(/\b\w/g, (c) => c.toUpperCase());

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');
