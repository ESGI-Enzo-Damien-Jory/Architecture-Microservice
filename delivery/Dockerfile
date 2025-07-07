FROM node:18-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for development mode)
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3333

# Default command (can be overridden by docker-compose)
CMD ["node", "ace", "serve", "--watch"]