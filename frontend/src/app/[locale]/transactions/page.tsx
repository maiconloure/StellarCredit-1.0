'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { WalletGuard } from '@/components/auth/WalletGuard';
import { useWalletStore } from '@/stores/walletStore';
import { useCreditStore } from '@/stores/creditStore';
import { useWalletData } from '@/components/providers/WalletDataProvider';
import { useRealtimeContext } from '@/components/providers/RealtimeProvider';
import { formatDate, formatAmount, formatAddress } from '@/lib/utils';

interface Transaction {
  id: string;
  hash: string;
  type: 'payment' | 'receive' | 'path_payment' | 'create_account';
  amount: number;
  asset: string;
  from: string;
  to: string;
  timestamp: string;
  successful: boolean;
  fee: number;
  memo?: string;
}

// Mock transactions data
const mockTransactions: Transaction[] = [
  {
    id: '1',
    hash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
    type: 'receive',
    amount: 100.50,
    asset: 'XLM',
    from: 'GCKFBEIYTKP74Q7T2HFYOCS7TPNTY3AQNKBSQEQFHW7FXGFNQD2TWKHW',
    to: 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426CJGQGKJJJKL2NRMPNQZUU',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    successful: true,
    fee: 0.00001,
    memo: 'Payment for services'
  },
  {
    id: '2',
    hash: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1',
    type: 'payment',
    amount: 50.25,
    asset: 'XLM',
    from: 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426CJGQGKJJJKL2NRMPNQZUU',
    to: 'GCKFBEIYTKP74Q7T2HFYOCS7TPNTY3AQNKBSQEQFHW7FXGFNQD2TWKHW',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    successful: true,
    fee: 0.00001
  },
  {
    id: '3',
    hash: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2',
    type: 'receive',
    amount: 200.00,
    asset: 'USDC',
    from: 'GAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A',
    to: 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426CJGQGKJJJKL2NRMPNQZUU',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    successful: true,
    fee: 0.00001,
    memo: 'Invoice #1234'
  },
  {
    id: '4',
    hash: 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3',
    type: 'payment',
    amount: 25.75,
    asset: 'XLM',
    from: 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426CJGQGKJJJKL2NRMPNQZUU',
    to: 'GAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    successful: false,
    fee: 0.00001
  }
];

function TransactionsContent() {
  const t = useTranslations();
  const { publicKey } = useWalletStore();
  const creditStore = useCreditStore();
  const { refreshData } = useWalletData();
  const { isConnected: realtimeConnected, requestScoreUpdate } = useRealtimeContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'payment' | 'receive'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get transactions from store or use mock data
  const storeTransactions = (creditStore as any).transactions || [];
  const transactions = storeTransactions.length > 0 ? storeTransactions : mockTransactions;

  // Listen for real-time transaction updates
  useEffect(() => {
    const handleTransactionUpdate = (event: CustomEvent) => {
      console.log('🔄 Nova transação recebida:', event.detail);
      // Refresh data when new transaction is detected
      if (publicKey) {
        refreshData();
        requestScoreUpdate(publicKey);
      }
    };

    const handleWalletConnected = (event: CustomEvent) => {
      console.log('🎯 Carteira conectada na página de transações, atualizando dados:', event.detail);
      // Aguarda um pouco para garantir que os dados sejam carregados
      setTimeout(() => {
        refreshData();
      }, 500);
    };

    window.addEventListener('stellar:transaction', handleTransactionUpdate as EventListener);
    window.addEventListener('stellar:wallet-connected', handleWalletConnected as EventListener);
    
    return () => {
      window.removeEventListener('stellar:transaction', handleTransactionUpdate as EventListener);
      window.removeEventListener('stellar:wallet-connected', handleWalletConnected as EventListener);
    };
  }, [publicKey, refreshData, requestScoreUpdate]);

  const filteredTransactions = transactions.filter((tx: Transaction) => {
    const matchesSearch = tx.hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.memo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || tx.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

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

  const getTransactionIcon = (type: string, successful: boolean) => {
    if (!successful) return <XCircle className="h-5 w-5 text-red-500" />;
    
    switch (type) {
      case 'receive':
        return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
      case 'payment':
        return <ArrowUpRight className="h-5 w-5 text-blue-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string, successful: boolean) => {
    if (!successful) return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
    
    switch (type) {
      case 'receive':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'payment':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('transactions.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Histórico completo de suas transações na rede Stellar
            </p>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('transactions.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">{t('transactions.filters.all')}</option>
                  <option value="receive">Recebidas</option>
                  <option value="payment">Enviadas</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Atualizando...' : t('transactions.refresh')}
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  {t('transactions.export')}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Transactions List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <AnimatePresence>
              {filteredTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`transaction-item bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-l-4 ${getTransactionColor(transaction.type, transaction.successful)}`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {getTransactionIcon(transaction.type, transaction.successful)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {transaction.type === 'receive' ? 'Recebido' : 'Enviado'}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              transaction.successful 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {transaction.successful ? 'Sucesso' : 'Falhou'}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <div className="flex items-center space-x-2">
                              <span>De:</span>
                              <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                {formatAddress(transaction.from)}
                              </code>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span>Para:</span>
                              <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                {formatAddress(transaction.to)}
                              </code>
                            </div>
                            {transaction.memo && (
                              <div className="flex items-center space-x-2">
                                <span>Memo:</span>
                                <span className="italic">{transaction.memo}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {transaction.type === 'receive' ? '+' : '-'}{formatAmount(transaction.amount)} {transaction.asset}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Taxa: {formatAmount(transaction.fee)} XLM
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(transaction.timestamp)}
                        </div>
                      </div>
                    </div>

                    {/* Transaction Hash */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>Hash:</span>
                          <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {formatAddress(transaction.hash, 8, 8)}
                          </code>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Ver no Explorer
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredTransactions.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="text-gray-500 dark:text-gray-400">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">
                    {t('transactions.noTransactions')}
                  </h3>
                  <p className="text-sm">
                    {searchTerm || filterType !== 'all' 
                      ? 'Nenhuma transação encontrada com os filtros aplicados'
                      : 'Suas transações aparecerão aqui quando você começar a usar sua carteira'
                    }
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <WalletGuard>
      <TransactionsContent />
    </WalletGuard>
  );
}
