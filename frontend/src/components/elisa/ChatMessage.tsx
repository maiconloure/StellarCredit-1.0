'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  UserIcon, 
  SparklesIcon, 
  MicrophoneIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Message } from './ElisaChat';

interface ChatMessageProps {
  message: Message;
  onSuggestionClick?: (suggestion: string) => void;
  onActionClick?: (action: any) => void;
}

export function ChatMessage({ message, onSuggestionClick, onActionClick }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.type === 'system';
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageIcon = () => {
    if (isUser) return <UserIcon className="w-5 h-5" />;
    if (isSystem) return <ExclamationTriangleIcon className="w-5 h-5" />;
    return <SparklesIcon className="w-5 h-5" />;
  };

  const getMessageBg = () => {
    if (isUser) return 'bg-blue-500 text-white';
    if (isSystem) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white';
  };

  const getAvatarBg = () => {
    if (isUser) return 'bg-blue-500';
    if (isSystem) return 'bg-yellow-500';
    return 'bg-gradient-to-r from-purple-500 to-pink-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} space-x-3`}
    >
      {/* Avatar (só para assistant/system) */}
      {!isUser && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getAvatarBg()}`}>
          {getMessageIcon()}
        </div>
      )}

      <div className={`max-w-xs lg:max-w-md ${isUser ? 'order-1' : ''}`}>
        {/* Message Bubble */}
        <div className={`rounded-lg px-4 py-2 ${getMessageBg()}`}>
          <div className="text-sm">
            {message.content}
          </div>
          
          {/* Voice indicator */}
          {message.type === 'voice' && (
            <div className="mt-1 flex items-center space-x-1 text-xs opacity-70">
              <MicrophoneIcon className="w-3 h-3" />
              <span>Mensagem de voz</span>
            </div>
          )}

          {/* Confidence indicator for assistant */}
          {!isUser && message.metadata?.confidence && (
            <div className="mt-1 flex items-center space-x-1 text-xs opacity-70">
              <CheckCircleIcon className="w-3 h-3" />
              <span>Confiança: {Math.round(message.metadata.confidence * 100)}%</span>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
        </div>

        {/* Suggestions (apenas para assistant) */}
        {!isUser && message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 space-y-2"
          >
            <div className="text-xs text-gray-500 font-medium">Sugestões:</div>
            <div className="flex flex-wrap gap-2">
              {message.metadata.suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onSuggestionClick?.(suggestion)}
                  className="text-xs h-8"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions (apenas para assistant) */}
        {!isUser && message.metadata?.actions && message.metadata.actions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 space-y-2"
          >
            <div className="text-xs text-gray-500 font-medium">Ações disponíveis:</div>
            <div className="flex flex-wrap gap-2">
              {message.metadata.actions.map((action, index) => (
                <Button
                  key={index}
                  variant="default"
                  size="sm"
                  onClick={() => onActionClick?.(action)}
                  className="text-xs h-8 bg-purple-500 hover:bg-purple-600"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Avatar (só para user) */}
      {isUser && (
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
          <UserIcon className="w-5 h-5" />
        </div>
      )}
    </motion.div>
  );
}
