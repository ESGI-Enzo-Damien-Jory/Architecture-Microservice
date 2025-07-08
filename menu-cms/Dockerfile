FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js app
RUN npm run build

# Expose port
EXPOSE 3002

# Set environment
ENV NODE_ENV=production
ENV PORT=3002

# Start the application
CMD ["npm", "start"]