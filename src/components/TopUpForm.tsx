'use client';

import React, { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { recordDeposit } from '@/lib/api';
import { Copy } from 'lucide-react';

interface TopUpFormProps {
  walletAddress: string;
  onSuccess?: () => void;
}

function truncateAddress(addr: string, head = 6, tail = 4): string {
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export const TopUpForm: React.FC<TopUpFormProps> = ({
  walletAddress,
  onSuccess,
}) => {
  const [txHash, setTxHash] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const copyAddress = useCallback(() => {
    navigator.clipboard.writeText(walletAddress).then(
      () => toast.success('Address copied'),
      () => toast.error('Failed to copy')
    );
  }, [walletAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = txHash.trim();
    if (!trimmed) {
      setMessage({ type: 'error', text: 'Transaction hash is required.' });
      return;
    }
    const amt = amount.trim() ? parseFloat(amount) : NaN;
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
      setAmount('');
      onSuccess?.();
    } catch (err: any) {
      const data = err?.response?.data;
      const errorMsg =
        data?.error === 'Transaction verification failed'
          ? data?.details ?? data?.error ?? 'Transaction verification failed.'
          : data?.error === 'Transaction has already been processed'
            ? 'This transaction has already been processed.'
            : data?.error ?? err?.message ?? 'Failed to record deposit.';
      setMessage({ type: 'error', text: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
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
          color: 'var(--text-opacity-90)'
        }}
      >
        Top up
      </h3>

      <div 
        className="card mb-4"
        style={{ padding: 'var(--space-3)' }}
      >
        <p 
          className="text-xs mb-2"
          style={{ 
            fontFamily: "'Times New Roman', Times, serif",
            color: 'var(--text-opacity-70)'
          }}
        >
          Receive
        </p>
        <div className="flex items-center gap-3">
          <div 
            className="rounded p-1.5 shrink-0"
            style={{ 
              border: '1px solid var(--border-opacity-10)',
              backgroundColor: 'var(--accent-primary)'
            }}
          >
            <QRCodeSVG value={walletAddress} size={80} level="M" />
          </div>
          <div className="min-w-0 flex-1">
            <p 
              className="text-sm font-mono truncate"
              style={{ 
                fontFamily: "'Times New Roman', Times, serif",
                color: 'var(--text-opacity-80)'
              }}
            >
              {truncateAddress(walletAddress)}
            </p>
            <button
              type="button"
              onClick={copyAddress}
              className="mt-1.5 flex items-center gap-2 text-xs transition-colors"
              style={{ 
                fontFamily: "'Times New Roman', Times, serif",
                color: 'var(--text-opacity-60)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-opacity-60)'}
              aria-label="Copy wallet address"
            >
              <Copy className="w-4 h-4" />
              Copy address
            </button>
          </div>
        </div>
      </div>

      <p 
        className="text-xs mb-4"
        style={{ 
          fontFamily: "'Times New Roman', Times, serif",
          color: 'var(--text-opacity-60)'
        }}
      >
        Receive tokens (e.g. via swap), then paste the transaction hash to
        credit your balance.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            className="block text-xs mb-1"
            style={{ 
              fontFamily: "'Times New Roman', Times, serif",
              color: 'var(--text-opacity-70)'
            }}
          >
            Wallet
          </label>
          <input
            type="text"
            value={walletAddress}
            readOnly
            className="input input-readonly truncate"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          />
        </div>
        <div>
          <label 
            className="block text-xs mb-1"
            style={{ 
              fontFamily: "'Times New Roman', Times, serif",
              color: 'var(--text-opacity-70)'
            }}
          >
            Transaction hash <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <input
            type="text"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="Paste tx signature"
            className="input"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          />
        </div>
        <div>
          <label 
            className="block text-xs mb-1"
            style={{ 
              fontFamily: "'Times New Roman', Times, serif",
              color: 'var(--text-opacity-70)'
            }}
          >
            Amount <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Tokens received"
            className="input"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          />
        </div>
        {message && (
          <p
            className="text-sm"
            style={{ 
              fontFamily: "'Times New Roman', Times, serif",
              color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)'
            }}
          >
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
          {loading ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </div>
  );
};
