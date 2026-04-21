#!/bin/bash

# Sichert die S3-Buckets vom Produktions-Server

# sync von einem remote s3 bucket zu einem anderen remote s3 bucket
function backup_s3_bucket() {
    local src_bucket="$1"
    local dst_path="$2"

    rclone sync "s:${src_bucket}" "backup-ssh:${dst_path}" \
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

backup_s3_bucket "tik" "backup-tik"
#backup_s3_bucket "hzd-opencloud" "backup-opencloud"
#backup_s3_bucket "hzd-backup" "backup-backup"
#backup_s3_bucket "hzd-mailarchive" "backup-mailarchive"