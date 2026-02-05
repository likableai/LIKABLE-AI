'use client';

import React, { useRef, useState } from 'react';
import { searchTokens } from '@/lib/api';
import Link from 'next/link';
import { Search, ChevronRight, AlertCircle, ImageIcon } from 'lucide-react';

interface TokenInfo {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  marketCap?: number;
  organicScore?: number;
  holderCount?: number;
  description?: string;
}

const TokenSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await searchTokens(query);
      setResults(data);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.response?.data?.message || 'Failed to search tokens. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full mx-auto transition-all duration-200 card-elevated"
      style={{
        maxWidth: 'var(--content-max-width)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-2xl)',
      }}
    >
      <form onSubmit={handleSearch} className="relative group" style={{ marginBottom: 'var(--space-8)' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by name, symbol, or mint address..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input w-full outline-none transition-all duration-200"
          style={{
            padding: 'var(--space-3) var(--space-5)',
            borderRadius: 'var(--radius-2xl)',
            fontSize: 'var(--font-base)',
          }}
        />
      </form>

      {error && (
        <div
          className="flex items-center rounded-2xl"
          style={{
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
            gap: 'var(--space-3)',
            borderRadius: 'var(--radius-2xl)',
            background: 'var(--color-error-bg)',
            border: '1px solid var(--color-error)',
            color: 'var(--color-error)',
          }}
        >
          <AlertCircle className="flex-shrink-0" style={{ width: 'var(--icon-lg)', height: 'var(--icon-lg)' }} />
          <p className="section-title text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--space-3)' }}>
        {results.length > 0 ? (
          results.map((token) => (
            <div
              key={token.mint}
              className="card-hover rounded-2xl transition-all duration-200 group cursor-pointer"
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-2xl)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.background = 'var(--bg-elevated)';
              }}
            >
              <div className="flex items-center" style={{ gap: 'var(--space-4)' }}>
                {token.logoURI ? (
                  <img src={token.logoURI} alt={token.symbol} className="rounded-xl shadow-sm flex-shrink-0" style={{ width: 'var(--space-12)', height: 'var(--space-12)' }} />
                ) : (
                  <div
                    className="rounded-xl flex items-center justify-center font-bold flex-shrink-0"
                    style={{
                      width: 'var(--space-12)',
                      height: 'var(--space-12)',
                      fontSize: 'var(--font-lg)',
                      background: 'var(--bg-hover)',
                      color: 'var(--accent-primary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {token.symbol[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
                    <h3 className="section-title font-bold truncate">{token.name}</h3>
                    <span
                      className="rounded-md font-bold uppercase tracking-wider flex-shrink-0"
                      style={{
                        padding: 'var(--space-1) var(--space-1-5)',
                        fontSize: 'var(--font-xs)',
                        background: 'var(--bg-hover)',
                        color: 'var(--accent-secondary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {token.symbol}
                    </span>
                  </div>
                  <p className="text-muted text-xs truncate font-mono mt-1">{token.mint}</p>
                </div>
                <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-accent" style={{ width: 'var(--icon-lg)', height: 'var(--icon-lg)' }} />
              </div>

              <div className="flex flex-wrap items-center mt-4" style={{ gap: 'var(--space-3)', fontSize: 'var(--font-xs)' }}>
                <span className="text-muted">
                  Score:{' '}
                  <strong style={{ color: 'var(--text)' }}>
                    {token.organicScore?.toFixed(1) || 'N/A'}
                  </strong>
                </span>
                <span className="text-muted">
                  Holders:{' '}
                  <strong style={{ color: 'var(--text)' }}>
                    {token.holderCount ? (token.holderCount > 1000 ? (token.holderCount/1000).toFixed(1) + 'k' : token.holderCount) : 'N/A'}
                  </strong>
                </span>
                <Link
                  href={`/meme-studio?token=${encodeURIComponent(token.symbol)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="nav-link flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs"
                  style={{ marginLeft: 'auto', color: 'var(--text-opacity-80)' }}
                >
                  <ImageIcon style={{ width: 14, height: 14 }} />
                  Create meme
                </Link>
              </div>
            </div>
          ))
        ) : !loading && query ? (
          <div className="col-span-full text-center" style={{ padding: 'var(--space-12) 0' }}>
            <p className="page-subtitle">No tokens found for &quot;{query}&quot;</p>
          </div>
        ) : (
          <div className="col-span-full text-center text-muted" style={{ padding: 'var(--space-12) 0', opacity: 0.8 }}>
            <Search className="mx-auto mb-4" style={{ width: 'var(--space-16)', height: 'var(--space-16)' }} />
            <p className="section-title text-sm">Enter a search query to explore Solana tokens</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenSearch;
