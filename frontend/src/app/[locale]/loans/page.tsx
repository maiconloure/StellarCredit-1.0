'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Clock,
  Calculator,
  CreditCard,
  AlertCircle,
  Star,
  RefreshCw
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { WalletGuard } from '@/components/auth/WalletGuard';
import { useWalletStore } from '@/stores/walletStore';
import { useCurrentScore, useLoans } from '@/stores/creditStore';
import { useWalletData } from '@/components/providers/WalletDataProvider';
import { useRealtimeContext } from '@/components/providers/RealtimeProvider';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface LoanOffer {
  id: string;
  name: string;
  minScore: number;
  maxAmount: number;
  interestRate: number; // monthly
  termMonths: number;
  features: string[];
  popular?: boolean;
}

const loanOffers: LoanOffer[] = [
  {
    id: 'premium',
    name: 'Empréstimo Premium',
    minScore: 750,
    maxAmount: 1000,
    interestRate: 0.02,
    termMonths: 12,
    features: [
      'Taxa de juros mais baixa',
      'Aprovação instantânea',
      'Sem taxas ocultas',
      'Pagamento antecipado sem multa'
    ]
  },
  {
    id: 'standard',
    name: 'Empréstimo Padrão',
    minScore: 500,
    maxAmount: 500,
    interestRate: 0.04,
    termMonths: 6,
    features: [
      'Aprovação rápida',
      'Flexibilidade de pagamento',
      'Suporte 24/7'
    ],
    popular: true
  },
  {
    id: 'starter',
    name: 'Empréstimo Iniciante',
    minScore: 300,
    maxAmount: 200,
    interestRate: 0.06,
    termMonths: 3,
    features: [
      'Ideal para começar',
      'Construa seu histórico',
      'Processo simplificado'
    ]
  }
];

