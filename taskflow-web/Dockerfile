FROM node:18-alpine

WORKDIR /app

# Install curl pour healthcheck
RUN apk add --no-cache curl

# Copy package files first (pour cache Docker)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Command
CMD ["npm", "run", "dev"]
