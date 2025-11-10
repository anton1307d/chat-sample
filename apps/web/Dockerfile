FROM node:20-alpine AS base

RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app

# Copy only from apps/web/ directory
COPY apps/web/package.json apps/web/pnpm-lock.yaml apps/web/.npmrc* ./

RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY apps/web/package.json apps/web/pnpm-lock.yaml ./
COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY apps/web ./

RUN pnpm run build

FROM nginx:alpine AS runner

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
