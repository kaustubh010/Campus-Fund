'use client'

import Link from 'next/link'
import { ArrowRight, Lightbulb, Share2, Target, ShieldCheck, Lock, CheckCircle2, Users, Building2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] relative overflow-hidden">
      {/* Background Dots Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6EE7B7 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-32 md:py-48 text-center relative z-10">
        <div className="inline-flex justify-center mb-5 animate-bounce duration-1000">
          <div className="w-30 h-30 bg-[#111118] border border-[#1E1E2E] rounded-3xl shadow-[0_0_50px_rgba(110,231,183,0.3)] flex items-center justify-center p-4 backdrop-blur-md">
            <img 
              src="/emerald.png" 
              alt="CampusFund Emerald" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold font-[Syne] text-[#F1F5F9] mb-6 leading-tight">
          Campus<span className="text-[#6EE7B7]">Fund</span>
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-[#818CF8] mb-8 tracking-wide font-[Syne]">
          Decentralized Crowdfunding for Students
        </h2>
        <p className="text-lg text-[#64748B] mb-12 max-w-2xl mx-auto leading-relaxed">
          The transparent, escrow-backed platform where campus ideas become reality. Launch your campaign, rally the community, and build the future—trustless.
        </p>
        
        <div className="flex items-center justify-center gap-6 flex-col sm:flex-row">
          <Link href="/campaigns">
            <button className="w-full sm:w-auto px-8 py-4 bg-[#6EE7B7] text-[#0A0A0F] font-bold text-lg rounded-2xl hover:bg-[#52af35] transition-all hover:-translate-y-1 shadow-[0_0_20px_rgba(110,231,183,0.4)] hover:shadow-[0_0_30px_rgba(110,231,183,0.6)] flex items-center justify-center gap-2">
              Explore Campaigns <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <Link href="/campaigns/create">
            <button className="w-full sm:w-auto px-8 py-4 bg-[#111118] text-[#F1F5F9] font-bold text-lg border border-[#1E1E2E] rounded-2xl hover:border-[#6EE7B7] hover:text-[#6EE7B7] transition-all hover:-translate-y-1">
              Start a Campaign
            </button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-[#1E1E2E] bg-[#0A0A0F]/50 backdrop-blur-sm py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold font-[Syne] text-[#F1F5F9] mb-4">How It Works</h2>
            <div className="h-1.5 w-24 bg-gradient-to-r from-[#6EE7B7] to-[#818CF8] mx-auto rounded-full" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { icon: <Lightbulb className="w-10 h-10" />, title: 'Create Campaign', desc: 'Detail your startup, event, or project. Set your funding goal and share your vision securely.' },
              { icon: <Share2 className="w-10 h-10" />, title: 'Rally Support', desc: 'Share your campaign across campus. Donors connect their wallets and contribute to the smart escrow.' },
              { icon: <Target className="w-10 h-10" />, title: 'Unlock Funds', desc: 'Once the goal is met, submit invoices to verify your expenses and claim the locked ALGO.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-[#111118] border border-[#1E1E2E] rounded-3xl p-10 text-center hover:border-[#6EE7B7] transition-all hover:-translate-y-2 group">
                <div className="w-20 h-20 mx-auto bg-[#1E1E2E] rounded-2xl flex items-center justify-center text-[#6EE7B7] mb-8 group-hover:scale-110 transition-transform">
                  {icon}
                </div>
                <h3 className="font-bold font-[Syne] text-2xl text-[#F1F5F9] mb-4">{title}</h3>
                <p className="text-[#64748B] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Escrow & Trust */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E1E2E] border border-[#3d5a3b] text-[#6EE7B7] text-sm font-bold tracking-wide uppercase">
                <Lock className="w-4 h-4" /> Smart Escrow
              </div>
              <h2 className="text-4xl md:text-5xl font-bold font-[Syne] text-[#F1F5F9] leading-tight">
                Trustless by Design.<br/>
                Locked on the Blockchain.
              </h2>
              <p className="text-lg text-[#64748B] leading-relaxed">
                No more wondering where your funds went. Every donation is locked in an Algorand smart contract the moment it's sent. The funds are mathematically unreachable until the campaign hits its goal.
              </p>
              <ul className="space-y-4 pt-4">
                {[
                  '100% On-chain Accountability',
                  'Automatic Refunds if Goals Fail',
                  'Zero Admin Tampering'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#F1F5F9] font-medium">
                    <CheckCircle2 className="w-5 h-5 text-[#6EE7B7]" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#6EE7B7]/20 to-[#818CF8]/20 blur-3xl group-hover:blur-2xl transition-all duration-500 rounded-[3rem]" />
              <div className="bg-[#111118] border border-[#1E1E2E] p-8 rounded-[2rem] relative shadow-2xl flex flex-col gap-6">
                <div className="flex items-center justify-between p-4 bg-[#0A0A0F] rounded-xl border border-[#1E1E2E]">
                  <span className="text-[#64748B] font-medium text-sm">Donor Send</span>
                  <span className="text-[#F1F5F9] font-bold font-[JetBrains_Mono]">₹500 <span className="text-[#818CF8]">→ ALGO</span></span>
                </div>
                <div className="flex justify-center -my-2 relative z-10">
                  <div className="bg-[#1E1E2E] p-2 rounded-full border border-[#0A0A0F]">
                    <ShieldCheck className="w-6 h-6 text-[#6EE7B7]" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#0A0A0F] rounded-xl border border-[#1E1E2E]">
                  <span className="text-[#64748B] font-medium text-sm">Locked in Escrow</span>
                  <span className="text-[#6EE7B7] font-bold font-[JetBrains_Mono]">0% / 100%</span>
                </div>
                <div className="text-center pt-2">
                  <p className="text-xs text-[#64748B] uppercase tracking-widest font-bold">4-Second Finality</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles System */}
      <section className="border-y border-[#1E1E2E] bg-[#0A0A0F]/50 backdrop-blur-sm py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-[Syne] text-[#F1F5F9] mb-4">Built for Everyone</h2>
            <div className="h-1.5 w-24 bg-gradient-to-r from-[#818CF8] to-[#6EE7B7] mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-[2rem] p-8 md:p-12 hover:border-[#818CF8]/50 transition-all">
              <div className="w-16 h-16 bg-[#0A0A0F] rounded-2xl flex items-center justify-center border border-[#1E1E2E] mb-6">
                <Users className="w-8 h-8 text-[#818CF8]" />
              </div>
              <h3 className="text-2xl font-bold font-[Syne] text-[#F1F5F9] mb-4">For Donors</h3>
              <p className="text-[#64748B] leading-relaxed mb-6">
                Browse campaigns seamlessly, connect your Pera Wallet, and contribute with confidence. Your funds are protected by code.
              </p>
              <ul className="space-y-3">
                <li className="text-sm font-bold text-[#F1F5F9] flex gap-2"><ArrowRight className="w-4 h-4 text-[#818CF8]" /> Free Forever</li>
                <li className="text-sm font-bold text-[#F1F5F9] flex gap-2"><ArrowRight className="w-4 h-4 text-[#818CF8]" /> Track Every Transaction</li>
                <li className="text-sm font-bold text-[#F1F5F9] flex gap-2"><ArrowRight className="w-4 h-4 text-[#818CF8]" /> Auto-Refund Protection</li>
              </ul>
            </div>

            <div className="bg-[#111118] border border-[#1E1E2E] rounded-[2rem] p-8 md:p-12 hover:border-[#6EE7B7]/50 transition-all shadow-[0_0_40px_rgba(110,231,183,0.05)]">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-[#0A0A0F] rounded-2xl flex items-center justify-center border border-[#1E1E2E]">
                  <Building2 className="w-8 h-8 text-[#6EE7B7]" />
                </div>
                <span className="px-3 py-1 bg-[#1E1E2E] text-[#F1F5F9] text-xs font-bold rounded-lg border border-[#3d5a3b]">Upgraded</span>
              </div>
              <h3 className="text-2xl font-bold font-[Syne] text-[#F1F5F9] mb-4">For Organizations</h3>
              <p className="text-[#64748B] leading-relaxed mb-6">
                Create campaigns, manage escrow wallets automatically, track detailed donor analytics, and build verifiable trust.
              </p>
              <ul className="space-y-3">
                <li className="text-sm font-bold text-[#F1F5F9] flex gap-2"><ArrowRight className="w-4 h-4 text-[#6EE7B7]" /> Invoice-Gated Payouts</li>
                <li className="text-sm font-bold text-[#F1F5F9] flex gap-2"><ArrowRight className="w-4 h-4 text-[#6EE7B7]" /> Maker Dashboard</li>
                <li className="text-sm font-bold text-[#F1F5F9] flex gap-2"><ArrowRight className="w-4 h-4 text-[#6EE7B7]" /> Immutable Audit Trail</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Network / Impact */}
      <section className="py-24 relative z-10 bg-[#0A0A0F]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[#64748B] font-bold tracking-widest uppercase text-sm mb-12">Powering Innovation Across Top Universities</p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="text-2xl font-[Syne] font-bold text-[#F1F5F9]">Stanford Tech</span>
            <span className="text-2xl font-[Syne] font-bold text-[#F1F5F9]">MIT Hackers</span>
            <span className="text-2xl font-[Syne] font-bold text-[#F1F5F9]">Oxford Science</span>
            <span className="text-2xl font-[Syne] font-bold text-[#F1F5F9]">Berkeley Ventures</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative z-10 border-t border-[#1E1E2E] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#6EE7B7]/5 to-[#0A0A0F] pointer-events-none" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-full max-w-lg h-64 bg-[#6EE7B7]/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold font-[Syne] text-[#F1F5F9] mb-6">
            Ready to Build Your Future?
          </h2>
          <p className="text-xl text-[#64748B] mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of students and alumni funding the next wave of campus innovation securely and transparently.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/campaigns/create">
              <button className="w-full sm:w-auto px-10 py-4 bg-[#6EE7B7] text-[#0A0A0F] font-bold text-lg rounded-2xl hover:bg-[#52af35] transition-all hover:-translate-y-1 shadow-[0_0_20px_rgba(110,231,183,0.3)]">
                Start Your Campaign
              </button>
            </Link>
            <Link href="/campaigns">
              <button className="w-full sm:w-auto px-10 py-4 bg-[#111118] text-[#F1F5F9] font-bold text-lg border border-[#1E1E2E] rounded-2xl hover:border-[#818CF8] hover:text-[#818CF8] transition-all hover:-translate-y-1">
                Explore Projects
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}