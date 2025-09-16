'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp, CreditCard, Activity } from 'lucide-react';
import { useWalletStore } from '@/stores/walletStore';
import { useCurrentScore, useCreditStore } from '@/stores/creditStore';
import { useWalletData } from '@/components/providers/WalletDataProvider';
import { useRealtimeContext } from '@/components/providers/RealtimeProvider';
import { ScoreIndicator } from './ScoreIndicator';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

export function Dashboard() {
  const t = useTranslations('dashboard');
  const { publicKey, balances } = useWalletStore();
  const currentScore = useCurrentScore();
  const creditStore = useCreditStore();
  const { refreshData, isLoading } = useWalletData();
  const { isConnected: realtimeConnected, requestScoreUpdate } = useRealtimeContext();
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get recent transactions from store
  const recentTransactions = (creditStore as any).transactions?.slice(0, 5) || [];

  // Listen for real-time updates
  useEffect(() => {
    const handleTransactionUpdate = (event: CustomEvent) => {
      console.log('🔄 Nova transação no dashboard:', event.detail);
    };

    const handleScoreUpdate = () => {
      console.log('📊 Score atualizado no dashboard');
    };

    const handleWalletConnected = (event: CustomEvent) => {
      console.log('🎯 Carteira conectada no dashboard, atualizando dados:', event.detail);
      // Aguarda um pouco para garantir que os dados sejam carregados
      setTimeout(() => {
        refreshData();
      }, 500);
    };

    window.addEventListener('stellar:transaction', handleTransactionUpdate as EventListener);
    window.addEventListener('stellar:score-update', handleScoreUpdate);
    window.addEventListener('stellar:wallet-connected', handleWalletConnected as EventListener);
    
    return () => {
      window.removeEventListener('stellar:transaction', handleTransactionUpdate as EventListener);
      window.removeEventListener('stellar:score-update', handleScoreUpdate);
      window.removeEventListener('stellar:wallet-connected', handleWalletConnected as EventListener);
    };
  }, []);

  const handleRefresh = async () => {
    if (!publicKey) return;
    
    setIsRefreshing(true);
    try {
      await refreshData();
      requestScoreUpdate(publicKey);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate total balance
  const totalBalance = balances.reduce((sum, balance) => {
    if (balance.asset_type === 'native') {
      return sum + parseFloat(balance.balance);
    }
    return sum;
  }, 0);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Welcome header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {t('welcome')}, {publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}` : 'User'}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {t('overview')}
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(isRefreshing || isLoading) ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Atualizando...' : 'Atualizar'}
              </Button>
              <div className={`text-xs px-2 py-1 rounded-full ${
                realtimeConnected 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {realtimeConnected ? '🟢 Tempo Real' : '🔴 Offline'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {currentScore?.score || '---'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Credit Score
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <CreditCard className="h-6 w-6 text-green-500" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(totalBalance)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Balance
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <Activity className="h-6 w-6 text-purple-500" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {recentTransactions.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Recent Activity
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Dashboard content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Credit Score Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                Credit Score Analysis
              </h2>
              {currentScore ? (
                <div className="flex items-center space-x-6">
                  <ScoreIndicator score={currentScore.score} size="md" animated />
                  <div className="flex-1">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Risk Level
                        </span>
                        <span className={`text-sm font-semibold ${
                          currentScore.risk_level === 'LOW' ? 'text-green-600' :
                          currentScore.risk_level === 'MEDIUM' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {currentScore.risk_level}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Última atualização: {new Date(currentScore.analysis_timestamp).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {currentScore.recommendations?.slice(0, 3).map((rec, index) => (
                        <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                          • {rec}
                        </div>
                      )) || (
                        <div className="text-xs text-gray-500">
                          Carregando recomendações...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                    <p className="text-gray-500 dark:text-gray-400">Carregando seu score de crédito...</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Recent Transactions */}
            {recentTransactions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  Atividade Recente
                </h3>
                <div className="space-y-3">
                  {recentTransactions.slice(0, 3).map((tx: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Transação #{tx.id || index + 1}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date().toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          +{Math.random() * 100 + 50} XLM
                        </div>
                        <div className="text-xs text-green-600">Sucesso</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Ações Rápidas
              </h3>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="ghost"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Atualizar Dados
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="ghost"
                  onClick={() => window.location.href = '/score'}
                >
                  <TrendingUp className="h-4 w-4 mr-3" />
                  Ver Score Completo
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="ghost"
                  onClick={() => window.location.href = '/transactions'}
                >
                  <Activity className="h-4 w-4 mr-3" />
                  Ver Transações
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="ghost"
                  onClick={() => window.location.href = '/loans'}
                >
                  <CreditCard className="h-4 w-4 mr-3" />
                  Solicitar Empréstimo
                </Button>
              </div>
            </motion.div>

            {/* Balance Details */}
            {balances.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  Seus Assets
                </h3>
                <div className="space-y-3">
                  {balances.slice(0, 3).map((balance, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-stellar-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {balance.asset_type === 'native' ? 'XLM' : balance.asset_code?.slice(0, 3)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {balance.asset_type === 'native' ? 'Stellar Lumens' : balance.asset_code}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {parseFloat(balance.balance).toLocaleString('pt-BR', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 7 
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
