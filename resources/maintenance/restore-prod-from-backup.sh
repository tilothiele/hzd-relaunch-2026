#!/bin/bash
set -euo pipefail

### ================================
###  Einstellungen anpassen
### ================================

# Container-Namen
CONTAINERS=("hzd-frontend-prod" "hzd-backend-prod")

# PostgreSQL
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

. $SCRIPT_DIR/.env

# Volumes/Verzeichnisse
VOL_NAME_PA1="iws80ks8w8g8ckogs84gggsw-hzd-strapi-prod"

VOL_PA1="/var/lib/docker/volumes/$VOL_NAME_PA1/_data"

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

create_db() {
    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" --network "$PG_NETWORK" \
      pgvector/pgvector:pg17 \
      psql -h "$PG_HOST" -U "$PG_USER" \
        -c "create DATABASE $PG_PROD_DB;"
}

create_user() {
    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" --network "$PG_NETWORK" \
      pgvector/pgvector:pg17 \
      psql -h "$PG_HOST" -U "$PG_USER" \
        -c "create user $PG_PROD_USER with password '$PG_PROD_PASSWD';"


}

restore_prod_db() {
    echo "--- Prod-DB leeren und Import durchführen ---"
    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" --network "$PG_NETWORK" \
      pgvector/pgvector:pg17 \
      psql -h "$PG_HOST" -U "$PG_USER" -d "$PG_PROD_DB" \
        -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" --network "$PG_NETWORK" \
      pgvector/pgvector:pg17 \
      psql -h "$PG_HOST" -U "$PG_USER" -d "$PG_PROD_DB" \
        -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO $PG_PROD_USER;"

    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" --network "$PG_NETWORK" \
      pgvector/pgvector:pg17 \
      psql -h "$PG_HOST" -U "$PG_USER" -d "$PG_PROD_DB" \
        -c "GRANT ALL PRIVILEGES ON SCHEMA public TO $PG_PROD_USER;"

    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" --network "$PG_NETWORK" \
      -v "$DUMP_FILE:/dump.pgsql" \
      pgvector/pgvector:pg17 \
      pg_restore -h "$PG_HOST" -U "$PG_USER" -d "$PG_PROD_DB" --no-owner --role="$PG_PROD_USER"  "/dump.pgsql"

}

copy_volume() {
    src=$1
    dst=$2

    echo "--- Volume kopieren: $src → $dst ---"
    rsync -a --delete "$src/" "$dst/"
}

### ================================
###  Ablauf
### ================================

read -rp "Wollen Sie wirklich die aktuellen Produktivdaten überschreiben - kann zu kompletten Datenverlust führen? (j/n): " antwort

if [[ "$antwort" == "j" || "$antwort" == "J" ]]; then
    echo "Aktion wird ausgeführt..."
else
    echo "Abgebrochen."
    exit 1
fi

stop_containers
#create_db
#create_user
restore_prod_db
copy_volume "$VOL_PA1" "$VOL_SA1"
start_containers

echo "### Fertig! ###"
