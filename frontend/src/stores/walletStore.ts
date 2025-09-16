import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';

export type WalletType = 
  | 'freighter'
  | 'albedo'
  | 'rabet'
  | 'xbull'
  | 'lobstr'
  | 'walletconnect'
  | null;

export type StellarNetwork = 'testnet' | 'mainnet';

export interface WalletBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
  limit?: string;
  buying_liabilities: string;
  selling_liabilities: string;
}

export interface WalletState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  walletType: WalletType;
  publicKey: string | null;
  network: StellarNetwork;
  
  // Wallet data
  balances: WalletBalance[];
  sequence: string;
  subentryCount: number;
  
  // Connection history
  lastConnected: number | null;
  connectionAttempts: number;
  
  // Error handling
  error: string | null;
  
  // Actions
  setConnecting: (connecting: boolean) => void;
  setConnected: (
    connected: boolean,
    walletType?: WalletType,
    publicKey?: string,
    network?: StellarNetwork
  ) => void;
  setWalletData: (data: {
    balances: WalletBalance[];
    sequence: string;
    subentryCount: number;
  }) => void;
  setError: (error: string | null) => void;
  disconnect: () => void;
  incrementConnectionAttempts: () => void;
  resetConnectionAttempts: () => void;
  setNetwork: (network: StellarNetwork) => void;
}

export const useWalletStore = create<WalletState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // Initial state
        isConnected: false,
        isConnecting: false,
        walletType: null,
        publicKey: null,
        network: 'testnet',
        balances: [],
        sequence: '0',
        subentryCount: 0,
        lastConnected: null,
        connectionAttempts: 0,
        error: null,

        // Actions
        setConnecting: (connecting: boolean) =>
          set((state) => {
            state.isConnecting = connecting;
            if (connecting) {
              state.error = null;
            }
          }),

        setConnected: (
          connected: boolean,
          walletType?: WalletType,
          publicKey?: string,
          network?: StellarNetwork
        ) =>
          set((state) => {
            const wasConnected = state.isConnected;
            state.isConnected = connected;
            state.isConnecting = false;
            
            if (connected) {
              state.walletType = walletType || state.walletType;
              state.publicKey = publicKey || state.publicKey;
              state.network = network || state.network;
              state.lastConnected = Date.now();
              state.connectionAttempts = 0;
              state.error = null;
              
              // Dispatch connection event for real-time updates
              if (typeof window !== 'undefined') {
                console.log('📡 Dispatching wallet connection event');
                window.dispatchEvent(new CustomEvent('stellar:wallet-connected', {
                  detail: {
                    walletType: state.walletType,
                    publicKey: state.publicKey,
                    network: state.network,
                    timestamp: Date.now()
                  }
                }));
              }
            } else {
              state.walletType = null;
              state.publicKey = null;
              state.balances = [];
              state.sequence = '0';
              state.subentryCount = 0;
              
              // Dispatch disconnection event
              if (typeof window !== 'undefined' && wasConnected) {
                console.log('📡 Dispatching wallet disconnection event');
                window.dispatchEvent(new CustomEvent('stellar:wallet-disconnected', {
                  detail: {
                    timestamp: Date.now()
                  }
                }));
              }
            }
          }),

        setWalletData: (data) =>
          set((state) => {
            state.balances = data.balances;
            state.sequence = data.sequence;
            state.subentryCount = data.subentryCount;
          }),

        setError: (error: string | null) =>
          set((state) => {
            state.error = error;
            state.isConnecting = false;
          }),

        disconnect: () =>
          set((state) => {
            state.isConnected = false;
            state.isConnecting = false;
            state.walletType = null;
            state.publicKey = null;
            state.balances = [];
            state.sequence = '0';
            state.subentryCount = 0;
            state.error = null;
          }),

        incrementConnectionAttempts: () =>
          set((state) => {
            state.connectionAttempts += 1;
          }),

        resetConnectionAttempts: () =>
          set((state) => {
            state.connectionAttempts = 0;
          }),

        setNetwork: (network: StellarNetwork) =>
          set((state) => {
            state.network = network;
          }),
      })),
      {
        name: 'stellar-credit-wallet',
        partialize: (state) => ({
          walletType: state.walletType,
          publicKey: state.publicKey,
          network: state.network,
          lastConnected: state.lastConnected,
          isConnected: state.isConnected,
        }),
      }
    )
  )
);

// Selectors for performance
export const useWalletConnection = () =>
  useWalletStore((state) => ({
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    walletType: state.walletType,
    publicKey: state.publicKey,
    network: state.network,
    error: state.error,
  }));

export const useWalletBalances = () =>
  useWalletStore((state) => state.balances);

export const useWalletActions = () =>
  useWalletStore((state) => ({
    setConnecting: state.setConnecting,
    setConnected: state.setConnected,
    setWalletData: state.setWalletData,
    setError: state.setError,
    disconnect: state.disconnect,
    setNetwork: state.setNetwork,
  }));

// Computed values
export const useXLMBalance = () =>
  useWalletStore((state) => {
    const xlmBalance = state.balances.find(
      (balance) => balance.asset_type === 'native'
    );
    return xlmBalance ? parseFloat(xlmBalance.balance) : 0;
  });

export const useTotalBalanceUSD = () =>
  useWalletStore((state) => {
    // Simple conversion - in real app, you'd use actual exchange rates
    const xlmToUSD = 0.12; // Example rate
    
    return state.balances.reduce((total, balance) => {
      const amount = parseFloat(balance.balance);
      
      if (balance.asset_type === 'native') {
        return total + amount * xlmToUSD;
      }
      
      // For stablecoins, assume 1:1 with USD
      if (['USDC', 'USDT', 'BUSD', 'DAI'].includes(balance.asset_code || '')) {
        return total + amount;
      }
      
      // For other assets, use a conservative estimate
      return total + amount * 0.5;
    }, 0);
  });

// Wallet type helpers
export const getWalletDisplayName = (walletType: WalletType): string => {
  switch (walletType) {
    case 'freighter':
      return 'Freighter';
    case 'albedo':
      return 'Albedo';
    case 'rabet':
      return 'Rabet';
    case 'xbull':
      return 'xBull';
    case 'lobstr':
      return 'LOBSTR';
    case 'walletconnect':
      return 'WalletConnect';
    default:
      return 'Unknown';
  }
};

export const getWalletIcon = (walletType: WalletType): string => {
  switch (walletType) {
    case 'freighter':
      return '/icons/freighter.svg';
    case 'albedo':
      return '/icons/albedo.svg';
    case 'rabet':
      return '/icons/rabet.svg';
    case 'xbull':
      return '/icons/xbull.svg';
    case 'lobstr':
      return '/icons/lobstr.svg';
    case 'walletconnect':
      return '/icons/walletconnect.svg';
    default:
      return '/icons/wallet-generic.svg';
  }
};

// Network helpers
export const getNetworkConfig = (network: StellarNetwork) => {
  switch (network) {
    case 'testnet':
      return {
        name: 'Testnet',
        horizonUrl: 'https://horizon-testnet.stellar.org',
        networkPassphrase: 'Test SDF Network ; September 2015',
        explorerUrl: 'https://stellar.expert/explorer/testnet',
      };
    case 'mainnet':
      return {
        name: 'Mainnet',
        horizonUrl: 'https://horizon.stellar.org',
        networkPassphrase: 'Public Global Stellar Network ; September 2015',
        explorerUrl: 'https://stellar.expert/explorer/public',
      };
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
};
