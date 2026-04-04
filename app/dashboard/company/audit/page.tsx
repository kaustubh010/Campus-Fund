"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { 
  ShieldCheck, 
  ExternalLink, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCcw,
  Clock,
  CheckCircle2,
  Loader2
} from "lucide-react"
import Link from "next/link"

export default function AuditTrail() {
  const { user } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAuditTrail = async () => {
      try {
        const res = await fetch('/api/company/dashboard')
        const json = await res.json()
        if (json.transactions) setEvents(json.transactions)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAuditTrail()
  }, [])

  if (!user || user.role !== "COMPANY") {
    return <div>Access Denied</div>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#6EE7B7] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#F1F5F9] font-[Syne]">
              Audit <span className="text-[#6EE7B7]">Trail</span>
            </h1>
            <p className="text-[#64748B] mt-1">Immutable record of all on-chain transactions and campaign events.</p>
          </div>
          <div className="flex items-center gap-2 bg-[#6EE7B7]/10 border border-[#6EE7B7]/20 px-4 py-2 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-[#6EE7B7]" />
            <span className="text-xs font-bold text-[#6EE7B7] uppercase tracking-wider">Verified on Algorand</span>
          </div>
        </div>

        {/* Audit Log List */}
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-20 bg-[#111118] border border-[#1E1E2E] rounded-2xl">
              <Clock className="w-12 h-12 text-[#64748B] mx-auto mb-4 opacity-20" />
              <p className="text-[#64748B]">No transactions found yet.</p>
            </div>
          ) : events.map((event) => (
            <div key={event.id} className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 hover:border-[#6EE7B7]/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                  event.type === "Deposit" ? "bg-green-500/10 border-green-500/20 text-green-500" :
                  event.type === "Claim" ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
                  "bg-red-500/10 border-red-500/20 text-red-500"
                }`}>
                  {event.type === "Deposit" ? <ArrowDownLeft className="w-6 h-6" /> :
                   event.type === "Claim" ? <ArrowUpRight className="w-6 h-6" /> :
                   <RefreshCcw className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#F1F5F9]">{event.type} of {event.amountALGO.toFixed(2)} ALGO</h4>
                    <span className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase"><CheckCircle2 className="w-3 h-3" /> {event.status}</span>
                  </div>
                  <p className="text-sm text-[#64748B]">Campaign: <span className="text-[#F1F5F9]">{event.campaign}</span></p>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-2">
                <div className="flex items-center gap-2 text-xs text-[#64748B]">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(event.date).toLocaleString()}
                </div>
                <Link 
                  href={`https://testnet.explorer.perawallet.app/tx/${event.txId}`} 
                  target="_blank"
                  className="flex items-center gap-2 text-sm text-[#6EE7B7] hover:underline font-mono"
                >
                  TX: {event.txId.substring(0, 12)}... <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
