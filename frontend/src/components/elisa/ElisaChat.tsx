'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperAirplaneIcon, 
  MicrophoneIcon, 
  StopIcon,
  SparklesIcon,
  UserIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { useElisa } from '@/hooks/useElisa';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'voice' | 'system';
  metadata?: {
    confidence?: number;
    suggestions?: string[];
    actions?: Array<{
      label: string;
      action: string;
      data?: any;
    }>;
  };
}

interface ElisaChatProps {
  className?: string;
  fullscreen?: boolean;
  onClose?: () => void;
}

export function ElisaChat({ className = '', fullscreen = false, onClose }: ElisaChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: 'Olá! Eu sou a Elisa, sua assistente de IA para o Stellar Credit. Como posso ajudá-lo hoje?',
      role: 'assistant',
      timestamp: new Date(),
      type: 'system',
      metadata: {
        confidence: 1.0,
        suggestions: [
          'Como melhorar meu score?',
          'Explicar meu histórico',
          'Encontrar empréstimos',
          'Analisar transações'
        ]
      }
    }
  ]);

  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    sendMessage,
    isLoading,
    error,
    startVoiceRecording,
    stopVoiceRecording,
    isVoiceSupported
  } = useElisa();

  // Auto scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string, type: 'text' | 'voice' = 'text') => {
    if (!content.trim()) return;

    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
      type
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Enviar para a ElisaOS
      const response = await sendMessage(content, {
        context: {
          currentPage: window.location.pathname,
          userWallet: localStorage.getItem('stellar-credit-wallet'),
          timestamp: new Date().toISOString()
        }
      });

      // Adicionar resposta da Elisa
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text',
        metadata: {
          confidence: response.confidence,
          suggestions: response.suggestions,
          actions: response.actions
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem para Elisa:', error);
      
      // Mensagem de erro
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Desculpe, houve um erro ao processar sua mensagem. Tente novamente.',
        role: 'assistant',
        timestamp: new Date(),
        type: 'system'
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      setIsRecording(false);
      const transcript = await stopVoiceRecording();
      if (transcript) {
        handleSendMessage(transcript, 'voice');
      }
    } else {
      setIsRecording(true);
      startVoiceRecording();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleActionClick = (action: any) => {
    // Implementar ações específicas da Elisa
    console.log('Ação clicada:', action);
    
    switch (action.action) {
      case 'navigate':
        window.location.href = action.data.url;
        break;
      case 'refresh_score':
        // Trigger refresh do score
        window.dispatchEvent(new CustomEvent('elisa:refresh-score'));
        break;
      case 'show_transactions':
        window.location.href = '/transactions';
        break;
      default:
        console.log('Ação não implementada:', action.action);
    }
  };

  const containerClasses = fullscreen
    ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900'
    : `bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`;

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">ElisaOS</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLoading ? 'Digitando...' : 'Online'}
            </p>
          </div>
        </div>
        
        {fullscreen && onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
        <AnimatePresence>
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onSuggestionClick={handleSuggestionClick}
              onActionClick={handleActionClick}
            />
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 text-gray-500"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <Loading size="sm" />
            <span className="text-sm">Elisa está pensando...</span>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder="Digite sua mensagem para Elisa..."
        />
        
        {/* Voice Button */}
        {isVoiceSupported && (
          <div className="mt-2 flex justify-center">
            <Button
              variant={isRecording ? 'destructive' : 'outline'}
              size="sm"
              onClick={handleVoiceToggle}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isRecording ? (
                <>
                  <StopIcon className="w-4 h-4" />
                  <span>Parar Gravação</span>
                </>
              ) : (
                <>
                  <MicrophoneIcon className="w-4 h-4" />
                  <span>Falar com Elisa</span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
