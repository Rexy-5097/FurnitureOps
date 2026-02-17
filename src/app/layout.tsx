import type { Metadata, Viewport } from "next";
import PageTransition from "@/components/layout/PageTransition";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "FurnitureOps",
  description: "Premium Inventory Management System",
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-black" suppressHydrationWarning>
      <body className="font-sans min-h-screen bg-black text-white antialiased selection:bg-white/20" suppressHydrationWarning>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
