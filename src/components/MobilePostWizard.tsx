'use client'

import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Send,
  Loader2,
  CheckCircle,
  Video,
  Camera,
  Lock,
  DollarSign,
  MapPin,
  Edit2,
  AlertTriangle,
  Car,
  Shield,
  Megaphone,
  Zap,
  Cloud,
  Users,
  MoreHorizontal,
  Swords,
  Ghost,
  Drama,
  Laugh,
  Music,
  PawPrint,
  Sparkles,
  Landmark,
  Heart,
  Upload,
  Bot,
} from 'lucide-react'

export type AiDisclosure = 'none' | 'unknown' | 'ai_enhanced' | 'ai_generated'
export type ContentSource = 'camera' | 'upload'

// Category type matching live page
interface Category {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface MobilePostWizardProps {
  selectedFiles: File[]
  onRequestVideo: () => void
  onRequestPhoto: () => void
  onRequestUpload: () => void
  onRemoveFile: (index: number) => void
  onSubmit: (data: {
    content: string
    category: string
    province: string
    city: string
    revenueShareEnabled: boolean
    revenueShareContact: string
    contentSource: ContentSource
    aiDisclosure: AiDisclosure | null
  }) => void
  onCancel: () => void
  categories: Category[]
  provinces: string[]
  displayName: string | null
  uploading: boolean
  creating: boolean
  contentSource: ContentSource
  aiDisclosure: AiDisclosure | null
}

const TOTAL_STEPS = 5

export function MobilePostWizard({
  selectedFiles,
  onRequestVideo,
  onRequestPhoto,
  onRequestUpload,
  onRemoveFile,
  contentSource,
  aiDisclosure,
  onSubmit,
  onCancel,
  categories,
  provinces,
  displayName,
  uploading,
  creating,
}: MobilePostWizardProps) {
  const [step, setStep] = useState(1)
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('OTHER')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [revenueShareEnabled, setRevenueShareEnabled] = useState(false)
  const [revenueShareContact, setRevenueShareContact] = useState('')

  const goNext = () => setStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
  const goBack = () => setStep((prev) => Math.max(prev - 1, 1))
  const goToStep = (s: number) => setStep(s)

  const handleSubmit = () => {
    onSubmit({
      content,
      category,
      province,
      city,
      revenueShareEnabled,
      revenueShareContact,
      contentSource,
      aiDisclosure,
    })
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return content.trim().length > 0
      case 2:
        return category !== ''
      case 3:
        return true // Location is optional
      case 4:
        return !revenueShareEnabled || revenueShareContact.trim().length > 0
      case 5:
        return content.trim().length > 0
      default:
        return true
    }
  }

