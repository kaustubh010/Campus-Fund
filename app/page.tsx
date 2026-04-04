'use client'

import Link from 'next/link'
import { ArrowRight, Lightbulb, Share2, Target } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] relative overflow-hidden">
      {/* Background Dots Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6EE7B7 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-32 md:py-48 text-center relative z-10">
        <div className="inline-flex justify-center mb-10 animate-bounce duration-1000">
          <div className="w-38 h-38 bg-[#111118] border border-[#1E1E2E] rounded-3xl shadow-[0_0_50px_rgba(110,231,183,0.3)] flex items-center justify-center p-4 backdrop-blur-md">
            <img 
              src="/emerald.png" 
              alt="Minecraft Emerald" 
              className="w-full h-full object-contain pixelated"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold font-[Syne] text-[#F1F5F9] mb-6 leading-tight">
          Campus<span className="text-[#6EE7B7]">Fund</span>
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-[#818CF8] mb-8 tracking-wide font-[Syne]">
          Fund Your Vision, Block by Block
        </h2>
        <p className="text-lg text-[#64748B] mb-12 max-w-2xl mx-auto leading-relaxed">
          The ultimate student crowdfunding platform where ideas become reality. Launch your campaign, join the community, and let's build something epic together.
        </p>
        
        <div className="flex items-center justify-center gap-6 flex-col sm:flex-row">
          <Link href="/campaigns">
            <button className="w-full sm:w-auto px-8 py-4 bg-[#6EE7B7] text-[#0A0A0F] font-bold text-lg rounded-2xl hover:bg-[#52af35] transition-all hover:-translate-y-1 shadow-[0_0_20px_rgba(110,231,183,0.4)] hover:shadow-[0_0_30px_rgba(110,231,183,0.6)] flex items-center justify-center gap-2">
              Explore World <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <Link href="/campaigns/create">
            <button className="w-full sm:w-auto px-8 py-4 bg-[#111118] text-[#F1F5F9] font-bold text-lg border border-[#1E1E2E] rounded-2xl hover:border-[#6EE7B7] hover:text-[#6EE7B7] transition-all hover:-translate-y-1">
              Start Mining
            </button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-[#1E1E2E] bg-[#0A0A0F]/50 backdrop-blur-sm py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold font-[Syne] text-[#F1F5F9] mb-4">The Crafting Recipe</h2>
            <div className="h-1.5 w-24 bg-gradient-to-r from-[#6EE7B7] to-[#818CF8] mx-auto rounded-full" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { icon: <Lightbulb className="w-10 h-10" />, title: 'Gather Ideas', desc: 'Craft your campaign for events, tech, or any campus project. No idea is too small for our biome.' },
              { icon: <Share2 className="w-10 h-10" />, title: 'Broadcast', desc: 'Share your vision with the campus. Build your party and gather the resources you need.' },
              { icon: <Target className="w-10 h-10" />, title: 'Level Up', desc: 'Hit your goal, claim your ALGO, and bring your project to life in the real world.' },
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

      {/* Community Stats */}
      <section className="max-w-6xl mx-auto px-6 py-32 text-center relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { label: 'Total Mined', val: '50K+ ALGO' },
            { label: 'Builders', val: '1.2K' },
            { label: 'Worlds Built', val: '120+' },
            { label: 'Success Rate', val: '94%' },
          ].map(({ label, val }) => (
            <div key={label} className="flex flex-col items-center">
              <p className="text-4xl md:text-5xl font-bold font-[Syne] text-[#F1F5F9] mb-3 group-hover:text-[#6EE7B7] transition-colors">{val}</p>
              <p className="text-sm font-bold text-[#6EE7B7] uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <style jsx global>{`
        .pixelated {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
      `}</style>
    </div>
  )
}