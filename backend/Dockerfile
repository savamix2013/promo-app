FROM node:24-alpine AS backend-builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
RUN npm rebuild sqlite3 --build-from-source
COPY backend/ .

FROM node:24-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
COPY --from=backend-builder /app ./
COPY --from=frontend-builder /frontend/dist /frontend/dist
EXPOSE 3111
CMD ["npm", "start"]
