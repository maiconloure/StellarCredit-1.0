'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  ChevronDown,
  LogOut,
  Copy,
  ExternalLink,
  CheckCircle 
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { WalletConnector } from './WalletConnector';
import { useWallet } from '@/hooks/useWallet';
import { useWalletStore, useXLMBalance } from '@/stores/walletStore';
import { getWalletDisplayName, getWalletIcon, getNetworkConfig } from '@/stores/walletStore';
import { formatAddress, formatAmount, copyToClipboard } from '@/lib/utils';
import { useNotify } from '@/components/providers/NotificationProvider';

interface WalletButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function WalletButton({ 
  className = '', 
  variant = 'outline',
  size = 'md' 
}: WalletButtonProps) {
  const t = useTranslations('wallet');
  const notify = useNotify();
  const [isConnectorOpen, setIsConnectorOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copying, setCopying] = useState(false);

  const { isConnecting } = useWallet();
  const { publicKey, walletType, network, disconnect } = useWalletStore();
  const xlmBalance = useXLMBalance();
  const networkConfig = getNetworkConfig(network);

  const isConnected = Boolean(publicKey && walletType);

  const handleCopyAddress = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!publicKey) return;
    
    setCopying(true);
    try {
      await copyToClipboard(publicKey);
      notify.success(t('addressCopied'));
    } catch (error) {
      notify.error(t('copyAddressError'));
    } finally {
      setCopying(false);
    }
  };

  const handleViewOnExplorer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!publicKey) return;
    
    const explorerUrl = `${networkConfig.explorerUrl}/account/${publicKey}`;
    window.open(explorerUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDisconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    disconnect();
    setIsDropdownOpen(false);
    notify.info(t('disconnected'));
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 px-3 text-sm';
      case 'lg':
        return 'h-12 px-6 text-base';
      default:
        return 'h-10 px-4 text-sm';
    }
  };

  // Se não está conectado, mostra botão de conectar
  if (!isConnected) {
    return (
      <>
        <Button
          variant={variant}
          onClick={() => setIsConnectorOpen(true)}
          disabled={isConnecting}
          className={`${getSizeClasses()} flex items-center space-x-2 ${className}`}
        >
          <Wallet className="w-4 h-4" />
          <span>{isConnecting ? t('connecting') : t('connect')}</span>
        </Button>

        <WalletConnector
          isOpen={isConnectorOpen}
          onClose={() => setIsConnectorOpen(false)}
        />
      </>
    );
  }

  // Se está conectado, mostra botão com informações da carteira
  return (
    <div className="relative">
      <Button
        variant={variant}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`${getSizeClasses()} flex items-center space-x-2 ${className}`}
      >
        {/* Ícone da carteira */}
        <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src={getWalletIcon(walletType!)}
            alt={getWalletDisplayName(walletType!)}
            width={20}
            height={20}
            className="object-contain"
          />
        </div>

        {/* Endereço (apenas em telas maiores) */}
        <span className="hidden sm:block font-mono">
          {formatAddress(publicKey)}
        </span>

        {/* Saldo (apenas em telas maiores em tamanho lg) */}
        {size === 'lg' && (
          <span className="hidden lg:block text-muted-foreground">
            {formatAmount(xlmBalance, 2)} XLM
          </span>
        )}

        {/* Chevron */}
        <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown com informações da carteira */}
      <AnimatePresence>
        {isDropdownOpen && (
          <>
            {/* Backdrop para fechar o dropdown */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />
            
            {/* Dropdown content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {/* Header da carteira */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    <Image
                      src={getWalletIcon(walletType!)}
                      alt={getWalletDisplayName(walletType!)}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {getWalletDisplayName(walletType!)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {networkConfig.name}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-green-600 font-medium">
                      {t('connected')}
                    </span>
                  </div>
                </div>

                {/* Saldo */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-sm text-muted-foreground mb-1">
                    {t('balance')}
                  </div>
                  <div className="text-lg font-semibold text-foreground">
                    {formatAmount(xlmBalance, 2)} XLM
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ≈ ${formatAmount(xlmBalance * 0.12, 2)} USD
                  </div>
                </div>

                {/* Endereço */}
                <div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {t('address')}
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 text-xs font-mono bg-muted rounded px-2 py-1 text-foreground break-all">
                      {formatAddress(publicKey, 8, 8)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyAddress}
                      disabled={copying}
                      className="h-8 w-8 flex-shrink-0"
                    >
                      {copying ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex space-x-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewOnExplorer}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Explorer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    className="flex-1 text-destructive hover:text-destructive border-destructive/20 hover:border-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('disconnect')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
