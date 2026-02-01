#!/bin/bash
#
# Dieser Job wird per crontab aufgerufen und sichert den (produktiven) Datenstand
#
# Einstellungen der credentials müssen in der Datei .env vorgenommen werden
#

SECONDS=0

BASE_DIR="/home/kyno/backups"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

. $SCRIPT_DIR/.env


pg_dump_docker() {
    local dbname="$1"
    local container="postgres"
    local dumpfile="${dbname}_$(date +%F).sql"
    echo "--- DB dump durchführen ---"
    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" --network "$PG_NETWORK" \
      -v $BASE_DIR:/transfer \
      pgvector/pgvector:pg17 \
      pg_dump -h "$PG_HOST" -U "$PG_USER" -d "$dbname" -Fc -f "/transfer/$dumpfile"
}

backup_volumes_offen() {
    local target_remote="$1"  # z.B. user@remotehost:/remote/backup
    shift                      # die restlichen Parameter sind Volumes
    local volumes=("$@")

    if [[ -z "$target_remote" || "${#volumes[@]}" -eq 0 ]]; then
        echo "Usage: backup_volumes_offen <user@host:/path> <volume1> [volume2 ...]"
        return 1
    fi

    for vol in "${volumes[@]}"; do
        echo "Starte Backup für Volume: $vol nach $target_remote"

	if [[ "$vol" == /* ]]; then
        	# Wert beginnt mit / → alle / durch - ersetzen und "dir" davor
        	local prefix="dir${vol//\//-}"
    	else
        	# Sonst "vol-" davor
        	local prefix="vol-$vol"
    	fi

        docker run --rm \
            -v "$vol:/backup/data:ro" \
	    -e SSH_HOST_NAME="$STORAGEBOX_HOST" \
	    -e SSH_PORT="$STORAGEBOX_PORT" \
	    -e SSH_REMOTE_PATH="$STORAGEBOX_DIR" \
	    -e SSH_USER="$STORAGEBOX_USER" \
	    -e SSH_PASSWORD="$STORAGEBOX_PASSWORD" \
	    -e BACKUP_RETENTION_DAYS="10" \
	    -e BACKUP_FILENAME="hzd-backup-%Y-%m-%dT%H-%M-%S-$prefix.{{ .Extension }}" \
	    --entrypoint backup \
            offen/docker-volume-backup:latest 

        if [[ $? -ne 0 ]]; then
            echo "Fehler beim Backup von $vol"
        else
            echo "Backup von $vol erfolgreich"
        fi
    done

    echo "Alle Backups abgeschlossen."
}

mkdir -p $BASE_DIR
rm -rf "$BASE_DIR/*"

pg_dump_docker $PG_PROD_DB
pg_dump_docker kestra
pg_dump_docker hzd_dolibarr_prod
backup_volumes_offen "backups" "ts0k4g80gcgw4s0g804gow8w-hzd-dolibarr-prod-documents" "iws80ks8w8g8ckogs84gggsw-hzd-strapi-prod" "$BASE_DIR"


# Minuten und Sekunden berechnen
minutes=$((SECONDS / 60))
seconds=$((SECONDS % 60))

echo "Verstrichene Zeit: ${minutes}m ${seconds}s"
