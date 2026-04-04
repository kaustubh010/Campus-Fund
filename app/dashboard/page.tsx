'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Navbar } from '@/components/navbar'
import { useGoals } from '@/hooks/use-goals'
import { useWallet } from '@/context/wallet-context'

export default function DashboardPage() {
  const { wallet } = useWallet() // Switching to real wallet context
  const { goals: campaigns, isLoading } = useGoals()
  
  const myCampaigns = campaigns
  // Placeholder stats logic for now
  const stats = useMemo(() => {
    const totalRaised = (campaigns || []).reduce((sum: number, c: any) => sum + (c.deposited || 0), 0)
    return {
      totalRaised,
      campaignCount: (campaigns || []).length,
      totalBackers: (campaigns || []).reduce((sum: number, c: any) => sum + (c.deposits?.length || 0), 0),
      successRate: (campaigns || []).length > 0 ? Math.round(((campaigns || []).filter((c: any) => (c.deposited || 0) >= (c.target || 0)).length / (campaigns || []).length) * 100) : 0
    }
  }, [campaigns])

  const analyticsData = useMemo(() => {
    const timeline = [
      { day: 'Mon', amount: 3500 },
      { day: 'Tue', amount: 4200 },
      { day: 'Wed', amount: 2800 },
      { day: 'Thu', amount: 5100 },
      { day: 'Fri', amount: 6800 },
      { day: 'Sat', amount: 4900 },
      { day: 'Sun', amount: 3600 },
    ]

    const profitLoss = [
      { month: 'Jan', revenue: 15000, expenses: 8000, net: 7000 },
      { month: 'Feb', revenue: 24500, expenses: 12000, net: 12500 },
      { month: 'Mar', revenue: 18200, expenses: 9500, net: 8700 },
    ]

    const categories = campaigns?.map((c: any) => c.category || 'campus') || []
    const counts = categories.reduce((acc: any, cat: string) => {
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {})

    const categoryBreakdown = Object.entries(counts).map(([name, value], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: (value as number) * 1000, // Weighted for display
      fill: ['#6cd946', '#f4d135', '#40e0d0', '#ff6b6b', '#9370db', '#ffa500'][index % 6]
    }))

    if (categoryBreakdown.length === 0) {
      categoryBreakdown.push({ name: 'General', value: 1, fill: '#6cd946' })
    }

    return { timeline, profitLoss, categoryBreakdown }
  }, [campaigns])

  const chartColors = {
    stroke: '#6cd946',
    fill: '#6cd946',
    revenue: '#6cd946',
    expenses: '#ff6b6b',
    net: '#f4d135',
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a2818] p-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          <div className="h-12 bg-[#2d3d2b] w-1/4" />
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-[#2d3d2b]" />)}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 bg-[#2d3d2b]" />
            <div className="h-64 bg-[#2d3d2b]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a2818]">

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#6cd946] mb-2">
            Creator Dashboard
          </h1>
          <p className="text-[#7aa878]">
            Track your campaigns and analytics in real-time
          </p>
        </div>

        {/* Key Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#2d3d2b] border-2 border-[#3d5a3b] p-4">
            <p className="text-[#7aa878] text-xs mb-1">Total Raised</p>
            <p className="text-[#6cd946] font-bold text-2xl">
              {stats.totalRaised.toLocaleString()} ALGO
            </p>
          </div>
          <div className="bg-[#2d3d2b] border-2 border-[#3d5a3b] p-4">
            <p className="text-[#7aa878] text-xs mb-1">Active Campaigns</p>
            <p className="text-[#f4d135] font-bold text-2xl">
              {stats.campaignCount}
            </p>
          </div>
          <div className="bg-[#2d3d2b] border-2 border-[#3d5a3b] p-4">
            <p className="text-[#7aa878] text-xs mb-1">Total Backers</p>
            <p className="text-[#40e0d0] font-bold text-2xl">
              {stats.totalBackers}
            </p>
          </div>
          <div className="bg-[#2d3d2b] border-2 border-[#3d5a3b] p-4">
            <p className="text-[#7aa878] text-xs mb-1">Avg Success Rate</p>
            <p className="text-[#6cd946] font-bold text-2xl">
              {stats.successRate}%
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-[#2d3d2b] border-2 border-[#3d5a3b] p-6">
            <h3 className="text-[#6cd946] font-bold mb-4">Contribution Timeline</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analyticsData.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d5a3b" />
                <XAxis stroke="#7aa878" />
                <YAxis stroke="#7aa878" />
                <Tooltip contentStyle={{ backgroundColor: '#2d3d2b', border: '1px solid #3d5a3b' }} />
                <Line type="monotone" dataKey="amount" stroke={chartColors.stroke} strokeWidth={2} dot={{ fill: chartColors.fill }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Profit & Loss */}
          <div className="bg-[#2d3d2b] border-2 border-[#3d5a3b] p-6">
            <h3 className="text-[#6cd946] font-bold mb-4">Revenue vs Expenses</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analyticsData.profitLoss}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d5a3b" />
                <XAxis stroke="#7aa878" />
                <YAxis stroke="#7aa878" />
                <Tooltip contentStyle={{ backgroundColor: '#2d3d2b', border: '1px solid #3d5a3b' }} />
                <Legend />
                <Bar dataKey="revenue" fill={chartColors.revenue} />
                <Bar dataKey="expenses" fill={chartColors.expenses} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* More Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Net Profit */}
          <div className="bg-[#2d3d2b] border-2 border-[#3d5a3b] p-6">
            <h3 className="text-[#6cd946] font-bold mb-4">Net Profit Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analyticsData.profitLoss}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d5a3b" />
                <XAxis stroke="#7aa878" />
                <YAxis stroke="#7aa878" />
                <Tooltip contentStyle={{ backgroundColor: '#2d3d2b', border: '1px solid #3d5a3b' }} />
                <Line type="monotone" dataKey="net" stroke={chartColors.net} strokeWidth={2} dot={{ fill: chartColors.net }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="bg-[#2d3d2b] border-2 border-[#3d5a3b] p-6">
            <h3 className="text-[#6cd946] font-bold mb-4">Funding by Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analyticsData.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {analyticsData.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#2d3d2b', border: '1px solid #3d5a3b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* My Campaigns */}
        <div>
          <h2 className="text-2xl font-bold text-[#6cd946] mb-6">My Campaigns</h2>
          
          {myCampaigns?.length === 0 ? (
            <div className="bg-[#2d3d2b] border-2 border-[#3d5a3b] p-8 text-center">
              <p className="text-[#a8d5a8] mb-4">No campaigns yet. Create your first campaign!</p>
              <Link href="/goals/new">
                <button className="px-6 py-2 bg-[#6cd946] text-[#1a2818] font-bold border-2 border-[#6cd946]">
                  Create Campaign
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myCampaigns.map((campaign: any) => {
                const progress = (campaign.deposited / campaign.target) * 100
                return (
                  <Link key={campaign.id} href={`/goals/${campaign.id}`}>
                    <div className="bg-[#2d3d2b] border-2 border-[#3d5a3b] p-4 hover:border-[#6cd946] transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-[#a8d5a8]">{campaign.name}</h3>
                        <span className={`text-xs font-bold px-2 py-1 ${
                          campaign.status === 'active' ? 'bg-[#6cd946] text-[#1a2818]' : 'bg-[#3d5a3b] text-[#a8d5a8]'
                        }`}>
                          {(campaign.status || 'active').toUpperCase()}
                        </span>
                      </div>
                      <div className="w-full bg-[#1a2818] h-4 border border-[#3d5a3b] mb-2">
                        <div 
                          className="bg-[#f4d135] h-full"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-[#7aa878]">
                        <span>{campaign.deposited.toLocaleString()} / {campaign.target.toLocaleString()} ALGO</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
