'use client'

import { useWallet } from '@/context/wallet-context'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getAccountInfo } from '@/lib/algorand'

export function WalletChip() {
  const { wallet } = useWallet()
  const router = useRouter()
  const [balance, setBalance] = useState<string>('0.00')

  useEffect(() => {
    if (wallet.isConnected && wallet.address) {
      getAccountInfo(wallet.address).then((info) => {
        if (info.success && info.accountInfo) {
          const balanceAlgos = Number(info.accountInfo.amount) / 1_000_000
          setBalance(balanceAlgos.toFixed(2))
        }
      })
    }
  }, [wallet.isConnected, wallet.address])

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`
  }

  const handleClick = () => {
    router.push('/connect-wallet')
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
        wallet.isConnected
          ? 'bg-[#111118] border-[#1E1E2E] hover:border-[#6EE7B7]'
          : 'bg-[#0A0A0F] border-[#1E1E2E] hover:bg-[#1E1E2E]'
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          wallet.isConnected ? 'bg-[#22C55E] animate-pulse' : 'bg-[#EF4444]'
        }`}
      />
      {wallet.isConnected ? (
        <>
          <span className="font-[JetBrains_Mono] text-sm text-[#F1F5F9]">
            {truncateAddress(wallet.address || '')}
          </span>
          <span className="text-[#6EE7B7] text-xs font-bold bg-[#6EE7B7]/10 px-1.5 py-0.5 rounded-md">
            {balance} ALGO
          </span>
        </>
      ) : (
        <span className="text-sm font-medium text-[#64748B]">Connect Wallet</span>
      )}
    </button>
  )
}
