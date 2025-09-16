import type { 
  AuthenticationResponseJSON, 
  RegistrationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON 
} from '@simplewebauthn/types';

export interface PasskeyCredential {
  id: string;
  publicKey: string;
  counter: number;
  transports?: AuthenticatorTransport[];
  createdAt: Date;
  lastUsed: Date;
  nickname?: string;
  deviceType?: 'platform' | 'cross-platform';
  aaguid?: string;
}

export interface PasskeyRegistrationRequest {
  challenge: string;
  rp: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    alg: number;
    type: 'public-key';
  }>;
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    userVerification?: 'required' | 'preferred' | 'discouraged';
    residentKey?: 'required' | 'preferred' | 'discouraged';
  };
  attestation?: 'none' | 'indirect' | 'direct' | 'enterprise';
  timeout?: number;
}

export interface PasskeyAuthenticationRequest {
  challenge: string;
  rpId?: string;
  allowCredentials?: Array<{
    id: string;
    type: 'public-key';
    transports?: AuthenticatorTransport[];
  }>;
  userVerification?: 'required' | 'preferred' | 'discouraged';
  timeout?: number;
}

export interface StellarPasskeyAccount {
  publicKey: string;
  passkeyCredentialId: string;
  nickname?: string;
  network: 'testnet' | 'mainnet';
  createdAt: Date;
  lastUsed: Date;
}

export interface PasskeyWalletState {
  isSupported: boolean;
  isAvailable: boolean;
  credentials: PasskeyCredential[];
  currentCredential: PasskeyCredential | null;
  accounts: StellarPasskeyAccount[];
  currentAccount: StellarPasskeyAccount | null;
  isRegistering: boolean;
  isAuthenticating: boolean;
  error: string | null;
}

export interface PasskeyWalletActions {
  checkSupport: () => Promise<boolean>;
  register: (options?: {
    nickname?: string;
    authenticatorType?: 'platform' | 'cross-platform';
  }) => Promise<PasskeyCredential>;
  authenticate: (credentialId?: string) => Promise<PasskeyCredential>;
  createStellarAccount: (credentialId: string, network?: 'testnet' | 'mainnet') => Promise<StellarPasskeyAccount>;
  signTransaction: (transaction: string, credentialId: string) => Promise<string>;
  deleteCredential: (credentialId: string) => Promise<void>;
  updateCredentialNickname: (credentialId: string, nickname: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export interface FreighterPasskeySupport {
  isPasskeySupported: () => Promise<boolean>;
  registerPasskey: (options: PasskeyRegistrationRequest) => Promise<RegistrationResponseJSON>;
  authenticateWithPasskey: (options: PasskeyAuthenticationRequest) => Promise<AuthenticationResponseJSON>;
  getPasskeyAccounts: () => Promise<StellarPasskeyAccount[]>;
  signWithPasskey: (transaction: string, credentialId: string) => Promise<string>;
}

export interface PasskeyError {
  code: string;
  message: string;
  details?: any;
}

export type PasskeyErrorCode = 
  | 'NOT_SUPPORTED'
  | 'NOT_AVAILABLE'
  | 'USER_CANCELLED'
  | 'TIMEOUT'
  | 'INVALID_STATE'
  | 'CONSTRAINT_ERROR'
  | 'NOT_ALLOWED'
  | 'ABORT_ERROR'
  | 'UNKNOWN_ERROR'
  | 'REGISTRATION_FAILED'
  | 'AUTHENTICATION_FAILED'
  | 'SIGNATURE_FAILED';

export interface PasskeyDeviceInfo {
  platform: string;
  browser: string;
  supportsPasskeys: boolean;
  supportsPlatformAuthenticator: boolean;
  supportsConditionalUI: boolean;
}

export interface PasskeyRegistrationOptions {
  nickname?: string;
  authenticatorType?: 'platform' | 'cross-platform';
  userVerification?: 'required' | 'preferred' | 'discouraged';
  residentKey?: 'required' | 'preferred' | 'discouraged';
  attestation?: 'none' | 'indirect' | 'direct' | 'enterprise';
}

export interface PasskeyAuthenticationOptions {
  credentialId?: string;
  userVerification?: 'required' | 'preferred' | 'discouraged';
  allowCredentials?: string[];
  conditionalUI?: boolean;
}
