# Wallet Integration Guide

## Supported Wallets (Planned / Current)
- Freighter
- Albedo
- Rabet
- xBull
- LOBSTR
- WalletConnect compatible
- Passkey backed identity

## Flow
1. User chooses wallet provider.
2. App requests public key & network (Testnet/Mainnet).
3. Optional passkey auth challenge.
4. Store session (no private keys kept).

## Passkeys
- WebAuthn-based
- Enhances UX (biometric / device secure element)
- Fallback to traditional wallet sign when unavailable

## Adding a New Wallet
1. Abstract provider adapter.
2. Implement connect(), sign(), getPublicKey().
3. Register in wallet selector UI.

## Security Best Practices
- Never log secrets
- Validate network passively (avoid malicious endpoints)
- Use HTTPS only in production

---
Next: Scoring Algorithm Guide.
