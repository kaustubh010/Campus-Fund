'use client';

import { getPeraWallet } from '@/lib/pera-wallet';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface WalletContextType {
  wallet: {
    address: string | null;
    isConnected: boolean;
    isConnecting: boolean;
  };
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
  updateWalletAddress: (address: string) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState({
    address: null as string | null,
    isConnected: false,
    isConnecting: false,
  });

  // Try to load wallet from localStorage on mount
useEffect(() => {
  const peraWallet = getPeraWallet();

  async function reconnect() {
    try {
      const accounts = await peraWallet.reconnectSession();

      if (accounts.length > 0) {
        setWallet({
          address: accounts[0],
          isConnected: true,
          isConnecting: false,
        });
      }
    } catch (error) {
      console.log("Reconnection failed:", error);
    }
  }

  reconnect();
}, []);

  const connectWallet = (address: string) => {
    setWallet({
      address,
      isConnected: true,
      isConnecting: false,
    });
    localStorage.setItem('walletAddress', address);
  };

  const disconnectWallet = () => {
    setWallet({
      address: null,
      isConnected: false,
      isConnecting: false,
    });
    localStorage.removeItem('walletAddress');
  };

  const updateWalletAddress = (address: string) => {
    setWallet((prev) => ({
      ...prev,
      address,
    }));
    localStorage.setItem('walletAddress', address);
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connectWallet,
        disconnectWallet,
        updateWalletAddress,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
