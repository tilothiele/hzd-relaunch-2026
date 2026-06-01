# syntax=docker/dockerfile:1

##
# HZD Importer – Quarkus JVM-Image (Multi-Stage)
#
# Build:
#   make build IMAGE_TAG=1.0.0
# Push:
#   make push IMAGE_REGISTRY=registry.example.com/hzd IMAGE_TAG=1.0.0
##

ARG IMAGE_TAG=latest

FROM eclipse-temurin:21-jdk AS build

WORKDIR /build

COPY gradlew gradlew.bat ./
COPY gradle gradle
COPY build.gradle settings.gradle gradle.properties ./

RUN chmod +x gradlew \
	&& ./gradlew --version --no-daemon

COPY src src

RUN ./gradlew build -x test --no-daemon \
	-Dquarkus.profile=prod

FROM registry.access.redhat.com/ubi9/openjdk-21-runtime:1.21

ARG IMAGE_TAG=latest

LABEL org.opencontainers.image.title="hzd-importer" \
	org.opencontainers.image.version="${IMAGE_TAG}" \
	org.opencontainers.image.description="HZD Chromosoft CSV Importer (Quarkus)"

ENV LANGUAGE='en_US:en' \
	QUARKUS_PROFILE=prod \
	QUARKUS_HTTP_HOST=0.0.0.0 \
	JAVA_OPTS_APPEND="-Djava.util.logging.manager=org.jboss.logmanager.LogManager" \
	JAVA_APP_JAR="/deployments/quarkus-run.jar"

COPY --from=build --chown=185 /build/build/quarkus-app/lib/ /deployments/lib/
COPY --from=build --chown=185 /build/build/quarkus-app/*.jar /deployments/
COPY --from=build --chown=185 /build/build/quarkus-app/app/ /deployments/app/
COPY --from=build --chown=185 /build/build/quarkus-app/quarkus/ /deployments/quarkus/

EXPOSE 8081

USER 185

ENTRYPOINT ["/opt/jboss/container/java/run/run-java.sh"]
