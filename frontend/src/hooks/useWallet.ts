import { useCallback, useEffect, useState } from 'react';
import { useWalletStore, WalletType, StellarNetwork } from '@/stores/walletStore';

// Wallet connector interfaces
interface FreighterAPI {
  isConnected(): Promise<boolean>;
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string, opts?: { network?: string }): Promise<string>;
  getNetwork(): Promise<string>;
  isAllowed(): Promise<boolean>;
  setAllowed(): Promise<void>;
}

interface AlbedoAPI {
  publicKey(opts?: { require_existing?: boolean }): Promise<{ pubkey: string }>;
  tx(opts: { xdr: string; network?: string }): Promise<{ signed_envelope_xdr: string }>;
  trust(opts: { asset_code: string; asset_issuer: string }): Promise<any>;
}

interface RabetAPI {
  connect(): Promise<{ publicKey: string }>;
  sign(xdr: string, network?: string): Promise<{ signedXDR: string }>;
  isConnected(): Promise<boolean>;
}

declare global {
  interface Window {
    freighter?: FreighterAPI;
    albedo?: AlbedoAPI;
    rabet?: RabetAPI;
    xBullWalletConnect?: any;
  }
}

export const useWallet = () => {
  const {
    isConnected,
    isConnecting,
    walletType,
    publicKey,
    network,
    error,
    setConnecting,
    setConnected,
    setError,
    disconnect,
    setNetwork,
  } = useWalletStore();

  const [availableWallets, setAvailableWallets] = useState<WalletType[]>([]);



  // Check available wallets with improved detection
  useEffect(() => {
    const checkWallets = async () => {
      const available: WalletType[] = [];
      
      if (typeof window !== 'undefined') {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Verificando carteiras disponíveis...');
          console.log('🌍 Window object keys:', Object.keys(window).filter(key => 
            key.toLowerCase().includes('stellar') || 
            key.toLowerCase().includes('freighter') ||
            key.toLowerCase().includes('rabet') ||
            key.toLowerCase().includes('xbull') ||
            key.toLowerCase().includes('lobstr') ||
            key.toLowerCase().includes('wallet')
          ));
        }
        
        // Wait a bit longer to ensure extensions are loaded
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Freighter - detecção mais robusta com múltiplas estratégias
        const checkFreighter = async () => {
          const freighterPossibleLocations = [
            () => window.freighter,
            () => (window as any).freighterApi,
            () => (window as any).stellar?.freighter,
            () => (window as any).freighter,
            () => (window as any).FreighterAPI,
            () => (window as any).Freighter
          ];
          
          for (const getFreighter of freighterPossibleLocations) {
            try {
              const freighterAPI = getFreighter();
              if (freighterAPI && typeof freighterAPI === 'object') {
                // Verificar se tem as funções essenciais
                const hasEssentialMethods = 
                  typeof freighterAPI.isAllowed === 'function' &&
                  typeof freighterAPI.getPublicKey === 'function' &&
                  typeof freighterAPI.signTransaction === 'function';
                
                if (hasEssentialMethods) {
                  // Garantir que window.freighter aponte para a API correta
                  if (!window.freighter || window.freighter !== freighterAPI) {
                    (window as any).freighter = freighterAPI;
                  }
                  
                  available.push('freighter');
                  console.log('✅ Freighter detectado e funcionando via', getFreighter.toString());
                  return true;
                }
              }
            } catch (error) {
              console.log('⚠️ Erro verificando Freighter:', error);
            }
          }
          
          // Verificação por eventos do DOM
          const freighterElements = document.querySelectorAll('[data-freighter], [id*="freighter"], [class*="freighter"]');
          if (freighterElements.length > 0) {
            console.log('🔍 Elementos Freighter encontrados no DOM, mas API não disponível');
          }
          
          return false;
        };
        
        await checkFreighter();
        
        // Rabet - detecção melhorada com múltiplas estratégias
        const checkRabet = async () => {
          const rabetPossibleLocations = [
            () => window.rabet,
            () => (window as any).rabetWallet,
            () => (window as any).stellar?.rabet,
            () => (window as any).rabet,
            () => (window as any).RabetAPI,
            () => (window as any).Rabet
          ];
          
          for (const getRabet of rabetPossibleLocations) {
            try {
              const rabetAPI = getRabet();
              if (rabetAPI && typeof rabetAPI === 'object') {
                // Verificar se tem as funções essenciais
                const hasEssentialMethods = 
                  typeof rabetAPI.connect === 'function' &&
                  (typeof rabetAPI.sign === 'function' || typeof rabetAPI.signTransaction === 'function');
                
                if (hasEssentialMethods) {
                  // Garantir que window.rabet aponte para a API correta
                  if (!window.rabet || window.rabet !== rabetAPI) {
                    (window as any).rabet = rabetAPI;
                  }
                  
                  available.push('rabet');
                  console.log('✅ Rabet detectado e funcionando via', getRabet.toString());
                  return true;
                }
              }
            } catch (error) {
              console.log('⚠️ Erro verificando Rabet:', error);
            }
          }
          
          return false;
        };
        
        await checkRabet();
        
        // xBull - detecção melhorada
        const checkXBull = () => {
          if (window.xBullWalletConnect || 
              (window as any).xBull || 
              (window as any).stellar?.xBull) {
          available.push('xbull');
            console.log('✅ xBull detectado');
            return true;
          }
          return false;
        };
        
        checkXBull();
        
        // LOBSTR - detecção melhorada
        const checkLobstr = () => {
          if ((window as any).lobstrWallet || 
              (window as any).lobstr ||
            (window as any).stellar?.lobstr) {
          available.push('lobstr');
            console.log('✅ LOBSTR detectado');
            return true;
        }
          return false;
        };
        
        checkLobstr();
        
        // Verificar se existe interface genérica Stellar
        if ((window as any).stellar) {
          const stellarWallets = Object.keys((window as any).stellar);
          console.log('🌟 Interface Stellar genérica encontrada:', stellarWallets);
          
          // Adicionar carteiras detectadas via interface Stellar
          stellarWallets.forEach(walletName => {
            const normalizedName = walletName.toLowerCase();
            if (normalizedName.includes('freighter') && !available.includes('freighter')) {
              available.push('freighter');
              console.log('✅ Freighter detectado via interface Stellar');
            }
            if (normalizedName.includes('rabet') && !available.includes('rabet')) {
              available.push('rabet');
              console.log('✅ Rabet detectado via interface Stellar');
            }
            if (normalizedName.includes('xbull') && !available.includes('xbull')) {
              available.push('xbull');
              console.log('✅ xBull detectado via interface Stellar');
            }
            if (normalizedName.includes('lobstr') && !available.includes('lobstr')) {
              available.push('lobstr');
              console.log('✅ LOBSTR detectado via interface Stellar');
            }
          });
        }
        
        // Albedo - sempre disponível (baseado na web)
        if (!available.includes('albedo')) {
          available.push('albedo');
          console.log('✅ Albedo disponível (baseado na web)');
        }
        
        // WalletConnect - verificar se está disponível
        if ((window as any).WalletConnect || (window as any).walletConnect) {
          if (!available.includes('walletconnect')) {
            available.push('walletconnect');
            console.log('✅ WalletConnect detectado');
          }
        }
        
        console.log('🔍 Total de carteiras detectadas:', available.length, available);
        
        // Debug detalhado das propriedades do window
        const allWindowProps = Object.getOwnPropertyNames(window);
        const walletProperties = allWindowProps.filter(key => {
          const lowerKey = key.toLowerCase();
          return lowerKey.includes('stellar') || 
                 lowerKey.includes('freighter') ||
                 lowerKey.includes('albedo') ||
                 lowerKey.includes('rabet') ||
                 lowerKey.includes('xbull') ||
                 lowerKey.includes('lobstr') ||
                 lowerKey.includes('wallet');
        });
        
        if (walletProperties.length > 0) {
          console.log('🔍 Propriedades relacionadas a carteiras encontradas:', walletProperties);
          
          // Log detalhado para debug
          walletProperties.forEach(prop => {
            const value = (window as any)[prop];
            if (value && typeof value === 'object') {
              console.log(`  ${prop}:`, Object.keys(value));
            } else {
              console.log(`  ${prop}:`, typeof value);
            }
          });
        }
        
        // Se nenhuma carteira foi detectada, pelo menos garantir Albedo
        if (available.length === 0) {
          console.log('⚠️ Nenhuma carteira detectada, adicionando Albedo como fallback');
          available.push('albedo');
        }
      }
      
      // Só atualizar se a lista mudou
      setAvailableWallets(prevWallets => {
        const hasChanged = prevWallets.length !== available.length || 
                          !prevWallets.every(wallet => available.includes(wallet));
        
        if (hasChanged) {
          console.log('📝 Atualizando lista de carteiras:', available);
          return available;
        }
        
        return prevWallets;
      });
    };

    // Verificação inicial
    checkWallets();
    
    // Verificar após DOM carregar completamente
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkWallets);
    } else {
      // Se DOM já carregou, aguardar extensões injetarem com múltiplas tentativas
      setTimeout(checkWallets, 1000);
      setTimeout(checkWallets, 2000);
      setTimeout(checkWallets, 5000); // Verificação mais tardia
      setTimeout(checkWallets, 10000); // Última tentativa
    }
    
    // Verificação periódica menos frequente
    const interval = setInterval(checkWallets, 30000); // A cada 30 segundos
    
    // Verificar quando a janela ganhar foco
    const handleFocus = () => {
      console.log('🔄 Janela ganhou foco, verificando carteiras...');
      setTimeout(checkWallets, 500);
    };
    window.addEventListener('focus', handleFocus);
    
    // Escutar eventos de injeção de carteiras
    const handleWalletInjected = (event: any) => {
      console.log('🔄 Evento de injeção de carteira detectado:', event.type);
      setTimeout(checkWallets, 500);
    };
    
    // Eventos conhecidos de injeção
    const walletEvents = [
      'stellar-wallet-injected',
      'freighter-injected', 
      'rabet-injected',
      'xbull-injected',
      'lobstr-injected',
      'wallet-standard:app-ready'
    ];
    
    walletEvents.forEach(eventName => {
      window.addEventListener(eventName, handleWalletInjected);
    });
    
    // Monitor window object changes (experimental)
    let lastWindowKeys: string[] = [];
    const monitorWindowChanges = () => {
      try {
        const currentKeys = Object.keys(window).filter(key => 
          key.toLowerCase().includes('freighter') ||
          key.toLowerCase().includes('rabet') ||
          key.toLowerCase().includes('stellar') ||
          key.toLowerCase().includes('xbull') ||
          key.toLowerCase().includes('lobstr')
        );
        
        if (JSON.stringify(currentKeys) !== JSON.stringify(lastWindowKeys)) {
          console.log('🔄 Mudança detectada nas propriedades da window:', {
            added: currentKeys.filter(k => !lastWindowKeys.includes(k)),
            removed: lastWindowKeys.filter(k => !currentKeys.includes(k))
          });
          lastWindowKeys = currentKeys;
          setTimeout(checkWallets, 100);
        }
      } catch (error) {
        // Silenciar erros de acesso
      }
    };
    
    const windowMonitorInterval = setInterval(monitorWindowChanges, 2000);
    
    // Observer para mudanças no DOM que podem indicar injeção de extensões
    let domObserver: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined') {
      domObserver = new MutationObserver((mutations) => {
        let shouldCheck = false;
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (element.id?.toLowerCase().includes('freighter') ||
                    element.id?.toLowerCase().includes('rabet') ||
                    element.className?.toLowerCase().includes('stellar')) {
                  shouldCheck = true;
                }
              }
            });
          }
        });
        
        if (shouldCheck) {
          console.log('🔄 Mudança no DOM detectada, verificando carteiras...');
          setTimeout(checkWallets, 500);
        }
      });
      
      domObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
    
    return () => {
      clearInterval(interval);
      clearInterval(windowMonitorInterval);
      window.removeEventListener('focus', handleFocus);
      walletEvents.forEach(eventName => {
        window.removeEventListener(eventName, handleWalletInjected);
      });
      document.removeEventListener('DOMContentLoaded', checkWallets);
      if (domObserver) {
        domObserver.disconnect();
      }
    };
  }, []);

  // Connect to Freighter wallet
  const connectFreighter = useCallback(async () => {
    console.log('🔄 Tentando conectar com Freighter...');
    
    // Verificação mais robusta da disponibilidade do Freighter
    if (!window.freighter) {
      console.error('❌ Freighter não encontrado no objeto window');
      
      // Tentar encontrar Freighter em outras localizações
      const altFreighter = (window as any).freighterApi || 
                          (window as any).stellar?.freighter ||
                          (window as any).freighter;
      
      if (altFreighter) {
        console.log('🔄 Freighter encontrado em localização alternativa');
        (window as any).freighter = altFreighter;
      } else {
        throw new Error('Carteira Freighter não encontrada. Por favor, instale a extensão Freighter.');
      }
    }

    try {
      console.log('✅ Freighter encontrado, verificando API...');
      
      // Verificar se as funções necessárias estão disponíveis
      if (typeof window.freighter.isAllowed !== 'function') {
        throw new Error('API do Freighter incompleta. Tente recarregar a página.');
      }
      
      console.log('🔐 Verificando permissões...');
      const isAllowed = await window.freighter.isAllowed();
      console.log('🔐 Permissão atual:', isAllowed);
      
      if (!isAllowed) {
        console.log('🔓 Solicitando permissão...');
        try {
        await window.freighter.setAllowed();
          console.log('✅ Permissão concedida');
        } catch (permError: any) {
          console.error('❌ Erro ao solicitar permissão:', permError);
          if (permError.message?.includes('User declined') || permError.message?.includes('rejected')) {
            throw new Error('Permissão negada pelo usuário. Aceite a conexão na extensão Freighter.');
          }
          throw permError;
        }
      }

      console.log('🔑 Obtendo chave pública...');
      const publicKey = await window.freighter.getPublicKey();
      
      if (!publicKey || publicKey.length < 50) {
        throw new Error('Chave pública inválida recebida do Freighter');
      }
      
      console.log('🔑 Chave pública obtida:', publicKey.substring(0, 10) + '...');
      
      console.log('🌐 Obtendo rede...');
      const networkName = await window.freighter.getNetwork();
      console.log('🌐 Rede detectada:', networkName);
      
      const network: StellarNetwork = networkName === 'TESTNET' ? 'testnet' : 'mainnet';

      return { publicKey, network };
    } catch (error: any) {
      console.error('❌ Erro na conexão Freighter:', error);
      
      // Mensagens de erro mais específicas
      if (error.message?.includes('User declined access') || 
          error.message?.includes('User rejected') ||
          error.message?.includes('rejected')) {
        throw new Error('Conexão rejeitada pelo usuário. Por favor, aceite a conexão na extensão Freighter.');
      }
      
      if (error.message?.includes('Freighter is locked') ||
          error.message?.includes('locked')) {
        throw new Error('Freighter está bloqueado. Por favor, desbloqueie sua carteira.');
      }
      
      if (error.message?.includes('not installed') ||
          error.message?.includes('not found')) {
        throw new Error('Extensão Freighter não encontrada. Instale a extensão e recarregue a página.');
      }
      
      if (error.message?.includes('timeout') ||
          error.message?.includes('Timeout')) {
        throw new Error('Timeout na conexão com Freighter. Tente novamente.');
      }
      
      // Erro genérico mais informativo
      throw new Error(`Falha na conexão Freighter: ${error.message || 'Erro desconhecido'}`);
    }
  }, []);

  // Connect to Albedo wallet
  const connectAlbedo = useCallback(async () => {
    console.log('🔄 Attempting to connect with Albedo...');
    
    try {
      // Albedo is web-based, so we need to import it dynamically
      const albedoUrl = 'https://albedo.link/api/v1';
      
      // Create Albedo connection request
      const albedoParams = new URLSearchParams({
        pubkey: '',
        network: 'testnet',
        callback: window.location.origin,
      });
      
      // For now, we'll use a mock connection since Albedo requires a full integration
      // In a real implementation, you would redirect to Albedo or use their SDK
      console.log('🌐 Albedo connection would redirect to:', `${albedoUrl}?${albedoParams}`);
      
      // Mock Albedo response for testing - using a valid testnet account
      const mockPublicKey = 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426CJGQGKJJJKL2NRMPNQZUU';
      
      console.log('✅ Albedo mock connection successful');
      
      return {
        publicKey: mockPublicKey,
        network: 'testnet' as StellarNetwork,
      };
    } catch (error: any) {
      console.error('❌ Albedo connection error:', error);
      
      if (error.message?.includes('User cancelled')) {
        throw new Error('Conexão rejeitada pelo usuário');
      }
      throw new Error(`Falha na conexão Albedo: ${error.message}`);
    }
  }, []);

  // Connect to Rabet wallet
  const connectRabet = useCallback(async () => {
    console.log('🔄 Tentando conectar com Rabet...');
    
    // Verificação mais robusta da disponibilidade do Rabet
    if (!window.rabet) {
      console.error('❌ Rabet não encontrado no objeto window');
      
      // Tentar encontrar Rabet em outras localizações
      const altRabet = (window as any).rabetWallet || 
                      (window as any).stellar?.rabet ||
                      (window as any).rabet;
      
      if (altRabet) {
        console.log('🔄 Rabet encontrado em localização alternativa');
        (window as any).rabet = altRabet;
      } else {
        throw new Error('Carteira Rabet não encontrada. Por favor, instale a extensão Rabet.');
      }
    }

    try {
      console.log('✅ Rabet encontrado, verificando API...');
      
      // Verificar se as funções necessárias estão disponíveis
      if (typeof window.rabet.connect !== 'function') {
        throw new Error('API do Rabet incompleta. Tente recarregar a página.');
      }
      
      console.log('🔗 Conectando com Rabet...');
      const result = await window.rabet.connect();
      
      if (!result || !result.publicKey) {
        throw new Error('Resposta inválida do Rabet');
      }
      
      console.log('🔑 Chave pública obtida do Rabet:', result.publicKey.substring(0, 10) + '...');
      
      // Rabet geralmente usa testnet por padrão, mas vamos verificar se há informação de rede
      const network: StellarNetwork = 'testnet'; // Rabet usa testnet por padrão
      
      return {
        publicKey: result.publicKey,
        network,
      };
    } catch (error: any) {
      console.error('❌ Erro na conexão Rabet:', error);
      
      // Mensagens de erro mais específicas
      if (error.message?.includes('User rejected') || 
          error.message?.includes('rejected') ||
          error.message?.includes('declined')) {
        throw new Error('Conexão rejeitada pelo usuário. Por favor, aceite a conexão na extensão Rabet.');
      }
      
      if (error.message?.includes('locked')) {
        throw new Error('Rabet está bloqueado. Por favor, desbloqueie sua carteira.');
      }
      
      if (error.message?.includes('not installed') ||
          error.message?.includes('not found')) {
        throw new Error('Extensão Rabet não encontrada. Instale a extensão e recarregue a página.');
      }
      
      throw new Error(`Falha na conexão Rabet: ${error.message || 'Erro desconhecido'}`);
    }
  }, []);

  // Generic connect function
  const connect = useCallback(async (walletType: WalletType) => {
    if (!walletType) return;

    setConnecting(true);
    setError(null);

    try {
      let result: { publicKey: string; network: StellarNetwork };

      switch (walletType) {
        case 'freighter':
          result = await connectFreighter();
          break;
        case 'albedo':
          result = await connectAlbedo();
          break;
        case 'rabet':
          result = await connectRabet();
          break;
        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }

      setConnected(true, walletType, result.publicKey, result.network);
    } catch (error: any) {
      setError(error.message || 'Failed to connect wallet');
      setConnecting(false);
    }
  }, [connectFreighter, connectAlbedo, connectRabet, setConnecting, setConnected, setError]);

  // Auto-reconnect on page load
  useEffect(() => {
    const attemptAutoReconnect = async () => {
      // Check if already connected or connecting
      if (isConnected || isConnecting) {
        console.log('🔄 Already connected or connecting, skipping auto-reconnect');
        return;
      }

      const storedState = localStorage.getItem('stellar-credit-wallet');
      if (storedState) {
        try {
          const parsed = JSON.parse(storedState);
          const { walletType, publicKey, lastConnected, isConnected: wasConnected } = parsed.state || {};
          
          console.log('📦 Stored wallet state:', { walletType, publicKey: publicKey?.substring(0, 10) + '...', lastConnected, wasConnected });
          
          // Only attempt reconnect if connected within last 24 hours and has required data
          const twentyFourHours = 24 * 60 * 60 * 1000;
          if (walletType && publicKey && lastConnected && wasConnected && (Date.now() - lastConnected) < twentyFourHours) {
            console.log('🔄 Attempting auto-reconnect to', walletType);
            
            try {
              // First check if wallet is still available
              let isWalletAvailable = false;
              
              switch (walletType) {
                case 'freighter':
                  isWalletAvailable = !!window.freighter;
                  break;
                case 'albedo':
                  isWalletAvailable = true; // Web-based, always available
                  break;
                case 'rabet':
                  isWalletAvailable = !!window.rabet;
                  break;
                default:
                  isWalletAvailable = false;
              }
              
              if (isWalletAvailable) {
                await connect(walletType);
                console.log('✅ Auto-reconnect successful');
              } else {
                console.log('⚠️ Wallet extension not available for auto-reconnect');
              }
            } catch (error: any) {
              console.log('⚠️ Auto-reconnect failed:', error.message);
              // Clear stored state if auto-reconnect fails
              if (error.message?.includes('User declined') || error.message?.includes('not found')) {
                console.log('🧹 Clearing invalid stored state');
                localStorage.removeItem('stellar-credit-wallet');
              }
            }
          } else {
            console.log('⚠️ Stored state invalid or expired, clearing');
            if (!walletType || !publicKey || !lastConnected || (Date.now() - lastConnected) >= twentyFourHours) {
              localStorage.removeItem('stellar-credit-wallet');
            }
          }
        } catch (error) {
          console.log('⚠️ Failed to parse stored wallet state, clearing');
          localStorage.removeItem('stellar-credit-wallet');
        }
      } else {
        console.log('📦 No stored wallet state found');
      }
    };

    // Delay auto-reconnect to allow wallet extensions to load
    const timeoutId = setTimeout(attemptAutoReconnect, 1500);
    return () => clearTimeout(timeoutId);
  }, [connect, isConnected, isConnecting]);

  // Sign transaction
  const signTransaction = useCallback(async (xdr: string, networkPassphrase?: string) => {
    if (!isConnected || !walletType || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      switch (walletType) {
        case 'freighter':
          if (!window.freighter) throw new Error('Freighter not available');
          return await window.freighter.signTransaction(xdr, {
            network: networkPassphrase,
          });

        case 'albedo':
          if (!window.albedo) throw new Error('Albedo not available');
          const result = await window.albedo.tx({
            xdr,
            network: networkPassphrase,
          });
          return result.signed_envelope_xdr;

        case 'rabet':
          if (!window.rabet) throw new Error('Rabet not available');
          const rabetResult = await window.rabet.sign(xdr, networkPassphrase);
          return rabetResult.signedXDR;

        default:
          throw new Error(`Signing not supported for ${walletType}`);
      }
    } catch (error: any) {
      if (error.message?.includes('User declined') || error.message?.includes('User cancelled')) {
        throw new Error('Transaction rejected by user');
      }
      throw new Error(`Transaction signing failed: ${error.message}`);
    }
  }, [isConnected, walletType, publicKey]);

  // Check if wallet is still connected (for page refresh)
  const checkConnection = useCallback(async () => {
    if (!walletType) return;

    try {
      switch (walletType) {
        case 'freighter':
          if (window.freighter) {
            const isStillConnected = await window.freighter.isConnected();
            if (!isStillConnected) {
              disconnect();
            }
          }
          break;

        case 'rabet':
          if (window.rabet) {
            const isStillConnected = await window.rabet.isConnected();
            if (!isStillConnected) {
              disconnect();
            }
          }
          break;

        // Albedo doesn't have a persistent connection check
        default:
          break;
      }
    } catch (error) {
      console.warn('Connection check failed:', error);
      disconnect();
    }
  }, [walletType, disconnect]);

  // Auto-reconnect on page load
  useEffect(() => {
    if (isConnected && walletType) {
      checkConnection();
    }
  }, [isConnected, walletType, checkConnection]);

  // Network change handler
  const switchNetwork = useCallback(async (newNetwork: StellarNetwork) => {
    if (walletType === 'freighter' && window.freighter) {
      // Freighter handles network switching internally
      // User needs to change it in the extension
      setError('Please change network in Freighter extension');
      return;
    }

    // For other wallets, we can change the network in our state
    setNetwork(newNetwork);
  }, [walletType, setNetwork, setError]);

  // Get wallet installation URL
  const getWalletInstallUrl = useCallback((walletType: WalletType): string => {
    switch (walletType) {
      case 'freighter':
        return 'https://freighter.app/';
      case 'albedo':
        return 'https://albedo.link/';
      case 'rabet':
        return 'https://rabet.io/';
      case 'xbull':
        return 'https://xbull.app/';
      case 'lobstr':
        return 'https://lobstr.co/';
      default:
        return '';
    }
  }, []);

  // Check if wallet is installed
  const isWalletInstalled = useCallback((walletType: WalletType): boolean => {
    return availableWallets.includes(walletType);
  }, [availableWallets]);

  // Manual wallet detection refresh
  const refreshWalletDetection = useCallback(async () => {
    console.log('🔄 Forçando nova verificação de carteiras...');
    
    // Aguardar um pouco para dar tempo das extensões carregarem
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const available: WalletType[] = [];
    
    // Re-verificar todas as carteiras
    const checkAllWallets = async () => {
      // Freighter
      const freighterLocations = [
        () => window.freighter,
        () => (window as any).freighterApi,
        () => (window as any).stellar?.freighter,
        () => (window as any).FreighterAPI
      ];
      
      for (const getFreighter of freighterLocations) {
        const api = getFreighter();
        if (api && typeof api.isAllowed === 'function') {
          if (!available.includes('freighter')) {
            available.push('freighter');
            console.log('✅ Freighter detectado na verificação manual');
          }
          break;
        }
      }
      
      // Rabet
      const rabetLocations = [
        () => window.rabet,
        () => (window as any).rabetWallet,
        () => (window as any).stellar?.rabet,
        () => (window as any).RabetAPI
      ];
      
      for (const getRabet of rabetLocations) {
        const api = getRabet();
        if (api && typeof api.connect === 'function') {
          if (!available.includes('rabet')) {
            available.push('rabet');
            console.log('✅ Rabet detectado na verificação manual');
          }
          break;
        }
      }
      
      // Outras carteiras
      if ((window as any).xBullWalletConnect && !available.includes('xbull')) {
        available.push('xbull');
      }
      
      if ((window as any).lobstrWallet && !available.includes('lobstr')) {
        available.push('lobstr');
      }
      
      // Albedo sempre disponível
      if (!available.includes('albedo')) {
        available.push('albedo');
      }
    };
    
    await checkAllWallets();
    
    setAvailableWallets(available);
    console.log('📝 Verificação manual concluída. Carteiras detectadas:', available);
    
    return available;
  }, []);

  return {
    // State
    isConnected,
    isConnecting,
    walletType,
    publicKey,
    network,
    error,
    availableWallets,

    // Actions
    connect,
    disconnect,
    signTransaction,
    switchNetwork,
    checkConnection,
    refreshWalletDetection,

    // Utilities
    getWalletInstallUrl,
    isWalletInstalled,
  };
};
