'use client'

import { useState } from 'react'
import { MinecraftButton } from './minecraft/button'
import { MinecraftInput } from './minecraft/input'
import { MinecraftCard } from './minecraft/card'

interface ContributionModalProps {
  isOpen: boolean
  onClose: () => void
  onContribute: (amount: number) => void
  campaignTitle: string
}

export function ContributionModal({
  isOpen,
  onClose,
  onContribute,
  campaignTitle,
}: ContributionModalProps) {
  const [amount, setAmount] = useState<string>('')
  const [selectedTier, setSelectedTier] = useState<number | null>(null)

  const tiers = [
    { name: 'Bronze', amount: 50, color: '#8b7355' },
    { name: 'Silver', amount: 100, color: '#c0c0c0' },
    { name: 'Gold', amount: 500, color: '#ffd700' },
    { name: 'Emerald', amount: 1000, color: '#50c878' },
  ]

  const handleTierSelect = (tierAmount: number) => {
    setSelectedTier(tierAmount)
    setAmount(tierAmount.toString())
  }

  const handleContribute = () => {
    const numAmount = parseFloat(amount)
    if (numAmount > 0) {
      onContribute(numAmount)
      setAmount('')
      setSelectedTier(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <MinecraftCard className="max-w-md w-full space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-1">
            Support This Campaign
          </h3>
          <p className="text-sm text-muted-foreground">{campaignTitle}</p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-foreground">
            Select a Tier or Enter Custom Amount
          </label>
          <div className="grid grid-cols-2 gap-2">
            {tiers.map(tier => (
              <button
                key={tier.name}
                onClick={() => handleTierSelect(tier.amount)}
                className={`p-3 rounded-minecraft border-4 transition-all ${
                  selectedTier === tier.amount
                    ? 'border-minecraft-gold bg-yellow-50'
                    : 'border-minecraft-stone hover:border-minecraft-grass'
                }`}
              >
                <div className="font-bold text-sm">{tier.name}</div>
                <div className="text-lg font-bold" style={{ color: tier.color }}>
                  ${tier.amount}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <MinecraftInput
            label="Custom Amount (USD)"
            type="number"
            min="1"
            max="10000"
            placeholder="Enter amount in USD"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setSelectedTier(null)
            }}
          />
        </div>

        <MinecraftCard variant="dark" className="space-y-2 text-white">
          <p className="text-xs opacity-75">Amount in ALGO</p>
          <p className="text-2xl font-bold">
            {amount ? Math.round(parseFloat(amount) / 1.5) : 0} ALGO
          </p>
          <p className="text-xs opacity-75">Approximate conversion</p>
        </MinecraftCard>

        <div className="flex gap-3">
          <MinecraftButton
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </MinecraftButton>
          <MinecraftButton
            variant="primary"
            className="flex-1"
            onClick={handleContribute}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            Contribute
          </MinecraftButton>
        </div>
      </MinecraftCard>
    </div>
  )
}
