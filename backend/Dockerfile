# Creating multi-stage build for production
FROM node:24-alpine AS deps

# Build dependencies for native modules (better-sqlite3, sharp).
RUN apk update && apk add --no-cache \
    build-base \
    gcc \
    g++ \
    make \
    autoconf \
    automake \
    libtool \
    python3 \
    zlib-dev \
    libpng-dev \
    vips-dev \
    git \
    > /dev/null 2>&1

# Install pnpm
RUN npm install -g pnpm@10.20.0

WORKDIR /opt/
COPY package.json pnpm-lock.yaml ./
COPY scripts ./scripts

# Install all dependencies (incl. devDependencies for the build step).
# Native modules are compiled here against the correct Node 24 ABI.
RUN pnpm install --frozen-lockfile
ENV PATH=/opt/node_modules/.bin:$PATH

# === Build stage: compile TypeScript / webpack bundles ===
FROM deps AS build

WORKDIR /opt/app
COPY . .

# Build plugin first before building Strapi
WORKDIR /opt/app/src/plugins/hzd-plugin
RUN if [ -f "package.json" ]; then pnpm install && pnpm run build; fi
WORKDIR /opt/app
RUN pnpm run build

# Creating final production image
FROM node:24-alpine AS production

# Runtime-only deps for sqlite + vips + git (Strapi plugins sometimes shell-out to git).
RUN apk add --no-cache postgresql-client sqlite vips git

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV PNPM_HOME=/usr/local/share/pnpm \
    PATH=/usr/local/share/pnpm:/opt/app/node_modules/.bin:$PATH

WORKDIR /opt/app

# Install pnpm globally so the CMD works without relying on node_modules/.bin/pnpm.
RUN npm install -g pnpm@10.20.0

# Copy built artefacts (compiled config/, dist/, public/, ...) into the runtime image.
COPY --from=build --chown=node:node /opt/app ./

# Copy node_modules (incl. already-built native binaries for Node 24) from the deps stage.
# This must come AFTER the app copy to keep the correct node_modules (the COPY ./. above
# would otherwise be overwritten by this layer).
COPY --from=deps --chown=node:node /opt/node_modules /opt/app/node_modules

EXPOSE 1337
CMD ["pnpm", "run", "start"]
