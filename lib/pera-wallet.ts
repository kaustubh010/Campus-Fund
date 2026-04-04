// lib/pera-wallet.ts

import { PeraWalletConnect } from '@perawallet/connect';
import algosdk from 'algosdk';

// Initialize Pera Wallet
export const peraWallet = new PeraWalletConnect({
  shouldShowSignTxnToast: true,
});

export async function connectPera() {
  try {
    const accountsAllowedByUser = await peraWallet.connect();

    if (accountsAllowedByUser && accountsAllowedByUser.length > 0) {
      return {
        success: true,
        accounts: accountsAllowedByUser,
        primaryAccount: accountsAllowedByUser[0],
      };
    }

    return { success: false, error: 'No accounts available' };
  } catch (error: any) {
    console.error('Pera connection error:', error);
    return { success: false, error: error.message };
  }
}

export async function disconnectPera() {
  try {
    await peraWallet.disconnect();
    return { success: true };
  } catch (error: any) {
    console.error('Pera disconnect error:', error);
    return { success: false, error: error.message };
  }
}

export async function signTransaction(
  txnBytes: number[],
  signer: string
) {
  try {
    const txnUint8 = new Uint8Array(txnBytes);

    const txGroups = [
      [
        {
          txn: txnUint8,
          signers: [signer],
        },
      ],
    ];

    const signed = await peraWallet.signTransaction(txGroups);

    return {
      success: true,
      signedTransaction: signed[0][0],
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getPeraWallet() {
  return peraWallet;
}