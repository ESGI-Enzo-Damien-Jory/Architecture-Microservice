# Dockerfile

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache bash

# Copy package files and install deps
COPY package*.json ./
RUN npm install --production

# Copy the rest of the app
COPY . .

# Build AdonisJS if needed (uncomment if you compile assets)
# RUN node ace build

# Expose port (default for Adonis is 3333)
EXPOSE 3333

# Start the server
CMD ["node", "ace", "serve", "--watch"]
