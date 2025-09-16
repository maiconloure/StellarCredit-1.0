'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useWalletStore } from '@/stores/walletStore';
import { useCreditStore } from '@/stores/creditStore';

interface WalletData {
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  hasData: boolean;
}

interface WalletDataContextType extends WalletData {
  refreshData: () => Promise<void>;
  isDataStale: boolean;
}

const WalletDataContext = createContext<WalletDataContextType | null>(null);

export function useWalletData() {
  const context = useContext(WalletDataContext);
  if (!context) {
    throw new Error('useWalletData must be used within WalletDataProvider');
  }
  return context;
}

interface WalletDataProviderProps {
  children: React.ReactNode;
}

export function WalletDataProvider({ children }: WalletDataProviderProps) {
  const { isConnected, publicKey, walletType, setWalletData } = useWalletStore();
  const { setScore, setTransactions, setAnalytics } = useCreditStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [hasData, setHasData] = useState(false);

  // Check if data is stale (older than 5 minutes)
  const isDataStale = lastUpdated ? (Date.now() - lastUpdated) > 5 * 60 * 1000 : true;

  const fetchWalletBalances = useCallback(async () => {
    if (!publicKey) return null;

    try {
      console.log('📊 Fetching wallet balances for:', publicKey.substring(0, 10) + '...');
      
      // For development, use mock data to avoid API failures
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 Using mock wallet data for development');
        return {
          balances: [
            {
              asset_type: 'native',
              balance: '9999.9999900',
              buying_liabilities: '0.0000000',
              selling_liabilities: '0.0000000'
            },
            {
              asset_type: 'credit_alphanum4',
              asset_code: 'USDC',
              asset_issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
              balance: '500.0000000',
              buying_liabilities: '0.0000000',
              selling_liabilities: '0.0000000',
              limit: '922337203685.4775807'
            }
          ],
          sequence: '123456789',
          subentryCount: 1,
        };
      }
      
      // Production API call
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch account data');
      }

      const accountData = await response.json();
      
      return {
        balances: accountData.balances || [],
        sequence: accountData.sequence || '0',
        subentryCount: accountData.subentry_count || 0,
      };
    } catch (error) {
      console.error('❌ Error fetching balances:', error);
      throw error;
    }
  }, [publicKey]);

  const fetchTransactions = useCallback(async () => {
    if (!publicKey) return [];

    try {
      console.log('💳 Fetching transactions for:', publicKey.substring(0, 10) + '...');
      
      // For development, use mock data to avoid API failures
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 Using mock transaction data for development');
        return [
          {
            id: 'mock_tx_1',
            hash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
            type: 'payment',
            amount: '100.0000000',
            asset_code: 'XLM',
            from: publicKey,
            to: 'GAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            successful: true,
            fee: '0.00001'
          },
          {
            id: 'mock_tx_2',
            hash: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1',
            type: 'receive',
            amount: '250.0000000',
            asset_code: 'USDC',
            from: 'GAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A',
            to: publicKey,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            successful: true,
            fee: '0.00001'
          }
        ];
      }
      
      // Production API call
      const response = await fetch(
        `https://horizon-testnet.stellar.org/accounts/${publicKey}/transactions?order=desc&limit=50`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      return data._embedded?.records || [];
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
      return [];
    }
  }, [publicKey]);

  const calculateCreditScore = useCallback(async (balances: any[], transactions: any[]) => {
    console.log('🧮 Calculating credit score...');
    
    // Mock credit score calculation based on wallet data
    const totalBalance = balances.reduce((sum, balance) => {
      if (balance.asset_type === 'native') {
        return sum + parseFloat(balance.balance);
      }
      return sum;
    }, 0);

    const transactionCount = transactions.length;
    const avgTransactionAmount = transactions.length > 0 
      ? transactions.reduce((sum: number, tx: any) => sum + (parseFloat(tx.fee_charged) || 0), 0) / transactions.length
      : 0;

    // Simple scoring algorithm
    let score = 300; // Base score
    
    // Balance factor (up to 200 points)
    score += Math.min(totalBalance * 2, 200);
    
    // Transaction history factor (up to 150 points)
    score += Math.min(transactionCount * 3, 150);
    
    // Activity factor (up to 100 points)
    if (avgTransactionAmount > 0) {
      score += Math.min(avgTransactionAmount * 10, 100);
    }

    // Cap at 850 (excellent credit)
    score = Math.min(score, 850);

    const mockScore = {
      score: Math.round(score),
      category: score >= 750 ? 'excellent' : score >= 650 ? 'good' : score >= 550 ? 'fair' : 'poor',
      lastUpdated: Date.now(),
      metrics: {
        total_volume_3m: totalBalance * 12, // Annualized
        transaction_count_3m: transactionCount,
        avg_balance: totalBalance,
        payment_history: transactionCount > 10 ? 95 : transactionCount > 5 ? 80 : 65,
        account_age_months: 12, // Mock value
        network_activity: Math.min(transactionCount * 5, 100),
      }
    };

    return mockScore;
  }, []);

  const refreshData = useCallback(async () => {
    if (!isConnected || !publicKey) {
      setHasData(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Refreshing wallet data...');

      // Fetch all data in parallel
      const [balanceData, transactions] = await Promise.all([
        fetchWalletBalances(),
        fetchTransactions(),
      ]);

      if (balanceData) {
        // Update wallet store
        setWalletData(balanceData);
        
        // Calculate and update credit score
        const creditScore = await calculateCreditScore(balanceData.balances, transactions);
        setScore(creditScore);
        
        // Update transactions
        setTransactions(transactions.slice(0, 20)); // Keep last 20 transactions
        
        // Mock analytics data
        const analyticsData = {
          monthlySpending: transactions.slice(0, 12).map((_, index) => ({
            month: new Date(Date.now() - index * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { month: 'short' }),
            amount: Math.random() * 1000 + 200,
          })).reverse(),
          categoryBreakdown: [
            { category: 'Pagamentos', amount: Math.random() * 500 + 100, percentage: 35 },
            { category: 'Transferências', amount: Math.random() * 300 + 50, percentage: 25 },
            { category: 'DeFi', amount: Math.random() * 200 + 30, percentage: 20 },
            { category: 'NFTs', amount: Math.random() * 150 + 20, percentage: 15 },
            { category: 'Outros', amount: Math.random() * 100 + 10, percentage: 5 },
          ],
        };
        
        setAnalytics(analyticsData);
        
        setLastUpdated(Date.now());
        setHasData(true);
        
        console.log('✅ Wallet data refreshed successfully');
      }
    } catch (err: any) {
      console.error('❌ Failed to refresh wallet data:', err);
      setError(err.message || 'Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  }, [
    isConnected, 
    publicKey, 
    fetchWalletBalances, 
    fetchTransactions, 
    calculateCreditScore,
    setWalletData,
    setScore,
    setTransactions,
    setAnalytics
  ]);

  // Auto-refresh data when wallet connects
  useEffect(() => {
    if (isConnected && publicKey && (!hasData || isDataStale)) {
      refreshData();
    }
  }, [isConnected, publicKey, hasData, isDataStale, refreshData]);

  // Listen for wallet connection events for immediate updates
  useEffect(() => {
    const handleWalletConnected = (event: CustomEvent) => {
      console.log('🎯 Wallet connected event received, refreshing data immediately');
      const { publicKey: newPublicKey, walletType, network } = event.detail;
      
      if (newPublicKey) {
        // Force immediate refresh when wallet connects
        setTimeout(() => {
          refreshData();
        }, 100); // Small delay to ensure store is updated
      }
    };

    const handleWalletDisconnected = () => {
      console.log('🎯 Wallet disconnected event received, clearing data');
      setHasData(false);
      setLastUpdated(null);
      setError(null);
    };

    // Add event listeners
    window.addEventListener('stellar:wallet-connected', handleWalletConnected as EventListener);
    window.addEventListener('stellar:wallet-disconnected', handleWalletDisconnected);

    return () => {
      window.removeEventListener('stellar:wallet-connected', handleWalletConnected as EventListener);
      window.removeEventListener('stellar:wallet-disconnected', handleWalletDisconnected);
    };
  }, [refreshData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!isConnected || !publicKey) return;

    const interval = setInterval(() => {
      if (!isLoading) {
        console.log('⏰ Auto-refreshing wallet data...');
        refreshData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isConnected, publicKey, isLoading, refreshData]);

  // Clear data when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setHasData(false);
      setLastUpdated(null);
      setError(null);
    }
  }, [isConnected]);

  const contextValue: WalletDataContextType = {
    isLoading,
    error,
    lastUpdated,
    hasData,
    isDataStale,
    refreshData,
  };

  return (
    <WalletDataContext.Provider value={contextValue}>
      {children}
    </WalletDataContext.Provider>
  );
}
