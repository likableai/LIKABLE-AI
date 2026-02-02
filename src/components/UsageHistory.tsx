'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getUsageHistory } from '@/lib/api';

export interface UsageRecord {
  _id?: string;
  walletAddress: string;
  requestType: 'chat' | 'voice';
  usdCost: number;
  tokenPrice: number;
  tokensBurned: number;
  timestamp: string;
  metadata?: { requestId?: string; duration?: number; model?: string };
}

interface UsageHistoryProps {
  walletAddress: string;
  limit?: number;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export const UsageHistory: React.FC<UsageHistoryProps> = ({
  walletAddress,
  limit = 50,
}) => {
  const [history, setHistory] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUsageHistory(walletAddress, limit);
      setHistory(data.history ?? []);
    } catch (e: any) {
      if (e?.code !== 'ERR_NETWORK' && e?.message !== 'Network Error') {
        console.error('Failed to fetch usage history:', e);
      }
      setError('Could not load usage history.');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (loading) {
    return (
      <div
        className="card text-center"
        style={{ 
          fontFamily: "'Times New Roman', Times, serif",
          color: 'var(--text-opacity-60)',
          padding: 'var(--space-6) var(--space-4)'
        }}
      >
        Loading usage history…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="card text-center"
        style={{ 
          fontFamily: "'Times New Roman', Times, serif",
          color: 'var(--color-error-light)',
          padding: 'var(--space-6) var(--space-4)'
        }}
      >
        {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div
        className="card text-center"
        style={{ 
          fontFamily: "'Times New Roman', Times, serif",
          color: 'var(--text-opacity-60)',
          padding: 'var(--space-6) var(--space-4)'
        }}
      >
        No usage history yet.
      </div>
    );
  }

  return (
    <div
      className="card overflow-hidden"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      <div 
        className="px-4 py-3 border-b"
        style={{ borderColor: 'var(--border-opacity-10)' }}
      >
        <h3 
          className="text-sm font-medium"
          style={{ 
            fontFamily: "'Times New Roman', Times, serif",
            color: 'var(--text-opacity-90)'
          }}
        >
          Usage history
        </h3>
      </div>
      <div className="overflow-x-auto max-h-64 overflow-y-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Tokens</th>
              <th>USD</th>
            </tr>
          </thead>
          <tbody>
            {history.map((r, i) => (
              <tr key={r._id ?? i}>
                <td style={{ color: 'var(--text-opacity-70)' }}>{formatDate(r.timestamp)}</td>
                <td className="capitalize" style={{ color: 'var(--text-opacity-90)' }}>{r.requestType}</td>
                <td style={{ color: 'var(--text-opacity-90)' }}>{r.tokensBurned.toFixed(2)}</td>
                <td style={{ color: 'var(--text-opacity-90)' }}>${r.usdCost.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
