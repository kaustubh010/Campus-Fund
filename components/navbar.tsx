'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { WalletChip } from './wallet-chip'
import { LogOut, User, Settings, ChevronDown, Sparkles } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const { user, logout, isLoading } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (path: string) => pathname === path

  const loggedOutNav = [
    { href: '/#how-it-works', label: 'How it works' },
    { href: '/#organizations', label: 'For Organizations' },
    { href: '/campaigns', label: 'Explore campaigns' },
  ]

  const individualNav = [
    { href: '/campaigns', label: 'Explore' },
    { href: '/dashboard/transactions', label: 'History' },
  ]

  const orgNav = [
    { href: '/dashboard/company', label: 'Dashboard' },
    { href: '/campaigns', label: 'Explore' },
    { href: '/dashboard/company/campaigns', label: 'Campaigns' },
  ]

  const currentNav = !user ? loggedOutNav : user.role === 'COMPANY' ? orgNav : individualNav

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0A0A0F]/80 backdrop-blur-md border-b border-[#1E1E2E] py-2'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-[#111118] border border-[#1E1E2E] rounded-2xl flex items-center justify-center p-2 backdrop-blur-md group-hover:border-[#6EE7B7]/50 transition-all">
            <img 
              src="/emerald.png" 
              alt="Emerald" 
              className="w-full h-full object-contain pixelated"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <span className="text-xl font-bold font-[Syne] text-[#F1F5F9] tracking-tight group-hover:text-[#6EE7B7] transition-colors">
            CampusFund
          </span>
        </Link>

        {/* Center Nav Items */}
        <div className="hidden md:flex items-center gap-6">
          {currentNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-semibold transition-all px-3 py-1.5 rounded-lg ${
                isActive(item.href)
                  ? 'text-[#6EE7B7] bg-[#6EE7B7]/10'
                  : 'text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#1E1E2E]/50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-3">
          {/* Upgrade CTA for Students */}
          {user && user.role === 'USER' && (
            <Link
              href="/upgrade"
              className="hidden lg:flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter bg-[#818CF8]/10 text-[#818CF8] border border-[#818CF8]/20 px-3 py-1.5 rounded-full hover:bg-[#818CF8]/20 transition-all"
            >
              <Sparkles className="w-3 h-3" /> Upgrade
            </Link>
          )}

          {!isLoading && !user && (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-bold text-[#F1F5F9] hover:text-[#6EE7B7] transition-colors px-4 py-2"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-bold bg-[#6EE7B7] text-[#0A0A0F] px-5 py-2.5 rounded-xl hover:bg-[#52af35] transition-all shadow-[0_0_20px_rgba(110,231,183,0.15)]"
              >
                Sign up
              </Link>
            </div>
          )}

          {!isLoading && user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <WalletChip />
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-[#1E1E2E] bg-[#111118] hover:border-[#6EE7B7]/30 transition-all focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#1E1E2E] flex items-center justify-center text-[#6EE7B7] font-bold border border-[#1E1E2E]">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-[#111118] border border-[#1E1E2E] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-4 border-b border-[#1E1E2E] bg-[#0A0A0F]/50">
                        <p className="text-sm font-bold text-[#F1F5F9] truncate">{user.name}</p>
                        <p className="text-[10px] text-[#64748B] truncate uppercase font-bold mt-0.5 tracking-widest">{user.role}</p>
                      </div>
                      <div className="p-1.5 space-y-1">
                        {user.role === 'USER' && (
                          <Link 
                            href="/upgrade" 
                            onClick={() => setDropdownOpen(false)}
                            className="w-full text-left px-3 py-2 text-sm text-[#6EE7B7] hover:bg-[#6EE7B7]/10 rounded-xl flex items-center gap-3 font-bold"
                          >
                            <Sparkles className="w-4 h-4" /> Upgrade to Org
                          </Link>
                        )}
                        <button className="w-full text-left px-3 py-2 text-sm text-[#F1F5F9] hover:bg-[#1E1E2E] rounded-xl flex items-center gap-3">
                          <User className="w-4 h-4 text-[#64748B]" /> My Profile
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm text-[#F1F5F9] hover:bg-[#1E1E2E] rounded-xl flex items-center gap-3">
                          <Settings className="w-4 h-4 text-[#64748B]" /> Settings
                        </button>
                      </div>
                      <div className="p-1.5 border-t border-[#1E1E2E] bg-[#0A0A0F]/20">
                        <button
                          onClick={() => {
                            setDropdownOpen(false)
                            logout()
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-xl flex items-center gap-3 font-medium"
                        >
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
