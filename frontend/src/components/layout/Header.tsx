'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/routing';
import { WalletButton } from '@/components/wallet/WalletButton';
import Image from 'next/image';

export function Header() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/stellar-credit-logo-optimized.svg"
                alt="Stellar Credit"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-xl font-bold text-primary">
                StellarCredit
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/" 
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              {t('navigation.dashboard')}
            </Link>
            <Link 
              href="/score" 
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              {t('navigation.score')}
            </Link>
            <Link 
              href="/transactions" 
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              {t('navigation.transactions')}
            </Link>
            <Link 
              href="/loans" 
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              {t('navigation.loans')}
            </Link>
            <Link 
              href="/analytics" 
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              {t('navigation.analytics')}
            </Link>
            <Link 
              href="/elisa" 
              className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center"
            >
              <span className="mr-1">✨</span>
              ElisaOS
            </Link>
          </nav>

          {/* Wallet Button */}
          <WalletButton variant="outline" size="sm" />
        </div>
      </div>
    </header>
  );
}