
FROM node:20.18.1-alpine3.21 AS builder
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

RUN npm ci

RUN npx turbo run build --filter=api...

FROM node:20.18.1-alpine3.21 AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/src ./packages/types/src

ENV NODE_ENV=production
RUN npm ci --workspace=apps/api --omit=dev --ignore-scripts

RUN mkdir -p /app/uploads && chown -R nestjs:nestjs /app/uploads

USER nestjs

EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
