'use client';

import { useEffect, useState } from 'react';
import { useWalletStore } from '@/stores/walletStore';
import { useWallet } from '@/hooks/useWallet';
import { useWalletData } from '@/components/providers/WalletDataProvider';
import { WalletConnector } from '@/components/wallet/WalletConnector';
import { Loading } from '@/components/ui/Loading';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Wallet, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface WalletGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showConnector?: boolean;
}

export function WalletGuard({ 
  children, 
  fallback,
  showConnector = true 
}: WalletGuardProps) {
  const t = useTranslations();
  const { isConnected, isConnecting, walletType, publicKey } = useWalletStore();
  const { availableWallets } = useWallet();
  const { isLoading: isLoadingData, hasData } = useWalletData();
  const [showWalletConnector, setShowWalletConnector] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Allow time for auto-reconnect attempt
  useEffect(() => {
    console.log('🛡️ WalletGuard: Initializing...', { isConnected, isConnecting, publicKey: publicKey?.substring(0, 10) + '...' });
    
    const timer = setTimeout(() => {
      console.log('🛡️ WalletGuard: Initialization complete', { isConnected, isConnecting, publicKey: publicKey?.substring(0, 10) + '...' });
      setIsInitializing(false);
    }, 3000); // Give 3 seconds for auto-reconnect

    return () => clearTimeout(timer);
  }, [isConnected, isConnecting, publicKey]);

  // Show loading during initialization, connection attempt, or data loading
  if (isInitializing || isConnecting || (isConnected && isLoadingData && !hasData)) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loading 
          size="lg" 
          text={
            isConnecting 
              ? t('wallet.connecting') 
              : isLoadingData 
                ? 'Carregando dados da carteira...'
                : t('common.loading')
          }
        />
      </div>
    );
  }

  // If connected and has data, show protected content
  if (isConnected && publicKey) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default wallet connection prompt
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md mx-auto text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
            <Wallet className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('wallet.connectRequired')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('wallet.connectToAccess')}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-primary-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('wallet.secureConnection')}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-primary-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('wallet.instantAccess')}
              </span>
            </div>
          </div>

          {/* Connect Button */}
          {showConnector && (
            <div className="space-y-3">
              <Button
                onClick={() => setShowWalletConnector(true)}
                size="lg"
                className="w-full"
                disabled={availableWallets.length === 0}
              >
                <Wallet className="w-5 h-5 mr-2" />
                {availableWallets.length > 0 
                  ? t('wallet.connect')
                  : t('wallet.noWalletsAvailable')
                }
              </Button>
              
              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div><strong>Debug Info:</strong></div>
                  <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
                  <div>Connecting: {isConnecting ? 'Yes' : 'No'}</div>
                  <div>PublicKey: {publicKey ? publicKey.substring(0, 20) + '...' : 'None'}</div>
                  <div>Available Wallets: {availableWallets.join(', ') || 'None'}</div>
                  <div>Loading Data: {isLoadingData ? 'Yes' : 'No'}</div>
                  <div>Has Data: {hasData ? 'Yes' : 'No'}</div>
                </div>
              )}
            </div>
          )}

          {/* Wallet info */}
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {t('wallet.supportedWallets')}: Freighter, Albedo, Rabet, xBull, LOBSTR
          </p>
        </motion.div>

        {/* Wallet Connector Modal */}
        <WalletConnector
          isOpen={showWalletConnector}
          onClose={() => setShowWalletConnector(false)}
        />
      </div>
    </div>
  );
}
