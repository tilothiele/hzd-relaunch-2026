# Creating multi-stage build for production
FROM node:22-alpine AS build

RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev git > /dev/null 2>&1

# Install pnpm
RUN npm install -g pnpm

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/
COPY package.json pnpm-lock.yaml ./

# Generate lockfile with overrides (allow mismatch since lockfile might be older)
RUN pnpm install
ENV PATH=/opt/node_modules/.bin:$PATH

WORKDIR /opt/app
COPY . .

# Build plugin first before building Strapi
WORKDIR /opt/app/src/plugins/hzd-plugin
RUN if [ -f "package.json" ]; then pnpm install && pnpm run build; fi
WORKDIR /opt/app
RUN pnpm run build

# Creating final production image
FROM node:22-alpine AS production

RUN apk add --no-cache postgresql-client sqlite

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/
COPY --from=build /opt/package.json /opt/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
ENV PATH=/opt/node_modules/.bin:$PATH

WORKDIR /opt/app
COPY --from=build /opt/app ./

RUN chown -R node:node /opt/app
USER node
EXPOSE 1337
CMD ["pnpm", "run", "start"]