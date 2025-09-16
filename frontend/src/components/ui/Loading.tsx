'use client';

import { motion } from 'framer-motion';
import { LoadingLogo } from './Logo';
import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

export function Loading({ 
  size = 'md', 
  text = 'Carregando...', 
  className 
}: LoadingProps) {
  const sizeMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-4',
      className
    )}>
      <LoadingLogo size={size} />
      
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={cn(
            'text-gray-600 dark:text-gray-400 font-medium',
            sizeMap[size]
          )}
        >
          {text}
        </motion.p>
      )}
      
      {/* Pulse dots */}
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-primary-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Fullscreen loading overlay
export function LoadingOverlay({ 
  text = 'Carregando...', 
  className 
}: Omit<LoadingProps, 'size'>) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'fixed inset-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm',
        'flex items-center justify-center',
        className
      )}
    >
      <Loading size="lg" text={text} />
    </motion.div>
  );
}

// Spinner only (no text)
export function Spinner({ 
  size = 'md', 
  className 
}: { 
  size?: LoadingProps['size']; 
  className?: string 
}) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <LoadingLogo size={size} />
    </div>
  );
}
