FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
ENV NODE_ENV=production
EXPOSE 3001
CMD ["sh", "-c", "node src/db/migrate.js && node src/db/seed.js && node src/server.js"]
