#!/bin/bash
set -euo pipefail

set -x

DUMP_FILE=$1

###  Einstellungen anpassen
### ================================

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

. $SCRIPT_DIR/.env


### ================================
###  Funktionen
### ================================

restore_dev_db() {
    echo "--- Prod-DB leeren und Import durchführen ---"
    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" \
      pgvector/pgvector:pg17 \
      psql -h "$PG_HOST" -U "$PG_USER" -p "$PG_PORT" -d "$PG_BACKEND_DB" \
        -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" \
      pgvector/pgvector:pg17 \
      psql -h "$PG_HOST" -U "$PG_USER" -p "$PG_PORT" -d "$PG_BACKEND_DB" \
        -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO $PG_BACKEND_USER;"

    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" \
      pgvector/pgvector:pg17 \
      psql -h "$PG_HOST" -U "$PG_USER" -p "$PG_PORT" \
        -c "ALTER database $PG_BACKEND_DB owner to $PG_BACKEND_USER;"

    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" \
      pgvector/pgvector:pg17 \
      psql -h "$PG_HOST" -U "$PG_USER" -p "$PG_PORT" -d "$PG_BACKEND_DB" \
        -c "GRANT ALL PRIVILEGES ON SCHEMA public TO $PG_BACKEND_USER;"

    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" \
      -v "$DUMP_FILE:/dump.pgsql" \
      pgvector/pgvector:pg17 \
      pg_restore -h "$PG_HOST" -U "$PG_USER" -p "$PG_PORT" -d "$PG_BACKEND_DB" --no-owner --role="$PG_BACKEND_USER"  "/dump.pgsql"

}

### ================================
###  Ablauf
### ================================

restore_dev_db

echo "### Fertig! ###"
