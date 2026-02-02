'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import api, { getAuthToken, setAuthToken, clearAuthToken } from '@/lib/api';

interface AuthUser {
  walletAddress: string;
  isPro?: boolean;
  isAdmin?: boolean;
  balance?: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  loginWithWallet: (walletAddress: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { publicKey } = useWallet();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Hydrate auth from existing token on first mount
  useEffect(() => {
    const hydrate = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await api.get('/auth/me');
        if (response.data?.authenticated && response.data.walletAddress) {
          const u = response.data.user || {};
          setUser({
            walletAddress: response.data.walletAddress,
            isPro: u.isPro,
            isAdmin: u.isAdmin,
            balance: u.balance,
          });
        } else {
          clearAuthToken();
          setUser(null);
        }
      } catch {
        clearAuthToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, []);

  // Optional: if wallet changes, you may want to force re-login
  useEffect(() => {
    if (!publicKey) {
      // Wallet disconnected: keep token semantics simple by logging out
      clearAuthToken();
      setUser(null);
    }
  }, [publicKey]);

  const loginWithWallet = async (walletAddress: string) => {
    const response = await api.post('/auth/wallet', { walletAddress });
    if (response.data?.authenticated && response.data.token) {
      setAuthToken(response.data.token);
      const u = response.data.user || {};
      setUser({
        walletAddress: response.data.walletAddress,
        isPro: u.isPro,
        isAdmin: u.isAdmin,
        balance: u.balance,
      });
    }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithWallet,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

