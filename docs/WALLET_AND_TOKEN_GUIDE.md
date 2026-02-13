# Wallet & Token Guide: Using LIKA Without Creator Privileges

## Summary

- **You do NOT need creator privileges to accept any SPL token.** Any project can receive LIKA (or any other token) as payment. Creator privileges on Pump.fun only affect bonding-curve royalties and trading mechanics—not receiving tokens.
- **Treasury = any wallet you control.** Users send LIKA to your treasury’s Associated Token Account (ATA). Standard SPL transfers; no special permissions required.

---

## 1. Where Do the Wallets Come From?

### Backend wallet (BACKEND_WALLET_PRIVATE_KEY)

- **Source:** Loaded in `settlement.service.ts` from `BACKEND_WALLET_PRIVATE_KEY`.
- **Formats:**
  - 12/24-word BIP39 mnemonic → derived with Solana path `m/44'/501'/0'/0'`
  - Base58-encoded 32- or 64-byte secret key
  - JSON array `[1,2,3,...]` or comma-separated bytes
- **Public key:** The address you see in logs like `Backend wallet loaded from mnemonic: 6rKxDxGk…` is this derived public key.

### Treasury wallet (TREASURY_WALLET_ADDRESS)

- **Source:** Set in `.env` as `TREASURY_WALLET_ADDRESS`.
- **Current value:** `Cim3VfDgHk5CQxs8CSH9AJMkQAabRL8uwZtAcS6p7cs` (from PumpPortal’s “Generate” button in pumpfun.md).
- **Role:** Receives LIKA from users. The backend derives the treasury **ATA** from `TREASURY_WALLET + TOKEN_MINT`.

### The “6rKxDxGk…Gy9DPy” address

This could be:

1. **Backend wallet public key** – derived from your mnemonic (if you use mnemonic format).
2. **Connected user wallet** – Phantom/Solflare.
3. **Some other wallet** shown in the UI.

To confirm what your backend wallet is, run:

```bash
cd likableai-backend
pnpm get-treasury-address
```

That prints the backend wallet’s public key (and the treasury ATA if configured). If the script fails, start the backend with `pnpm dev` and check the logs for `Backend wallet loaded from mnemonic: <address>`.

---

## 2. Using LIKA (or Any Token) Without Creator Privileges

You can use any SPL token your company did **not** create. No creator privileges are needed.

| Action                         | Creator required? |
|--------------------------------|-------------------|
| Receive tokens (SPL transfer)  | No                |
| Verify on-chain transfers      | No                |
| Credit users in your app       | No                |
| Pump.fun bonding-curve fees    | Yes               |
| Pump.fun creator royalties     | Yes               |

### Flow

1. User connects a wallet (Phantom, Solflare, etc.).
2. User sends LIKA from their ATA to **your treasury ATA**.
3. Backend verifies the on-chain transfer (mint, amount, recipient).
4. Backend credits the user in your system.

All of this uses standard SPL token transfers. There is no Pump.fun or creator-specific logic.

---

## 3. The Right Setup

### Option A: One wallet for both (recommended)

Use the **backend wallet** as the treasury:

1. If your wallet was created with Solana CLI or older tools, add to `.env`:
   ```
   BACKEND_WALLET_DERIVATION=legacy
   ```
   (Use `legacy` for first-32-bytes-of-seed; use `bip44` for Phantom/Solflare-style mnemonic.)

2. Get the backend wallet public key:
   ```bash
   cd likableai-backend && pnpm get-treasury-address
   ```
3. Set `.env`:
   ```
   TREASURY_WALLET_ADDRESS=<that_public_key>
   ```
4. Restart the backend to apply changes and clear the token config cache.

Benefits:

- One keypair for deposits and settlement.
- You fully control the wallet.
- No dependency on PumpPortal for custody.

### Option B: Dedicated treasury wallet

1. Generate a new keypair:
   ```bash
   # Example with Node:
   node -e "const { Keypair } = require('@solana/web3.js'); const k = Keypair.generate(); console.log('Public:', k.publicKey.toString()); console.log('Private (base58):', require('bs58').encode(k.secretKey));"
   ```
2. Store the private key securely (vault, HSM, etc.).
3. Set:
   ```
   TREASURY_WALLET_ADDRESS=<new_public_key>
   ```

### Option C: PumpPortal wallet

If you use the wallet from PumpPortal (e.g. `Cim3Vf...`):

- You control it if you have the private key.
- It works for receiving LIKA.
- PumpPortal’s API is mainly for trading; receiving deposits does not depend on it.

---

## 4. Required `.env` Values

```
TOKEN_MINT_ADDRESS=8vZfpUYx4SixbDa9gt3sVSnVT5sdvwrb7cERixR1pump   # LIKA
TOKEN_DECIMALS=6
TOKEN_STANDARD=token
TREASURY_WALLET_ADDRESS=<wallet_you_control>   # Your backend or dedicated treasury
BACKEND_WALLET_PRIVATE_KEY=<mnemonic_or_base58>   # For settlement (optional if no settlement)
```

---

## 5. Flow Overview

```
User wallet (Phantom) → SPL transfer → Treasury ATA
                                           ↓
                              Backend verifies on-chain
                                           ↓
                              Backend credits user balance
```

No creator privileges, no Pump.fun-specific calls—only standard SPL transfers and verification.

---

## 6. Credit System (Balance & Access)

**Credits = tokens converted to USD.** User balance is stored in LIKA tokens; cost is calculated in USD and converted to tokens via the token price (TWAP).

| Concept | Implementation |
|--------|----------------|
| **Balance** | `currentBalance` (tokens) in MongoDB |
| **USD value** | `currentBalance × tokenPrice` (from Jupiter TWAP) |
| **Deduction** | Chat: after each message. Voice: on session close (by duration) |
| **Minimum deposit** | `MINIMUM_DEPOSIT_USD` (default $1). User needs `balanceUsd >= min` to access chat/voice |
| **Zero balance** | User sees 0 tokens and cannot use chat/voice until they deposit |

**Chat**: Cost estimated per message (DeepSeek pricing), deducted after response.  
**Voice**: Cost per minute (~$0.033), deducted when session closes.  
**Access gate**: Both chat and voice check `hasMinimumDeposit` and `hasSufficientBalance` before allowing use.
