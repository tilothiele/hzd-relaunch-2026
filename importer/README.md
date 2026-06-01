# HZD Importer

Quarkus-Microservice zum Import von Chromosoft-CSV-Daten (Mitglieder und Hunde)
in Strapi und Authentik.

## Architektur

Ports & Adapters mit klarer Trennung:

- **Domain**: `Member`, `Dog`, `ImportJob`
- **Ports**: CSV-Reader, Job-Repository, Member-/Dog-Sync
- **Adapter**: CSV, Strapi REST, Authentik REST, JPA/Panache
- **Application**: `ImportService`, Sync-Services
- **Infrastructure**: REST (`POST /import`), Scheduler, Konfiguration

## Voraussetzungen

- Java 21+
- Strapi (Dev: `http://localhost:1337`)
- Authentik (`https://auth.hovawarte.com` oder lokal)
- CSV-Dateien: `members.csv`, `dogs.csv` (Pfade konfigurierbar)

## Start

### Lokal (Entwicklung)

```bash
cd importer
cp .env.example .env
# .env bearbeiten (Tokens, CSV-Pfade)
set -a && source .env && set +a
./gradlew quarkusDev
```

Der Scheduler ist in `dev` standardmäßig **deaktiviert**. Import manuell auslösen:

```bash
curl -X POST http://localhost:8081/import
```

### Produktion (mit Scheduler)

Der Scheduler läuft im Profil `prod` täglich um **02:00 Uhr** (Cron konfigurierbar).
Voraussetzung: PostgreSQL für Job-Persistenz und gültige API-Tokens in `.env`.

```bash
cd importer
cp .env.example .env
# IMPORTER_STRAPI_API_TOKEN, IMPORTER_AUTHENTIK_API_TOKEN, DB-Zugang setzen
set -a && source .env && set +a
./gradlew quarkusRun -Dquarkus.profile=prod
```

Scheduler manuell aktivieren (ohne prod-Profil):

```bash
IMPORTER_SCHEDULER_ENABLED=true ./gradlew quarkusRun
```

## REST API

### Import starten

```http
POST /import
```

Antwort bei Erfolg: `202 Accepted` mit `{ "jobId": "..." }`

Bei laufendem Job: `409 Conflict`

### Job-Status abfragen

```http
GET /import/{jobId}
```

## Konfiguration

Kopiere `.env.example` nach `.env`. Quarkus liest Umgebungsvariablen automatisch
(Property `importer.strapi.base-url` → `IMPORTER_STRAPI_BASE_URL`).

| Property | Umgebungsvariable | Beschreibung |
|---|---|---|
| `importer.csv.members-path` | `IMPORTER_CSV_MEMBERS_PATH` | Pfad zu `members.csv` |
| `importer.csv.dogs-path` | `IMPORTER_CSV_DOGS_PATH` | Pfad zu `dogs.csv` |
| `importer.scheduler.enabled` | `IMPORTER_SCHEDULER_ENABLED` | Cron-Import aktivieren |
| `importer.scheduler.cron` | `IMPORTER_SCHEDULER_CRON` | Cron-Ausdruck (Quartz) |
| `importer.strapi.base-url` | `IMPORTER_STRAPI_BASE_URL` | Strapi REST API Basis-URL |
| `importer.strapi.api-token` | `IMPORTER_STRAPI_API_TOKEN` | Strapi API Token |
| `importer.authentik.base-url` | `IMPORTER_AUTHENTIK_BASE_URL` | Authentik Basis-URL |
| `importer.authentik.api-token` | `IMPORTER_AUTHENTIK_API_TOKEN` | Authentik API Token (Priorität vor Username/Passwort) |
| `importer.authentik.username` | `IMPORTER_AUTHENTIK_USERNAME` | Authentik-Benutzer für Session-Login |
| `importer.authentik.password` | `IMPORTER_AUTHENTIK_PASSWORD` | Passwort für Session-Login |
| `importer.authentik.auth-flow` | `IMPORTER_AUTHENTIK_AUTH_FLOW` | Optionaler Flow-Slug (Standard: `default-authentication-flow`) |
| `quarkus.datasource.jdbc.url` | `QUARKUS_DATASOURCE_JDBC_URL` | Job-DB (prod: PostgreSQL) |

## Job-Locking

Nur ein Import-Job darf gleichzeitig laufen. Der Status wird in der
Datenbank persistiert (`RUNNING`, `SUCCESS`, `FAILED`).

## Strapi-Datenmodell

Die Mapper orientieren sich an den Schemas unter `backend/src/extensions/`:

### User (`plugin::users-permissions.user`)

- Login: `username = hzd.{membershipNumber}` (Fallback: `hzd.{cId}`)
- Pflichtfeld `email`: CSV-E-Mail oder Fallback `user-{cId}@hovawarte.com`
- Original-E-Mail in `cEmail`
- Rolle: standardmäßig `Authenticated` (`type=authenticated`, per `/api/users-permissions/roles`)
- Region als Strapi-Enum (`Süd`, nicht `Sued`)
- Züchter: bei `cFlagBreeder` wird `plugin::hzd-plugin.breeder` mit `BreederRole=B` angelegt

### Dog (`plugin::hzd-plugin.dog`)

- Chromosoft-Felder: `cId`, `cOwnerId`, `cBreederId`, Gesundheits-Enums, `Exhibitions`, `BreedSurvey`
- Relationen: `owner` (User per `cOwnerId`), `breeder` (Breeder per `cBreederId`)
- Zuchtbuch: `cStudBookNumber`, `cStudBookNumberFather`, `cStudBookNumberMother`

## Tests

Voraussetzung: **Docker** muss laufen (Testcontainers).

```bash
./gradlew test
```

Der Testlauf dauert typischerweise **20–30 Sekunden** (PostgreSQL- und WireMock-Container).
Am Ende erscheint eine **Code-Coverage-Zusammenfassung** in der Konsole; der HTML-Report liegt unter
`build/reports/jacoco/test/html/index.html`.

Integrationstests starten automatisch:
- **PostgreSQL** (`postgres:16-alpine`) für Job-Persistenz
- **WireMock** (`wiremock/wiremock:3.9.1`) als Strapi-/Authentik-Stub

Reine Unit-Tests (ohne Docker): `./gradlew test --tests "de.hzd.importer.adapter.csv.*" --tests "de.hzd.importer.adapter.strapi.StrapiPayloadMapperTest"`
