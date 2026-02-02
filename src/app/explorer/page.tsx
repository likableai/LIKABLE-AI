'use client';

import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import TokenSearch from '@/components/TokenSearch';

export default function ExplorerPage() {
  return (
    <AppLayout>
      <div className="container-padding max-w-4xl mx-auto">
        {/* Header Section */}
        <header className="mb-8 text-center">
          <h1 
            className="mb-4 tracking-tight"
            style={{ 
              fontFamily: "'Times New Roman', Times, serif",
              color: 'var(--text)',
              fontSize: 'var(--font-4xl)',
              fontWeight: 'var(--font-weight-bold)'
            }}
          >
            Token <span style={{ color: 'var(--accent-primary)' }}>Explorer</span>
          </h1>
          <p 
            className="text-lg"
            style={{ 
              fontFamily: "'Times New Roman', Times, serif",
              color: 'var(--text-opacity-60)'
            }}
          >
            Search and analyze any token on the Solana network using Jupiter Ultra.
          </p>
        </header>
        
        {/* Main Content */}
        <main>
          <TokenSearch />
        </main>
      </div>
    </AppLayout>
  );
}
