import { prisma } from "@/lib/db";
import { algodClient } from "@/lib/algorand";
import { NextRequest, NextResponse } from "next/server";
import algosdk from "algosdk";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // ✅ await params before use — required in Next.js App Router
  const { id } = await params;

  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "walletAddress is required" },
        { status: 400 },
      );
    }

    const campaign = await prisma.goal.findUnique({ where: { id } });

    if (!campaign)
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    if (campaign.walletAddress !== walletAddress)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (campaign.isClaimed)
      return NextResponse.json({ error: "Funds already claimed" }, { status: 400 });
    
    // In crowdfunding, sometimes creators can claim if deadline passed or target reached.
    // Defaulting to "must reach target" for now as per previous logic, but updating state.
    if (campaign.deposited < campaign.target) {
      return NextResponse.json(
        {
          error: `Target not reached. Raised: ${campaign.deposited} ALGO, Target: ${campaign.target} ALGO`,
        },
        { status: 400 },
      );
    }
    if (!campaign.depositMnemonic || !campaign.depositAddress) {
      return NextResponse.json(
        { error: "Campaign deposit account not configured" },
        { status: 400 },
      );
    }

    const depositAccount = algosdk.mnemonicToSecretKey(campaign.depositMnemonic);
    const accountInfo = await algodClient
      .accountInformation(campaign.depositAddress)
      .do();

    const balanceMicroAlgo = Number(accountInfo.amount);
    const minBalance = Number(accountInfo["min-balance"] ?? 100_000);

    const suggestedParams = await algodClient.getTransactionParams().do();
    suggestedParams.flatFee = true;
    suggestedParams.fee = algosdk.ALGORAND_MIN_TX_FEE;

    const claimable =
      balanceMicroAlgo - minBalance - algosdk.ALGORAND_MIN_TX_FEE;

    if (claimable <= 0) {
      return NextResponse.json(
        { error: "Insufficient balance to claim" },
        { status: 400 },
      );
    }

    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: campaign.depositAddress,
      to: walletAddress,
      amount: claimable,
      suggestedParams,
    });

    const signedTxn = txn.signTxn(depositAccount.sk);
    const { txid } = await algodClient.sendRawTransaction(signedTxn).do();

    // Mark as claimed and update status
    await prisma.goal.update({
      where: { id },
      data: { 
        status: "claimed",
        isClaimed: true,
        updatedAt: new Date() 
      },
    });

    return NextResponse.json({
      success: true,
      txId: txid,
      claimedAlgo: claimable / 1_000_000,
    });

  } catch (error) {
    console.error("Claim error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process claim",
      },
      { status: 500 },
    );
  }
}
