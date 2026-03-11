#!/bin/bash

# Start cron service
service cron start

# Ensure daily cron jobs are executable
chmod +x /etc/cron.daily/*

envsubst < /config.php.template > /var/www/html/include/config.php

# Start Apache in the foreground (keeps the container alive)
apachectl -D FOREGROUND