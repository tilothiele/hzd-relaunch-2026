# Dockerfile für Kestra Standalone Server

# Base Image: OpenJDK 17
FROM eclipse-temurin:17-jdk-jammy

# Arbeitsverzeichnis erstellen
WORKDIR /kestra

# Environment Variablen
ARG KESTRA_VERSION=1.9.6
ENV KESTRA_VERSION=${KESTRA_VERSION}
ENV JAVA_OPTS="-Xms512m -Xmx2g"

# Kestra JAR herunterladen
RUN apt-get update && apt-get install -y curl && \
    curl -L -o kestra.jar https://github.com/kestra-io/kestra/releases/download/v${KESTRA_VERSION}/kestra-server-${KESTRA_VERSION}.jar && \
    chmod +x kestra.jar && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Standalone Config
# Optional: Standard-Konfiguration kann hier gemountet werden
VOLUME ["/kestra/config", "/kestra/data"]

# Expose Ports
EXPOSE 8080

# Entrypoint / Startparameter
# Standalone-Modus: embedded H2 DB, alle Worker lokal
ENTRYPOINT ["java", "-jar", "kestra.jar", "server", "--spring.config.location=file:/kestra/config/application.yml"]

# Standard CMD (optional) – überschreibbar durch Docker-Run
CMD ["--server.port=8080", "--kestra.storage.path=/kestra/data"]
