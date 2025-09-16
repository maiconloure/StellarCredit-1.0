import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['pt', 'en'],

  // Used when no locale matches
  defaultLocale: 'pt',

  // Locale detection strategy
  localeDetection: true,
  
  // Localize the pathname for all locales
  localePrefix: 'always'
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
