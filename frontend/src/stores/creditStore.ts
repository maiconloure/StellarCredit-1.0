import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { useMemo } from 'react';

export interface CreditMetrics {
  total_volume_3m: number;
  transaction_count_3m: number;
  avg_balance: number;
  payment_punctuality: number; // 0-1
  usage_frequency: number; // transactions per month
  diversification_score: number; // 0-1
  age_score: number; // 0-1
  network_activity: number; // 0-1
}

export interface CreditScoreData {
  score: number; // 0-1000
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  metrics: CreditMetrics;
  recommendations: string[];
  analysis_timestamp: string;
  mock?: boolean;
  profile?: string;
}

export interface ScoreHistory {
  timestamp: string;
  score: number;
  risk_level: string;
}

export interface LoanOffer {
  id: string;
  min_score: number;
  max_amount: number;
  interest_rate: number; // annual percentage
  term_months: number;
  monthly_payment?: number;
  total_payment?: number;
  eligible: boolean;
  conditions: string[];
}

export interface CreditState {
  // Score data
  currentScore: CreditScoreData | null;
  scoreHistory: ScoreHistory[];
  isLoading: boolean;
  lastUpdated: number | null;
  
  // Loan data
  availableLoans: LoanOffer[];
  activeLoans: any[]; // TODO: Define proper loan interface
  
  // UI state
  isUpdatingScore: boolean;
  error: string | null;
  
  // Real-time updates
  isStreaming: boolean;
  streamError: string | null;
  
  // Actions
  setScore: (scoreData: CreditScoreData) => void;
  addScoreToHistory: (score: number, riskLevel: string) => void;
  setLoading: (loading: boolean) => void;
  setUpdatingScore: (updating: boolean) => void;
  setError: (error: string | null) => void;
  setAvailableLoans: (loans: LoanOffer[]) => void;
  setActiveLoans: (loans: any[]) => void;
  setStreaming: (streaming: boolean) => void;
  setStreamError: (error: string | null) => void;
  setTransactions: (transactions: any[]) => void;
  setAnalytics: (analytics: any) => void;
  clearData: () => void;
  
  // Computed actions
  getScoreColor: () => string;
  getScoreLabel: () => string;
  getRiskLevelColor: () => string;
  getEligibleLoans: () => LoanOffer[];
}

export const useCreditStore = create<CreditState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      currentScore: null,
      scoreHistory: [],
      isLoading: false,
      lastUpdated: null,
      availableLoans: [],
      activeLoans: [],
      isUpdatingScore: false,
      error: null,
      isStreaming: false,
      streamError: null,

      // Actions
      setScore: (scoreData: CreditScoreData) =>
        set((state) => {
          state.currentScore = scoreData;
          state.lastUpdated = Date.now();
          state.isLoading = false;
          state.isUpdatingScore = false;
          state.error = null;
          
          // Add to history if it's a new score
          const lastHistoryScore = state.scoreHistory[state.scoreHistory.length - 1];
          if (!lastHistoryScore || lastHistoryScore.score !== scoreData.score) {
            state.scoreHistory.push({
              timestamp: scoreData.analysis_timestamp,
              score: scoreData.score,
              risk_level: scoreData.risk_level,
            });
            
            // Keep only last 100 entries
            if (state.scoreHistory.length > 100) {
              state.scoreHistory = state.scoreHistory.slice(-100);
            }
          }
        }),

      addScoreToHistory: (score: number, riskLevel: string) =>
        set((state) => {
          state.scoreHistory.push({
            timestamp: new Date().toISOString(),
            score,
            risk_level: riskLevel,
          });
          
          // Keep only last 100 entries
          if (state.scoreHistory.length > 100) {
            state.scoreHistory = state.scoreHistory.slice(-100);
          }
        }),

      setLoading: (loading: boolean) =>
        set((state) => {
          state.isLoading = loading;
          if (loading) {
            state.error = null;
          }
        }),

      setUpdatingScore: (updating: boolean) =>
        set((state) => {
          state.isUpdatingScore = updating;
          if (updating) {
            state.error = null;
          }
        }),

      setError: (error: string | null) =>
        set((state) => {
          state.error = error;
          state.isLoading = false;
          state.isUpdatingScore = false;
        }),

      setAvailableLoans: (loans: LoanOffer[]) =>
        set((state) => {
          state.availableLoans = loans;
        }),

      setActiveLoans: (loans: any[]) =>
        set((state) => {
          state.activeLoans = loans;
        }),

      setStreaming: (streaming: boolean) =>
        set((state) => {
          state.isStreaming = streaming;
          if (streaming) {
            state.streamError = null;
          }
        }),

      setStreamError: (error: string | null) =>
        set((state) => {
          state.streamError = error;
          state.isStreaming = false;
        }),

      setTransactions: (transactions: any[]) =>
        set((state) => {
          // Store transactions data for use across components
          (state as any).transactions = transactions;
        }),

      setAnalytics: (analytics: any) =>
        set((state) => {
          // Store analytics data for use across components
          (state as any).analytics = analytics;
        }),

      clearData: () =>
        set((state) => {
          state.currentScore = null;
          state.scoreHistory = [];
          state.availableLoans = [];
          state.activeLoans = [];
          state.isLoading = false;
          state.isUpdatingScore = false;
          state.error = null;
          state.isStreaming = false;
          state.streamError = null;
          state.lastUpdated = null;
          (state as any).transactions = [];
          (state as any).analytics = null;
        }),

      // Computed actions
      getScoreColor: () => {
        const { currentScore } = get();
        if (!currentScore) return 'text-gray-400';
        
        const score = currentScore.score;
        if (score >= 750) return 'text-green-500';
        if (score >= 600) return 'text-blue-500';
        if (score >= 400) return 'text-yellow-500';
        return 'text-red-500';
      },

      getScoreLabel: () => {
        const { currentScore } = get();
        if (!currentScore) return 'No Score';
        
        const score = currentScore.score;
        if (score >= 750) return 'Excellent';
        if (score >= 600) return 'Good';
        if (score >= 400) return 'Fair';
        return 'Poor';
      },

      getRiskLevelColor: () => {
        const { currentScore } = get();
        if (!currentScore) return 'text-gray-400';
        
        switch (currentScore.risk_level) {
          case 'LOW':
            return 'text-green-500';
          case 'MEDIUM':
            return 'text-yellow-500';
          case 'HIGH':
            return 'text-red-500';
          default:
            return 'text-gray-400';
        }
      },

      getEligibleLoans: () => {
        const { currentScore, availableLoans } = get();
        if (!currentScore) return [];
        
        return availableLoans.filter(loan => 
          currentScore.score >= loan.min_score
        ).map(loan => ({
          ...loan,
          eligible: true,
        }));
      },
    }))
  )
);

