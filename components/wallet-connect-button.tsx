// components/wallet-connect-button.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/context/wallet-context';
import { toast } from 'sonner';
import { Wallet, Copy, Check, Loader2 } from 'lucide-react';
import { connectPera, disconnectPera } from '@/lib/pera-wallet';

export function WalletConnectButton() {
  const { wallet, connectWallet, disconnectWallet } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleConnectPera = async () => {
    setIsConnecting(true);
    try {
      const result = await connectPera();

      if (result.success && result.primaryAccount) {
        connectWallet(result.primaryAccount);
        toast.success('Wallet connected with Pera!');
      } else {
        toast.error(result.error || 'Failed to connect');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectPera();
      disconnectWallet();
      toast.success('Wallet disconnected');
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };

  const copyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (wallet.isConnected && wallet.address) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          className="flex items-center gap-2"
          onClick={copyAddress}
        >
          <Wallet className="w-4 h-4" />
          {formatAddress(wallet.address)}
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={handleDisconnect}
          disabled={isConnecting}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnectPera}
      disabled={isConnecting}
      className="flex items-center gap-2"
      variant="default"
    >
      {isConnecting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="w-4 h-4" />
          Connect with Pera
        </>
      )}
    </Button>
  );
}