function LoansContent() {
  const t = useTranslations();
  const { publicKey } = useWalletStore();
  const currentScore = useCurrentScore();
  const { availableLoans, activeLoans, eligibleLoans } = useLoans();
  const { refreshData } = useWalletData();
  const { isConnected: realtimeConnected, requestScoreUpdate } = useRealtimeContext();
  
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  const [loanAmount, setLoanAmount] = useState<number>(100);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const userScore = currentScore?.score || 0;

  // Use loans from store if available, otherwise use mock data
  const loansToShow = availableLoans.length > 0 ? availableLoans.map(loan => ({
    id: loan.id,
    name: `Empréstimo ${loan.id.charAt(0).toUpperCase() + loan.id.slice(1)}`,
    minScore: loan.min_score,
    maxAmount: loan.max_amount,
    interestRate: loan.interest_rate,
    termMonths: loan.term_months,
    features: loan.conditions || [],
    popular: loan.id === 'standard'
  })) : loanOffers;

  // Listen for real-time score updates
  useEffect(() => {
    const handleScoreUpdate = () => {
      console.log('📊 Score atualizado, recalculando empréstimos disponíveis');
    };

    const handleWalletConnected = (event: CustomEvent) => {
      console.log('🎯 Carteira conectada na página de empréstimos, atualizando dados:', event.detail);
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

  const calculateMonthlyPayment = (principal: number, monthlyRate: number, months: number) => {
    if (monthlyRate === 0) return principal / months;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
           (Math.pow(1 + monthlyRate, months) - 1);
  };

  const getEligibleLoans = () => {
    return loansToShow.filter(loan => userScore >= loan.minScore);
  };

  const isEligible = (loan: any) => userScore >= loan.minScore;

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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('loans.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Empréstimos descentralizados baseados em seu score de crédito
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Atualizando...' : 'Atualizar Ofertas'}
              </Button>
              <div className={`text-xs px-2 py-1 rounded-full ${
                realtimeConnected 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {realtimeConnected ? '🟢 Tempo Real' : '🔴 Offline'}
              </div>
            </div>
          </motion.div>

          {/* User Score Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-primary-500 to-stellar-500 rounded-2xl shadow-lg p-6 mb-8 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">{t('score.currentScore')}</h2>
                <div className="text-3xl font-bold">{userScore}</div>
                <div className="text-sm opacity-90">
                  {getEligibleLoans().length} ofertas disponíveis
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90 mb-1">Valor máximo disponível</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(Math.max(...getEligibleLoans().map(l => l.maxAmount), 0))}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Loan Offers */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  Ofertas Disponíveis
                </h2>

                {loansToShow.map((loan, index) => {
                  const eligible = isEligible(loan);
                  const monthlyPayment = calculateMonthlyPayment(loanAmount, loan.interestRate, loan.termMonths);
                  
                  return (
                    <motion.div
                      key={loan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all ${
                        eligible 
                          ? 'border-green-200 dark:border-green-800 hover:border-green-300' 
                          : 'border-gray-200 dark:border-gray-700 opacity-60'
                      } ${selectedLoan === loan.id ? 'ring-2 ring-primary-500' : ''}`}
                    >
                      {loan.popular && eligible && (
                        <div className="absolute -top-3 left-6 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                          <Star className="h-3 w-3 mr-1" />
                          Mais Popular
                        </div>
                      )}

                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              {loan.name}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                Score mín: {loan.minScore}
                              </div>
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                Até {formatCurrency(loan.maxAmount)}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {loan.termMonths} meses
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                              {formatPercentage(loan.interestRate)}
                            </div>
                            <div className="text-xs text-gray-500">ao mês</div>
                          </div>
                        </div>

                        {/* Eligibility Status */}
                        <div className={`flex items-center space-x-2 mb-4 p-3 rounded-lg ${
                          eligible 
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        }`}>
                          {eligible ? (
                            <>
                              <CheckCircle className="h-5 w-5" />
                              <span className="font-medium">Você é elegível para este empréstimo</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-5 w-5" />
                              <span className="font-medium">
                                Score insuficiente (necessário: {loan.minScore})
                              </span>
                            </>
                          )}
                        </div>

                        {/* Features */}
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                            Características:
                          </h4>
                          <ul className="space-y-1">
                            {loan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Payment Preview */}
                        {eligible && (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                              Simulação para {formatCurrency(loanAmount)}:
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Pagamento mensal:</span>
                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                  {formatCurrency(monthlyPayment)}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Total a pagar:</span>
                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                  {formatCurrency(monthlyPayment * loan.termMonths)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <Button
                          className={`w-full ${eligible ? 'btn-stellar' : ''}`}
                          disabled={!eligible}
                          onClick={() => setSelectedLoan(loan.id)}
                          variant={eligible ? 'default' : 'outline'}
                        >
                          {eligible ? 'Solicitar Empréstimo' : 'Melhore seu Score'}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* Loan Calculator */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* Calculator */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Simulador
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Valor desejado
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      step="10"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Comparação de Ofertas
                    </h4>
                    <div className="space-y-2">
                      {getEligibleLoans().map(loan => {
                        const monthlyPayment = calculateMonthlyPayment(loanAmount, loan.interestRate, loan.termMonths);
                        return (
                          <div key={loan.id} className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{loan.name}:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(monthlyPayment)}/mês
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Dicas para Melhorar seu Score
                </h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li>• Mantenha transações regulares na rede Stellar</li>
                  <li>• Diversifique os tipos de operações</li>
                  <li>• Mantenha um saldo médio consistente</li>
                  <li>• Evite transações que falhem</li>
                  <li>• Use diferentes assets (XLM, USDC, etc.)</li>
                </ul>
              </div>

              {/* Quick Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Estatísticas Rápidas
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total emprestado:</span>
                    <span className="font-semibold">$0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Empréstimos ativos:</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Taxa de sucesso:</span>
                    <span className="font-semibold text-green-600">100%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
    </div>
  );
}

export default function LoansPage() {
  return (
    <WalletGuard>
      <LoansContent />
    </WalletGuard>
  );
}
