# Wie spiele ich die alte Joomla-Website auf den Kyno Server ein?

Siehe `/deploy/legacy-joomla/docker-compose.yml`

1. .env erstellen mit Einstellungen des alten Hetzner Servers:

JOOMLA_WEBSITE_HOST=
JOOMLA_WEBSITE_SSH_PORT=
JOOMLA_WEBSITE_SSH_USER=
JOOMLA_WEBSITE_SSH_PASS=
JOOMLA_WEBSITE_DIR=
JOOMLA_WEBSITE_MYSQL_HOST=
JOOMLA_WEBSITE_MYSQL_PORT=
JOOMLA_WEBSITE_MYSQL_DB=
JOOMLA_WEBSITE_MYSQL_USER=
JOOMLA_WEBSITE_MYSQL_PASS=

2. backup durchführen: `./backup-joomla-website.sh`

3. db dump lokal einspielen: `docker cp /tmp/joomla_backup_2026-10-17/db.sql gssgosw8osko8gko4kgosc0g:/tmp`
   `docker exec -it gssgosw8osko8gko4kgosc0g bash`
   im container:
   `mariadb -p joomla_website < /tmp/db.sql`
   das root password mit `env` herausfinden.

4. Volume restore:
   `cd docker-volumes/joomla-website/`
   `sudo tar xzfp /tmp/joomla_backup_2026-10-17/files.tar.gz`

   Der Ordner muss 1010:1010 gehören.

5. `.htaccess` anpassen: Diese Zeilen müssen auskommentiert sein:

```
#RewriteCond %{HTTP_HOST} !^www\. [NC]
#RewriteCond %{HTTPS}>s ^(on>(s)|.*>s)$
#RewriteRule ^(.*)$ http%2://www.%{HTTP_HOST}/$1 [R=301,L]
```

6. In Coolify den Dienst 'HZD Joomla Website' starten bzw. deployen.