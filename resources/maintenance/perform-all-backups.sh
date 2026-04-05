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

set -euo pipefail

die() {
	echo "FEHLER: $*" >&2
	curl -H "X-Tags: stop_sign" -d "HZD Backup failed: $*" https://ntfy.emsgmbh-tt-homeoffice.srv64.de/backup
	exit 1
}

pg_dump_docker() {
    local base_dir="$1"
    local dbname="$2"
    # Optional: 3. Argument = Dateiname unter base_dir (Default: ${dbname}_$(date +%F).sql)
    local dumpfile="${3:-"db_dump_${dbname}_$(date +%F).sql"}"
    echo "--- PGSQL dump durchführen ---"
    docker run --rm -e PGPASSWORD="$PG_PASSWORD" --network "$PG_NETWORK" \
      -v "$base_dir:/transfer" \
      pgvector/pgvector:pg17 \
      pg_dump -h "$PG_HOST" -U "$PG_USER" -d "$dbname" -Fc -f "/transfer/$dumpfile" \
      || die "PostgreSQL-Dump fehlgeschlagen (Datenbank: $dbname)"
}

mysql_dump_docker() {
    local base_dir="$1"
    local dbname="$2"
    local dumpfile="${3:-"${dbname}_$(date +%F).sql"}"
    local mysql_port="${MYSQL_PORT:-3306}"
    echo "--- MySQL/MariaDB dump durchführen ---"
    # mariadb:11 liefert mariadb-dump (mysqldump fehlt oft im PATH); ohne sh -c,
    # damit nicht der Image-Entrypoint dazwischenfunkt.
    docker run --rm -e MYSQL_PWD="$MYSQL_PASSWORD" --network "$MYSQL_NETWORK" \
      -v "$base_dir:/transfer" \
      --entrypoint mariadb-dump \
      mariadb:11 \
      --single-transaction \
      --skip-lock-tables \
      --quick \
      -h "$MYSQL_HOST" \
      -P "$mysql_port" \
      -u "$MYSQL_USER" \
      --result-file="/transfer/$dumpfile" \
      "$dbname" \
      || die "MySQL/MariaDB-Dump fehlgeschlagen (Datenbank: $dbname)"
}

