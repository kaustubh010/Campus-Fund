"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useAlgoRate } from "@/hooks/useAlgoRate"
import { 
  Building2, 
  CheckCircle2, 
  ChevronRight, 
  ShieldCheck, 
  CreditCard,
  Building,
  User,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Search,
  Filter,
  Plus
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"

const USD_RATE = 83; // 1 USD = ₹83

function PriceDisplay({ inr }: { inr: number }) {
  const ALGO_RATE = useAlgoRate()
  if (inr === 0) return <span className="font-bold text-[#6EE7B7]">Free forever</span>;
  
  const usd = (inr / USD_RATE).toFixed(0);
  const algo = (inr / ALGO_RATE).toFixed(1);
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-bold text-[#F1F5F9] text-xl">₹{inr}</span>
      <span className="text-[#64748B]">·</span>
      <span className="text-[#64748B] font-medium">${usd}</span>
      <span className="text-[#64748B]">·</span>
      <span className="text-[#818CF8] font-[JetBrains_Mono]">{algo} ALGO</span>
      <span className="text-[#64748B]">/mo</span>
    </div>
  );
}

export default function UpgradePage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState("starter")
  const [orgData, setOrgData] = useState({
    orgName: "",
    orgType: "Student Club",
    contactPerson: "",
    university: "",
    description: ""
  })
  const [isUpgrading, setIsUpgrading] = useState(false)

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: 0,
      description: "Perfect for testing the waters and small clubs.",
      features: [
        "Up to 2 active campaigns",
        "Basic donor list",
        "Community forum access",
        "Standard platform fee"
      ]
    },
    {
      id: "pro",
      name: "Pro",
      price: 499,
      description: "Best for active student organizations and NGOs.",
      features: [
        "Unlimited active campaigns",
        "Full donor analytics & CSV export",
        "On-chain audit logs",
        "Priority support",
        "Organization profile page"
      ],
      popular: true
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 1999,
      description: "Custom solutions for large universities and foundations.",
      features: [
        "Everything in Pro",
        "White-label campaigns",
        "Custom smart contracts",
        "Dedicated account manager",
        "API access"
      ]
    }
  ]

  const handleUpgrade = async () => {
    if (!orgData.orgName || !orgData.contactPerson) {
      toast.error("Please fill in the required organization details.")
      return
    }

    setIsUpgrading(true)
    try {
      const response = await fetch("/api/user/upgrade", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          ...orgData
        })
      })

      if (!response.ok) throw new Error("Upgrade failed")

      toast.success("Welcome aboard! Your organization account is now active.")
      router.push("/dashboard/company")
      // Hard refresh to update auth state across all components
      window.location.reload()
    } catch (err) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsUpgrading(false)
    }
  }

  if (isAuthLoading) return null

  if (!user) {
    router.push("/login?redirect=/upgrade")
    return null
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Progress Header */}
        <div className="flex flex-col items-center mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-[Syne] transition-all ${step >= 1 ? "bg-[#6EE7B7] text-[#0A0A0F]" : "bg-[#111118] text-[#64748B] border border-[#1E1E2E]"}`}>1</div>
            <div className={`w-12 h-1 bg-[#1E1E2E] rounded-full overflow-hidden`}>
              <div className={`h-full bg-[#6EE7B7] transition-all duration-500`} style={{ width: step > 1 ? "100%" : "0%" }} />
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-[Syne] transition-all ${step >= 2 ? "bg-[#6EE7B7] text-[#0A0A0F]" : "bg-[#111118] text-[#64748B] border border-[#1E1E2E]"}`}>2</div>
          </div>
          <h1 className="text-4xl font-bold font-[Syne] text-[#F1F5F9] text-center">
            Scale your <span className="text-[#6EE7B7]">impact</span>.
          </h1>
          <p className="text-[#64748B] text-center mt-3 max-w-lg">
            Transition from a student account to an organization account and start raising funds on-chain.
          </p>
        </div>

        {step === 1 ? (
          /* Step 1: Select Plan */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative bg-[#111118] border-2 rounded-3xl p-8 cursor-pointer transition-all hover:scale-[1.02] ${selectedPlan === plan.id ? "border-[#6EE7B7] shadow-[0_0_30px_rgba(110,231,183,0.15)]" : "border-[#1E1E2E]"}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#6EE7B7] text-[#0A0A0F] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Most Popular</div>
                )}
                <h3 className="text-xl font-bold font-[Syne] mb-2">{plan.name}</h3>
                <p className="text-xs text-[#64748B] mb-6 leading-relaxed">{plan.description}</p>
                <div className="mb-8">
                  <PriceDisplay inr={plan.price} />
                </div>
                <div className="space-y-4 mb-10">
                  {plan.features.map(feat => (
                    <div key={feat} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${selectedPlan === plan.id ? "text-[#6EE7B7]" : "text-[#64748B]"}`} />
                      <span className="text-sm text-[#F1F5F9]">{feat}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(plan.id);
                    setStep(2);
                  }}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${selectedPlan === plan.id ? "bg-[#6EE7B7] text-[#0A0A0F]" : "bg-[#0A0A0F] text-[#F1F5F9] border border-[#1E1E2E] group-hover:border-[#6EE7B7]/50"}`}
                >
                  Choose {plan.name} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Step 2: Org Details */
          <div className="max-w-2xl mx-auto bg-[#111118] border border-[#1E1E2E] p-10 rounded-3xl animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold font-[Syne] text-[#F1F5F9] mb-8 flex items-center gap-3">
              <Building2 className="w-6 h-6 text-[#6EE7B7]" /> Organization Details
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-2">Organization Name *</label>
                  <input 
                    type="text" 
                    value={orgData.orgName}
                    onChange={(e) => setOrgData({...orgData, orgName: e.target.value})}
                    placeholder="e.g. Robotics Club, Green Future NGO"
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-[#F1F5F9] outline-none focus:border-[#6EE7B7]/50 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-2">Organization Type</label>
                  <select 
                    value={orgData.orgType}
                    onChange={(e) => setOrgData({...orgData, orgType: e.target.value})}
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-[#F1F5F9] outline-none focus:border-[#6EE7B7]/50 transition-all font-medium appearance-none"
                  >
                    <option>Student Club</option>
                    <option>NGO</option>
                    <option>Non-Profit</option>
                    <option>Educational Institute</option>
                    <option>Startup</option>
                    <option>Individual Cause</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-2">Contact Person *</label>
                  <input 
                    type="text" 
                    value={orgData.contactPerson}
                    onChange={(e) => setOrgData({...orgData, contactPerson: e.target.value})}
                    placeholder="Full name"
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-[#F1F5F9] outline-none focus:border-[#6EE7B7]/50 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-2">University / Location</label>
                  <input 
                    type="text" 
                    value={orgData.university}
                    onChange={(e) => setOrgData({...orgData, university: e.target.value})}
                    placeholder="Where are you based?"
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-[#F1F5F9] outline-none focus:border-[#6EE7B7]/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-2">Short Description</label>
                <textarea 
                  value={orgData.description}
                  onChange={(e) => setOrgData({...orgData, description: e.target.value})}
                  rows={4}
                  placeholder="Tell us a bit about your mission..."
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-[#F1F5F9] outline-none focus:border-[#6EE7B7]/50 transition-all font-medium resize-none"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="px-8 py-4 bg-[#0A0A0F] text-[#F1F5F9] border border-[#1E1E2E] rounded-2xl font-bold hover:bg-[#111118] transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="flex-1 py-4 bg-[#6EE7B7] text-[#0A0A0F] rounded-2xl font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isUpgrading ? "Processing..." : `Complete ${selectedPlan} Upgrade`} <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
