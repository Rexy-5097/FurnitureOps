/**
 * Utility to merge class names conditionally.
 * Lightweight replacement for clsx + tailwind-merge when those packages
 * cannot be installed (e.g. network issues).
 */
export type ClassValue = string | undefined | null | false | 0;

export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(' ');
}
