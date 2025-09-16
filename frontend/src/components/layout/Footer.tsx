'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/routing';
import { Github, Twitter, Globe, MessageCircle, BookOpen, Zap } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export function Footer() {
  const t = useTranslations('footer');

  const socialLinks = [
    {
      name: 'GitHub',
      href: 'https://github.com/stellar-credit',
      icon: Github,
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com/stellarcredit',
      icon: Twitter,
    },
    {
      name: 'Discord',
      href: 'https://discord.gg/stellarcredit',
      icon: MessageCircle,
    },
  ];

  const footerLinks = [
    {
      title: t('about'),
      links: [
        { name: t('about'), href: '/about' },
        { name: t('blog'), href: '/blog' },
        { name: t('community'), href: '/community' },
        { name: t('status'), href: '/status' },
      ],
    },
    {
      title: t('support'),
      links: [
        { name: t('documentation'), href: '/docs' },
        { name: t('api'), href: '/api' },
        { name: t('support'), href: '/support' },
        { name: t('contact'), href: '/contact' },
      ],
    },
    {
      title: t('privacy'),
      links: [
        { name: t('privacy'), href: '/privacy' },
        { name: t('terms'), href: '/terms' },
        { name: 'Cookie Policy', href: '/cookies' },
        { name: 'Security', href: '/security' },
      ],
    },
  ];

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-border/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand section */}
            <div className="lg:col-span-1">
              <div className="mb-4">
                <Logo 
                  variant="full" 
                  size="lg" 
                  className="mb-4"
                />
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
                Revolucionando o sistema de crédito tradicional com tecnologia blockchain. 
                Análise instantânea, transparente e inclusiva.
              </p>

              {/* Social links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <span className="sr-only">{social.name}</span>
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Footer links */}
            {footerLinks.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom section */}
        <div className="py-6 border-t border-border/40">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('copyright')}
            </div>

            {/* Powered by Stellar */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>{t('poweredBy')}</span>
              <div className="flex items-center space-x-1">
                <Zap className="h-4 w-4 text-primary-500" />
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  Stellar
                </span>
              </div>
            </div>

            {/* Network status indicator */}
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Testnet Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-gradient-to-r from-primary-500/5 to-stellar-500/5 blur-2xl" />
        <div className="absolute bottom-0 right-1/4 h-24 w-24 rounded-full bg-gradient-to-r from-stellar-500/5 to-primary-500/5 blur-xl" />
      </div>
    </footer>
  );
}
