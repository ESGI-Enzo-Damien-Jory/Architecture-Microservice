FROM node:18-slim as base

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./

FROM base as builder

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

FROM base as production

RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

COPY next.config.ts ./
COPY package*.json ./
COPY .env.production .env

EXPOSE 3002
ENV NODE_ENV=production
ENV PORT=3002

CMD ["npm", "start"]