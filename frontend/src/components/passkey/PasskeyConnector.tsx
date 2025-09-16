'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Fingerprint, 
  Shield, 
  Smartphone, 
  Monitor, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Plus,
  Key,
  Trash2,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { 
  usePasskeySupport, 
  usePasskeyCredentials, 
  usePasskeyActions, 
  usePasskeyStatus,
  usePasskeyAccounts
} from '@/stores/passkeyStore';
import { useNotify } from '@/components/providers/NotificationProvider';
import { PasskeyCredential, PasskeyRegistrationOptions } from '@/types/passkeys';

interface PasskeyConnectorProps {
  onConnect?: (credentialId: string) => void;
  onCancel?: () => void;
  showAccountCreation?: boolean;
}

export function PasskeyConnector({ 
  onConnect, 
  onCancel, 
  showAccountCreation = false 
}: PasskeyConnectorProps) {
  const t = useTranslations('passkey');
  const notify = useNotify();
  
  const { isSupported, isAvailable, checkSupport } = usePasskeySupport();
  const { credentials, currentCredential } = usePasskeyCredentials();
  const { accounts } = usePasskeyAccounts();
  const { 
    register, 
    authenticate, 
    createStellarAccount, 
    deleteCredential, 
    updateCredentialNickname,
    clearError 
  } = usePasskeyActions();
  const { isRegistering, isAuthenticating, error } = usePasskeyStatus();

  const [selectedCredential, setSelectedCredential] = useState<PasskeyCredential | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [newNickname, setNewNickname] = useState('');
  const [registrationOptions, setRegistrationOptions] = useState<PasskeyRegistrationOptions>({
    authenticatorType: 'platform',
    userVerification: 'preferred',
  });

  // Verificar suporte ao carregar
  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  // Limpar erro quando componente desmonta
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleRegisterPasskey = async () => {
    try {
      const credential = await register(registrationOptions);
      
      if (showAccountCreation) {
        await createStellarAccount(credential.id);
        notify.success('Passkey e conta Stellar criadas com sucesso!');
      } else {
        notify.success('Passkey registrada com sucesso!');
      }
      
      setShowRegistration(false);
      onConnect?.(credential.id);
    } catch (error: any) {
      notify.error(error.message || 'Falha no registro da passkey');
    }
  };

  const handleAuthenticatePasskey = async (credentialId?: string) => {
    try {
      const credential = await authenticate(credentialId);
      notify.success('Autenticação bem-sucedida!');
      onConnect?.(credential.id);
    } catch (error: any) {
      notify.error(error.message || 'Falha na autenticação');
    }
  };

  const handleDeleteCredential = async (credentialId: string) => {
    try {
      await deleteCredential(credentialId);
      notify.success('Passkey removida com sucesso');
    } catch (error: any) {
      notify.error(error.message || 'Falha ao remover passkey');
    }
  };

  const handleUpdateNickname = async (credentialId: string) => {
    try {
      await updateCredentialNickname(credentialId, newNickname);
      setEditingNickname(null);
      setNewNickname('');
      notify.success('Nome atualizado com sucesso');
    } catch (error: any) {
      notify.error(error.message || 'Falha ao atualizar nome');
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'platform':
        return <Smartphone className="h-5 w-5" />;
      case 'cross-platform':
        return <Key className="h-5 w-5" />;
      default:
        return <Fingerprint className="h-5 w-5" />;
    }
  };

  if (!isSupported) {
    return (
      <div className="text-center p-6">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Passkeys Não Suportadas
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Seu navegador ou dispositivo não suporta passkeys. 
          Tente usar um navegador mais recente ou dispositivo compatível.
        </p>
        <Button variant="outline" onClick={onCancel}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full">
            <Fingerprint className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Autenticação com Passkey
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Use sua impressão digital, Face ID ou chave de segurança
        </p>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <span className="text-red-700 dark:text-red-400">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Passkeys */}
      {credentials.length > 0 && !showRegistration && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Suas Passkeys
          </h3>
          
          <div className="space-y-3">
            {credentials.map((credential) => (
              <motion.div
                key={credential.id}
                layout
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getDeviceIcon(credential.deviceType)}
                    <div>
                      {editingNickname === credential.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newNickname}
                            onChange={(e) => setNewNickname(e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                            placeholder="Nome da passkey"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateNickname(credential.id)}
                            disabled={!newNickname.trim()}
                          >
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingNickname(null);
                              setNewNickname('');
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {credential.nickname || 'Passkey sem nome'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Criada em {credential.createdAt.toLocaleDateString('pt-BR')}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingNickname(credential.id);
                        setNewNickname(credential.nickname || '');
                      }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCredential(credential.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAuthenticatePasskey(credential.id)}
                      disabled={isAuthenticating}
                    >
                      {isAuthenticating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Usar'
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Auth Button */}
          <Button
            onClick={() => handleAuthenticatePasskey()}
            disabled={isAuthenticating}
            className="w-full"
            size="lg"
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Autenticando...
              </>
            ) : (
              <>
                <Fingerprint className="h-5 w-5 mr-2" />
                Autenticar com Qualquer Passkey
              </>
            )}
          </Button>
        </div>
      )}

      {/* Registration Form */}
      {showRegistration && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Registrar Nova Passkey
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome da Passkey (opcional)
              </label>
              <input
                type="text"
                value={registrationOptions.nickname || ''}
                onChange={(e) => setRegistrationOptions(prev => ({
                  ...prev,
                  nickname: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Ex: iPhone, Chave YubiKey, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Autenticador
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRegistrationOptions(prev => ({
                    ...prev,
                    authenticatorType: 'platform'
                  }))}
                  className={`p-3 border-2 rounded-lg text-center transition-colors ${
                    registrationOptions.authenticatorType === 'platform'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Smartphone className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Dispositivo</div>
                  <div className="text-xs text-gray-500">Face ID, Touch ID</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRegistrationOptions(prev => ({
                    ...prev,
                    authenticatorType: 'cross-platform'
                  }))}
                  className={`p-3 border-2 rounded-lg text-center transition-colors ${
                    registrationOptions.authenticatorType === 'cross-platform'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Key className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Chave Externa</div>
                  <div className="text-xs text-gray-500">YubiKey, etc.</div>
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleRegisterPasskey}
                disabled={isRegistering}
                className="flex-1"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Passkey
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRegistration(false)}
                disabled={isRegistering}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      {!showRegistration && (
        <div className="flex space-x-3">
          {credentials.length === 0 || showAccountCreation ? (
            <Button
              onClick={() => setShowRegistration(true)}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              {credentials.length === 0 ? 'Criar Primeira Passkey' : 'Adicionar Passkey'}
            </Button>
          ) : (
            <Button
              onClick={() => setShowRegistration(true)}
              variant="outline"
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Nova Passkey
            </Button>
          )}
          
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      )}

      {/* Features */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
          Vantagens das Passkeys
        </h4>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-2 text-green-500" />
            <span>Mais seguro que senhas</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            <span>Sem risco de phishing</span>
          </div>
          <div className="flex items-center">
            <Fingerprint className="h-4 w-4 mr-2 text-green-500" />
            <span>Autenticação biométrica</span>
          </div>
        </div>
      </div>
    </div>
  );
}
