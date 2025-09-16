'use client';

import { useWalletData } from '@/components/providers/WalletDataProvider';
import { useWalletStore } from '@/stores/walletStore';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Wifi, WifiOff, Clock, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface DataStatusProps {
  className?: string;
  showRefreshButton?: boolean;
}

export function DataStatus({ className, showRefreshButton = true }: DataStatusProps) {
  const { isConnected } = useWalletStore();
  const { 
    isLoading, 
    error, 
    lastUpdated, 
    hasData, 
    isDataStale, 
    refreshData 
  } = useWalletData();

  if (!isConnected) {
    return null;
  }

  const getStatusInfo = () => {
    if (isLoading) {
      return {
        icon: RefreshCw,
        text: 'Atualizando dados...',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
      };
    }

    if (error) {
      return {
        icon: WifiOff,
        text: 'Erro ao carregar dados',
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
      };
    }

    if (!hasData) {
      return {
        icon: Clock,
        text: 'Carregando dados da carteira...',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
      };
    }

    if (isDataStale) {
      return {
        icon: Clock,
        text: 'Dados desatualizados',
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
      };
    }

    return {
      icon: CheckCircle,
      text: 'Dados atualizados',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
    };
  };

  const status = getStatusInfo();
  const Icon = status.icon;

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    
    const now = Date.now();
    const diff = now - lastUpdated;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'agora mesmo';
    if (minutes < 60) return `há ${minutes}m`;
    if (hours < 24) return `há ${hours}h`;
    return new Date(lastUpdated).toLocaleDateString('pt-BR');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          'flex items-center justify-between p-3 rounded-lg border',
          status.bgColor,
          status.borderColor,
          className
        )}
      >
        <div className="flex items-center space-x-3">
          <Icon 
            className={cn(
              'w-4 h-4',
              status.color,
              isLoading && 'animate-spin'
            )} 
          />
          <div>
            <p className={cn('text-sm font-medium', status.color)}>
              {status.text}
            </p>
            {lastUpdated && !isLoading && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Última atualização: {formatLastUpdated()}
              </p>
            )}
          </div>
        </div>

        {showRefreshButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
            className="ml-4"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Compact version for headers
export function DataStatusCompact({ className }: { className?: string }) {
  const { isConnected } = useWalletStore();
  const { isLoading, hasData, isDataStale } = useWalletData();

  if (!isConnected) {
    return null;
  }

  const getStatusColor = () => {
    if (isLoading) return 'bg-blue-500';
    if (!hasData) return 'bg-yellow-500';
    if (isDataStale) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="flex items-center space-x-1">
        <div 
          className={cn(
            'w-2 h-2 rounded-full',
            getStatusColor()
          )}
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {isLoading ? 'Atualizando' : hasData ? 'Online' : 'Carregando'}
        </span>
      </div>
    </div>
  );
}
