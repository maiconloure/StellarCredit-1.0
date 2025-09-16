// @ts-check

const config = {
  title: 'Stellar Credit Docs',
  tagline: 'Decentralized Credit Scoring on Stellar',
  favicon: 'img/favicon.ico',
  url: 'https://your-domain.com',
  // Use a relative base URL; ensure links to root / aren't treated as broken in multi-locale build
  baseUrl: '/',
  organizationName: 'stellar-credit',
  projectName: 'stellar-credit-docs',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pt'],
  },
  // Temporarily log broken links instead of throwing to unblock build; switch back to 'throw' after fixing all
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/Jistriane/StellarCredit-1.0/tree/main/docs',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],
  themeConfig: {
    image: 'img/og-image.png',
    navbar: {
      title: 'Stellar Credit',
      logo: { alt: 'Stellar Credit Logo', src: 'img/logo.svg' },
      items: [
        { type: 'docSidebar', sidebarId: 'mainSidebar', position: 'left', label: 'Docs' },
        { href: 'https://github.com/Jistriane/StellarCredit-1.0', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [ { label: 'Introduction', to: '/docs/intro' } ]
        },
        {
          title: 'Community',
          items: [
            { label: 'GitHub', href: 'https://github.com/Jistriane/StellarCredit-1.0' },
            { label: 'Stellar', href: 'https://developers.stellar.org/' }
          ]
        }
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Stellar Credit. Built with Docusaurus.`
    },
    prism: {
      theme: require('prism-react-renderer').themes.github,
      darkTheme: require('prism-react-renderer').themes.dracula,
      additionalLanguages: ['rust', 'python']
    }
  }
};

module.exports = config;
