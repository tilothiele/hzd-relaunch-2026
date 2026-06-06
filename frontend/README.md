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
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me
AUTHENTIK_ISSUER=https://auth.example.org/application/o/hzd/
AUTHENTIK_CLIENT_ID=change-me
# AUTHENTIK_CLIENT_SECRET=change-me
AUTHENTIK_SCOPE=openid email profile offline_access
AUTHENTIK_LOG_TOKENS=false
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

Die Anmeldung läuft über Authentik per OIDC. Der Login-Link im Header leitet
direkt auf den Authentik-Login weiter. Lokale Login- und Passwort-Reset-Dialoge
gegen Strapi werden nicht mehr verwendet.

Die OIDC-Parameter werden ausschließlich über Environment-Variablen gesetzt:

- `NEXTAUTH_URL`: öffentliche URL des Frontends.
- `NEXTAUTH_SECRET`: Secret für die NextAuth-Session-Signatur.
- `AUTHENTIK_ISSUER`: Authentik Provider-Issuer, zum Beispiel
  `https://auth.example.org/application/o/hzd/`.
- `AUTHENTIK_CLIENT_ID`: OIDC Client-ID aus Authentik.
- `AUTHENTIK_CLIENT_SECRET`: optional. Wenn gesetzt, läuft der Login als
  Confidential Client (`client_secret_post`). Ohne Secret bleibt es ein
  Public Client mit PKCE (`token_endpoint_auth_method=none`).
- `AUTHENTIK_TOKEN_ENDPOINT_AUTH_METHOD`: optional, überschreibt die Auth-Methode
  am Token-Endpunkt (`none`, `client_secret_post`, `client_secret_basic`).
- `AUTHENTIK_SCOPE`: optionaler Scope, Standard ist
  `openid email profile offline_access`. `offline_access` wird fuer den
  Token-Refresh benoetigt.
- `AUTHENTIK_LOG_TOKENS`: optionales Debug-Logging für Authentik JWTs.
  Nur lokal auf `true` setzen, weil Access- und ID-Token Secrets enthalten.

Ohne `AUTHENTIK_CLIENT_SECRET` ist der Provider ein Public Client (PKCE).
Mit Secret muss die Authentik-Application als Confidential Client konfiguriert
sein; Client-Typ und Auth-Methode müssen zusammenpassen.

### Staging / Reverse Proxy

- `AUTHENTIK_ISSUER` ohne trailing slash setzen (z. B.
  `https://auth.example.org/application/o/website-frontend`).
- Redirect-URI in Authentik: `{NEXTAUTH_URL}/api/auth/callback/authentik`
- `AUTH_TRUST_HOST=true` nutzt `X-Forwarded-Host` und `X-Forwarded-Proto`
  statt `NEXTAUTH_URL`. Das Proxy muss beide Header korrekt setzen
  (`relaunch-staging.example.com`, `https`). Sonst `invalid_grant` /
  `OAuthCallback` – in dem Fall `AUTH_TRUST_HOST` entfernen oder Header fixen.
- `NEXTAUTH_DEBUG=true` loggt NextAuth-Fehler im Server-Log.
- Nach Deploy: Service Worker in Browser deaktivieren (Application → Service Workers → Unregister)
  oder Hard Reload, damit OAuth-Callbacks nicht doppelt laufen.
- `AUTH_TRUST_HOST` nur mit korrekten `X-Forwarded-Host` / `X-Forwarded-Proto` Headern;
  sonst weglassen und nur `NEXTAUTH_URL` setzen.

### HTTP Basic Auth (z. B. Staging via Coolify/Traefik)

Wenn die Next.js-App zusätzlich per **HTTP Basic Auth** geschützt ist, kollidiert das leicht mit OIDC:

- Der Rückruf von Authentik geht auf `/api/auth/callback/authentik`.
- Der Authorization-Code ist **nur einmal** gültig.
- Service-Worker oder ein zweiter Request ohne Basic-Auth-Header → `invalid_grant` / `OAuthCallback`.

**Empfohlen:** Basic Auth in Traefik **nicht** auf OIDC-Pfade anwenden. Nur die öffentliche Site schützen, `/api/auth` ausnehmen:

```bash
# Beispiel: Router-Regel mit Basic Auth (Pseudocode für Custom Labels)
# Router MIT Basic Auth:
#   Host(`relaunch-staging.example.com`) && !PathPrefix(`/api/auth`)
# Router OHNE Basic Auth (gleicher Service/Port):
#   Host(`relaunch-staging.example.com`) && PathPrefix(`/api/auth`)
```

In Coolify: Container Labels → Readonly aus → Middleware `basicauth` nur am HTTPS-Router, der **nicht** `/api/auth` matched; separater Router nur für `/api/auth` ohne `basicauth`. Alternativ Staging nur über Authentik absichern und Basic Auth abschalten.

Nach Änderung: Service Worker im Browser entfernen, redeployen, Login in Inkognito testen.

### Sofortige Rückkehr von Authentik ohne Login-Maske

Wenn du bereits bei Authentik angemeldet bist (SSO), zeigt Authentik keine Login-Seite
und leitet direkt zurück zur Website – das ist erwartetes Verhalten.

- Test mit frischer Session: Inkognito oder Abmeldung auf
  `https://auth.hovawarte.com`
- Login-Maske erzwingen: `AUTHENTIK_PROMPT=login` (optional `AUTHENTIK_MAX_AGE=0`)

## Content-Types

Die folgenden Content-Types müssen in Strapi erstellt werden:
- Homepage (singleType)
- News Article (collectionType)
- Homepage Section (collectionType)
- Contact (collectionType)

## Permissions

Stelle sicher, dass die öffentlichen Permissions für alle Content-Types in Strapi aktiviert sind.
