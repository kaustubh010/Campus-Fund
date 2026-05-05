'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useWallet } from '@/context/wallet-context'
import { ExternalLink, Copy, CheckCircle2, Lock, Unlock, ShieldCheck, Users, Calendar, AlertCircle, XCircle, FileText, UploadCloud } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'react-toastify'
import { useAlgoRate } from '@/hooks/useAlgoRate'
import RazorpayCheckout from '@/components/RazorpayCheckout'
import Link from 'next/link'
import algosdk from 'algosdk'
import { algodClient, algoToMicroAlgo, waitForConfirmation } from '@/lib/algorand'
import { signTransaction } from '@/lib/pera-wallet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [invoiceEdits, setInvoiceEdits] = useState<Record<string, string>>({})
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

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

      const txns = [];
      txns.push(algosdk.makeApplicationNoOpTxnFromObject({
        from: wallet.address!,
        appIndex: campaign.appId,
        appArgs: [new TextEncoder().encode('donate')],
        suggestedParams,
      }));
      txns.push(algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: wallet.address!,
        to: appAddr,
        amount: microAlgos,
        suggestedParams,
      }));
      const txnGroup = algosdk.assignGroupID(txns);

      const signResult = await signTransaction(txnGroup.map((t) => t.toByte()), wallet.address!)
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

      const txIds = txnGroup.map(t => t.txID().toString());
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
        body: JSON.stringify({ txId, txIds }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || 'Transaction failed to sync with backend')
      }
      
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
    toast.info('Refunds are handled via creator claim/delete flow in the new contract.')
  }

  const decodeUnsignedTxn = (b64: string) => {
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }

  const handleInvoiceUpload = async () => {
    if (!invoiceFile) {
      toast.error('Select an invoice file first')
      return
    }

    setProcessing(true)
    setProcessingAction('upload')
    try {
      const formData = new FormData()
      formData.append('invoice', invoiceFile)

      const res = await fetch(`/api/campaigns/${campaignId}/invoices`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invoice upload failed')
      toast.success('Invoice uploaded. Review OCR amount, accept each line, then lock on-chain.')
      setInvoiceFile(null)
      await fetchCampaign()
    } catch (err: any) {
      toast.error(err.message || 'Invoice upload failed')
    } finally {
      setProcessing(false)
      setProcessingAction(null)
    }
  }

  const patchInvoice = async (invoiceId: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/campaigns/${campaignId}/invoices/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Update failed')
    await fetchCampaign()
  }

  const handleVerifyInvoice = async () => {
    if (!wallet.isConnected) {
      toast.error('Connect your Pera Wallet to lock the invoice total on-chain')
      return
    }
    setProcessing(true)
    setProcessingAction('verify')
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/invoice/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.reason || 'Could not prepare invoice lock')

      if (data.setInvoiceTxnB64) {
        toast.info('Please sign on-chain invoice lock in Pera', { autoClose: false, toastId: 'verify-toast' })
        const setInvoiceBytes = decodeUnsignedTxn(data.setInvoiceTxnB64)
        const setInvoiceSign = await signTransaction(setInvoiceBytes, wallet.address!)
        if (!setInvoiceSign.success || !setInvoiceSign.signedTransaction) {
          throw new Error(setInvoiceSign.error || 'Failed to sign invoice lock transaction')
        }
        const signedSet = Array.isArray(setInvoiceSign.signedTransaction)
          ? setInvoiceSign.signedTransaction[0]
          : setInvoiceSign.signedTransaction
        const { txId: setTxId } = await algodClient.sendRawTransaction(signedSet).do()
        await waitForConfirmation(setTxId)
        toast.dismiss('verify-toast')
      }

      toast.success('Invoice total locked on-chain')
      await fetchCampaign()
    } catch (err: any) {
      toast.dismiss('verify-toast')
      toast.error(err.message || 'Verification failed')
    } finally {
      setProcessing(false)
      setProcessingAction(null)
    }
  }

  const handleClaim = async () => {
    if (!wallet.isConnected) {
      toast.error('Connect your wallet')
      return
    }

    setProcessing(true)
    setProcessingAction('claim')
    try {
      const prepareRes = await fetch(`/api/campaigns/${campaignId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'prepare' }),
      })
      const prepared = await prepareRes.json()
      if (!prepareRes.ok) throw new Error(prepared.error || 'Failed to prepare claim txns')

      toast.info('Please sign claim transaction', { autoClose: false, toastId: 'claim-toast' })
      const claimBytes = decodeUnsignedTxn(prepared.claimTxnB64)
      const claimSign = await signTransaction(claimBytes, wallet.address!)
      if (!claimSign.success || !claimSign.signedTransaction) throw new Error(claimSign.error || 'Claim signing failed')
      const signedClaim = Array.isArray(claimSign.signedTransaction) ? claimSign.signedTransaction[0] : claimSign.signedTransaction

      const { txId } = await algodClient.sendRawTransaction(signedClaim).do()
      await waitForConfirmation(txId)
      
      toast.update('claim-toast', { render: 'Finalizing on database...', type: 'info' })
      const res = await fetch(`/api/campaigns/${campaignId}/claim`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalize', txId })
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
      setProcessingAction(null)
    }
  }

  const handleCancel = async () => {
    setCancelDialogOpen(false)

    setProcessing(true)
    setProcessingAction('cancel')
    try {
      const prepRes = await fetch(`/api/campaigns/${campaignId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'prepare' }),
      })
      const prepared = await prepRes.json()
      if (!prepRes.ok) throw new Error(prepared.error || 'Failed to prepare cancel')

      if (prepared.dbOnly) {
        const finRes = await fetch(`/api/campaigns/${campaignId}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'finalize' }),
        })
        if (!finRes.ok) {
          const e = await finRes.json().catch(() => ({}))
          throw new Error(e.error || 'Finalize failed')
        }
        toast.success('Campaign cancelled.')
        window.location.href = '/dashboard/company/campaigns'
        return
      }

      if (!wallet.isConnected) {
        toast.error('Connect your Pera Wallet to refund donors and remove the on-chain app.')
        return
      }

      toast.info('Please sign cancellation transaction', { autoClose: false, toastId: 'del-toast' })

      const bytes = decodeUnsignedTxn(prepared.cancelTxnB64)
      const sig = await signTransaction(bytes, wallet.address!)
      if (!sig.success || !sig.signedTransaction) throw new Error(sig.error || 'Signing failed')
      const signedDel = Array.isArray(sig.signedTransaction) ? sig.signedTransaction[0] : sig.signedTransaction

      const { txId } = await algodClient.sendRawTransaction(signedDel).do()
      await waitForConfirmation(txId)

      toast.update('del-toast', { render: 'Saving cancellation…', type: 'info' })
      const finRes = await fetch(`/api/campaigns/${campaignId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalize', txId }),
      })
      const finData = await finRes.json()
      if (!finRes.ok) throw new Error(finData.error)

      toast.dismiss('del-toast')
      toast.success('Refunds sent on-chain. Campaign marked cancelled.')
      window.location.href = '/dashboard/company/campaigns'
    } catch (err: any) {
      toast.dismiss('del-toast')
      toast.error(err.message || 'Cancel failed')
    } finally {
      setProcessing(false)
      setProcessingAction(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-12 flex flex-col items-center justify-center text-[#F1F5F9]">
        <Spinner className="w-10 h-10 text-[#6EE7B7] mb-6" />
        <span className="font-bold text-xl font-[Syne] tracking-wide text-[#6EE7B7]">Loading campaign...</span>
      </div>
    )
  }

  if (!campaign) {
    return <div className="min-h-screen bg-[#0A0A0F] pt-24 text-center text-[#EF4444]">Campaign not found</div>
  }

  const percent = (campaign.raisedALGO / campaign.goalALGO) * 100 || 0
  const isCreator = user?.id === campaign.creatorId
  const goalMet = campaign.raisedALGO >= campaign.goalALGO
  const deadlinePassed = campaign.deadline && new Date(campaign.deadline).getTime() < Date.now()
  const isCancelled =
    campaign.status === 'cancelled' || Number(campaign.appGlobalState?.deleted ?? 0) === 1
  const canClaim =
    isCreator && goalMet && campaign.status !== 'claimed' && campaign.status !== 'cancelled' && !isCancelled

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
              
              {/* Organizer Profile */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-8 border-b border-[#1E1E2E]">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-[#1E1E2E] rounded-full flex items-center justify-center text-[#6EE7B7] font-bold text-2xl border border-[#3d5a3b] shadow-[0_0_15px_rgba(110,231,183,0.15)] select-none">
                    {campaign.company?.orgName?.[0]?.toUpperCase() || campaign.creator.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs text-[#64748B] uppercase tracking-widest font-bold mb-1.5 block">Organized By</span>
                    <span className="font-bold text-[#F1F5F9] text-xl font-[Syne]">
                      {campaign.company?.orgName || campaign.creator.name}
                    </span>
                    {campaign.company && (
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] mt-2 font-medium">
                        {campaign.company.orgType && (
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-[#6EE7B7] opacity-80" /> {campaign.company.orgType}
                          </span>
                        )}
                        {campaign.company.university && (
                          <span className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 opacity-80" /> {campaign.company.university}
                          </span>
                        )}
                        {campaign.company.contactPerson && (
                          <span className="flex items-center gap-1.5">
                            Contact: {campaign.company.contactPerson}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-left md:text-right mt-2 md:mt-0">
                  <span className="text-xs text-[#64748B] uppercase tracking-widest font-bold mb-1.5 block">Campaign Started</span>
                  <span className="text-[#F1F5F9] font-medium text-base">{new Date(campaign.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="prose prose-invert max-w-none text-[#F1F5F9]/80 font-[DM_Sans] leading-relaxed">
                <p className="whitespace-pre-wrap">{campaign.description}</p>
              </div>

              {Array.isArray(campaign.invoices) && campaign.invoices.length > 0 && (
                <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 mt-8">
                  <h3 className="text-lg font-bold font-[Syne] text-[#F1F5F9] mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#6EE7B7]" /> Invoices (transparency)
                  </h3>
                  <ul className="space-y-3">
                    {campaign.invoices.map((inv: any) => (
                      <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 text-sm border border-[#1E1E2E] rounded-xl p-3 bg-[#0A0A0F]">
                        <a href={inv.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[#6EE7B7] hover:underline font-mono text-xs truncate max-w-[60%]">
                          View document
                        </a>
                        {inv.status === 'ACCEPTED' && inv.extractedAmountINR != null && (
                          <span className="text-[#F1F5F9] font-bold">₹{Number(inv.extractedAmountINR).toLocaleString()} accepted</span>
                        )}
                        {inv.status === 'PENDING_REVIEW' && isCreator && (
                          <span className="text-[#64748B] text-xs">Pending your review</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
                  <span className="text-[#64748B] pb-1">/ ₹{campaign.goalINR.toLocaleString()} {campaign.status === 'claimed' ? 'claimed' : 'target'}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold bg-[#1E1E2E] p-2 rounded-lg mb-4">
                  <span className="text-[#818CF8] font-[JetBrains_Mono] flex items-center gap-2">
                    <img src="https://cryptologos.cc/logos/algorand-algo-logo.svg?v=024" className="w-4 h-4" alt="" />
                    {campaign.raisedALGO.toFixed(1)} ALGO
                  </span>
                  <span className="text-[#64748B]">/ {campaign.goalALGO.toFixed(1)} ALGO {campaign.status === 'claimed' ? 'claimed' : 'target'}</span>
                </div>

                <div className="w-full bg-[#1E1E2E] h-2 rounded-full mb-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#6EE7B7] to-[#818CF8] rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(percent, 100)}%` }}
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
                      <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-2xl p-4 space-y-3">
                        <h4 className="font-bold text-[#F1F5F9] flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#6EE7B7]" /> Invoices (OCR + review)
                        </h4>
                        <label className="w-full relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#1E1E2E] hover:border-[#6EE7B7]/50 rounded-xl bg-[#111118] cursor-pointer transition-colors group">
                          <UploadCloud className="w-6 h-6 text-[#64748B] group-hover:text-[#6EE7B7] mb-2 transition-colors" />
                          <span className="text-xs text-[#F1F5F9] text-center font-bold">
                            {invoiceFile ? invoiceFile.name : 'Add PDF / image'}
                          </span>
                          <span className="text-[10px] text-[#64748B] mt-1">PDF, JPG, PNG — amount extracted by AI; edit before accept</span>
                          <input
                            type="file"
                            accept=".pdf,image/png,image/jpeg,image/webp"
                            onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            id="invoice-upload"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleInvoiceUpload}
                          disabled={processing || !invoiceFile}
                          className="w-full py-2 bg-[#1E1E2E] text-[#F1F5F9] rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 hover:bg-[#2A2A3A] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {processingAction === 'upload' && <Spinner className="w-3.5 h-3.5 text-[#F1F5F9]" />}
                          {processingAction === 'upload' ? 'Uploading...' : 'Upload'}
                        </button>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(campaign.invoices || []).map((inv: any) => (
                            <div key={inv.id} className="border border-[#1E1E2E] rounded-lg p-2 text-xs space-y-1">
                              <a href={inv.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[#6EE7B7] block truncate">
                                Open file
                              </a>
                              <div className="flex gap-1 items-center">
                                <span className="text-[#64748B]">₹</span>
                                <input
                                  className="flex-1 bg-[#111118] border border-[#1E1E2E] rounded px-2 py-1 text-[#F1F5F9]"
                                  value={
                                    invoiceEdits[inv.id] ??
                                    (inv.extractedAmountINR != null ? String(inv.extractedAmountINR) : '')
                                  }
                                  onChange={(e) =>
                                    setInvoiceEdits((m) => ({ ...m, [inv.id]: e.target.value }))
                                  }
                                  placeholder="INR total"
                                />
                              </div>
                              <div className="flex gap-2 flex-wrap mt-2">
                                <button
                                  type="button"
                                  disabled={processing || processingAction !== null}
                                  className="px-3 py-1.5 bg-[#6EE7B7]/10 hover:bg-[#6EE7B7]/20 text-[#6EE7B7] border border-[#6EE7B7]/20 rounded-lg transition-all cursor-pointer hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-1.5 font-bold text-xs"
                                  onClick={async () => {
                                    const actionId = `save-${inv.id}`;
                                    setProcessingAction(actionId);
                                    const raw = invoiceEdits[inv.id] ?? inv.extractedAmountINR
                                    const n = Number(raw)
                                    if (!Number.isFinite(n) || n <= 0) {
                                      toast.error('Enter a valid INR amount')
                                      setProcessingAction(null);
                                      return
                                    }
                                    try {
                                      await patchInvoice(inv.id, { extractedAmountINR: n })
                                      toast.success('Amount saved')
                                    } catch (e: any) {
                                      toast.error(e.message)
                                    } finally {
                                      setProcessingAction(null);
                                    }
                                  }}
                                >
                                  {processingAction === `save-${inv.id}` && <Spinner className="w-3.5 h-3.5" />}
                                  {processingAction === `save-${inv.id}` ? 'Saving...' : 'Save INR'}
                                </button>
                                <button
                                  type="button"
                                  disabled={processing || processingAction !== null || inv.status === 'ACCEPTED'}
                                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-all cursor-pointer hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-1.5 font-bold text-xs"
                                  onClick={async () => {
                                    const actionId = `accept-${inv.id}`;
                                    setProcessingAction(actionId);
                                    try {
                                      await patchInvoice(inv.id, { status: 'ACCEPTED' })
                                      toast.success('Accepted for claim total')
                                    } catch (e: any) {
                                      toast.error(e.message)
                                    } finally {
                                      setProcessingAction(null);
                                    }
                                  }}
                                >
                                  {processingAction === `accept-${inv.id}` && <Spinner className="w-3.5 h-3.5" />}
                                  {processingAction === `accept-${inv.id}` ? 'Accepting...' : 'Accept'}
                                </button>
                                <button
                                  type="button"
                                  disabled={processing || processingAction !== null}
                                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg transition-all cursor-pointer hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-1.5 font-bold text-xs"
                                  onClick={async () => {
                                    const actionId = `reject-${inv.id}`;
                                    setProcessingAction(actionId);
                                    try {
                                      await patchInvoice(inv.id, { status: 'REJECTED' })
                                    } catch (e: any) {
                                      toast.error(e.message)
                                    } finally {
                                      setProcessingAction(null);
                                    }
                                  }}
                                >
                                  {processingAction === `reject-${inv.id}` && <Spinner className="w-3.5 h-3.5" />}
                                  {processingAction === `reject-${inv.id}` ? 'Rejecting...' : 'Reject'}
                                </button>
                              </div>
                              <span className="text-[#64748B]">{inv.status}</span>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={handleVerifyInvoice}
                          disabled={processing}
                          className="w-full py-2 bg-[#6EE7B7]/20 text-[#6EE7B7] border border-[#6EE7B7]/30 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 hover:bg-[#6EE7B7]/30 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {processingAction === 'verify' && <Spinner className="w-3.5 h-3.5 text-[#6EE7B7]" />}
                          {processingAction === 'verify' ? 'Locking on-chain...' : 'Lock invoice total on-chain'}
                        </button>
                        <p className="text-[11px] text-[#64748B]">
                          Totals: ₹{campaign.invoiceAmountINR ?? '—'} · Status:{' '}
                          {campaign.invoiceVerificationStatus || 'NOT_SUBMITTED'}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-[#6EE7B7]/20 to-[#818CF8]/20 border border-[#6EE7B7]/50 p-5 rounded-2xl relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#6EE7B7]/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                        <h4 className="text-[#6EE7B7] font-bold flex items-center gap-2 mb-2">
                          <Unlock className="w-4 h-4" /> Contract Unlocked
                        </h4>
                        <p className="text-xs text-[#F1F5F9]/80 leading-relaxed">Congratulations! Your goal has been met. You can now claim all accumulated ALGOs from the escrow.</p>
                      </div>
                      <button 
                        onClick={handleClaim}
                        disabled={processing || campaign.invoiceVerificationStatus !== 'APPROVED'}
                        className="w-full py-4 bg-gradient-to-r from-[#6EE7B7] to-[#818CF8] text-[#0A0A0F] rounded-2xl font-bold text-lg hover:shadow-[0_0_30px_rgba(110,231,183,0.4)] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 disabled:transform-none"
                      >
                        {processingAction === 'claim' && <Spinner className="w-5 h-5 border-[#0A0A0F] text-[#0A0A0F]" />}
                        {processingAction === 'claim' ? "Executing Claim..." : "Claim Escrow Funds"}
                      </button>
                      <button 
                        onClick={() => setCancelDialogOpen(true)}
                        disabled={processing}
                        className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-2xl font-bold transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 disabled:transform-none"
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
                        onClick={() => setCancelDialogOpen(true)}
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
                  {(!['cancelled', 'claimed'].includes(campaign.status) && !deadlinePassed) ? (
                    <>
                      {goalMet && (
                         <div className="bg-gradient-to-br from-[#6EE7B7]/10 to-[#818CF8]/10 border border-[#6EE7B7]/30 p-4 rounded-2xl mb-6 relative overflow-hidden text-center">
                           <div className="absolute top-0 right-0 w-12 h-12 bg-[#6EE7B7]/5 rounded-full blur-xl" />
                           <h4 className="text-[#6EE7B7] text-xs font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                             <CheckCircle2 className="w-3 h-3" /> Goal Met
                           </h4>
                           <p className="text-[#F1F5F9] text-sm font-bold leading-tight">
                             Target reached! Still accepting contributions until the deadline.
                           </p>
                         </div>
                      )}
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
                      <p className="text-[10px] text-[#64748B] mb-3 leading-relaxed">
                        Refunds return to the same Pera address you pay from. Set your profile wallet to that address before donating.
                      </p>
                      <button 
                        onClick={handleDonate}
                        disabled={processing || !donateAmount}
                        className="w-full py-5 bg-gradient-to-r from-[#6EE7B7] to-[#818CF8] text-[#0A0A0F] rounded-2xl font-black text-xl hover:shadow-[0_0_40px_rgba(110,231,183,0.3)] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                      >
                        {processing ? "Processing..." : "Donate with Pera"}
                      </button>

                      <div className="mt-4">
                        <RazorpayCheckout
                          orderId={campaignId}
                          amount={Number(donateAmount) || 0}
                          name={user?.name || ""}
                          email={user?.email || ""}
                          phone="" // Optional or from user profile if available
                          onSuccess={(data) => {
                            toast.success("Payment successful! Razorpay ID: " + data.razorpayPaymentId);
                            // In a real app, you'd verify this on the backend
                            fetchCampaign();
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-8 bg-[#0A0A0F] border border-[#1E1E2E] rounded-3xl text-[#F1F5F9]">
                      {campaign.status === 'cancelled' ? (
                        <>
                          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                          <p className="font-bold text-xl mb-2 text-red-500">Campaign Cancelled</p>
                          <p className="text-sm text-[#64748B] mb-6">The creator has cancelled this campaign. Funds will be automatically refunded by the contract directly to your wallet.</p>
                        </>
                      ) : campaign.status === 'claimed' ? (
                        <>
                          <CheckCircle2 className="w-12 h-12 text-[#818CF8] mx-auto mb-4" />
                          <p className="font-bold text-xl mb-2 text-[#818CF8]">Goal Secured & Claimed</p>
                          <p className="text-sm text-[#64748B]">This campaign is finished and funds were successfully claimed by the creator. 🎉</p>
                        </>
                      ) : goalMet ? (
                         <>
                          <CheckCircle2 className="w-12 h-12 text-[#6EE7B7] mx-auto mb-4" />
                          <p className="font-bold text-xl mb-2 text-[#6EE7B7]">Goal Reached!</p>
                          <p className="text-sm text-[#64748B]">This campaign was successful and is pending final creator claims. 🎉</p>
                        </>
                      ) : (
                        <>
                          <Lock className="w-12 h-12 text-[#64748B] mx-auto mb-4 opacity-20" />
                          <p className="font-bold text-xl mb-2">Campaign Closed</p>
                          <p className="text-sm text-[#64748B]">The deadline has passed. Refunds are processed automatically by the contract.</p>
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

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="bg-[#111118] border-[#1E1E2E] text-[#F1F5F9]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#64748B]">
              Donors will be refunded on-chain (same wallet they paid from). The campaign will stay visible as cancelled for transparency. Use the dashboard &quot;Purge&quot; only if you need it removed from the database entirely.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#1E1E2E] border-none text-[#F1F5F9] hover:bg-[#2d3d2b] hover:text-[#F1F5F9]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-red-500 hover:bg-red-600 text-white font-bold">
              Yes, cancel campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
