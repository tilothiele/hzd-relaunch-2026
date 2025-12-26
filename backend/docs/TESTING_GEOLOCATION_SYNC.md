# Geolocation Sync Cronjob testen

Es gibt mehrere Möglichkeiten, den Geolocation Sync Cronjob zu testen:

## 1. Admin API Endpoints

### Status abfragen

**GET** `/api/hzd-plugin/geolocation-sync/status`

```bash
curl http://localhost:1337/api/hzd-plugin/geolocation-sync/status
```

**Response:**
```json
{
  "status": {
    "isRunning": false,
    "lastRunTime": "2024-01-15T10:00:00.000Z",
    "lastRunDuration": 1234
  }
}
```

### Job manuell triggern

**POST** `/api/hzd-plugin/geolocation-sync/trigger`

```bash
curl -X POST http://localhost:1337/api/hzd-plugin/geolocation-sync/trigger
```

**Response (wenn erfolgreich):**
```json
{
  "message": "Geolocation sync triggered",
  "status": {
    "isRunning": true,
    "lastRunTime": null,
    "lastRunDuration": null
  }
}
```

**Response (wenn bereits läuft):**
```json
{
  "message": "Geolocation sync is already running",
  "status": {
    "isRunning": true,
    "lastRunTime": "2024-01-15T10:00:00.000Z",
    "lastRunDuration": null
  }
}
```

## 2. Admin UI Endpoints

Die gleichen Endpoints sind auch über die Admin-API verfügbar:

**Status:**
```
GET /hzd-plugin/geolocation-sync/status
```

**Trigger:**
```
GET /hzd-plugin/geolocation-sync/trigger
```

Du kannst diese im Browser aufrufen, wenn du eingeloggt bist:
```
http://localhost:1337/hzd-plugin/geolocation-sync/status
http://localhost:1337/hzd-plugin/geolocation-sync/trigger
```

## 3. Strapi Console

Du kannst den Job auch direkt in der Strapi Console ausführen:

```bash
npm run console
```

Dann in der Console:

```javascript
// Status abfragen
const service = strapi.plugin('hzd-plugin').service('geolocation-sync')
const status = service.getStatus()
console.log(status)

// Job manuell ausführen
await service.syncGeolocations()
```

## 4. Webhook/External Trigger

Du kannst den Content-API Endpoint als Webhook verwenden:

```bash
# Mit curl
curl -X POST http://localhost:1337/api/hzd-plugin/geolocation-sync/trigger

# Mit wget
wget --method=POST http://localhost:1337/api/hzd-plugin/geolocation-sync/trigger

# Mit HTTPie
http POST http://localhost:1337/api/hzd-plugin/geolocation-sync/trigger
```

**Für externe Services:**
- GitHub Actions
- CI/CD Pipelines
- Monitoring Tools
- Cron-Services (z.B. cron-job.org)

## 5. Test-Szenarien

### Test 1: Status prüfen

```bash
curl http://localhost:1337/api/hzd-plugin/geolocation-sync/status
```

Erwartetes Ergebnis: `isRunning: false` (wenn kein Job läuft)

### Test 2: Job triggern

```bash
curl -X POST http://localhost:1337/api/hzd-plugin/geolocation-sync/trigger
```

Erwartetes Ergebnis: `isRunning: true` (Job wurde gestartet)

### Test 3: Während Job läuft nochmal triggern

```bash
# Erster Trigger
curl -X POST http://localhost:1337/api/hzd-plugin/geolocation-sync/trigger

# Sofort nochmal triggern (sollte abgelehnt werden)
curl -X POST http://localhost:1337/api/hzd-plugin/geolocation-sync/trigger
```

Erwartetes Ergebnis: `409 Conflict` mit Message "Geolocation sync is already running"

### Test 4: Status während Job läuft

```bash
# Job starten
curl -X POST http://localhost:1337/api/hzd-plugin/geolocation-sync/trigger

# Status prüfen
curl http://localhost:1337/api/hzd-plugin/geolocation-sync/status
```

Erwartetes Ergebnis: `isRunning: true`

### Test 5: Status nach Job

Warte bis der Job fertig ist, dann:

```bash
curl http://localhost:1337/api/hzd-plugin/geolocation-sync/status
```

Erwartetes Ergebnis: 
- `isRunning: false`
- `lastRunTime`: Timestamp der letzten Ausführung
- `lastRunDuration`: Dauer in Millisekunden

## 6. Logs überwachen

Während der Job läuft, kannst du die Logs beobachten:

```bash
# In einem separaten Terminal
tail -f logs/*.log

# Oder wenn Strapi im Dev-Mode läuft, direkt in der Console
```

**Erwartete Logs:**
```
[Geolocation Sync] Starting geolocation sync job
[Geolocation Sync] Processing breeder 123 with ZIP: 12345
[Geolocation Sync] ✓ Set GeoLocation for breeder 123: lat=52.123, lng=13.456
[Geolocation Sync] Processed 5 breeders
[Geolocation Sync] Found 10 dogs without Location
[Geolocation Sync] ✓ Set Location for dog 456 from breeder 123
[Geolocation Sync] Processed 8 dogs
[Geolocation Sync] Job completed successfully in 1234ms
```

## 7. Browser-Test

Du kannst die Endpoints auch direkt im Browser testen:

1. **Status abrufen:**
   ```
   http://localhost:1337/api/hzd-plugin/geolocation-sync/status
   ```

2. **Job triggern:**
   ```
   http://localhost:1337/api/hzd-plugin/geolocation-sync/trigger
   ```
   (POST-Request - benötigt einen Browser-Plugin oder DevTools)

## 8. Postman/Insomnia

Erstelle Requests in Postman oder Insomnia:

**Status Request:**
- Method: `GET`
- URL: `http://localhost:1337/api/hzd-plugin/geolocation-sync/status`

**Trigger Request:**
- Method: `POST`
- URL: `http://localhost:1337/api/hzd-plugin/geolocation-sync/trigger`

## 9. Automatisiertes Testen

### Mit einem Script:

```bash
#!/bin/bash

# Status prüfen
echo "Checking status..."
curl -s http://localhost:1337/api/hzd-plugin/geolocation-sync/status | jq

# Job triggern
echo "Triggering sync..."
curl -s -X POST http://localhost:1337/api/hzd-plugin/geolocation-sync/trigger | jq

# Warten
echo "Waiting 5 seconds..."
sleep 5

# Status nochmal prüfen
echo "Checking status again..."
curl -s http://localhost:1337/api/hzd-plugin/geolocation-sync/status | jq
```

## 10. Fehlerbehandlung

### Service nicht verfügbar

Wenn der Service nicht verfügbar ist, erhältst du:
```json
{
  "error": {
    "status": 400,
    "message": "Geolocation sync service not available"
  }
}
```

**Lösung:** Prüfe, ob Strapi korrekt gestartet wurde und der Service registriert ist.

### Job läuft bereits

Wenn du versuchst, einen Job zu triggern, während einer läuft:
```json
{
  "message": "Geolocation sync is already running",
  "status": {
    "isRunning": true,
    ...
  }
}
```

**Lösung:** Warte, bis der aktuelle Job fertig ist, oder prüfe die Logs.

## Tipps

1. **Teste zuerst mit Status**: Prüfe immer zuerst den Status, bevor du einen Job trägst
2. **Logs beobachten**: Während der Job läuft, beobachte die Logs für Details
3. **Kleine Datenmengen**: Für Tests empfiehlt es sich, mit kleinen Datenmengen zu arbeiten
4. **Rate Limiting beachten**: Der Job respektiert Nominatim Rate Limits - bei vielen Breedern kann es dauern


