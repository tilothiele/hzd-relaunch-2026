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
    local base_dir="$1"
    local dbname="$2"
    # Optional: 3. Argument = Dateiname unter base_dir (Default: ${dbname}_$(date +%F).sql)
    local dumpfile="${3:-"${dbname}_$(date +%F).sql"}"
    echo "--- PGSQL dump durchführen ---"
    docker run --rm -it -e PGPASSWORD="$PG_PASSWORD" --network "$PG_NETWORK" \
      -v "$base_dir:/transfer" \
      pgvector/pgvector:pg17 \
      pg_dump -h "$PG_HOST" -U "$PG_USER" -d "$dbname" -Fc -f "/transfer/$dumpfile"
}

mysql_dump_docker() {
    local base_dir="$1"
    local dbname="$2"
    local dumpfile="${dbname}_$(date +%F).sql"
    local mysql_port="${MYSQL_PORT:-3306}"
    echo "--- MySQL dump durchführen ---"
    docker run --rm -it -e MYSQL_PWD="$MYSQL_PASSWORD" --network "$MYSQL_NETWORK" \
      -v "$base_dir:/transfer" \
      mysql:8 \
      sh -c "mysqldump --single-transaction --skip-lock-tables --quick -h \"$MYSQL_HOST\" -P \"$mysql_port\" -u \"$MYSQL_USER\" \"$dbname\" > \"/transfer/$dumpfile\""
}

# Sichert benannte Docker-Volumes als .tgz unter base_dir.
# Aufruf: backup_volumes <base_dir> <container1> [...] -- <volume1> [...]
# (Container- und Volume-Liste durch -- getrennt; eine Seite darf leer sein:
#  nur Volumes: backup_volumes "$DIR" -- vol1 vol2)
backup_volumes() {
	local base_dir="$1"
	shift
	local containers=()
	while [[ $# -gt 0 && "$1" != "--" ]]; do
		containers+=("$1")
		shift
	done
	if [[ "${1:-}" == "--" ]]; then
		shift
	fi
	local volumes=("$@")

	_bv_ensure_start() {
		trap - RETURN
		if [[ ${#containers[@]} -eq 0 ]]; then
			echo "(Keine Container — überspringe Start.)"
			return 0
		fi
		echo "--- Container starten ---"
		for c in "${containers[@]}"; do
			echo "Starte Container: $c"
			docker start "$c" || echo "Warnung: docker start $c fehlgeschlagen" >&2
		done
	}
	trap '_bv_ensure_start' RETURN

	mkdir -p "$base_dir"
	echo "Volume-Backup: Zielverzeichnis $base_dir"

	if [[ ${#containers[@]} -eq 0 ]]; then
		echo "(Keine Container — überspringe Stopp.)"
	else
		echo "--- Container stoppen ---"
		for c in "${containers[@]}"; do
			echo "Stoppe Container: $c"
			docker stop "$c" || echo "Warnung: docker stop $c fehlgeschlagen" >&2
		done
	fi

	if [[ ${#volumes[@]} -eq 0 ]]; then
		echo "(Keine Volumes — überspringe Archivierung.)"
	else
		echo "--- Volume-Backups (.tgz) ---"
		for vol in "${volumes[@]}"; do
			echo "Starte Backup für Volume: $vol (Ziel: $base_dir)"

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
	fi
}


mkdir -p $BASE_DIR
rm -rf "$BASE_DIR/*"

# Website (Dump-Dateiname einmal festlegen, an pg_dump + backup_volumes)
dump_file="${PG_PROD_DB}_$(date +%F).sql"
pg_dump_docker "$BASE_DIR" "$PG_PROD_DB" "$dump_file"
backup_volumes "$BASE_DIR" \
	"hzd-backend-prod" "hzd-frontend-prod" -- \
	"$BASE_DIR/$dump_file" \
	"iws80ks8w8g8ckogs84gggsw-hzd-strapi-prod" \
	"kyno-backup-volume"

# Vaultwarden
backup_volumes "$BASE_DIR" \
    "vaultwarden-e0c4woggs40w4swo8w0kcw48-122151023460" \
    -- \
    "e0c4woggs40w4swo8w0kcw48_vaultwarden-data"

# n8n
backup_volumes "$BASE_DIR" \
    "n8n-ikcc8gsgcco4o84oscsoss08" \
    -- \
    "ikcc8gsgcco4o84oscsoss08_n8n-data"


# Minuten und Sekunden berechnen
minutes=$((SECONDS / 60))
seconds=$((SECONDS % 60))

echo "Verstrichene Zeit: ${minutes}m ${seconds}s"
