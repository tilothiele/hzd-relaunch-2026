#!/bin/bash
set -euo pipefail

#############################################
# 0. .env laden
#############################################

if [ ! -f ".env" ]; then
  echo "Fehler: .env Datei nicht gefunden!"
  exit 1
fi

set -o allexport
source .env
set +o allexport

#############################################
# 1. Basisvariablen
#############################################

BACKUP_DATE=$(date +%F)
WORKDIR="/tmp/joomla_backup_${BACKUP_DATE}"
ARCHIVE_NAME="joomla_backup_${BACKUP_DATE}.tar.gz"

mkdir -p "${WORKDIR}"
chmod 700 "${WORKDIR}"

echo "=== Starte Backup für ${BACKUP_DATE} ==="

#############################################
# 2. Dateibaum per SCP sichern
#############################################

echo "-> Sichere Dateibaum per SCP..."

sshpass -p ${JOOMLA_WEBSITE_SSH_PASS} scp -r \
  -P "${JOOMLA_WEBSITE_SSH_PORT}" \
  "${JOOMLA_WEBSITE_SSH_USER}@${JOOMLA_WEBSITE_HOST}:${JOOMLA_WEBSITE_DIR}" \
  "${WORKDIR}/files"

#############################################
# 3. MySQL Dump erstellen
#############################################

echo "-> Erstelle MySQL Dump..."

docker run --rm \
  mysql:8 \
  sh -c "
    mysqldump \
      --single-transaction \
      --skip-lock-tables \
      --quick \
      -h ${JOOMLA_WEBSITE_MYSQL_HOST} \
      -P ${JOOMLA_WEBSITE_MYSQL_PORT} \
      -u ${JOOMLA_WEBSITE_MYSQL_USER} \
      -p${JOOMLA_WEBSITE_MYSQL_PASS} \
      ${JOOMLA_WEBSITE_MYSQL_DB}
  " > "${WORKDIR}/db.sql"

#############################################
# 4. Gesamtarchiv erzeugen
#############################################

echo "-> Erstelle Gesamtarchiv..."

tar czf "${ARCHIVE_NAME}" -C "${WORKDIR}" .

#############################################
# 5. Upload nach S3
#############################################

echo "-> Lade Backup zu S3 hoch..."

docker run --rm \
  -e AWS_ACCESS_KEY_ID="${S3_TARGET_ACCESS_KEY}" \
  -e AWS_SECRET_ACCESS_KEY="${S3_TARGET_SECRET_KEY}" \
  -e AWS_DEFAULT_REGION="${S3_TARGET_REGION}" \
  -v "$(pwd):/data" \
  amazon/aws-cli:latest \
  s3 cp "/data/${ARCHIVE_NAME}" \
  "s3://${S3_TARGET_BUCKET}/${ARCHIVE_NAME}" \
  --endpoint-url "${S3_TARGET_ENDPOINT}"

#############################################
# 6. Alte Backups (>7 Tage) löschen
#############################################

echo "-> Lösche Backups älter als 7 Tage..."

docker run --rm \
  -e AWS_ACCESS_KEY_ID="${S3_TARGET_ACCESS_KEY}" \
  -e AWS_SECRET_ACCESS_KEY="${S3_TARGET_SECRET_KEY}" \
  -e AWS_DEFAULT_REGION="${S3_TARGET_REGION}" \
  amazon/aws-cli:latest \
  s3 ls "s3://${S3_TARGET_BUCKET}/" \
  --endpoint-url "${S3_TARGET_ENDPOINT}" \
  | awk '{print $4}' \
  | grep "joomla_backup_" \
  | while read -r file; do
      FILE_DATE=$(echo "$file" | grep -o '[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}')
      if [[ -n "$FILE_DATE" ]] && \
         [[ $(date -d "$FILE_DATE" +%s) -lt $(date -d "7 days ago" +%s) ]]; then
        docker run --rm \
          -e AWS_ACCESS_KEY_ID="${S3_TARGET_ACCESS_KEY}" \
          -e AWS_SECRET_ACCESS_KEY="${S3_TARGET_SECRET_KEY}" \
          -e AWS_DEFAULT_REGION="${S3_TARGET_REGION}" \
          amazon/aws-cli:2 \
          s3 rm "s3://${S3_TARGET_BUCKET}/$file" \
          --endpoint-url "${S3_TARGET_ENDPOINT}"
      fi
    done

#############################################
# 7. Cleanup
#############################################

rm -rf "${WORKDIR}"
rm -f "${ARCHIVE_NAME}"

echo "=== Backup erfolgreich abgeschlossen ==="
