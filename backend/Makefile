# Makefile für HZD Backend Docker-Images

# Variablen
DOCKER_HUB_USERNAME ?= your-username
IMAGE_NAME = hzd-backend
VERSION ?= latest
DOCKERFILE = Dockerfile
BUILD_TARGET = production

# Vollständiger Image-Name
IMAGE_FULL = $(DOCKER_HUB_USERNAME)/$(IMAGE_NAME):$(VERSION)
IMAGE_LATEST = $(DOCKER_HUB_USERNAME)/$(IMAGE_NAME):latest

.PHONY: help build tag push build-push login clean docker-compose-up docker-compose-down docker-compose-logs

# Standard-Ziel: Zeige Hilfe
help:
	@echo "Verfügbare Befehle:"
	@echo "  make build              - Baue Docker-Image"
	@echo "  make tag                - Tagge Image mit Version"
	@echo "  make push               - Pushe Image zu Docker Hub"
	@echo "  make build-push         - Baue und pushe Image"
	@echo "  make login              - Login zu Docker Hub"
	@echo "  make clean              - Entferne lokale Images"
	@echo "  make docker-compose-up  - Starte Services mit docker-compose"
	@echo "  make docker-compose-down - Stoppe Services"
	@echo "  make docker-compose-logs - Zeige Logs"
	@echo ""
	@echo "Variablen:"
	@echo "  DOCKER_HUB_USERNAME - Docker Hub Benutzername (Standard: $(DOCKER_HUB_USERNAME))"
	@echo "  VERSION             - Image Version/Tag (Standard: $(VERSION))"

# Baue Docker-Image
build:
	@echo "Baue Docker-Image: $(IMAGE_FULL)"
	docker build \
		--target $(BUILD_TARGET) \
		-t $(IMAGE_FULL) \
		-t $(IMAGE_LATEST) \
		-f $(DOCKERFILE) \
		.

# Tagge Image (zusätzlich zur Version auch als latest)
tag: build
	@echo "Tagge Image: $(IMAGE_FULL) -> $(IMAGE_LATEST)"
	docker tag $(IMAGE_FULL) $(IMAGE_LATEST)

# Login zu Docker Hub
login:
	@echo "Login zu Docker Hub..."
#	docker login -u $(DOCKER_HUB_USERNAME)

# Pushe Image zu Docker Hub
push: login
	@echo "Pushe Image zu Docker Hub: $(IMAGE_FULL)"
	docker push $(IMAGE_FULL)
	@if [ "$(VERSION)" != "latest" ]; then \
		echo "Pushe auch latest Tag: $(IMAGE_LATEST)"; \
		docker push $(IMAGE_LATEST); \
	fi

# Baue und pushe Image in einem Schritt
build-push: build tag push
	@echo "Build und Push abgeschlossen: $(IMAGE_FULL)"

# Entferne lokale Images
clean:
	@echo "Entferne lokale Images..."
	-docker rmi $(IMAGE_FULL) 2>/dev/null || true
	-docker rmi $(IMAGE_LATEST) 2>/dev/null || true

# Docker Compose Befehle
docker-compose-up:
	@echo "Starte Services mit docker-compose..."
	docker-compose up -d

docker-compose-down:
	@echo "Stoppe Services..."
	docker-compose down

docker-compose-logs:
	@echo "Zeige Logs..."
	docker-compose logs -f

docker-compose-restart:
	@echo "Starte Services neu..."
	docker-compose restart

# Prüfe ob DOCKER_HUB_USERNAME gesetzt ist
check-username:
	@if [ "$(DOCKER_HUB_USERNAME)" = "your-username" ]; then \
		echo "FEHLER: DOCKER_HUB_USERNAME muss gesetzt werden!"; \
		echo "Verwendung: make build-push DOCKER_HUB_USERNAME=dein-username"; \
		exit 1; \
	fi

# Build mit Username-Prüfung
build-safe: check-username build

# Push mit Username-Prüfung
push-safe: check-username push

# Build-Push mit Username-Prüfung
build-push-safe: check-username build-push




