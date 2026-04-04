"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { 
  TrendingUp, 
  Users, 
  Target, 
  Sparkles, 
  Plus, 
  LayoutDashboard,
  Megaphone,
  History,
  CreditCard,
  ArrowUpRight
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CompanyDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/company/dashboard')
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setData(json)
      } catch (err: any) {
        console.error(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboardData()
  }, [])
  
  if (!user || user.role !== "COMPANY") {
    return (
      <div className="min-h-screen bg-[#0A0A0F] pt-24 px-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#64748B] mb-4">Access Denied: Organizations Only</p>
          <Link href="/upgrade" className="text-[#6EE7B7] hover:underline font-bold">Upgrade Account</Link>
        </div>
      </div>
    )
  }

  const s = data?.stats || { totalRaised: 0, activeCampaigns: 0, totalDonors: 0, claimedFunds: 0 }
  const stats = [
    { label: "Total Raised", value: `₹${s.totalRaised.toLocaleString()}`, icon: TrendingUp, color: "text-[#6EE7B7]", bg: "bg-[#6EE7B7]/10" },
    { label: "Active Campaigns", value: s.activeCampaigns.toString(), icon: Target, color: "text-[#818CF8]", bg: "bg-[#818CF8]/10" },
    { label: "Total Donors", value: s.totalDonors.toString(), icon: Users, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Claimed Funds", value: `₹${s.claimedFunds.toLocaleString()}`, icon: Sparkles, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ]

  const campaigns = data?.campaigns || []

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#F1F5F9] font-[Syne]">
              Organization <span className="text-[#6EE7B7]">Dashboard</span>
            </h1>
            <p className="text-[#64748B] mt-1">Welcome back, {user.name}. Here's what's happening today.</p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/campaigns/create"
              className="flex items-center gap-2 bg-[#6EE7B7] text-[#0A0A0F] px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" /> New Campaign
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[#111118] border border-[#1E1E2E] p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-[#0A0A0F] border border-[#1E1E2E] ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm font-medium text-[#64748B]">{stat.label}</p>
              <h3 className="text-2xl font-bold text-[#F1F5F9] mt-1">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions/Overview */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-[#1E1E2E] flex items-center justify-between">
                <h2 className="font-bold text-[#F1F5F9] flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-[#6EE7B7]" /> Active Campaigns
                </h2>
                <Link href="/dashboard/company/campaigns" className="text-sm text-[#6EE7B7] hover:underline">
                  View All
                </Link>
              </div>
              <div className="p-6">
                {/* Mock Campaign Row */}
                <div className="flex items-center justify-between p-4 bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl hover:border-[#6EE7B7]/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#1E1E2E] rounded-lg animate-pulse" />
                    <div>
                      <h4 className="font-bold text-[#F1F5F9]">Tech Symposium 2026</h4>
                      <p className="text-xs text-[#64748B]">80% of ₹10,000 raised</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-[#6EE7B7]/10 text-[#6EE7B7] text-[10px] font-bold rounded uppercase">Active</span>
                    <button className="text-[#64748B] hover:text-[#F1F5F9]">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            {/* Navigation Menu */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 space-y-2">
              <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-4">Quick Links</h3>
              <Link href="/dashboard/company/campaigns" className="flex items-center gap-3 p-3 bg-[#0A0A0F] text-[#F1F5F9] rounded-xl border border-[#1E1E2E] hover:border-[#6EE7B7]/50 transition-all font-medium">
                <LayoutDashboard className="w-5 h-5 text-[#6EE7B7]" /> Campaign Manager
              </Link>
              <Link href="/dashboard/company/donors" className="flex items-center gap-3 p-3 text-[#64748B] hover:bg-[#0A0A0F] hover:text-[#F1F5F9] rounded-xl transition-all font-medium">
                <Users className="w-5 h-5" /> Donor Analytics
              </Link>
              <Link href="/dashboard/company/audit" className="flex items-center gap-3 p-3 text-[#64748B] hover:bg-[#0A0A0F] hover:text-[#F1F5F9] rounded-xl transition-all font-medium">
                <History className="w-5 h-5" /> Audit Trail
              </Link>
              <Link href="/dashboard/company/subscription" className="flex items-center gap-3 p-3 text-[#64748B] hover:bg-[#0A0A0F] hover:text-[#F1F5F9] rounded-xl transition-all font-medium">
                <CreditCard className="w-5 h-5" /> Subscription
              </Link>
            </div>

            {/* Plan Badge */}
            <div className="bg-[#6EE7B7] p-6 rounded-2xl text-[#0A0A0F]">
              <h4 className="font-bold mb-1">PRO PLAN ACTIVE</h4>
              <p className="text-xs opacity-75 mb-4">You have unlimited campaigns and full analytics.</p>
              <button className="w-full py-2 bg-[#0A0A0F] text-[#6EE7B7] rounded-xl font-bold text-sm">
                Manage Billing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
