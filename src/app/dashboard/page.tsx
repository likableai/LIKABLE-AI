'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { UsageSummary } from '@/components/UsageSummary';
import { UsageHistory } from '@/components/UsageHistory';
import { TopUpForm } from '@/components/TopUpForm';
import { getTokenBalance, getTokenPrice, scanDeposits } from '@/lib/api';
import { WalletButton } from '@/components/WalletButton';
import { RefreshCw, Search, Loader2 } from 'lucide-react';

const AUTO_DETECT_KEY = 'autoDetectDeposits';
const SCAN_INTERVAL_MS = 45_000;

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const [balance, setBalance] = useState<{
    currentBalance: number;
    depositedAmount: number;
    consumedAmount: number;
  } | null>(null);
  const [tokenPrice, setTokenPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [autoDetect, setAutoDetect] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isScanningRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!connected || !publicKey) return;
    setLoading(true);
    try {
      const [bal, price] = await Promise.all([
        getTokenBalance(publicKey.toString()),
        getTokenPrice(),
      ]);
      setBalance(bal);
      setTokenPrice(price.twapPrice ?? 0);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code !== 'ERR_NETWORK' && err?.message !== 'Network Error') {
        console.error('Dashboard fetch error:', e);
      }
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTO_DETECT_KEY);
      setAutoDetect(raw === 'true');
    } catch {
      setAutoDetect(false);
    }
  }, []);

  const runScan = useCallback(async () => {
    if (!publicKey || isScanningRef.current) return;
    isScanningRef.current = true;
    setScanning(true);
    try {
      const res = await scanDeposits(publicKey.toString());
      if (res.credited.length > 0) {
        const total = res.credited.reduce((s, c) => s + c.amount, 0);
        toast.success(`${total.toFixed(2)} tokens credited.`);
        setRefreshTrigger((n) => n + 1);
      }
    } catch (e: any) {
      if (e?.code !== 'ERR_NETWORK' && e?.message !== 'Network Error') {
        toast.error(e?.response?.data?.error ?? 'Failed to scan deposits.');
      }
    } finally {
      isScanningRef.current = false;
      setScanning(false);
    }
  }, [publicKey]);

  useEffect(() => {
    if (!autoDetect || !publicKey) {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      return;
    }
    runScan();
    const tick = () => runScan();
    scanIntervalRef.current = setInterval(tick, SCAN_INTERVAL_MS);
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [autoDetect, publicKey, runScan]);

  const handleAutoDetectChange = useCallback((on: boolean) => {
    setAutoDetect(on);
    try {
      localStorage.setItem(AUTO_DETECT_KEY, String(on));
    } catch {
      /* ignore */
    }
  }, []);

  const handleTopUpSuccess = useCallback(() => {
    setRefreshTrigger((n) => n + 1);
  }, []);

  if (!connected || !publicKey) {
    return (
      <AppLayout>
        <div 
          className="container-padding flex flex-col items-center justify-center"
          style={{ minHeight: '60vh' }}
        >
          <h1
            className="mb-4"
            style={{ 
              color: 'var(--text)', 
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 'var(--font-3xl)'
            }}
          >
            Dashboard
          </h1>
          <p
            className="mb-6 text-center max-w-md"
            style={{ 
              color: 'var(--text-secondary)', 
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 'var(--font-base)'
            }}
          >
            Connect your wallet to view balance, usage, and top up.
          </p>
          <WalletButton />
        </div>
      </AppLayout>
    );
  }

  const usdValue = balance ? balance.currentBalance * tokenPrice : 0;

  return (
    <AppLayout>
      <div className="container-padding max-w-4xl mx-auto">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1
            className="font-bold"
            style={{ 
              color: 'var(--text)', 
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 'var(--font-3xl)'
            }}
          >
            Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <WalletButton />
            <button
              onClick={() => setRefreshTrigger((n) => n + 1)}
              disabled={loading}
              className="btn-secondary btn-sm flex items-center gap-2"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
              aria-label="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        {/* Balance Cards Section */}
        <section className="grid gap-6 md:grid-cols-2 mb-8">
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
              Balance
            </h3>
            {loading && !balance ? (
              <p style={{ color: 'var(--text-opacity-60)' }}>Loading…</p>
            ) : balance ? (
              <>
                <p 
                  className="text-lg font-normal"
                  style={{ color: 'var(--text)' }}
                >
                  {balance.currentBalance.toFixed(2)}{' '}
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--text-opacity-60)' }}
                  >
                    tokens
                  </span>
                </p>
                {usdValue > 0 && (
                  <p 
                    className="mt-0.5 text-sm"
                    style={{ color: 'var(--text-opacity-60)' }}
                  >
                    ≈ ${usdValue.toFixed(2)}
                  </p>
                )}
                <p 
                  className="mt-2 text-xs"
                  style={{ color: 'var(--text-opacity-50)' }}
                >
                  Deposited: {balance.depositedAmount.toFixed(2)} tokens
                </p>
              </>
            ) : (
              <p style={{ color: 'var(--text-opacity-60)' }}>—</p>
            )}
          </div>
          {balance && (
            <UsageSummary
              consumedAmount={balance.consumedAmount}
              tokenPrice={tokenPrice}
            />
          )}
        </section>

        {/* Usage History Section */}
        <section className="mb-8">
          <UsageHistory walletAddress={publicKey.toString()} limit={50} />
        </section>

        {/* Top Up Section */}
        <section>
          <div
            className="card mb-4 flex flex-wrap items-center gap-4"
            style={{ 
              fontFamily: "'Times New Roman', Times, serif",
              padding: 'var(--space-3) var(--space-4)'
            }}
          >
            <label 
              className="flex items-center gap-2 cursor-pointer"
              style={{ color: 'var(--text-opacity-90)' }}
            >
              <input
                type="checkbox"
                checked={autoDetect}
                onChange={(e) => handleAutoDetectChange(e.target.checked)}
                className="rounded"
                style={{ 
                  borderColor: 'var(--border-opacity-20)',
                  backgroundColor: 'var(--bg-opacity-5)'
                }}
                aria-label="Auto-detect deposits"
              />
              <span 
                className="text-sm"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                Auto-detect deposits
              </span>
            </label>
            <button
              type="button"
              onClick={() => runScan()}
              disabled={scanning}
              className="btn-secondary flex items-center gap-2 text-sm"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
              aria-label="Check for deposits"
            >
              {scanning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Check for deposits
            </button>
          </div>
          <TopUpForm
            walletAddress={publicKey.toString()}
            onSuccess={handleTopUpSuccess}
          />
        </section>

        {/* Footer Navigation */}
        <footer className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm transition-colors"
            style={{ 
              fontFamily: "'Times New Roman', Times, serif",
              color: 'var(--text-opacity-60)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-opacity-60)'}
          >
            Back to voice companion
          </Link>
        </footer>
      </div>
    </AppLayout>
  );
}
