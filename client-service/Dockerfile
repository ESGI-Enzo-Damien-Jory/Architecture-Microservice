# Base image
FROM node:latest

# Create app directory
WORKDIR /app

# Copy only package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose default Adonis port
EXPOSE 3333

# Run the dev server with HMR
CMD ["node", "ace", "serve", "--hmr"]