'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  Download,
  RefreshCw,
  DollarSign,
  CreditCard,
  Target,
  Activity
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { WalletGuard } from '@/components/auth/WalletGuard';
import { useWalletStore } from '@/stores/walletStore';
import { useCurrentScore, useCreditStore } from '@/stores/creditStore';
import { useWalletData } from '@/components/providers/WalletDataProvider';
import { useRealtimeContext } from '@/components/providers/RealtimeProvider';
import { formatCurrency, formatPercentage, formatAmount } from '@/lib/utils';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data for charts
const scoreHistoryData = [
  { month: 'Jan', score: 320, trend: 'up' },
  { month: 'Fev', score: 340, trend: 'up' },
  { month: 'Mar', score: 355, trend: 'up' },
  { month: 'Abr', score: 380, trend: 'up' },
  { month: 'Mai', score: 420, trend: 'up' },
  { month: 'Jun', score: 450, trend: 'up' },
];

const transactionVolumeData = [
  { month: 'Jan', volume: 1200, transactions: 15 },
  { month: 'Fev', volume: 1800, transactions: 22 },
  { month: 'Mar', volume: 2200, transactions: 28 },
  { month: 'Abr', volume: 2800, transactions: 35 },
  { month: 'Mai', volume: 3200, transactions: 42 },
  { month: 'Jun', volume: 3800, transactions: 48 },
];

const assetDistributionData = [
  { name: 'XLM', value: 65, color: '#1890ff' },
  { name: 'USDC', value: 25, color: '#0ea5e9' },
  { name: 'USDT', value: 8, color: '#06b6d4' },
  { name: 'Outros', value: 2, color: '#8b5cf6' },
];

const riskMetricsData = [
  { category: 'Pontualidade', score: 85, max: 100 },
  { category: 'Volume', score: 72, max: 100 },
  { category: 'Diversificação', score: 60, max: 100 },
  { category: 'Frequência', score: 78, max: 100 },
  { category: 'Saldo', score: 45, max: 100 },
];

function AnalyticsContent() {
  const t = useTranslations();
  const { publicKey } = useWalletStore();
  const currentScore = useCurrentScore();
  const creditStore = useCreditStore();
  const { refreshData } = useWalletData();
  const { isConnected: realtimeConnected, requestScoreUpdate } = useRealtimeContext();
  
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get analytics data from store if available
  const storeAnalytics = (creditStore as any).analytics;

  // Listen for real-time updates
  useEffect(() => {
    const handleMarketUpdate = (event: CustomEvent) => {
      console.log('📈 Dados de mercado atualizados:', event.detail);
    };

    const handleScoreUpdate = () => {
      console.log('📊 Score atualizado, recalculando análises');
    };

    const handleWalletConnected = (event: CustomEvent) => {
      console.log('🎯 Carteira conectada na página de analytics, atualizando dados:', event.detail);
      // Aguarda um pouco para garantir que os dados sejam carregados
      setTimeout(() => {
        refreshData();
      }, 500);
    };

    window.addEventListener('stellar:market', handleMarketUpdate as EventListener);
    window.addEventListener('stellar:score-update', handleScoreUpdate);
    window.addEventListener('stellar:wallet-connected', handleWalletConnected as EventListener);
    
    return () => {
      window.removeEventListener('stellar:market', handleMarketUpdate as EventListener);
      window.removeEventListener('stellar:score-update', handleScoreUpdate);
      window.removeEventListener('stellar:wallet-connected', handleWalletConnected as EventListener);
    };
  }, [refreshData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      if (publicKey) {
        requestScoreUpdate(publicKey);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const metrics = [
    {
      title: t('score.currentScore'),
      value: currentScore?.score || 450,
      change: '+15',
      changeType: 'increase' as const,
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: t('analytics.totalVolume'),
      value: formatCurrency(15750),
      change: '+12.5%',
      changeType: 'increase' as const,
      icon: DollarSign,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Transações',
      value: '127',
      change: '+8',
      changeType: 'increase' as const,
      icon: CreditCard,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: t('analytics.successRate'),
      value: '98.4%',
      change: '+0.2%',
      changeType: 'increase' as const,
      icon: Target,
      color: 'text-teal-500',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20'
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {t('analytics.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('analytics.detailedAnalysis')}
                </p>
              </div>
              
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                {/* Time Range Selector */}
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="7d">{t('analytics.last7Days')}</option>
                  <option value="30d">{t('analytics.last30Days')}</option>
                  <option value="90d">{t('analytics.last90Days')}</option>
                  <option value="1y">{t('analytics.lastYear')}</option>
                </select>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Atualizando...' : 'Atualizar'}
                </Button>
                
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
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
          </motion.div>

          {/* Key Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                    <metric.icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                  <div className={`flex items-center text-sm ${
                    metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.changeType === 'increase' ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {metric.change}
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {metric.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {metric.title}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Score History Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
{t('analytics.scoreEvolution')}
                </h3>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scoreHistoryData}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#f9fafb'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#1890ff" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#scoreGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Transaction Volume Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Volume de Transações
                </h3>
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={transactionVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#f9fafb'
                      }} 
                    />
                    <Bar dataKey="volume" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Asset Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
{t('analytics.assetDistribution')}
                </h3>
                <PieChart className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      dataKey="value"
                      data={assetDistributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {assetDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Risk Assessment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
{t('analytics.riskAnalysis')}
                </h3>
                <Target className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="space-y-4">
                {riskMetricsData.map((metric, index) => (
                  <motion.div
                    key={metric.category}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {metric.category}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {metric.score}/{metric.max}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(metric.score / metric.max) * 100}%` }}
                          transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                          className={`h-2 rounded-full ${
                            metric.score >= 80 ? 'bg-green-500' :
                            metric.score >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Recomendações
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Aumente a diversificação de assets</li>
                  <li>• Mantenha um saldo médio mais alto</li>
                  <li>• Continue com alta pontualidade</li>
                </ul>
              </div>
            </motion.div>
          </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <WalletGuard>
      <AnalyticsContent />
    </WalletGuard>
  );
}
