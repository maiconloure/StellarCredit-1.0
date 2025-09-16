'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw, Calendar, Target, Award } from 'lucide-react';

import { ScoreIndicator } from '@/components/dashboard/ScoreIndicator';
import { Button } from '@/components/ui/Button';
import { WalletGuard } from '@/components/auth/WalletGuard';
import { useWalletStore } from '@/stores/walletStore';
import { useCurrentScore, useScoreHistory, useCreditActions } from '@/stores/creditStore';
import { useWalletData } from '@/components/providers/WalletDataProvider';
import { useRealtimeContext } from '@/components/providers/RealtimeProvider';
import { formatDate, formatPercentage } from '@/lib/utils';

function ScoreContent() {
  const t = useTranslations();
  const { publicKey } = useWalletStore();
  const currentScore = useCurrentScore();
  const scoreHistory = useScoreHistory();
  const { setUpdatingScore } = useCreditActions();
  const { refreshData } = useWalletData();
  const { isConnected: realtimeConnected, requestScoreUpdate } = useRealtimeContext();
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Listen for real-time score updates
  useEffect(() => {
    const handleScoreUpdate = () => {
      console.log('📊 Score atualizado em tempo real');
    };

    const handleWalletConnected = (event: CustomEvent) => {
      console.log('🎯 Carteira conectada na página de score, atualizando dados:', event.detail);
      // Aguarda um pouco para garantir que os dados sejam carregados
      setTimeout(() => {
        refreshData();
      }, 500);
    };

    window.addEventListener('stellar:score-update', handleScoreUpdate);
    window.addEventListener('stellar:wallet-connected', handleWalletConnected as EventListener);
    
    return () => {
      window.removeEventListener('stellar:score-update', handleScoreUpdate);
      window.removeEventListener('stellar:wallet-connected', handleWalletConnected as EventListener);
    };
  }, [refreshData]);

  const handleUpdateScore = async () => {
    if (!publicKey) return;
    
    setIsRefreshing(true);
    setUpdatingScore(true);
    
    try {
      // Request immediate score update
      requestScoreUpdate(publicKey);
      
      // Also refresh all data
      await refreshData();
    } finally {
      setIsRefreshing(false);
      // setUpdatingScore will be set to false when score update completes
    }
  };

  const mockMetrics = currentScore?.metrics || {
    total_volume_3m: 5000,
    transaction_count_3m: 25,
    avg_balance: 250,
    payment_punctuality: 0.85,
    usage_frequency: 8.3,
    diversification_score: 0.6,
    age_score: 0.7,
    network_activity: 0.4
  };

  const scoreFactors = [
    {
      name: t('score.metrics.punctuality'),
      value: mockMetrics.payment_punctuality,
      weight: 30,
      icon: Target,
      color: 'text-green-500'
    },
    {
      name: t('score.metrics.volume'),
      value: mockMetrics.total_volume_3m / 10000,
      weight: 20,
      icon: TrendingUp,
      color: 'text-blue-500'
    },
    {
      name: t('score.metrics.diversification'),
      value: mockMetrics.diversification_score,
      weight: 20,
      icon: Award,
      color: 'text-purple-500'
    },
    {
      name: t('score.metrics.frequency'),
      value: mockMetrics.usage_frequency / 20,
      weight: 15,
      icon: Calendar,
      color: 'text-orange-500'
    },
    {
      name: t('score.metrics.balance'),
      value: mockMetrics.avg_balance / 1000,
      weight: 15,
      icon: TrendingUp,
      color: 'text-teal-500'
    }
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('score.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t('score.trackAndImprove')}
            </p>
            <div className={`mt-4 text-xs px-2 py-1 rounded-full inline-block ${
              realtimeConnected 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {realtimeConnected ? '🟢 Atualizações em Tempo Real Ativas' : '🔴 Offline - Sem Atualizações Automáticas'}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Score Display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-1"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
                <h2 className="text-xl font-semibold mb-6">{t('score.yourScore')}</h2>
                
                {currentScore ? (
                  <ScoreIndicator 
                    score={currentScore.score} 
                    size="lg" 
                    animated={true}
                  />
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('score.riskLevel')}</span>
                    <span className={`font-medium ${
                      currentScore?.risk_level === 'LOW' ? 'text-green-500' :
                      currentScore?.risk_level === 'MEDIUM' ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {currentScore?.risk_level || 'MEDIUM'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('score.lastUpdate')}</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {currentScore ? formatDate(currentScore.analysis_timestamp) : 'Carregando...'}
                    </span>
                  </div>
                </div>

                <Button 
                  className="w-full mt-6 btn-stellar"
                  size="lg"
                  onClick={handleUpdateScore}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Atualizando...' : t('score.updateNow')}
                </Button>
              </div>
            </motion.div>

            {/* Score Factors */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-6">{t('score.factors')}</h3>
                
                <div className="space-y-4">
                  {scoreFactors.map((factor, index) => (
                    <motion.div
                      key={factor.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-white dark:bg-gray-600 ${factor.color}`}>
                          <factor.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {factor.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Peso: {factor.weight}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {formatPercentage(factor.value)}
                        </div>
                        <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                          <div 
                            className="bg-gradient-to-r from-primary-400 to-stellar-400 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(factor.value * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4">{t('score.recommendations')}</h3>
                
                <div className="space-y-3">
                  {currentScore?.recommendations?.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                          {index + 1}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {rec}
                      </p>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <p>Carregando recomendações...</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Score History */}
          {scoreHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-6">{t('score.history')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {scoreHistory.slice(-8).map((entry, index) => (
                    <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {entry.score}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(entry.timestamp)}
                      </div>
                      <div className={`text-xs mt-1 ${
                        entry.risk_level === 'LOW' ? 'text-green-500' :
                        entry.risk_level === 'MEDIUM' ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        {entry.risk_level}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
    </div>
  );
}

export default function ScorePage() {
  return (
    <WalletGuard>
      <ScoreContent />
    </WalletGuard>
  );
}
