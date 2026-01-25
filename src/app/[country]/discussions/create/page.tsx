'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCountry } from '@/lib/country-context'
import { DISCUSSION_CATEGORIES } from '@/lib/categories'
import { VideoRecorder } from '@/components/VideoRecorder'
import {
  ArrowLeft,
  MessageSquare,
  Video,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Landmark,
  AlertTriangle,
  Users,
  Heart,
  GraduationCap,
  Leaf,
  TrendingUp,
  Building2,
  Shield,
  MapPin,
} from 'lucide-react'

// Category icon mapping
const categoryIcons: Record<string, typeof Landmark> = {
  POLITICS: Landmark,
  CORRUPTION: AlertTriangle,
  COMMUNITY: Users,
  HEALTH: Heart,
  EDUCATION: GraduationCap,
  ENVIRONMENT: Leaf,
  ECONOMY: TrendingUp,
  INFRASTRUCTURE: Building2,
  SAFETY: Shield,
  OTHER: MessageSquare,
}

type Step = 'details' | 'video' | 'submitting'

export default function CreateTopicPage() {
  const router = useRouter()
  const { country, config } = useCountry()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')

  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [showRecorder, setShowRecorder] = useState(false)
  const [wantsVideo, setWantsVideo] = useState(false)

  // UI state
  const [step, setStep] = useState<Step>('details')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Session management
  const [sessionToken, setSessionToken] = useState<string | null>(null)

  useEffect(() => {
    // Get or create session token
    const stored = localStorage.getItem('spillnova_session')
    if (stored) {
      setSessionToken(stored)
    } else {
      const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16)
      localStorage.setItem('spillnova_session', token)
      setSessionToken(token)
    }
  }, [])

  // Cleanup video preview URL on unmount
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl)
      }
    }
  }, [videoPreviewUrl])

  const handleVideoRecorded = (file: File) => {
    setVideoFile(file)
    const url = URL.createObjectURL(file)
    setVideoPreviewUrl(url)
    setShowRecorder(false)
  }

  const removeVideo = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl)
    }
    setVideoFile(null)
    setVideoPreviewUrl(null)
    setWantsVideo(false)
  }

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('Please enter a title for your discussion')
      return false
    }
    if (title.length > 200) {
      setError('Title is too long (max 200 characters)')
      return false
    }
    if (!description.trim()) {
      setError('Please enter a description')
      return false
    }
    if (description.length > 2000) {
      setError('Description is too long (max 2000 characters)')
      return false
    }
    if (!category) {
      setError('Please select a category')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    setError(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setStep('submitting')

    try {
      // Step 1: Create the topic
      setUploadProgress(10)
      const createRes = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          province: province || null,
          city: city || null,
          country,
          sessionToken,
        }),
      })

      const createData = await createRes.json()

      if (!createData.success) {
        throw new Error(createData.error || 'Failed to create topic')
      }

      const topicId = createData.data.topic.publicId
      const newSessionToken = createData.data.sessionToken

      // Update session token if server provided a new one
      if (newSessionToken && newSessionToken !== sessionToken) {
        localStorage.setItem('spillnova_session', newSessionToken)
        setSessionToken(newSessionToken)
      }

      setUploadProgress(30)

      // Step 2: Upload intro video if present
      if (videoFile) {
        setUploadProgress(40)

        const formData = new FormData()
        formData.append('file', videoFile)
        formData.append('sessionToken', newSessionToken || sessionToken || '')

        const uploadRes = await fetch(`/api/discussions/${topicId}/media`, {
          method: 'POST',
          body: formData,
        })

        const uploadData = await uploadRes.json()

        if (!uploadData.success) {
          console.error('Video upload failed:', uploadData.error)
          // Continue anyway - topic is created, video is optional
        }

        setUploadProgress(90)
      }

      setUploadProgress(100)

      // Redirect to the new topic
      router.push(`/${country}/discussions/${topicId}`)
    } catch (err) {
      console.error('Error creating topic:', err)
      setError(err instanceof Error ? err.message : 'Failed to create topic')
      setStep('details')
      setIsSubmitting(false)
    }
  }

  if (showRecorder) {
    return (
      <div className="min-h-screen bg-ink-900">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-6">
            <button
              onClick={() => setShowRecorder(false)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to form
            </button>
          </div>

          <div className="bg-ink-800 rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Record Intro Video</h2>
            <p className="text-gray-400 mb-6">
              Record a short video explaining your topic. This helps others understand your issue better.
            </p>
            <VideoRecorder
              onRecordingComplete={handleVideoRecorded}
              onCancel={() => setShowRecorder(false)}
              maxDuration={180}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-900">
      {/* Header */}
      <section className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href={`/${country}/discussions`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Discussions
          </Link>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <MessageSquare className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Start a Discussion</h1>
              <p className="text-gray-400">Share an issue that matters to your community</p>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {step === 'submitting' ? (
            <div className="bg-ink-800 rounded-xl p-8 border border-white/10 text-center">
              <Loader2 className="h-12 w-12 text-primary-400 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Creating Your Discussion</h2>
              <p className="text-gray-400 mb-6">
                {uploadProgress < 30 ? 'Creating topic...' :
                 uploadProgress < 90 ? 'Uploading video...' :
                 'Finalizing...'}
              </p>
              <div className="w-full bg-ink-700 rounded-full h-2 max-w-xs mx-auto">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Error Alert */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Title */}
              <div className="bg-ink-800 rounded-xl p-6 border border-white/10">
                <label className="block text-white font-medium mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What issue do you want to discuss?"
                  className="w-full px-4 py-3 bg-ink-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                  maxLength={200}
                />
                <p className="text-gray-500 text-sm mt-2">{title.length}/200 characters</p>
              </div>

              {/* Description */}
              <div className="bg-ink-800 rounded-xl p-6 border border-white/10">
                <label className="block text-white font-medium mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain the issue in detail. What's happening? Why does it matter? What do you think should be done?"
                  rows={6}
                  className="w-full px-4 py-3 bg-ink-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 resize-none"
                  maxLength={2000}
                />
                <p className="text-gray-500 text-sm mt-2">{description.length}/2000 characters</p>
              </div>

              {/* Category */}
              <div className="bg-ink-800 rounded-xl p-6 border border-white/10">
                <label className="block text-white font-medium mb-4">
                  Category <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {DISCUSSION_CATEGORIES.map((cat) => {
                    const Icon = categoryIcons[cat.slug] || MessageSquare
                    const isSelected = category === cat.slug
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => setCategory(cat.slug)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                            : 'bg-ink-700 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-medium text-center">{cat.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Location (Optional) */}
              <div className="bg-ink-800 rounded-xl p-6 border border-white/10">
                <label className="block text-white font-medium mb-2">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  Location <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <p className="text-gray-400 text-sm mb-4">
                  Add location to help others in your area find this discussion
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Province/State</label>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full px-4 py-3 bg-ink-700 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                    >
                      <option value="">Select province</option>
                      {config.provinces?.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">City/Town</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g., Johannesburg"
                      className="w-full px-4 py-3 bg-ink-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Intro Video (Optional) */}
              <div className="bg-ink-800 rounded-xl p-6 border border-white/10">
                <label className="block text-white font-medium mb-2">
                  <Video className="h-4 w-4 inline mr-2" />
                  Intro Video <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <p className="text-gray-400 text-sm mb-4">
                  Record a video explaining your topic. Adds authenticity and helps engage others.
                </p>

                {videoFile && videoPreviewUrl ? (
                  <div className="relative">
                    <video
                      src={videoPreviewUrl}
                      controls
                      className="w-full rounded-lg bg-black max-h-64"
                    />
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute top-2 right-2 p-2 bg-black/70 rounded-full text-white hover:bg-black transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2 mt-3 text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Video ready ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                    </div>
                  </div>
                ) : wantsVideo ? (
                  <div className="text-center py-8 bg-ink-700 rounded-lg border-2 border-dashed border-white/20">
                    <Video className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <button
                      type="button"
                      onClick={() => setShowRecorder(true)}
                      className="px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
                    >
                      Start Recording
                    </button>
                    <button
                      type="button"
                      onClick={() => setWantsVideo(false)}
                      className="block mx-auto mt-3 text-gray-400 hover:text-white text-sm"
                    >
                      Skip video
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setWantsVideo(true)}
                    className="w-full py-4 bg-ink-700 border-2 border-dashed border-white/20 rounded-lg text-gray-400 hover:border-amber-500/50 hover:text-amber-400 transition-all flex items-center justify-center gap-3"
                  >
                    <Video className="h-5 w-5" />
                    Add an intro video
                  </button>
                )}
              </div>

              {/* Submit */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/${country}/discussions`}
                  className="px-6 py-3 bg-ink-700 text-white rounded-lg font-medium hover:bg-ink-600 transition-colors text-center"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-5 w-5" />
                      Start Discussion
                    </>
                  )}
                </button>
              </div>

              {/* Guidelines */}
              <div className="bg-ink-800/50 rounded-xl p-6 border border-white/5">
                <h3 className="text-white font-medium mb-3">Community Guidelines</h3>
                <ul className="text-gray-400 text-sm space-y-2">
                  <li>• Be respectful and constructive in your discussions</li>
                  <li>• Focus on real issues that affect your community</li>
                  <li>• Provide accurate information and sources when possible</li>
                  <li>• Video responses must be camera-captured (no AI or pre-recorded content)</li>
                  <li>• Avoid personal attacks and hate speech</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
