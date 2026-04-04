'use client';

import { useWallet } from '@/context/wallet-context';
import { getPeraWallet } from '@/lib/pera-wallet';
import type { Transaction } from 'algosdk';

export function useAlgoSigner() {
  const { wallet } = useWallet();
  const address: string | null = wallet.address;

  const transactionSigner = async (
  txns: Transaction[],
  indicesToSign: number[]
): Promise<Uint8Array[]> => {
  const peraWallet = getPeraWallet();

  if (!address) throw new Error('Wallet not connected');

  const txGroup = txns.map((txn, index) => ({
    txn,
    signers: indicesToSign.includes(index) ? [address] : [],
  }));

  // Pera returns Uint8Array[] directly — NOT Uint8Array[][]
  // signedGroups[0] is the first BYTE of the first signed txn, not the first txn
  const signed = await peraWallet.signTransaction([txGroup]) as unknown as Uint8Array[];

  // Return one Uint8Array per index in indicesToSign, in order
  return indicesToSign.map((_, position) => signed[position]);
};

  return { address, transactionSigner };
}