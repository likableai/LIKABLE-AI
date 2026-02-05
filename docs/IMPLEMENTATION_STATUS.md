# Implementation Status vs IMPLEMENTATION.md

Reference: [IMPLEMENTATION.md](IMPLEMENTATION.md) (Solana token integration, fee system, dashboard, tracking, top-up).

---

## Voice sessions: user-ended only

**Default behavior**: The **user** always ends the conversation. We never auto-close. No max duration or idle timeout.

- IMPLEMENTATION.md mentions "Visible timer (max 3 min)", "Auto-end session at limit", "Kill idle sessions after 2 minutes", "Limit voice sessions to 3 minutes max". **We do not implement these.** Sessions run until the user disconnects. See [AI.md](AI.md) and [md.md](md.md).

---

## Fee system & Solana wallet payment

| Item | Status | Notes |
|------|--------|------|
| Users pay with Solana wallet | **Done** | Wallet connect; balance per wallet; chat/voice check balance and deduct. |
| Fee system (cost per request) | **Done** | `costCalculator`, `priceOracle` (TWAP); chat/voice estimate cost, check balance, deduct via `balanceTracker`. |
| Token burn / treasury split | **Done** | Settlement flow; 50% burn, 50% treasury. `settlement.service`, `UsageRecord`. |
| Hard stop at insufficient balance | **Done** | Chat and voice return 402 when balance too low. |

**Backend**: `balance-tracker.service`, `price-oracle.service`, `token.routes` (balance, price, stats), `chat.routes`, `voice.routes`.

---

## Tracking & “tokens used” vs “money left”

| Item | Status | Notes |
|------|--------|------|
| Usage tracking (per user/session) | **Done** | `tokenMeter.service`, `UsageRecord`; stored in MongoDB. |
| API: balance (current, deposited, consumed) | **Done** | `GET /api/token/balance/:walletAddress` returns `currentBalance`, `depositedAmount`, `consumedAmount`. |
| API: usage history | **Done** | `GET /api/token/usage-history/:walletAddress`. |
| UI: “money left” (current balance) | **Done** | `TokenBalance` shows `currentBalance` and USD value. |
| UI: “tokens used” (consumed / history) | **Missing** | Balance API has `consumedAmount` and usage-history. `api.ts` exposes `getUsageHistory` and balance includes `consumedAmount`, but no UI displays them. |

**Gap**: Add UI to show tokens used (e.g. `consumedAmount`) and/or usage history (use `getUsageHistory` and render it).

---

## Dashboard

| Item | Status | Notes |
|------|--------|------|
| Dashboard page (`/dashboard`) | **Missing** | IMPLEMENTATION.md expects `/app/dashboard`. App has `/`, `/explorer` only. |
| Usage meter / cost visibility | **Partial** | `TokenBalance` shows balance. No dedicated dashboard with usage stats, cost per message, or history. |

**Gap**: Implement `/dashboard` (or equivalent) with balance, tokens used, usage history, and optionally cost breakdown.

---

## Top-up

| Item | Status | Notes |
|------|--------|------|
| Backend: record deposit | **Done** | `POST /api/token/deposit` (wallet, amount, txHash); on-chain verification via `transactionVerifier`; `balanceTracker.recordDeposit`. |
| Frontend: top-up UI | **Missing** | No deposit/top-up flow. User must (1) send tokens on-chain to deposit address, (2) call backend with `txHash`—but there is no UI for that. |
| `api.ts` deposit / usage-history | **Done** | `recordDeposit` and `getUsageHistory` added to `api.ts`. |

**Gap**: Add top-up UI: show deposit address and/or initiate transfer, then submit `txHash` via `recordDeposit`.

---

## Summary

- **Done**: Fee system, Solana wallet payment, balance checks, deduct on use, usage tracking, usage-history and deposit APIs, TokenBalance (“money left”).
- **Missing**: Dashboard (`/dashboard`), top-up UI, and UI for usage-history + “tokens used” (API helpers `recordDeposit` and `getUsageHistory` exist in `api.ts`).
