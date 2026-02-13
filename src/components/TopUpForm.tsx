'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { getTokenConfig, recordDepositPay, recordDeposit } from '@/lib/api';
import type { TokenConfig } from '@/lib/api';
import { Copy, Loader2, ChevronDown, ChevronUp, Wallet } from 'lucide-react';

const LIKA_MINT = '8vZfpUYx4SixbDa9gt3sVSnVT5sdvwrb7cERixR1pump';
/** Canonical treasury wallet — used for pay URL and derived ATA so UI is correct even if backend env is wrong. */
const TREASURY_WALLET = '8D54gMG6F4WyYdAYqt8fdcsGJasWEMuayqs6CSPg9SoF';
const PUMP_BUY_LIKA_URL = `https://amm.pump.fun/swap?outputMint=${LIKA_MINT}`;

function truncateAddress(addr: string, head = 8, tail = 6): string {
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

interface TopUpFormProps {
  walletAddress: string;
  onSuccess?: () => void;
}

export const TopUpForm: React.FC<TopUpFormProps> = ({
  walletAddress,
  onSuccess,
}) => {
  const { publicKey } = useWallet();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<TokenConfig | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [txHash, setTxHash] = useState('');
  const [showReceiveElsewhere, setShowReceiveElsewhere] = useState(false);
  const [receiveTxHash, setReceiveTxHash] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');

  /** Treasury ATA derived from canonical treasury wallet + LIKA mint (so dashboard shows correct address). */
  const treasuryAtaDisplay = useMemo(() => {
    try {
      return getAssociatedTokenAddressSync(
        new PublicKey(LIKA_MINT),
        new PublicKey(TREASURY_WALLET)
      ).toString();
    } catch {
      return null;
    }
  }, []);

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

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const copyTreasuryAddress = useCallback(() => {
    const toCopy = treasuryAtaDisplay ?? config?.treasuryAta;
    if (!toCopy) return;
    navigator.clipboard.writeText(toCopy).then(
      () => toast.success('Treasury address copied'),
      () => toast.error('Failed to copy')
    );
  }, [treasuryAtaDisplay, config?.treasuryAta]);

  /** Open wallet via Solana Pay URL. Uses canonical treasury so it works even if backend config is wrong. */
  const handlePayWithWallet = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = amount.trim() ? parseFloat(amount) : NaN;
    if (isNaN(amt) || amt <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount.' });
      return;
    }
    const params = new URLSearchParams({
      amount: String(amt),
      'spl-token': LIKA_MINT,
      label: 'Likable AI',
      message: 'Top up balance',
    });
    const url = `solana:${TREASURY_WALLET}?${params.toString()}`;
    toast.info('Opening wallet…');
    const a = document.createElement('a');
    a.href = url;
    a.rel = 'noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleVerifyTxHash = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = txHash.trim();
    if (!trimmed) {
      setMessage({ type: 'error', text: 'Transaction hash is required.' });
      return;
    }
    if (!publicKey) {
      setMessage({ type: 'error', text: 'Connect your wallet first.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await recordDepositPay({
        walletAddress: publicKey.toString(),
        txHash: trimmed,
      });
      setMessage({ type: 'success', text: 'Deposit verified. Your balance has been updated.' });
      toast.success('Balance credited.');
      setTxHash('');
      onSuccess?.();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string; details?: string } } })?.response?.data;
      const errorMsg =
        data?.error === 'Transaction verification failed'
          ? data?.details ?? data?.error ?? 'Transaction verification failed.'
          : data?.error === 'Transaction has already been processed'
            ? 'This transaction has already been processed.'
            : data?.error ?? (err as Error)?.message ?? 'Failed to verify deposit.';
      setMessage({ type: 'error', text: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasteTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = receiveTxHash.trim();
    if (!trimmed) {
      setMessage({ type: 'error', text: 'Transaction hash is required.' });
      return;
    }
    const amt = receiveAmount.trim() ? parseFloat(receiveAmount) : NaN;
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
      setReceiveTxHash('');
      setReceiveAmount('');
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
    window.open(PUMP_BUY_LIKA_URL, '_blank', 'noopener,noreferrer');
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

      {!config && !treasuryAtaDisplay && (
        <p className="text-sm mb-4" style={{ color: 'var(--text-opacity-60)' }}>
          Loading…
        </p>
      )}

      {(config || treasuryAtaDisplay) && (
        <>
          <form onSubmit={handlePayWithWallet} className="space-y-4 mb-4">
            <p
              className="text-xs mb-2"
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                color: 'var(--text-opacity-70)',
              }}
            >
              Pay with wallet
            </p>
            <p
              className="text-xs mb-2"
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                color: 'var(--text-opacity-60)',
              }}
            >
              Enter amount and click Pay with wallet. Your wallet opens to approve—no RPC or passphrase here. After sending, paste the transaction hash below to credit your balance.
            </p>
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
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="input w-full"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              />
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
              disabled={!amount.trim()}
              className="w-full btn-primary flex items-center justify-center gap-2"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              <Wallet className="w-4 h-4" />
              Pay with wallet
            </button>
          </form>

          <div className="mb-4 pt-3 border-t" style={{ borderColor: 'var(--border-opacity-10)' }}>
            <p className="text-xs mb-2" style={{ color: 'var(--text-opacity-60)' }}>
              Already sent? Paste the transaction hash to verify and credit.
            </p>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono truncate flex-1" style={{ color: 'var(--text-opacity-70)' }}>
                {truncateAddress(treasuryAtaDisplay ?? config?.treasuryAta ?? '')}
              </span>
              <button
                type="button"
                onClick={copyTreasuryAddress}
                className="flex items-center gap-1.5 text-xs btn-secondary"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
                aria-label="Copy treasury address"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>

          <form onSubmit={handleVerifyTxHash} className="space-y-4">
            <div>
              <label
                className="block text-xs mb-1"
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  color: 'var(--text-opacity-70)',
                }}
              >
                Transaction hash <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Paste tx signature after sending"
                className="input w-full"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              />
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
              disabled={loading || !txHash.trim()}
              className="w-full btn-primary flex items-center justify-center gap-2"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {loading ? 'Verifying…' : 'Verify and credit'}
            </button>
          </form>

          <p className="text-xs mt-3" style={{ color: 'var(--text-opacity-60)' }}>
            Don’t have LIKA?{' '}
            <button
              type="button"
              onClick={openBuyLika}
              className="underline focus:outline-none"
              style={{ color: 'var(--accent-primary)' }}
            >
              Buy LIKA on Pump.fun
            </button>
          </p>

          <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border-opacity-10)' }}>
            <button
              type="button"
              onClick={() => setShowReceiveElsewhere((v) => !v)}
              className="flex items-center gap-2 text-xs w-full justify-between"
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                color: 'var(--text-opacity-60)',
                backgroundColor: 'transparent',
              }}
            >
              <span>I received LIKA into my wallet (e.g. from swap)</span>
              {showReceiveElsewhere ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showReceiveElsewhere && (
              <form onSubmit={handlePasteTxSubmit} className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-opacity-70)' }}>
                    Transaction hash <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={receiveTxHash}
                    onChange={(e) => setReceiveTxHash(e.target.value)}
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
                    value={receiveAmount}
                    onChange={(e) => setReceiveAmount(e.target.value)}
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
