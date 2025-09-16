'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { 
  SparklesIcon, 
  ChatBubbleLeftRightIcon, 
  MicrophoneIcon,
  ChartBarIcon,
  CreditCardIcon,
  BanknotesIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { ElisaChat } from '@/components/elisa/ElisaChat';
import { WalletGuard } from '@/components/auth/WalletGuard';
import { useWalletStore } from '@/stores/walletStore';
import { useCreditStore } from '@/stores/creditStore';

function ElisaContent() {
  const t = useTranslations();
  const [showFullscreenChat, setShowFullscreenChat] = useState(false);
  const { publicKey } = useWalletStore();
  const { currentScore } = useCreditStore();

  const features = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Conversação Natural',
      description: 'Converse com Elisa usando linguagem natural sobre suas finanças'
    },
    {
      icon: ChartBarIcon,
      title: 'Análise de Score',
      description: 'Entenda seu score de crédito e como melhorá-lo'
    },
    {
      icon: CreditCardIcon,
      title: 'Recomendações de Empréstimos',
      description: 'Encontre as melhores opções de empréstimo para seu perfil'
    },
    {
      icon: ArrowsRightLeftIcon,
      title: 'Análise de Transações',
      description: 'Compreenda seus padrões de gastos e investimentos'
    },
    {
      icon: MicrophoneIcon,
      title: 'Comando por Voz',
      description: 'Fale diretamente com Elisa usando comandos de voz'
    },
    {
      icon: BanknotesIcon,
      title: 'Consultoria Financeira',
      description: 'Receba conselhos personalizados para suas finanças'
    }
  ];

  const quickActions = [
    {
      label: 'Analisar meu score',
      message: 'Analise meu score de crédito atual e me dê dicas de como melhorar',
      icon: ChartBarIcon
    },
    {
      label: 'Encontrar empréstimos',
      message: 'Quais empréstimos estão disponíveis para meu perfil atual?',
      icon: CreditCardIcon
    },
    {
      label: 'Revisar transações',
      message: 'Analise minhas transações recentes e identifique padrões',
      icon: ArrowsRightLeftIcon
    },
    {
      label: 'Planejar investimentos',
      message: 'Como posso otimizar meus investimentos para melhorar meu score?',
      icon: BanknotesIcon
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6">
            <SparklesIcon className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Conheça a <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">ElisaOS</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Sua assistente de IA especializada em finanças descentralizadas. 
            Converse naturalmente sobre seu score, empréstimos e investimentos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setShowFullscreenChat(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
              Conversar com Elisa
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                document.getElementById('chat-preview')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Ver Demonstração
            </Button>
          </div>
        </motion.div>

        {/* Status do Usuário */}
        {publicKey && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-12 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Seu Perfil Financeiro
              </h2>
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Carteira Conectada</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {currentScore?.score || '---'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Score Atual</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {publicKey.substring(0, 6)}...
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Carteira</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ✓
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pronto para IA</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Ações Rápidas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Ações Rápidas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Implementar ação rápida
                  setShowFullscreenChat(true);
                  // Enviar mensagem automaticamente
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('elisa:quick-message', { 
                      detail: { message: action.message } 
                    }));
                  }, 500);
                }}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all text-left"
              >
                <action.icon className="w-8 h-8 text-purple-500 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {action.label}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {action.message}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recursos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Recursos da ElisaOS
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
              >
                <feature.icon className="w-10 h-10 text-purple-500 mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Chat Preview */}
        <motion.div
          id="chat-preview"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Demonstração da ElisaOS
          </h2>
          
          <div className="max-w-2xl mx-auto">
            <ElisaChat className="h-96" />
          </div>
        </motion.div>

        {/* CTA Final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-8 text-white"
        >
          <h2 className="text-3xl font-bold mb-4">
            Pronto para revolucionar suas finanças?
          </h2>
          <p className="text-xl mb-6 opacity-90">
            Converse com Elisa agora e descubra insights únicos sobre seu perfil financeiro.
          </p>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowFullscreenChat(true)}
            className="bg-white text-purple-600 hover:bg-gray-100 border-white"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            Começar Conversa
          </Button>
        </motion.div>
      </div>

      {/* Fullscreen Chat */}
      {showFullscreenChat && (
        <ElisaChat
          fullscreen
          onClose={() => setShowFullscreenChat(false)}
        />
      )}
    </div>
  );
}

export default function ElisaPage() {
  return (
    <WalletGuard>
      <ElisaContent />
    </WalletGuard>
  );
}
