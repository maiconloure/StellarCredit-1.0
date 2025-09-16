# Scoring Algorithm Guide

## Objective
Produce a transparent, fair, and explainable credit score using only on-chain signals.

## Factors & Weights
| Factor | Weight | Description |
|--------|--------|-------------|
| Transaction Volume | 0.20 | Total XLM volume normalized |
| Payment Timeliness | 0.30 | Ratio on-time vs delayed obligations |
| Usage Frequency | 0.15 | Active days / period |
| Diversity | 0.20 | Distinct counterparties & operation types |
| Average Balance | 0.15 | Smoothed rolling average holdings |

## Normalization
Min-max scaling with clamp 0..1. Edge cases (empty history) produce neutral baseline (e.g., 0.35) to avoid penalizing new users excessively.

## Score Formula
```
score_raw = Σ(weight_i * factor_i_normalized)
score_scaled = round(300 + score_raw * 550)  # Range 300-850
```

## Explainability
Return per-factor contributions and weights for UI visualization.

## Future Enhancements
- Behavior temporal decay
- ML predictive upgrade
- Fraud anomaly signals
- Cross-chain enrichment

---
Next: Deployment Guide.
