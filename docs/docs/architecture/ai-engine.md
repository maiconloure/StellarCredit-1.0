# AI Engine Architecture

## Stack
- Python 3.x
- FastAPI (inferred) or simple Flask-like server (review api_server.py)
- Custom scoring logic in `stellar_ai_scoring.py`

## Responsibilities
- Compute credit score from feature vector
- Provide explainability (metric contribution breakdown)
- Maintain deterministic weighting (transparent & auditable)

## Scoring Methodology
Weights (current baseline):
- Transaction Volume: 20%
- Payment Timeliness: 30%
- Usage Frequency: 15%
- Transaction Diversity: 20%
- Average Balance: 15%

Raw inputs normalized to 0..1 then weighted sum -> base score (0-850 scaled).

## API (Planned / Typical)
`POST /score`:
```
{
  "wallet": "G...",
  "features": { /* derived feature map */ }
}
```
Response:
```
{
  "wallet": "G...",
  "score": 712,
  "breakdown": { "volume": 0.18, "timeliness": 0.27, ... },
  "weights": { ... },
  "version": "v0.1.0"
}
```

## Extensibility
- Swap static weights for ML model (XGBoost / LightGBM)
- Add temporal decay factors
- Introduce fraud anomaly signals

## Testing Strategy
- Unit tests for feature normalization
- Deterministic scoring snapshot tests
- Edge: empty history, extreme usage, outliers

## Roadmap
- Model registry integration
- A/B scoring experiments
- Feature importance dashboards
