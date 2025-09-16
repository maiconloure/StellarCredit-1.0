'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { 
  Fingerprint, 
  Shield, 
  Smartphone, 
  Key, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Copy,
  ExternalLink,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { 
  usePasskeyCredentials, 
  usePasskeyAccounts, 
  usePasskeySupport 
} from '@/stores/passkeyStore';
import { PasskeyCredential, StellarPasskeyAccount } from '@/types/passkeys';
import { formatDate, formatAddress, copyToClipboard } from '@/lib/utils';
import { useNotify } from '@/components/providers/NotificationProvider';

interface PasskeyInfoProps {
  credentialId?: string;
  showAccountInfo?: boolean;
  onManage?: () => void;
}

export function PasskeyInfo({ 
  credentialId, 
  showAccountInfo = true, 
  onManage 
}: PasskeyInfoProps) {
  const t = useTranslations('passkey');
  const notify = useNotify();
  
  const { isSupported, isAvailable } = usePasskeySupport();
  const { credentials, currentCredential } = usePasskeyCredentials();
  const { accounts, currentAccount } = usePasskeyAccounts();
  
  const [copying, setCopying] = useState(false);

  const credential = credentialId 
    ? credentials.find(c => c.id === credentialId)
    : currentCredential;

  const account = credential 
    ? accounts.find(a => a.passkeyCredentialId === credential.id)
    : currentAccount;

  const handleCopyAddress = async (address: string) => {
    setCopying(true);
    try {
      await copyToClipboard(address);
      notify.success('Endereço copiado!');
    } catch (error) {
      notify.error('Falha ao copiar endereço');
    } finally {
      setCopying(false);
    }
  };

  const handleViewOnExplorer = (address: string, network: string) => {
    const baseUrl = network === 'mainnet' 
      ? 'https://stellarchain.io/account'
      : 'https://stellar.expert/explorer/testnet/account';
    
    window.open(`${baseUrl}/${address}`, '_blank', 'noopener,noreferrer');
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'platform':
        return <Smartphone className="h-5 w-5 text-blue-500" />;
      case 'cross-platform':
        return <Key className="h-5 w-5 text-purple-500" />;
      default:
        return <Fingerprint className="h-5 w-5 text-green-500" />;
    }
  };

  const getStatusIcon = () => {
    if (!isSupported) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
    if (credential) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <Shield className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (!isSupported) {
      return 'Passkeys não suportadas';
    }
    if (credential) {
      return 'Passkey ativa';
    }
    return 'Nenhuma passkey configurada';
  };

  if (!credential && !isSupported) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-400">
              Passkeys Não Suportadas
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              Seu dispositivo ou navegador não suporta autenticação com passkeys.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Geral */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Status da Passkey
          </h3>
          {onManage && (
            <Button variant="outline" size="sm" onClick={onManage}>
              <Settings className="h-4 w-4 mr-2" />
              Gerenciar
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {getStatusText()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {isSupported && isAvailable 
                ? 'Dispositivo compatível com autenticação biométrica'
                : 'Verificar compatibilidade do dispositivo'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Informações da Passkey */}
      {credential && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Detalhes da Passkey
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getDeviceIcon(credential.deviceType)}
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {credential.nickname || 'Passkey sem nome'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {credential.deviceType === 'platform' ? 'Dispositivo integrado' : 'Chave externa'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Criada em</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(credential.createdAt)}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Último uso</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(credential.lastUsed)}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">ID da Credencial</div>
              <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded">
                {credential.id.substring(0, 32)}...
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Informações da Conta Stellar */}
      {showAccountInfo && account && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Conta Stellar Associada
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {account.nickname || 'Conta Stellar'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Rede: {account.network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyAddress(account.publicKey)}
                  disabled={copying}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewOnExplorer(account.publicKey, account.network)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Chave Pública</div>
              <div className="font-mono text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded break-all">
                {account.publicKey}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Conta criada</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(account.createdAt)}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Último acesso</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(account.lastUsed)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recursos de Segurança */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-green-600" />
          Recursos de Segurança
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                Autenticação Biométrica
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Face ID, Touch ID ou PIN do dispositivo
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                Resistente a Phishing
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Impossível de ser interceptado ou falsificado
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                Sem Senhas
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Não há senhas para esquecer ou vazar
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                Criptografia Forte
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Chaves privadas nunca deixam o dispositivo
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
