# Troubleshooting: GraphQL "Forbidden access" Fehler

## Problem
Bei GraphQL-Abfragen erscheint der Fehler:
```
"message": "Forbidden access",
"path": ["hzdPluginHomepage"]
```

## Lösung 1: Permissions über Strapi Console prüfen und setzen

1. Öffne die Strapi Console:
```bash
cd backend
pnpm strapi console
```

2. Führe das Check-Skript aus:
```javascript
const checkPermissions = require('./src/plugins/hzd-plugin/server/src/check-permissions').default
await checkPermissions(strapi)
```

Das Skript zeigt an, welche Permissions fehlen und erstellt sie automatisch.

## Lösung 2: Permissions manuell im Strapi Admin setzen

1. Öffne Strapi Admin: http://localhost:1337/admin
2. Gehe zu: **Settings** → **Users & Permissions Plugin** → **Roles** → **Public**
3. Scrolle zu **Permissions**
4. Suche nach `plugin::hzd-plugin.homepage` und aktiviere:
   - ✅ `find`
5. Klicke auf **Save** (oben rechts)

**Wichtig**: Nach dem Setzen der Permissions muss das Backend **neu gestartet** werden!

## Lösung 3: Permissions über API setzen

Falls die manuelle Methode nicht funktioniert, kannst du die Permissions auch über die Strapi API setzen:

```bash
# Hole die Public Role ID
curl http://localhost:1337/api/users-permissions/roles

# Setze die Permission (ersetze ROLE_ID mit der tatsächlichen ID)
curl -X POST http://localhost:1337/api/users-permissions/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "permissions": [
      {
        "action": "plugin::hzd-plugin.homepage.find",
        "role": ROLE_ID
      }
    ]
  }'
```

## Überprüfung

Nach dem Setzen der Permissions, teste die GraphQL-Abfrage:

```bash
curl -X POST http://localhost:1337/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ hzdPluginHomepage { data { id } } }"}'
```

Wenn du eine Antwort ohne "Forbidden access" erhältst, sind die Permissions korrekt gesetzt.

## Häufige Probleme

1. **Backend nicht neu gestartet**: Nach dem Setzen der Permissions muss das Backend neu gestartet werden
2. **Falsche Permission-Struktur**: In Strapi 5 gibt es kein `subject`-Feld mehr, nur `action` und `role`
3. **Cache-Problem**: Manchmal hilft es, den Browser-Cache zu leeren oder den Dev-Server neu zu starten

## Debugging

Falls die Permissions immer noch nicht funktionieren, prüfe:

1. **Sind die Permissions in der Datenbank?**
   - Öffne die Datenbank und prüfe die `up_permissions` Tabelle
   - Suche nach Einträgen mit `action` wie `plugin::hzd-plugin.homepage.find`

2. **Ist die Public Role korrekt?**
   - Prüfe, ob die Public Role existiert und die ID korrekt ist

3. **Sind die Content-Types registriert?**
   - Prüfe, ob die Content-Types im Strapi Admin sichtbar sind
   - Gehe zu: **Content Manager** → **Content-Types Builder**

