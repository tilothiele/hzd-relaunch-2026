In der `.htacces` Datei muss dieser Block nach dem Einspielen des Backup auskommentiert sein:

```
##### Redirect non-www to www -- BEGIN^M
#RewriteCond %{HTTP_HOST} !^www\. [NC]^M
#RewriteCond %{HTTPS}>s ^(on>(s)|.*>s)$^M
#RewriteRule ^(.*)$ http%2://www.%{HTTP_HOST}/$1 [R=301,L]^M
##### Redirect non-www to www -- END^M
```