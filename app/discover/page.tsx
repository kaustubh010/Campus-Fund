'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { CampaignCard } from '@/components/campaign-card'
import { MinecraftInput } from '@/components/minecraft/input'
import { useGoals } from '@/hooks/use-goals'
import { type Campaign } from '@/lib/types'

export default function DiscoverPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const { goals: campaigns, isLoading } = useGoals({ 
    category: selectedCategory === 'All' ? undefined : selectedCategory,
    search: searchTerm
  })
  
  const [sortBy, setSortBy] = useState<'trending' | 'newest' | 'ending-soon'>('trending')

  const categories = ['All', 'Clubs', 'Campus', 'Events', 'Arts', 'Tech', 'Sports']

  const sortedAndFiltered = useMemo(() => {
    if (!campaigns) return []
    let result = [...campaigns]

    // Sort
    switch (sortBy) {
      case 'trending':
        result.sort((a: any, b: any) => (b.deposited / b.target) - (a.deposited / a.target))
        break
      case 'newest':
        result.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'ending-soon':
        result.sort((a: any, b: any) => {
          const aEnd = a.deadline ? new Date(a.deadline).getTime() : Infinity
          const bEnd = b.deadline ? new Date(b.deadline).getTime() : Infinity
          return aEnd - bEnd
        })
        break
    }
    return result
  }, [campaigns, sortBy])

  return (
    <div className="min-h-screen bg-[#1a2818]">

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-8 relative max-w-2xl mx-auto">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🔍</div>
          <input
            type="text"
            placeholder="Search campaigns by name or story..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#2d3d2b] border-4 border-[#3d5a3b] p-4 pl-14 text-[#a8d5a8] font-bold focus:border-[#6cd946] focus:outline-none shadow-minecraft-md placeholder:text-[#5a7a58]"
          />
        </div>

        {/* Filters Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 font-bold border-2 transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#6cd946] text-[#1a2818] border-[#6cd946] translate-y-0.5'
                    : 'bg-[#2d3d2b] text-[#a8d5a8] border-[#3d5a3b] hover:border-[#6cd946] hover:-translate-y-0.5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold text-[#7aa878] uppercase mr-2">Sort By:</span>
            {(['trending', 'newest', 'ending-soon'] as const).map(option => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`px-3 py-1.5 font-bold border-2 text-xs transition-colors ${
                  sortBy === option
                    ? 'bg-[#f4d135] text-[#1a2818] border-[#e5bc24]'
                    : 'bg-[#2d3d2b] text-[#a8d5a8] border-[#3d5a3b]'
                }`}
              >
                {option === 'ending-soon' ? 'Ending Soon' : option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-[#2d3d2b] border-2 border-[#3d5a3b] h-64 animate-pulse" />
            ))}
          </div>
        ) : sortedAndFiltered.length === 0 ? (
          <div className="bg-[#2d3d2b] border-4 border-[#3d5a3b] text-center py-24 px-4 shadow-minecraft-lg">
            <div className="text-6xl mb-6">🏜️</div>
            <h3 className="text-3xl font-bold text-[#a8d5a8] mb-4">No Campaigns Found</h3>
            <p className="text-[#7aa878] mb-8 max-w-md mx-auto">We couldn't find any projects matching your search or filters. Try broaden your search or join a different biome!</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('All')
              }}
              className="px-8 py-3 bg-[#6cd946] text-[#1a2818] font-bold border-4 border-[#52af35] hover:bg-[#52af35] transition-colors"
            >
              Reset World View
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {sortedAndFiltered.map((campaign: Campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
