import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

import { Providers } from '@/components/providers/Providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Stellar Credit - Sistema de Score de Crédito Descentralizado',
    template: '%s | Stellar Credit',
  },
  description: 'Plataforma inovadora que revoluciona o sistema de crédito tradicional usando tecnologia blockchain. Analise transações on-chain da rede Stellar para calcular scores de crédito em tempo real.',
  keywords: [
    'stellar',
    'blockchain',
    'credit score',
    'defi',
    'soroban',
    'passkeys',
    'cryptocurrency',
    'financial inclusion',
    'decentralized finance',
  ],
  authors: [{ name: 'Stellar Credit Team' }],
  creator: 'Stellar Credit',
  publisher: 'Stellar Credit',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    alternateLocale: 'en_US',
    url: 'https://stellarcredit.com',
    title: 'Stellar Credit - Sistema de Score de Crédito Descentralizado',
    description: 'Revolucione seu acesso ao crédito com tecnologia blockchain',
    siteName: 'Stellar Credit',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Stellar Credit Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stellar Credit - Sistema de Score de Crédito Descentralizado',
    description: 'Revolucione seu acesso ao crédito com tecnologia blockchain',
    images: ['/og-image.png'],
    creator: '@stellarcredit',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon-16x16.png',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },

};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://horizon.stellar.org" />
        <link rel="dns-prefetch" href="https://horizon-testnet.stellar.org" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div id="root" className="relative flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
          </div>
        </Providers>

        {/* Background decorative elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-r from-primary-500/20 to-stellar-500/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-r from-stellar-500/20 to-primary-500/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary-400/10 to-stellar-400/10 blur-2xl" />
        </div>

        {/* Loading indicator portal */}
        <div id="loading-portal" />
        
        {/* Toast notifications portal */}
        <div id="toast-portal" />
        
        {/* Modal portal */}
        <div id="modal-portal" />
      </body>
    </html>
  );
}