# Sichert benannte Docker-Volumes als .tgz unter base_dir.
# Aufruf: backup_application <base_dir> <container1> [...] -- <volume1> [...]
# (Container- und Volume-Liste durch -- getrennt; eine Seite darf leer sein:
#  nur Volumes: backup_application "$DIR" -- vol1 vol2)
backup_application() {
	local base_dir="$1"
	shift
    local prefix1="$1"
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
			docker start "$c" || die "docker start fehlgeschlagen: $c"
		done
	}
	trap '_bv_ensure_start' RETURN

	mkdir -p "$base_dir" || die "Zielverzeichnis anlegen fehlgeschlagen: $base_dir"
	echo "Volume-Backup: Zielverzeichnis $base_dir"

	if [[ ${#containers[@]} -eq 0 ]]; then
		echo "(Keine Container — überspringe Stopp.)"
	else
		echo "--- Container stoppen ---"
		for c in "${containers[@]}"; do
			echo "Stoppe Container: $c"
			docker stop "$c" || {
				trap - RETURN
				_bv_ensure_start
				die "docker stop fehlgeschlagen: $c"
			}
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
                local prefix="${prefix1}-dir${vol//\//-}"
            else
                # Sonst "vol-" davor
                local prefix="${prefix1}-vol-$vol"
            fi

            docker run --rm \
                -v "$vol:/backup/data:ro" \
                -e SSH_HOST_NAME="$STORAGEBOX_HOST" \
                -e SSH_PORT="$STORAGEBOX_PORT" \
                -e SSH_REMOTE_PATH="$STORAGEBOX_DIR/$prefix1" \
                -e SSH_USER="$STORAGEBOX_USER" \
                -e SSH_PASSWORD="$STORAGEBOX_PASSWORD" \
                -e BACKUP_RETENTION_DAYS="10" \
                -e BACKUP_FILENAME="hzd-backup-%Y-%m-%dT%H-%M-%S-$prefix.{{ .Extension }}" \
                --entrypoint backup \
                offen/docker-volume-backup:latest \
				|| {
					trap - RETURN
					_bv_ensure_start
					die "Volume-Backup fehlgeschlagen: $vol"
				}
			echo "Backup von $vol erfolgreich"
		done
	fi
}


mkdir -p "$BASE_DIR" || die "BASE_DIR anlegen fehlgeschlagen: $BASE_DIR"
shopt -s nullglob
rm -rf "${BASE_DIR}/"*
shopt -u nullglob

# Website
dump_file="website_db_dump_${PG_PROD_DB}_$(date +%F).sql"
pg_dump_docker "$BASE_DIR" "$PG_PROD_DB" "$dump_file"
backup_application "$BASE_DIR" "website" \
	"hzd-backend-prod" "hzd-frontend-prod" -- \
	"$BASE_DIR/$dump_file" \
	"iws80ks8w8g8ckogs84gggsw-hzd-strapi-prod"

# Redmine
dump_file="redmine_db_dump_$(date +%F).sql"
mysql_dump_docker "$BASE_DIR" "redmine" "$dump_file"
backup_application "$BASE_DIR" "redmine" \
	"redmine-ik4k40sg4ckg8cc0wc44k8sk-170948139091" -- \
	"$BASE_DIR/$dump_file" \
	"ik4k40sg4ckg8cc0wc44k8sk_redmine-files" \
	"ik4k40sg4ckg8cc0wc44k8sk_redmine-plugins" \
	"ik4k40sg4ckg8cc0wc44k8sk_redmine-themes"

# Paperless
dump_file="paperless_db_dump_$(date +%F).sql"
pg_dump_docker "$BASE_DIR" "paperless" "$dump_file"
backup_application "$BASE_DIR" "paperless" \
	"webserver-jsss8kkkgso40gww08wkws4s-122357838465" -- \
	"$BASE_DIR/$dump_file" \
	"jsss8kkkgso40gww08wkws4s_media" \
	"jsss8kkkgso40gww08wkws4s_data"

# Umami
dump_file="umami_db_dump_$(date +%F).sql"
pg_dump_docker "$BASE_DIR" "umami" "$dump_file"
backup_application "$BASE_DIR" "umami" \
	"umami" -- \
	"$BASE_DIR/$dump_file"

# OpenCloud
backup_application "$BASE_DIR" "opencloud" \
	"opencloud-qoksokw84wcsokkgokksww8c-132905742513" -- \
	"qoksokw84wcsokkgokksww8c_opencloud-config" \
	"qoksokw84wcsokkgokksww8c_opencloud-data"

# Vaultwarden
backup_application "$BASE_DIR" "vaultwarden" \
    "vaultwarden-e0c4woggs40w4swo8w0kcw48-122151023460" \
    -- \
    "e0c4woggs40w4swo8w0kcw48_vaultwarden-data"

# n8n
backup_application "$BASE_DIR" "n8n"\
    "n8n-ikcc8gsgcco4o84oscsoss08" \
    -- \
    "ikcc8gsgcco4o84oscsoss08_n8n-data"

# open-archiver
dump_file="mailarchiver_db_dump_$(date +%F).sql"
pg_dump_docker "$BASE_DIR" "mailarchiver" "$dump_file"
backup_application "$BASE_DIR" "open-archiver"\
    "open-archiver-yksggcgggsogcggococ8gco0-145130673346" \
    -- \
	"$BASE_DIR/$dump_file"



rm -rf "${BASE_DIR}/"*

# Minuten und Sekunden berechnen
minutes=$((SECONDS / 60))
seconds=$((SECONDS % 60))

echo "Verstrichene Zeit: ${minutes}m ${seconds}s"

curl -H "X-Tags: ok"        -d "HZD Backup finished" https://ntfy.emsgmbh-tt-homeoffice.srv64.de/backup
