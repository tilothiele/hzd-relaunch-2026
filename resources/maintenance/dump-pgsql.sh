#!/bin/bash

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

. $SCRIPT_DIR/.env

TARGET_DIR="/local-backups/hzd-backend-prod"
echo "dump postgresql database"
dump_db() {
    echo "--- Erstelle Dump der PROD-DB ---"
    mkdir -p transfer
    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" --network "$PG_NETWORK" \
      -v $TARGET_DIR:/transfer \
      pgvector/pgvector:pg17 \
      pg_dump -h "$PG_HOST" -U "$PG_USER" -d "$PG_PROD_DB" -f "/transfer/$DUMP_FILE"
}

mkdir -p $TARGET_DIR
dump_db
