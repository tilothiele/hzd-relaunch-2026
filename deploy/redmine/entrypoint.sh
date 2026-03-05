#!/bin/bash
set -e

DB_CONFIG_FILE="/usr/src/redmine/config/database.yml"

envsubst < /database.yml.template > "$DB_CONFIG_FILE"

CONFIG_FILE="/usr/src/redmine/config/configuration.yml"

envsubst < /configuration.yml.template > "$CONFIG_FILE"

exec "$@"