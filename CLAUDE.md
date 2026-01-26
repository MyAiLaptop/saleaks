# SpillNova (SA Leaks) - Developer Guide

This document provides essential context for AI agents and developers working on this codebase.

## Project Overview

SpillNova is a **privacy-focused citizen journalism and whistleblower platform** built with Next.js 14. It allows anonymous content submission, real-time news feeds, and media monetization while protecting user identity.

**Live URLs:**
- Production: https://spillnova.com
- Media CDN: https://media.saleaks.co.za (Cloudflare R2)

## Tech Stack

- **Framework:** Next.js 14.2 (App Router) + TypeScript
- **Database:** PostgreSQL (production) / SQLite (local dev) via Prisma 5
- **Storage:** Cloudflare R2 (S3-compatible)
- **Payments:** PayFast, Flutterwave, Carrier Billing
- **Styling:** TailwindCSS
- **Deployment:** Render (Docker)

## Critical Rules - DO NOT VIOLATE

### 1. Privacy First - NO IP LOGGING
- **NEVER** store, log, or process IP addresses
- User identification is via browser fingerprint hash only
- The `server.js` file strips IP headers from all requests
- Posts have no creator identification stored

### 2. Watermarking is Mandatory
- ALL public media must be watermarked
- Original unwatermarked files are only for paying customers
- Watermarking happens via `lib/watermark.ts` (Sharp)
- EXIF metadata must be stripped from all uploads

### 3. Phone-Based Authentication
- No email required for submitters/buyers
- OTP (6-digit code) is the primary auth method
- Test bypass: `ENABLE_OTP_BYPASS=true` with code `000000`
- 5-minute expiry, 3 attempt limit

### 4. Content Moderation Pipeline
- Text: Pattern matching in `lib/content-moderation.ts`
- Media: NSFW scoring (0-1 confidence)
- Status flow: PENDING → APPROVED/FLAGGED/REJECTED
- User reports trigger admin review

### 5. Payment Security
- PayFast: MD5 signature verification required
- Flutterwave: Secret key verification
- Download tokens: Limited to 3 uses per purchase
- Revenue split: 50% submitter / 50% platform

## Key File Locations

| Purpose | Location |
|---------|----------|
| Database schema | `prisma/schema.prisma` |
| API routes | `src/app/api/` |
| Live feed page | `src/app/[country]/live/page.tsx` |
| Discussions page | `src/app/[country]/discussions/page.tsx` |
| Marketplace browse | `src/app/[country]/marketplace/page.tsx` |
| Marketplace API | `src/app/api/marketplace/` |
| Video player | `src/components/AutoPlayVideo.tsx` |
| Mobile upload wizard | `src/components/MobilePostWizard.tsx` |
| Video uploader | `src/components/VideoUploader.tsx` |
| Video recorder | `src/components/VideoRecorder.tsx` |
| Fingerprinting | `src/lib/fingerprint.ts` |
| Watermarking | `src/lib/watermark.ts` |
| Payment integration | `src/lib/payfast.ts`, `src/lib/flutterwave.ts` |
| Country config | `src/lib/countries.ts` |
| Cron jobs | `vercel.json` |

## Database Models Summary

**Content:**
- `LiveBillboard` - Main feed posts with auction support, contentSource, aiDisclosure
- `LiveBillboardMedia` - Media files with moderation
- `Post` - Legacy whistleblower posts
- `Topic` / `TopicResponse` - Video discussions

**Users:**
- `SubmitterAccount` - Content creators (phone-based)
- `BuyerAccount` - Media buyers/newsrooms (phone-based)
- `Journalist` - Verified journalists (email-based)

**Commerce:**
- `AuctionBid` / `WonAuction` - Auction system
- `MediaPurchase` - Purchase records
- `SubmitterEarning` / `SubmitterWithdrawal` - Revenue tracking
- `CreditTransaction` - Buyer credit system

**Marketplace:**
- `MarketplaceListing` - Item listings with soldAt for auto-cleanup
- `MarketplaceImage` - Listing images stored in R2
- `MarketplaceMessage` - Buyer-seller communication
- `MarketplaceFavorite` - Saved listings

**Personalization:**
- `ViewHistory` - Tracks watched/skipped videos per session
- `UserPreference` - Learned category preferences, hideWatched setting
- `CreatorNotification` - Engagement notifications for content creators

## Recent Changes (January 2026)

