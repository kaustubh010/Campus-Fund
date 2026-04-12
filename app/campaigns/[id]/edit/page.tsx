'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, UploadCloud } from 'lucide-react'
import { toast } from 'react-toastify'

export default function EditCampaignPage() {
  const params = useParams()
  const campaignId = params.id as string
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Events')
  const [coverImage, setCoverImage] = useState('')
  const [goalINR, setGoalINR] = useState('')
  const [deadline, setDeadline] = useState('')

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to fetch campaign')
        setTitle(data.title || '')
        setDescription(data.description || '')
        setCategory(data.category || 'Events')
        setCoverImage(data.coverImage || '')
        setGoalINR(String(data.goalINR ?? ''))
        setDeadline(data.deadline ? new Date(data.deadline).toISOString().slice(0, 10) : '')
      } catch (err: any) {
        toast.error(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchCampaign()
  }, [campaignId])

  const handleCoverUpload = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('cover', file)
      const res = await fetch('/api/campaigns/upload-cover', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Cover upload failed')
      setCoverImage(data.url)
      toast.success('Cover image uploaded')
    } catch (err: any) {
      toast.error(err.message || 'Cover upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          coverImage,
          goalINR: Number(goalINR),
          deadline: deadline || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update campaign')
      toast.success('Campaign updated')
      router.push(`/campaigns/${campaignId}`)
    } catch (err: any) {
      toast.error(err.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-[#0A0A0F] pt-24 text-center text-[#F1F5F9]">Loading...</div>

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-20 px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/dashboard/company/campaigns" className="text-[#64748B] hover:text-[#F1F5F9] text-sm inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Manager
        </Link>

        <div className="bg-[#111118] border border-[#1E1E2E] rounded-3xl p-8 space-y-5">
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Edit Campaign</h1>

          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-[#F1F5F9]" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full min-h-[120px] bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-[#F1F5F9]" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-[#F1F5F9]">
            <option>Education</option>
            <option>Events</option>
            <option>Social</option>
            <option>Tech</option>
            <option>Arts</option>
          </select>

          <div className="space-y-2">
            <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="Cover image URL" className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-[#F1F5F9]" />
            <label className="w-full relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#1E1E2E] hover:border-[#6EE7B7]/50 rounded-xl bg-[#0A0A0F] cursor-pointer transition-colors group mt-2">
              <UploadCloud className="w-6 h-6 text-[#64748B] group-hover:text-[#6EE7B7] mb-2 transition-colors" />
              <span className="text-sm text-[#F1F5F9] text-center font-bold">
                {uploading ? 'Uploading...' : 'Drop Cover Image Here or Click'}
              </span>
              <span className="text-[10px] text-[#64748B] mt-1">JPG, PNG, WEBP (Max 5MB)</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleCoverUpload(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer hidden"
                disabled={uploading}
              />
            </label>
          </div>

          <input type="number" value={goalINR} onChange={(e) => setGoalINR(e.target.value)} placeholder="Goal INR" className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-[#F1F5F9]" />
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-[#F1F5F9]" />

          <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-[#6EE7B7] text-[#0A0A0F] rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
