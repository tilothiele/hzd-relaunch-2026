# HZD Frontend - Next.js Headless CMS

Dieses Frontend ist eine Next.js-Anwendung, die mit Strapi als Headless CMS verbunden ist.

## Setup

1. Installiere die Abhängigkeiten:
```bash
pnpm install
```

2. Erstelle eine `.env.local` Datei im `frontend` Verzeichnis:
```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
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

## Content-Types

Die folgenden Content-Types müssen in Strapi erstellt werden:
- Homepage (singleType)
- News Article (collectionType)
- Homepage Section (collectionType)
- Contact (collectionType)

## Permissions

Stelle sicher, dass die öffentlichen Permissions für alle Content-Types in Strapi aktiviert sind.
