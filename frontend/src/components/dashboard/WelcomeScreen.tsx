'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Shield, 
  Globe, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Star,
  Users,
  ArrowRight,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { WalletConnector } from '@/components/wallet/WalletConnector';
import { Logo } from '@/components/ui/Logo';

const features = [
  {
    icon: Zap,
    titleKey: 'features.instant.title',
    descriptionKey: 'features.instant.description',
    color: 'text-yellow-500',
  },
  {
    icon: Shield,
    titleKey: 'features.secure.title',
    descriptionKey: 'features.secure.description',
    color: 'text-green-500',
  },
  {
    icon: Globe,
    titleKey: 'features.global.title',
    descriptionKey: 'features.global.description',
    color: 'text-blue-500',
  },
  {
    icon: TrendingUp,
    titleKey: 'features.transparent.title',
    descriptionKey: 'features.transparent.description',
    color: 'text-purple-500',
  },
];

const stats = [
  { label: 'Score em', value: '30s', icon: Clock },
  { label: '90% mais', value: 'Barato', icon: DollarSign },
  { label: 'Inclusão', value: 'Global', icon: Globe },
  { label: 'Algoritmo', value: 'Aberto', icon: Shield },
];

export function WelcomeScreen() {
  const t = useTranslations();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center space-x-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    <Star className="h-4 w-4" />
                    <span>Powered by Stellar Blockchain</span>
                  </motion.div>
                  
                  <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                    <span className="text-gradient">Score de Crédito</span>
                    <br />
                    Descentralizado
                  </h1>
                  
                  <p className="text-xl text-gray-600 dark:text-gray-300 max-w-lg">
                    Revolucione seu acesso ao crédito com tecnologia blockchain. 
                    Análise instantânea, transparente e inclusiva.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="xl"
                    variant="stellar"
                    onClick={() => setIsWalletModalOpen(true)}
                    className="group"
                  >
                    Conectar Carteira
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                  
                  <Button
                    size="xl"
                    variant="outline"
                    onClick={() => setShowDemo(true)}
                    className="group"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Ver Demo
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="text-center"
                    >
                      <div className="flex justify-center mb-2">
                        <stat.icon className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right side - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative h-96 lg:h-[500px]">
                {/* Main logo with orbital animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="orbital-ring w-64 h-64 lg:w-80 lg:h-80 rounded-full border-2 border-primary-200 dark:border-primary-800">
                      <div className="absolute inset-8 flex items-center justify-center">
                        <Logo 
                          variant="icon" 
                          size="2xl" 
                          animated
                          className="w-32 h-32 lg:w-40 lg:h-40 animate-float"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute top-12 left-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4"
                >
                  <div className="text-2xl font-bold text-green-500">750</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Score</div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                  className="absolute top-24 right-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4"
                >
                  <div className="text-lg font-bold text-blue-500">$1,000</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Disponível</div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, delay: 2 }}
                  className="absolute bottom-16 left-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4"
                >
                  <div className="text-lg font-bold text-purple-500">2.5%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Taxa</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-gradient-to-r from-primary-400/10 to-stellar-400/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-gradient-to-r from-stellar-400/10 to-primary-400/10 blur-2xl" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Por que escolher <span className="text-gradient">StellarCredit</span>?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Nossa plataforma utiliza a tecnologia blockchain Stellar para oferecer 
              uma experiência de crédito completamente nova e revolucionária.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.titleKey}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t(feature.descriptionKey)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center bg-gradient-to-r from-primary-600 to-stellar-600 rounded-2xl p-12 text-white"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para começar?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Conecte sua carteira Stellar e descubra seu score de crédito em apenas 30 segundos. 
              É gratuito e seguro.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="xl"
                variant="secondary"
                onClick={() => setIsWalletModalOpen(true)}
                className="bg-white text-primary-600 hover:bg-gray-100"
              >
                <Users className="mr-2 h-5 w-5" />
                Conectar Carteira
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-primary-600"
              >
                Saiba Mais
              </Button>
            </div>
          </motion.div>
        </div>
      </section>



      {/* Wallet Connector Modal */}
      <WalletConnector
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </div>
  );
}
