# Wallet Payment Implementation (LIKA Credits)

This doc describes how the **pay with wallet** flow is implemented so that:

1. **Backend verifies payment on-chain** and issues credits (LIKA balance) for AI usage.
2. **Users approve payment in their wallet** (Phantom, Solflare, etc.) — no custody.
3. **Payments are in LIKA token** only; credits are stored in the backend and spent on chat/voice.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js + Solana Wallet Adapter)                                  │
│  • User connects wallet → enters LIKA amount → "Pay with wallet"              │
│  • Builds SPL transfer: user ATA → treasury ATA (createTransferCheckedInstruction) │
│  • sendTransaction() → wallet popup for approval                              │
│  • Waits for confirmation (poll getSignatureStatus) → POST /api/token/deposit/pay │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Backend (Express)                                                           │
│  POST /api/token/deposit/pay { walletAddress, txHash [, amount] }            │
│  • transactionVerifier.verifyDepositTransaction():                          │
│    - Fetches tx from Solana (commitment: confirmed)                         │
│    - Ensures recipient = treasury ATA, sender = walletAddress, mint = LIKA │
│    - Reads actual amount from chain                                          │
│  • Dedupe: reject if txHash already in TokenBalance.transactions            │
│  • balanceTracker.recordDeposit(walletAddress, verifiedAmount, txHash)     │
│  • Credits = currentBalance += amount; depositedAmount += amount            │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Credits** = `currentBalance` in MongoDB (`TokenBalance`). Chat and voice deduct from this via `balanceTracker.deductTokens()`.
- **LIKA** = SPL token (mint in env); users hold it in their wallet and transfer to the **treasury ATA** to buy credits.

---

## Implementation Checklist (Done Right)

### 1. Backend verifies payment and issues credits

| Requirement | How it’s done |
|-------------|----------------|
| Verify payment on-chain | `transaction-verifier.service.ts`: fetches parsed tx from Solana, finds token transfer to treasury ATA, validates mint, amount, and (for pay flow) sender = `walletAddress`. |
| Use verified amount | Backend uses `verification.actualAmount` from chain (not client-supplied amount) so credits always match what was transferred. |
| Issue credits | `balanceTracker.recordDeposit(walletAddress, amount, txHash)` increases `currentBalance` and `depositedAmount`, appends to `transactions[]`. |
| No double-spend | Before crediting, check `TokenBalance.findOne({ 'transactions.txHash': txHash })`; if found, return “Transaction has already been processed”. |
| Idempotent response | Same txHash twice returns same success/error so client can retry safely. |

### 2. User pays via wallet with approval

| Requirement | How it’s done |
|-------------|----------------|
| Wallet popup for approval | Frontend uses `sendTransaction(tx, connection)` from `@solana/wallet-adapter-react`; the wallet (Phantom, etc.) shows the transfer and user approves/rejects. |
| No custody | Backend never holds private keys; it only verifies after the fact and updates its ledger. |
| Correct recipient | Treasury ATA is derived from `TREASURY_WALLET_ADDRESS` + `TOKEN_MINT_ADDRESS` (backend config); frontend uses same mint and a canonical treasury for display. |
| Confirmation before verify | Frontend waits for confirmation (poll `getSignatureStatus` until `confirmed`/`finalized` or timeout) before calling `recordDepositPay`, to reduce “transaction not found” on backend. |
| Fallback if verify fails | If backend returns an error (e.g. RPC lag), UI keeps the tx hash and offers “Paste tx hash to verify” so the user can retry verification later. |

### 3. Payment in LIKA only

| Requirement | How it’s done |
|-------------|----------------|
| Single token | Backend and frontend use `TOKEN_MINT_ADDRESS` / LIKA mint; verifier rejects if mint in the tx doesn’t match. |
| Transfer type | Frontend builds SPL `transferChecked` (user ATA → treasury ATA) so amount and decimals are checked on-chain. |
| Config from backend | Frontend can use `GET /api/token/config` for treasury ATA and decimals; TopUpForm also derives treasury ATA from canonical treasury + LIKA mint for consistent display. |

---

## Key Files

| Layer | File | Role |
|-------|------|------|
| Frontend | `src/components/TopUpForm.tsx` | Amount input, build transfer, `sendTransaction`, wait for confirmation, `recordDepositPay`, fallback “paste hash” verify. |
| Frontend | `src/lib/api.ts` | `recordDepositPay({ walletAddress, txHash, amount? })`, `getTokenConfig`, `getTokenBalance`. |
| Backend | `likableai-backend/src/api/token.routes.ts` | `POST /deposit/pay`: validate body, verify tx, dedupe, `balanceTracker.recordDeposit`. |
| Backend | `likableai-backend/src/services/solana/transaction-verifier.service.ts` | On-chain verification: recipient, sender (for pay), mint, amount. |
| Backend | `likableai-backend/src/services/solana/balance-tracker.service.ts` | `recordDeposit` (credit user), `deductTokens` (spend on chat/voice), `getBalance`. |
| Backend | `likableai-backend/src/models/TokenBalance.ts` | Schema: walletAddress, currentBalance, depositedAmount, consumedAmount, transactions[]. |

---

## Security and Robustness

- **Never trust client amount for crediting.** Backend always uses the amount parsed from the verified transaction.
- **Rate limit** `POST /api/token/deposit/pay` (e.g. `depositPayRateLimiter`) to avoid RPC abuse and spam.
- **Treasury and mint** must be set in backend env (`TREASURY_WALLET_ADDRESS`, `TOKEN_MINT_ADDRESS`); config endpoint is read-only and doesn’t expose secrets.
- **Duplicate txHash** is rejected; same tx cannot credit twice.
- **Confirmation wait** on the frontend reduces “transaction not found” when the backend fetches the tx; if verification still fails, user can retry with the same hash.

---

## Optional: “Receive elsewhere” and scan

- **POST /api/token/deposit** (body: walletAddress, amount, txHash): for flows where the **user’s wallet** received LIKA (e.g. from a swap). Verifier checks transfer **to** that wallet.
- **POST /api/token/deposit/scan** (body: walletAddress): backend scans the user’s ATA for recent incoming transfers, verifies each, and credits new ones. Useful when the user received LIKA and didn’t use “Pay with wallet”.

The main “pay with wallet” flow uses **POST /api/token/deposit/pay** only (user sends LIKA to treasury; backend verifies treasury received from that user and credits the sender).
