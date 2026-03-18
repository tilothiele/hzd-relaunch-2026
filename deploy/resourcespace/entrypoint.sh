#!/bin/bash

# Start cron service
service cron start

# Ensure daily cron jobs are executable
chmod +x /etc/cron.daily/*

envsubst '${MYSQL_HOST} ${MYSQL_USER} ${MYSQL_PASS} ${MYSQL_DB} ${SERVICE_URL_RESOURCESPACE} ${EMAIL_NOTIFY} ${EMAIL_FROM} ${SCRAMBLE_KEY} ${API_SCRAMBLE_KEY}' < /config.php.template > /var/www/html/include/config.php

# Start Apache in the foreground (keeps the container alive)
apachectl -D FOREGROUND