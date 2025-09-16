import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWalletStore } from '@/stores/walletStore';
import { useCreditStore } from '@/stores/creditStore';

export interface RealtimeTransaction {
  id: string;
  hash: string;
  type: string;
  amount: number;
  asset_code?: string;
  from: string;
  to: string;
  timestamp: string;
  successful: boolean;
}

export interface RealtimeScoreUpdate {
  address: string;
  score: number;
  risk_level: string;
  metrics: any;
  timestamp: string;
}

export interface RealtimeMarketData {
  xlm_price: number;
  volume_24h: number;
  change_24h: number;
  timestamp: string;
}

export const useRealTime = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  const { publicKey, isConnected: walletConnected } = useWalletStore();
  const { setScore, setStreaming, setStreamError } = useCreditStore();

  // Connection management
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    // Completely disable WebSocket in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔌 WebSocket disabled in development mode');
      setIsConnected(false);
      setConnectionError('WebSocket desabilitado em desenvolvimento');
      return;
    }

    // Only attempt connection if explicitly configured
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    
    if (!wsUrl) {
      console.log('🔌 WebSocket server not configured, real-time features disabled');
      setIsConnected(false);
      setConnectionError('WebSocket server não configurado');
      return;
    }
    
    console.log('🔌 Attempting WebSocket connection to:', wsUrl);
    
    socketRef.current = io(wsUrl, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 3,
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setConnectionError(null);
      setLastActivity(Date.now());
      setStreaming(true);

      // Subscribe to wallet-specific events if wallet is connected
      if (walletConnected && publicKey) {
        socket.emit('subscribe:wallet', { address: publicKey });
        socket.emit('subscribe:score', { address: publicKey });
      }

      // Subscribe to global market data
      socket.emit('subscribe:market');
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      setStreaming(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message);
      setStreaming(false);
    });

    // Score updates
    socket.on('score:update', (data: RealtimeScoreUpdate) => {
      if (data.address === publicKey) {
        setScore({
          score: data.score,
          risk_level: data.risk_level as any,
          metrics: data.metrics,
          recommendations: [],
          analysis_timestamp: data.timestamp,
        });
        setLastActivity(Date.now());
      }
    });

    // Transaction events
    socket.on('transaction:new', (data: RealtimeTransaction) => {
      if (data.from === publicKey || data.to === publicKey) {
        console.log('New transaction:', data);
        setLastActivity(Date.now());
        
        // You can emit custom events or update stores here
        window.dispatchEvent(new CustomEvent('stellar:transaction', { detail: data }));
      }
    });

    // Market data updates
    socket.on('market:update', (data: RealtimeMarketData) => {
      console.log('Market update:', data);
      setLastActivity(Date.now());
      
      // Emit custom event for market data
      window.dispatchEvent(new CustomEvent('stellar:market', { detail: data }));
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      setStreamError(error.message || 'WebSocket error');
    });

    // Heartbeat to keep connection alive
    socket.on('ping', () => {
      socket.emit('pong');
      setLastActivity(Date.now());
    });

  }, [publicKey, walletConnected, setScore, setStreaming, setStreamError]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setStreaming(false);
    setConnectionError(null);
  }, [setStreaming]);

  // Subscribe to specific events
  const subscribeToWallet = useCallback((address: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe:wallet', { address });
      socketRef.current.emit('subscribe:score', { address });
    }
  }, []);

  const unsubscribeFromWallet = useCallback((address: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe:wallet', { address });
      socketRef.current.emit('unsubscribe:score', { address });
    }
  }, []);

  // Request immediate score update
  const requestScoreUpdate = useCallback((address: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('score:request', { address });
    }
  }, []);

  // Send custom events
  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  // Auto-connect when wallet connects (disabled in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      disconnect();
      return;
    }
    
    if (walletConnected && publicKey && process.env.NEXT_PUBLIC_WS_URL) {
      connect();
      return () => {
        if (publicKey) {
          unsubscribeFromWallet(publicKey);
        }
      };
    } else {
      disconnect();
    }
  }, [walletConnected, publicKey, connect, disconnect, unsubscribeFromWallet]);

  // Subscribe to wallet events when wallet changes (disabled in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;
    
    if (isConnected && walletConnected && publicKey && process.env.NEXT_PUBLIC_WS_URL) {
      subscribeToWallet(publicKey);
    }
  }, [isConnected, walletConnected, publicKey, subscribeToWallet]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Connection health monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      
      // If no activity for 30 seconds, check connection
      if (timeSinceLastActivity > 30000 && isConnected) {
        if (socketRef.current?.connected) {
          socketRef.current.emit('ping');
        } else {
          setIsConnected(false);
          setStreaming(false);
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [lastActivity, isConnected, setStreaming]);

  return {
    // Connection state
    isConnected,
    connectionError,
    lastActivity: new Date(lastActivity),

    // Actions
    connect,
    disconnect,
    subscribeToWallet,
    unsubscribeFromWallet,
    requestScoreUpdate,
    emit,

    // Utilities
    isHealthy: Date.now() - lastActivity < 60000, // Healthy if activity within 1 minute
  };
};

// Hook for Server-Sent Events (alternative to WebSocket)
export const useSSE = (endpoint: string, options?: { enabled?: boolean }) => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) return;

    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    
    if (!baseUrl) {
      console.log('🔌 Backend server not configured, SSE disabled');
      setError('Backend server não configurado');
      return;
    }
    
    const url = `${baseUrl}${endpoint}`;

    eventSourceRef.current = new EventSource(url);

    eventSourceRef.current.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSourceRef.current.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setData(parsedData);
      } catch (err) {
        setData(event.data);
      }
    };

    eventSourceRef.current.onerror = (event) => {
      setError('SSE connection error');
      setIsConnected(false);
    };
  }, [endpoint]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (options?.enabled !== false) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, options?.enabled]);

  return {
    data,
    error,
    isConnected,
    connect,
    disconnect,
  };
};
