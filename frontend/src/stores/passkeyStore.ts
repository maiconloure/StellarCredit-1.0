import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  PasskeyWalletState, 
  PasskeyWalletActions, 
  PasskeyCredential,
  StellarPasskeyAccount,
  PasskeyDeviceInfo,
  PasskeyRegistrationOptions,
  PasskeyAuthenticationOptions
} from '@/types/passkeys';
import { webAuthnService } from '@/services/webauthn';
import { Keypair, Networks } from '@stellar/stellar-sdk';

interface PasskeyStore extends PasskeyWalletState, PasskeyWalletActions {}

const initialState: PasskeyWalletState = {
  isSupported: false,
  isAvailable: false,
  credentials: [],
  currentCredential: null,
  accounts: [],
  currentAccount: null,
  isRegistering: false,
  isAuthenticating: false,
  error: null,
};

export const usePasskeyStore = create<PasskeyStore>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // Verificar suporte a passkeys
      checkSupport: async () => {
        try {
          console.log('🔍 Verificando suporte a passkeys...');
          
          const deviceInfo: PasskeyDeviceInfo = await webAuthnService.checkPasskeySupport();
          
          set((state) => {
            state.isSupported = deviceInfo.supportsPasskeys;
            state.isAvailable = deviceInfo.supportsPlatformAuthenticator;
            state.error = null;
          });

          console.log('📱 Informações do dispositivo:', deviceInfo);
          
          return deviceInfo.supportsPasskeys;
        } catch (error: any) {
          console.error('❌ Erro ao verificar suporte:', error);
          
          set((state) => {
            state.error = error.message || 'Falha ao verificar suporte a passkeys';
            state.isSupported = false;
            state.isAvailable = false;
          });
          
          return false;
        }
      },

      // Registrar nova passkey
      register: async (options: PasskeyRegistrationOptions = {}) => {
        const state = get();
        
        if (!state.isSupported) {
          throw new Error('Passkeys não são suportadas neste dispositivo');
        }

        try {
          set((state) => {
            state.isRegistering = true;
            state.error = null;
          });

          console.log('🔐 Iniciando registro de passkey...');
          
          const credential = await webAuthnService.registerPasskey(options);
          
          set((state) => {
            state.credentials.push(credential);
            state.currentCredential = credential;
            state.isRegistering = false;
            state.error = null;
          });

          console.log('✅ Passkey registrada:', credential.id);
          
          return credential;
        } catch (error: any) {
          console.error('❌ Erro no registro:', error);
          
          set((state) => {
            state.isRegistering = false;
            state.error = error.message || 'Falha no registro da passkey';
          });
          
          throw error;
        }
      },

      // Autenticar com passkey
      authenticate: async (credentialId?: string) => {
        const state = get();
        
        if (!state.isSupported) {
          throw new Error('Passkeys não são suportadas neste dispositivo');
        }

        try {
          set((state) => {
            state.isAuthenticating = true;
            state.error = null;
          });

          console.log('🔓 Iniciando autenticação com passkey...');
          
          const options: PasskeyAuthenticationOptions = {};
          if (credentialId) {
            options.credentialId = credentialId;
          }
          
          const credential = await webAuthnService.authenticateWithPasskey(options);
          
          set((state) => {
            state.currentCredential = credential;
            state.isAuthenticating = false;
            state.error = null;
            
            // Atualizar credencial na lista
            const index = state.credentials.findIndex(c => c.id === credential.id);
            if (index >= 0) {
              state.credentials[index] = credential;
            }
          });

          console.log('✅ Autenticação bem-sucedida:', credential.id);
          
          return credential;
        } catch (error: any) {
          console.error('❌ Erro na autenticação:', error);
          
          set((state) => {
            state.isAuthenticating = false;
            state.error = error.message || 'Falha na autenticação';
          });
          
          throw error;
        }
      },

      // Criar conta Stellar associada à passkey
      createStellarAccount: async (credentialId: string, network: 'testnet' | 'mainnet' = 'testnet') => {
        try {
          console.log('🌟 Criando conta Stellar para passkey:', credentialId);
          
          const credential = get().credentials.find(c => c.id === credentialId);
          if (!credential) {
            throw new Error('Credencial não encontrada');
          }

          // Gerar keypair Stellar determinístico baseado na passkey
          // Em produção, isso deveria ser mais seguro
          const seed = this.generateStellarSeed(credentialId);
          const keypair = Keypair.fromSecret(seed);
          
          const account: StellarPasskeyAccount = {
            publicKey: keypair.publicKey(),
            passkeyCredentialId: credentialId,
            nickname: credential.nickname,
            network,
            createdAt: new Date(),
            lastUsed: new Date(),
          };

          set((state) => {
            state.accounts.push(account);
            state.currentAccount = account;
          });

          console.log('✅ Conta Stellar criada:', account.publicKey);
          
          return account;
        } catch (error: any) {
          console.error('❌ Erro ao criar conta Stellar:', error);
          
          set((state) => {
            state.error = error.message || 'Falha ao criar conta Stellar';
          });
          
          throw error;
        }
      },

      // Assinar transação com passkey
      signTransaction: async (transaction: string, credentialId: string) => {
        try {
          console.log('✍️ Assinando transação com passkey:', credentialId);
          
          // Primeiro autenticar com a passkey
          const credential = await get().authenticate(credentialId);
          
          // Em uma implementação real, a assinatura seria feita de forma mais segura
          // Por enquanto, retornamos uma assinatura mock
          const signature = `passkey-signed-${credentialId}-${Date.now()}`;
          
          console.log('✅ Transação assinada com passkey');
          
          return signature;
        } catch (error: any) {
          console.error('❌ Erro ao assinar transação:', error);
          
          set((state) => {
            state.error = error.message || 'Falha ao assinar transação';
          });
          
          throw error;
        }
      },

      // Deletar credencial
      deleteCredential: async (credentialId: string) => {
        try {
          console.log('🗑️ Removendo credencial:', credentialId);
          
          await webAuthnService.deleteCredential(credentialId);
          
          set((state) => {
            state.credentials = state.credentials.filter(c => c.id !== credentialId);
            state.accounts = state.accounts.filter(a => a.passkeyCredentialId !== credentialId);
            
            if (state.currentCredential?.id === credentialId) {
              state.currentCredential = null;
            }
            
            if (state.currentAccount?.passkeyCredentialId === credentialId) {
              state.currentAccount = null;
            }
          });

          console.log('✅ Credencial removida');
        } catch (error: any) {
          console.error('❌ Erro ao remover credencial:', error);
          
          set((state) => {
            state.error = error.message || 'Falha ao remover credencial';
          });
          
          throw error;
        }
      },

      // Atualizar nickname da credencial
      updateCredentialNickname: async (credentialId: string, nickname: string) => {
        try {
          await webAuthnService.updateCredentialNickname(credentialId, nickname);
          
          set((state) => {
            const credential = state.credentials.find(c => c.id === credentialId);
            if (credential) {
              credential.nickname = nickname;
            }
            
            const account = state.accounts.find(a => a.passkeyCredentialId === credentialId);
            if (account) {
              account.nickname = nickname;
            }
          });

          console.log('✅ Nickname atualizado');
        } catch (error: any) {
          console.error('❌ Erro ao atualizar nickname:', error);
          throw error;
        }
      },

      // Limpar erro
      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      // Reset do estado
      reset: () => {
        set((state) => {
          Object.assign(state, initialState);
        });
      },

      // Método privado para gerar seed Stellar
      generateStellarSeed: (credentialId: string): string => {
        // Em produção, usar método mais seguro
        // Por enquanto, gerar seed determinístico baseado no credentialId
        const encoder = new TextEncoder();
        const data = encoder.encode(credentialId);
        
        // Simular geração de seed (32 bytes)
        const seed = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          seed[i] = data[i % data.length] ^ (i + 1);
        }
        
        return Keypair.fromRawEd25519Seed(seed).secret();
      },
    })),
    {
      name: 'stellar-credit-passkeys',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        credentials: state.credentials,
        accounts: state.accounts,
        currentCredential: state.currentCredential,
        currentAccount: state.currentAccount,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recarregar credenciais do WebAuthn service
          const savedCredentials = webAuthnService.getSavedCredentials();
          state.credentials = savedCredentials;
          
          // Verificar suporte novamente após hidratação
          state.checkSupport();
        }
      },
    }
  )
);

