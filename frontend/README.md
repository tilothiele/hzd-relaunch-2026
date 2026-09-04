# HZD Frontend - Next.js Headless CMS

Dieses Frontend ist eine Next.js-Anwendung, die mit Strapi als Headless CMS verbunden ist.

## Setup

1. Installiere die Abhängigkeiten:
```bash
pnpm install
```

2. Erstelle eine `.env.local` Datei im `frontend` Verzeichnis:
```env
STRAPI_BASE_URL=http://localhost:1337
```

3. Starte das Frontend:
```bash
pnpm dev
```

## Struktur

- `src/app/` - Next.js App Router Seiten
- `src/components/` - React Komponenten
- `src/lib/` - Utilities und Strapi REST Client
- `src/lib/strapi/` - REST-Helfer, Populate-Parameter, API-Funktionen
- `src/types/` - TypeScript Typen

## Strapi REST API

Das Frontend kommuniziert mit Strapi über die REST API (`/api/...`). Client-seitige
Aufrufe laufen über den Next.js-Proxy `/api/strapi/*`, serverseitige direkt gegen
`STRAPI_BASE_URL`. Zentrale Funktionen liegen in `src/lib/strapi/api.ts`.

`STRAPI_BASE_URL` ist eine reine Runtime-Variable im BFF (kein `NEXT_PUBLIC_*`).
Der Browser erhält die öffentliche Strapi-URL über `GET /api/config` (Hook
`useConfig`) – nur für Medien-URLs (`/uploads/...`), nicht für API-Aufrufe.

## Authentifizierung

Die Anmeldung läuft gegen das Strapi-Backend (`POST /api/auth/local`). Der
Login-Link im Header öffnet die lokale Seite `/login`. Passwort-Reset nutzt
die Strapi-Endpunkte `forgot-password` und `reset-password`.

- `/login` – Anmeldung mit E-Mail/Benutzername und Passwort
- `/forgot-password` – Link zum Zurücksetzen anfordern
- `/reset-password?code=...` – neues Passwort setzen (Ziel der Reset-E-Mail)

Das Strapi-JWT wird als httpOnly-Cookie `hzd_strapi_jwt` gespeichert. Der
Next.js-BFF (`/api/strapi/*`) hängt es als Bearer-Token an Strapi-Anfragen.

Im Backend muss `CLIENT_URL` (oder `FRONTEND_URL`) auf die öffentliche
Frontend-URL zeigen, damit Reset-Mails auf `/reset-password` verlinken.

## Content-Types

Die folgenden Content-Types müssen in Strapi erstellt werden:
- Homepage (singleType)
- News Article (collectionType)
- Homepage Section (collectionType)
- Contact (collectionType)

## Permissions

Stelle sicher, dass die öffentlichen Permissions für alle Content-Types in Strapi aktiviert sind.
