'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useWalletStore } from '@/stores/walletStore';
import { useCreditStore } from '@/stores/creditStore';

interface WalletContextType {
  // Re-export all wallet functionality
  isConnected: boolean;
  isConnecting: boolean;
  walletType: any;
  publicKey: string | null;
  network: any;
  error: string | null;
  availableWallets: any[];
  connect: (walletType: any) => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string, networkPassphrase?: string) => Promise<string>;
  switchNetwork: (network: any) => Promise<void>;
  checkConnection: () => Promise<void>;
  getWalletInstallUrl: (walletType: any) => string;
  isWalletInstalled: (walletType: any) => boolean;
}

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const wallet = useWallet();
  const { clearData } = useCreditStore();

  // Clear credit data when wallet disconnects
  useEffect(() => {
    if (!wallet.isConnected) {
      clearData();
    }
  }, [wallet.isConnected, clearData]);

  // Auto-check connection on mount
  useEffect(() => {
    if (wallet.isConnected && wallet.walletType) {
      wallet.checkConnection();
    }
  }, []);

  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}
