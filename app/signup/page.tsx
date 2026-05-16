"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAlgoRate } from "@/hooks/useAlgoRate";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { ShieldCheck, User, Building2, EyeOff, Eye, ArrowRight } from "lucide-react";

const USD_RATE = 83; // 1 USD = ₹83

function PriceDisplay({ inr }: { inr: number }) {
  const ALGO_RATE = useAlgoRate();
  if (inr === 0) return <span className="font-bold text-[#6EE7B7]">Free forever</span>;
  
  const usd = (inr / USD_RATE).toFixed(0);
  const algo = (inr / ALGO_RATE).toFixed(1);
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-bold text-[#F1F5F9] text-base">₹{inr}</span>
      <span className="text-[#64748B]">·</span>
      <span className="text-[#64748B]">${usd}</span>
      <span className="text-[#64748B]">·</span>
      <span className="text-[#818CF8] font-[JetBrains_Mono]">{algo} ALGO</span>
      <span className="text-[#64748B]">/mo</span>
    </div>
  );
}

export default function SignupPage() {
  const { signup, isLoading, user } = useAuth();
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<"USER" | "COMPANY">("USER");
  const [showPassword, setShowPassword] = useState(false);

  // Individual Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [university, setUniversity] = useState("");
  const [studentId, setStudentId] = useState("");

  // Organization Fields
  const [orgType, setOrgType] = useState("Student Club");
  const [contactPerson, setContactPerson] = useState("");

  useEffect(() => {
    if (user) {
      router.push("/connect-wallet");
    }
  }, [user, router]);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      await signup(
        name, 
        email, 
        password, 
        selectedRole,
        selectedRole === "COMPANY" ? orgType : undefined,
        selectedRole === "COMPANY" ? contactPerson : undefined,
        selectedRole === "USER" ? university : undefined
      );
      toast.success("Account created! Let's connect your wallet.");
      router.push("/connect-wallet");
    } catch (err: any) {
      toast.error(err?.message || "Signup failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col md:flex-row mt-20">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6EE7B7 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Left Side - Info & Pricing */}
      <div className="hidden md:flex md:w-1/2 p-12 flex-col justify-between border-r border-[#1E1E2E] bg-[#111118] relative z-10">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-16 group">
            <div className="w-10 h-10 flex items-center justify-center font-bold text-sm rounded-lg text-[#0A0A0F]">
              <img src="/emerald.png" alt="" />
            </div>
            <span className="text-2xl font-bold text-[#F1F5F9] font-[Syne] tracking-wide group-hover:text-[#6EE7B7] transition-colors">CampusFund</span>
          </Link>

          {selectedRole === "USER" ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-4xl font-bold font-[Syne] text-[#F1F5F9] mb-6">Join the transparent funding movement.</h2>
              <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <ShieldCheck className="w-6 h-6 text-[#6EE7B7] shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-[#F1F5F9] mb-1">Free forever. Zero platform fees.</h3>
                    <p className="text-[#64748B]">You only pay the Algorand network fee (≈0.001 ALGO or $0.0002) per transaction.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-bold font-[Syne] text-[#F1F5F9] mb-6">Plans for every organization</h2>
              
              <div className="space-y-4">
                <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[#F1F5F9]">Starter</h3>
                    <PriceDisplay inr={0} />
                  </div>
                  <ul className="text-sm text-[#64748B] space-y-1">
                    <li>• Up to 2 active campaigns</li>
                    <li>• Basic dashboard analytics</li>
                  </ul>
                </div>

                <div className="bg-[#111118] border border-[#6EE7B7] rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#6EE7B7] text-[#0A0A0F] text-[10px] font-bold px-2 py-1 rounded-bl-lg">POPULAR</div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[#F1F5F9]">Pro</h3>
                    <PriceDisplay inr={499} />
                  </div>
                  <ul className="text-sm text-[#64748B] space-y-1">
                    <li>• Unlimited campaigns</li>
                    <li>• Dedicated donor dashboard</li>
                    <li>• Exportable audit trails</li>
                  </ul>
                </div>

                <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[#F1F5F9]">Enterprise</h3>
                    <PriceDisplay inr={1999} />
                  </div>
                  <ul className="text-sm text-[#64748B] space-y-1">
                    <li>• White-label campaigns</li>
                    <li>• Custom smart contracts</li>
                    <li>• API access</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="text-[#64748B] text-sm">
          © 2026 CampusFund. Built on Algorand.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 p-8 md:p-12 flex flex-col justify-center relative z-10 overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          <div className="md:hidden flex items-center justify-center gap-2 mb-12">
            <div className="w-10 h-10 flex items-center justify-center font-bold text-sm rounded-lg text-[#0A0A0F]">
              <img src="/emerald.png" alt="" />
            </div>
            <span className="text-2xl font-bold text-[#F1F5F9] font-[Syne]">CampusFund</span>
          </div>

          <h1 className="text-3xl font-bold font-[Syne] text-[#F1F5F9] mb-2">Create an account</h1>
          <p className="text-[#64748B] mb-8">Join the decentralized funding platform.</p>

          {/* Toggle */}
          <div className="flex bg-[#111118] border border-[#1E1E2E] p-1 rounded-xl mb-8">
            <button
              onClick={() => setSelectedRole("USER")}
              className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${selectedRole === "USER" ? "bg-[#6EE7B7] text-[#0A0A0F]" : "text-[#64748B] hover:text-[#F1F5F9]"}`}
            >
              <User className="w-4 h-4" /> Individual
            </button>
            <button
              onClick={() => setSelectedRole("COMPANY")}
              className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${selectedRole === "COMPANY" ? "bg-[#6EE7B7] text-[#0A0A0F]" : "text-[#64748B] hover:text-[#F1F5F9]"}`}
            >
              <Building2 className="w-4 h-4" /> Organization
            </button>
          </div>

          <div className="space-y-4 animate-in fade-in duration-300">
            {selectedRole === "USER" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#F1F5F9] mb-2 cursor-pointer">Full Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] focus:border-[#6EE7B7] text-[#F1F5F9] rounded-xl px-4 py-3 outline-none transition-colors" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#F1F5F9] mb-2 cursor-pointer">University/College (Optional)</label>
                  <input type="text" value={university} onChange={e => setUniversity(e.target.value)} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] focus:border-[#6EE7B7] text-[#F1F5F9] rounded-xl px-4 py-3 outline-none transition-colors" placeholder="State University" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#F1F5F9] mb-2 cursor-pointer">Organization Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] focus:border-[#6EE7B7] text-[#F1F5F9] rounded-xl px-4 py-3 outline-none transition-colors" placeholder="Tech Club" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-[#F1F5F9] mb-2">Type</label>
                    <select value={orgType} onChange={e => setOrgType(e.target.value)} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] focus:border-[#6EE7B7] text-[#F1F5F9] rounded-xl px-4 py-3 outline-none appearance-none">
                      <option>Student Club</option>
                      <option>NGO</option>
                      <option>Startup</option>
                      <option>Cause</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-[#F1F5F9] mb-2 cursor-pointer">Contact Person *</label>
                    <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] focus:border-[#6EE7B7] text-[#F1F5F9] rounded-xl px-4 py-3 outline-none transition-colors" placeholder="Jane Doe" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-[#F1F5F9] mb-2 cursor-pointer">Email Address *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] focus:border-[#6EE7B7] text-[#F1F5F9] rounded-xl px-4 py-3 outline-none transition-colors" placeholder="you@example.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F1F5F9] mb-2 cursor-pointer">Password *</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] focus:border-[#6EE7B7] text-[#F1F5F9] rounded-xl px-4 py-3 outline-none transition-colors pr-12" placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && handleSignup()} />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#F1F5F9]">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button onClick={handleSignup} disabled={isLoading} className="w-full py-4 mt-6 bg-[#6EE7B7] text-[#0A0A0F] text-lg font-bold rounded-xl hover:bg-[#52af35] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {isLoading ? "Creating account..." : "Create Account"} <ArrowRight className="w-5 h-5" />
            </button>
            
            <div className="flex items-center my-6 gap-4">
              <div className="flex-1 h-px bg-[#1E1E2E]"></div>
              <span className="text-[#64748B] text-sm">or</span>
              <div className="flex-1 h-px bg-[#1E1E2E]"></div>
            </div>

            <a href="/api/auth/google" className="w-full py-4 bg-[#111118] border border-[#1E1E2E] text-[#F1F5F9] text-lg font-bold rounded-xl hover:bg-[#1E1E2E] transition-colors flex items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </a>
            
            <p className="text-center text-[#64748B] mt-6">
              Already have an account? <Link href="/login" className="text-[#6EE7B7] hover:underline font-bold">Log in here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
