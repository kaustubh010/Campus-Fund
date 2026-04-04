import type { Campaign, Contribution } from './types'

export const mockCampaigns: Campaign[] = [
  {
    id: 'campaign-1',
    name: 'Campus Gaming Arena',
    description: 'Build a state-of-the-art gaming tournament facility for esports competitions.',
    category: 'tech',
    target: 50000,
    deposited: 38500,
    status: 'active',
    isClaimed: false,
    walletAddress: 'GD64YIY3TWGDMCNY6W2H3Y7ECXF33B6H6F6H6F6H6F6H6F6H6F6H6F6H',
    depositAddress: 'GD64YIY3TWGDMCNY6W2H3Y7ECXF33B6H6F6H6F6H6F6H6F6H6F6H6F6H',
    image: 'https://images.unsplash.com/photo-1542751371-69fde21cbd46?w=500&h=300&fit=crop',
    deadline: '2024-04-30',
    createdAt: '2024-02-15',
    creatorName: 'Alex Chen',
  },
  {
    id: 'campaign-2',
    name: 'Eco-Garden Initiative',
    description: 'Transform unused campus land into a sustainable garden.',
    category: 'campus',
    target: 15000,
    deposited: 12800,
    status: 'active',
    isClaimed: false,
    walletAddress: 'GD64YIY3TWGDMCNY6W2H3Y7ECXF33B6H6F6H6F6H6F6H6F6H6F6H6F6H',
    depositAddress: 'GD64YIY3TWGDMCNY6W2H3Y7ECXF33B6H6F6H6F6H6F6H6F6H6F6H6F6H',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&h=300&fit=crop',
    deadline: '2024-04-15',
    createdAt: '2024-02-20',
    creatorName: 'Jordan Smith',
  },
]

export const mockContributions: Contribution[] = [
  {
    id: 'contrib-1',
    campaignId: 'campaign-1',
    amount: 500,
    timestamp: '2024-02-28T10:30:00Z',
    status: 'confirmed',
    txnId: '1a2b3c4d5e6f7g8h',
    walletAddress: 'GD64YIY3TWGDMCNY6W2H3Y7ECXF33B6H6F6H6F6H6F6H6F6H6F6H6F6H',
  },
]
