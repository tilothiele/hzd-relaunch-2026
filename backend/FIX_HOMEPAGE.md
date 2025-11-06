# Homepage Content-Type nicht in GraphQL sichtbar - Lösung

## Problem
Der Homepage Content-Type (singleType) erscheint nicht in GraphQL, obwohl er registriert ist.

## Lösung

### 1. Backend neu starten
Das Backend muss neu gestartet werden, damit die Content-Types in GraphQL registriert werden:

```bash
cd backend
# Stoppe das Backend (Ctrl+C)
pnpm dev
```

### 2. Homepage im Strapi Admin erstellen/veröffentlichen

1. Öffne Strapi Admin: http://localhost:1337/admin
2. Gehe zu: **Content Manager** → **Single Types** → **Homepage**
3. Falls noch keine Homepage existiert:
   - Klicke auf **"Create new entry"**
   - Fülle die Felder aus (mindestens die Pflichtfelder)
   - Klicke auf **"Save"**
4. **Wichtig**: Klicke auf **"Publish"** (oben rechts)
   - Der Content-Type muss veröffentlicht sein, damit er in GraphQL sichtbar ist

### 3. GraphQL Schema neu generieren

Nach dem Erstellen/Veröffentlichen der Homepage sollte GraphQL das Schema automatisch aktualisieren. Falls nicht:

1. Stoppe das Backend
2. Lösche den GraphQL Cache (falls vorhanden)
3. Starte das Backend neu

### 4. Überprüfung

Teste, ob die Homepage jetzt in GraphQL sichtbar ist:

```bash
curl -X POST http://localhost:1337/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { queryType { fields { name } } } }"}' | grep -i "homepage"
```

Oder teste direkt die Homepage-Abfrage:

```bash
curl -X POST http://localhost:1337/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ hzdPluginHomepage { data { id } } }"}'
```

## Wichtig für singleType

- **singleType** muss im Strapi Admin **erstellt** werden (es gibt nur eine Instanz)
- Der Eintrag muss **veröffentlicht** sein (`publishedAt` muss gesetzt sein)
- Nach dem Erstellen/Veröffentlichen sollte GraphQL das Schema automatisch aktualisieren

## Falls es immer noch nicht funktioniert

1. Prüfe die Backend-Logs beim Start - gibt es Fehler?
2. Prüfe, ob der Content-Type im Strapi Admin sichtbar ist
3. Prüfe, ob die Permissions gesetzt sind (siehe PERMISSIONS.md)

