FROM node:24-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm rebuild sqlite3 --build-from-source
COPY . .
EXPOSE 3111
CMD ["npm", "start"]