// Selectors for performance
export const useCurrentScore = () =>
  useCreditStore((state) => state.currentScore);

export const useScoreHistory = () =>
  useCreditStore((state) => state.scoreHistory);

export const useCreditLoading = () => {
  const isLoading = useCreditStore((state) => state.isLoading);
  const isUpdatingScore = useCreditStore((state) => state.isUpdatingScore);
  const error = useCreditStore((state) => state.error);
  
  return { isLoading, isUpdatingScore, error };
};

export const useCreditActions = () => {
  const store = useCreditStore();
  return {
    setScore: store.setScore,
    setLoading: store.setLoading,
    setUpdatingScore: store.setUpdatingScore,
    setError: store.setError,
    clearData: store.clearData,
  };
};

export const useLoans = () => {
  const availableLoans = useCreditStore((state) => state.availableLoans);
  const activeLoans = useCreditStore((state) => state.activeLoans);
  const currentScore = useCreditStore((state) => state.currentScore);
  
  // Calcular empréstimos elegíveis de forma estável
  const eligibleLoans = useMemo(() => {
    if (!currentScore || !availableLoans) return [];
    
    return availableLoans.filter(loan => 
      currentScore.score >= loan.min_score
    );
  }, [currentScore, availableLoans]);
  
  return { availableLoans, activeLoans, eligibleLoans };
};

// Utility functions
export const calculateScorePercentage = (score: number): number => {
  return Math.max(0, Math.min(100, (score / 1000) * 100));
};

export const getScoreGradient = (score: number): string => {
  if (score >= 750) return 'from-green-400 to-green-600';
  if (score >= 600) return 'from-blue-400 to-blue-600';
  if (score >= 400) return 'from-yellow-400 to-yellow-600';
  return 'from-red-400 to-red-600';
};

export const formatScore = (score: number): string => {
  return score.toFixed(0);
};

export const formatMetricValue = (value: number, type: 'percentage' | 'currency' | 'number' | 'frequency'): string => {
  switch (type) {
    case 'percentage':
      return `${(value * 100).toFixed(1)}%`;
    case 'currency':
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'frequency':
      return `${value.toFixed(1)}/month`;
    case 'number':
    default:
      return value.toLocaleString('en-US');
  }
};

// Default loan offers (can be fetched from API)
export const DEFAULT_LOAN_OFFERS: LoanOffer[] = [
  {
    id: 'premium',
    min_score: 750,
    max_amount: 1000,
    interest_rate: 0.02, // 2% monthly
    term_months: 12,
    eligible: false,
    conditions: [
      'Score mínimo de 750',
      'Histórico de 3+ meses',
      'Taxa de sucesso > 95%',
    ],
  },
  {
    id: 'standard',
    min_score: 500,
    max_amount: 500,
    interest_rate: 0.04, // 4% monthly
    term_months: 6,
    eligible: false,
    conditions: [
      'Score mínimo de 500',
      'Histórico de 1+ mês',
      'Taxa de sucesso > 80%',
    ],
  },
  {
    id: 'starter',
    min_score: 300,
    max_amount: 200,
    interest_rate: 0.06, // 6% monthly
    term_months: 3,
    eligible: false,
    conditions: [
      'Score mínimo de 300',
      'Carteira ativa',
      'Pelo menos 5 transações',
    ],
  },
];
