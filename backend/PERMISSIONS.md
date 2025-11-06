# Permissions Setup für HZD Plugin

## Automatisches Setup

Das Bootstrap-Skript sollte beim Start des Backends automatisch die Permissions setzen. Beim Start sollten Logs wie diese erscheinen:

```
[HZD Plugin] Setting up public permissions...
[HZD Plugin] ✓ Created permission: plugin::hzd-plugin.homepage.find
[HZD Plugin] ✓ Created permission: plugin::hzd-plugin.news-article.find
...
[HZD Plugin] Permission setup completed
```

## Manuelles Setup (falls automatisch nicht funktioniert)

1. Öffne Strapi Admin: http://localhost:1337/admin
2. Gehe zu: **Settings** → **Users & Permissions Plugin** → **Roles** → **Public**
3. Scrolle zu **Permissions** und aktiviere für jeden Content-Type:

### Content-Types und ihre Permissions:

- **Homepage** (singleType):
  - ✅ `find`

- **News Article**:
  - ✅ `find`
  - ✅ `findOne`

- **Homepage Section**:
  - ✅ `find`
  - ✅ `findOne`

- **Contact**:
  - ✅ `find`
  - ✅ `findOne`

- **Dog**:
  - ✅ `find`
  - ✅ `findOne`

- **Breeder**:
  - ✅ `find`
  - ✅ `findOne`

- **Member**:
  - ✅ `find`
  - ✅ `findOne`

- **Litter**:
  - ✅ `find`
  - ✅ `findOne`

- **Puppy**:
  - ✅ `find`
  - ✅ `findOne`

4. Klicke auf **Save**

## Manuelles Setup über Strapi Console

Alternativ kannst du die Permissions auch über die Strapi Console setzen:

```bash
cd backend
pnpm strapi console
```

Dann in der Console:

```javascript
const setPermissions = require('./src/plugins/hzd-plugin/server/src/set-permissions').default
await setPermissions(strapi)
```

## Überprüfung

Nach dem Setup sollten GraphQL-Queries funktionieren. Teste mit:

```bash
curl -X POST http://localhost:1337/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ hzdPluginHomepage { data { id attributes { heroTitle } } } }"}'
```

Wenn du eine Antwort ohne "Forbidden access" erhältst, sind die Permissions korrekt gesetzt.

