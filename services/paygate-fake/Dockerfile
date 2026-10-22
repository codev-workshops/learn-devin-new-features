# services/paygate-fake — build context is the REPO ROOT (npm workspaces share one lockfile):
#   docker build -f services/paygate-fake/Dockerfile -t kade-paygate-fake .
FROM mirror.gcr.io/library/node:22-alpine AS build
WORKDIR /repo
COPY . .
RUN npm ci --no-audit --no-fund && npm run build -w services/paygate-fake

FROM mirror.gcr.io/library/node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/services/paygate-fake/package.json ./package.json
COPY --from=build /repo/services/paygate-fake/dist ./dist
EXPOSE 3002
CMD ["node", "dist/cli.js", "serve"]
