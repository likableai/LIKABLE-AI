'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { getTokenBalance, getTokenPrice } from '@/lib/api';
import { Wallet, RefreshCw } from 'lucide-react';

interface TokenBalanceData {
  currentBalance: number;
  depositedAmount: number;
  consumedAmount: number;
  lastUpdated: string;
}

export const TokenBalance: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [balance, setBalance] = useState<TokenBalanceData | null>(null);
  const [tokenPrice, setTokenPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!connected || !publicKey) return;

    setLoading(true);
    try {
      const data = await getTokenBalance(publicKey.toString());
      setBalance(data);
    } catch (error: any) {
      // Silently handle network errors - don't spam console
      if (error?.code !== 'ERR_NETWORK' && error?.message !== 'Network Error') {
        console.error('Failed to fetch balance:', error);
      }
      // Keep previous balance on network errors
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey]);

  const fetchPrice = useCallback(async () => {
    try {
      const data = await getTokenPrice();
      setTokenPrice(data.twapPrice);
    } catch (error: any) {
      // Silently handle network errors - don't spam console
      if (error?.code !== 'ERR_NETWORK' && error?.message !== 'Network Error') {
        console.error('Failed to fetch price:', error);
      }
      // Keep previous price on network errors
    }
  }, []);

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance();
      fetchPrice();

      const interval = setInterval(() => {
        fetchBalance();
        fetchPrice();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [connected, publicKey, fetchBalance, fetchPrice]);

  if (!connected || !publicKey || !balance) {
    return null;
  }

  const usdValue = balance.currentBalance * tokenPrice;

  return (
    <div
      className="card flex flex-col gap-1"
      style={{ 
        fontFamily: "'Times New Roman', Times, serif",
        padding: 'var(--space-1-5) var(--space-2-5)'
      }}
    >
      <div className="flex items-center gap-2">
        <Wallet 
          className="w-4 h-4 flex-shrink-0" 
          style={{ color: 'var(--text)' }}
        />
        <div className="flex items-center gap-2">
          <span 
            className="text-xs font-normal"
            style={{ 
              fontFamily: "'Times New Roman', Times, serif",
              color: 'var(--text)'
            }}
          >
            {balance.currentBalance.toFixed(2)}
          </span>
          <span 
            className="text-xs"
            style={{ 
              fontFamily: "'Times New Roman', Times, serif",
              color: 'var(--text-opacity-60)'
            }}
          >
            tokens
          </span>
        </div>
        {usdValue > 0 && (
          <span 
            className="text-xs"
            style={{ 
              fontFamily: "'Times New Roman', Times, serif",
              color: 'var(--text-opacity-60)'
            }}
          >
            (${usdValue.toFixed(2)})
          </span>
        )}
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="p-0.5 disabled:opacity-40 transition-all flex items-center justify-center ml-0.5 rounded"
          style={{ 
            backgroundColor: 'transparent',
            color: 'var(--text)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          aria-label="Refresh balance"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div 
        className="flex items-center gap-2 text-xs"
        style={{ 
          fontFamily: "'Times New Roman', Times, serif",
          color: 'var(--text-opacity-60)'
        }}
      >
        <span>{balance.consumedAmount.toFixed(2)} used</span>
        <Link 
          href="/dashboard" 
          className="transition-colors"
          style={{ color: 'var(--text-opacity-60)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-opacity-60)'}
        >
          View history
        </Link>
      </div>
    </div>
  );
};
