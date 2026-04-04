"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { 
  Building2, 
  Search, 
  Filter, 
  MoreVertical, 
  ExternalLink,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Users
} from "lucide-react"
import { toast } from "react-toastify"
import Link from "next/link"

export default function CampaignManager() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")

  // Mock Data
  const campaigns = [
    { 
      id: "1", 
      title: "Tech Symposium 2026", 
      raised: 8200, 
      goal: 10000, 
      donors: 45, 
      status: "Active",
      category: "Education",
      date: "2026-05-15"
    },
    { 
      id: "2", 
      title: "Campus Tree Planting", 
      raised: 2500, 
      goal: 2500, 
      donors: 12, 
      status: "Funded",
      category: "Social Cause",
      date: "2026-04-20"
    },
    { 
      id: "3", 
      title: "Robotics Club Kits", 
      raised: 1200, 
      goal: 5000, 
      donors: 8, 
      status: "Active",
      category: "Tech",
      date: "2026-08-10"
    }
  ]

  const handleClaim = async (id: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}/claim`, { method: 'POST' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to claim funds');
      }
      toast.success('Funds claimed successfully!');
      // Refresh local state or window
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
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
              {campaigns.map((camp) => (
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
                      camp.status === "Active" 
                        ? "bg-[#6EE7B7]/10 text-[#6EE7B7]" 
                        : camp.status === "Funded"
                        ? "bg-[#10B981]/10 text-[#10B981]"
                        : camp.status === "claimed"
                        ? "bg-[#818CF8]/10 text-[#818CF8]"
                        : "bg-red-500/10 text-red-500"
                    }`}>
                      {camp.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="w-48">
                      <div className="flex justify-between text-[10px] text-[#64748B] mb-1">
                        <span>₹{camp.raised}</span>
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
                      {camp.status === "Funded" && (
                        <button 
                          onClick={() => handleClaim(camp.id)}
                          className="bg-[#6EE7B7] text-[#0A0A0F] text-[10px] font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
                        >
                          <ArrowUpRight className="w-3 h-3" /> Claim Funds
                        </button>
                      )}
                      {camp.status === "claimed" && (
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mr-2">Funds Claimed</span>
                      )}
                      <button className="p-2 text-[#64748B] hover:text-[#F1F5F9] transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
