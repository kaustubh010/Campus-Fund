import algosdk from 'algosdk';
import { ACTIVE_NETWORK } from '@/lib/algorand';

function getIndexer(): algosdk.Indexer {
  return new algosdk.Indexer('', ACTIVE_NETWORK.indexer, ACTIVE_NETWORK.port);
}

export type ParsedDonateGroup = {
  payerAddress: string;
  microAlgos: number;
  groupTxIds: string[];
};

/**
 * Confirms the txId belongs to a 2-txn atomic group: App NoOp (donate) + Pay to app escrow.
 * Returns payer (payment sender) and payment amount in microAlgos from chain.
 */
export async function parseDonateGroupFromIndexer(
  txIds: string[],
  appId: number
): Promise<{ ok: true; data: ParsedDonateGroup } | { ok: false; error: string }> {
  const indexer = getIndexer();
  const appAddr = algosdk.getApplicationAddress(appId);

  let groupTxs: any[] = [];
  
  // We try up to 5 times for the indexer to return ALL the transactions expected
  let retries = 5;
  while (retries > 0) {
    try {
      groupTxs = [];
      for (const tId of txIds) {
        const res = await indexer.searchForTransactions().txid(tId).do();
        if (res.transactions && res.transactions.length > 0) {
          groupTxs.push(res.transactions[0]);
        }
      }
      
      if (groupTxs.length === txIds.length) break;
    } catch {
      // Ignore indexer errors on individual requests and retry
    }
    
    await new Promise((resolve) => setTimeout(resolve, 2000));
    retries--;
  }

  if (groupTxs.length === 0) {
    return { ok: false, error: 'Transaction not found on indexer' };
  }

  if (txIds.length === 2 && groupTxs.length !== 2) {
    return { ok: false, error: `Indexer delay: Expected 2 transactions in donate group, got ${groupTxs.length}. Please contact support or try syncing the dashboard.` };
  }

  if (txIds.length === 2) {
    // Original atomic group logic (App Call + Payment)
    let appCall: any = null;
    let pay: any = null;
    for (const t of groupTxs) {
      if (t['application-transaction']) {
        const ax = t['application-transaction'];
        if (Number(ax['application-id']) === appId) appCall = t;
      }
      if (t['payment-transaction']) pay = t;
    }

    if (!appCall || !pay) {
      return { ok: false, error: 'Group must include application call and payment' };
    }

    const payInner = pay['payment-transaction'];
    const receiver = payInner?.receiver;
    const amount = Number(payInner?.amount ?? 0);
    const payer = pay.sender;

    if (receiver !== appAddr) {
      return { ok: false, error: 'Payment receiver is not the campaign app escrow address' };
    }
    if (amount <= 0) {
      return { ok: false, error: 'Invalid payment amount' };
    }
    if (payer !== appCall.sender) {
      return { ok: false, error: 'Payment sender must match application call sender' };
    }

    return {
      ok: true,
      data: {
        payerAddress: payer,
        microAlgos: amount,
        groupTxIds: groupTxs.map((t: any) => t.id).filter(Boolean),
      },
    };

  } else {
    // Standalone donation transaction must be a payment
    if (groupTxs.length !== 1) {
      return { ok: false, error: `Expected 1 transaction for standalone donate, got ${groupTxs.length}` };
    }

    const pay = groupTxs[0];
    if (!pay['payment-transaction']) {
      return { ok: false, error: 'Standalone donation transaction must be a payment' };
    }
    
    const payInner = pay['payment-transaction'];
    const receiver = payInner.receiver;
    const amount = Number(payInner.amount ?? 0);
    const payer = pay.sender;

    if (receiver !== appAddr) {
      return { ok: false, error: 'Payment receiver is not the campaign app escrow address' };
    }
    if (amount <= 0) {
      return { ok: false, error: 'Invalid payment amount' };
    }

    return {
      ok: true,
      data: {
        payerAddress: payer,
        microAlgos: amount,
        groupTxIds: [pay.id],
      },
    };
  }

  return {
    ok: true,
    data: {
      payerAddress: payer,
      microAlgos: amount,
      groupTxIds: groupTxs.map((t: any) => t.id).filter(Boolean),
    },
  };
}
