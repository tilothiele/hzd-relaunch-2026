# HZD Importer

Quarkus-basiertes Import-Tool für die Synchronisation von Mitgliedern, Hunden und Züchtern aus Strapi.

## Projektstruktur

```
importer/
├── src/main/java/de/hzd/importer/
│   ├── domain/           # Domain Objects und Caches
│   ├── adapter/          # Strapi, Authentik Adapter
│   ├── application/      # Services
│   ├── infrastructure/   # REST Resources, Config
│   └── port/             # Interfaces
├── src/main/resources/
│   ├── application.yaml
│   └── application-prod.yaml
└── build.gradle
```

## Quick Start

1. Kopiere die `.env.example` nach `.env` und passe die Werte an:

```bash
cp .env.example .env
```

2. Setze in `.env` die Strapi-URL und das API-Token:

```
IMPORTER_STRAPI_BASE_URL=http://localhost:1337/api
IMPORTER_STRAPI_API_TOKEN=dein-strapi-api-token
```

3. Starte die Anwendung im Dev-Modus:

```bash
./gradlew quarkusDev
```

4. Import starten:

```bash
# Synchron (blockiert bis fertig)
curl -X POST "http://localhost:8081/api/import"

# Asynchron (idempotent, gibt sofort zurück)
curl "http://localhost:8081/api/import/job/start"
```

5. Status und Cache abfragen:

```bash
curl http://localhost:8081/api/import/status
curl http://localhost:8081/api/import/members
curl http://localhost:8081/api/import/dogs
curl http://localhost:8081/api/import/breeders
```

## API Endpoints

### Import (synchron)

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| POST | /api/import | Import starten (synchron, blockiert bis fertig) |
| GET | /api/import/status | Import-Status |
| GET | /api/import/members | Mitglieder aus Cache |
| GET | /api/import/dogs | Hunde aus Cache |
| GET | /api/import/breeders | Züchter aus Cache |

### Job (asynchron, idempotent)

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| GET | /api/import/job/start | Import starten (asynchron, gibt sofort zurück) |
| GET | /api/import/job/status | Job-Status (running/idle) |

**Job-Endpoint Verhalten:**

- **GET /api/import/job/start**: Startet den Import, wenn noch keiner läuft
  - Wenn nicht laufend: `{ "status": "started" }`
  - Wenn bereits laufend: `{ "status": "running" }`
- **GET /api/import/job/status**: Gibt aktuellen Status zurück
  - Wenn Import läuft: `{ "status": "running" }`
  - Wenn idle: `{ "status": "idle" }`

## Entwicklung

### Voraussetzungen

- Java 21+
- Gradle 8+

### Build

```bash
./gradlew build
```

### Test

```bash
./gradlew test
```