### Marketplace Feature (Facebook-style)
Peer-to-peer marketplace for buying/selling items:
- **Database models:** `MarketplaceListing`, `MarketplaceImage`, `MarketplaceMessage`, `MarketplaceFavorite`
- **Browse page:** `src/app/[country]/marketplace/page.tsx`
- **Create listing:** `src/app/[country]/marketplace/create/page.tsx`
- **API routes:** `src/app/api/marketplace/` (CRUD, favorites, messages)
- **Auto-cleanup:** Sold listings auto-delete after 3 days via Vercel cron (`vercel.json`)
- **Categories:** Vehicles, Property, Electronics, Furniture, Clothing, Jobs, Services, Pets, etc.

### Video Upload with AI Disclosure
Added upload feature alongside camera capture with mandatory AI content disclosure:
- **VideoUploader component:** `src/components/VideoUploader.tsx` - 3-step flow (select → disclosure → confirm)
- **AI disclosure options:** none, unknown, ai_enhanced, ai_generated
- **Content source tracking:** `contentSource` field on LiveBillboard (camera vs upload)
- **Badge display:** Posts show "Original", "May have AI", or "AI Content" badges
- **Policy enforcement:** AI content banned from news categories, violations = account suspension

### Content Personalization System
Added TikTok-style feed personalization:
- **View tracking:** `src/app/api/live/[publicId]/view/route.ts`
- **Preferences API:** `src/app/api/preferences/route.ts`
- **Feed filtering:** Modified `src/app/api/live/route.ts` to exclude watched videos
- **Client tracking:** `AutoPlayVideo.tsx` sends engagement data (watch time, completion, skips)
- **UI toggle:** "Hide Watched Videos" in filter panel

### Mobile Post Wizard
- Multi-step form for mobile users
- Text direction fix (`dir="ltr"`) for proper input behavior
- Upload button integration with AI disclosure flow

### UI Consistency
- Global background image applied to all pages (discussions, live, marketplace, etc.)
- Pattern: `bg-fixed bg-cover bg-center` with `bg-black/60` overlay

### Creator Engagement Notifications
Dopamine-feedback system to drive content creation:
- **Database model:** `CreatorNotification` - stores notifications for creators
- **Helper library:** `src/lib/creator-notifications.ts` - functions to trigger notifications
- **API endpoints:** `src/app/api/submitter/notifications/route.ts` (GET list, PATCH mark read)
- **UI:** Activity tab in SubmitterDashboard with unread count badge
- **Triggers:**
  - View milestones: 10, 50, 100, 500, 1K, 5K, 10K, 50K, 100K views
  - Upvote milestones: 1, 10, 25, 50, 100, 500 upvotes
  - Bid placed on auction content
  - Content purchases (planned)

### Deployment Fixes
- Dockerfile updated with `--accept-data-loss` flag for Prisma migrations
- Prisma CLI path fix for Docker runner

## Common Tasks

### Running Locally
```bash
npm install
npm run db:generate    # Generate Prisma client
npm run db:push        # Sync schema to database
npm run dev            # Start dev server (auto-opens browser)
```

### Database Changes
```bash
# After modifying prisma/schema.prisma:
npx prisma generate    # Update client
npx prisma db push     # Apply to database
```

### Building for Production
```bash
npm run build          # Creates standalone build
docker build -t spillnova .
```

## API Patterns

**Feed endpoint:** `GET /api/live`
- Query params: `country`, `category`, `section`, `province`, `sort`, `hideWatched`, `personalized`
- Returns: posts with pagination, filter counts, personalization data

**View tracking:** `POST /api/live/[publicId]/view`
- Body: `{ watchDuration, completed, skipped, shared }`
- Updates user preferences automatically

**Preferences:** `GET/PATCH /api/preferences`
- Get/update hideWatched setting
- Returns learned category scores

## Environment Variables Required

```env
DATABASE_URL=postgresql://...
ENCRYPTION_SECRET=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
PAYFAST_MERCHANT_ID=...
PAYFAST_MERCHANT_KEY=...
PAYFAST_PASSPHRASE=...
FLUTTERWAVE_PUBLIC_KEY=...
FLUTTERWAVE_SECRET_KEY=...
NEXT_PUBLIC_APP_URL=https://spillnova.com
```

## Testing Checklist

Before deploying changes:
- [ ] `npx tsc --noEmit` passes (no type errors)
- [ ] `npm run build` succeeds
- [ ] Test on mobile viewport (most users are mobile)
- [ ] Verify watermarks appear on media
- [ ] Test payment flow if commerce changes made
- [ ] Check fingerprint-based features work in incognito

## Country Support

The app supports multiple African countries:
- **SA** (South Africa) - Default, full carrier billing support
- **NG** (Nigeria) - Flutterwave primary
- **KE** (Kenya) - M-Pesa integration planned

Routes use `[country]` dynamic segment: `/sa/live`, `/ng/live`, etc.

## Contact

For questions about this codebase, check the GitHub issues or contact the maintainer.
