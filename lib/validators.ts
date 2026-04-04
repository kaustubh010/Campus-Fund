import { z } from 'zod';

// Goal validation schema
export const goalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100),
  description: z.string().max(500).optional(),
  target: z
    .number()
    .positive('Target must be greater than 0')
    .max(1000000, 'Target is too large'),
  category: z.string().min(1, 'Category is required').optional(),
  imageUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  deadline: z.date().optional(),
});

export type GoalInput = z.infer<typeof goalSchema>;

// Deposit validation schema
export const depositSchema = z.object({
  goalId: z.string().min(1, 'Goal ID is required'),
  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .max(1000000, 'Amount is too large'),
});

export type DepositInput = z.infer<typeof depositSchema>;

// Wallet validation schema
export const walletAddressSchema = z.object({
  address: z
    .string()
    .regex(/^[A-Z2-7]{58}$/, 'Invalid Algorand wallet address'),
});

export type WalletAddress = z.infer<typeof walletAddressSchema>;
