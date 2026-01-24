'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Shield,
  Upload,
  X,
  Check,
  Copy,
  Loader2,
  DollarSign,
  Lock,
  Camera,
} from 'lucide-react'
import { SA_PROVINCES } from '@/lib/sanitize'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
}

export default function UploadPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [contactToken, setContactToken] = useState('')
  const [tokenCopied, setTokenCopied] = useState(false)
  const [publicId, setPublicId] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [organization, setOrganization] = useState('')
  const [enableContact, setEnableContact] = useState(true)
  const [files, setFiles] = useState<File[]>([])

  // Revenue sharing state
  const [revenueShareEnabled, setRevenueShareEnabled] = useState(false)
  const [revenueShareContact, setRevenueShareContact] = useState('')

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.data)
        }
      })
      .catch(console.error)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...selectedFiles].slice(0, 10))
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const copyToken = async () => {
    await navigator.clipboard.writeText(contactToken)
    setTokenCopied(true)
    setTimeout(() => setTokenCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create the post
      const postRes = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          categoryId,
          province: province || undefined,
          city: city || undefined,
          organization: organization || undefined,
          enableContact,
          revenueShareEnabled,
          revenueShareContact: revenueShareEnabled ? revenueShareContact : undefined,
        }),
      })

      const postData = await postRes.json()

      if (!postData.success) {
        throw new Error(postData.error || 'Failed to create post')
      }

      const { post, contactToken: token } = postData.data
      setPublicId(post.publicId)

      if (token) {
        setContactToken(token)
      }

      // Upload files if any
      if (files.length > 0) {
        const formData = new FormData()
        files.forEach((file) => formData.append('files', file))

        await fetch(`/api/posts/${post.publicId}/files`, {
          method: 'POST',
          body: formData,
        })
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div
        className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png?v=2')" }}
      >
        <div className="bg-black/60 min-h-screen">
          <div className="max-w-2xl mx-auto px-4 py-16">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-white/10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                  <Check className="h-8 w-8 text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Content Uploaded Successfully
                </h1>
                <p className="text-gray-300">
                  Your content is now listed for sale.
                </p>
              </div>

              {/* Content ID - always show */}
              <div className="bg-black/30 rounded-lg p-4 mb-6 border border-white/10">
                <p className="text-sm text-gray-400 mb-2">Your Content ID:</p>
                <code className="text-lg font-mono font-bold text-white">{publicId}</code>
                <p className="text-xs text-gray-400 mt-1">
                  Use this ID along with your secret token to check messages.
                </p>
              </div>

              {contactToken && (
                <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-6 mb-6">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-200 mb-2">
                        Save Your Secret Token
                      </h3>
                      <p className="text-sm text-amber-300 mb-4">
                        This token is shown only once. Save it to check messages from buyers.
                        Without it, you cannot receive or read any responses.
                      </p>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 bg-black/30 px-4 py-2 rounded border border-amber-500/30 font-mono text-sm break-all text-white">
                          {contactToken}
                        </code>
                        <button
                          onClick={copyToken}
                          className="p-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
                          title="Copy token"
                        >
                          {tokenCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push(`/leak/${publicId}`)}
                  className="flex-1 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors font-medium"
                >
                  View Your Listing
                </button>
                <button
                  onClick={() => {
                    setSuccess(false)
                    setTitle('')
                    setContent('')
                    setCategoryId('')
                    setProvince('')
                    setCity('')
                    setOrganization('')
                    setFiles([])
                    setContactToken('')
                    setRevenueShareEnabled(false)
                    setRevenueShareContact('')
                  }}
                  className="flex-1 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-colors font-medium border border-white/20"
                >
                  Upload More
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://media.saleaks.co.za/global_back_ground.png?v=2')" }}
    >
      <div className="bg-black/60 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Security Notice */}
          <div className="bg-primary-500/20 border border-primary-500/30 rounded-lg p-4 mb-8">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-primary-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-primary-200">
                  Your Content is Protected
                </h3>
                <p className="text-sm text-primary-300 mt-1">
                  We verify authenticity and protect your content from unauthorized distribution.
                </p>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-8">
            Sell Your Content
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                title="Select a category"
                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={500}
                placeholder="Brief headline describing your content"
                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={8}
                maxLength={50000}
                placeholder="Describe your content in detail. Include context about what's shown, when and where it was captured, and why it's valuable. The more detail you provide, the more attractive it will be to buyers."
                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Province
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  title="Select province"
                  className="w-full px-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select province (optional)</option>
                  {SA_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  City/Town
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  maxLength={100}
                  placeholder="Optional"
                  className="w-full px-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Organization */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Subject/Topic
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                maxLength={200}
                placeholder="What or who is featured in this content? (optional)"
                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Content
              </label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 relative bg-black/20">
                <div className="text-center">
                  <Camera className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-300 mb-2">
                    Drag & drop files or click to browse
                  </p>
                  <p className="text-xs text-gray-400">
                    Images, videos, documents (max 50MB each, 10 files total)
                  </p>
                  <p className="text-xs text-green-400 mt-1">
                    All metadata will be automatically removed
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/*,application/pdf,video/*,.doc,.docx,.xls,.xlsx"
                  title="Upload your content files"
                  aria-label="Upload your content files"
                />

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-black/30 rounded px-3 py-2 border border-white/10"
                      >
                        <span className="text-sm text-gray-300 truncate">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                          title="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Enable Contact */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="enableContact"
                checked={enableContact}
                onChange={(e) => setEnableContact(e.target.checked)}
                className="mt-1 h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="enableContact" className="text-sm text-gray-300">
                <span className="font-medium text-white">Enable secure messaging</span>
                <br />
                <span className="text-gray-400">
                  Allow buyers to contact you. You&apos;ll receive a secret token
                  to check and respond to messages.
                </span>
              </label>
            </div>

            {/* Revenue Sharing Option */}
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">
                    Revenue Sharing (Optional)
                  </h3>
                  <p className="text-sm text-gray-300 mb-4">
                    Earn money when your content sells. Choose your preference below:
                  </p>

                  <div className="space-y-3">
                    {/* Stay Anonymous Option */}
                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      !revenueShareEnabled
                        ? 'border-primary-500 bg-primary-500/20'
                        : 'border-white/20 hover:border-white/30'
                    }`}>
                      <input
                        type="radio"
                        name="revenueShare"
                        checked={!revenueShareEnabled}
                        onChange={() => setRevenueShareEnabled(false)}
                        className="mt-1 h-4 w-4 text-primary-500 focus:ring-primary-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-primary-400" />
                          <span className="font-medium text-white">Stay Fully Anonymous</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5">
                          SpillNova keeps 100% of any revenue. Your identity remains completely protected.
                        </p>
                      </div>
                    </label>

                    {/* Revenue Share Option */}
                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      revenueShareEnabled
                        ? 'border-amber-500 bg-amber-500/20'
                        : 'border-white/20 hover:border-white/30'
                    }`}>
                      <input
                        type="radio"
                        name="revenueShare"
                        checked={revenueShareEnabled}
                        onChange={() => setRevenueShareEnabled(true)}
                        className="mt-1 h-4 w-4 text-amber-500 focus:ring-amber-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-amber-400" />
                          <span className="font-medium text-white">Share Revenue (50/50 Split)</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5">
                          SpillNova will contact you when your content generates revenue to arrange payment.
                        </p>
                      </div>
                    </label>

                    {/* Contact Details for Revenue Share */}
                    {revenueShareEnabled && (
                      <div className="mt-3 pl-7">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Contact Email or Phone *
                        </label>
                        <input
                          type="text"
                          value={revenueShareContact}
                          onChange={(e) => setRevenueShareContact(e.target.value)}
                          required={revenueShareEnabled}
                          placeholder="email@example.com or phone number"
                          className="w-full px-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-400">
                          This information is encrypted and only used to contact you regarding revenue payments.
                          It will never be shared publicly.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-300">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-6 py-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Upload & List for Sale
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
