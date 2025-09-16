# AI Engine API Reference

Base URL: `http://localhost:8000`

## POST /score
Compute or recompute score.
Request:
```
{
  "wallet": "G...",
  "features": { /* optional if engine derives */ }
}
```
Response:
```
{
  "wallet": "G...",
  "score": 705,
  "breakdown": { "volume": 0.19, "timeliness": 0.28, ... },
  "weights": { "volume": 0.2, ... },
  "version": "v0.1.0",
  "latencyMs": 842
}
```

## GET /health
Returns status & version.

## Error Responses
| Code | Meaning |
|------|---------|
| INVALID_INPUT | Missing wallet | 
| FEATURE_DERIVATION_FAIL | Upstream feature build error |
| INTERNAL_ERROR | Unexpected exception |

## Performance Targets
- P50 < 1s
- P95 < 2.5s

## Versioning
Include semantic version in response for traceability.
