import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StadiumFlow - Smart Venue Navigator',
  description: 'AI-powered stadium navigation using Google Gemini and Google Maps. Get crowd density, queue times, and travel advice for sports venues.',
  keywords: ['stadium', 'navigation', 'AI', 'crowd density', 'sports venue', 'Google Maps', 'Gemini AI'],
  authors: [{ name: 'StadiumFlow Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'StadiumFlow - Smart Venue Navigator',
    description: 'AI-powered stadium navigation for crowd density, queue times, and travel advice.',
    type: 'website',
  },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1f2937" />
        <link rel="icon" href="/favicon.ico" />
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { page_path: window.location.pathname });
            `}</Script>
          </>
        )}
      </head>
      <body className={inter.className}>
        {/* Skip navigation link — validates WCAG 2.1 Success Criterion 2.4.1 */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none focus:shadow-lg"
          tabIndex={0}
        >
          Skip to main content
        </a>

        {/* Global screen reader announcement region */}
        <div
          id="aria-live-region"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />

        {/* Main landmark — validates skip link target */}
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