  const getCategoryConfig = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId) || categories[categories.length - 1]
  }

  // Progress dots
  const ProgressIndicator = () => (
    <div className="flex items-center justify-center gap-2 py-3">
      {[1, 2, 3, 4, 5].map((s) => (
        <div
          key={s}
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            s <= step ? 'bg-primary-500' : 'bg-white/20'
          } ${s === step ? 'scale-125' : ''}`}
        />
      ))}
      <span className="ml-2 text-xs text-gray-400">
        Step {step}/{TOTAL_STEPS}
      </span>
    </div>
  )

  // Bottom navigation
  const BottomNav = ({
    showBack = true,
    showSkip = false,
    nextLabel = 'Next',
    onNext,
    disabled = false,
  }: {
    showBack?: boolean
    showSkip?: boolean
    nextLabel?: string
    onNext?: () => void
    disabled?: boolean
  }) => (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 p-4 safe-area-pb">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        {showBack && step > 1 && (
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1 px-4 py-3 bg-white/10 text-gray-300 rounded-xl hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>
        )}
        {showSkip && (
          <button
            type="button"
            onClick={goNext}
            className="px-4 py-3 text-gray-400 hover:text-white transition-colors"
          >
            Skip
          </button>
        )}
        <button
          type="button"
          onClick={onNext || goNext}
          disabled={disabled || !canProceed()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {nextLabel}
          {nextLabel === 'Next' && <ChevronRight className="h-5 w-5" />}
        </button>
      </div>
    </div>
  )

  // Step 1: Description
  const StepDescription = () => (
    <div className="flex flex-col h-full">
      {/* Media preview */}
      {selectedFiles.length > 0 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {selectedFiles.slice(0, 3).map((file, index) => (
                <div
                  key={index}
                  className="w-12 h-12 rounded-lg bg-black/30 overflow-hidden border-2 border-green-500/30"
                >
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-5 w-5 text-green-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} {contentSource === 'upload' ? 'uploaded' : 'captured'}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400">Tap to add more</p>
                {contentSource === 'upload' && aiDisclosure && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    aiDisclosure === 'none'
                      ? 'bg-green-500/20 text-green-400'
                      : aiDisclosure === 'unknown'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {aiDisclosure === 'none' ? 'Original' : aiDisclosure === 'unknown' ? 'May have AI' : 'AI'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onRequestVideo}
                className="p-2 bg-red-500/20 text-red-400 rounded-lg"
                aria-label="Record video"
              >
                <Video className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onRequestPhoto}
                className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"
                aria-label="Take photo"
              >
                <Camera className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onRequestUpload}
                className="p-2 bg-purple-500/20 text-purple-400 rounded-lg"
                aria-label="Upload file"
              >
                <Upload className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold text-white mb-2">What&apos;s happening?</h2>
      <p className="text-sm text-gray-400 mb-4">
        Describe the event or situation you&apos;re reporting
      </p>

      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe what's happening right now..."
          rows={6}
          maxLength={1000}
          autoFocus
          dir="ltr"
          className="w-full h-40 px-4 py-3 rounded-xl border border-white/20 bg-black/30 text-white placeholder-gray-400 text-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left"
        />
        <div className="text-right text-sm text-gray-400 mt-2">{content.length}/1000</div>
      </div>

      <BottomNav showBack={false} />
    </div>
  )

  // Step 2: Category
  const StepCategory = () => (
    <div className="flex flex-col h-full pb-24">
      <h2 className="text-xl font-semibold text-white mb-2">Choose a Category</h2>
      <p className="text-sm text-gray-400 mb-4">What type of content is this?</p>

      <div className="grid grid-cols-3 gap-2 overflow-y-auto flex-1">
        {categories.map((cat) => {
          const Icon = cat.icon
          const isSelected = category === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                isSelected
                  ? 'bg-primary-500/20 ring-2 ring-primary-500'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-1.5 ${cat.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                {cat.label}
              </span>
            </button>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )

  // Step 3: Location
  const StepLocation = () => (
    <div className="flex flex-col h-full pb-24">
      <h2 className="text-xl font-semibold text-white mb-2">Where is this happening?</h2>
      <p className="text-sm text-gray-400 mb-6">Help others find local news (optional)</p>

      <div className="space-y-4">
        <div>
          <label htmlFor="wizard-province" className="block text-sm font-medium text-gray-300 mb-2">Province/Region</label>
          <select
            id="wizard-province"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="w-full px-4 py-4 rounded-xl border border-white/20 bg-black/30 text-white text-lg appearance-none"
          >
            <option value="">Select Region</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="wizard-city" className="block text-sm font-medium text-gray-300 mb-2">City/Area (optional)</label>
          <input
            id="wizard-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g., Sandton, CBD, Township name"
            dir="ltr"
            className="w-full px-4 py-4 rounded-xl border border-white/20 bg-black/30 text-white placeholder-gray-400 text-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left"
          />
        </div>
      </div>

      <BottomNav showSkip={true} />
    </div>
  )

  // Step 4: Revenue Sharing
  const StepRevenue = () => (
    <div className="flex flex-col h-full pb-24">
      <h2 className="text-xl font-semibold text-white mb-2">Revenue Sharing</h2>
      <p className="text-sm text-gray-400 mb-6">
        Choose how you want to handle earnings from your content
      </p>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setRevenueShareEnabled(false)}
          className={`w-full p-4 rounded-xl text-left transition-all ${
            !revenueShareEnabled
              ? 'bg-primary-500/20 ring-2 ring-primary-500'
              : 'bg-white/5 hover:bg-white/10'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              <Lock className="h-6 w-6 text-primary-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Stay Anonymous</h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Your identity stays private. Platform keeps any revenue.
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setRevenueShareEnabled(true)}
          className={`w-full p-4 rounded-xl text-left transition-all ${
            revenueShareEnabled
              ? 'bg-amber-500/20 ring-2 ring-amber-500'
              : 'bg-white/5 hover:bg-white/10'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Share Revenue 50/50</h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Get paid if your content gets purchased. We&apos;ll contact you.
              </p>
            </div>
          </div>
        </button>

        {revenueShareEnabled && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contact Email or Phone
            </label>
            <input
              type="text"
              value={revenueShareContact}
              onChange={(e) => setRevenueShareContact(e.target.value)}
              placeholder="email@example.com or 0821234567"
              dir="ltr"
              className="w-full px-4 py-4 rounded-xl border border-amber-500/30 bg-black/30 text-white placeholder-gray-400 text-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-left"
            />
            <p className="text-xs text-amber-400 mt-2">
              We&apos;ll only contact you about payments for your content
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )

  // Step 5: Review
  const StepReview = () => {
    const catConfig = getCategoryConfig(category)
    const CatIcon = catConfig.icon

    return (
      <div className="flex flex-col h-full pb-24">
        <h2 className="text-xl font-semibold text-white mb-2">Review Your Post</h2>
        <p className="text-sm text-gray-400 mb-4">Make sure everything looks good</p>

        <div className="space-y-4 flex-1">
          {/* Media preview */}
          {selectedFiles.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-lg bg-black/30 overflow-hidden">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black/50">
                        <Video className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveFile(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Description</span>
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="text-xs text-primary-400 flex items-center gap-1"
              >
                <Edit2 className="h-3 w-3" />
                Edit
              </button>
            </div>
            <p className="text-white">{content || 'No description'}</p>
          </div>

          {/* Category */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Category</span>
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="text-xs text-primary-400 flex items-center gap-1"
              >
                <Edit2 className="h-3 w-3" />
                Edit
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${catConfig.color}`}>
                <CatIcon className="h-4 w-4" />
              </div>
              <span className="text-white font-medium">{catConfig.label}</span>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Location</span>
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="text-xs text-primary-400 flex items-center gap-1"
              >
                <Edit2 className="h-3 w-3" />
                Edit
              </button>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-white">
                {province && city
                  ? `${city}, ${province}`
                  : province
                  ? province
                  : 'Not specified'}
              </span>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Revenue</span>
              <button
                type="button"
                onClick={() => goToStep(4)}
                className="text-xs text-primary-400 flex items-center gap-1"
              >
                <Edit2 className="h-3 w-3" />
                Edit
              </button>
            </div>
            <div className="flex items-center gap-2">
              {revenueShareEnabled ? (
                <>
                  <DollarSign className="h-4 w-4 text-amber-400" />
                  <span className="text-white">50/50 Revenue Share</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 text-gray-400" />
                  <span className="text-white">Anonymous (no revenue)</span>
                </>
              )}
            </div>
          </div>

          {/* Posting as */}
          <div className="text-center text-sm text-gray-400 pt-2">
            {displayName ? `Posting as ${displayName}` : "You'll get an anonymous reporter name"}
          </div>
        </div>

        {/* Submit buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 p-4 safe-area-pb">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-3 bg-white/10 text-gray-300 rounded-xl hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!content.trim() || uploading || creating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              {uploading || creating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {uploading ? 'Uploading...' : 'Posting...'}
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Post Live
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div dir="ltr" className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        <ProgressIndicator />
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {step === 1 && <StepDescription />}
        {step === 2 && <StepCategory />}
        {step === 3 && <StepLocation />}
        {step === 4 && <StepRevenue />}
        {step === 5 && <StepReview />}
      </div>
    </div>
  )
}
