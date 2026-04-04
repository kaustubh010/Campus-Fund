'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useWallet } from '@/context/wallet-context'
import { ExternalLink, Copy, CheckCircle2, Lock, Unlock, ShieldCheck, Users, Calendar, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAlgoRate } from '@/hooks/useAlgoRate'
import Link from 'next/link'

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
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`)
      const data = await res.json()
      if (data.campaign) {
        setCampaign(data.campaign)
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

    const amountInr = Number(donateAmount)
    if (!amountInr || amountInr <= 0) {
      toast.error('Enter a valid donation amount')
      return
    }

    setProcessing(true)
    try {
      // Real app: trigger Pera connect logic here to sign payment transaction 
      // await sendAlgorandTransaction(wallet.address, campaign.escrowAddress, amountInr / ALGO_RATE)
      
      // Simulate delay for Pera Wallet Connect
      await new Promise(res => setTimeout(res, 1500))
      
      const res = await fetch(`/api/campaigns/${campaignId}/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountINR: amountInr,
          amountALGO: amountInr / ALGO_RATE,
          txId: 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase()
        })
      })

      if (!res.ok) throw new Error('Transaction failed')
      
      toast.success('Donation successful! Thank you.')
      setDonateAmount('')
      fetchCampaign() // refresh state
    } catch (err) {
      toast.error('Donation failed')
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  const handleClaim = async () => {
    setProcessing(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/claim`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Funds claimed successfully to your wallet!')
      fetchCampaign()
    } catch (err: any) {
      toast.error(err.message || 'Claim failed')
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
  const canClaim = isCreator && goalMet && campaign.status !== 'claimed'

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
                    <Lock className="w-4 h-4" /> Creator Dashboard
                  </h3>
                  
                  {campaign.status === 'claimed' ? (
                    <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 p-4 rounded-xl flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[#22C55E] text-sm">Funds Transferred</p>
                        <p className="text-xs text-[#F1F5F9]/70 mt-1">Goal reached and funds swept back to your wallet.</p>
                      </div>
                    </div>
                  ) : goalMet ? (
                    canClaim ? (
                      <div>
                        <div className="bg-[#6EE7B7]/10 border border-[#6EE7B7] p-4 rounded-xl mb-4">
                          <p className="text-sm font-bold text-[#6EE7B7] mb-1">Goal Reached! 🎉</p>
                          <p className="text-xs text-[#F1F5F9]/80">The smart contract has unlocked. You can now claim your funds to your wallet.</p>
                        </div>
                        <button 
                          onClick={handleClaim}
                          disabled={processing}
                          className="w-full py-4 bg-[#6EE7B7] text-[#0A0A0F] rounded-xl font-bold text-lg hover:bg-[#52af35] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                        >
                          {processing ? "Processing..." : "Claim Escrow Funds"}
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-center text-[#64748B]">Claim pending / Unavailable</p>
                    )
                  ) : (
                    <div className="bg-[#0A0A0F] border border-[#1E1E2E] p-4 rounded-xl flex items-start gap-3">
                      <Lock className="w-5 h-5 text-[#64748B] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[#F1F5F9] text-sm">Escrow Locked</p>
                        <p className="text-xs text-[#64748B] mt-1">Funds are locked on blockchain until the goal is fully funded.</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-6 border-t border-[#1E1E2E]">
                  {campaign.status === 'active' ? (
                    <>
                      <div className="relative mb-4">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#F1F5F9]">₹</span>
                        <input 
                          type="number"
                          value={donateAmount}
                          onChange={(e) => setDonateAmount(e.target.value)}
                          className="w-full bg-[#0A0A0F] border border-[#1E1E2E] focus:border-[#6EE7B7] text-[#F1F5F9] rounded-xl pl-10 pr-4 py-4 font-bold text-xl outline-none"
                          placeholder="Amount"
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs text-[#64748B] mb-6 px-1">
                        <span>Pera Wallet Cost:</span>
                        <span className="text-[#818CF8] font-[JetBrains_Mono] font-bold">
                          ≈ {((Number(donateAmount) || 0) / ALGO_RATE).toFixed(2)} ALGO
                        </span>
                      </div>
                      <button 
                        onClick={handleDonate}
                        disabled={processing || !donateAmount}
                        className="w-full py-4 bg-[#6EE7B7] text-[#0A0A0F] rounded-xl font-bold text-lg hover:bg-[#52af35] transition-all flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(110,231,183,0.2)] hover:shadow-[0_0_25px_rgba(110,231,183,0.4)] disabled:opacity-50 disabled:shadow-none"
                      >
                        {processing ? "Confirming..." : "Donate via Pera Wallet"}
                      </button>
                      <p className="text-center text-xs text-[#64748B] mt-4 flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" /> Secure blockchain transaction
                      </p>
                    </>
                  ) : (
                    <div className="text-center p-4 bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl text-[#F1F5F9] font-bold">
                      Campaign no longer active
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
