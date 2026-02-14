'use client';

import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import TokenSearch from '@/components/TokenSearch';

export default function ExplorerPage() {
  return (
    <AppLayout>
      <div className="container-padding mx-auto" style={{ maxWidth: 'var(--content-max-width)' }}>
        <header className="text-center section-spacing">
          <h1 className="page-title mb-4 tracking-tight">
            Token <span className="text-accent">Explorer</span>
          </h1>
          <p className="page-subtitle text-sm" style={{ color: 'var(--text-opacity-70)' }}>
            Search tokens on Solana (Jupiter).
          </p>
        </header>
        <main>
          <TokenSearch />
        </main>
      </div>
    </AppLayout>
  );
}
