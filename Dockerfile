# SA Leaks - Production Dockerfile
# Includes ffmpeg for video watermarking

FROM node:20-alpine AS base

# Install ffmpeg and other dependencies
RUN apk add --no-cache \
    ffmpeg \
    libc6-compat \
    openssl

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# Copy production server that serves static files from public folder
COPY --from=builder /app/production-server.js ./production-server.js

# Create directories for temporary files (video processing)
RUN mkdir -p /app/tmp && chown nextjs:nodejs /app/tmp

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy prisma CLI from node_modules for migrations
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Run database migrations and start the server
CMD ["sh", "-c", "node node_modules/prisma/build/index.js db push && node production-server.js"]
