FROM node:20-alpine AS development

WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY .npmrc ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY nest-cli.json ./

RUN pnpm install --frozen-lockfile

COPY apps/websocket-gateway ./apps/websocket-gateway
COPY libs ./libs

CMD ["pnpm", "run", "start:dev", "websocket-gateway"]

FROM node:20-alpine AS build

WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY .npmrc ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY nest-cli.json ./

RUN pnpm install --frozen-lockfile

COPY apps/websocket-gateway ./apps/websocket-gateway
COPY libs ./libs

RUN pnpm run build websocket-gateway

FROM node:20-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY .npmrc ./
COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile

COPY --from=build /usr/src/app/dist ./dist

CMD ["node", "dist/apps/websocket-gateway/main"]