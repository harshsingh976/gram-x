FROM node:20-slim

WORKDIR /app

# Copy package descriptors and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy application files
COPY . .

# Expose Vite development port
EXPOSE 5173

# Run development server exposing to host
CMD ["npm", "run", "dev", "--", "--host"]
