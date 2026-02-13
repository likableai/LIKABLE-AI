'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferCheckedInstruction } from '@solana/spl-token';
import { Transaction } from '@solana/web3.js';
import { toast } from 'sonner';
import { getTokenConfig, recordDepositPay, recordDeposit } from '@/lib/api';
import type { TokenConfig } from '@/lib/api';
import { Wallet, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const LIKA_MINT = '8vZfpUYx4SixbDa9gt3sVSnVT5sdvwrb7cERixR1pump';
const JUPITER_BUY_LIKA_URL = `https://jup.ag/swap/SOL-${LIKA_MINT}`;

interface TopUpFormProps {
  walletAddress: string;
  onSuccess?: () => void;
}

export const TopUpForm: React.FC<TopUpFormProps> = ({
  walletAddress,
  onSuccess,
}) => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<TokenConfig | null>(null);
  const [onChainBalance, setOnChainBalance] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasteTx, setShowPasteTx] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [pasteAmount, setPasteAmount] = useState('');

  const fetchConfig = useCallback(async () => {
    try {
      const c = await getTokenConfig();
      setConfig(c);
      return c;
    } catch {
      setMessage({ type: 'error', text: 'Could not load token config.' });
      return null;
    }
  }, []);

  const fetchOnChainBalance = useCallback(async () => {
    if (!publicKey || !config) return;
    try {
      const mintPk = new PublicKey(config.tokenMint);
      const userAta = await getAssociatedTokenAddress(mintPk, publicKey);
      const info = await connection.getTokenAccountBalance(userAta);
      const decimals = config.tokenDecimals;
      setOnChainBalance(Number(info.value.amount) / Math.pow(10, decimals));
    } catch {
      setOnChainBalance(0);
    }
  }, [publicKey, config, connection]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (config && publicKey) fetchOnChainBalance();
  }, [config, publicKey, fetchOnChainBalance]);

  const setMaxAmount = useCallback(() => {
    if (onChainBalance != null && onChainBalance > 0) {
      setAmount(String(onChainBalance));
    }
  }, [onChainBalance]);

  const handlePayWithWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = amount.trim() ? parseFloat(amount) : NaN;
    if (isNaN(amt) || amt <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount.' });
      return;
    }
    if (!config || !publicKey || !sendTransaction) {
      setMessage({ type: 'error', text: 'Wallet or config not ready.' });
      return;
    }
    if (onChainBalance != null && amt > onChainBalance) {
      setMessage({ type: 'error', text: 'Insufficient LIKA balance. Buy LIKA first or reduce amount.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const mintPk = new PublicKey(config.tokenMint);
      const treasuryAtaPk = new PublicKey(config.treasuryAta);
      const userAta = await getAssociatedTokenAddress(mintPk, publicKey);
      const decimals = config.tokenDecimals;
      const amountRaw = BigInt(Math.floor(amt * Math.pow(10, decimals)));

      const tx = new Transaction().add(
        createTransferCheckedInstruction(
          userAta,
          mintPk,
          treasuryAtaPk,
          publicKey,
          amountRaw,
          decimals
        )
      );

      const signature = await sendTransaction(tx, connection);
      const confirmed = await connection.confirmTransaction(signature, 'confirmed');
      if (confirmed.value.err) {
        throw new Error('Transaction failed on-chain');
      }

      await recordDepositPay({
        walletAddress: publicKey.toString(),
        amount: amt,
        txHash: signature,
      });

      setMessage({ type: 'success', text: 'Deposit successful. Your balance has been updated.' });
      toast.success(`${amt.toFixed(2)} LIKA deposited.`);
      setAmount('');
      onSuccess?.();
      fetchOnChainBalance();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Transaction failed.';
      const isReject = /reject|denied|cancelled/i.test(msg);
      const text = isReject
        ? 'Transaction was rejected.'
        : msg.includes('Insufficient')
          ? 'Insufficient LIKA balance. Buy LIKA first or reduce amount.'
          : msg;
      setMessage({ type: 'error', text });
      toast.error(text);
    } finally {
      setLoading(false);
    }
  };

  const handlePasteTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = txHash.trim();
    if (!trimmed) {
      setMessage({ type: 'error', text: 'Transaction hash is required.' });
      return;
    }
    const amt = pasteAmount.trim() ? parseFloat(pasteAmount) : NaN;
    if (isNaN(amt) || amt < 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await recordDeposit({
        walletAddress,
        amount: amt,
        txHash: trimmed,
      });
      setMessage({ type: 'success', text: 'Balance credited successfully.' });
      toast.success(`${amt.toFixed(2)} tokens credited.`);
      setTxHash('');
      setPasteAmount('');
      onSuccess?.();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string; details?: string } } })?.response?.data;
      const errorMsg =
        data?.error === 'Transaction verification failed'
          ? data?.details ?? data?.error ?? 'Transaction verification failed.'
          : data?.error === 'Transaction has already been processed'
            ? 'This transaction has already been processed.'
            : data?.error ?? (err as Error)?.message ?? 'Failed to record deposit.';
      setMessage({ type: 'error', text: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const openBuyLika = () => {
    window.open(JUPITER_BUY_LIKA_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="card"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      <h3
        className="text-sm font-medium mb-2"
        style={{
          fontFamily: "'Times New Roman', Times, serif",
          color: 'var(--text-opacity-90)',
        }}
      >
        Top up
      </h3>

      {!config && (
        <p className="text-sm mb-4" style={{ color: 'var(--text-opacity-60)' }}>
          Loading…
        </p>
      )}

      {config && (
        <>
          {onChainBalance !== null && (
            <p
              className="text-xs mb-2"
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                color: 'var(--text-opacity-70)',
              }}
            >
              Wallet LIKA balance: {onChainBalance.toFixed(2)}
            </p>
          )}

          <form onSubmit={handlePayWithWallet} className="space-y-4">
            <div>
              <label
                className="block text-xs mb-1"
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  color: 'var(--text-opacity-70)',
                }}
              >
                Amount (LIKA) <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="input flex-1"
                  style={{ fontFamily: "'Times New Roman', Times, serif" }}
                />
                <button
                  type="button"
                  onClick={setMaxAmount}
                  className="btn-secondary text-xs"
                  style={{ fontFamily: "'Times New Roman', Times, serif" }}
                >
                  Max
                </button>
              </div>
            </div>
            {message && (
              <p
                className="text-sm"
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                }}
              >
                {message.text}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !amount.trim()}
              className="w-full btn-primary flex items-center justify-center gap-2"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              {loading ? 'Processing…' : 'Pay with wallet'}
            </button>
          </form>

          {(onChainBalance === null || onChainBalance === 0) && (
            <button
              type="button"
              onClick={openBuyLika}
              className="w-full btn-secondary mt-3 flex items-center justify-center gap-2"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              Buy LIKA on Jupiter
            </button>
          )}

          <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border-opacity-10)' }}>
            <button
              type="button"
              onClick={() => setShowPasteTx((v) => !v)}
              className="flex items-center gap-2 text-xs w-full justify-between"
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                color: 'var(--text-opacity-60)',
                backgroundColor: 'transparent',
              }}
            >
              <span>I already received LIKA elsewhere (paste tx)</span>
              {showPasteTx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showPasteTx && (
              <form onSubmit={handlePasteTxSubmit} className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-opacity-70)' }}>
                    Transaction hash <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="Paste tx signature"
                    className="input w-full"
                    style={{ fontFamily: "'Times New Roman', Times, serif" }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-opacity-70)' }}>
                    Amount <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={pasteAmount}
                    onChange={(e) => setPasteAmount(e.target.value)}
                    placeholder="Tokens received"
                    className="input w-full"
                    style={{ fontFamily: "'Times New Roman', Times, serif" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-secondary text-sm"
                  style={{ fontFamily: "'Times New Roman', Times, serif" }}
                >
                  {loading ? 'Submitting…' : 'Submit'}
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
};
