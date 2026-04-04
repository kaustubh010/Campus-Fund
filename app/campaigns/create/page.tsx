'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WalletChip } from '@/components/wallet-chip'
import { useWallet } from '@/context/wallet-context'
import { ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Building2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '@/hooks/useAuth'
import { useAlgoRate } from '@/hooks/useAlgoRate'
import Link from 'next/link'
import algosdk from 'algosdk'
import { algodClient, algoToMicroAlgo, waitForConfirmation } from '@/lib/algorand'
import { signTransaction } from '@/lib/pera-wallet'

export default function CreateCampaignPage() {
  const router = useRouter()
  const { wallet } = useWallet()
  const { user, isLoading: isAuthLoading } = useAuth()
  const ALGO_RATE = useAlgoRate()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthLoading) return null

  if (!user || user.role !== 'COMPANY') {
    return (
      <div className="min-h-screen bg-[#0A0A0F] pt-32 px-6 flex items-center justify-center">
        <div className="bg-[#111118] border border-[#1E1E2E] p-10 rounded-3xl max-w-lg text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#818CF8]/10 blur-[60px]" />
          <div className="w-16 h-16 bg-[#818CF8]/10 border border-[#818CF8]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#818CF8]">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-[#F1F5F9] font-[Syne] mb-4">Organizations Only</h2>
          <p className="text-[#64748B] mb-8 leading-relaxed">
            Campaign creation is reserved for verified organization accounts. Upgrade your account today to start raising funds for your cause.
          </p>
          <div className="flex flex-col gap-3">
            <Link 
              href="/upgrade" 
              className="w-full bg-[#818CF8] text-[#0A0A0F] font-bold px-6 py-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all"
            >
              <Sparkles className="w-5 h-5" /> Upgrade to Organization
            </Link>
            <Link 
              href="/campaigns" 
              className="w-full text-[#64748B] hover:text-[#F1F5F9] font-medium py-2 transition-colors"
            >
              Back to Explore
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Events')
  const [coverImage, setCoverImage] = useState('')
  const [goalINR, setGoalINR] = useState('')
  const [deadline, setDeadline] = useState('')

  const handleNext = () => {
    if (step === 1) {
      if (!title || !description) {
        toast.error('Please fill in title and description')
        return
      }
    }
    if (step === 2) {
      if (!goalINR || Number(goalINR) <= 0) {
        toast.error('Please enter a valid funding goal')
        return
      }
    }
    setStep((prev) => prev + 1)
  }

  const handleCreate = async () => {
    if (!wallet.isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Get Compiled Programs
      const paramsRes = await fetch('/api/campaigns/deploy-params')
      const { approvalProgram: approvalBase64, clearProgram: clearBase64, error } = await paramsRes.json()
      if (error) throw new Error(`Failed to get deploy params: ${error}`)

      const approvalProgram = new Uint8Array(Buffer.from(approvalBase64, 'base64'))
      const clearProgram = new Uint8Array(Buffer.from(clearBase64, 'base64'))

      // 2. Prepare Deployment Transaction
      const suggestedParams = await algodClient.getTransactionParams().do()
      const goalALGO = Number(goalINR) / ALGO_RATE
      const goalMicroAlgos = algoToMicroAlgo(goalALGO)
      const deadlineTs = deadline ? Math.floor(new Date(deadline).getTime() / 1000) : Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60

      const appArgs = [
        algosdk.encodeUint64(goalMicroAlgos),
        algosdk.encodeUint64(deadlineTs)
      ]

      const txn = algosdk.makeApplicationCreateTxnFromObject({
        from: wallet.address!,
        suggestedParams,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        approvalProgram,
        clearProgram,
        numGlobalInts: 5,
        numGlobalByteSlices: 1,
        numLocalInts: 1,
        numLocalByteSlices: 0,
        appArgs,
      })

      // 3. Sign and Send Deployment
      toast.info('Deploying Smart Contract. Please sign in Pera Wallet...', { autoClose: 5000 })
      const signResult = await signTransaction(txn.toByte(), wallet.address!)
      if (!signResult.success || !signResult.signedTransaction) {
        throw new Error(signResult.error || 'Failed to sign deployment')
      }

      const signedResult = signResult.signedTransaction;
      const signedTxn = Array.isArray(signedResult) ? signedResult[0] : signedResult;
      const { txId } = await algodClient.sendRawTransaction(signedTxn).do()

      const confirmResult = await waitForConfirmation(txId)
      if (!confirmResult.success) throw new Error('Deployment confirmation failed')

      const appId = confirmResult.confirmation!['application-index']
      const escrowAddress = algosdk.getApplicationAddress(appId)

      // 4. Initial Funding (0.2 ALGO for MBR and Fees)
      toast.info('Funding smart contract for security...', { autoClose: 3000 })
      const fundTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: wallet.address!,
        to: escrowAddress,
        amount: 200000, // 0.2 ALGO
        suggestedParams,
      })

      const fundSignResult = await signTransaction(fundTxn.toByte(), wallet.address!)
      if (fundSignResult.success && fundSignResult.signedTransaction) {
        const signedFundTxn = Array.isArray(fundSignResult.signedTransaction) ? fundSignResult.signedTransaction[0] : fundSignResult.signedTransaction;
        await algodClient.sendRawTransaction(signedFundTxn).do()
        await waitForConfirmation(fundTxn.txID())
      }

      // 4. Update Backend
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          coverImage,
          goalINR: Number(goalINR),
          deadline: deadline || null,
          appId,
          escrowAddress
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to sync campaign with backend')
      }

      const data = await res.json()
      toast.success('Campaign launched successfully!')
      router.push(`/campaigns/${data.campaign.id}`)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error creating campaign')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6EE7B7 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="max-w-2xl mx-auto px-6 relative z-10">
        
        {/* Header & Progress */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold font-[Syne] text-[#F1F5F9] mb-6">
            Launch a Campaign
          </h1>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  step === i ? 'bg-[#6EE7B7] text-[#0A0A0F]' : step > i ? 'bg-[#22C55E] text-[#0A0A0F]' : 'bg-[#1E1E2E] text-[#64748B]'
                }`}>
                  {step > i ? <CheckCircle2 className="w-5 h-5" /> : i}
                </div>
                {i < 3 && (
                  <div className={`w-12 md:w-20 h-1 mx-2 rounded-full ${step > i ? 'bg-[#22C55E]' : 'bg-[#1E1E2E]'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Box */}
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-3xl p-6 md:p-10 shadow-2xl">
          
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-[#F1F5F9] mb-6">1. The Basics</h2>
              
              <div>
                <label className="block text-sm font-medium text-[#F1F5F9] mb-2">Campaign Title *</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] focus:border-[#6EE7B7] text-[#F1F5F9] rounded-xl px-4 py-3 outline-none transition-colors" 
                  placeholder="e.g. Robot Wars Team Funding" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F1F5F9] mb-2">Category *</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] focus:border-[#6EE7B7] text-[#F1F5F9] rounded-xl px-4 py-3 outline-none appearance-none"
                >
                  <option>Education</option>
                  <option>Events</option>
                  <option>Social</option>
                  <option>Tech</option>
                  <option>Arts</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F1F5F9] mb-2">Story / Description *</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] focus:border-[#6EE7B7] text-[#F1F5F9] rounded-xl px-4 py-3 outline-none transition-colors min-h-[150px]" 
                  placeholder="Tell your story. Why should people fund this?" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F1F5F9] mb-2">Cover Image URL (Optional)</label>
                <input 
                  type="url" 
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] focus:border-[#6EE7B7] text-[#F1F5F9] rounded-xl px-4 py-3 outline-none transition-colors" 
                  placeholder="https://..." 
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-[#F1F5F9] mb-6">2. Funding Goal</h2>
              
              <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-6 mb-6">
                <label className="block text-sm font-medium text-[#F1F5F9] mb-4">How much do you need to raise?</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-[#F1F5F9]">₹</span>
                  <input 
                    type="number" 
                    value={goalINR}
                    onChange={(e) => setGoalINR(e.target.value)}
                    className="w-full bg-transparent border-0 focus:ring-0 text-[#F1F5F9] text-4xl font-bold pl-12 py-2 outline-none font-[Syne]" 
                    placeholder="50000" 
                  />
                </div>
                <div className="mt-4 pt-4 border-t border-[#1E1E2E] flex justify-between items-center text-sm">
                  <span className="text-[#64748B]">Convert to Escrow Currency:</span>
                  <span className="text-[#6EE7B7] font-[JetBrains_Mono] bg-[#6EE7B7]/10 px-3 py-1 rounded-lg font-bold">
                    ≈ {(Number(goalINR) || 0) / ALGO_RATE} ALGO
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F1F5F9] mb-2">Campaign Deadline (Optional)</label>
                <input 
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] focus:border-[#6EE7B7] text-[#F1F5F9] rounded-xl px-4 py-3 outline-none transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
                <p className="text-xs text-[#64748B] mt-2">If left blank, the campaign will run indefinitely until the goal is met.</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-[#F1F5F9] mb-6">3. Smart Escrow Setup</h2>
              
              <div className="bg-[#6EE7B7]/10 border border-[#6EE7B7]/30 rounded-xl p-6">
                <h3 className="font-bold text-[#6EE7B7] mb-2">How this works</h3>
                <p className="text-sm text-[#F1F5F9]/80 leading-relaxed">
                  When you deploy this campaign, we will generate a unique Algorand keypair to act as a <strong>Smart Escrow</strong>. All donations will be held securely on the blockchain. Once the goal of ₹{goalINR} (≈{(Number(goalINR) / ALGO_RATE).toFixed(2)} ALGO) is reached, you will be able to claim the funds directly to your connected wallet.
                </p>
              </div>

              <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-6">
                <p className="text-sm text-[#64748B] mb-4">Your payout wallet (must be connected):</p>
                <WalletChip />
                {!wallet.isConnected && (
                  <p className="text-[#EF4444] text-xs mt-3 bg-[#EF4444]/10 p-2 rounded-md">
                    Please connect your Pera Wallet to continue.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#1E1E2E]">
            {step > 1 ? (
              <button 
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 text-[#F1F5F9] hover:text-[#6EE7B7] font-bold transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button 
                onClick={handleNext}
                className="px-8 py-3 bg-[#F1F5F9] text-[#0A0A0F] rounded-xl font-bold hover:bg-[#6EE7B7] transition-colors flex items-center gap-2"
              >
                Next Step <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={handleCreate}
                disabled={isSubmitting || !wallet.isConnected}
                className="px-8 py-3 bg-[#6EE7B7] text-[#0A0A0F] rounded-xl font-bold hover:bg-[#52af35] transition-all flex items-center gap-2 disabled:opacity-50 shadow-[0_0_15px_rgba(110,231,183,0.3)] hover:shadow-[0_0_25px_rgba(110,231,183,0.5)]"
              >
                {isSubmitting ? "Deploying..." : "Launch Campaign"} <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
