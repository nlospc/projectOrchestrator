FROM node:20-slim

WORKDIR /app

# Dependency layer first so source-only edits reuse the npm cache.
# better-sqlite3 ships prebuilt binaries for linux x64/arm64 (glibc); if the
# prebuild download fails in your network, install build tools first:
#   RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
#     && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# The SQLite store lives at /app/data/pmo.sqlite — mount a volume there.
RUN mkdir -p data && chown -R node:node /app
USER node
VOLUME /app/data

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server/index.js"]
