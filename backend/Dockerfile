FROM node:24-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci
RUN npm rebuild sqlite3 --build-from-source
COPY . .
EXPOSE 3111
CMD ["npm", "start"]

FROM node:24-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3111
CMD ["npm", "start"]
