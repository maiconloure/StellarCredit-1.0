# Deployment Guide

## Targets
- GitHub Pages (Docs)
- Vercel (Frontend)
- Render/Fly/Heroku (Backend & AI) or containers
- Stellar Testnet/Mainnet

## Docs Deployment (GitHub Pages)
In `docs/package.json` the `deploy` script uses Docusaurus default. Configure:
1. Set `url` + `baseUrl` in `docusaurus.config.js`.
2. Ensure repository has Pages enabled.
3. Run:
```bash
cd docs
npm install
npm run build
npm run deploy
```

## Frontend (Vercel)
- Import repo in Vercel
- Root: `frontend`
- Build: `npm run build`
- Output: `.next`
- Env vars: NEXT_PUBLIC_* tokens

## Backend
Container example Dockerfile (future) or run process manager (PM2). Ensure CORS + rate limits.

## AI Engine
- Expose HTTP port 8000
- Add health endpoint
- Containerize with slim Python base.

## Soroban Contracts
1. Audit code
2. Deploy to Testnet
3. Run integration tests
4. Deploy to Mainnet with version tag

## Secrets & Config
Use environment variables. Avoid committing private keys. Provide sample `.env.example` updates.

## Monitoring & Logs
- Centralize logs (JSON)
- Add uptime ping checks
- Plan metrics integration (Prometheus / OpenTelemetry)

---
Deployment complete.
