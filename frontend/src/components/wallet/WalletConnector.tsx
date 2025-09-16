'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, AlertCircle, CheckCircle, Loader2, Wallet, Fingerprint, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useWallet } from '@/hooks/useWallet';
import { WalletType, getWalletDisplayName, getWalletIcon } from '@/stores/walletStore';
import { Button } from '@/components/ui/Button';
import { useNotify } from '@/components/providers/NotificationProvider';
import { PasskeyConnector } from '@/components/passkey';
import { usePasskeySupport } from '@/stores/passkeyStore';

interface WalletConnectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const supportedWallets: { type: WalletType; description: string }[] = [
  {
    type: 'freighter',
    description: 'A secure Stellar wallet browser extension with biometric authentication support.',
  },
  {
    type: 'albedo',
    description: 'Web-based Stellar wallet with advanced security features.',
  },
  {
    type: 'rabet',
    description: 'Modern Stellar wallet with intuitive interface.',
  },
  {
    type: 'xbull',
    description: 'Multi-platform Stellar wallet with comprehensive features.',
  },
  {
    type: 'lobstr',
    description: 'Popular Stellar wallet with trading capabilities.',
  },
];

export function WalletConnector({ isOpen, onClose }: WalletConnectorProps) {
  const t = useTranslations('wallet');
  const notify = useNotify();
  const [connectingWallet, setConnectingWallet] = useState<WalletType>(null);
  const [mounted, setMounted] = useState(false);
  const [showPasskeys, setShowPasskeys] = useState(false);
  const { isSupported: passkeySupported, checkSupport } = usePasskeySupport();

  useEffect(() => {
    setMounted(true);
    checkSupport(); // Verificar suporte a passkeys
    return () => setMounted(false);
  }, [checkSupport]);
  
  const {
    connect,
    isConnecting,
    error,
    availableWallets,
    getWalletInstallUrl,
    isWalletInstalled,
    refreshWalletDetection,
  } = useWallet();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleConnect = async (walletType: WalletType) => {
    if (!walletType) return;
    
    setConnectingWallet(walletType);
    
    try {
      await connect(walletType);
      notify.success(
        t('connected'),
        `${getWalletDisplayName(walletType)} ${t('connected').toLowerCase()}`
      );
      onClose();
    } catch (err: any) {
      notify.error(
        t('connectionError'),
        err.message || t('connectionError')
      );
    } finally {
      setConnectingWallet(null);
    }
  };

  const handleInstall = (walletType: WalletType) => {
    const installUrl = getWalletInstallUrl(walletType);
    if (installUrl) {
      window.open(installUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const detected = await refreshWalletDetection();
      notify.success(
        'Carteiras atualizadas',
        `${detected.length} carteira${detected.length !== 1 ? 's' : ''} detectada${detected.length !== 1 ? 's' : ''}`
      );
    } catch (error) {
      notify.error('Erro', 'Falha ao atualizar detecção de carteiras');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] overflow-y-auto" style={{ zIndex: 99999 }}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        />

        {/* Modal */}
        <div className="relative z-[9999] flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {t('selectWallet')}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('selectWalletDescription')}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="rounded-full"
                  title="Atualizar detecção de carteiras"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Error display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mx-6 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              </motion.div>
            )}

            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="px-6 py-2 bg-muted/30 border-y border-border">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>
                    <strong>Debug:</strong> {availableWallets.length > 0 ? availableWallets.join(', ') : 'Nenhuma carteira detectada'}
                  </div>
                  <div>
                    <strong>Window Objects:</strong> {
                      typeof window !== 'undefined' 
                        ? Object.keys(window).filter(key => 
                            key.toLowerCase().includes('freighter') || 
                            key.toLowerCase().includes('rabet') ||
                            key.toLowerCase().includes('stellar') ||
                            key.toLowerCase().includes('xbull') ||
                            key.toLowerCase().includes('lobstr') ||
                            key.toLowerCase().includes('wallet')
                          ).join(', ') || 'Nenhum'
                        : 'N/A'
                    }
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <strong>Freighter:</strong> {typeof window !== 'undefined' && window.freighter ? '✅' : '❌'}
                    </div>
                    <div>
                      <strong>Rabet:</strong> {typeof window !== 'undefined' && window.rabet ? '✅' : '❌'}
                    </div>
                    <div>
                      <strong>xBull:</strong> {typeof window !== 'undefined' && (window as any).xBullWalletConnect ? '✅' : '❌'}
                    </div>
                    <div>
                      <strong>LOBSTR:</strong> {typeof window !== 'undefined' && (window as any).lobstrWallet ? '✅' : '❌'}
                    </div>
                  </div>
                  <div>
                    <strong>Stellar Interface:</strong> {typeof window !== 'undefined' && (window as any).stellar ? 
                      `✅ (${Object.keys((window as any).stellar || {}).join(', ')})` : '❌'}
                  </div>
                  <button 
                    onClick={handleRefresh}
                    className="text-primary-600 hover:text-primary-700 underline text-xs"
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? 'Verificando...' : '🔄 Verificar novamente'}
                  </button>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {showPasskeys ? (
                <PasskeyConnector
                  onConnect={(credentialId) => {
                    console.log('🔐 Passkey conectada:', credentialId);
                    notify.success('Conectado com passkey!');
                    onClose();
                  }}
                  onCancel={() => setShowPasskeys(false)}
                  showAccountCreation={true}
                />
              ) : (
                <div className="space-y-4">
                  {/* Passkey Option */}
                  {passkeySupported && (
                    <div className="mb-6">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <button
                          onClick={() => setShowPasskeys(true)}
                          className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-primary-200 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 hover:border-primary-300 transition-all cursor-pointer"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                              <Fingerprint className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-foreground">
                                Autenticação com Passkey
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Use sua impressão digital, Face ID ou chave de segurança
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full font-medium">
                              NOVO
                            </span>
                            <CheckCircle className="h-5 w-5 text-primary-600" />
                          </div>
                        </button>
                      </motion.div>
                      
                      <div className="mt-4 text-center">
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-background text-muted-foreground">
                              ou escolha uma carteira tradicional
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Traditional Wallets */}
                  <div className="space-y-3">
              {availableWallets.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-muted-foreground mb-4">
                    <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">Nenhuma carteira Stellar detectada</p>
                    <p className="text-xs mt-2 mb-3">
                      Instale uma extensão de carteira para continuar, ou use Albedo (baseado na web)
                    </p>
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="text-xs"
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Verificando...' : 'Verificar novamente'}
                      </Button>
                    </div>
                    <p className="text-xs mt-3 text-muted-foreground">
                      💡 Dica: Recarregue a página após instalar uma extensão
                    </p>
                  </div>
                </div>
              )}
              
              {supportedWallets.map((wallet) => {
                const isInstalled = isWalletInstalled(wallet.type);
                const isCurrentlyConnecting = connectingWallet === wallet.type;
                const isDisabled = isConnecting || isCurrentlyConnecting;

                return (
                  <motion.div
                    key={wallet.type}
                    whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                    whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                  >
                    <button
                      onClick={() => isInstalled ? handleConnect(wallet.type) : handleInstall(wallet.type)}
                      disabled={isDisabled}
                      className={`
                        w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all
                        ${isInstalled
                          ? 'border-border hover:border-primary-300 hover:bg-accent/50'
                          : 'border-dashed border-muted-foreground/30 hover:border-primary-300'
                        }
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                          <Image
                            src={getWalletIcon(wallet.type)}
                            alt={getWalletDisplayName(wallet.type)}
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                        </div>
                        
                        <div className="text-left">
                          <div className="font-medium text-foreground">
                            {getWalletDisplayName(wallet.type)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {wallet.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isCurrentlyConnecting ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                        ) : isInstalled ? (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-green-600 font-medium">
                              Detectado
                            </span>
                          </div>
                        ) : wallet.type === 'albedo' ? (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                            <span className="text-xs text-blue-600 font-medium">
                              Web
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Instalar
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  </motion.div>
                );
              })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-primary-600" />
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">
                      Secure Connection
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Your wallet connection is encrypted and secure. We never store your private keys.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Don&apos;t have a Stellar wallet?{' '}
                  <a
                    href="https://developers.stellar.org/docs/category/build-apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    Learn more about Stellar wallets
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );

  return typeof window !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}
