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
  txnBytes: Uint8Array | number[] | Uint8Array[],
  signer: string
) {
  try {
    let txns: Uint8Array[];
    
    if (Array.isArray(txnBytes) && txnBytes.length > 0 && txnBytes[0] instanceof Uint8Array) {
      txns = txnBytes as Uint8Array[];
    } else {
      txns = [new Uint8Array(txnBytes as number[])];
    }

    const txGroups = txns.map(t => ({
      txn: algosdk.decodeUnsignedTransaction(t),
      signers: [signer],
    }));

    const signed = await peraWallet.signTransaction([txGroups]);

    return {
      success: true,
      signedTransaction: signed.length === 1 ? signed[0] : signed,
    };
  } catch (error: any) {
    console.error('Pera sign error:', error);
    return { success: false, error: error.message };
  }
}

export function getPeraWallet() {
  return peraWallet;
}