// Hooks úteis com seletores estáveis
export const usePasskeySupport = () => {
  const isSupported = usePasskeyStore((state) => state.isSupported);
  const isAvailable = usePasskeyStore((state) => state.isAvailable);
  const checkSupport = usePasskeyStore((state) => state.checkSupport);
  
  return { isSupported, isAvailable, checkSupport };
};

export const usePasskeyCredentials = () => {
  const credentials = usePasskeyStore((state) => state.credentials);
  const currentCredential = usePasskeyStore((state) => state.currentCredential);
  
  return { credentials, currentCredential };
};

export const usePasskeyAccounts = () => {
  const accounts = usePasskeyStore((state) => state.accounts);
  const currentAccount = usePasskeyStore((state) => state.currentAccount);
  
  return { accounts, currentAccount };
};

export const usePasskeyActions = () => {
  const register = usePasskeyStore((state) => state.register);
  const authenticate = usePasskeyStore((state) => state.authenticate);
  const createStellarAccount = usePasskeyStore((state) => state.createStellarAccount);
  const signTransaction = usePasskeyStore((state) => state.signTransaction);
  const deleteCredential = usePasskeyStore((state) => state.deleteCredential);
  const updateCredentialNickname = usePasskeyStore((state) => state.updateCredentialNickname);
  const clearError = usePasskeyStore((state) => state.clearError);
  const reset = usePasskeyStore((state) => state.reset);
  
  return {
    register,
    authenticate,
    createStellarAccount,
    signTransaction,
    deleteCredential,
    updateCredentialNickname,
    clearError,
    reset,
  };
};

export const usePasskeyStatus = () => {
  const isRegistering = usePasskeyStore((state) => state.isRegistering);
  const isAuthenticating = usePasskeyStore((state) => state.isAuthenticating);
  const error = usePasskeyStore((state) => state.error);
  
  return { isRegistering, isAuthenticating, error };
};
