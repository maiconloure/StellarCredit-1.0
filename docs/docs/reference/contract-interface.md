# Contract Interface Reference

> Preliminary, sync with actual `contracts/src/*.rs` as implementation matures.

## Loan Functions
### request_loan(wallet, amount)
Returns loan offer if within tier limit.

### accept_loan(loan_id)
Locks in loan and emits event.

### get_active_loans(wallet)
List all active positions.

## Events (Conceptual)
| Event | Payload |
|-------|---------|
| LoanOffered | `{ id, wallet, max_amount, rate_bps }` |
| LoanAccepted | `{ id, wallet, principal }` |
| LoanRepaid | `{ id, wallet, remaining }` |

## Errors
| Code | Description |
|------|-------------|
| LIMIT_EXCEEDED | Amount > allowed by score tier |
| UNKNOWN_LOAN | Loan id not found |
| UNAUTHORIZED | Caller not wallet owner |

## Score Oracle
Backend or off-chain service may push signed score assertions to be verified on-chain (future design).
