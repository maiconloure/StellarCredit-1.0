# Backend Architecture

## Stack
- Node.js + Express
- Stellar SDK
- WebSocket service
- Service-oriented modules: aiService, stellarService, contractService

## Responsibilities
- Aggregate wallet transaction history
- Transform features for AI scoring
- Proxy scoring requests to Python engine
- Expose REST endpoints & WebSocket channels
- Interact with Soroban smart contracts

## Module Overview
| Module | Purpose |
|--------|---------|
| middleware/auth.js | Auth & wallet validation |
| services/aiService.js | Interface to AI Engine API |
| services/stellarService.js | Blockchain data retrieval |
| services/contractService.js | Soroban contract interactions |
| services/websocketService.js | Pub/sub real-time push |

## Request Flow (Score)
1. Frontend calls `/score/:wallet`.
2. Backend retrieves raw tx history via stellarService.
3. Features derived & normalized.
4. aiService calls Python engine `/score` endpoint.
5. Response cached/emitted to WebSocket subscribers.

## Error Handling Strategy
- Structured JSON errors `{ code, message, details }`
- Graceful degradation when AI engine unavailable (fallback message)

## Security Considerations
- Input validation middleware
- Rate limiting recommended (future)
- No private keys stored server-side

## Observability Roadmap
- Add request ID correlation
- Metrics: scoring latency, tx fetch time
- Log levels via utils/logger.js

## Scaling
- Stateless horizontal scaling behind load balancer
- WebSockets: consider external pub/sub (Redis) when scaling out
