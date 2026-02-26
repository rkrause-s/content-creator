FROM node:22-slim

# Install Chromium for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy root package files and source (needed by API imports)
COPY package.json package-lock.json ./
COPY src/ src/
COPY brand/ brand/

# Copy API package files
COPY api/package.json api/
RUN cd api && npm install

# Copy API source
COPY api/src/ api/src/
COPY api/tsconfig.json api/

# Install root dependencies (needed for pipeline imports)
RUN npm install

EXPOSE 3001

WORKDIR /app/api
CMD ["npx", "tsx", "src/server.ts"]
