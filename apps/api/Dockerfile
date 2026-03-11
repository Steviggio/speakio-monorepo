# apps/api/Dockerfile
# Multi-stage Dockerfile for NestJS API

# ---- Stage 1: Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Build the API and its dependencies via Turborepo
RUN npx turbo run build --filter=api...

# ---- Stage 2: Production ----
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root user
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

# Copy only the built output and production dependencies
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/src ./packages/types/src

# Install only production dependencies
ENV NODE_ENV=production
RUN npm ci --workspace=apps/api --omit=dev --ignore-scripts

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads && chown -R nestjs:nestjs /app/uploads

USER nestjs

EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
