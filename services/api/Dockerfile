# services/api — build context is the REPO ROOT (pnpm workspaces share one lockfile):
#   docker build -f services/api/Dockerfile -t harbourline-api .
FROM mirror.gcr.io/library/node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.34.7 --activate
ENV CI=true
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/
COPY services/api/package.json services/api/
RUN pnpm fetch --filter @harbourline/api... \
    && pnpm install --frozen-lockfile --offline --filter @harbourline/api...
COPY packages/contracts packages/contracts
COPY services/api services/api
COPY db db
RUN pnpm --filter @harbourline/api... run build
# Runtime layer keeps the repo shape (dist resolves db/ and packages/contracts from the
# repo root), so prune to production dependencies in place instead of `pnpm deploy`.
RUN pnpm install --frozen-lockfile --offline --prod --ignore-scripts --filter @harbourline/api...

FROM mirror.gcr.io/library/node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 3001
CMD ["node", "services/api/dist/server.js"]
