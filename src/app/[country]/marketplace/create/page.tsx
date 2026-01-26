'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowLeft,
  Camera,
  X,
  Loader2,
  Plus,
  Car,
  Home,
  Smartphone,
  Sofa,
  Shirt,
  Briefcase,
  Wrench,
  PawPrint,
  Dumbbell,
  Baby,
  Flower,
  Package,
  AlertCircle,
  CheckCircle,
  ImagePlus,
} from 'lucide-react'
import { useCountry } from '@/lib/country-context'

// Categories
const CATEGORIES = [
  { id: 'vehicles', label: 'Vehicles', icon: Car, color: 'bg-blue-500' },
  { id: 'property', label: 'Property', icon: Home, color: 'bg-green-500' },
  { id: 'electronics', label: 'Electronics', icon: Smartphone, color: 'bg-purple-500' },
  { id: 'furniture', label: 'Furniture', icon: Sofa, color: 'bg-amber-500' },
  { id: 'clothing', label: 'Clothing', icon: Shirt, color: 'bg-pink-500' },
  { id: 'jobs', label: 'Jobs', icon: Briefcase, color: 'bg-cyan-500' },
  { id: 'services', label: 'Services', icon: Wrench, color: 'bg-orange-500' },
  { id: 'pets', label: 'Pets', icon: PawPrint, color: 'bg-red-500' },
  { id: 'sports', label: 'Sports', icon: Dumbbell, color: 'bg-indigo-500' },
  { id: 'kids', label: 'Kids & Baby', icon: Baby, color: 'bg-rose-500' },
  { id: 'garden', label: 'Garden', icon: Flower, color: 'bg-emerald-500' },
  { id: 'other', label: 'Other', icon: Package, color: 'bg-gray-500' },
]

const CONDITIONS = [
  { id: 'new', label: 'New', description: 'Brand new, unused' },
  { id: 'like_new', label: 'Like New', description: 'Used but in excellent condition' },
  { id: 'good', label: 'Good', description: 'Normal wear and tear' },
  { id: 'fair', label: 'Fair', description: 'Some visible wear' },
  { id: 'poor', label: 'Poor', description: 'Needs repair or has damage' },
]

const CURRENCY_SYMBOLS: Record<string, string> = {
  sa: 'R',
  ng: '₦',
  ke: 'KSh',
  gh: 'GH₵',
  us: '$',
  uk: '£',
}

interface ImageFile {
  file: File
  preview: string
  uploading: boolean
  uploaded: boolean
  url?: string
  key?: string
  error?: string
}

