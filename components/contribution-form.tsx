"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useWallet } from "@/context/wallet-context";
import {
  Form, FormControl, FormDescription,
  FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { sendPayment } from "@/lib/payment";
import { useGoal } from "@/hooks/use-goals";
import algosdk from "algosdk";
import { algodClient } from "@/lib/algorand";
import { CheckCircle2, ArrowDownCircle, Loader2 } from "lucide-react";

const depositSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Enter a valid number" })
    .positive("Amount must be greater than 0")
    .max(1000000, "Amount is too large"),
});

type DepositFormData = z.infer<typeof depositSchema>;

interface DepositFormProps {
  goalId: string;
  targetAmount: number;
  currentAmount: number;
  onSuccess?: () => void;
}

export function DepositForm({ goalId, targetAmount, currentAmount, onSuccess }: DepositFormProps) {
  const { wallet } = useWallet();
  const { goal, mutate } = useGoal(goalId);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: { amount: 1 },
  });

  const remainingAmount = Math.max(0, targetAmount - currentAmount);
  const isGoalComplete = currentAmount >= targetAmount && targetAmount > 0;
  const isOwner = wallet.address && goal?.walletAddress === wallet.address;

  const onSubmit = async (data: DepositFormData) => {
    if (!wallet.address) return toast.error("Wallet not connected");
    if (!goal?.depositAddress) return toast.error("Goal deposit address not configured");

    setIsDepositing(true);
    try {
      const txId = await sendPayment(wallet.address, goal.depositAddress, data.amount);
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId, amount: data.amount, walletAddress: wallet.address, txId }),
      });

      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to record deposit");

      toast.success(`Deposited ${data.amount.toFixed(2)} ALGO successfully!`);
      form.reset({ amount: 1 });
      mutate();
      onSuccess?.();
    } catch (err) {
      toast.error(`Deposit failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleClaim = async () => {
    if (!wallet.address) return toast.error("Wallet not connected");

    setIsClaiming(true);
    try {
      const res = await fetch(`/api/goals/${goalId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: wallet.address }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Claim failed");

      toast.success(`🎉 ${result.claimedAlgo?.toFixed(4)} ALGO sent to your wallet!`);
      mutate();
      onSuccess?.();
    } catch (err) {
      toast.error(`Claim failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsClaiming(false);
    }
  };

  if (!wallet.isConnected) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">Please connect your wallet to make a contribution</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      {/* Claim banner — only shown when goal is complete and user is the owner */}
      {isGoalComplete && isOwner && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="font-semibold text-green-800 dark:text-green-200">Goal Reached! 🎉</p>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">
            Claim your <span className="font-semibold">{currentAmount.toFixed(2)} ALGO</span> — sent directly to your wallet.
          </p>
          <Button onClick={handleClaim} disabled={isClaiming} className="w-full bg-green-600 hover:bg-green-700 text-white">
            {isClaiming ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Claiming…</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Claim {currentAmount.toFixed(2)} ALGO</>}
          </Button>
        </div>
      )}

      {/* Deposit form — hidden once goal is complete */}
      {!isGoalComplete && (
        <>
          <p className="text-sm text-muted-foreground">
            Remaining: <span className="font-semibold text-foreground">{remainingAmount.toFixed(2)} ALGO</span>
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contribution Amount (ALGO)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" min="0.1" placeholder="Enter amount"
                      {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      disabled={isDepositing} />
                  </FormControl>
                  <FormDescription>Maximum: {remainingAmount.toFixed(2)} ALGO</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={isDepositing} className="w-full">
                {isDepositing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Confirming on-chain…</> : <><ArrowDownCircle className="w-4 h-4 mr-2" />Contribute ALGO</>}
              </Button>
            </form>
          </Form>
        </>
      )}
    </Card>
  );
}