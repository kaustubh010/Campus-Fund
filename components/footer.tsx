import Link from 'next/link'
import React from 'react'

const footer = () => {
  return (
      <footer className="border-t border-[#1E1E2E] bg-[#0A0A0F] py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#111118] border border-[#1E1E2E] rounded-lg flex items-center justify-center p-1.5">
              <img src="/emerald.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-[Syne] font-bold text-xl text-[#F1F5F9]">
              Campus<span className="text-[#6EE7B7]">Fund</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-[#64748B] font-medium text-sm">
            <Link href="/campaigns" className="hover:text-[#6EE7B7] transition-colors">Explore</Link>
            <Link href="/dashboard" className="hover:text-[#6EE7B7] transition-colors">Dashboard</Link>
            <Link href="https://github.com/kaustubh010/Campus-Fund" target="_blank" className="hover:text-[#6EE7B7] transition-colors">GitHub</Link>
          </div>
          <div className="text-[#64748B] text-sm">
            &copy; {new Date().getFullYear()} CampusFund. Powered by Algorand.
          </div>
        </div>
      </footer>
  )
}

export default footer