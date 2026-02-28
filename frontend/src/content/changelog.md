# Changelog

Alle wichtigen Änderungen am HZD-Relaunch Projekt werden hier dokumentiert.

## [0.1.0] - 2026-02-28

### Hinzugefügt
- **Bildergalerie:** Neue Seite mit Hero-Bereich, Highlights und Archiv-Ansicht.
- **Lightbox:** Großansicht für alle Bilder in der Galerie mit Schließen-Funktion (X-Button & ESC).
- **PWA Update-Mechanismus:** Benachrichtigung bei neuen Versionen inkl. Anleitung für iOS-Nutzer.
- **Versionsanzeige:** Aktuelle App-Version im Footer und in der Update-Snackbar.
- **Changelog:** Diese Seite zur Dokumentation von Änderungen.

### Geändert
- **Header & Navigation:** Schriftgröße auf 1.2em angepasst, Fettdruck entfernt für ein cleaner Look.
- **Hero-Layout:** Titel "Bildergalerie" in den Bild-Verlauf (Gradient) verschoben.

### Behoben
- Fehler beim Laden von Bildern im Server-Kontext (GraphQL-Client Fix).
- Icon-Importfehler (Wechsel von lucide-react zu Material-UI Icons).
