'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useWallet } from '@/context/wallet-context'
import { ExternalLink, Copy, CheckCircle2, Lock, Unlock, ShieldCheck, Users, Calendar, AlertCircle, XCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAlgoRate } from '@/hooks/useAlgoRate'
import Link from 'next/link'
import algosdk from 'algosdk'
import { algodClient, algoToMicroAlgo, waitForConfirmation } from '@/lib/algorand'
import { signTransaction } from '@/lib/pera-wallet'

export default function CampaignDetailPage() {
  const params = useParams()
  const campaignId = params.id as string
  const { user } = useAuth()
  const { wallet } = useWallet()
  const ALGO_RATE = useAlgoRate()

  const [campaign, setCampaign] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [donateAmount, setDonateAmount] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchCampaign = async () => {
    if (!campaignId) return;
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`)
      const data = await res.json()
      if (res.ok) {
        setCampaign(data)
      } else {
        console.error('Failed to fetch campaign:', data.error)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaign()
  }, [campaignId])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Escrow address copied!')
  }

  const handleDonate = async () => {
    if (!wallet.isConnected) {
      toast.error('Connect your Pera Wallet to donate')
      return
    }

    if (!campaign.appId) {
      toast.error('This campaign is not initialized with a smart contract')
      return
    }

    const amountInr = Number(donateAmount)
    if (!amountInr || amountInr <= 0) {
      toast.error('Enter a valid donation amount')
      return
    }

    setProcessing(true)
    try {
      const amountAlgo = amountInr / ALGO_RATE;
      const microAlgos = algoToMicroAlgo(amountAlgo);

      toast.info('Please accept the transaction in your Pera Wallet', { autoClose: false, toastId: 'pera-toast' })
      const suggestedParams = await algodClient.getTransactionParams().do()
      
      const appAddr = algosdk.getApplicationAddress(campaign.appId);
      
      // 1. Check Opt-In
      const accountInfo = await algodClient.accountInformation(wallet.address!).do();
      const appsLocalState = accountInfo['apps-local-state'] || [];
      const isOptedIn = appsLocalState.some((app: any) => app.id === campaign.appId);

      const txns = [];

      // Add Opt-In if needed
      if (!isOptedIn) {
        txns.push(algosdk.makeApplicationOptInTxnFromObject({
          from: wallet.address!,
          appIndex: campaign.appId,
          suggestedParams,
        }));
      }

      // 2. Application Call "donate"
      txns.push(algosdk.makeApplicationNoOpTxnFromObject({
        from: wallet.address!,
        appIndex: campaign.appId,
        appArgs: [new Uint8Array(Buffer.from('donate'))],
        suggestedParams,
      }));

      // 3. Payment to App
      txns.push(algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: wallet.address!,
        to: appAddr,
        amount: microAlgos,
        suggestedParams,
      }));

      // Group if more than 1 txn, although algosdk.assignGroupID likes group of at least 2.
      // We always have at least AppCall + Pay.
      const txnGroup = algosdk.assignGroupID(txns);

      // Map to Pera expected format
      const peraTxns = txnGroup.map(txn => ({
        txn: txn,
        signers: [wallet.address!]
      }));

      const signResult = await signTransaction(txnGroup.map(t => t.toByte()), wallet.address!)
      if (!signResult.success || !signResult.signedTransaction) {
        toast.dismiss('pera-toast')
        throw new Error(signResult.error || 'Failed to sign transaction')
      }

      toast.update('pera-toast', { render: 'Processing transaction...', type: 'info' })
      const signedResult = signResult.signedTransaction as Uint8Array | Uint8Array[];
      let combinedSignedTxns: Uint8Array;

      if (Array.isArray(signedResult)) {
        const totalLength = signedResult.reduce((acc, t) => acc + (t as Uint8Array).length, 0);
        combinedSignedTxns = new Uint8Array(totalLength);
        let offset = 0;
        signedResult.forEach(t => {
          combinedSignedTxns.set(t as Uint8Array, offset);
          offset += (t as Uint8Array).length;
        });
      } else {
        combinedSignedTxns = signedResult;
      }

      const { txId } = await algodClient.sendRawTransaction(combinedSignedTxns).do()

      const confirmResult = await waitForConfirmation(txId)
      if (!confirmResult.success) {
        toast.dismiss('pera-toast')
        throw new Error(confirmResult.error || 'Transaction confirmation failed')
      }
      
      toast.dismiss('pera-toast')
      const res = await fetch(`/api/campaigns/${campaignId}/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountINR: amountInr,
          amountALGO: amountAlgo,
          txId: txId
        })
      })

      if (!res.ok) throw new Error('Transaction failed to sync with backend')
      
      toast.success('Donation successful! Thank you.')
      setDonateAmount('')
      fetchCampaign() // refresh state
    } catch (err: any) {
      toast.error(err.message || 'Donation failed')
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const handleRefund = async () => {
    if (!wallet.isConnected) {
      toast.error('Connect your wallet')
      return
    }
    
    setProcessing(true)
    try {
      const suggestedParams = await algodClient.getTransactionParams().do()
      
      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        from: wallet.address!,
        appIndex: campaign.appId,
        appArgs: [new Uint8Array(Buffer.from('refund'))],
        suggestedParams,
      })

      const signResult = await signTransaction(txn.toByte(), wallet.address!)
      if (!signResult.success || !signResult.signedTransaction) throw new Error(signResult.error || 'Signing failed')

      const signedResult = signResult.signedTransaction;
      const signedTxn = Array.isArray(signedResult) ? signedResult[0] : signedResult;
      
      const { txId: sentTxId } = await algodClient.sendRawTransaction(signedTxn).do()
      await waitForConfirmation(sentTxId)

      
      // Update backend
      const res = await fetch(`/api/campaigns/${campaignId}/refund`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId: sentTxId })
      })

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to sync refund with database');
      }

      toast.success('Funds returned to your wallet!')
      fetchCampaign()
    } catch (err: any) {
      toast.error(err.message || 'Refund failed')
    } finally {
      setProcessing(false)
    }
  }

  const handleClaim = async () => {
    if (!wallet.isConnected) {
      toast.error('Connect your wallet')
      return
    }

    setProcessing(true)
    try {
      toast.info('Please sign the claim transaction', { autoClose: false, toastId: 'claim-toast' })
      const suggestedParams = await algodClient.getTransactionParams().do()
      
      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        from: wallet.address!,
        appIndex: campaign.appId,
        appArgs: [new Uint8Array(Buffer.from('claim'))],
        suggestedParams,
      })

      const signResult = await signTransaction(txn.toByte(), wallet.address!)
      if (!signResult.success || !signResult.signedTransaction) {
        throw new Error(signResult.error || 'Failed to sign claim transaction')
      }

      const signedTxn = Array.isArray(signResult.signedTransaction) 
        ? signResult.signedTransaction[0] 
        : signResult.signedTransaction;

      const { txId } = await algodClient.sendRawTransaction(signedTxn).do()
      await waitForConfirmation(txId)
      
      toast.update('claim-toast', { render: 'Finalizing on database...', type: 'info' })
      const res = await fetch(`/api/campaigns/${campaignId}/claim`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      toast.dismiss('claim-toast')
      toast.success('Funds claimed successfully to your wallet!')
      fetchCampaign()
    } catch (err: any) {
      toast.dismiss('claim-toast')
      toast.error(err.message || 'Claim failed')
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (!wallet.isConnected) {
      toast.error('Connect your wallet')
      return
    }

    if (!confirm('Are you sure you want to cancel this campaign? All donors will be able to claim a refund, and this action cannot be undone.')) {
      return
    }

    setProcessing(true)
    try {
      toast.info('Initiating cancellation...', { autoClose: false, toastId: 'cancel-toast' })
      const suggestedParams = await algodClient.getTransactionParams().do()
      
      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        from: wallet.address!,
        appIndex: campaign.appId,
        appArgs: [new Uint8Array(Buffer.from('cancel'))],
        suggestedParams,
      })

      const signResult = await signTransaction(txn.toByte(), wallet.address!)
      if (!signResult.success || !signResult.signedTransaction) throw new Error('Signing failed')

      const signedTxn = Array.isArray(signResult.signedTransaction) ? signResult.signedTransaction[0] : signResult.signedTransaction;
      const { txId } = await algodClient.sendRawTransaction(signedTxn).do()
      await waitForConfirmation(txId)
      
      // Update backend
      const res = await fetch(`/api/campaigns/${campaignId}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      })

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel on database');
      }

      toast.dismiss('cancel-toast')
      toast.success('Campaign cancelled successfully.')
      fetchCampaign()
    } catch (err: any) {
      toast.dismiss('cancel-toast')
      toast.error(err.message || 'Cancellation failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-[#0A0A0F] pt-24 text-center text-[#F1F5F9]">Loading campaign...</div>
  }

  if (!campaign) {
    return <div className="min-h-screen bg-[#0A0A0F] pt-24 text-center text-[#EF4444]">Campaign not found</div>
  }

  const percent = Math.min((campaign.raisedALGO / campaign.goalALGO) * 100 || 0, 100)
  const isCreator = user?.id === campaign.creatorId
  const goalMet = campaign.raisedALGO >= campaign.goalALGO
  const isCancelled = campaign.appGlobalState?.is_cancelled === 1; // We should fetch this or rely on status
  const canClaim = isCreator && goalMet && campaign.status !== 'claimed' && !isCancelled

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-20">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6EE7B7 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Breadcrumb / Nav */}
        <Link href="/campaigns" className="text-[#64748B] hover:text-[#F1F5F9] text-sm mb-6 inline-block font-bold">
          ← Back to Explore
        </Link>

        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="w-full h-72 md:h-96 rounded-3xl bg-[#1E1E2E] overflow-hidden relative border border-[#1E1E2E]">
              {campaign.coverImage ? (
                <img src={campaign.coverImage} alt={campaign.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1E1E2E] to-[#0A0A0F] text-[#64748B]">
                  <span className="font-[Syne] font-bold text-4xl opacity-20">{campaign.category}</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block px-3 py-1 bg-[#1E1E2E] text-[#F1F5F9] text-xs font-bold rounded-lg border border-[#3d5a3b]">
                  {campaign.category}
                </span>
                {campaign.status === 'funded' && (
                  <span className="inline-block px-3 py-1 bg-[#22C55E]/20 text-[#22C55E] text-xs font-bold rounded-lg border border-[#22C55E]/50 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> SUCCESSFUL
                  </span>
                )}
                {campaign.status === 'claimed' && (
                  <span className="inline-block px-3 py-1 bg-[#818CF8]/20 text-[#818CF8] text-xs font-bold rounded-lg border border-[#818CF8]/50 flex items-center gap-1">
                    <Unlock className="w-3 h-3" /> CLAIMED
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl md:text-5xl font-bold font-[Syne] text-[#F1F5F9] mb-4 leading-tight">
                {campaign.title}
              </h1>
              
              <div className="flex items-center gap-4 text-[#64748B] mb-8 pb-8 border-b border-[#1E1E2E]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#1E1E2E] rounded-full flex items-center justify-center text-[#F1F5F9] font-bold">
                    {campaign.creator.name?.[0].toUpperCase()}
                  </div>
                  <span className="font-medium text-[#F1F5F9]">{campaign.creator.name}</span>
                </div>
                <span>•</span>
                <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="prose prose-invert max-w-none text-[#F1F5F9]/80 font-[DM_Sans] leading-relaxed">
                <p className="whitespace-pre-wrap">{campaign.description}</p>
              </div>
            </div>

            {/* Escrow Transparency Panel */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 mt-12">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-[#6EE7B7]" />
                <h3 className="text-xl font-bold font-[Syne] text-[#F1F5F9]">Smart Escrow Verification</h3>
              </div>
              <p className="text-sm text-[#64748B] mb-4">
                Every transaction for this campaign is processed via Algorand and locked in an escrow address. Platform admins cannot touch these funds. They automatically unlock for the creator only when the goal is reached.
              </p>
              <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-[#64748B] uppercase tracking-wider font-bold mb-1">Escrow Address</p>
                  <p className="font-[JetBrains_Mono] text-[#F1F5F9] text-sm break-all">{campaign.escrowAddress}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => handleCopy(campaign.escrowAddress)} className="p-2 bg-[#1E1E2E] hover:bg-[#2d3d2b] transition-colors rounded-lg text-[#F1F5F9]">
                    <Copy className="w-4 h-4" />
                  </button>
                  <a href={`https://testnet.explorer.perawallet.app/address/${campaign.escrowAddress}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#6EE7B7]/10 hover:bg-[#6EE7B7]/20 text-[#6EE7B7] transition-colors rounded-lg font-bold text-sm flex items-center gap-2">
                    Verify <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Right Sidebar - Action Panel */}
          <div className="lg:col-span-1">
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-3xl p-6 lg:p-8 sticky top-28 shadow-2xl">
              
              {/* Progress Summary */}
              <div className="mb-8">
                <div className="flex justify-between items-end mb-2">
                  <h2 className="text-[#6EE7B7] text-4xl font-bold font-[Syne]">₹{Math.floor(campaign.raisedINR).toLocaleString()}</h2>
                  <span className="text-[#64748B] pb-1">/ ₹{campaign.goalINR.toLocaleString()} target</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold bg-[#1E1E2E] p-2 rounded-lg mb-4">
                  <span className="text-[#818CF8] font-[JetBrains_Mono] flex items-center gap-2">
                    <img src="https://cryptologos.cc/logos/algorand-algo-logo.svg?v=024" className="w-4 h-4" alt="" />
                    {campaign.raisedALGO.toFixed(1)} ALGO
                  </span>
                  <span className="text-[#64748B]">/ {campaign.goalALGO.toFixed(1)} ALGO target</span>
                </div>

                <div className="w-full bg-[#1E1E2E] h-2 rounded-full mb-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#6EE7B7] to-[#818CF8] rounded-full transition-all duration-1000"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-right text-[#64748B] font-bold text-sm">{Math.floor(percent)}% funded</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4">
                  <Users className="w-5 h-5 text-[#64748B] mb-2" />
                  <p className="text-2xl font-bold text-[#F1F5F9]">{campaign._count.donations}</p>
                  <p className="text-xs text-[#64748B] uppercase font-bold tracking-wider">Donors</p>
                </div>
                <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4">
                  <Calendar className="w-5 h-5 text-[#64748B] mb-2" />
                  <p className="text-2xl font-bold text-[#F1F5F9]">
                    {campaign.deadline ? Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / (1000 * 3600 * 24))) : '∞'}
                  </p>
                  <p className="text-xs text-[#64748B] uppercase font-bold tracking-wider">Days left</p>
                </div>
              </div>

              {/* Action Area */}
              {isCreator ? (
                <div className="pt-6 border-t border-[#1E1E2E]">
                  <h3 className="font-bold text-[#F1F5F9] mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#6EE7B7]" /> Smart Contract Control
                  </h3>
                  
                  {campaign.status === 'claimed' ? (
                    <div className="bg-[#6EE7B7]/10 border border-[#6EE7B7]/30 p-5 rounded-2xl text-center">
                      <CheckCircle2 className="w-10 h-10 text-[#6EE7B7] mx-auto mb-3" />
                      <p className="font-bold text-[#6EE7B7] mb-1">Funds Claimed</p>
                      <p className="text-xs text-[#F1F5F9]/70">The escrow has been cleared and funds are in your wallet.</p>
                    </div>
                  ) : campaign.status === 'cancelled' ? (
                    <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl text-center">
                      <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                      <p className="font-bold text-red-500 mb-1">Campaign Cancelled</p>
                      <p className="text-xs text-red-500/70 mb-4">You manually cancelled this campaign. Donors (including you) can reclaim their funds.</p>
                      
                      <button 
                        onClick={handleRefund}
                        disabled={processing}
                        className="w-full py-3 bg-red-500 text-[#0A0A0F] rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2"
                      >
                         Reclaim Your ALGOs
                      </button>
                    </div>
                  ) : goalMet ? (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-[#6EE7B7]/20 to-[#818CF8]/20 border border-[#6EE7B7]/50 p-5 rounded-2xl relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#6EE7B7]/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                        <h4 className="text-[#6EE7B7] font-bold flex items-center gap-2 mb-2">
                          <Unlock className="w-4 h-4" /> Contract Unlocked
                        </h4>
                        <p className="text-xs text-[#F1F5F9]/80 leading-relaxed">Congratulations! Your goal has been met. You can now claim all accumulated ALGOs from the escrow.</p>
                      </div>
                      <button 
                        onClick={handleClaim}
                        disabled={processing}
                        className="w-full py-4 bg-gradient-to-r from-[#6EE7B7] to-[#818CF8] text-[#0A0A0F] rounded-2xl font-bold text-lg hover:shadow-[0_0_30px_rgba(110,231,183,0.4)] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                      >
                        {processing ? "Executing Claim..." : "Claim Escrow Funds"}
                      </button>
                      <button 
                        onClick={handleCancel}
                        disabled={processing}
                        className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-2xl font-bold transition-all flex justify-center items-center gap-2"
                      >
                        Cancel Campaign & Refund
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[#0A0A0F] border border-[#1E1E2E] p-6 rounded-2xl flex flex-col items-center text-center">
                      <Lock className="w-10 h-10 text-[#64748B] mb-4 opacity-50" />
                      <p className="font-bold text-[#F1F5F9] mb-1">Contract Locked</p>
                      <p className="text-xs text-[#64748B] mb-6">Funds are held securely by the smart contract until the goal is fully met. {Math.round(percent)}% complete.</p>
                      
                      <button 
                        onClick={handleCancel}
                        disabled={processing}
                        className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-2xl font-bold transition-all flex justify-center items-center gap-2 text-sm"
                      >
                        Cancel Campaign & Refund
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-6 border-t border-[#1E1E2E]">
                  {(campaign.status === 'active' && !goalMet) ? (
                    <>
                      <div className="relative mb-4">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#F1F5F9] text-lg">₹</span>
                        <input 
                          type="number"
                          value={donateAmount}
                          onChange={(e) => setDonateAmount(e.target.value)}
                          className="w-full bg-[#0A0A0F] border border-[#1E1E2E] focus:border-[#6EE7B7] text-[#F1F5F9] rounded-2xl pl-10 pr-4 py-4 font-bold text-2xl outline-none transition-all placeholder:text-[#334155]"
                          placeholder="Amount"
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-[#64748B] mb-6 px-1">
                        <span>Pera Wallet Cost</span>
                        <span className="text-[#818CF8] bg-[#818CF8]/10 px-2 py-0.5 rounded">
                          ≈ {((Number(donateAmount) || 0) / ALGO_RATE).toFixed(2)} ALGO
                        </span>
                      </div>
                      <button 
                        onClick={handleDonate}
                        disabled={processing || !donateAmount}
                        className="w-full py-5 bg-gradient-to-r from-[#6EE7B7] to-[#818CF8] text-[#0A0A0F] rounded-2xl font-black text-xl hover:shadow-[0_0_40px_rgba(110,231,183,0.3)] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                      >
                        {processing ? "Processing..." : "Donate with Pera"}
                      </button>
                      
                      <div className="mt-8 pt-6 border-t border-[#1E1E2E]/50">
                        <p className="text-xs text-[#64748B] text-center mb-4 italic">Not reaching the goal? You can get a refund if the deadline passes.</p>
                        {new Date(campaign.deadline).getTime() < Date.now() && !goalMet && (
                           <button 
                           onClick={handleRefund}
                           disabled={processing}
                           className="w-full py-4 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 rounded-2xl font-bold transition-all text-sm flex items-center justify-center gap-2"
                         >
                           <AlertCircle className="w-4 h-4" /> Request Smart Refund
                         </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-8 bg-[#0A0A0F] border border-[#1E1E2E] rounded-3xl text-[#F1F5F9]">
                      {campaign.status === 'cancelled' ? (
                        <>
                          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                          <p className="font-bold text-xl mb-2 text-red-500">Campaign Cancelled</p>
                          <p className="text-sm text-[#64748B] mb-6">The creator has cancelled this campaign. You can reclaim your contribution below.</p>
                          
                          <button 
                            onClick={handleRefund}
                            disabled={processing}
                            className="w-full py-4 bg-red-500 text-[#0A0A0F] rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                          >
                             Reclaim Your ALGOs
                          </button>
                        </>
                      ) : goalMet ? (
                         <>
                          <CheckCircle2 className="w-12 h-12 text-[#6EE7B7] mx-auto mb-4" />
                          <p className="font-bold text-xl mb-2 text-[#6EE7B7]">Goal Reached!</p>
                          <p className="text-sm text-[#64748B]">This campaign was successful and is no longer accepting donations. 🎉</p>
                        </>
                      ) : (
                        <>
                          <Lock className="w-12 h-12 text-[#64748B] mx-auto mb-4 opacity-20" />
                          <p className="font-bold text-xl mb-2">Campaign Closed</p>
                          <p className="text-sm text-[#64748B]">The deadline has passed without reaching the goal. Donors can now request a refund below.</p>
                          
                          <button 
                            onClick={handleRefund}
                            disabled={processing}
                            className="w-full mt-6 py-4 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 rounded-2xl font-bold transition-all text-sm flex items-center justify-center gap-2"
                          >
                            <AlertCircle className="w-4 h-4" /> Request Smart Refund
                          </button>
                        </>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
