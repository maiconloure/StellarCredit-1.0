/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  mainSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/frontend',
        'architecture/backend',
        'architecture/ai-engine',
        'architecture/contracts'
      ]
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/setup',
        'guides/wallets',
        'guides/scoring-algorithm',
        'guides/deployment'
      ]
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/api-backend',
        'reference/api-ai',
        'reference/contract-interface'
      ]
    },
    'roadmap'
  ],
};

module.exports = sidebars;
