'use client';

import { useState, useCallback, useRef } from 'react';
import { useWalletStore } from '@/stores/walletStore';
import { useCreditStore } from '@/stores/creditStore';

export interface ElisaResponse {
  content: string;
  confidence: number;
  suggestions?: string[];
  actions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
  metadata?: {
    intent?: string;
    entities?: any[];
    context?: any;
  };
}

export interface ElisaContext {
  currentPage?: string;
  userWallet?: string;
  timestamp?: string;
  creditScore?: number;
  recentTransactions?: any[];
  availableLoans?: any[];
}

export function useElisa() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const { publicKey, isConnected } = useWalletStore();
  const { currentScore, transactions, availableLoans } = useCreditStore();

  // Verificar suporte a voz
  const isVoiceSupported = typeof window !== 'undefined' && 
    'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  // Construir contexto do usuário
  const buildUserContext = useCallback((): ElisaContext => {
    return {
      currentPage: typeof window !== 'undefined' ? window.location.pathname : undefined,
      userWallet: publicKey || undefined,
      timestamp: new Date().toISOString(),
      creditScore: currentScore?.score,
      recentTransactions: transactions?.slice(0, 5),
      availableLoans: availableLoans?.slice(0, 3)
    };
  }, [publicKey, currentScore, transactions, availableLoans]);

  // Enviar mensagem para a ElisaOS
  const sendMessage = useCallback(async (
    message: string, 
    options?: { context?: ElisaContext }
  ): Promise<ElisaResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const context = options?.context || buildUserContext();
      
      // URL da API da ElisaOS
      const apiUrl = process.env.NEXT_PUBLIC_ELISA_API_URL || 'http://localhost:3002/api/elisa';
      
      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ELISA_API_KEY || ''}`,
        },
        body: JSON.stringify({
          message,
          context,
          userId: publicKey || 'anonymous',
          sessionId: localStorage.getItem('elisa-session-id') || generateSessionId(),
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Salvar session ID se fornecido
      if (data.sessionId) {
        localStorage.setItem('elisa-session-id', data.sessionId);
      }

      return {
        content: data.response || data.content || 'Desculpe, não consegui processar sua mensagem.',
        confidence: data.confidence || 0.8,
        suggestions: data.suggestions || [],
        actions: data.actions || [],
        metadata: data.metadata || {}
      };

    } catch (err: any) {
      console.error('Erro ao comunicar com ElisaOS:', err);
      
      // Fallback para respostas offline
      const fallbackResponse = getFallbackResponse(message, buildUserContext());
      setError('Conexão com Elisa indisponível. Usando modo offline.');
      
      return fallbackResponse;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, buildUserContext]);

  // Iniciar gravação de voz
  const startVoiceRecording = useCallback(async () => {
    if (!isVoiceSupported) {
      setError('Gravação de voz não suportada neste navegador');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError(null);
      
    } catch (err) {
      console.error('Erro ao iniciar gravação:', err);
      setError('Erro ao acessar microfone');
    }
  }, [isVoiceSupported]);

  // Parar gravação e transcrever
  const stopVoiceRecording = useCallback(async (): Promise<string | null> => {
    if (!mediaRecorderRef.current || !isRecording) return null;

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        try {
          // Tentar transcrever usando Web Speech API
          const transcript = await transcribeAudio(audioBlob);
          resolve(transcript);
        } catch (err) {
          console.error('Erro na transcrição:', err);
          setError('Erro ao transcrever áudio');
          resolve(null);
        } finally {
          // Limpar recursos
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
        }
      };
      
      mediaRecorder.stop();
    });
  }, [isRecording]);

  return {
    sendMessage,
    isLoading,
    error,
    startVoiceRecording,
    stopVoiceRecording,
    isRecording,
    isVoiceSupported
  };
}

// Função auxiliar para gerar session ID
function generateSessionId(): string {
  return 'elisa-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Respostas de fallback quando a API não está disponível
function getFallbackResponse(message: string, context: ElisaContext): ElisaResponse {
  const lowerMessage = message.toLowerCase();
  
  // Análise simples de intenção
  if (lowerMessage.includes('score') || lowerMessage.includes('pontuação')) {
    return {
      content: context.creditScore 
        ? `Seu score atual é ${context.creditScore}. ${getScoreAdvice(context.creditScore)}`
        : 'Não consegui acessar seu score no momento. Tente conectar sua carteira primeiro.',
      confidence: 0.9,
      suggestions: ['Como melhorar meu score?', 'Ver histórico de score', 'Fatores que afetam o score'],
      actions: [
        { label: 'Ver Score Detalhado', action: 'navigate', data: { url: '/score' } },
        { label: 'Atualizar Score', action: 'refresh_score' }
      ]
    };
  }
  
  if (lowerMessage.includes('empréstimo') || lowerMessage.includes('loan')) {
    return {
      content: context.availableLoans?.length 
        ? `Encontrei ${context.availableLoans.length} empréstimos disponíveis para seu perfil.`
        : 'Não encontrei empréstimos disponíveis no momento. Melhore seu score para ter mais opções.',
      confidence: 0.85,
      suggestions: ['Ver empréstimos disponíveis', 'Como conseguir melhores taxas?'],
      actions: [
        { label: 'Ver Empréstimos', action: 'navigate', data: { url: '/loans' } }
      ]
    };
  }
  
  if (lowerMessage.includes('transação') || lowerMessage.includes('histórico')) {
    return {
      content: context.recentTransactions?.length 
        ? `Você tem ${context.recentTransactions.length} transações recentes registradas.`
        : 'Não encontrei transações recentes. Conecte sua carteira para ver o histórico.',
      confidence: 0.8,
      suggestions: ['Ver todas as transações', 'Analisar padrões de gasto'],
      actions: [
        { label: 'Ver Transações', action: 'navigate', data: { url: '/transactions' } }
      ]
    };
  }
  
  // Resposta padrão
  return {
    content: 'Desculpe, estou em modo offline limitado. Posso ajudar com informações básicas sobre seu score, empréstimos e transações. O que você gostaria de saber?',
    confidence: 0.6,
    suggestions: [
      'Meu score atual',
      'Empréstimos disponíveis', 
      'Histórico de transações',
      'Como melhorar meu perfil'
    ]
  };
}

// Conselhos baseados no score
function getScoreAdvice(score: number): string {
  if (score >= 750) return 'Excelente! Continue mantendo esse bom histórico.';
  if (score >= 650) return 'Bom score! Com algumas melhorias pode chegar ao nível excelente.';
  if (score >= 550) return 'Score regular. Foque em aumentar seu saldo médio e fazer mais transações.';
  return 'Score baixo. Recomendo começar com transações pequenas e manter saldo positivo.';
}

// Transcrição de áudio (implementação básica)
async function transcribeAudio(audioBlob: Blob): Promise<string | null> {
  // Por enquanto, retorna uma mensagem indicando que a transcrição não está implementada
  // Em produção, isso seria enviado para um serviço de transcrição como Google Speech-to-Text
  console.log('Áudio capturado:', audioBlob.size, 'bytes');
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('Transcrição de voz não implementada ainda. Use texto.');
    }, 1000);
  });
}
