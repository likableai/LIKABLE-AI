'use client';

import React, { useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export const WalletButton: React.FC = () => {
  const { connected, publicKey, disconnect } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [mounted, setMounted] = React.useState(false);

 
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const getNetworkName = () => {
    const rpcUrl = connection?.rpcEndpoint || '';
    if (rpcUrl.includes('devnet')) return 'Devnet';
    if (rpcUrl.includes('testnet')) return 'Testnet';
    return '';
  };

  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'wallet-adapter-styles';
    styleSheet.textContent = `
      .wallet-adapter-button {
        background: var(--accent-primary) !important;
        border: none !important;
        color: var(--bg) !important;
        border-radius: 9999px !important;
        padding: var(--space-1) var(--space-3) !important;
        font-family: 'Times New Roman', Times, serif !important;
        font-size: var(--font-sm) !important;
        font-weight: var(--font-weight-normal) !important;
        min-height: var(--button-height-compact) !important;
        height: auto !important;
        line-height: 1 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all var(--transition-base) !important;
        text-transform: none !important;
        box-shadow: var(--shadow-white-sm) !important;
      }
      .wallet-adapter-button-start-icon,
      .wallet-adapter-button-end-icon {
        width: 14px !important;
        height: 14px !important;
        margin-right: 4px !important;
      }
      .wallet-adapter-button:hover:not([disabled]) {
        background: var(--accent-secondary) !important;
        color: var(--bg) !important;
        transform: translateY(-1px) !important;
        opacity: 1 !important;
        box-shadow: var(--shadow-white-md) !important;
      }
      .wallet-adapter-button:active:not([disabled]) {
        transform: translateY(0) !important;
      }
      .wallet-adapter-button[disabled] {
        opacity: 0.4 !important;
        cursor: not-allowed !important;
      }
      .wallet-adapter-modal-wrapper {
        background: var(--bg-opacity-20) !important;
      }
      .wallet-adapter-modal {
        background: var(--accent-primary) !important;
        border: 1px solid var(--border-opacity-10) !important;
        border-radius: var(--radius-xl) !important;
        box-shadow: var(--shadow-xl) !important;
        color: var(--bg) !important;
        padding: var(--space-8) !important;
        font-family: 'Times New Roman', Times, serif !important;
      }
      .wallet-adapter-modal-title {
        color: var(--bg) !important;
        font-family: 'Times New Roman', Times, serif !important;
        font-weight: var(--font-weight-normal) !important;
        font-size: var(--font-3xl) !important;
        margin-bottom: var(--space-6) !important;
      }
      .wallet-adapter-modal-list {
        display: flex !important;
        flex-direction: column !important;
        gap: var(--space-2) !important;
      }
      .wallet-adapter-modal-list-item {
        background: var(--accent-primary) !important;
        border: 1px solid var(--border-opacity-10) !important;
        border-radius: var(--radius-xl) !important;
        padding: var(--space-4) !important;
        transition: all var(--transition-base) !important;
        color: var(--bg) !important;
        font-family: 'Times New Roman', Times, serif !important;
      }
      .wallet-adapter-modal-list-item:hover {
        background: var(--accent-secondary) !important;
        color: var(--bg) !important;
        transform: translateY(-1px) !important;
        box-shadow: var(--shadow-md) !important;
      }
      .wallet-adapter-modal-button-close {
        background: var(--accent-primary) !important;
        border: 1px solid var(--border-opacity-10) !important;
        border-radius: var(--radius-md) !important;
        color: var(--bg) !important;
        transition: all var(--transition-base) !important;
      }
      .wallet-adapter-modal-button-close:hover {
        background: var(--accent-secondary) !important;
        color: var(--bg) !important;
      }
    `;
    
    // Remove existing stylesheet if present
    const existing = document.getElementById('wallet-adapter-styles');
    if (existing) {
      document.head.removeChild(existing);
    }
    
    document.head.appendChild(styleSheet);

    return () => {
      const toRemove = document.getElementById('wallet-adapter-styles');
      if (toRemove) {
        document.head.removeChild(toRemove);
      }
    };
  }, []);

  if (!mounted) {
    return (
      <div 
        className="wallet-button-wrapper"
        style={{ 
          width: '100%',
          height: 'var(--button-height-compact)'
        }}
      >
        <div 
          className="w-full h-full rounded-xl animate-pulse"
          style={{ 
            background: 'var(--glass-bg)', 
            border: '1px solid var(--glass-border)' 
          }}
        />
      </div>
    );
  }

  const label = connected && publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : 'Wallet';

  return (
    <div className="flex flex-col items-stretch gap-1.5 w-auto">
      <div className="wallet-button-wrapper flex items-center">
        <button
          type="button"
          data-wallet-button
          className="wallet-adapter-button"
          onClick={() => {
            // Always open modal; user asked for a single, universal "Wallet" action.
                      
            setVisible(true);
          }}
          onContextMenu={(e) => {
            // Quick escape hatch: right-click disconnect.
            if (!connected) return;
            e.preventDefault();
            disconnect().catch(() => {});
          }}
          aria-label="Wallet"
        >
          {label}
        </button>
      </div>
      {connected && publicKey && getNetworkName() && (
        <div 
          className="text-xs text-center flex items-center justify-center rounded-lg"
          style={{
            color: 'var(--text)',
            fontFamily: "'Times New Roman', Times, serif",
            padding: 'var(--space-1) var(--space-2)',
            border: '1px solid var(--border-opacity-10)',
            backgroundColor: 'var(--bg-opacity-5)'
          }}
        >
          {getNetworkName()}
        </div>
      )}
    </div>
  );
};
