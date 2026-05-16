import algosdk from "algosdk";
import { algodClient, algoToMicroAlgo } from "./algorand";
import { peraWallet } from "./pera-wallet";

export async function sendPayment(
  from: string,
  to: string,
  amountAlgo: number
) {
  const params = await algodClient.getTransactionParams().do();

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from,
    to,
    amount: algoToMicroAlgo(amountAlgo),
    suggestedParams: params,
  });

  const txGroup = [
    [
      {
        txn,
        signers: [from],
      },
    ],
  ];

  const signed = await peraWallet.signTransaction(txGroup);

  const { txId } = await algodClient
    .sendRawTransaction(signed[0])
    .do();

  return txId;
}