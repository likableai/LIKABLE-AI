'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getTokenBalance, getTokenPrice } from '@/lib/api';
import { Wallet, RefreshCw, LayoutDashboard, LogOut } from 'lucide-react';

interface TokenBalanceData {
  currentBalance: number;
  depositedAmount: number;
  consumedAmount: number;
  lastUpdated: string;
}

export const TokenBalance: React.FC = () => {
  const router = useRouter();
  const { connected, publicKey, disconnect } = useWallet();
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

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    disconnect().catch(() => {});
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push('/dashboard')}
      onKeyDown={(e) => e.key === 'Enter' && router.push('/dashboard')}
      className="card flex flex-col gap-1 cursor-pointer transition-opacity hover:opacity-90"
      style={{ 
        fontFamily: "'Times New Roman', Times, serif",
        padding: 'var(--space-1-5) var(--space-2-5)'
      }}
      aria-label="Go to dashboard"
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
          onClick={(e) => {
            e.stopPropagation();
            fetchBalance();
          }}
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
        className="flex items-center gap-3 text-xs flex-wrap"
        style={{ 
          fontFamily: "'Times New Roman', Times, serif",
          color: 'var(--text-opacity-60)'
        }}
      >
        <span>{balance.consumedAmount.toFixed(2)} used</span>
        <Link 
          href="/dashboard" 
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 transition-colors"
          style={{ color: 'var(--text-opacity-60)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-opacity-60)'}
        >
          <LayoutDashboard className="w-3 h-3" />
          Dashboard
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1 transition-colors bg-transparent border-none p-0 cursor-pointer"
          style={{ 
            fontFamily: "'Times New Roman', Times, serif",
            color: 'var(--text-opacity-60)',
            fontSize: 'inherit'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-opacity-60)';
          }}
          aria-label="Log out"
        >
          <LogOut className="w-3 h-3" />
          Logout
        </button>
      </div>
    </div>
  );
};
