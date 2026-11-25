import { Cormorant_Garamond, Manrope } from 'next/font/google';

// Declared once and shared by the store and lab layouts. next/font self-hosts
// both families at build time: no layout shift, no Google request at runtime.
const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-lab-display',
  display: 'swap',
});

const body = Manrope({ subsets: ['latin'], variable: '--font-lab-body', display: 'swap' });

export const fontClasses = `${display.variable} ${body.variable}`;
