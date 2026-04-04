"use client";

import { useState, useEffect } from "react";
import { ArrowRight, ShieldCheck, Users, Lock, Chrome, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function LoginPage() {
  const { login, loginWithGoogle, isLoading, user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<"splash" | "onboarding" | "login">("splash");
  const [onboardingStep, setOnboardingStep] = useState(0);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      router.push("/connect-wallet");
    }
  }, [user, router]);

  useEffect(() => {
    const hasSeenOnboarding = typeof window !== "undefined" ? localStorage.getItem("hasSeenOnboarding") : null;
    if (step === "splash") {
      const timer = setTimeout(() => {
        if (hasSeenOnboarding) {
          setStep("login");
        } else {
          setStep("onboarding");
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const onboardingData = [
    {
      title: "Transparent Funding",
      description: "All campaigns are backed by transparent smart contracts on the Algorand blockchain.",
      icon: ShieldCheck,
      color: "text-[#6EE7B7]",
      bg: "bg-[#6EE7B7]/10",
      border: "border-[#6EE7B7]/20"
    },
    {
      title: "Community Driven",
      description: "Join forces with students to fund innovative campus projects block by block.",
      icon: Users,
      color: "text-[#818CF8]",
      bg: "bg-[#818CF8]/10",
      border: "border-[#818CF8]/20"
    },
    {
      title: "Smart Escrow",
      description: "Donations are safely locked in escrow and only release when the campaign goal is achieved.",
      icon: Lock,
      color: "text-[#FCD34D]",
      bg: "bg-[#FCD34D]/10",
      border: "border-[#FCD34D]/20"
    },
  ];

  const finishOnboarding = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setStep("login");
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }
    try {
      await login(email, password);
      toast.success("Logged in successfully!");
      router.push("/connect-wallet");
    } catch (err: any) {
      toast.error(err?.message || "Login failed. Please try again.");
    }
  };

  if (step === "splash") {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6EE7B7 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        <div className="w-24 h-24 bg-[#111118] border border-[#1E1E2E] rounded-3xl flex items-center justify-center p-4 mb-6 animate-bounce shadow-[0_0_50px_rgba(110,231,183,0.3)] backdrop-blur-md z-10">
          <img 
            src="/emerald.png" 
            alt="Minecraft Emerald" 
            className="w-full h-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
        <h1 className="text-4xl font-bold font-[Syne] tracking-tight mb-2 text-[#F1F5F9] z-10">
          Campus<span className="text-[#6EE7B7]">Fund</span>
        </h1>
        <p className="text-[#64748B] text-lg font-medium z-10">Fund Your Vision, Block by Block</p>
      </div>
    );
  }

  if (step === "onboarding") {
    const current = onboardingData[onboardingStep];
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6EE7B7 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center z-10">
          <div className={`w-32 h-32 rounded-[2rem] flex items-center justify-center mb-8 border ${current.bg} ${current.border} ${current.color} shadow-2xl`}>
            <current.icon className="w-16 h-16" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-bold font-[Syne] text-[#F1F5F9] mb-4">{current.title}</h2>
          <p className="text-lg text-[#64748B] max-w-sm leading-relaxed">{current.description}</p>
        </div>

        <div className="p-8 pb-12 z-10">
          <div className="flex justify-center gap-3 mb-10">
            {onboardingData.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all duration-500 ${i === onboardingStep ? "w-10 bg-[#6EE7B7]" : "w-3 bg-[#1E1E2E]"}`} />
            ))}
          </div>
          <button
            onClick={() => {
              if (onboardingStep < 2) setOnboardingStep((prev) => prev + 1);
              else finishOnboarding();
            }}
            className="w-full py-4 bg-[#6EE7B7] text-[#0A0A0F] text-lg font-bold rounded-xl hover:bg-[#52af35] transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(110,231,183,0.3)]"
          >
            {onboardingStep < 2 ? "Continue" : "Get Started"} <ArrowRight className="w-5 h-5" />
          </button>
          <button onClick={finishOnboarding} className="w-full py-4 mt-2 text-[#64748B] hover:text-[#F1F5F9] font-medium text-lg transition-colors">
            Skip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col p-8 md:p-12 relative overflow-hidden mt-20">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6EE7B7 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      {/* Navbar Minimal */}
      <div className="w-full max-w-md mx-auto z-10 hidden md:flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-[#6EE7B7] flex items-center justify-center font-bold text-sm rounded-lg text-[#0A0A0F]">
          CF
        </div>
        <span className="text-2xl font-bold text-[#F1F5F9] font-[Syne] tracking-wide group-hover:text-[#6EE7B7] transition-colors">CampusFund</span>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full z-10">
        
        <div className="md:hidden flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-[#6EE7B7] flex items-center justify-center font-bold text-sm rounded-lg text-[#0A0A0F]">
            CF
          </div>
          <span className="text-2xl font-bold text-[#F1F5F9] font-[Syne] tracking-wide transition-colors">CampusFund</span>
        </div>

        <h2 className="text-4xl font-bold font-[Syne] text-[#F1F5F9] mb-2">Welcome Back</h2>
        <p className="text-[#64748B] mb-10 text-lg">Log in to manage your campaigns and donations.</p>

        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <label className="block text-sm font-medium text-[#F1F5F9] mb-2">Email Address</label>
            <input 
              type="email" 
              placeholder="you@university.edu" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-5 py-4 bg-[#111118] border border-[#1E1E2E] rounded-xl focus:outline-none focus:border-[#6EE7B7] text-[#F1F5F9] text-lg transition-colors" 
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-[#F1F5F9]">Password</label>
              <a href="#" className="text-sm font-bold text-[#6EE7B7] hover:underline">Forgot?</a>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                onKeyDown={(e) => e.key === "Enter" && handleLogin()} 
                className="w-full px-5 py-4 bg-[#111118] border border-[#1E1E2E] rounded-xl focus:outline-none focus:border-[#6EE7B7] text-[#F1F5F9] text-lg pr-12 transition-colors" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword((v) => !v)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#F1F5F9] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            onClick={handleLogin} 
            disabled={isLoading} 
            className="w-full py-4 mt-4 bg-[#6EE7B7] text-[#0A0A0F] text-lg font-bold rounded-xl hover:bg-[#52af35] transition-colors shadow-[0_0_15px_rgba(110,231,183,0.3)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in…" : "Sign In"} <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-center text-[#64748B] mt-6">
            Don't have an account? <Link href="/signup" className="text-[#6EE7B7] font-bold hover:underline">Create one</Link>
          </p>

          <div className="relative py-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1E1E2E]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0A0A0F] px-4 text-sm font-bold text-[#64748B]">OR</span>
            </div>
          </div>

          <button 
            onClick={() => loginWithGoogle()} 
            disabled={isLoading} 
            className="w-full py-4 bg-[#111118] border border-[#1E1E2E] text-[#F1F5F9] text-lg font-bold rounded-xl hover:border-[#6EE7B7] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Chrome className="w-5 h-5 text-[#64748B]" /> Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
