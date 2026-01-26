'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  MapPin,
  MessageCircle,
  ExternalLink,
  Building2,
  Clock,
  Eye,
  Loader2,
  Play,
  Video,
  Image as ImageIcon,
  X,
} from 'lucide-react'
import { useCountry } from '@/lib/country-context'

interface GalleryItem {
  type: 'image' | 'video'
  path: string
  caption?: string
}

interface BusinessProfile {
  id: string
  publicId: string
  name: string
  description: string | null
  logo: string | null
  coverImage: string | null
  introVideo: string | null
  gallery: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  province: string | null
  city: string | null
  serviceAreas: string | null
  categories: string | null
  facebook: string | null
  twitter: string | null
  instagram: string | null
  tiktok: string | null
  status: string
  totalViews: number
  createdAt: string
}

const R2_PUBLIC_URL = 'https://media.saleaks.co.za'

function getMediaUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  if (path.startsWith('/')) {
    return path
  }
  return `${R2_PUBLIC_URL}/${path}`
}

export default function BusinessProfilePage() {
  const { country } = useCountry()
  const params = useParams<{ slug: string }>()
  const [business, setBusiness] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewingMedia, setViewingMedia] = useState<GalleryItem | null>(null)

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!params.slug) return

      try {
        const response = await fetch(`/api/business/${params.slug}`)
        const data = await response.json()

        if (data.success) {
          setBusiness(data.data.business)
        } else {
          setError(data.error || 'Business not found')
        }
      } catch (err) {
        console.error('Failed to fetch business:', err)
        setError('Failed to load business profile')
      } finally {
        setLoading(false)
      }
    }

    fetchBusiness()
  }, [params.slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <Building2 className="w-16 h-16 text-gray-600 mb-4" />
        <h1 className="text-xl font-semibold text-white mb-2">Business Not Found</h1>
        <p className="text-gray-400 mb-4">{error || 'This business profile does not exist.'}</p>
        <Link
          href={`/${country}/live`}
          className="text-primary-400 hover:text-primary-300 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </Link>
      </div>
    )
  }

  const serviceAreas = business.serviceAreas ? JSON.parse(business.serviceAreas) : []
  const categories = business.categories ? JSON.parse(business.categories) : []
  const galleryItems: GalleryItem[] = business.gallery ? JSON.parse(business.gallery) : []

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={`/${country}/live`}
            className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white truncate">{business.name}</h1>
            <p className="text-xs text-gray-400">Business Profile</p>
          </div>
          {business.totalViews > 100 && (
            <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded-full">
              <Eye className="w-3 h-3" />
              Popular
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Logo and Name */}
        <div className="flex items-start gap-4 mb-6">
          {business.logo ? (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
              <Image
                src={getMediaUrl(business.logo)}
                alt={business.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-10 h-10 text-gray-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-white mb-1">{business.name}</h2>
            {business.province && (
              <p className="text-gray-400 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {business.city ? `${business.city}, ` : ''}{business.province}
              </p>
            )}
          </div>
        </div>

        {/* Cover Image */}
        {business.coverImage && (
          <div className="mb-6 -mx-4 sm:mx-0">
            <div className="relative aspect-[2/1] sm:rounded-xl overflow-hidden bg-gray-800">
              <Image
                src={getMediaUrl(business.coverImage)}
                alt={`${business.name} cover`}
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* Description */}
        {business.description && (
          <div className="mb-6">
            <p className="text-gray-300 leading-relaxed">{business.description}</p>
          </div>
        )}

        {/* Introduction Video */}
        {business.introVideo && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <Video className="w-4 h-4" />
              Meet the Business
            </h3>
            <div className="relative rounded-xl overflow-hidden bg-gray-800">
              <video
                src={getMediaUrl(business.introVideo)}
                controls
                poster={business.coverImage ? getMediaUrl(business.coverImage) : undefined}
                className="w-full aspect-video"
              />
            </div>
          </div>
        )}

        {/* Photo & Video Gallery */}
        {galleryItems.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Gallery ({galleryItems.length})
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {galleryItems.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setViewingMedia(item)}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 hover:opacity-90 transition-opacity"
                >
                  {item.type === 'image' ? (
                    <Image
                      src={getMediaUrl(item.path)}
                      alt={item.caption || `Gallery ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <>
                      <video
                        src={getMediaUrl(item.path)}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="w-8 h-8 text-white" fill="white" />
                      </div>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contact Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
            >
              <Phone className="w-5 h-5" />
              Call Now
            </a>
          )}
          {business.whatsapp && (
            <a
              href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </a>
          )}
          {business.email && (
            <a
              href={`mailto:${business.email}`}
              className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
            >
              <Mail className="w-5 h-5" />
              Email
            </a>
          )}
          {business.website && (
            <a
              href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
            >
              <Globe className="w-5 h-5" />
              Website
            </a>
          )}
        </div>

        {/* Service Areas */}
        {serviceAreas.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Service Areas</h3>
            <div className="flex flex-wrap gap-2">
              {serviceAreas.map((area: string, index: number) => (
                <span
                  key={index}
                  className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Services</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat: string, index: number) => (
                <span
                  key={index}
                  className="bg-primary-900/30 text-primary-400 px-3 py-1 rounded-full text-sm"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Social Links */}
        {(business.facebook || business.twitter || business.instagram || business.tiktok) && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Follow Us</h3>
            <div className="flex gap-3">
              {business.facebook && (
                <a
                  href={business.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                  title="Facebook"
                >
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              {business.twitter && (
                <a
                  href={business.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                  title="X (Twitter)"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {business.instagram && (
                <a
                  href={business.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                  title="Instagram"
                >
                  <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/>
                  </svg>
                </a>
              )}
              {business.tiktok && (
                <a
                  href={business.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                  title="TikTok"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Member Since */}
        <div className="text-center text-gray-500 text-sm pt-6 border-t border-gray-800">
          <Clock className="w-4 h-4 inline-block mr-1" />
          Member since {new Date(business.createdAt).toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'long'
          })}
        </div>
      </main>

      {/* Media Viewer Modal */}
      {viewingMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setViewingMedia(null)}
        >
          <button
            type="button"
            onClick={() => setViewingMedia(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close media viewer"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {viewingMedia.type === 'image' ? (
              <Image
                src={getMediaUrl(viewingMedia.path)}
                alt={viewingMedia.caption || 'Gallery image'}
                width={1200}
                height={800}
                className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
              />
            ) : (
              <video
                src={getMediaUrl(viewingMedia.path)}
                controls
                autoPlay
                className="w-full max-h-[90vh] rounded-lg"
              />
            )}
            {viewingMedia.caption && (
              <p className="text-white text-center mt-3">{viewingMedia.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
