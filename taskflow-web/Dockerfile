FROM node:18-alpine

WORKDIR /app

# Install curl pour healthcheck
RUN apk add --no-cache curl

# Copy package.json first (pour cache Docker)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Expose port
EXPOSE 3000

# DEV MODE (pas de build en prod pour éviter erreurs)
CMD ["npm", "run", "dev"]
