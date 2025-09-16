'use client';

import { 
  startRegistration, 
  startAuthentication,
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
  platformAuthenticatorIsAvailable
} from '@simplewebauthn/browser';
import type { 
  RegistrationResponseJSON, 
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON 
} from '@simplewebauthn/types';
import { 
  PasskeyCredential,
  PasskeyRegistrationRequest,
  PasskeyAuthenticationRequest,
  PasskeyError,
  PasskeyErrorCode,
  PasskeyDeviceInfo,
  PasskeyRegistrationOptions,
  PasskeyAuthenticationOptions
} from '@/types/passkeys';

export class WebAuthnService {
  private static instance: WebAuthnService;
  private rpId: string;
  private rpName: string;
  private origin: string;

  private constructor() {
    this.rpId = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    this.rpName = 'Stellar Credit';
    this.origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  }

  static getInstance(): WebAuthnService {
    if (!WebAuthnService.instance) {
      WebAuthnService.instance = new WebAuthnService();
    }
    return WebAuthnService.instance;
  }

  /**
   * Verifica se o dispositivo suporta passkeys
   */
  async checkPasskeySupport(): Promise<PasskeyDeviceInfo> {
    const supportsWebAuthn = browserSupportsWebAuthn();
    const supportsAutofill = await browserSupportsWebAuthnAutofill();
    const supportsPlatform = await platformAuthenticatorIsAvailable();

    return {
      platform: this.getPlatform(),
      browser: this.getBrowser(),
      supportsPasskeys: supportsWebAuthn,
      supportsPlatformAuthenticator: supportsPlatform,
      supportsConditionalUI: supportsAutofill,
    };
  }

