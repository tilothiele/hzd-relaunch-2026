# Nominatim API Konfiguration

Dieses Projekt verwendet die [OpenStreetMap Nominatim API](https://nominatim.openstreetmap.org/) zur Geokodierung von deutschen Postleitzahlen (PLZ).

## Offizielle Dokumentation

- **Usage Policy**: https://nominatim.org/release-docs/latest/api/Usage-Policy/
- **API Dokumentation**: https://nominatim.org/release-docs/latest/api/Overview/
- **Rate Limiting**: https://nominatim.org/release-docs/latest/api/Usage-Policy/#rate-limits

## Wichtige Regeln

Nominatim hat strenge Nutzungsbedingungen:

1. **User-Agent Header ist Pflicht**: Jede Anfrage muss einen beschreibenden User-Agent Header enthalten
2. **Rate Limiting**: Maximal 1 Anfrage pro Sekunde (ohne API-Key)
3. **Email wird empfohlen**: Eine Email-Adresse verbessert die Akzeptanz und hilft bei Problemen
4. **Keine Bulk-Abfragen**: Nicht mehr als nötig abfragen, Caching verwenden

## Environment Variables

Die folgenden Environment Variables können in der `.env` Datei gesetzt werden:

### `NOMINATIM_BASE_URL` (optional)

Die Basis-URL der Nominatim API. Standard: `https://nominatim.openstreetmap.org/search`

```env
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org/search
```

**Hinweis**: Wenn du einen eigenen Nominatim-Server betreibst, kannst du hier die URL angeben.

### `NOMINATIM_USER_AGENT` (optional, aber empfohlen)

Ein beschreibender User-Agent Header, der deine Anwendung identifiziert. 
**Dieser Header ist Pflicht** und sollte Kontaktinformationen enthalten.

Standard: `HZD-Backend/1.0 (contact@hzd-hovawarte.de)`

```env
NOMINATIM_USER_AGENT=HZD-Backend/1.0 (contact@hzd-hovawarte.de)
```

**Format**: `<App-Name>/<Version> (<Kontakt-Email>)`

**Beispiel**:
```env
NOMINATIM_USER_AGENT=MyApp/2.0 (admin@example.com)
```

### `NOMINATIM_EMAIL` (optional, aber empfohlen)

Eine Email-Adresse, die bei API-Anfragen mitgesendet wird. Dies verbessert die Akzeptanz deiner Anfragen und hilft bei Problemen.

```env
NOMINATIM_EMAIL=contact@hzd-hovawarte.de
```

### `NOMINATIM_DELAY_MS` (optional)

Künstliche Verzögerung in Millisekunden zwischen API-Anfragen. 
Dies hilft, das Rate Limiting einzuhalten (max. 1 Request/Sekunde).

Standard: `1000` (1 Sekunde)

```env
NOMINATIM_DELAY_MS=1000
```

**Empfehlung**: 
- Für Produktion: `1000` (1 Sekunde)
- Für Entwicklung: `1000` (1 Sekunde)
- Wenn du einen API-Key hast: Kann niedriger sein (siehe Nominatim Docs)

## Beispiel .env Konfiguration

```env
# Nominatim API Konfiguration
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org/search
NOMINATIM_USER_AGENT=HZD-Backend/1.0 (contact@hzd-hovawarte.de)
NOMINATIM_EMAIL=contact@hzd-hovawarte.de
NOMINATIM_DELAY_MS=1000
```

## Fehlerbehebung

### 403 Forbidden Fehler

Wenn du `403 Forbidden` Fehler erhältst:

1. **Prüfe den User-Agent Header**: Muss gesetzt sein und Kontaktinformationen enthalten
2. **Prüfe die Email**: Setze `NOMINATIM_EMAIL` mit einer gültigen Email-Adresse
3. **Prüfe Rate Limiting**: Stelle sicher, dass `NOMINATIM_DELAY_MS` mindestens 1000ms ist
4. **Prüfe die Usage Policy**: https://nominatim.org/release-docs/latest/api/Usage-Policy/

### Keine Ergebnisse gefunden

- Prüfe, ob die PLZ korrekt ist (5-stellig, nur Zahlen)
- Prüfe, ob die PLZ in Deutschland existiert (countrycode=de wird verwendet)

## Caching

Der Service verwendet ein In-Memory Cache mit 30 Tagen TTL. 
Dies reduziert die Anzahl der API-Anfragen erheblich.

## Weitere Informationen

- **Nominatim Usage Policy**: https://nominatim.org/release-docs/latest/api/Usage-Policy/
- **Nominatim API Docs**: https://nominatim.org/release-docs/latest/api/Overview/
- **Nominatim Installation (für eigene Server)**: https://nominatim.org/release-docs/develop/admin/Installation/


