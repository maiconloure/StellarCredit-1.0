# Backend API Reference

> NOTE: This is a preliminary specification. Align with actual `server.js` implementation.

## Base URL
```
http://localhost:3001
```

## Endpoints
### GET /health
Health/status check.

### GET /score/:wallet
Returns latest score (computes if stale).
Response:
```
{
  "wallet": "G...",
  "score": 712,
  "updatedAt": "2025-09-16T12:30:00Z",
  "breakdown": { "volume": 0.18, ... }
}
```

### GET /transactions/:wallet
Returns summarized transaction history features.

### POST /loan/offer
Request loan offers based on score.
Body:
```
{ "wallet": "G...", "amountRequested": 250 }
```

### POST /loan/accept
Accept previously returned offer.

## WebSocket Events
Channel: `/ws`
Events:
```
score_update { wallet, score }
loan_offer { wallet, offers[] }
```

## Error Format
```
{
  "code": "SCORE_ENGINE_TIMEOUT",
  "message": "AI engine did not respond in time",
  "details": {}
}
```

## Rate Limits (Planned)
- 60 requests / min / IP

## Authentication
- Wallet-based session (future: signature challenge)
