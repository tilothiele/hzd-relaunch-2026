#!/bin/bash
set -e

DB_CONFIG_FILE="/usr/src/redmine/config/database.yml"

envsubst < /database.yml.template > "$DB_CONFIG_FILE"

CONFIG_FILE="/usr/src/redmine/config/configuration.yml"

envsubst < /configuration.yml.template > "$CONFIG_FILE"

CMD="*/2 * * * * cd /usr/src/redmine && /usr/local/bin/bundle exec rake -f ./Rakefile redmine:email:receive_imap RAILS_ENV="production" host=$SUPPORT_MAIL_HOST username=$SUPPORT_MAIL_USERNAME password=\"$SUPPORT_MAIL_PASSWORD\" unknown_user=create project=support allow_override=from no_permission_check=1 no_account_notice=1"
crontab -u redmine -l 2>/dev/null | { cat; echo "$CMD"; } | crontab -u redmine -

service cron start

exec "$@"

