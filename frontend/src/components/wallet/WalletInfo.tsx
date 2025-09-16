'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, 
  ExternalLink, 
  LogOut, 
  Wallet, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import Image from 'next/image';
import { WalletType, getWalletDisplayName, getWalletIcon, getNetworkConfig } from '@/stores/walletStore';
import { useWalletStore, useXLMBalance } from '@/stores/walletStore';
import { Button } from '@/components/ui/Button';
import { formatAddress, formatAmount, copyToClipboard } from '@/lib/utils';
import { useNotify } from '@/components/providers/NotificationProvider';

interface WalletInfoProps {
  publicKey: string;
  walletType: WalletType;
  compact?: boolean;
}

export function WalletInfo({ publicKey, walletType, compact = false }: WalletInfoProps) {
  const t = useTranslations('wallet');
  const notify = useNotify();
  const [isOpen, setIsOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  
  const { network, disconnect } = useWalletStore();
  const xlmBalance = useXLMBalance();
  const networkConfig = getNetworkConfig(network);

  const handleCopyAddress = async () => {
    setCopying(true);
    try {
      await copyToClipboard(publicKey);
      notify.success(t('addressCopied'));
    } catch (error) {
      notify.error('Failed to copy address');
    } finally {
      setCopying(false);
    }
  };

  const handleViewOnExplorer = () => {
    const explorerUrl = `${networkConfig.explorerUrl}/account/${publicKey}`;
    window.open(explorerUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDisconnect = () => {
    disconnect();
    setIsOpen(false);
    notify.info(t('disconnected'));
  };

  if (compact) {
    return (
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2"
        >
          <div className="w-5 h-5 rounded-full overflow-hidden">
            <Image
              src={getWalletIcon(walletType)}
              alt={getWalletDisplayName(walletType)}
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          <span className="hidden sm:block text-sm font-mono">
            {formatAddress(publicKey)}
          </span>
        </Button>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              
              {/* Dropdown */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 z-50 bg-popover border border-border rounded-lg shadow-lg"
              >
                <div className="p-4 space-y-4">
                  {/* Wallet info */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      <Image
                        src={getWalletIcon(walletType)}
                        alt={getWalletDisplayName(walletType)}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {getWalletDisplayName(walletType)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {networkConfig.name}
                      </div>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground mb-1">
                      {t('balance')}
                    </div>
                    <div className="text-lg font-semibold text-foreground">
                      {formatAmount(xlmBalance, 2)} XLM
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {t('address')}
                    </div>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 text-xs font-mono bg-muted rounded px-2 py-1 text-foreground">
                        {formatAddress(publicKey, 8, 8)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyAddress}
                        disabled={copying}
                        className="h-8 w-8"
                      >
                        {copying ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
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
                      className="flex-1 text-destructive hover:text-destructive"
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

  // Full wallet info component (for settings page, etc.)
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">
          {t('title')}
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm text-muted-foreground">
            {t('connected')}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Wallet type */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            <Image
              src={getWalletIcon(walletType)}
              alt={getWalletDisplayName(walletType)}
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <div className="font-medium text-card-foreground">
              {getWalletDisplayName(walletType)}
            </div>
            <div className="text-sm text-muted-foreground">
              {networkConfig.name} Network
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-2">
            {t('balance')}
          </div>
          <div className="text-2xl font-bold text-card-foreground">
            {formatAmount(xlmBalance, 2)} XLM
          </div>
          <div className="text-sm text-muted-foreground">
            ≈ ${formatAmount(xlmBalance * 0.12, 2)} USD
          </div>
        </div>

        {/* Address */}
        <div>
          <div className="text-sm text-muted-foreground mb-2">
            {t('address')}
          </div>
          <div className="flex items-center space-x-2">
            <code className="flex-1 text-sm font-mono bg-muted rounded px-3 py-2 text-card-foreground">
              {publicKey}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyAddress}
              disabled={copying}
            >
              {copying ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={handleViewOnExplorer}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('viewOnExplorer')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            className="flex-1"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t('disconnect')}
          </Button>
        </div>
      </div>
    </div>
  );
}
