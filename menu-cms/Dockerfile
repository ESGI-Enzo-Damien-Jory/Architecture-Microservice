FROM node:18-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY .env.production .env
COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3002
ENV NODE_ENV=production
ENV PORT=3002

CMD ["npm", "start"]
