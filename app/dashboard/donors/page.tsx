"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { 
  Users, 
  Search, 
  Download, 
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Filter,
  Loader2
} from "lucide-react"
import Link from "next/link"

export default function DonorAnalytics() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [donations, setDonations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const res = await fetch('/api/company/dashboard')
        const json = await res.json()
        if (json.donations) setDonations(json.donations)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDonors()
  }, [])

  const filteredDonors = donations.filter(d => 
    d.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.donorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.campaign.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleExport = () => {
    const headers = ["Donor Name", "Email", "Amount (₹)", "Campaign", "Date"]
    const rows = filteredDonors.map(d => [d.donorName, d.donorEmail, d.amountINR.toString(), d.campaign, d.date])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "donors_report.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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
              Donor <span className="text-[#6EE7B7]">Analytics</span>
            </h1>
            <p className="text-[#64748B] mt-1">Insights into your campaign supporters and contribution patterns.</p>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-[#6EE7B7] text-[#0A0A0F] px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            <Download className="w-5 h-5" /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
            <input 
              type="text" 
              placeholder="Search by name, email or tx..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111118] border border-[#1E1E2E] rounded-xl pl-12 pr-4 py-3 text-[#F1F5F9] outline-none focus:border-[#6EE7B7]/50 transition-colors"
            />
          </div>
        </div>

        {/* Table/List */}
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#0A0A0F] border-b border-[#1E1E2E]">
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">Donor</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">Total Contributed</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">Campaigns</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-wider text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1E2E]">
              {filteredDonors.map((donor, idx) => (
                <tr key={idx} className="hover:bg-[#1E1E2E]/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#1E1E2E] flex items-center justify-center font-bold text-sm text-[#F1F5F9]">
                        {donor.donorName[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#F1F5F9] group-hover:text-[#6EE7B7] transition-colors">{donor.donorName}</h4>
                        <p className="text-xs text-[#64748B]">{donor.donorEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[#F1F5F9] font-bold">₹{donor.amountINR.toLocaleString()}</span>
                    <p className="text-[10px] text-[#64748B]">{donor.campaign}</p>
                  </td>
                  <td className="px-6 py-5 font-medium text-[#64748B]">
                    Donated
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-[#F1F5F9]">{new Date(donor.date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-5 text-right font-medium">
                    <button className="text-[#64748B] hover:text-[#6EE7B7] text-sm uppercase font-bold tracking-tight">
                      Details
                    </button>
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
