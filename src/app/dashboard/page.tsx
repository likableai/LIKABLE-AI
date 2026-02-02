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
        <div className="container-padding flex flex-col items-center justify-center page-title-area" style={{ minHeight: '60vh' }}>
          <h1 className="page-title mb-4">Dashboard</h1>
          <p className="page-subtitle mb-6 text-center max-w-md">
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
      <div className="container-padding mx-auto" style={{ maxWidth: 'var(--content-max-width)' }}>
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between section-spacing" style={{ gap: 'var(--space-4)' }}>
          <h1 className="page-title">Dashboard</h1>
          <div className="flex items-center gap-3" style={{ gap: 'var(--space-3)' }}>
            <WalletButton />
            <button
              onClick={() => setRefreshTrigger((n) => n + 1)}
              disabled={loading}
              className="btn-secondary btn-sm flex items-center gap-2"
              style={{ gap: 'var(--space-2)' }}
              aria-label="Refresh data"
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} style={{ width: 'var(--icon-md)', height: 'var(--icon-md)' }} />
              Refresh
            </button>
          </div>
        </header>

        {/* Balance Cards Section */}
        <section className="grid gap-6 md:grid-cols-2 section-spacing" style={{ gap: 'var(--space-6)' }}>
          <div className="card">
            <h3 className="section-title mb-2">Balance</h3>
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
        <section className="section-spacing">
          <UsageHistory walletAddress={publicKey.toString()} limit={50} />
        </section>

        {/* Top Up Section */}
        <section>
          <div
            className="card mb-4 flex flex-wrap items-center gap-4"
            style={{ padding: 'var(--space-3) var(--space-4)', gap: 'var(--space-4)' }}
          >
            <label className="flex items-center gap-2 cursor-pointer text-primary" style={{ gap: 'var(--space-2)', color: 'var(--text-opacity-90)' }}>
              <input
                type="checkbox"
                checked={autoDetect}
                onChange={(e) => handleAutoDetectChange(e.target.checked)}
                className="rounded input"
                style={{ borderColor: 'var(--border-opacity-20)', backgroundColor: 'var(--bg-opacity-5)' }}
                aria-label="Auto-detect deposits"
              />
              <span className="section-title text-sm">Auto-detect deposits</span>
            </label>
            <button
              type="button"
              onClick={() => runScan()}
              disabled={scanning}
              className="btn-secondary flex items-center gap-2 text-sm"
              style={{ gap: 'var(--space-2)' }}
              aria-label="Check for deposits"
            >
              {scanning ? (
                <Loader2 className="animate-spin" style={{ width: 'var(--icon-md)', height: 'var(--icon-md)' }} />
              ) : (
                <Search style={{ width: 'var(--icon-md)', height: 'var(--icon-md)' }} />
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
        <footer className="text-center section-spacing">
          <Link href="/" className="text-muted text-sm transition-colors hover:text-primary">
            Back to voice companion
          </Link>
        </footer>
      </div>
    </AppLayout>
  );
}
