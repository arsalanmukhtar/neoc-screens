# Chromium comes from Debian, so puppeteer does not download its own copy
FROM node:22-bookworm-slim

ENV PUPPETEER_SKIP_DOWNLOAD=1 \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
        chromium \
        ca-certificates \
        dumb-init \
        fonts-liberation \
        fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server.js ./

EXPOSE 47850
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
