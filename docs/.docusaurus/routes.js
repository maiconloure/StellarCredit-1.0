import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/pt/docs',
    component: ComponentCreator('/pt/docs', '6d6'),
    routes: [
      {
        path: '/pt/docs',
        component: ComponentCreator('/pt/docs', '3f9'),
        routes: [
          {
            path: '/pt/docs',
            component: ComponentCreator('/pt/docs', '3d6'),
            routes: [
              {
                path: '/pt/docs/architecture/ai-engine',
                component: ComponentCreator('/pt/docs/architecture/ai-engine', 'e55'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/pt/docs/architecture/backend',
                component: ComponentCreator('/pt/docs/architecture/backend', 'fe8'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/pt/docs/architecture/contracts',
                component: ComponentCreator('/pt/docs/architecture/contracts', '02f'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/pt/docs/architecture/frontend',
                component: ComponentCreator('/pt/docs/architecture/frontend', '9ef'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/pt/docs/architecture/overview',
                component: ComponentCreator('/pt/docs/architecture/overview', 'cff'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/pt/docs/guides/deployment',
                component: ComponentCreator('/pt/docs/guides/deployment', '0f4'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/pt/docs/guides/scoring-algorithm',
                component: ComponentCreator('/pt/docs/guides/scoring-algorithm', 'ba3'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/pt/docs/guides/setup',
                component: ComponentCreator('/pt/docs/guides/setup', '881'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/pt/docs/guides/wallets',
                component: ComponentCreator('/pt/docs/guides/wallets', '64c'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/pt/docs/intro',
                component: ComponentCreator('/pt/docs/intro', '304'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/pt/docs/reference/api-ai',
                component: ComponentCreator('/pt/docs/reference/api-ai', 'ece'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/pt/docs/reference/api-backend',
                component: ComponentCreator('/pt/docs/reference/api-backend', '932'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/pt/docs/reference/contract-interface',
                component: ComponentCreator('/pt/docs/reference/contract-interface', 'fd3'),
                exact: true,
                sidebar: "mainSidebar"
              },
              {
                path: '/pt/docs/roadmap',
                component: ComponentCreator('/pt/docs/roadmap', '855'),
                exact: true,
                sidebar: "mainSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/pt/',
    component: ComponentCreator('/pt/', '23f'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
