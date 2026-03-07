#!/bin/bash
set -e

DB_CONFIG_FILE="/usr/src/redmine/config/database.yml"
envsubst < /database.yml.template > "$DB_CONFIG_FILE"

CONFIG_FILE="/usr/src/redmine/config/configuration.yml"
envsubst < /configuration.yml.template > "$CONFIG_FILE"

RECEIVE_IMAP_FILE="/usr/src/redmine/receive_imap.sh"
envsubst < /receive_imap.sh.template > "$RECEIVE_IMAP_FILE"
chmod +x "$RECEIVE_IMAP_FILE"

CMD="* * * * * /bin/bash /usr/src/redmine/receive_imap.sh >> /home/redmine/cron.log 2>&1"
crontab -u redmine -l 2>/dev/null | { cat; echo "$CMD"; } | crontab -u redmine -

service cron start

cd /usr/src/redmine || exit 1
bundle exec rake db:migrate RAILS_ENV=production
bundle exec rake redmine:plugins:migrate RAILS_ENV=production

exec "$@"

