# services/paygate-fake — build context is the REPO ROOT (pnpm workspaces share one lockfile):
#   docker build -f services/paygate-fake/Dockerfile -t harbourline-paygate-fake .
FROM mirror.gcr.io/library/node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.34.7 --activate
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY services/paygate-fake/package.json services/paygate-fake/
RUN pnpm fetch --filter @harbourline/paygate-fake... \
    && pnpm install --frozen-lockfile --offline --filter @harbourline/paygate-fake...
COPY services/paygate-fake services/paygate-fake
RUN pnpm --filter @harbourline/paygate-fake run build \
    && pnpm --filter @harbourline/paygate-fake deploy --legacy --prod /out

FROM mirror.gcr.io/library/node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out /app
EXPOSE 3002
CMD ["node", "dist/cli.js", "serve"]
