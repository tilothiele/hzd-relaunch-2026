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
NEXT_PUBLIC_STRAPI_BASE_URL=http://localhost:1337
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me
AUTHENTIK_ISSUER=https://auth.example.org/application/o/hzd/
AUTHENTIK_CLIENT_ID=change-me
AUTHENTIK_SCOPE=openid email profile
AUTHENTIK_LOG_TOKENS=false
```

3. Starte das Frontend:
```bash
pnpm dev
```

## Struktur

- `src/app/` - Next.js App Router Seiten
- `src/components/` - React Komponenten
- `src/lib/` - Utilities und GraphQL Client
- `src/types/` - TypeScript Typen

## GraphQL

Das Frontend verwendet GraphQL, um Daten von Strapi abzurufen. Die Queries befinden sich in `src/lib/graphql/queries.ts`.

## Authentifizierung

Die Anmeldung läuft über Authentik per OIDC. Der Login-Link im Header leitet
direkt auf den Authentik-Login weiter. Lokale Login- und Passwort-Reset-Dialoge
gegen Strapi werden nicht mehr verwendet.

Die OIDC-Parameter werden ausschließlich über Environment-Variablen gesetzt:

- `NEXTAUTH_URL`: öffentliche URL des Frontends.
- `NEXTAUTH_SECRET`: Secret für die NextAuth-Session-Signatur.
- `AUTHENTIK_ISSUER`: Authentik Provider-Issuer, zum Beispiel
  `https://auth.example.org/application/o/hzd/`.
- `AUTHENTIK_CLIENT_ID`: OIDC Client-ID aus Authentik.
- `AUTHENTIK_SCOPE`: optionaler Scope, Standard ist `openid email profile`.
- `AUTHENTIK_LOG_TOKENS`: optionales Debug-Logging für Authentik JWTs.
  Nur lokal auf `true` setzen, weil Access- und ID-Token Secrets enthalten.

Der Authentik-Provider ist als Public Client angebunden. Es wird kein OIDC
Client Secret benötigt; der Token-Endpunkt wird mit
`token_endpoint_auth_method=none` verwendet.

## Content-Types

Die folgenden Content-Types müssen in Strapi erstellt werden:
- Homepage (singleType)
- News Article (collectionType)
- Homepage Section (collectionType)
- Contact (collectionType)

## Permissions

Stelle sicher, dass die öffentlichen Permissions für alle Content-Types in Strapi aktiviert sind.
