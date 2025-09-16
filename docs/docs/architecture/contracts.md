# Smart Contracts (Soroban)

## Purpose
Soroban contracts implement enforceable logic for loan offers, issuance, and (future) repayment tracking with transparency on Stellar.

## Technology
- Rust
- Soroban SDK

## Responsibilities
- Validate loan request parameters
- Record issuance events
- Enforce credit limit thresholds (based on score tier)
- (Future) Manage repayment schedule & penalties

## Interface (Conceptual)
```
fn request_loan(env: Env, wallet: Address, amount: i128) -> Result<LoanOffer, Error>
fn accept_loan(env: Env, wallet: Address, loan_id: u64) -> Result<(), Error>
fn get_active_loans(env: Env, wallet: Address) -> Vec<LoanPosition>
```

## Data Structures
```
struct LoanOffer { id, max_amount, rate_bps, expiry }
struct LoanPosition { id, principal, rate_bps, start_ts, status }
```

## Security Considerations
- Input bounds checking
- Replay protection via sequence numbers
- Score verification (oracle / off-chain feed?)

## Deployment
Testnet first, then audited path to Mainnet.

## Roadmap
- Collateralization module
- Delinquency flagging
- Reputation NFT / Soulbound token
