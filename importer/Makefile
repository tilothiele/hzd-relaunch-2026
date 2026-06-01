# Makefile für das HZD-Importer Docker-Image

IMAGE_NAME ?= hzd-importer
IMAGE_REGISTRY ?=
IMAGE_TAG ?= latest
DOCKERFILE ?= Dockerfile

ifneq ($(strip $(IMAGE_REGISTRY)),)
IMAGE := $(IMAGE_REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)
else
IMAGE := $(IMAGE_NAME):$(IMAGE_TAG)
endif

.PHONY: help build push build-push login clean check-image-tag

help:
	@echo "Verfügbare Befehle:"
	@echo "  make build       - Docker-Image bauen"
	@echo "  make push        - Image in die Registry pushen"
	@echo "  make build-push  - Bauen und pushen"
	@echo "  make clean       - Lokales Image entfernen"
	@echo ""
	@echo "Variablen:"
	@echo "  IMAGE_REGISTRY   - Registry-Prefix (z. B. ghcr.io/hzd)"
	@echo "  IMAGE_NAME       - Image-Name (Standard: $(IMAGE_NAME))"
	@echo "  IMAGE_TAG        - Image-Tag (Standard: $(IMAGE_TAG))"
	@echo ""
	@echo "Beispiel:"
	@echo "  make build-push IMAGE_REGISTRY=ghcr.io/hzd IMAGE_TAG=\$${CI_COMMIT_SHA}"

check-image-tag:
	@if [ -z "$(strip $(IMAGE_TAG))" ]; then \
		echo "FEHLER: IMAGE_TAG darf nicht leer sein."; \
		exit 1; \
	fi

build: check-image-tag
	@echo "Baue Docker-Image: $(IMAGE)"
	docker build \
		--build-arg IMAGE_TAG=$(IMAGE_TAG) \
		-f $(DOCKERFILE) \
		-t $(IMAGE) \
		.

push: check-image-tag
	@echo "Pushe Docker-Image: $(IMAGE)"
	docker push $(IMAGE)

build-push: build push
	@echo "Build und Push abgeschlossen: $(IMAGE)"

login:
	@echo "Docker-Login (Registry manuell wählen)..."
	@if [ -n "$(strip $(IMAGE_REGISTRY))" ]; then \
		echo "$${IMAGE_REGISTRY%%/*}"; \
	fi

clean:
	@echo "Entferne lokales Image: $(IMAGE)"
	-docker rmi $(IMAGE) 2>/dev/null || true
