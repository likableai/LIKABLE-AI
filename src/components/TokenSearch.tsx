'use client';

import React, { useRef, useState } from 'react';
import { searchTokens } from '@/lib/api';
import { Search, Info, TrendingUp, Users, ChevronRight, AlertCircle } from 'lucide-react';

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
      className="w-full max-w-4xl mx-auto p-4 md:p-5 rounded-2xl transition-all duration-200"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-opacity-10)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Header removed here; page provides heading */}

      <form onSubmit={handleSearch} className="relative mb-8 group">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by name, symbol, or mint address..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-5 py-3 rounded-2xl transition-all duration-200 outline-none"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text)',
            fontSize: '1rem',
          }}
        />
      </form>

      {error && (
        <div 
          className="p-4 mb-6 rounded-2xl flex items-center gap-3"
          style={{
            background: 'var(--color-error-bg)',
            border: '1px solid var(--color-error)',
            color: 'var(--color-error)',
          }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {results.length > 0 ? (
          results.map((token) => (
            <div 
              key={token.mint}
              className="p-4 rounded-2xl transition-all duration-200 group cursor-pointer"
              style={{
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
              <div className="flex items-center gap-4">
                {token.logoURI ? (
                  <img src={token.logoURI} alt={token.symbol} className="w-12 h-12 rounded-xl shadow-sm flex-shrink-0" />
                ) : (
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0"
                    style={{
                      background: 'var(--bg-hover)',
                      color: 'var(--accent-primary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {token.symbol[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold truncate" style={{ color: 'var(--text)' }}>{token.name}</h3>
                    <span 
                      className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider flex-shrink-0"
                      style={{
                        background: 'var(--bg-hover)',
                        color: 'var(--accent-secondary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {token.symbol}
                    </span>
                  </div>
                  <p className="text-[10px] opacity-40 truncate font-mono mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {token.mint}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-[11px] opacity-70" style={{ color: 'var(--text-secondary)' }}>
                <span>
                  Score:{' '}
                  <strong style={{ color: 'var(--text)' }}>
                    {token.organicScore?.toFixed(1) || 'N/A'}
                  </strong>
                </span>
                <span>
                  Holders:{' '}
                  <strong style={{ color: 'var(--text)' }}>
                    {token.holderCount ? (token.holderCount > 1000 ? (token.holderCount/1000).toFixed(1) + 'k' : token.holderCount) : 'N/A'}
                  </strong>
                </span>
              </div>
            </div>
          ))
        ) : !loading && query ? (
          <div className="col-span-full py-12 text-center">
            <p className="text-base opacity-40" style={{ color: 'var(--text-secondary)' }}>No tokens found for "{query}"</p>
          </div>
        ) : (
          <div className="col-span-full py-12 text-center opacity-20">
            <Search className="w-16 h-16 mx-auto mb-4" />
            <p className="text-sm">Enter a search query to explore Solana tokens</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenSearch;
