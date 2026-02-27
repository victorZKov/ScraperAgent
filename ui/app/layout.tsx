import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '../components/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ScraperAgent — AI-Powered Market Intelligence, Delivered Daily',
    template: '%s | ScraperAgent',
  },
  description:
    'AI analyzes 40+ market experts on X daily, delivering actionable trading signals, sentiment analysis, and sector breakdowns to your inbox. Start free.',
  keywords: [
    'market intelligence',
    'AI trading signals',
    'sentiment analysis',
    'crypto analysis',
    'market expert analysis',
    'daily market report',
    'trading signals',
    'AI market analysis',
  ],
  authors: [{ name: 'Kovimatic', url: 'https://kovimatic.ie' }],
  creator: 'Kovimatic',
  publisher: 'Kovimatic',
  metadataBase: new URL('https://scraperagent.eu'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://scraperagent.eu',
    siteName: 'ScraperAgent',
    title: 'ScraperAgent — AI-Powered Market Intelligence, Delivered Daily',
    description:
      'AI analyzes 40+ market experts on X daily, delivering actionable trading signals, sentiment analysis, and sector breakdowns to your inbox.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ScraperAgent — AI Market Intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScraperAgent — AI-Powered Market Intelligence',
    description:
      'AI analyzes 40+ market experts daily. Trading signals, sentiment analysis, and sector breakdowns delivered to your inbox.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/icon.svg',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans min-h-screen bg-background antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
