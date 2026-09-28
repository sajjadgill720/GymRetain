# ==========================================
# Stage 1: Build & Dependencies
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl libc6-compat

# Copy package manifests and Prisma schema first (caching layer)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code and build production bundle
COPY . .
RUN npm run build

# Prune dev dependencies for a smaller production footprint
RUN npm prune --production

# ==========================================
# Stage 2: Minimal Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install OpenSSL for Prisma engine runtime
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=4000

# Copy minimal runtime assets from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

# Entrypoint runs migrations (if db available) and starts the NestJS API
CMD ["node", "dist/main"]
