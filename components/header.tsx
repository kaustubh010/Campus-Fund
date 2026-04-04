'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WalletConnectButton } from './wallet-connect-button';
import { BarChart3 } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container h-16 flex items-center justify-between px-4 md:px-6">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg text-foreground">Legend</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            Dashboard
          </Link>
          <Link
            href="/goals/new"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            Create Goal
          </Link>
        </nav>

        {/* Wallet Button */}
        <div className="flex items-center gap-2">
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}
