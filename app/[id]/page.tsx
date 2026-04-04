'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { MinecraftButton } from '@/components/minecraft/button'
import { MinecraftCard } from '@/components/minecraft/card'
import { MinecraftProgressBar } from '@/components/minecraft/progress-bar'
import { ContributionModal } from '@/components/contribution-modal'
import { useCrowdfund } from '@/lib/context'

export default function CampaignDetailPage() {
  const params = useParams()
  const { getCampaignById, contributeToCampaign, getCampaignContributions } = useCrowdfund()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [justContributed, setJustContributed] = useState(false)

  const campaign = getCampaignById(params.id as string)
  const contributions = getCampaignContributions(params.id as string)

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MinecraftCard className="text-center py-12">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Campaign not found</h2>
          <Link href="/discover">
            <MinecraftButton variant="primary">Back to Campaigns</MinecraftButton>
          </Link>
        </MinecraftCard>
      </div>
    )
  }

  const progress = (campaign.raised / campaign.goal) * 100
  const daysLeft = Math.ceil((new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const avgContribution = contributions.length > 0 ? campaign.raised / contributions.length : 0

  const handleContribute = (amount: number) => {
    const algoAmount = amount / 1.5
    contributeToCampaign(campaign.id, amount, algoAmount)
    setJustContributed(true)
    setTimeout(() => setJustContributed(false), 3000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-4 border-minecraft-stone bg-white shadow-minecraft-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-minecraft-grass rounded-minecraft flex items-center justify-center text-white font-bold">
              ⛏
            </div>
            <span className="font-bold text-minecraft-grass">CampusCraft</span>
          </Link>
          <Link href="/discover">
            <MinecraftButton variant="secondary" size="sm">
              ← Discover More
            </MinecraftButton>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Campaign Image */}
            <div className="relative w-full h-96 rounded-minecraft overflow-hidden border-4 border-minecraft-stone shadow-minecraft-lg">
              <Image
                src={campaign.image}
                alt={campaign.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Campaign Info */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-minecraft-grass leading-tight text-balance">
                {campaign.title}
              </h1>
              
              <p className="text-lg text-foreground leading-relaxed">
                {campaign.description}
              </p>

              {/* Creator Info */}
              <MinecraftCard className="flex items-center gap-4">
                <div className="w-16 h-16 bg-minecraft-grass rounded-minecraft flex items-center justify-center text-2xl font-bold text-white">
                  {campaign.creatorName[0]}
                </div>
                <div>
                  <p className="font-bold text-lg">{campaign.creatorName}</p>
                  <p className="text-sm text-muted-foreground">Campaign Creator</p>
                </div>
              </MinecraftCard>
            </div>

            {/* Updates Section */}
            {campaign.updates && campaign.updates.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-minecraft-grass">Updates</h3>
                <div className="space-y-3">
                  {campaign.updates.map((update, i) => (
                    <MinecraftCard key={i} variant="dark" className="text-white">
                      <p className="font-bold mb-1">Update {i + 1}</p>
                      <p className="text-sm">{update}</p>
                    </MinecraftCard>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Contributions */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-minecraft-grass">
                Recent Contributions ({contributions.length})
              </h3>
              {contributions.length === 0 ? (
                <MinecraftCard className="text-center py-8">
                  <p className="text-muted-foreground">Be the first to contribute!</p>
                </MinecraftCard>
              ) : (
                <div className="space-y-2">
                  {contributions.slice(0, 5).map((contrib) => (
                    <MinecraftCard key={contrib.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-minecraft-gold">
                          ${contrib.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(contrib.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-xs bg-minecraft-grass bg-opacity-20 px-2 py-1 rounded">
                        {contrib.algoAmount.toFixed(0)} ALGO
                      </div>
                    </MinecraftCard>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Success Message */}
            {justContributed && (
              <MinecraftCard variant="default" className="border-4 border-minecraft-grass bg-minecraft-grass bg-opacity-10">
                <div className="text-center">
                  <div className="text-4xl mb-2">✨</div>
                  <p className="font-bold text-minecraft-grass">Thank you for your contribution!</p>
                </div>
              </MinecraftCard>
            )}

            {/* Funding Card */}
            <MinecraftCard className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-muted-foreground">Raised</p>
                    <p className="text-3xl font-bold text-minecraft-gold">
                      ${campaign.raised.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Goal</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${campaign.goal.toLocaleString()}
                    </p>
                  </div>
                </div>

                <MinecraftProgressBar
                  value={campaign.raised}
                  max={campaign.goal}
                  color="grass"
                  showLabel={false}
                />

                <p className="text-sm font-bold text-minecraft-grass">
                  {Math.round(progress)}% funded
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-minecraft-stone">
                <div>
                  <p className="text-xs text-muted-foreground">Days Left</p>
                  <p className="text-2xl font-bold text-minecraft-diamond">
                    {daysLeft > 0 ? daysLeft : 'Ended'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Backers</p>
                  <p className="text-2xl font-bold text-minecraft-emerald">
                    {contributions.length}
                  </p>
                </div>
              </div>
            </MinecraftCard>

            {/* Stats */}
            <MinecraftCard className="space-y-3 bg-minecraft-grass bg-opacity-10">
              <h4 className="font-bold text-minecraft-grass">Campaign Stats</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg. Contribution</span>
                  <span className="font-bold">${avgContribution.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-bold capitalize">{campaign.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-bold capitalize">{campaign.status}</span>
                </div>
              </div>
            </MinecraftCard>

            {/* Contribute Button */}
            {daysLeft > 0 && campaign.status === 'active' && (
              <MinecraftButton
                variant="accent"
                className="w-full py-3 text-lg"
                onClick={() => setIsModalOpen(true)}
              >
                Back This Project
              </MinecraftButton>
            )}

            {daysLeft <= 0 && (
              <MinecraftCard className="text-center py-4 bg-minecraft-stone bg-opacity-20">
                <p className="font-bold text-foreground">Campaign has ended</p>
              </MinecraftCard>
            )}

            {/* Share */}
            <MinecraftCard className="space-y-3">
              <h4 className="font-bold text-foreground">Share This Campaign</h4>
              <p className="text-xs text-muted-foreground">
                Help spread the word about this project
              </p>
              <div className="grid grid-cols-3 gap-2">
                <MinecraftButton variant="secondary" size="sm">
                  Twitter
                </MinecraftButton>
                <MinecraftButton variant="secondary" size="sm">
                  Discord
                </MinecraftButton>
                <MinecraftButton variant="secondary" size="sm">
                  Copy Link
                </MinecraftButton>
              </div>
            </MinecraftCard>
          </div>
        </div>
      </div>

      <ContributionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onContribute={handleContribute}
        campaignTitle={campaign.title}
      />
    </div>
  )
}
