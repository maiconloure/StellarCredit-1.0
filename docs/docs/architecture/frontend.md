# Frontend Architecture

## Stack
- Next.js 14 App Router
- TypeScript
- TailwindCSS
- i18n (custom + JSON message catalogs)
- Wallet integrations & Passkeys

## Key Directories
```
frontend/src/app          # App Router pages per locale
frontend/src/components   # Reusable UI & feature components
frontend/src/hooks        # Custom React hooks (wallet, realtime, AI)
frontend/src/stores       # State stores (credit, passkey, wallet)
frontend/src/messages     # i18n JSON catalogs (en/pt)
```

## Authentication & Wallet Flow
1. User selects wallet provider.
2. Passkey verification (if enabled) invoked.
3. Session/connection state stored in walletStore.
4. Realtime hook subscribes to score updates.

## Real-time Updates
The `useRealTime` hook listens to backend WS endpoints to push:
- Score changes
- Loan offer updates
- Transaction analysis results

## Internationalization
- Language segment in route: `/[locale]/...`
- Fallback to browser detection
- Message catalogs loaded on demand

## Performance Considerations
- Code splitting by route & feature
- Memoized derived values (score indicators)
- Minimal blocking network calls on initial load

## Planned Enhancements
- Dark mode toggle
- PWA offline support
- Analytics opt-in module
