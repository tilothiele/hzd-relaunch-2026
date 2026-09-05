# HZD Importer

Quarkus-Microservice zum Import von Chromosoft-CSV-Daten (Mitglieder und Hunde)
in Strapi.

## Architektur

Ports & Adapters mit klarer Trennung:

- **Domain**: `Member`, `Dog`, `ImportJob`
- **Ports**: CSV-Reader, Job-Repository, Member-/Dog-Sync, Job-Log, Report-Mail
- **Adapter**: CSV, Strapi REST, JPA/Panache, SMTP
- **Application**: `ImportService`, Sync-Services, `ImportJobLogAggregator`, Report-Mail
- **Infrastructure**: REST (`POST /import`), Scheduler, Konfiguration

## Voraussetzungen

- Java 21+
- Strapi (Dev: `http://localhost:1337`)
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
# IMPORTER_STRAPI_API_TOKEN und DB-Zugang setzen
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
| `importer.log.directory` | `IMPORTER_LOG_DIRECTORY` | Verzeichnis für `import-<timestamp>.log` |
| `importer.log.retention-days` | `IMPORTER_LOG_RETENTION_DAYS` | Löschung älterer Logdateien (Standard 7) |
| `importer.mail.enabled` | `IMPORTER_MAIL_ENABLED` | Import-Bericht per SMTP senden |
| `importer.mail.from` | `IMPORTER_MAIL_FROM` | Absender der Bericht-Mail |
| `importer.mail.to` | `IMPORTER_MAIL_TO` | Empfänger (kommagetrennt) |
| `quarkus.mailer.host` | `QUARKUS_MAILER_HOST` | SMTP-Host |
| `quarkus.mailer.port` | `QUARKUS_MAILER_PORT` | SMTP-Port (Standard 25, ohne TLS) |
| `quarkus.mailer.start-tls` | `QUARKUS_MAILER_START_TLS` | `DISABLED` (Test), `OPTIONAL` oder `REQUIRED` |
| `quarkus.mailer.username` | `QUARKUS_MAILER_USERNAME` | Optional; nur bei SMTP-Auth |
| `quarkus.mailer.password` | `QUARKUS_MAILER_PASSWORD` | Optional; nur bei SMTP-Auth |
| `quarkus.datasource.jdbc.url` | `QUARKUS_DATASOURCE_JDBC_URL` | Job-DB (prod: PostgreSQL) |

## Job-Locking

Nur ein Import-Job darf gleichzeitig laufen. Der Status wird in der
Datenbank persistiert (`RUNNING`, `SUCCESS`, `FAILED`).

Nach Abschluss (Erfolg oder Fehler) schreibt der Importer das Protokoll nach
`IMPORTER_LOG_DIRECTORY` als `import-yyyyMMdd-HHmmss.log` und löscht Dateien,
die älter als `IMPORTER_LOG_RETENTION_DAYS` Tage sind (Standard 7). Zusätzlich
geht optional eine Bericht-Mail: oben eine dashboardartige Zusammenfassung,
unten das Job-Protokoll. In `dev` ist der Mailer standardmäßig gemockt
(`quarkus.mailer.mock=true`).

SMTP-Auth und TLS sind optional. Im Testbetrieb ohne Anmeldung die Variablen
`QUARKUS_MAILER_USERNAME` und `QUARKUS_MAILER_PASSWORD` weglassen (nicht auf
leer setzen) und `QUARKUS_MAILER_START_TLS=DISABLED` belassen.

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
- **WireMock** (`wiremock/wiremock:3.9.1`) als Strapi-Stub

Reine Unit-Tests (ohne Docker): `./gradlew test --tests "de.hzd.importer.adapter.csv.*" --tests "de.hzd.importer.adapter.strapi.*" --tests "de.hzd.importer.application.*" --tests "de.hzd.importer.adapter.mail.*" --tests "de.hzd.importer.adapter.file.*"`
