# syntax=docker.io/docker/dockerfile:1

FROM node:24-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc* ./
RUN corepack prepare pnpm@11.1.2 --activate \
	&& pnpm i --frozen-lockfile


FROM base AS builder
WORKDIR /app

# Nur öffentliche Build-Config – keine Secrets ins Image backen
ARG STRAPI_BASE_URL=http://localhost:1337
ENV STRAPI_BASE_URL=${STRAPI_BASE_URL}
ENV DATABASE_URL=file:./data/applications.db

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable \
	&& corepack prepare pnpm@11.1.2 --activate \
	&& pnpm run build


FROM base AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/applications.db

RUN addgroup --system --gid 1001 nodejs \
	&& adduser --system --uid 1001 nextjs \
	&& mkdir -p /app/data \
	&& chown nextjs:nodejs /app/data

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
