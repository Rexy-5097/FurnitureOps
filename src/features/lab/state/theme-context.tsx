'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Context API for app-wide UI state (INT252 Unit III + VI).
 * Theme is a good fit for Context: read in many places, changed rarely.
 */

type Theme = 'light' | 'dark';
type ThemeContextValue = { theme: Theme; toggleTheme: () => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'fo-lab-theme';

export function ThemeProvider({ children }: { children: (theme: Theme) => ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  // Side effect: restore a saved choice, and keep tabs in sync. The storefront
  // is light by default; dark is opt-in. Cleanup removes the storage listener.
  useEffect(() => {
    const read = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') setTheme(saved);
      } catch {}
    };
    read();
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && read();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  // Memoised so consumers only re-render when the theme actually changes.
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children(theme)}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
