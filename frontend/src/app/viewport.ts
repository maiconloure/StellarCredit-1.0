import { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1890ff' },
    { media: '(prefers-color-scheme: dark)', color: '#0ea5e9' },
  ],
};
