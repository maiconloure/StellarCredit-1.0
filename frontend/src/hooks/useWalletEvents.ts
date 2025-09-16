'use client';

import { useEffect, useCallback } from 'react';
import { useWalletData } from '@/components/providers/WalletDataProvider';
import { useRealtimeContext } from '@/components/providers/RealtimeProvider';
import { useWalletStore } from '@/stores/walletStore';

interface UseWalletEventsOptions {
  onWalletConnected?: (event: CustomEvent) => void;
  onWalletDisconnected?: (event: CustomEvent) => void;
  onTransactionUpdate?: (event: CustomEvent) => void;
  onScoreUpdate?: (event: CustomEvent) => void;
  onMarketUpdate?: (event: CustomEvent) => void;
  autoRefreshOnConnect?: boolean;
  refreshDelay?: number;
}

export function useWalletEvents(options: UseWalletEventsOptions = {}) {
  const {
    onWalletConnected,
    onWalletDisconnected,
    onTransactionUpdate,
    onScoreUpdate,
    onMarketUpdate,
    autoRefreshOnConnect = true,
    refreshDelay = 500
  } = options;

  const { refreshData } = useWalletData();
  const { requestScoreUpdate } = useRealtimeContext();
  const { publicKey } = useWalletStore();

  // Default handlers
  const defaultWalletConnectedHandler = useCallback((event: CustomEvent) => {
    console.log('🎯 Carteira conectada, atualizando dados:', event.detail);
    
    if (autoRefreshOnConnect) {
      setTimeout(() => {
        refreshData();
      }, refreshDelay);
    }
    
    onWalletConnected?.(event);
  }, [autoRefreshOnConnect, refreshDelay, refreshData, onWalletConnected]);

  const defaultWalletDisconnectedHandler = useCallback((event: CustomEvent) => {
    console.log('🔌 Carteira desconectada:', event.detail);
    onWalletDisconnected?.(event);
  }, [onWalletDisconnected]);

  const defaultTransactionHandler = useCallback((event: CustomEvent) => {
    console.log('🔄 Nova transação detectada:', event.detail);
    
    // Auto refresh on transaction
    if (publicKey) {
      refreshData();
      requestScoreUpdate(publicKey);
    }
    
    onTransactionUpdate?.(event);
  }, [publicKey, refreshData, requestScoreUpdate, onTransactionUpdate]);

  const defaultScoreHandler = useCallback((event: CustomEvent) => {
    console.log('📊 Score atualizado:', event.detail);
    onScoreUpdate?.(event);
  }, [onScoreUpdate]);

  const defaultMarketHandler = useCallback((event: CustomEvent) => {
    console.log('📈 Dados de mercado atualizados:', event.detail);
    onMarketUpdate?.(event);
  }, [onMarketUpdate]);

  useEffect(() => {
    // Add event listeners
    window.addEventListener('stellar:wallet-connected', defaultWalletConnectedHandler as EventListener);
    window.addEventListener('stellar:wallet-disconnected', defaultWalletDisconnectedHandler as EventListener);
    window.addEventListener('stellar:transaction', defaultTransactionHandler as EventListener);
    window.addEventListener('stellar:score-update', defaultScoreHandler as EventListener);
    window.addEventListener('stellar:market', defaultMarketHandler as EventListener);

    return () => {
      // Cleanup event listeners
      window.removeEventListener('stellar:wallet-connected', defaultWalletConnectedHandler as EventListener);
      window.removeEventListener('stellar:wallet-disconnected', defaultWalletDisconnectedHandler as EventListener);
      window.removeEventListener('stellar:transaction', defaultTransactionHandler as EventListener);
      window.removeEventListener('stellar:score-update', defaultScoreHandler as EventListener);
      window.removeEventListener('stellar:market', defaultMarketHandler as EventListener);
    };
  }, [
    defaultWalletConnectedHandler,
    defaultWalletDisconnectedHandler,
    defaultTransactionHandler,
    defaultScoreHandler,
    defaultMarketHandler
  ]);

  // Helper functions to dispatch events manually
  const dispatchWalletConnected = useCallback((detail?: any) => {
    window.dispatchEvent(new CustomEvent('stellar:wallet-connected', { detail }));
  }, []);

  const dispatchWalletDisconnected = useCallback((detail?: any) => {
    window.dispatchEvent(new CustomEvent('stellar:wallet-disconnected', { detail }));
  }, []);

  const dispatchTransaction = useCallback((detail?: any) => {
    window.dispatchEvent(new CustomEvent('stellar:transaction', { detail }));
  }, []);

  const dispatchScoreUpdate = useCallback((detail?: any) => {
    window.dispatchEvent(new CustomEvent('stellar:score-update', { detail }));
  }, []);

  const dispatchMarketUpdate = useCallback((detail?: any) => {
    window.dispatchEvent(new CustomEvent('stellar:market', { detail }));
  }, []);

  return {
    // Event dispatchers
    dispatchWalletConnected,
    dispatchWalletDisconnected,
    dispatchTransaction,
    dispatchScoreUpdate,
    dispatchMarketUpdate,
    
    // Utilities
    refreshData,
    requestScoreUpdate: (address?: string) => requestScoreUpdate(address || publicKey || ''),
  };
}
