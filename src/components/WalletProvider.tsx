'use client';

import React, { FC, ReactNode, useMemo, useCallback } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface SolanaWalletProviderProps {
  children: ReactNode;
}

export const SolanaWalletProvider: FC<SolanaWalletProviderProps> = ({ children }) => {
  // Network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  // Read from environment variable, default to mainnet
  const networkEnv = process.env.NEXT_PUBLIC_SOLANA_NETWORK?.toLowerCase() || 'mainnet';
  const network = networkEnv === 'devnet' 
    ? WalletAdapterNetwork.Devnet
    : networkEnv === 'testnet'
    ? WalletAdapterNetwork.Testnet
    : WalletAdapterNetwork.Mainnet;

  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => {
    if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
      return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    }
    return clusterApiUrl(network);
  }, [network]);

  // Configure supported wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  // Handle wallet errors gracefully
  const onError = useCallback((error: any) => {
    // Optionally log error for debugging
    console.warn('Wallet Connection Error:', error.message || error);
    
    // We don't want to show an intrusive alert for "User rejected the request" 
    // especially during autoConnect as it can be quite noisy.
    if (error.name === 'WalletConnectionError' && error.message?.includes('rejected')) {
      return;
    }
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
