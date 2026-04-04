'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/progress-bar';
import { useWallet } from '@/context/wallet-context';
import { useAlgoSigner } from '@/hooks/use-algo-signer';
import { algorand, SAVINGS_APP_ID } from '@/lib/algorand-client';
import { SavingsClient } from '@/lib/contracts/savings-client';
import { SavingsDepositDialog } from '@/components/savings-deposit-dialog';
import { Target, TrendingUp, Wallet, ArrowDownCircle, CheckCircle2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SavingsState {
  owner: string;
  targetAlgo: number;
  depositedAlgo: number;
  progressPercent: number;
  notConfigured?: boolean;
  error?: string;
}

export function SavingsDashboard() {
  const { wallet } = useWallet();
  const { address, transactionSigner } = useAlgoSigner();
  const [depositOpen, setDepositOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<SavingsState>(
    '/api/savings',
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 30_000 }
  );

  const isOwner =
    address != null &&
    data?.owner != null &&
    address === data.owner;

  const canClaim =
    // isOwner &&
    data?.depositedAlgo !== undefined &&
    data?.targetAlgo !== undefined &&
    data.depositedAlgo >= data.targetAlgo &&
    data.targetAlgo > 0;

  const handleClaim = async () => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    setIsClaiming(true);

    try {
      const client = new SavingsClient({
        appId: SAVINGS_APP_ID,
        algorand,
        defaultSender: address,
        defaultSigner: transactionSigner,
      });

      await client.send.claim({ args: {} });

      toast.success('Savings claimed successfully! ALGO sent to your wallet.');
      mutate();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Claim failed';

      if (message.includes('Only the owner can claim')) {
        toast.error('Only the contract owner can claim savings.');
      } else if (message.includes('Savings target not yet reached')) {
        toast.error('Your savings target has not been reached yet.');
      } else {
        toast.error(`Claim failed: ${message}`);
      }
    } finally {
      setIsClaiming(false);
    }
  };

  // Not connected
  if (!wallet.isConnected) {
    return null;
  }

  // App not configured
  if (data?.notConfigured) {
    return (
      <Card className="p-6 border-dashed">
        <p className="text-sm text-muted-foreground text-center">
          Savings contract not configured. Set{' '}
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
            NEXT_PUBLIC_APP_ID
          </code>{' '}
          in your environment.
        </p>
      </Card>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-sm">
          Loading on-chain savings state…
        </p>
      </Card>
    );
  }

  // Error
  if (error || data?.error) {
    return (
      <Card className="p-6 border-destructive/50">
        <p className="text-destructive text-sm">
          Failed to load savings state: {data?.error ?? 'Network error'}
        </p>
      </Card>
    );
  }

  const { owner, targetAlgo, depositedAlgo, progressPercent } = data ?? {
    owner: '',
    targetAlgo: 0,
    depositedAlgo: 0,
    progressPercent: 0,
  };

  const isCompleted = depositedAlgo >= targetAlgo && targetAlgo > 0;

  return (
    <>
      <Card className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">On-Chain Savings Contract</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Powered by Algorand — funds are locked until your goal is reached.
            </p>
          </div>
          {isCompleted && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-xs font-semibold rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Goal Reached
            </span>
          )}
        </div>

        {/* Progress */}
        <ProgressBar
          current={depositedAlgo}
          target={targetAlgo}
          showLabel
          size="lg"
        />

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
              <Target className="w-3.5 h-3.5" />
              Target
            </p>
            <p className="text-xl font-bold">{targetAlgo.toFixed(6)} ALGO</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Deposited
            </p>
            <p className="text-xl font-bold">{depositedAlgo.toFixed(6)} ALGO</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
              <Wallet className="w-3.5 h-3.5" />
              Progress
            </p>
            <p className="text-xl font-bold">{progressPercent}%</p>
          </div>
        </div>

        {/* Owner address */}
        {owner && (
          <p className="text-xs text-muted-foreground font-mono break-all">
            Contract owner: {owner}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2">
          {!isCompleted && (
            <Button
              onClick={() => setDepositOpen(true)}
              className="flex items-center gap-2"
            >
              <ArrowDownCircle className="w-4 h-4" />
              Deposit ALGO
            </Button>
          )}

          {canClaim && (
            <Button
              variant="default"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleClaim}
              disabled={isClaiming}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isClaiming ? 'Claiming…' : 'Claim Savings'}
            </Button>
          )}
        </div>
      </Card>

      <SavingsDepositDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
        onSuccess={() => mutate()}
      />
    </>
  );
}
