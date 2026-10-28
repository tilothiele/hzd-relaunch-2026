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

WORKDIR /opt/
COPY package.json package-lock.json ./
COPY .npmrc ./
COPY scripts ./scripts

# Install all dependencies (incl. devDependencies for the build step).
# Native modules are compiled here against the correct Node 24 ABI.
RUN npm ci
ENV PATH=/opt/node_modules/.bin:$PATH

# === Build stage: compile TypeScript / webpack bundles ===
FROM deps AS build

WORKDIR /opt/app
COPY . .

# Angezeigte Version = GIT_TAG, z. B. 1.1.1. Ein führendes v wird entfernt.
# SOURCE_COMMIT wird, wenn gesetzt, mit Bindestrich angehängt: 1.1.1-<commit>.
# Coolify: GIT_TAG=1.1.1 als Build-Variable. SOURCE_COMMIT unter
# Advanced > Build > Source commit availability auf "Available during build".
ARG GIT_TAG
ARG SOURCE_COMMIT
RUN node -e 'const fs=require("fs"); const raw=String(process.env.GIT_TAG||"").trim().replace(/^v/,""); if(!raw){console.error("GIT_TAG fehlt. Build-Arg auf den Tag setzen, z. B. 1.1.1"); process.exit(1);} const commit=String(process.env.SOURCE_COMMIT||"").trim(); const version=commit?raw+"-"+commit:raw; const file="package.json"; const pkg=JSON.parse(fs.readFileSync(file,"utf8")); pkg.version=version; fs.writeFileSync(file, JSON.stringify(pkg,null,2)+"\n"); console.log("package.json version="+version);'

# Build plugin first before building Strapi
WORKDIR /opt/app/src/plugins/hzd-plugin
RUN if [ -f "package.json" ]; then npm install && npm run build; fi
WORKDIR /opt/app
RUN npm run build

# Drop the dev-time node_modules (with all the @strapi/sdk-plugin devDeps etc.) so that
# the production stage can COPY its own pre-built node_modules in without colliding
# with an existing directory from the build stage.
RUN rm -rf /opt/app/node_modules

# Creating final production image
FROM node:24-alpine AS production

# Runtime-only deps for sqlite + vips + git (Strapi plugins sometimes shell-out to git).
RUN apk add --no-cache postgresql-client sqlite vips git

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV PATH=/opt/app/node_modules/.bin:$PATH

WORKDIR /opt/app

# Copy built artefacts (compiled config/, dist/, public/, ...) into the runtime image.
COPY --from=build --chown=node:node /opt/app ./

# Copy node_modules (incl. already-built native binaries for Node 24) from the deps stage.
# The build-stage node_modules was already removed above so this COPY does not collide
# with an existing directory.
COPY --from=deps --chown=node:node /opt/node_modules /opt/app/node_modules

EXPOSE 1337
CMD ["npm", "run", "start"]
