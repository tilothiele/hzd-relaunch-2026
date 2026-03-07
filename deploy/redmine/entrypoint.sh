#!/bin/bash
set -e

DB_CONFIG_FILE="/usr/src/redmine/config/database.yml"

envsubst < /database.yml.template > "$DB_CONFIG_FILE"

CONFIG_FILE="/usr/src/redmine/config/configuration.yml"

envsubst < /configuration.yml.template > "$CONFIG_FILE"

CMD="* * * * * /bin/bash /usr/src/redmine/receive_imap.sh >> /var/log/cron.log 2>&1"
crontab -u redmine -l 2>/dev/null | { cat; echo "$CMD"; } | crontab -u redmine -

service cron start

exec "$@"

