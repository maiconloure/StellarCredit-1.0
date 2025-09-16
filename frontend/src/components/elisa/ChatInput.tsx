'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { PaperAirplaneIcon, PhotoIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface ChatInputProps {
  onSendMessage: (message: string, type?: 'text' | 'voice') => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = 'Digite sua mensagem...',
  maxLength = 1000
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Limitar caracteres
    if (value.length <= maxLength) {
      setMessage(value);
    }

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const remainingChars = maxLength - message.length;
  const isNearLimit = remainingChars < 50;

  return (
    <div className="space-y-2">
      {/* Input Container */}
      <div className="flex items-end space-x-2">
        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`
              w-full px-4 py-3 pr-12 text-sm
              border border-gray-300 dark:border-gray-600
              rounded-lg resize-none
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400
              focus:ring-2 focus:ring-purple-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              max-h-30 overflow-y-auto
            `}
            style={{ minHeight: '48px' }}
          />
          
          {/* Character Counter */}
          {isNearLimit && (
            <div className={`
              absolute bottom-1 right-12 text-xs
              ${remainingChars < 10 ? 'text-red-500' : 'text-gray-400'}
            `}>
              {remainingChars}
            </div>
          )}
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSubmit}
          disabled={disabled || !message.trim()}
          className="h-12 w-12 p-0 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            disabled={disabled}
            className="flex items-center space-x-1 hover:text-purple-500 disabled:opacity-50"
            onClick={() => {
              // Implementar upload de imagem no futuro
              console.log('Upload de imagem não implementado ainda');
            }}
          >
            <PhotoIcon className="w-4 h-4" />
            <span>Imagem</span>
          </button>
          
          <button
            type="button"
            disabled={disabled}
            className="flex items-center space-x-1 hover:text-purple-500 disabled:opacity-50"
            onClick={() => {
              // Implementar upload de documento no futuro
              console.log('Upload de documento não implementado ainda');
            }}
          >
            <DocumentIcon className="w-4 h-4" />
            <span>Documento</span>
          </button>
        </div>

        <div className="text-gray-400">
          Pressione Enter para enviar, Shift+Enter para quebrar linha
        </div>
      </div>

      {/* Typing Indicator */}
      {disabled && (
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
          <span className="text-sm">Elisa está digitando...</span>
        </div>
      )}
    </div>
  );
}
