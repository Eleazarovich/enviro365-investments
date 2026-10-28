import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import '../styles/tailwind.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Enviro365 Investments — Your Portfolio and Withdrawals',
  description:
    'View your available balance, request withdrawals and download your withdrawal statement from one place.',
  icons: {
    icon: [{ url: '/enviro365-mark.svg', type: 'image/svg+xml' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geist.variable}>
      <body className={geist.className}>
        {children}
      </body>
    </html>
  );
}
