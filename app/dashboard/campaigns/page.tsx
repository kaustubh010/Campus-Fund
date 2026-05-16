"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useWallet } from '@/context/wallet-context'
import { algodClient, waitForConfirmation } from '@/lib/algorand'
import { signTransaction } from '@/lib/pera-wallet'
import { 
  Building2, 
  Search, 
  Filter, 
  MoreVertical, 
  Plus,
  ArrowUpRight,
  Users,
  Pencil,
  Trash2
} from "lucide-react"
import { toast } from "react-toastify"
import Link from "next/link"
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

export default function CampaignManager() {
  const { user } = useAuth()
  const { wallet } = useWallet()
  const [searchTerm, setSearchTerm] = useState("")
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null)
  const [purgeCampaignId, setPurgeCampaignId] = useState<string | null>(null)
  const [purgeTitleInput, setPurgeTitleInput] = useState("")

  const decodeUnsignedTxn = (b64: string) => {
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/company/dashboard')
      const json = await res.json()
      if (json.campaigns) setCampaigns(json.campaigns)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [campaigns, searchTerm])



  const handleClaim = async (id: string) => {
    window.location.href = `/campaigns/${id}`
  }

  /** Soft cancel: refunds on-chain when needed, keeps campaign row as `cancelled`. */
  const handleSoftCancel = async (id: string) => {
    const camp = campaigns.find(c => c.id === id)
    if (!camp) return

    setCampaignToDelete(null)
    setIsProcessing(true)

    try {
      const prepRes = await fetch(`/api/campaigns/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'prepare' }),
      })
      const prepared = await prepRes.json()
      if (!prepRes.ok) throw new Error(prepared.error || 'Failed to prepare cancel')

      if (prepared.dbOnly) {
        const finRes = await fetch(`/api/campaigns/${id}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'finalize' }),
        })
        const finData = await finRes.json()
        if (!finRes.ok) throw new Error(finData.error || 'Finalize failed')
        toast.success('Campaign cancelled.')
        setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'cancelled' } : c)))
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

      toast.update('del-toast', { render: 'Saving…', type: 'info' })
      const finRes = await fetch(`/api/campaigns/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalize', txId }),
      })
      const finData = await finRes.json()
      if (!finRes.ok) throw new Error(finData.error)

      toast.dismiss('del-toast')
      toast.success('Campaign cancelled; donors refunded on-chain.')
      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'cancelled' } : c)))
    } catch (err: any) {
      toast.dismiss('del-toast')
      toast.error(err.message || 'Cancel failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePurgeSubmit = async () => {
    if (!purgeCampaignId) return
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/campaigns/${purgeCampaignId}/purge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmTitle: purgeTitleInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Purge failed')
      toast.success('Campaign permanently removed from the database.')
      setCampaigns((prev) => prev.filter((c) => c.id !== purgeCampaignId))
      setPurgeCampaignId(null)
      setPurgeTitleInput('')
    } catch (err: any) {
      toast.error(err.message || 'Purge failed')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!user || user.role !== "COMPANY") {
    return <div>Access Denied</div>
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#F1F5F9] font-[Syne]">
              Campaign <span className="text-[#6EE7B7]">Manager</span>
            </h1>
            <p className="text-[#64748B] mt-1">Manage your fundraising efforts and track performance.</p>
          </div>
          <Link 
            href="/campaigns/create"
            className="flex items-center gap-2 bg-[#6EE7B7] text-[#0A0A0F] px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" /> Start New
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
            <input 
              type="text" 
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111118] border border-[#1E1E2E] rounded-xl pl-12 pr-4 py-3 text-[#F1F5F9] outline-none focus:border-[#6EE7B7]/50 transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 bg-[#111118] border border-[#1E1E2E] px-6 py-3 rounded-xl text-[#F1F5F9] hover:bg-[#1E1E2E] transition-colors">
            <Filter className="w-5 h-5 text-[#64748B]" /> Filters
          </button>
        </div>

        {/* Table/List */}
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#0A0A0F] border-b border-[#1E1E2E]">
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">Progress</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">Donors</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1E2E]">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-[#64748B]">
                    {isLoading ? "Loading campaigns..." : "No campaigns found."}
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-[#1E1E2E]/30 transition-colors group">
                    <td className="px-6 py-5">
                      <Link href={`/campaigns/${camp.id}`} className="flex items-center gap-4 cursor-pointer">
                        <div className="w-10 h-10 bg-[#0A0A0F] border border-[#1E1E2E] rounded flex items-center justify-center font-bold text-[#6EE7B7]">
                          {camp.title[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-[#F1F5F9] group-hover:text-[#6EE7B7] transition-colors">{camp.title}</h4>
                          <p className="text-xs text-[#64748B]">{camp.category}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        camp.status.toLowerCase() === "active" 
                          ? "bg-[#6EE7B7]/10 text-[#6EE7B7]" 
                          : camp.status.toLowerCase() === "funded"
                          ? "bg-[#10B981]/10 text-[#10B981]"
                          :                         camp.status.toLowerCase() === "claimed"
                          ? "bg-[#818CF8]/10 text-[#818CF8]"
                          : camp.status.toLowerCase() === "cancelled"
                          ? "bg-[#64748B]/20 text-[#94A3B8]"
                          : "bg-red-500/10 text-red-500"
                      }`}>
                        {camp.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="w-48">
                        <div className="flex justify-between text-[10px] text-[#64748B] mb-1">
                          <span>₹{camp.raised.toLocaleString()}</span>
                          <span>{Math.round((camp.raised / camp.goal) * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#1E1E2E] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#6EE7B7] rounded-full shadow-[0_0_8px_rgba(110,231,183,0.5)]" 
                            style={{ width: `${Math.min(100, (camp.raised / camp.goal) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-medium text-[#F1F5F9]">{camp.donors}</td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {camp.status.toLowerCase() === "funded" && (
                          <button 
                            onClick={() => handleClaim(camp.id)}
                            className="bg-[#6EE7B7] text-[#0A0A0F] text-[10px] font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
                          >
                            <ArrowUpRight className="w-3 h-3" /> Claim Funds
                          </button>
                        )}
                        {camp.status.toLowerCase() === "claimed" && (
                          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mr-2">Funds Claimed</span>
                        )}
                        <Link href={`/campaigns/${camp.id}/edit`} className="bg-[#818CF8]/10 text-[#818CF8] text-[10px] font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1">
                          <Pencil className="w-3 h-3" /> Edit
                        </Link>
                        {camp.status.toLowerCase() !== 'cancelled' && (
                          <button
                            onClick={() => setCampaignToDelete(camp.id)}
                            className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
                          >
                            End
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setPurgeCampaignId(camp.id)
                            setPurgeTitleInput('')
                          }}
                          className="bg-red-500/10 text-red-500 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Purge
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!campaignToDelete} onOpenChange={(open) => !open && setCampaignToDelete(null)}>
        <AlertDialogContent className="bg-[#111118] border-[#1E1E2E] text-[#F1F5F9]">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this campaign?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#64748B]">
              Refunds donors on-chain when the escrow holds ALGO. The campaign remains visible as cancelled. Use Purge only to remove it from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#1E1E2E] border-none text-[#F1F5F9] hover:bg-[#2d3d2b] hover:text-[#F1F5F9]">
              Back
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => campaignToDelete && handleSoftCancel(campaignToDelete)} 
              className="bg-amber-600 hover:bg-amber-500 text-[#0A0A0F] font-bold"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Yes, cancel campaign'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!purgeCampaignId} onOpenChange={(open) => { if (!open) { setPurgeCampaignId(null); setPurgeTitleInput('') } }}>
        <AlertDialogContent className="bg-[#111118] border-[#1E1E2E] text-[#F1F5F9]">
          <AlertDialogHeader>
            <AlertDialogTitle>Purge from database</AlertDialogTitle>
            <AlertDialogDescription className="text-[#64748B] space-y-2">
              <span className="block">This permanently deletes the campaign and related records. Blocked if funds remain on-chain (cancel first).</span>
              <span className="block text-amber-200/90 text-xs">Type the exact campaign title to confirm.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            value={purgeTitleInput}
            onChange={(e) => setPurgeTitleInput(e.target.value)}
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] mb-4"
            placeholder="Campaign title"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#1E1E2E] border-none text-[#F1F5F9]">Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurgeSubmit}
              className="bg-red-600 hover:bg-red-500 text-white font-bold"
              disabled={isProcessing}
            >
              {isProcessing ? 'Purging…' : 'Purge forever'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
