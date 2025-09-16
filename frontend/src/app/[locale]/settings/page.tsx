'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { 
  User,
  Shield,
  Bell,
  Globe,
  Fingerprint,
  Moon,
  Sun,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Download,
  Trash2,
  Save
} from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/Button';
import { WalletInfo } from '@/components/wallet/WalletInfo';
import { useWalletStore } from '@/stores/walletStore';
import { PasskeyInfo } from '@/components/passkey';

export default function SettingsPage() {
  const t = useTranslations();
  const { theme, setTheme } = useTheme();
  const { isConnected, publicKey, walletType } = useWalletStore();
  
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'privacy'>('general');
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    scoreUpdates: true,
    transactionAlerts: true,
    loanReminders: true,
    marketNews: false,
    twoFactorAuth: false,
    biometricAuth: true,
    dataSharing: false,
    analytics: true,
    marketing: false,
  });

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'general', name: t('settings.general'), icon: User },
    { id: 'security', name: t('settings.security'), icon: Shield },
    { id: 'passkeys', name: 'Passkeys', icon: Fingerprint },
    { id: 'notifications', name: t('settings.notifications'), icon: Bell },
    { id: 'privacy', name: t('settings.privacy'), icon: Lock },
  ];

  if (!isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('wallet.connect')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('wallet.connectToAccess')} {t('settings.title').toLowerCase()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('settings.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Gerencie suas preferências e configurações da conta
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <tab.icon className="h-5 w-5" />
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>

            {/* Settings Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3 space-y-6"
            >
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  {/* Wallet Info */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Informações da Carteira
                    </h3>
                    {publicKey && walletType && (
                      <WalletInfo publicKey={publicKey} walletType={walletType} />
                    )}
                  </div>

                  {/* Theme Settings */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      {t('settings.theme')}
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'light', label: t('settings.light'), icon: Sun },
                        { value: 'dark', label: t('settings.dark'), icon: Moon },
                        { value: 'system', label: t('settings.system'), icon: Smartphone },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setTheme(option.value)}
                          className={`flex flex-col items-center space-y-2 p-4 rounded-lg border-2 transition-colors ${
                            theme === option.value
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <option.icon className="h-6 w-6" />
                          <span className="text-sm font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language Settings */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      {t('settings.language')}
                    </h3>
                    <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                      <option value="pt">Português (Brasil)</option>
                      <option value="en">English (US)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Configurações de Segurança
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            Autenticação de Dois Fatores
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Adicione uma camada extra de segurança à sua conta
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.twoFactorAuth}
                            onChange={(e) => updateSetting('twoFactorAuth', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      {/* Passkey Settings */}
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                              <span className="mr-2">🔐</span>
                              Autenticação com Passkeys
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Use impressão digital, Face ID ou chave de segurança
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveTab('passkeys')}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            Gerenciar →
                          </button>
                        </div>
                        
                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          ✨ <strong>Novo!</strong> Mais seguro que senhas tradicionais
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Preferências de Notificação
                    </h3>
                    
                    <div className="space-y-4">
                      {[
                        { key: 'emailNotifications', title: 'Notificações por Email', desc: 'Receba atualizações importantes por email' },
                        { key: 'pushNotifications', title: 'Notificações Push', desc: 'Notificações em tempo real no navegador' },
                        { key: 'scoreUpdates', title: 'Atualizações de Score', desc: 'Seja notificado quando seu score mudar' },
                        { key: 'transactionAlerts', title: 'Alertas de Transação', desc: 'Notificações sobre transações na sua carteira' },
                        { key: 'loanReminders', title: 'Lembretes de Empréstimo', desc: 'Lembretes sobre pagamentos e ofertas' },
                        { key: 'marketNews', title: 'Notícias do Mercado', desc: 'Atualizações sobre o mercado Stellar' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {item.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.desc}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings[item.key as keyof typeof settings] as boolean}
                              onChange={(e) => updateSetting(item.key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Passkey Settings */}
              {activeTab === 'passkeys' && (
                <div className="space-y-6">
                  <PasskeyInfo
                    showAccountInfo={true}
                    onManage={() => {
                      // Lógica para gerenciar passkeys já está no componente
                    }}
                  />
                </div>
              )}

              {/* Privacy Settings */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Configurações de Privacidade
                    </h3>
                    
                    <div className="space-y-4">
                      {[
                        { key: 'dataSharing', title: 'Compartilhamento de Dados', desc: 'Permitir compartilhamento de dados para melhorar o serviço' },
                        { key: 'analytics', title: 'Análises', desc: 'Ajudar a melhorar o produto compartilhando dados de uso' },
                        { key: 'marketing', title: 'Marketing', desc: 'Receber comunicações promocionais' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {item.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.desc}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings[item.key as keyof typeof settings] as boolean}
                              onChange={(e) => updateSetting(item.key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Data Management */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Gerenciamento de Dados
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            Exportar Dados
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Baixe uma cópia de todos os seus dados
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Exportar
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-red-600 dark:text-red-400">
                            Excluir Conta
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Remover permanentemente sua conta e todos os dados
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end">
                <Button className="btn-stellar">
                  <Save className="h-4 w-4 mr-2" />
                  {t('settings.save')}
                </Button>
              </div>
            </motion.div>
          </div>
    </div>
  );
}
