import type { Post, Category, File, Message } from '@prisma/client'

// Post status type (SQLite doesn't support enums)
export type PostStatus = 'PUBLISHED' | 'HIDDEN' | 'REMOVED'

// Post with relations
export interface PostWithRelations extends Post {
  category: Category
  files: File[]
  _count?: {
    messages: number
  }
}

// Post creation input
export interface CreatePostInput {
  title: string
  content: string
  categoryId: string
  province?: string
  city?: string
  organization?: string
  enableContact?: boolean // Whether to generate a contact token
}

// Message input
export interface SendMessageInput {
  postId: string
  contactToken: string
  content: string
  isFromWhistleblower: boolean
}

// Search/filter params
export interface PostFilters {
  categorySlug?: string
  province?: string
  search?: string
  featured?: boolean
  page?: number
  limit?: number
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Re-export Prisma types
export type { Post, Category, File, Message }