export default function CreateListingPage() {
  const router = useRouter()
  const { country, config } = useCountry()
  const PROVINCES = config.provinces || []
  const currencySymbol = CURRENCY_SYMBOLS[country] || 'R'

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [images, setImages] = useState<ImageFile[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('good')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [sellerName, setSellerName] = useState('')
  const [sellerPhone, setSellerPhone] = useState('')

  // UI state
  const [step, setStep] = useState(1) // 1: Images, 2: Details, 3: Location & Contact
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Device ID
  const [deviceId, setDeviceId] = useState<string | null>(null)

  // Initialize device ID
  useEffect(() => {
    let id = localStorage.getItem('marketplace_device_id')
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 15)
      localStorage.setItem('marketplace_device_id', id)
    }
    setDeviceId(id)

    // Load saved seller info
    const savedName = localStorage.getItem('marketplace_seller_name')
    const savedPhone = localStorage.getItem('marketplace_seller_phone')
    if (savedName) setSellerName(savedName)
    if (savedPhone) setSellerPhone(savedPhone)
  }, [])

  // Handle image selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: ImageFile[] = []
    for (let i = 0; i < Math.min(files.length, 10 - images.length); i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue

      const preview = URL.createObjectURL(file)
      newImages.push({
        file,
        preview,
        uploading: false,
        uploaded: false,
      })
    }

    setImages(prev => [...prev, ...newImages])

    // Upload images
    for (const img of newImages) {
      uploadImage(img)
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Upload single image
  const uploadImage = async (imageFile: ImageFile) => {
    setImages(prev =>
      prev.map(img =>
        img.preview === imageFile.preview ? { ...img, uploading: true } : img
      )
    )

    try {
      const formData = new FormData()
      formData.append('file', imageFile.file)
      formData.append('type', 'marketplace')

      const res = await fetch('/api/live/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.success) {
        setImages(prev =>
          prev.map(img =>
            img.preview === imageFile.preview
              ? {
                  ...img,
                  uploading: false,
                  uploaded: true,
                  url: data.url,
                  key: data.key,
                }
              : img
          )
        )
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (err) {
      setImages(prev =>
        prev.map(img =>
          img.preview === imageFile.preview
            ? {
                ...img,
                uploading: false,
                error: err instanceof Error ? err.message : 'Upload failed',
              }
            : img
        )
      )
    }
  }

  // Remove image
  const removeImage = (preview: string) => {
    setImages(prev => {
      const img = prev.find(i => i.preview === preview)
      if (img) {
        URL.revokeObjectURL(img.preview)
      }
      return prev.filter(i => i.preview !== preview)
    })
  }

  // Validate step
  const canProceed = () => {
    switch (step) {
      case 1:
        return images.length > 0 && images.some(i => i.uploaded)
      case 2:
        return title.trim() && description.trim() && price && category && condition
      case 3:
        return true // Province is optional
      default:
        return false
    }
  }

  // Submit listing
  const handleSubmit = async () => {
    if (submitting) return

    // Save seller info for next time
    if (sellerName) localStorage.setItem('marketplace_seller_name', sellerName)
    if (sellerPhone) localStorage.setItem('marketplace_seller_phone', sellerPhone)

    setSubmitting(true)
    setError('')

    try {
      const uploadedImages = images
        .filter(img => img.uploaded && img.url && img.key)
        .map(img => ({ url: img.url!, key: img.key! }))

      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price: parseFloat(price),
          category,
          condition,
          province: province || null,
          city: city.trim() || null,
          sellerName: sellerName.trim() || null,
          sellerPhone: sellerPhone.trim() || null,
          deviceId,
          country,
          images: uploadedImages,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/${country}/marketplace/${data.data.publicId}`)
        }, 1500)
      } else {
        setError(data.error || 'Failed to create listing')
      }
    } catch {
      setError('Failed to create listing. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Render step content
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Add Photos</h2>
            <p className="text-gray-400 text-sm">
              Add up to 10 photos. The first image will be the cover.
            </p>

            {/* Image grid */}
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, idx) => (
                <div key={img.preview} className="aspect-square relative rounded-xl overflow-hidden bg-gray-800">
                  <Image
                    src={img.preview}
                    alt={`Image ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                  {img.uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                  {img.uploaded && (
                    <div className="absolute top-2 left-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                  {img.error && (
                    <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-red-400" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(img.preview)}
                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {idx === 0 && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded">
                      Cover
                    </div>
                  )}
                </div>
              ))}

              {images.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-green-500 hover:text-green-500 transition-colors"
                >
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-xs">Add Photo</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Listing Details</h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you selling?"
                maxLength={200}
                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-black/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <div className="text-xs text-gray-400 text-right mt-1">{title.length}/200</div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/20 bg-black/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {CATEGORIES.map(cat => {
                  const CatIcon = cat.icon
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                        category === cat.id
                          ? `${cat.color} text-white ring-2 ring-white/50`
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      <CatIcon className="h-6 w-6" />
                      <span className="text-xs font-medium">{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Condition</label>
              <div className="space-y-2">
                {CONDITIONS.map(cond => (
                  <button
                    key={cond.id}
                    type="button"
                    onClick={() => setCondition(cond.id)}
                    className={`w-full p-3 rounded-xl flex items-center justify-between transition-all ${
                      condition === cond.id
                        ? 'bg-green-500/20 border-2 border-green-500 text-white'
                        : 'bg-white/10 border-2 border-transparent text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    <span className="font-medium">{cond.label}</span>
                    <span className="text-sm text-gray-400">{cond.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your item in detail..."
                rows={4}
                maxLength={5000}
                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-black/30 text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <div className="text-xs text-gray-400 text-right mt-1">{description.length}/5000</div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Location & Contact</h2>

            {/* Province */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Province/Region</label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-black/30 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                title="Select province"
              >
                <option value="">Select region (optional)</option>
                {PROVINCES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">City/Area</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Sandton, CBD (optional)"
                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-black/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <hr className="border-white/10" />

            <h3 className="text-lg font-medium text-white">Your Contact Info</h3>
            <p className="text-gray-400 text-sm">
              Your phone number helps buyers verify the listing is real. It will be partially hidden.
            </p>

            {/* Seller Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-black/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Seller Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
              <input
                type="tel"
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                placeholder="e.g., 0821234567 (optional)"
                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-black/30 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Only the first 4 and last 2 digits will be shown to buyers.
              </p>
            </div>
          </div>
        )
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white p-4">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-bold">Listing Created!</h2>
        <p className="text-gray-400">Redirecting to your listing...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => step > 1 ? setStep(step - 1) : router.back()}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`w-8 h-1 rounded-full transition-colors ${
                  s <= step ? 'bg-green-500' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {renderStep()}

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex-1 py-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-medium"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !canProceed()}
              className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Post Listing'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
