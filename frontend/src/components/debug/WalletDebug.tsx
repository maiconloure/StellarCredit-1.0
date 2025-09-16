'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useWallet } from '@/hooks/useWallet';
import { useWalletStore } from '@/stores/walletStore';
import { WalletType } from '@/stores/walletStore';

export function WalletDebug() {
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const wallet = useWallet();
  const walletStore = useWalletStore();
  
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testConnection = async (walletType: WalletType) => {
    addLog(`🔄 Testing connection to ${walletType}`);
    
    try {
      await wallet.connect(walletType);
      addLog(`✅ Connection successful to ${walletType}`);
      addLog(`📊 Store state: connected=${walletStore.isConnected}, publicKey=${walletStore.publicKey?.substring(0, 20)}...`);
    } catch (error: any) {
      addLog(`❌ Connection failed: ${error.message}`);
    }
  };

  const clearStorage = () => {
    localStorage.removeItem('stellar-credit-wallet');
    addLog('🧹 Cleared localStorage');
  };

  const checkState = () => {
    addLog('🔍 Current state:');
    addLog(`  - isConnected: ${walletStore.isConnected}`);
    addLog(`  - isConnecting: ${walletStore.isConnecting}`);
    addLog(`  - walletType: ${walletStore.walletType}`);
    addLog(`  - publicKey: ${walletStore.publicKey?.substring(0, 20)}...`);
    addLog(`  - network: ${walletStore.network}`);
    addLog(`  - error: ${walletStore.error}`);
    addLog(`  - availableWallets: ${wallet.availableWallets.join(', ')}`);
    
    const stored = localStorage.getItem('stellar-credit-wallet');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        addLog(`  - localStorage: ${JSON.stringify(parsed.state, null, 2)}`);
      } catch (e) {
        addLog(`  - localStorage: invalid JSON`);
      }
    } else {
      addLog(`  - localStorage: empty`);
    }
  };

  const disconnect = () => {
    walletStore.disconnect();
    addLog('🔌 Disconnected wallet');
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-w-md max-h-96 overflow-hidden shadow-lg z-50">
      <h3 className="text-sm font-bold mb-3">Wallet Debug</h3>
      
      <div className="space-y-2 mb-3">
        <div className="flex space-x-2">
          <Button size="sm" onClick={() => testConnection('freighter')}>
            Test Freighter
          </Button>
          <Button size="sm" onClick={() => testConnection('albedo')}>
            Test Albedo
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={checkState}>
            Check State
          </Button>
          <Button size="sm" variant="outline" onClick={clearStorage}>
            Clear Storage
          </Button>
          <Button size="sm" variant="destructive" onClick={disconnect}>
            Disconnect
          </Button>
        </div>
      </div>
      
      <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-xs font-mono max-h-48 overflow-y-auto">
        {debugLog.length === 0 ? (
          <div className="text-gray-500">No logs yet...</div>
        ) : (
          debugLog.map((log, index) => (
            <div key={index} className="mb-1">{log}</div>
          ))
        )}
      </div>
      
      <Button 
        size="sm" 
        variant="ghost" 
        className="w-full mt-2" 
        onClick={() => setDebugLog([])}
      >
        Clear Logs
      </Button>
    </div>
  );
}
