# Setup Guide

## Prerequisites
- Node.js 18+
- Python 3.8+
- Rust toolchain + Soroban CLI
- Git

## Clone Repository
```bash
git clone https://github.com/Jistriane/StellarCredit-1.0.git
cd StellarCredit-1.0
```

## Frontend
```bash
cd frontend
npm install
npm run dev
```
Access: http://localhost:3000

## Backend
```bash
cd backend
npm install
npm run dev
```
Access: http://localhost:3001

## AI Engine
```bash
cd ai-engine
pip install -r requirements.txt
python api_server.py
```
Access: http://localhost:8000

## Smart Contracts
```bash
cd contracts
cargo build
# Deploy (example)
soroban contract deploy --network testnet --source ACCOUNT --wasm target/wasm32-unknown-unknown/release/contract.wasm
```

## Environment Variables
Create `.env` files referencing `backend/env.example`.

## Quick Script
If present: `./init_system.sh` to bootstrap multi-service environment.

---
Next: Wallet Integration Guide.
