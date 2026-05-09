FROM node:24-bookworm-slim AS backend-builder
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_DOWNLOAD=true
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
RUN npm rebuild sqlite3 --build-from-source
COPY backend/ .

FROM node:24-bookworm-slim AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y chromium wget && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
WORKDIR /app
COPY --from=backend-builder /app ./
COPY --from=frontend-builder /frontend/dist /frontend/dist
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 3111
CMD ["sh", "-c", "./node_modules/.bin/knex migrate:latest && exec node app.js"]
