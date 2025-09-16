'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ElisaChat } from './ElisaChat';

interface ElisaFloatingButtonProps {
  className?: string;
}

export function ElisaFloatingButton({ className = '' }: ElisaFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className={`
              fixed bottom-6 right-6 z-40
              w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500
              rounded-full shadow-lg hover:shadow-xl
              flex items-center justify-center
              text-white transition-all duration-300
              ${className}
            `}
          >
            <SparklesIcon className="w-8 h-8" />
            
            {/* Pulse animation */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-ping opacity-20" />
            
            {/* Tooltip */}
            <div className="absolute right-full mr-3 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Conversar com ElisaOS
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0, x: 100, y: 100 }}
            animate={{ 
              scale: isMinimized ? 0.2 : 1, 
              opacity: 1, 
              x: 0, 
              y: 0,
              transformOrigin: 'bottom right'
            }}
            exit={{ scale: 0, opacity: 0, x: 100, y: 100 }}
            className={`
              fixed z-50 transition-all duration-300
              ${isMinimized 
                ? 'bottom-6 right-6 w-16 h-16' 
                : 'bottom-6 right-6 w-96 h-[500px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)]'
              }
            `}
          >
            {isMinimized ? (
              // Minimized state
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMinimized(false)}
                className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center text-white"
              >
                <SparklesIcon className="w-8 h-8" />
              </motion.button>
            ) : (
              // Full chat
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                {/* Header with controls */}
                <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <SparklesIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-white">ElisaOS</div>
                      <div className="text-xs text-gray-500">Online</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {/* Minimize button */}
                    <button
                      onClick={() => setIsMinimized(true)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Minimizar"
                    >
                      <div className="w-3 h-3 border-b-2 border-gray-400" />
                    </button>
                    
                    {/* Close button */}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Fechar"
                    >
                      <XMarkIcon className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                
                {/* Chat content */}
                <div className="flex-1 overflow-hidden">
                  <ElisaChat className="h-full border-none shadow-none" />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}
