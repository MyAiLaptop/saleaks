'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Building2,
  Upload,
  X,
  Plus,
  Phone,
  Mail,
  Globe,
  MapPin,
  Camera,
  Video,
  Image as ImageIcon,
  Loader2,
  Check,
  Info,
  Sparkles,
} from 'lucide-react'

const R2_PUBLIC_URL = 'https://media.saleaks.co.za'

const PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
]

const BUSINESS_CATEGORIES = [
  'Plumber',
  'Electrician',
  'Builder',
  'Painter',
  'Carpenter',
  'Locksmith',
  'Tow Truck',
  'Mechanic',
  'Solar Installer',
  'Security',
  'Cleaning',
  'Garden Service',
  'Pest Control',
  'Moving',
  'Legal Services',
  'Accounting',
  'Restaurant',
  'Retail',
  'Health & Beauty',
  'Auto Services',
  'IT Services',
  'Other',
]

interface GalleryItem {
  type: 'image' | 'video'
  path: string
  caption?: string
}

export default function CreateBusinessProfilePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const country = params.country as string
  const returnTo = searchParams.get('returnTo')

  // Auth state
  const [advertiserId, setAdvertiserId] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [introVideo, setIntroVideo] = useState<string | null>(null)
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [facebook, setFacebook] = useState('')
  const [instagram, setInstagram] = useState('')
  const [twitter, setTwitter] = useState('')
  const [tiktok, setTiktok] = useState('')

  // Upload states
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs for file inputs
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Check for stored session
    const storedAdvertiserId = localStorage.getItem('advertiserId')
    const storedSessionToken = localStorage.getItem('advertiserSessionToken')

    if (storedAdvertiserId && storedSessionToken) {
      setAdvertiserId(storedAdvertiserId)
      setSessionToken(storedSessionToken)
    }
    setLoading(false)
  }, [])

  function getMediaUrl(path: string | null): string {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    if (path.startsWith('/')) return path
    return `${R2_PUBLIC_URL}/${path}`
  }

  async function uploadMedia(file: File, mediaType: string): Promise<string | null> {
    const formData = new FormData()
    formData.append('advertiserId', advertiserId!)
    formData.append('sessionToken', sessionToken!)
    formData.append('mediaType', mediaType)
    formData.append('file', file)

    const res = await fetch('/api/advertiser/business/media', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    if (data.success) {
      return data.data.path
    }
    throw new Error(data.error || 'Upload failed')
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    setError(null)

    try {
      const path = await uploadMedia(file, 'logo')
      setLogo(path)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCover(true)
    setError(null)

    try {
      const path = await uploadMedia(file, 'cover')
      setCoverImage(path)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload cover image')
    } finally {
      setUploadingCover(false)
    }
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingVideo(true)
    setError(null)

    try {
      const path = await uploadMedia(file, 'introVideo')
      setIntroVideo(path)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload intro video')
    } finally {
      setUploadingVideo(false)
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (gallery.length + files.length > 20) {
      setError('Maximum 20 gallery items allowed')
      return
    }

    setUploadingGallery(true)
    setError(null)

    try {
      const newItems: GalleryItem[] = []

      for (const file of Array.from(files)) {
        const path = await uploadMedia(file, 'gallery')
        if (path) {
          const type = file.type.startsWith('video/') ? 'video' : 'image'
          newItems.push({ type, path })
        }
      }

      setGallery([...gallery, ...newItems])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload gallery items')
    } finally {
      setUploadingGallery(false)
    }
  }

  function removeGalleryItem(index: number) {
    setGallery(gallery.filter((_, i) => i !== index))
  }

  function toggleCategory(cat: string) {
    if (categories.includes(cat)) {
      setCategories(categories.filter((c) => c !== cat))
    } else if (categories.length < 5) {
      setCategories([...categories, cat])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      setError('Business name is required')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/advertiser/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advertiserId,
          sessionToken,
          name: name.trim(),
          description: description.trim() || null,
          logo,
          coverImage,
          introVideo,
          gallery: gallery.length > 0 ? gallery : null,
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          email: email.trim() || null,
          website: website.trim() || null,
          province: province || null,
          city: city.trim() || null,
          categories: categories.length > 0 ? categories : null,
          facebook: facebook.trim() || null,
          instagram: instagram.trim() || null,
          twitter: twitter.trim() || null,
          tiktok: tiktok.trim() || null,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to create business profile')
      }

      // Redirect back
      if (returnTo) {
        router.push(returnTo)
      } else {
        router.push(`/${country}/advertise`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business profile')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (!advertiserId || !sessionToken) {
    return (
      <div className="min-h-screen bg-black">
        <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link
              href={`/${country}/advertise`}
              className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold text-white">Create Business Profile</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Sign In Required</h2>
          <p className="text-gray-400 mb-6">
            Please sign in to your advertiser account to create a business profile.
          </p>
          <Link
            href={`/${country}/advertise`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
          >
            Go to Sign In
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={returnTo || `/${country}/advertise`}
            className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Create Business Profile</h1>
            <p className="text-xs text-gray-400">Set up your public business page</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-400 font-medium mb-1">Your Public Business Page</p>
              <p className="text-sm text-gray-400">
                When users click on your ads, they&apos;ll be directed to this page. Make it compelling
                with a great intro video, photos of your work, and clear contact information!
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-400" />
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ABC Plumbing Services"
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell potential customers about your business, services, experience..."
                  rows={4}
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Business Categories (up to 5)
                </label>
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        categories.includes(cat)
                          ? 'bg-primary-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Logo & Cover */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary-400" />
              Logo & Cover Image
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Logo</label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                {logo ? (
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-800">
                    <Image
                      src={getMediaUrl(logo)}
                      alt="Logo"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setLogo(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="w-full aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:border-primary-500 hover:text-primary-400 transition-colors"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8" />
                        <span className="text-sm">Upload Logo</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cover Image
                </label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                {coverImage ? (
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-800">
                    <Image
                      src={getMediaUrl(coverImage)}
                      alt="Cover"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setCoverImage(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="w-full aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:border-primary-500 hover:text-primary-400 transition-colors"
                  >
                    {uploadingCover ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-sm">Upload Cover</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Intro Video */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Video className="w-5 h-5 text-primary-400" />
              Introduction Video
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Record a short 30-60 second video introducing yourself and your business. This helps
              build trust with potential customers!
            </p>

            <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg mb-4">
              <p className="text-amber-400 text-sm">
                <Sparkles className="w-4 h-4 inline mr-1" />
                <strong>Pro Tip:</strong> A friendly intro video can significantly increase customer
                trust. Show your face, explain what you do, and why customers should choose you!
              </p>
            </div>

            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />

            {introVideo ? (
              <div className="relative rounded-xl overflow-hidden bg-gray-800">
                <video
                  src={getMediaUrl(introVideo)}
                  controls
                  className="w-full aspect-video"
                />
                <button
                  type="button"
                  onClick={() => setIntroVideo(null)}
                  className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-black/80"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={uploadingVideo}
                className="w-full py-8 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:border-primary-500 hover:text-primary-400 transition-colors"
              >
                {uploadingVideo ? (
                  <>
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <span>Uploading video...</span>
                  </>
                ) : (
                  <>
                    <Video className="w-10 h-10" />
                    <span>Upload Introduction Video</span>
                    <span className="text-xs text-gray-500">MP4, WebM up to 100MB</span>
                  </>
                )}
              </button>
            )}
          </section>

          {/* Photo & Video Gallery */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary-400" />
              Photo & Video Gallery
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Showcase your work! Add photos and videos of completed projects, your team, equipment,
              etc. (Up to 20 items)
            </p>

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleGalleryUpload}
              className="hidden"
            />

            <div className="grid grid-cols-3 gap-2">
              {gallery.map((item, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                  {item.type === 'image' ? (
                    <Image
                      src={getMediaUrl(item.path)}
                      alt={`Gallery ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <video
                      src={getMediaUrl(item.path)}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeGalleryItem(index)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {item.type === 'video' && (
                    <div className="absolute bottom-1 left-1 p-1 bg-black/60 rounded">
                      <Video className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {gallery.length < 20 && (
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingGallery}
                  className="aspect-square flex flex-col items-center justify-center gap-1 border-2 border-dashed border-white/20 rounded-lg text-gray-400 hover:border-primary-500 hover:text-primary-400 transition-colors"
                >
                  {uploadingGallery ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-6 h-6" />
                      <span className="text-xs">Add</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </section>

          {/* Contact Info */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary-400" />
              Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0821234567"
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="0821234567"
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@yourbusiness.co.za"
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourbusiness.co.za"
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-400" />
              Service Area
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Province</label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select Province</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">City/Area</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Johannesburg"
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          </section>

          {/* Social Links */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary-400" />
              Social Media (Optional)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Facebook</label>
                <input
                  type="url"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/yourbusiness"
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Instagram</label>
                <input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/yourbusiness"
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Twitter/X</label>
                <input
                  type="url"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://twitter.com/yourbusiness"
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">TikTok</label>
                <input
                  type="url"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="https://tiktok.com/@yourbusiness"
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-white/10 p-4">
            <div className="max-w-2xl mx-auto">
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Create Business Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
