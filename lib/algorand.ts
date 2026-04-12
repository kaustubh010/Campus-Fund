import algosdk from 'algosdk';

// Algorand network constants
const ALGORAND_NETWORK = {
  mainnet: {
    indexer: 'https://mainnet-idx.algonode.cloud',
    algod: 'https://mainnet-api.algonode.cloud',
    port: 443,
    chainId: 416001, // For Pera Wallet
  },
  testnet: {
    indexer: 'https://testnet-idx.algonode.cloud',
    algod: 'https://testnet-api.algonode.cloud',
    port: 443,
    chainId: 416002, // For Pera Wallet
  },
};

// Default to testnet for development
export const ACTIVE_NETWORK = ALGORAND_NETWORK.testnet;

// Initialize Algorand clients
export const algodClient = new algosdk.Algodv2(
  '',
  ACTIVE_NETWORK.algod,
  ACTIVE_NETWORK.port
);

// Helper function to convert Algos to microAlgos
export function algoToMicroAlgo(algos: number): number {
  return Math.round(algos * 1_000_000);
}

// Get account information
export async function getAccountInfo(address: string) {
  try {
    const accountInfo = await algodClient.accountInformation(address).do();
    return {
      success: true,
      accountInfo,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Check if transaction is confirmed on blockchain
export async function checkTransactionStatus(txId: string) {
  try {
    const pendingInfo = await algodClient
      .pendingTransactionInformation(txId)
      .do();
    
    if (pendingInfo['confirmed-round']) {
      return {
        confirmed: true,
        round: pendingInfo['confirmed-round'],
      };
    }
    
    return {
      confirmed: false,
      message: 'Transaction pending',
    };
  } catch (error) {
    return {
      confirmed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Wait for a transaction to be confirmed
export async function waitForConfirmation(txId: string, timeout = 4) {
  try {
    const confirmation = await algosdk.waitForConfirmation(algodClient, txId, timeout);
    return {
      success: true,
      confirmation,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Compile TEAL source to bytes
export async function compileProgram(programSource: string) {
  const compileResponse = await algodClient.compile(programSource).do();
  const compiledBytes = new Uint8Array(Buffer.from(compileResponse.result, 'base64'));
  return compiledBytes;
}

export function decodeGlobalStateValue(value: any) {
  if (!value) return null;
  if (value.type === 1) {
    return Buffer.from(value.bytes, 'base64').toString();
  }
  return value.uint;
}

export async function getAppGlobalState(appId: number) {
  const app = await algodClient.getApplicationByID(appId).do();
  const stateEntries = app?.params?.['global-state'] || [];
  const state: Record<string, any> = {};

  for (const entry of stateEntries) {
    const key = Buffer.from(entry.key, 'base64').toString();
    state[key] = decodeGlobalStateValue(entry.value);
  }

  return state;
}

export function appArgMethod(method: string) {
  return new Uint8Array(Buffer.from(method));
}

export function encodeAddressArg(address: string) {
  return algosdk.decodeAddress(address).publicKey;
}

export function encodeUintArg(value: number | bigint) {
  return algosdk.encodeUint64(typeof value === 'bigint' ? value : BigInt(value));
}

// Deploy the Crowdfund Smart Contract
export async function deployCrowdfundApp(
  creatorMnemonic: string,
  goalMicroAlgos: number,
  deadlineTimestamp: number,
  approvalSource: string,
  clearSource: string
) {
  try {
    const creatorAccount = algosdk.mnemonicToSecretKey(creatorMnemonic);
    const params = await algodClient.getTransactionParams().do();

    const approvalProgram = await compileProgram(approvalSource);
    const clearProgram = await compileProgram(clearSource);

    // Global state: 3 ints (goal, deadline, total_raised), 1 byte (creator)
    // Local state: 1 int (contribution)
    const numGlobalInts = 3;
    const numGlobalByteSlices = 1;
    const numLocalInts = 1;
    const numLocalByteSlices = 0;

    const appArgs = [
      algosdk.encodeUint64(goalMicroAlgos),
      algosdk.encodeUint64(deadlineTimestamp)
    ];

    const txn = algosdk.makeApplicationCreateTxnFromObject({
      from: creatorAccount.addr,
      suggestedParams: params,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      approvalProgram,
      clearProgram,
      numGlobalInts,
      numGlobalByteSlices,
      numLocalInts,
      numLocalByteSlices,
      appArgs,
    });

    const signedTxn = txn.signTxn(creatorAccount.sk);
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    
    const result = await waitForConfirmation(txId);
    if (!result.success) throw new Error('Deployment failed to confirm');

    const appId = result.confirmation!['application-index'];
    return { success: true, appId, txId };
  } catch (error) {
    console.error('App deployment error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
