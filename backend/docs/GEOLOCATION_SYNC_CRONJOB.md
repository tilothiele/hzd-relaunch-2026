# Geolocation Sync Cronjob

Dieser Cronjob synchronisiert automatisch Geolocation-Daten für Breeder, Users und Dogs.

## Funktionsweise

Der Job läuft in drei Phasen:

### Phase 1: Breeder Geolocation (Schritte 1-3)

1. **Suche**: Findet einen Breeder, der eine PLZ (`Address.Zip`) hat, aber keine `GeoLocation`
2. **Ermittlung**: Ruft die Geolocation für die PLZ von OpenStreetMap ab
3. **Speicherung**: Setzt die `GeoLocation` am Breeder
4. **Wiederholung**: Geht zurück zu Schritt 1, bis keine Breeder mehr gefunden werden

### Phase 2: User Geolocation (Schritte 3.5)

1. **Suche**: Findet **alle** User, die eine PLZ (`zip`) haben, aber keine `geoLocation` (lat/lng leer)
2. **Verarbeitung**: Für jeden gefundenen User:
   - Ruft die Geolocation für die PLZ von OpenStreetMap ab
   - Setzt die `geoLocation` am User, **falls sie gefunden wurde**
   - Überspringt den User, wenn keine Geolocation gefunden wurde (verhindert Endlosschleifen)
3. **Terminierung**: Nach dem Durchlauf aller User wird die Phase beendet

### Phase 3: Dog Geolocation (Schritte 4-5)

1. **Suche**: Findet alle Dogs, die keine `Location` haben
2. **Kopie**: Setzt `dog.Location = dog.breeder.GeoLocation` (wenn der Breeder eine GeoLocation hat)

## Konfiguration

### Cron Schedule

Der Job wird standardmäßig **jede Stunde** um Minute 0 ausgeführt (z.B. 1:00, 2:00, 3:00).

Du kannst den Schedule über die Environment Variable `GEOLOCATION_SYNC_CRON` anpassen:

```env
GEOLOCATION_SYNC_CRON="0 * * * *"  # Jede Stunde (Standard)
GEOLOCATION_SYNC_CRON="0 */2 * * *"  # Alle 2 Stunden
GEOLOCATION_SYNC_CRON="0 0 * * *"  # Einmal täglich um Mitternacht
GEOLOCATION_SYNC_CRON="*/30 * * * *"  # Alle 30 Minuten
```

### Cron Syntax

