'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useWallet } from '@/context/wallet-context'
import { WalletConnectButton } from '@/components/wallet-connect-button'
import { Copy, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Link from 'next/link'

export default function ConnectWalletPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { wallet } = useWallet()

  useEffect(() => {
    // If wallet is connected, try to sync it with user profile
    if (wallet.isConnected && wallet.address && user && user.id && !authLoading) {
      syncWalletToProfile(wallet.address)
    }
  }, [wallet.isConnected, wallet.address, user, authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const syncWalletToProfile = async (address: string) => {
    try {
      await fetch('/api/user/wallet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      })
    } catch (err) {
      console.error('Failed to sync wallet to profile:', err)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Address copied to clipboard')
  }

  if (authLoading) {
    return <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-white">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] relative overflow-hidden flex flex-col pt-16">
      {/* Background Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6EE7B7 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#111118] border border-[#1E1E2E] mb-6 shadow-[0_0_30px_rgba(110,231,183,0.1)]">
            <ShieldCheck className="w-8 h-8 text-[#6EE7B7]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-[Syne] text-[#F1F5F9] mb-4">
            Your wallet is your identity
          </h1>
          <p className="text-lg text-[#64748B] max-w-2xl mx-auto font-[DM_Sans]">
            On CampusFund, the Algorand blockchain holds the escrow, not us. Connect your Pera Wallet to start funding campaigns or launching your own.
          </p>
        </div>

        <div className="max-w-xl mx-auto bg-[#111118] border border-[#1E1E2E] rounded-2xl p-8 mb-12">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all ${wallet.isConnected ? 'border-[#6EE7B7] bg-[#6EE7B7]/10' : 'border-[#1E1E2E] bg-transparent'}`}>
              <img src="/pera.jpg" alt="Pera" className="w-full h-full object-cover rounded-full" />
            </div>

            {wallet.isConnected ? (
              <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="inline-flex items-center gap-2 text-[#22C55E] font-bold text-lg">
                  <CheckCircle2 className="w-5 h-5" /> Wallet Connected
                </div>
                
                <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4 flex items-center justify-between gap-4">
                  <span className="font-[JetBrains_Mono] text-[#F1F5F9] text-sm">
                    {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-8)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleCopy(wallet.address || '')} className="p-2 hover:bg-[#1E1E2E] rounded-lg transition-colors text-[#64748B] hover:text-[#F1F5F9]">
                      <Copy className="w-4 h-4" />
                    </button>
                    <a href={`https://testnet.explorer.perawallet.app/address/${wallet.address}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-[#1E1E2E] rounded-lg transition-colors text-[#64748B] hover:text-[#F1F5F9]">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <Link href="/" className="inline-block w-full py-4 bg-[#6EE7B7] text-[#0A0A0F] font-bold rounded-xl hover:bg-[#52af35] transition-all">
                  Continue to App
                </Link>
                
                <div className="pt-4">
                  <WalletConnectButton />
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6 w-full flex flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-[#F1F5F9] font-bold text-lg mb-1">Not Connected</p>
                  <p className="text-[#64748B] text-sm mb-6">Install Pera Wallet on your mobile device to connect.</p>
                </div>
                
                <WalletConnectButton />
              </div>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-[#F1F5F9] mb-6 text-center font-[Syne]">What happens next?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Connect', desc: 'Link your wallet to establish your identity safely without passwords.' },
              { step: '2', title: 'Create / Donate', desc: 'Launch a campaign or support a cause. Funds go securely into a blockchain escrow.' },
              { step: '3', title: 'Auto-Release', desc: 'Once the goal is reached, the smart escrow releases the funds instantly.' }
            ].map((item) => (
              <div key={item.step} className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6 relative">
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#818CF8] text-[#0A0A0F] font-bold flex items-center justify-center">
                  {item.step}
                </div>
                <h4 className="font-bold text-[#F1F5F9] mb-2 mt-2">{item.title}</h4>
                <p className="text-sm text-[#64748B]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
