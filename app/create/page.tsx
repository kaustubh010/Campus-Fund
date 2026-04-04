'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MinecraftButton } from '@/components/minecraft/button'
import { MinecraftCard } from '@/components/minecraft/card'
import { MinecraftInput } from '@/components/minecraft/input'
import { useCrowdfund } from '@/lib/context'
import type { Campaign } from '@/lib/types'

type Step = 'info' | 'details' | 'goal' | 'confirm'

export default function CreateCampaignPage() {
  const router = useRouter()
  const { createCampaign } = useCrowdfund()
  const [step, setStep] = useState<Step>('info')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'tech' as const,
    goal: '',
    deadline: '',
    image: '',
  })

  const categories = ['sports', 'arts', 'tech', 'charity', 'events', 'education']

  const validateStep = (currentStep: Step): boolean => {
    const newErrors: Record<string, string> = {}

    if (currentStep === 'info') {
      if (!formData.title.trim()) newErrors.title = 'Title is required'
      if (formData.title.length < 5) newErrors.title = 'Title must be at least 5 characters'
      if (!formData.category) newErrors.category = 'Category is required'
    }

    if (currentStep === 'details') {
      if (!formData.description.trim()) newErrors.description = 'Description is required'
      if (formData.description.length < 20) newErrors.description = 'Description must be at least 20 characters'
      if (!formData.image.trim()) newErrors.image = 'Campaign image is required'
    }

    if (currentStep === 'goal') {
      const goalNum = parseFloat(formData.goal)
      if (!formData.goal) newErrors.goal = 'Funding goal is required'
      if (isNaN(goalNum) || goalNum < 100) newErrors.goal = 'Goal must be at least $100'
      if (!formData.deadline) newErrors.deadline = 'Deadline is required'

      const deadline = new Date(formData.deadline)
      const today = new Date()
      const minDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

      if (deadline <= today) newErrors.deadline = 'Deadline must be in the future'
      if (deadline < minDate) newErrors.deadline = 'Deadline must be at least 7 days away'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep(step)) return

    const steps: Step[] = ['info', 'details', 'goal', 'confirm']
    const currentIndex = steps.indexOf(step)
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const steps: Step[] = ['info', 'details', 'goal', 'confirm']
    const currentIndex = steps.indexOf(step)
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1])
    }
  }

  const handleSubmit = () => {
    if (!validateStep('goal')) return

    const newCampaign: Omit<Campaign, 'id' | 'createdAt' | 'raised'> = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      goal: parseFloat(formData.goal),
      creatorId: 'creator-1',
      creatorName: 'You',
      image: formData.image || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop',
      deadline: formData.deadline,
      status: 'active',
      updates: [],
    }

    createCampaign(newCampaign)
    setSubmitted(true)
    setTimeout(() => {
      router.push('/')
    }, 2000)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MinecraftCard className="text-center py-12 max-w-md">
          <div className="text-6xl mb-4 animate-minecraft-bounce">✨</div>
          <h2 className="text-2xl font-bold text-minecraft-grass mb-2">
            Campaign Created!
          </h2>
          <p className="text-muted-foreground mb-6">
            Your campaign is now live and ready to receive contributions.
          </p>
          <p className="text-sm text-muted-foreground">Redirecting to home...</p>
        </MinecraftCard>
      </div>
    )
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
          <Link href="/">
            <MinecraftButton variant="secondary" size="sm">
              ← Cancel
            </MinecraftButton>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Progress Indicator */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-minecraft-grass mb-8">
            Create Your Campaign
          </h1>

          <div className="flex gap-2 mb-8">
            {['info', 'details', 'goal', 'confirm'].map((s, i) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-minecraft transition-all ${
                  ['info', 'details', 'goal', 'confirm'].indexOf(step) >= i
                    ? 'bg-minecraft-grass'
                    : 'bg-minecraft-stone'
                }`}
              />
            ))}
          </div>

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {['info', 'details', 'goal', 'confirm'].indexOf(step) + 1}</span>
            <span>of 4</span>
          </div>
        </div>

        {/* Form Content */}
        <MinecraftCard className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 'info' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Campaign Title</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a compelling title that captures the essence of your project
                </p>
              </div>

              <MinecraftInput
                label="Campaign Title"
                placeholder="e.g., Campus Gaming Arena"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={errors.title}
              />

              <div>
                <label className="block text-sm font-bold text-foreground mb-3">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFormData({ ...formData, category: cat as any })}
                      className={`p-3 rounded-minecraft border-4 transition-all capitalize font-bold ${
                        formData.category === cat
                          ? 'border-minecraft-grass bg-minecraft-grass bg-opacity-10'
                          : 'border-minecraft-stone hover:border-minecraft-grass'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 'details' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Campaign Details</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Write a detailed description of your project
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Describe your project, goals, and what you'll do with the funds..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border-4 border-minecraft-stone rounded-minecraft focus:outline-none focus:border-minecraft-grass focus:shadow-minecraft-md transition-all min-h-32 text-foreground"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1 font-bold">{errors.description}</p>
                )}
              </div>

              <MinecraftInput
                label="Campaign Image URL"
                placeholder="https://example.com/image.jpg"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                error={errors.image}
              />

              {formData.image && (
                <div className="relative w-full h-40 rounded-minecraft overflow-hidden border-4 border-minecraft-stone">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setFormData({ ...formData, image: '' })}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Goals */}
          {step === 'goal' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Funding Goal</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Set your funding target and campaign deadline
                </p>
              </div>

              <MinecraftInput
                label="Funding Goal (USD)"
                type="number"
                min="100"
                step="100"
                placeholder="10000"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                error={errors.goal}
              />

              <MinecraftInput
                label="Campaign Deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                error={errors.deadline}
              />

              <MinecraftCard variant="dark" className="space-y-3 text-white">
                <h4 className="font-bold">Campaign Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Goal:</span>
                    <span className="font-bold">${formData.goal || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deadline:</span>
                    <span className="font-bold">
                      {formData.deadline ? new Date(formData.deadline).toDateString() : 'Not set'}
                    </span>
                  </div>
                </div>
              </MinecraftCard>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Review Campaign</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Make sure everything looks good before publishing
                </p>
              </div>

              <MinecraftCard variant="default" className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Title</p>
                  <p className="text-xl font-bold text-foreground">{formData.title}</p>
                </div>
                <div className="border-t-2 border-minecraft-stone pt-4">
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-lg font-bold text-minecraft-grass capitalize">{formData.category}</p>
                </div>
                <div className="border-t-2 border-minecraft-stone pt-4">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm text-foreground line-clamp-3">{formData.description}</p>
                </div>
                <div className="border-t-2 border-minecraft-stone pt-4">
                  <p className="text-xs text-muted-foreground">Funding Goal</p>
                  <p className="text-2xl font-bold text-minecraft-gold">${formData.goal}</p>
                </div>
              </MinecraftCard>

              <MinecraftCard variant="dark" className="text-white space-y-2 border-l-4 border-minecraft-gold">
                <p className="font-bold flex items-center gap-2">
                  <span>✓</span> Ready to Publish
                </p>
                <p className="text-sm opacity-75">
                  Your campaign will be live immediately and visible to all users.
                </p>
              </MinecraftCard>
            </div>
          )}
        </MinecraftCard>

        {/* Navigation */}
        <div className="flex gap-4 mt-8">
          {step !== 'info' && (
            <MinecraftButton
              variant="secondary"
              className="flex-1"
              onClick={handleBack}
            >
              ← Back
            </MinecraftButton>
          )}
          {step !== 'confirm' && (
            <MinecraftButton
              variant="primary"
              className="flex-1"
              onClick={handleNext}
            >
              Next →
            </MinecraftButton>
          )}
          {step === 'confirm' && (
            <MinecraftButton
              variant="accent"
              className="flex-1"
              onClick={handleSubmit}
            >
              Publish Campaign
            </MinecraftButton>
          )}
        </div>
      </div>
    </div>
  )
}
