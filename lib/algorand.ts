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
const ACTIVE_NETWORK = ALGORAND_NETWORK.testnet;

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