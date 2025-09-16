'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useRealTime } from '@/hooks/useRealTime';

interface RealtimeContextType {
  isConnected: boolean;
  connectionError: string | null;
  lastActivity: Date;
  connect: () => void;
  disconnect: () => void;
  subscribeToWallet: (address: string) => void;
  unsubscribeFromWallet: (address: string) => void;
  requestScoreUpdate: (address: string) => void;
  emit: (event: string, data: any) => void;
  isHealthy: boolean;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const realtime = useRealTime();

  return (
    <RealtimeContext.Provider value={realtime}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeContext() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
}
