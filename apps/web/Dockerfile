# apps/web/Dockerfile
# Multi-stage Dockerfile for Next.js Frontend

# ---- Stage 1: Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN npm ci

# Build via Turborepo (builds @repo/types first, then web)
ENV NEXT_TELEMETRY_DISABLED=1
# Client-side API URL must be set at build time for NEXT_PUBLIC_ to work
ENV NEXT_PUBLIC_CLIENT_API_URL=http://localhost/api
RUN npx turbo run build --filter=web...

# ---- Stage 2: Production Runner ----
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root user
RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the full build output, node_modules, and config needed by `next start`
COPY --from=builder --chown=nextjs:nextjs /app/package.json ./
COPY --from=builder --chown=nextjs:nextjs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nextjs /app/apps/web ./apps/web
COPY --from=builder --chown=nextjs:nextjs /app/packages ./packages

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use next start which serves the full .next build including all CSS
CMD ["npx", "next", "start", "apps/web", "--port", "3000"]
