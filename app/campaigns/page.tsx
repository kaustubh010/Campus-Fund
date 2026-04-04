'use client'

import { useState, useEffect } from 'react'
import { CampaignCard } from '@/components/campaign-card'
import { Filter, ArrowDownWideNarrow, Search } from 'lucide-react'

export default function ExploreCampaignsPage() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  
  const categories = ['All', 'Education', 'Events', 'Social', 'Tech', 'Arts']
  const [selectedCategory, setSelectedCategory] = useState('All')
  
  const sortOptions = ['Newest', 'Most funded', 'Ending soon']
  const [selectedSort, setSelectedSort] = useState('Newest')

  const [searchQuery, setSearchQuery] = useState('')

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (selectedCategory !== 'All') query.append('category', selectedCategory)
      if (searchQuery) query.append('search', searchQuery)
      query.append('sort', selectedSort)
      
      const res = await fetch(`/api/campaigns?${query.toString()}`)
      const data = await res.json()
      if (data.campaigns) {
        setCampaigns(data.campaigns)
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCampaigns()
    }, 300) // Debounce search
    return () => clearTimeout(timer)
  }, [selectedCategory, selectedSort, searchQuery])

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-20 mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-[Syne] text-[#F1F5F9] mb-4">
              Explore <span className="text-[#6EE7B7]">Campaigns</span>
            </h1>
            <p className="text-[#64748B] text-lg max-w-2xl">
              Support innovative campus projects, events, and causes. Every donation is secured by Algorand smart escrows.
            </p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 mb-10 border-b border-[#1E1E2E] pb-8">
          
          <div className="flex-1 max-w-md relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] group-focus-within:text-[#6EE7B7] transition-colors" />
            <input 
              type="text" 
              placeholder="Search by title, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111118] border border-[#1E1E2E] text-[#F1F5F9] rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-[#6EE7B7]/50 transition-all font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#6EE7B7] text-[#0A0A0F] shadow-[0_0_15px_rgba(110,231,183,0.3)]'
                    : 'bg-[#111118] border border-[#1E1E2E] text-[#64748B] hover:text-[#F1F5F9] hover:border-[#6EE7B7]/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <ArrowDownWideNarrow className="w-4 h-4 text-[#64748B] group-focus-within:text-[#6EE7B7]" />
              </div>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="bg-[#111118] border border-[#1E1E2E] text-[#F1F5F9] rounded-xl pl-9 pr-8 py-2 outline-none appearance-none cursor-pointer hover:border-[#6EE7B7]/50 transition-colors font-bold text-sm"
              >
                {sortOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Campaign Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse bg-[#111118] border border-[#1E1E2E] rounded-2xl h-96"></div>
            ))}
          </div>
        ) : campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((campaign: any) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-[#111118] border border-[#1E1E2E] rounded-3xl">
            <Search className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
            <h3 className="text-xl font-bold font-[Syne] text-[#F1F5F9] mb-2">No campaigns found</h3>
            <p className="text-[#64748B]">We couldn't find any campaigns matching your criteria.</p>
            <button 
              onClick={() => { setSelectedCategory('All'); setSelectedSort('Newest'); }}
              className="mt-6 px-6 py-2 bg-[#1E1E2E] text-[#F1F5F9] rounded-xl hover:bg-[#6EE7B7] hover:text-[#0A0A0F] font-bold transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
