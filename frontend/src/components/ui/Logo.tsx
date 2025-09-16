'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/routing';
import { cn } from '@/lib/utils';

interface LogoProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'full' | 'icon' | 'text';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  animated?: boolean;
  href?: string;
  showText?: boolean;
}

const sizeMap = {
  xs: { icon: 'w-4 h-4', text: 'text-xs' },
  sm: { icon: 'w-5 h-5', text: 'text-sm' },
  md: { icon: 'w-6 h-6', text: 'text-base' },
  lg: { icon: 'w-8 h-8', text: 'text-lg' },
  xl: { icon: 'w-10 h-10', text: 'text-xl' },
  '2xl': { icon: 'w-12 h-12', text: 'text-2xl' },
};

const LogoIcon = forwardRef<
  HTMLDivElement,
  { size: string; animated?: boolean; className?: string }
>(({ size, animated = false, className }, ref) => {
  const MotionDiv = animated ? motion.div : 'div';
  const motionProps = animated
    ? {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
        transition: { type: 'spring', stiffness: 400, damping: 10 },
      }
    : {};

  return (
    <MotionDiv
      ref={ref}
      className={cn('relative flex-shrink-0', size, className)}
      {...(animated ? motionProps : {})}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Background Circle with Gradient */}
        <defs>
          <linearGradient
            id="stellar-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Main Circle */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="url(#stellar-gradient)"
          filter="url(#glow)"
          className="drop-shadow-lg"
        />
        
        {/* Orbital Ring */}
        {animated && (
          <motion.circle
            cx="50"
            cy="50"
            r="35"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1"
            fill="none"
            strokeDasharray="3 3"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        )}
        
        {/* Central Star */}
        <motion.g
          animate={animated ? { rotate: 360 } : {}}
          transition={animated ? { duration: 8, repeat: Infinity, ease: "linear" } : {}}
          style={{ transformOrigin: "50px 50px" }}
        >
          <path
            d="M50 20L55 35L70 35L58 45L63 60L50 50L37 60L42 45L30 35L45 35L50 20Z"
            fill="white"
            className="drop-shadow-sm"
          />
        </motion.g>
        
        {/* Orbital Points */}
        {animated && (
          <>
            <motion.circle
              cx="20"
              cy="50"
              r="2"
              fill="rgba(255, 255, 255, 0.8)"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.circle
              cx="80"
              cy="50"
              r="2"
              fill="rgba(255, 255, 255, 0.6)"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />
            <motion.circle
              cx="50"
              cy="15"
              r="1.5"
              fill="rgba(255, 255, 255, 0.7)"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.9, 0.3],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
            />
            <motion.circle
              cx="50"
              cy="85"
              r="1.5"
              fill="rgba(255, 255, 255, 0.5)"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.2, 0.7, 0.2],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            />
          </>
        )}
      </svg>
    </MotionDiv>
  );
});

LogoIcon.displayName = 'LogoIcon';

const LogoText = forwardRef<
  HTMLSpanElement,
  { size: string; className?: string }
>(({ size, className }, ref) => (
  <span
    ref={ref}
    className={cn('font-bold', size, className)}
  >
    <span className="text-gray-700 dark:text-gray-300">Stellar</span>
    <span className="text-primary-600 dark:text-primary-400">Credit</span>
  </span>
));

LogoText.displayName = 'LogoText';

export const Logo = forwardRef<HTMLDivElement, LogoProps>(
  (
    {
      variant = 'full',
      size = 'md',
      animated = false,
      href,
      showText = true,
      className,
      ...props
    },
    ref
  ) => {
    const sizes = sizeMap[size];
    
    const content = (
      <div
        ref={ref}
        className={cn('flex items-center space-x-2', className)}
        {...props}
      >
        {(variant === 'full' || variant === 'icon') && (
          <LogoIcon
            size={sizes.icon}
            animated={animated}
          />
        )}
        
        {(variant === 'full' || variant === 'text') && showText && (
          <LogoText
            size={sizes.text}
          />
        )}
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="inline-block">
          {content}
        </Link>
      );
    }

    return content;
  }
);

Logo.displayName = 'Logo';

// Loading Logo variant
export const LoadingLogo = forwardRef<
  HTMLDivElement,
  { size?: LogoProps['size']; className?: string }
>(({ size = 'md', className }, ref) => {
  const sizes = sizeMap[size];
  
  return (
    <motion.div
      ref={ref}
      className={cn('flex items-center justify-center', sizes.icon, className)}
      animate={{ rotate: 360 }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <LogoIcon size={sizes.icon} />
    </motion.div>
  );
});

LoadingLogo.displayName = 'LoadingLogo';
