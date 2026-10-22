FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/
COPY services/api/package.json services/api/
RUN npm ci --no-audit --no-fund --workspace services/api --include-workspace-root
COPY packages/contracts packages/contracts
COPY services/api services/api
COPY db db
RUN npm run build -w packages/contracts --if-present && npm run build -w services/api

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 3001
CMD ["node", "services/api/dist/server.js"]
