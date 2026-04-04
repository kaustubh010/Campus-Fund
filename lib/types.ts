export interface Campaign {
  id: string
  name: string
  description?: string
  target: number
  deposited: number
  status: string
  isClaimed: boolean
  createdAt: string
  deadline?: string
  category?: string
  walletAddress: string
  depositAddress?: string
  imageUrl?: string
  image?: string
  creatorName?: string
}

export interface Contribution {
  id: string
  campaignId: string
  amount: number
  timestamp: string | Date
  status: string
  txnId?: string
  walletAddress: string
}

export interface Wallet {
  algoBalance: number
  usdBalance: number
}

export interface DashboardStats {
  totalRaised: number
  totalContributions: number
  activeCampaigns: number
  completedCampaigns: number
  totalContributors: number
}

export interface ProfitLossData {
  period: string
  revenue: number
  expenses: number
  net: number
}