Die Cron-Syntax folgt dem Standard-Format:

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Wochentag (0-7, 0 oder 7 = Sonntag)
│ │ │ └───── Monat (1-12)
│ │ └─────── Tag des Monats (1-31)
│ └───────── Stunde (0-23)
└─────────── Minute (0-59)
```

**Beispiele:**
- `0 * * * *` - Jede Stunde um Minute 0
- `0 */2 * * *` - Alle 2 Stunden
- `0 0 * * *` - Täglich um Mitternacht
- `0 0 * * 0` - Jeden Sonntag um Mitternacht
- `*/15 * * * *` - Alle 15 Minuten

### Timezone

Die Timezone ist standardmäßig auf `Europe/Berlin` gesetzt. Du kannst sie in `bootstrap.ts` anpassen.

## Idempotenz

Der Job ist **idempotent**:
- Er kann mehrfach ausgeführt werden, ohne negative Auswirkungen
- Breeder mit bereits gesetzter GeoLocation werden übersprungen
- User mit bereits gesetzter GeoLocation werden übersprungen
- Dogs mit bereits gesetzter Location werden übersprungen

## Locking

Der Job verwendet einen **Lock-Mechanismus**, um sicherzustellen, dass nur eine Instanz gleichzeitig läuft:

- Wenn ein Job bereits läuft, wird ein neuer Start übersprungen
- Der Lock wird automatisch freigegeben, wenn der Job beendet ist (erfolgreich oder mit Fehler)
- Logs zeigen an, wenn ein Job übersprungen wird: `[Geolocation Sync] Job already running, skipping this execution`

## Logs

Der Job erzeugt detaillierte Logs:

```
[Geolocation Sync] Starting geolocation sync job
[Geolocation Sync] Processing breeder 123 with ZIP: 12345
[Geolocation Sync] ✓ Set GeoLocation for breeder 123: lat=52.123, lng=13.456
[Geolocation Sync] Processed 5 breeders
[Geolocation Sync] Found 3 users with ZIP but no GeoLocation
[Geolocation Sync] Processing user 789 with ZIP: 54321
[Geolocation Sync] ✓ Set GeoLocation for user 789: lat=51.234, lng=12.567
[Geolocation Sync] Processed 2 users successfully, 1 failed
[Geolocation Sync] Found 10 dogs without Location
[Geolocation Sync] ✓ Set Location for dog 456 from breeder 123
[Geolocation Sync] Processed 8 dogs
[Geolocation Sync] Job completed successfully in 1234ms
```

## Manuelle Ausführung

### Via API Endpoint (Empfohlen)

**POST** `/api/hzd-plugin/geolocation-sync/trigger`

```bash
curl -X POST http://localhost:1337/api/hzd-plugin/geolocation-sync/trigger
```

Siehe [TESTING_GEOLOCATION_SYNC.md](./TESTING_GEOLOCATION_SYNC.md) für Details.

### Via Strapi Console

```bash
npm run console
```

Dann in der Console:

```javascript
const service = strapi.plugin('hzd-plugin').service('geolocation-sync')
await service.syncGeolocations()
```

## Status abfragen

Du kannst den Status des Jobs abfragen:

```javascript
const service = strapi.plugin('hzd-plugin').service('geolocation-sync')
const status = service.getStatus()
console.log(status)
// {
//   isRunning: false,
//   lastRunTime: 2024-01-15T10:00:00.000Z,
//   lastRunDuration: 1234
// }
```

## Fehlerbehandlung

- **API-Fehler**: Wenn die Geolocation-API für eine PLZ fehlschlägt, wird der Breeder übersprungen und der Job fährt mit dem nächsten fort
- **Service-Fehler**: Wenn der Geolocation-Service nicht verfügbar ist, wird der Job beendet
- **Datenbank-Fehler**: Fehler werden geloggt und der Job wird beendet (Lock wird freigegeben)

## Performance

- **Breeder**: Verarbeitet einen Breeder pro Iteration (mit 100ms Delay zwischen API-Calls)
- **User**: Findet alle User auf einmal und verarbeitet sie sequenziell (mit 100ms Delay zwischen API-Calls)
- **Dogs**: Verarbeitet bis zu 100 Dogs pro Batch
- **Max Iterations**: Sicherheitslimit von 1000 Iterationen für Breeder (verhindert Endlosschleifen)

## Rate Limiting

Der Job respektiert das Rate Limiting der Nominatim API:
- 100ms Delay zwischen Breeder-Verarbeitungen
- 100ms Delay zwischen User-Verarbeitungen
- Der Geolocation-Service hat bereits ein eigenes Rate Limiting (siehe `NOMINATIM_DELAY_MS`)

## Troubleshooting

### Job läuft nicht

1. Prüfe die Logs beim Strapi-Start - sollte `[HZD Plugin] ✓ Geolocation sync cronjob scheduled` zeigen
2. Prüfe, ob `GEOLOCATION_SYNC_CRON` korrekt gesetzt ist
3. Prüfe die Strapi-Logs auf Fehler

### Job läuft zu oft/wenig

- Passe `GEOLOCATION_SYNC_CRON` an
- Prüfe die Cron-Syntax mit einem Online-Cron-Validator

### Job wird übersprungen

- Prüfe, ob ein Job bereits läuft: `service.getStatus()`
- Wenn `isRunning: true` ist, warte bis der Job fertig ist

### Keine Breeder werden gefunden

- Prüfe, ob Breeder tatsächlich eine `Address.Zip` haben
- Prüfe, ob Breeder bereits eine `GeoLocation` haben (dann werden sie übersprungen)

### Keine User werden gefunden

- Prüfe, ob User tatsächlich eine `zip` haben
- Prüfe, ob User bereits eine `geoLocation` haben (dann werden sie übersprungen)

### User werden nicht aktualisiert

- Wenn eine Geolocation für eine PLZ nicht gefunden wird, wird der User übersprungen (keine Endlosschleife)
- Prüfe die Logs auf Warnungen: `✗ Could not fetch geolocation for ZIP: ...`

