# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /app

# Dependencies install
COPY package*.json ./
RUN npm install

# Prisma generate
COPY prisma ./prisma/
RUN npx prisma generate

# Source copy aur build
COPY . .
RUN npm run build

# ---- Stage 2: Production ----
FROM node:20-alpine AS production

WORKDIR /app

# Sirf production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Prisma client copy (generated)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Compiled code copy
COPY --from=builder /app/dist ./dist

# Prisma schema (migrations ke liye)
COPY --from=builder /app/prisma ./prisma

# Uploads folder
RUN mkdir -p uploads

EXPOSE 3001

CMD ["node", "dist/main.js"]