  /**
   * Registra uma nova passkey
   */
  async registerPasskey(options: PasskeyRegistrationOptions = {}): Promise<PasskeyCredential> {
    try {
      if (!browserSupportsWebAuthn()) {
        throw this.createError('NOT_SUPPORTED', 'WebAuthn não é suportado neste navegador');
      }

      // Gerar challenge seguro
      const challenge = this.generateChallenge();
      const userId = this.generateUserId();

      const registrationOptions: PublicKeyCredentialCreationOptionsJSON = {
        rp: {
          id: this.rpId,
          name: this.rpName,
        },
        user: {
          id: userId,
          name: `stellar-user-${Date.now()}`,
          displayName: options.nickname || 'Stellar Credit User',
        },
        challenge,
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: options.authenticatorType,
          userVerification: options.userVerification || 'preferred',
          residentKey: options.residentKey || 'preferred',
        },
        attestation: options.attestation || 'none',
        timeout: 60000,
        excludeCredentials: [], // TODO: Adicionar credenciais existentes
      };

      console.log('🔐 Iniciando registro de passkey:', registrationOptions);

      const registrationResponse = await startRegistration(registrationOptions);

      console.log('✅ Passkey registrada com sucesso:', registrationResponse);

      // Criar credential object
      const credential: PasskeyCredential = {
        id: registrationResponse.id,
        publicKey: registrationResponse.response.publicKey || '',
        counter: 0,
        transports: registrationResponse.response.transports as AuthenticatorTransport[],
        createdAt: new Date(),
        lastUsed: new Date(),
        nickname: options.nickname,
        deviceType: options.authenticatorType || 'platform',
      };

      // Salvar no localStorage (em produção, usar servidor seguro)
      this.saveCredential(credential);

      return credential;

    } catch (error: any) {
      console.error('❌ Erro no registro de passkey:', error);
      throw this.handleWebAuthnError(error);
    }
  }

  /**
   * Autentica com passkey existente
   */
  async authenticateWithPasskey(options: PasskeyAuthenticationOptions = {}): Promise<PasskeyCredential> {
    try {
      if (!browserSupportsWebAuthn()) {
        throw this.createError('NOT_SUPPORTED', 'WebAuthn não é suportado neste navegador');
      }

      const challenge = this.generateChallenge();
      const savedCredentials = this.getSavedCredentials();

      let allowCredentials: Array<{ id: string; type: 'public-key'; transports?: AuthenticatorTransport[] }> = [];

      if (options.credentialId) {
        const credential = savedCredentials.find(c => c.id === options.credentialId);
        if (credential) {
          allowCredentials = [{
            id: credential.id,
            type: 'public-key',
            transports: credential.transports,
          }];
        }
      } else if (options.allowCredentials) {
        allowCredentials = options.allowCredentials.map(id => {
          const credential = savedCredentials.find(c => c.id === id);
          return {
            id,
            type: 'public-key' as const,
            transports: credential?.transports,
          };
        });
      } else {
        // Usar todas as credenciais salvas
        allowCredentials = savedCredentials.map(credential => ({
          id: credential.id,
          type: 'public-key' as const,
          transports: credential.transports,
        }));
      }

      const authenticationOptions: PublicKeyCredentialRequestOptionsJSON = {
        challenge,
        rpId: this.rpId,
        allowCredentials,
        userVerification: options.userVerification || 'preferred',
        timeout: 60000,
      };

      console.log('🔓 Iniciando autenticação com passkey:', authenticationOptions);

      const authenticationResponse = await startAuthentication(authenticationOptions);

      console.log('✅ Autenticação com passkey bem-sucedida:', authenticationResponse);

      // Encontrar a credencial usada
      const usedCredential = savedCredentials.find(c => c.id === authenticationResponse.id);
      if (!usedCredential) {
        throw this.createError('INVALID_STATE', 'Credencial não encontrada');
      }

      // Atualizar último uso
      usedCredential.lastUsed = new Date();
      this.saveCredential(usedCredential);

      return usedCredential;

    } catch (error: any) {
      console.error('❌ Erro na autenticação com passkey:', error);
      throw this.handleWebAuthnError(error);
    }
  }

  /**
   * Lista credenciais salvas
   */
  getSavedCredentials(): PasskeyCredential[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const saved = localStorage.getItem('stellar-credit-passkeys');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Erro ao carregar credenciais:', error);
      return [];
    }
  }

  /**
   * Salva credencial no localStorage
   */
  private saveCredential(credential: PasskeyCredential): void {
    if (typeof window === 'undefined') return;

    try {
      const existing = this.getSavedCredentials();
      const updated = existing.filter(c => c.id !== credential.id);
      updated.push(credential);
      
      localStorage.setItem('stellar-credit-passkeys', JSON.stringify(updated));
      console.log('💾 Credencial salva:', credential.id);
    } catch (error) {
      console.error('Erro ao salvar credencial:', error);
    }
  }

  /**
   * Remove credencial
   */
  async deleteCredential(credentialId: string): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const existing = this.getSavedCredentials();
      const filtered = existing.filter(c => c.id !== credentialId);
      
      localStorage.setItem('stellar-credit-passkeys', JSON.stringify(filtered));
      console.log('🗑️ Credencial removida:', credentialId);
    } catch (error) {
      console.error('Erro ao remover credencial:', error);
      throw this.createError('UNKNOWN_ERROR', 'Falha ao remover credencial');
    }
  }

  /**
   * Atualiza nickname da credencial
   */
  async updateCredentialNickname(credentialId: string, nickname: string): Promise<void> {
    const credentials = this.getSavedCredentials();
    const credential = credentials.find(c => c.id === credentialId);
    
    if (!credential) {
      throw this.createError('INVALID_STATE', 'Credencial não encontrada');
    }

    credential.nickname = nickname;
    this.saveCredential(credential);
  }

  /**
   * Limpa todas as credenciais
   */
  async clearAllCredentials(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('stellar-credit-passkeys');
    console.log('🧹 Todas as credenciais foram removidas');
  }

  // Métodos utilitários privados

  private generateChallenge(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private generateUserId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private getPlatform(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const userAgent = window.navigator.userAgent;
    if (userAgent.includes('Win')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    return 'Unknown';
  }

  private getBrowser(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const userAgent = window.navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private createError(code: PasskeyErrorCode, message: string, details?: any): PasskeyError {
    return {
      code,
      message,
      details,
    };
  }

  private handleWebAuthnError(error: any): PasskeyError {
    console.error('WebAuthn Error:', error);

    if (error.name === 'NotSupportedError') {
      return this.createError('NOT_SUPPORTED', 'Passkeys não são suportadas neste dispositivo');
    }
    
    if (error.name === 'NotAllowedError') {
      return this.createError('NOT_ALLOWED', 'Operação não permitida pelo usuário');
    }
    
    if (error.name === 'AbortError') {
      return this.createError('USER_CANCELLED', 'Operação cancelada pelo usuário');
    }
    
    if (error.name === 'TimeoutError') {
      return this.createError('TIMEOUT', 'Tempo limite excedido');
    }
    
    if (error.name === 'InvalidStateError') {
      return this.createError('INVALID_STATE', 'Estado inválido do autenticador');
    }
    
    if (error.name === 'ConstraintError') {
      return this.createError('CONSTRAINT_ERROR', 'Erro de restrição do autenticador');
    }

    return this.createError('UNKNOWN_ERROR', error.message || 'Erro desconhecido', error);
  }
}

// Instância singleton
export const webAuthnService = WebAuthnService.getInstance();
