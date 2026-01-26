'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Upload,
  X,
  Check,
  AlertTriangle,
  FileVideo,
  Image as ImageIcon,
  Bot,
  Shield,
  Ban
} from 'lucide-react'

export type AiDisclosure = 'none' | 'unknown' | 'ai_enhanced' | 'ai_generated'

interface VideoUploaderProps {
  onUploadComplete: (file: File, aiDisclosure: AiDisclosure) => void
  onCancel: () => void
  acceptTypes?: string // e.g., "video/*,image/*"
  maxSizeMB?: number
}

export function VideoUploader({
  onUploadComplete,
  onCancel,
  acceptTypes = "video/*,image/*",
  maxSizeMB = 100
}: VideoUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [aiDisclosure, setAiDisclosure] = useState<AiDisclosure | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'select' | 'disclosure' | 'confirm'>('select')
  const [hasAgreedToPolicy, setHasAgreedToPolicy] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > maxSizeMB) {
      setError(`File too large. Maximum size is ${maxSizeMB}MB.`)
      return
    }

    // Validate file type
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) {
      setError('Please select a video or image file.')
      return
    }

    setError(null)
    setSelectedFile(file)

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    // Move to AI disclosure step
    setStep('disclosure')
  }, [maxSizeMB])

  const handleDisclosureSelect = (disclosure: AiDisclosure) => {
    setAiDisclosure(disclosure)
    setStep('confirm')
  }

  const handleConfirm = () => {
    if (!selectedFile || !aiDisclosure) return
    onUploadComplete(selectedFile, aiDisclosure)
  }

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    onCancel()
  }

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('disclosure')
    } else if (step === 'disclosure') {
      setStep('select')
      setSelectedFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    }
  }

  const isVideo = selectedFile?.type.startsWith('video/')

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {step === 'select' && 'Upload Content'}
          {step === 'disclosure' && 'AI Disclosure'}
          {step === 'confirm' && 'Confirm Upload'}
        </h3>
        <button
          type="button"
          onClick={handleCancel}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4">
        {/* Step 1: File Selection */}
        {step === 'select' && (
          <div className="space-y-4">
            {/* Warning Banner */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-200">
                  <p className="font-semibold mb-1">Content Policy</p>
                  <p className="text-amber-200/80">
                    Uploaded content must be original. AI-generated content is only allowed
                    in designated categories. <strong>Misrepresenting AI content as real footage
                    will result in permanent account suspension.</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-green-500/50 hover:bg-green-500/5 transition-colors"
            >
              <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">
                Tap to select a video or image
              </p>
              <p className="text-sm text-gray-500">
                Max {maxSizeMB}MB. Supported: MP4, MOV, JPG, PNG
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={acceptTypes}
              onChange={handleFileSelect}
              className="hidden"
            />

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Step 2: AI Disclosure */}
        {step === 'disclosure' && (
          <div className="space-y-4">
            {/* Preview */}
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
              {isVideo ? (
                <video
                  src={previewUrl || ''}
                  className="w-full h-full object-contain"
                  controls
                />
              ) : (
                <img
                  src={previewUrl || ''}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              )}
              <div className="absolute top-2 left-2 flex items-center gap-2 px-2 py-1 bg-black/70 rounded-lg">
                {isVideo ? (
                  <FileVideo className="h-4 w-4 text-blue-400" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-green-400" />
                )}
                <span className="text-xs text-white">{selectedFile?.name}</span>
              </div>
            </div>

            {/* AI Disclosure Question */}
            <div className="space-y-3">
              <p className="text-white font-medium">
                Is this content AI-generated or AI-enhanced?
              </p>
              <p className="text-sm text-gray-400">
                Please answer honestly. Misrepresentation may result in account suspension.
              </p>

              <div className="grid gap-2">
                {/* No AI */}
                <button
                  type="button"
                  onClick={() => handleDisclosureSelect('none')}
                  className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-left hover:bg-green-500/20 transition-colors"
                >
                  <Shield className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="text-white font-medium">Original Content</p>
                    <p className="text-sm text-gray-400">
                      No AI was used - this is unedited, authentic footage
                    </p>
                  </div>
                </button>

                {/* Unknown */}
                <button
                  type="button"
                  onClick={() => handleDisclosureSelect('unknown')}
                  className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left hover:bg-amber-500/20 transition-colors"
                >
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                  <div>
                    <p className="text-white font-medium">I'm Not Sure</p>
                    <p className="text-sm text-gray-400">
                      Unsure if AI tools were used in creation or editing
                    </p>
                  </div>
                </button>

                {/* AI Enhanced */}
                <button
                  type="button"
                  onClick={() => handleDisclosureSelect('ai_enhanced')}
                  className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-left hover:bg-blue-500/20 transition-colors"
                >
                  <Bot className="h-6 w-6 text-blue-500" />
                  <div>
                    <p className="text-white font-medium">AI Enhanced</p>
                    <p className="text-sm text-gray-400">
                      Real footage that was enhanced or edited using AI tools
                    </p>
                  </div>
                </button>

                {/* AI Generated */}
                <button
                  type="button"
                  onClick={() => handleDisclosureSelect('ai_generated')}
                  className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-left hover:bg-purple-500/20 transition-colors"
                >
                  <Bot className="h-6 w-6 text-purple-500" />
                  <div>
                    <p className="text-white font-medium">AI Generated</p>
                    <p className="text-sm text-gray-400">
                      Content created entirely or mostly by AI
                    </p>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={handleBack}
                className="w-full py-2 text-gray-400 hover:text-white transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-4 bg-white/5 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                {isVideo ? (
                  <FileVideo className="h-8 w-8 text-blue-400" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-green-400" />
                )}
                <div>
                  <p className="text-white font-medium truncate">{selectedFile?.name}</p>
                  <p className="text-sm text-gray-400">
                    {(selectedFile?.size || 0 / (1024 * 1024)).toFixed(1)}MB
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-3">
                <p className="text-sm text-gray-400 mb-1">AI Disclosure:</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  aiDisclosure === 'none'
                    ? 'bg-green-500/20 text-green-400'
                    : aiDisclosure === 'unknown'
                    ? 'bg-amber-500/20 text-amber-400'
                    : aiDisclosure === 'ai_enhanced'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {aiDisclosure === 'none' && <Shield className="h-4 w-4" />}
                  {aiDisclosure === 'unknown' && <AlertTriangle className="h-4 w-4" />}
                  {(aiDisclosure === 'ai_enhanced' || aiDisclosure === 'ai_generated') && <Bot className="h-4 w-4" />}
                  <span className="text-sm font-medium">
                    {aiDisclosure === 'none' && 'Original Content'}
                    {aiDisclosure === 'unknown' && 'May Contain AI'}
                    {aiDisclosure === 'ai_enhanced' && 'AI Enhanced'}
                    {aiDisclosure === 'ai_generated' && 'AI Generated'}
                  </span>
                </div>
              </div>
            </div>

            {/* Category Warning for AI content */}
            {(aiDisclosure === 'ai_enhanced' || aiDisclosure === 'ai_generated') && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <div className="flex gap-3">
                  <Ban className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-200">
                    <p className="font-semibold mb-1">Category Restrictions</p>
                    <p>
                      AI content is <strong>NOT allowed</strong> in Breaking News, Traffic, Crime,
                      or other news categories. AI content posted in these categories will be
                      removed and your account will be suspended.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Policy Agreement */}
            <label className="flex items-start gap-3 p-3 bg-white/5 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={hasAgreedToPolicy}
                onChange={(e) => setHasAgreedToPolicy(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500"
              />
              <span className="text-sm text-gray-300">
                I confirm this content complies with the platform's content policy.
                I understand that <strong>misrepresenting AI content as authentic footage
                will result in permanent account suspension</strong>.
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!hasAgreedToPolicy}
                className="flex-1 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="h-5 w-5" />
                Upload
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
