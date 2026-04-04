import Link from 'next/link'
import { Calendar, Users } from 'lucide-react'

interface CampaignCardProps {
  campaign: {
    id: string
    title: string
    category: string
    coverImage: string | null
    goalINR: number
    goalALGO: number
    raisedINR: number
    raisedALGO: number
    deadline: string | Date | null
    status: string
    _count?: {
      donations: number
    }
    creator: {
      name: string | null
    }
  }
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const percent = Math.min((campaign.raisedINR / campaign.goalINR) * 100 || 0, 100)
  
  const calculateDaysLeft = (deadline: string | Date | null) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 0;
  }

  const daysLeft = calculateDaysLeft(campaign.deadline);

  return (
    <Link href={`/campaigns/${campaign.id}`} className="block group">
      <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl overflow-hidden hover:border-[#6EE7B7] transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_-15px_rgba(110,231,183,0.15)] flex flex-col h-full">
        {/* Image */}
        <div className="h-48 w-full bg-[#1E1E2E] relative overflow-hidden">
          {campaign.coverImage ? (
            <img src={campaign.coverImage} alt={campaign.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#64748B] bg-gradient-to-br from-[#1E1E2E] to-[#0A0A0F]">
              <span className="font-[Syne] font-bold text-xl opacity-50">{campaign.category}</span>
            </div>
          )}
          <div className="absolute top-3 left-3 bg-[#0A0A0F]/80 backdrop-blur-md border border-[#1E1E2E] text-[#F1F5F9] text-xs font-bold px-2 py-1 rounded-md">
            {campaign.category}
          </div>
          {campaign.status === 'funded' && (
            <div className="absolute top-3 right-3 bg-[#22C55E]/90 backdrop-blur-md text-[#0A0A0F] text-xs font-bold px-2 py-1 rounded-md">
              FUNDED
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-bold text-[#F1F5F9] font-[Syne] text-lg mb-1 line-clamp-2 leading-tight group-hover:text-[#6EE7B7] transition-colors">
            {campaign.title}
          </h3>
          <p className="text-[#64748B] text-sm mb-4">by {campaign.creator?.name || 'Anonymous'}</p>
          
          <div className="mt-auto">
            {/* Progress */}
            <div className="mb-2 flex justify-between items-end">
              <div>
                <span className="text-[#6EE7B7] font-bold text-lg">₹{Math.floor(campaign.raisedINR).toLocaleString()}</span>
                <span className="text-[#64748B] text-sm ml-1 hidden sm:inline">/ ₹{campaign.goalINR.toLocaleString()}</span>
              </div>
              <span className="text-[#818CF8] font-[JetBrains_Mono] text-sm">{campaign.raisedALGO.toFixed(1)} ALGO</span>
            </div>
            
            <div className="w-full bg-[#1E1E2E] h-1.5 rounded-full mb-4 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#6EE7B7] to-[#818CF8] rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="flex border-t border-[#1E1E2E] pt-4 mt-2 justify-between">
              <div className="flex items-center gap-1.5 text-[#64748B] text-sm">
                <Users className="w-4 h-4" />
                <span>{campaign._count?.donations || 0}</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-[#64748B] text-sm">
                <Calendar className="w-4 h-4" />
                <span>{daysLeft !== null ? (daysLeft === 0 ? 'Ends today' : `${daysLeft} days`) : 'No limit'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
