'use client';

import { useTranslations } from 'next-intl';
import { useWalletStore } from '@/stores/walletStore';
import { WelcomeScreen } from '@/components/dashboard/WelcomeScreen';
import { Dashboard } from '@/components/dashboard/Dashboard';

export default function HomePage() {
  const t = useTranslations();
  const { isConnected } = useWalletStore();

  return (
    <>
      {isConnected ? (
        <Dashboard />
      ) : (
        <WelcomeScreen />
      )}
    </>
  );
}