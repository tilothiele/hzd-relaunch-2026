#!/bin/bash

# Sichert die S3-Buckets vom Produktions-Server

SRC_ALIAS="hzd-backend-prod"
DST_ALIAS="backup"

# sync von einem remote s3 bucket zu einem anderen remote s3 bucket
function backup_s3_bucket() {
    local src_bucket="$1"
    local dst_bucket="$2"

    rclone sync src:bucket dst:bucket \
    --checksum \
    --slow-hash-sync-only \
    --delete-after \
    --track-renames \
    --transfers 4 \
    --checkers 8 \
    --retries 10 \
    --low-level-retries 20 \
    --log-file rclone.log \
    --log-level INFO \
    --stats 30s
}

backup_s3_bucket "hzd-backend-prod" "backup" "hzd-backend-prod.tar.gz"
backup_s3_bucket "hzd-frontend-prod" "backup" "hzd-frontend-prod.tar.gz"
backup_s3_bucket "hzd-backend-staging" "backup" "hzd-backend-staging.tar.gz"
backup_s3_bucket "hzd-frontend-staging" "backup" "hzd-frontend-staging.tar.gz"