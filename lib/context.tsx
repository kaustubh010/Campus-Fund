'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { mockCampaigns, mockContributions } from './mock-data'
import type { Campaign, Contribution, Wallet } from './types'

interface CrowdfundContextType {
  campaigns: Campaign[]
  contributions: Contribution[]
  wallet: Wallet
  createCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'raised'>) => void
  contributeToCampaign: (campaignId: string, amount: number, algoAmount: number) => void
  withdrawFunds: (campaignId: string, amount: number) => void
  updateWallet: (amount: number) => void
  getCampaignById: (id: string) => Campaign | undefined
  getCampaignContributions: (campaignId: string) => Contribution[]
  getCreatorCampaigns: (creatorId: string) => Campaign[]
  getCreatorStats: (creatorId: string) => { totalRaised: number; campaignCount: number; contributorCount: number }
}

const CrowdfundContext = createContext<CrowdfundContextType | undefined>(undefined)

export function CrowdfundProvider({ children }: { children: React.ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns)
  const [contributions, setContributions] = useState<Contribution[]>(mockContributions)
  const [wallet, setWallet] = useState<Wallet>({ algoBalance: 5000, usdBalance: 15000 })

  const createCampaign = useCallback((newCampaign: Omit<Campaign, 'id' | 'createdAt' | 'deposited' | 'status' | 'isClaimed'>) => {
    const campaign: Campaign = {
      ...newCampaign,
      id: `campaign-${Date.now()}`,
      createdAt: new Date().toISOString(),
      deposited: 0,
      status: 'active',
      isClaimed: false,
    }
    setCampaigns(prev => [campaign, ...prev])
  }, [])

  const contributeToCampaign = useCallback((campaignId: string, amount: number) => {
    // Update campaign deposited amount
    setCampaigns(prev =>
      prev.map(c =>
        c.id === campaignId ? { ...c, deposited: c.deposited + amount } : c
      )
    )

    // Add contribution record
    const contribution: Contribution = {
      id: `contrib-${Date.now()}`,
      campaignId,
      amount,
      timestamp: new Date().toISOString(),
      status: 'confirmed',
      txnId: `0x${Math.random().toString(16).slice(2)}`,
      walletAddress: 'mock-address',
    }
    setContributions(prev => [contribution, ...prev])
  }, [])

  const withdrawFunds = useCallback((campaignId: string, amount: number) => {
    const campaign = campaigns.find(c => c.id === campaignId)
    if (!campaign) return

    // Update campaign withdrawal status
    setCampaigns(prev =>
      prev.map(c =>
        c.id === campaignId ? { ...c, status: 'claimed', isClaimed: true } : c
      )
    )
  }, [campaigns])

  const updateWallet = useCallback((amount: number) => {
    // Not needed for now
  }, [])

  const getCampaignById = useCallback((id: string) => {
    return campaigns.find(c => c.id === id)
  }, [campaigns])

  const getCampaignContributions = useCallback((campaignId: string) => {
    return contributions.filter(c => c.campaignId === campaignId)
  }, [contributions])

  const getCreatorCampaigns = useCallback((creatorId: string) => {
    return campaigns // Filter logic retired for mock
  }, [campaigns])

  const getCreatorStats = useCallback((creatorId: string) => {
    const totalRaised = campaigns.reduce((sum, c) => sum + c.deposited, 0)
    return {
      totalRaised,
      campaignCount: campaigns.length,
      contributorCount: contributions.length,
    }
  }, [campaigns, contributions])

  return (
    <CrowdfundContext.Provider value={{
      campaigns,
      contributions,
      wallet,
      createCampaign,
      contributeToCampaign,
      withdrawFunds,
      updateWallet,
      getCampaignById,
      getCampaignContributions,
      getCreatorCampaigns,
      getCreatorStats,
    }}>
      {children}
    </CrowdfundContext.Provider>
  )
}

export function useCrowdfund() {
  const context = useContext(CrowdfundContext)
  if (!context) {
    throw new Error('useCrowdfund must be used within CrowdfundProvider')
  }
  return context
}
