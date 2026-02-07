#!/bin/bash
set -euo pipefail

### ================================
###  Einstellungen anpassen
### ================================

# Container-Namen
CONTAINERS=("hzd-frontend-prod" "hzd-backend-prod" "hzd-backend-staging" "hzd-backend-staging")

# PostgreSQL
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

. $SCRIPT_DIR/.env

# Volumes/Verzeichnisse
VOL_NAME_PA1="iws80ks8w8g8ckogs84gggsw-hzd-strapi-prod"
VOL_NAME_SA1="ngwokgkwck4sssswg80osw8k-hzd-strapi-staging"

VOL_PA1="/var/lib/docker/volumes/$VOL_NAME_PA1/_data"
VOL_SA1="/var/lib/docker/volumes/$VOL_NAME_SA1/_data"

#VOL_PB1="/var/lib/docker/volumes/$VOL_NAME_PB1/_data"
#VOL_SB1="/var/lib/docker/volumes/SB1/_data"

DUMP_FILE=hzd-website-prod.dump

### ================================
###  Funktionen
### ================================

stop_containers() {
    echo "--- Stoppe Container ---"
    for c in "${CONTAINERS[@]}"; do
        docker stop "$c" || true
    done
}

start_containers() {
    echo "--- Starte Container ---"
    for c in "${CONTAINERS[@]}"; do
        docker start "$c"
    done
}

dump_db() {
    echo "--- Erstelle Dump der PROD-DB ---"
    mkdir -p transfer
    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" --network "$PG_NETWORK" \
      -v ./transfer:/transfer \
      pgvector/pgvector:pg17 \
      pg_dump -h "$PG_HOST" -U "$PG_USER" -d "$PG_PROD_DB" -Fc --no-owner --no-acl -f "/transfer/$DUMP_FILE"
}

restore_stage() {
    echo "--- Staging-DB leeren und Import durchführen ---"
    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" --network "$PG_NETWORK" \
      pgvector/pgvector:pg17 \
      psql -h "$PG_HOST" -U "$PG_USER" -d "$PG_STAGE_DB" \
        -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" --network "$PG_NETWORK" \
      pgvector/pgvector:pg17 \
      psql -h "$PG_HOST" -U "$PG_USER" -d "$PG_STAGE_DB" \
        -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO $PG_STAGE_USER;"

    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" --network "$PG_NETWORK" \
      pgvector/pgvector:pg17 \
      psql -h "$PG_HOST" -U "$PG_USER" -d "$PG_STAGE_DB" \
        -c "GRANT ALL PRIVILEGES ON SCHEMA public TO $PG_STAGE_USER;"


    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" --network "$PG_NETWORK" \
      pgvector/pgvector:pg17 \
      psql -h "$PG_HOST" -U "$PG_USER" -d "$PG_STAGE_DB" \
      -c "ALTER SCHEMA public OWNER TO $PG_STAGE_USER;"

    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" --network "$PG_NETWORK" \
      -v ./transfer:/transfer \
      pgvector/pgvector:pg17 \
      pg_restore -h "$PG_HOST" -U "$PG_USER" -d "$PG_STAGE_DB" --no-owner --role="$PG_STAGE_USER"  "/transfer/$DUMP_FILE"

}

copy_volume() {
    src=$1
    dst=$2

    echo "--- Volume kopieren: $src → $dst ---"
    sudo rsync -a --delete "$src/" "$dst/"
}

### ================================
###  Ablauf
### ================================

echo "### Starte Update/Sync-Prozess ###"

stop_containers
dump_db
copy_volume "$VOL_PA1" "$VOL_SA1"
restore_stage

#copy_volume "$VOL_PB1" "$VOL_SB1"

start_containers

echo "### Fertig! ###"
