'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from './ThemeProvider';
import { WalletProvider } from './WalletProvider';
import { WalletDataProvider } from './WalletDataProvider';
import { RealtimeProvider } from './RealtimeProvider';
import { NotificationProvider } from './NotificationProvider';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <WalletProvider>
          <WalletDataProvider>
            <RealtimeProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </RealtimeProvider>
          </WalletDataProvider>
        </WalletProvider>
      </ThemeProvider>
      {/* Development tools disabled for now */}
    </QueryClientProvider>
  );
}
