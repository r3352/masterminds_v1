# Backend Dockerfile for NestJS (Development/Demo)
FROM node:18-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files first (for better layer caching)
COPY package.json package-lock.json ./

# Install all dependencies (bcryptjs is pure JS, no compilation needed)
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start the development server
CMD ["npm", "run", "start:dev"]