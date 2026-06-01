# # ---- Stage 1: Build ----
# FROM node:20-alpine AS builder
# 
# WORKDIR /app
# 
# # Dependencies install
# COPY package*.json ./
# RUN npm install
# 
# # Source copy aur build
# COPY . .
# RUN npm run build
# 
# # ---- Stage 2: Production ----
# FROM node:20-alpine AS production
# 
# WORKDIR /app
# 
# ENV NODE_ENV=production
# 
# # Sirf production dependencies
# COPY package*.json ./
# RUN npm install --omit=dev
# 
# # Next.js build output copy
# COPY --from=builder /app/.next ./.next
# COPY --from=builder /app/public ./public
# COPY --from=builder /app/messages ./messages
# 
# EXPOSE 3000
# 
# CMD ["npm", "run", "start"]


# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# ---- Stage 2: Production ----
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/messages ./messages

EXPOSE 3000

CMD ["npm","run","start"]