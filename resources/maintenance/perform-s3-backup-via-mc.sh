#!/usr/bin/env bash
set -euo pipefail

# # mc installieren (falls nicht vorhanden)
# curl -O https://dl.min.io/client/mc/release/linux-amd64/mc
# chmod +x mc
# sudo mv mc /usr/local/bin/

# # Aliases konfigurieren (einmalig)
# mc alias set s https://SOURCE-ENDPOINT ACCESS_KEY SECRET_KEY
# mc alias set t https://TARGET-ENDPOINT ACCESS_KEY SECRET_KEY

# Der Zugriff auf s (Source) sollte nur lesend erfolgen
# Der Zugriff auf t (Target) muss schreibend erfolgen

# Konfiguration der Buckets, die synchronisiert werden sollen
PAIRS=(
# Source               Destination (target)
  "hzd-opencloud       hzd-opencloud"
  "hzd-backup          hzd-backup"
  "hzd-mailarchive     hzd-mailarchive"
)

# Optional: Parallelität (Default: Anzahl CPU Kerne)
JOBS="${JOBS:-4}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

mirror_pair() {
  local SRC_BUCKET="$1"
  local DST_BUCKET="$2"

  log "Starte Sync: s/${SRC_BUCKET} -> t/${DST_BUCKET}"

  # Bucket sicherstellen (idempotent)
  mc mb --ignore-existing "t/${DST_BUCKET}"

  # Mirror:
  # --overwrite       = aktualisiert geänderte Objekte
  # --remove          = löscht Objekte im Ziel, die im Source fehlen (echtes Mirror)
  # --watch optional  = kontinuierlicher Sync (hier nicht genutzt)
  # --checksum        = prüft Integrität (langsamer, aber sicherer)
  # --preserve        = Metadaten behalten
  mc mirror \
    --overwrite \
    --remove \
    --checksum \
    --preserve \
    "s/${SRC_BUCKET}" \
    "t/${DST_BUCKET}"

  log "Fertig: ${SRC_BUCKET}"
}

export -f mirror_pair
export -f log

# Parallel ausführen
printf "%s\n" "${PAIRS[@]}" | xargs -n 2 -P "${JOBS}" bash -c 'mirror_pair "$@"' _

log "Alle Syncs abgeschlossen."