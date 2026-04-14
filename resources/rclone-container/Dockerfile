FROM rclone/rclone:latest

# envsubst bereitstellen
RUN apk add --no-cache gettext

# Arbeitsverzeichnis
WORKDIR /app

# Template + Entrypoint
COPY rclone.conf.template /app/rclone.conf.template
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]