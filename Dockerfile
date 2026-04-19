FROM node:18-alpine AS builder

WORKDIR /app

# Install all dependencies for build
COPY package*.json ./
RUN npm ci

# Copy source and build the app
COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next .next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

EXPOSE 8080
CMD ["npm", "start"]
