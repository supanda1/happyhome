# Multi-stage build for React frontend with Vite
FROM node:20-alpine AS builder

# Set environment variables for build
ENV NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_COLOR=false

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    git

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY tsconfig.json ./
COPY tsconfig.app.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY index.html ./

# Install dependencies (including dev dependencies needed for build)
# First delete any existing node_modules and package-lock
RUN rm -rf node_modules package-lock.json || true
# Remove husky prepare script to avoid Docker build issues
RUN sed -i '/"prepare":/d' package.json
# Fresh install with all dependencies
RUN npm install

# Copy source code
COPY src/ ./src/
COPY public/ ./public/

# Set environment variables for build
ENV VITE_API_BASE_URL=/api
ENV VITE_APP_NAME="Happy Homes"
ENV VITE_APP_VERSION=1.0.0
ENV VITE_ENABLE_ANALYTICS=false
ENV VITE_ENABLE_ERROR_REPORTING=true
ENV VITE_ENABLE_MAINTENANCE_MODE=false

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add labels for better container management
LABEL app="household-services-frontend" \
      version="1.0.0" \
      maintainer="Happy Homes Team"

# Set proper permissions (nginx user already exists in nginx:alpine)
RUN chown -R nginx:nginx /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]