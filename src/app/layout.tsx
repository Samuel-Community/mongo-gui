import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import './globals.css';
import Providers from '@/src/components/Providers';

export const metadata: Metadata = {
  title:       'MongoDB WebGUI',
  description: 'A modern, secure web application for managing MongoDB databases.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-snippet': -1,
      'max-image-preview': 'none',
      'max-video-preview': -1,
    },
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <Providers nonce={nonce}>{children}</Providers>
      </body>
    </html>
  );
}
