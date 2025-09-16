'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { calculateScorePercentage, getScoreColor, getScoreGradient } from '@/lib/utils';

interface ScoreIndicatorProps {
  score: number;
  previousScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

export function ScoreIndicator({ 
  score, 
  previousScore, 
  size = 'md', 
  showLabel = true,
  animated = true 
}: ScoreIndicatorProps) {
  const percentage = calculateScorePercentage(score);
  const scoreColor = getScoreColor(score);
  const scoreGradient = getScoreGradient(score);
  
  // Calculate trend
  const trend = previousScore ? score - previousScore : 0;
  const trendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-400';

  // Size configurations
  const sizeConfig = {
    sm: { 
      size: 48, 
      strokeWidth: 4, 
      fontSize: 'text-sm', 
      iconSize: 'h-3 w-3',
      radius: 20
    },
    md: { 
      size: 80, 
      strokeWidth: 6, 
      fontSize: 'text-lg', 
      iconSize: 'h-4 w-4',
      radius: 34
    },
    lg: { 
      size: 120, 
      strokeWidth: 8, 
      fontSize: 'text-2xl', 
      iconSize: 'h-5 w-5',
      radius: 52
    },
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Circular progress */}
      <div className="relative" style={{ width: config.size, height: config.size }}>
        <svg
          className="transform -rotate-90"
          width={config.size}
          height={config.size}
        >
          {/* Background circle */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={config.radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={config.radius}
            stroke="url(#scoreGradient)"
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={animated ? strokeDasharray : strokeDashoffset}
            animate={animated ? { strokeDashoffset } : {}}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="drop-shadow-sm"
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className={scoreGradient.split(' ')[0].replace('from-', 'text-')} />
              <stop offset="100%" className={scoreGradient.split(' ')[1].replace('to-', 'text-')} />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className={`font-bold ${config.fontSize} ${scoreColor}`}
            initial={animated ? { opacity: 0, scale: 0.5 } : {}}
            animate={animated ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {Math.round(score)}
          </motion.span>
        </div>
      </div>

      {/* Score label and trend */}
      {showLabel && (
        <div className="text-center space-y-1">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Credit Score
          </div>
          
          {previousScore && (
            <div className={`flex items-center justify-center space-x-1 text-xs ${trendColor}`}>
              {React.createElement(trendIcon, { className: config.iconSize })}
              <span>
                {trend > 0 ? '+' : ''}{Math.round(trend)}
              </span>
            </div>
          )}
          
          {/* Score range indicator */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {score >= 750 ? 'Excellent' : 
             score >= 600 ? 'Good' : 
             score >= 400 ? 'Fair' : 'Poor'}
          </div>
        </div>
      )}
    </div>
  );
}
