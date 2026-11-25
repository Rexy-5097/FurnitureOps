import type { Metadata, Viewport } from "next";
import PageTransition from "@/components/layout/PageTransition";
import QueryProvider from "@/providers/QueryProvider";
import { fontClasses } from "@/features/lab/fonts";
import "./globals.css";
import "@/features/lab/lab.css";

export const viewport: Viewport = {
  themeColor: '#fff6ea',
  width: 'device-width',
  initialScale: 1,
  // Pinch-zoom stays enabled for accessibility (WCAG 1.4.4).
};

export const metadata: Metadata = {
  title: "FurnitureOps",
  description: "Hand-picked furniture with live stock from the showroom floor.",
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontClasses} suppressHydrationWarning>
      <body className="min-h-screen font-body antialiased" suppressHydrationWarning>
        <QueryProvider>
          <PageTransition>{children}</PageTransition>
        </QueryProvider>
      </body>
    </html>
  );
}
