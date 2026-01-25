'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { FileText, MessageSquare, Eye, ThumbsUp, Calendar, MapPin, Building2, ExternalLink } from 'lucide-react'

interface EmbedData {
  publicId: string
  title: string
  excerpt: string
  category: string
  province: string | null
  organization: string | null
  credibility: number
  hasEvidence: boolean
  messageCount: number
  viewCount: number
  createdAt: string
}

export default function EmbedPage() {
  const params = useParams<{ publicId: string }>()
  const [data, setData] = useState<EmbedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!params.publicId) return

    fetch(`/api/embed/${params.publicId}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || 'Failed to load')
        }
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }, [params.publicId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200 text-center text-gray-500 text-sm">
        Unable to load leak
      </div>
    )
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://spillnova.com'

  return (
    <div className="font-sans bg-white rounded-lg border border-gray-200 overflow-hidden max-w-md">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#007749] to-[#005535] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-white font-semibold text-sm">SpillNova</span>
        </div>
        <a
          href={`${baseUrl}/za/live/${data.publicId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/80 hover:text-white text-xs flex items-center gap-1"
        >
          View Content
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#007749]/10 text-[#007749]">
            {data.category}
          </span>
          {data.hasEvidence && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <FileText className="h-3 w-3 mr-1" />
              Evidence
            </span>
          )}
          {data.credibility !== 0 && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              data.credibility > 0
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              <ThumbsUp className={`h-3 w-3 mr-1 ${data.credibility < 0 ? 'rotate-180' : ''}`} />
              {data.credibility > 0 ? '+' : ''}{data.credibility}
            </span>
          )}
        </div>

        {/* Title */}
        <a
          href={`${baseUrl}/za/live/${data.publicId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <h3 className="font-semibold text-gray-900 hover:text-[#007749] transition-colors line-clamp-2 mb-2">
            {data.title}
          </h3>
        </a>

        {/* Excerpt */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {data.excerpt}
        </p>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(data.createdAt)}
          </span>
          {data.province && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {data.province}
            </span>
          )}
          {data.organization && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {data.organization}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {data.viewCount} views
          </span>
          {data.messageCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {data.messageCount} messages
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-2 text-center">
        <a
          href={baseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-[#007749]"
        >
          Powered by SpillNova - Anonymous Whistleblowing Platform
        </a>
      </div>
    </div>
  )
}
