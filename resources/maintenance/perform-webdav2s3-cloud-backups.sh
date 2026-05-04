#!/usr/bin/env bash

set -euo pipefail

BASE_DIR="/home/kyno/backups"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

. $SCRIPT_DIR/.env

#
# Requirements:
#   - rclone installed
#   - configured:
#       * 20 WebDAV remotes
#       * 1 S3 remote
#
# Example remotes:
#   webdav01:
#   webdav02:
#   ...
#   webdav20:
#
# S3 remote:
#   backup-s3:
#

############################################
# CONFIG
############################################

BACKUP_REMOTE="hzd-cloud-backup"

LOCAL_LOG_DIR="~/webdav-sync"
TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"

WEBDAV_REMOTES=(
  ro-Bearbeitung_Projektleitung     # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$97f982eb-97e9-47ad-8b92-3888fa42f063
  ro-Daten_HZD_NAS_1                # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$40ec5a35-58a3-4a1c-93cd-5619e8047e87
  ro-DR-Stelle                      # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$bbb4d3a5-f7a1-4482-b681-da716bba1d50
  ro-Formulare_ab_2019_11_27        # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$5692ed49-6e5a-425f-abdd-8efad24336e3
  ro-Formulare_Vorlagen             # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$49977cb9-4d82-4872-bd37-4adc187e204c
  ro-GS-allgemeine-Daten            # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$3d9a89cd-d444-466e-a568-59d7a50e2276
  GS-HZD-Verwaltung-Mitglieder   # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$0111f73b-61be-44a3-b1fb-612d636b9ade
  ro-Hovi-Kosmos                    # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$05e6403e-01a5-444f-af1f-48fa55edc7a6
  ro-IT-Administration              # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$4f1889fb-10ef-47d8-b761-1c9e592fa12b
  ro-Körmeister                     # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$33f68003-4396-4375-87d8-dc23c4a32267
  ro-Medlestelle-Nord               # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$aca30546-b56a-463c-bd8e-07f26f3c3462
  ro-Neue_Website                   # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$d4334100-c7bb-4f31-b864-58cb44b2c8e2
  ro-Photobox                       # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$215d15cc-e752-404b-980d-f3fc61280341
  ro-Präsidium                      # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$3cf895dc-4e42-44bc-8cf1-9c6887e3aec1
  ro-RG-Mitte                       # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$7febd358-518d-4b0f-b0f4-e7479cfb1102
  ro-RG-Nord                        # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$3f2489c9-363d-40e3-a094-284dcbfbae5c
  ro-RG-Süd                         # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$65506787-e1ce-4d98-82ec-24d6b3c1c3ec
  ro-RG-West                        # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$de6df07b-6b2a-4b34-9165-d34e1912cbf2
  ro-RG-Ost                         # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$fddac1f3-2b58-4ab5-b683-07eb126c050c
  ro-Thale                          # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$78daf375-2c93-4b7f-bd4b-c923b729cadb
  ro-Tierschutz                     # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$e8443daf-b15c-481f-8fa7-f715408ee4c6
  ro-TIK                            # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$18d59676-76a9-4033-b45e-1d6cc14c84ae
  ro-Upload_Formulare               # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$34bb2c80-55a9-45a4-96e7-4b6f22bcbbbd
  ro-Vereinszeitschrift_Bearbeitung # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$ba671174-0863-4538-93e4-eb000e09f6f0
  ro-Verlag_Fertigstellung          # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$9f551954-39e8-4fe5-88f5-71720c1867e6
  ro-Zuchtbuchstelle                # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$f3b32eca-f118-40d8-9137-4c163ba20c99
  ro-Zuchtleitung                   # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$1fed0da0-07bb-45b7-b5d0-d6606c5b08fc
  ro-Zuchtwarte                     # https://cloud.hovawarte.com/remote.php/dav/spaces/8d37af2e-7780-4753-8efe-d283556216cc$8528036c-a9d3-475d-9dd3-8d69d9d49bf4
)

############################################
# PREPARE
############################################

mkdir -p "${LOCAL_LOG_DIR}"

echo "========================================"
echo "Starting sync: ${TIMESTAMP}"
echo "========================================"

############################################
# SYNC LOOP
############################################

for REMOTE in "${WEBDAV_REMOTES[@]}"; do

    echo
    echo "----------------------------------------"
    echo "Syncing ${REMOTE}"
    echo "----------------------------------------"

    LOGFILE="${LOCAL_LOG_DIR}/${REMOTE}_${TIMESTAMP}.log"

    #
    # Destination layout:
    #
    # s3://bucket/central-backup/webdav01/
    # s3://bucket/central-backup/webdav02/
    #

    DESTINATION="${BACKUP_REMOTE}:/${REMOTE}"

    rclone sync "${REMOTE}:" "${DESTINATION}" \
        --create-empty-src-dirs \
        --fast-list \
        --transfers=8 \
        --checkers=16 \
        --multi-thread-streams=4 \
        --log-file="${LOGFILE}" \
        --log-level INFO \
        --stats 30s \
        --stats-one-line \
        --retries 5 \
        --low-level-retries 10 \
        --timeout 10m \
        --contimeout 30s \
        --ignore-errors

    EXIT_CODE=$?

    if [[ ${EXIT_CODE} -eq 0 ]]; then
        echo "[OK] ${REMOTE}"
    else
        echo "[FAILED] ${REMOTE} (exit=${EXIT_CODE})"
    fi

done

echo
echo "========================================"
echo "All sync jobs finished"
echo "========================================"