# Architecture Overview

Stellar Credit is composed of four primary subsystems orchestrated to deliver real-time decentralized credit scoring.

```mermaid
graph LR;
  A[Frontend (Next.js)] --> B[Backend API (Node.js)]
  B --> C[AI Engine (Python)]
  B --> D[Soroban Contracts (Rust)]
  A --> B
  A --> D
```

## Components
### Frontend (Next.js 14 + TypeScript)
- Wallet connection (Passkeys + multiple Stellar wallets)
- Real-time dashboard & scoring visualization
- Localization (EN/PT)
- Chat interface for AI assistant (Elisa)

### Backend (Node.js / Express)
- REST API gateway
- Orchestrates AI scoring requests
- Interacts with Stellar network & Soroban
- WebSocket/Event streaming (real-time updates)

### AI Engine (Python)
- Score computation service
- Weighted multi-factor model
- Future: ML model training & feature engineering

### Smart Contracts (Soroban / Rust)
- Loan issuance logic
- On-chain state validation
- Trust & auditability layer

## Data Flow
1. User connects wallet via frontend.
2. Backend fetches on-chain history and structures features.
3. AI Engine scores request and returns score & breakdown.
4. Backend persists/logs and emits updates to UI.
5. User triggers loan smart contract interaction.

## Extensibility
- Pluggable scoring features
- Additional locales
- Alternate identity providers

## Non-Functional Goals
| Aspect | Goal |
|--------|------|
| Latency | < 3s scoring round-trip |
| Transparency | Full algorithm documentation |
| Security | Passkeys + minimal secret handling |
| Portability | All services containerizable |
| Observability | Structured logging & metrics roadmap |

---
See detailed component pages next.
