'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { algorand, SAVINGS_APP_ID } from '@/lib/algorand-client';
import { SavingsClient } from '@/lib/contracts/savings-client';
import { useAlgoSigner } from '@/hooks/use-algo-signer';
import { microAlgo } from '@algorandfoundation/algokit-utils';

const depositSchema = z.object({
  amountAlgo: z
    .number({ invalid_type_error: 'Enter a valid number' })
    .positive('Amount must be greater than 0')
    .max(10000, 'Amount is too large'),
});

type DepositFormData = z.infer<typeof depositSchema>;

interface SavingsDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SavingsDepositDialog({
  open,
  onOpenChange,
  onSuccess,
}: SavingsDepositDialogProps) {
  const { address, transactionSigner } = useAlgoSigner();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: { amountAlgo: 1 },
  });

  const onSubmit = async (data: DepositFormData) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    setIsLoading(true);

    try {
      const microAlgoAmount = Math.round(data.amountAlgo * 1_000_000);

      const client = new SavingsClient({
        appId: SAVINGS_APP_ID,
        algorand,
        defaultSender: address,
        defaultSigner: transactionSigner,
      });

      // appAddress is a plain string getter — no await
      const appAddress = client.appAddress;

      // createTransaction.payment() is async — must be awaited so the
      // deposit() call receives an algosdk Transaction instance, not a Promise
      const paymentTxn = await algorand.createTransaction.payment({
        amount: microAlgo(microAlgoAmount),
        sender: address,
        receiver: appAddress,
      });

      await client.send.deposit({
        args: { payment: paymentTxn },
      });

      toast.success(`Deposited ${data.amountAlgo.toFixed(6)} ALGO successfully!`);
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deposit failed';

      if (message.includes('Deposit must be greater than zero')) {
        toast.error('Amount must be greater than zero.');
      } else if (message.includes('Payment must go to app account')) {
        toast.error('Payment destination mismatch — please try again.');
      } else {
        toast.error(`Deposit failed: ${message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit to Savings</DialogTitle>
          <DialogDescription>
            Send ALGO to your on-chain savings contract. Amounts are locked
            until you reach your target.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
            <FormField
              control={form.control}
              name="amountAlgo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit Amount (ALGO)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.000001"
                      min="0.000001"
                      placeholder="e.g. 1.5"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the amount in ALGO (e.g. 1 ALGO = 1,000,000
                    microAlgo on-chain).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Depositing…' : 'Deposit ALGO'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}