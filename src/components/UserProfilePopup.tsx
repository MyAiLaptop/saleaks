'use client'

import { useState, useEffect } from 'react'
import { X, MapPin, ChevronRight, Loader2 } from 'lucide-react'

interface Question {
  id: string
  question: string
  type: 'select' | 'select_with_input'
  options: string[]
  placeholder?: string
}

interface UserProfilePopupProps {
  onClose?: () => void
}

export default function UserProfilePopup({ onClose }: UserProfilePopupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [question, setQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [customInput, setCustomInput] = useState('')
  const [deviceId, setDeviceId] = useState<string>('')
  const [showThankYou, setShowThankYou] = useState(false)

  useEffect(() => {
    // Generate or retrieve device ID
    let storedDeviceId = localStorage.getItem('sp_device_id')
    if (!storedDeviceId) {
      storedDeviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      localStorage.setItem('sp_device_id', storedDeviceId)
    }
    setDeviceId(storedDeviceId)

    // Check if we should show a question
    checkForQuestion(storedDeviceId)
  }, [])

  async function checkForQuestion(devId: string) {
    try {
      const res = await fetch(`/api/user-profile?deviceId=${encodeURIComponent(devId)}`)
      const data = await res.json()

      if (data.success && data.data.nextQuestion) {
        setQuestion(data.data.nextQuestion)
        // Small delay before showing popup for better UX
        setTimeout(() => {
          setIsOpen(true)
        }, 2000)
      }
    } catch (err) {
      console.error('Failed to check for profile question:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!question) return

    const answer = question.type === 'select_with_input' && customInput
      ? customInput
      : selectedAnswer

    if (!answer) return

    setSubmitting(true)

    try {
      const res = await fetch('/api/user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          questionId: question.id,
          answer,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setShowThankYou(true)
        setTimeout(() => {
          handleClose()
        }, 2000)
      }
    } catch (err) {
      console.error('Failed to save answer:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSkip() {
    try {
      await fetch('/api/user-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          action: 'skip',
        }),
      })
    } catch (err) {
      console.error('Failed to skip question:', err)
    }
    handleClose()
  }

  async function handleDismiss() {
    try {
      await fetch('/api/user-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          action: 'dismiss',
        }),
      })
    } catch (err) {
      console.error('Failed to dismiss:', err)
    }
    handleClose()
  }

  function handleClose() {
    setIsOpen(false)
    onClose?.()
  }

  // Don't render anything while loading or if no question
  if (loading || !isOpen || !question) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-primary-400">
            <MapPin className="w-5 h-5" />
            <span className="font-medium">Quick Question</span>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {showThankYou ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Thank you!</h3>
              <p className="text-gray-400 text-sm">
                This helps us show you more relevant local businesses.
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-white mb-2">
                {question.question}
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                This helps us show you relevant local businesses and services.
              </p>

              {/* Options */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {question.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSelectedAnswer(option)
                      setCustomInput('')
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                      selectedAnswer === option
                        ? 'border-primary-500 bg-primary-600/20 text-white'
                        : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {/* Custom input for select_with_input type */}
              {question.type === 'select_with_input' && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => {
                      setCustomInput(e.target.value)
                      setSelectedAnswer('')
                    }}
                    placeholder={question.placeholder || 'Or type your answer...'}
                    className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!showThankYou && (
          <div className="flex gap-3 p-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 py-3 text-gray-400 hover:text-white transition-colors text-sm"
            >
              Ask me later
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={(!selectedAnswer && !customInput) || submitting}
              className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
