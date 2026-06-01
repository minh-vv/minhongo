# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# build-base + python3 needed to compile bcrypt and better-sqlite3
# openssl needed by Prisma to detect SSL version and generate correct client binary
RUN apk add --no-cache python3 make g++ openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Generate Prisma client, then compile TypeScript
RUN npx prisma generate && npm run build


# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Same build tools needed to recompile native addons for this exact environment
RUN apk add --no-cache python3 make g++ openssl

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Prisma CLI (devDep) is needed only to run `prisma migrate deploy` at startup
COPY --from=builder /app/node_modules/prisma              ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma         ./node_modules/.bin/prisma
# Generated Prisma client (schema-specific, produced by `prisma generate`)
COPY --from=builder /app/node_modules/.prisma             ./node_modules/.prisma

# Compiled app and Prisma schema (needed by migrate deploy)
COPY --from=builder /app/dist  ./dist
COPY prisma ./prisma

# Uploads dir will be a bind-mount / named volume on the host
RUN mkdir -p uploads/avatars

ENV NODE_ENV=production

EXPOSE 3000

# Run migrations before starting the server
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]
