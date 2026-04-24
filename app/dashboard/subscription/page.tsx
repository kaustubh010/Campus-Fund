"use client"

import { useAuth } from "@/hooks/useAuth"
import { 
  CreditCard, 
  CheckCircle2, 
  ArrowUpCircle,
  HelpCircle,
  Clock,
  Sparkles
} from "lucide-react"
import Link from "next/link"

export default function Subscription() {
  const { user } = useAuth()

  // Mock Plan Data
  const currentPlan = {
    name: user?.plan === "pro" ? "Pro" : "Free/Basic",
    price: user?.plan === "pro" ? "₹499/mo" : "₹0/mo",
    since: user?.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : "2026-01-15",
    features: [
      "Unlimited active campaigns",
      "Full donor analytics & CSV export",
      "On-chain audit logs",
      "Priority customer support",
      "Custom organization profile"
    ],
    nextBilling: "2026-04-15"
  }

  if (!user || user.role !== "COMPANY") {
    return <div>Access Denied</div>
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-12 px-6 text-[#F1F5F9]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-[Syne]">
              Plan & <span className="text-[#6EE7B7]">Billing</span>
            </h1>
            <p className="text-[#64748B] mt-1">Manage your organization's subscription and usage.</p>
          </div>
          <div className={`${user?.plan === 'pro' ? 'bg-[#6EE7B7]/10 border-[#6EE7B7]/20' : 'bg-gray-500/10 border-gray-500/20'} p-3 rounded-2xl flex items-center gap-2`}>
            <Sparkles className={`w-5 h-5 ${user?.plan === 'pro' ? 'text-[#6EE7B7]' : 'text-gray-500'}`} />
            <span className={`text-sm font-bold ${user?.plan === 'pro' ? 'text-[#6EE7B7]' : 'text-gray-500'}`}>{user?.plan?.toUpperCase() || 'BASIC'} VERSION</span>
          </div>
        </div>

        {/* Current Plan Card */}
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#6EE7B7]/10 blur-[60px]" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-[#1E1E2E]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#6EE7B7] rounded-2xl flex items-center justify-center text-[#0A0A0F]">
                <CreditCard className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold font-[Syne]">{currentPlan.name} Plan</h3>
                <p className="text-sm text-[#64748B]">Active since {new Date(currentPlan.since).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#6EE7B7]">{currentPlan.price}</div>
              <div className="text-sm text-[#64748B]">Billed monthly</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-widest">Plan Highlights</h4>
              <ul className="space-y-3">
                {currentPlan.features.map(feat => (
                  <li key={feat} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#6EE7B7]" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-[#64748B] flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Next Payment
                </h4>
                <HelpCircle className="w-4 h-4 text-[#64748B] cursor-pointer" />
              </div>
              <div className="text-2xl font-bold text-[#F1F5F9]">{new Date(currentPlan.nextBilling).toLocaleDateString()}</div>
              <p className="text-xs text-[#64748B] mt-1">₹499 will be charged automatically.</p>
              <button className="w-full mt-6 py-2 border border-[#1E1E2E] text-sm text-[#F1F5F9] rounded-xl hover:bg-[#1E1E2E] transition-colors">
                Update Payment Method
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            {user?.plan !== 'pro' ? (
              <Link href="/upgrade" className="flex-1 py-3 bg-[#6EE7B7] text-[#0A0A0F] rounded-xl font-bold hover:opacity-90 transition-opacity text-center">
                Upgrade to Pro
              </Link>
            ) : (
              <>
                <button className="flex-1 py-3 bg-[#6EE7B7] text-[#0A0A0F] rounded-xl font-bold hover:opacity-90 transition-opacity">
                  Change Plan
                </button>
                <button className="px-6 py-3 border border-red-500/30 text-red-500 rounded-xl font-bold hover:bg-red-500/5 transition-colors">
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
