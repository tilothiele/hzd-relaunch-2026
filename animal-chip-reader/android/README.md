# Tierchip-Scanner (Android)

Android-App zum Auslesen von Hunde- und Pferdechips per NFC. Die 15-stellige Identnummer nach [ISO 11784](https://en.wikipedia.org/wiki/ISO_11784_and_ISO_11785) wird angezeigt, inklusive Land bzw. ICAR-Hersteller.

## Funktionen

- NFC-Reader-Mode für ISO 14443 (NFC-A/B) und ISO 15693 (NFC-V)
- Auswertung von UID, Speicherblöcken und NDEF
- Anzeige der ISO-11784-Nummer (3 + 12 Stellen)
- Verlauf, Kopieren und Teilen
- Deutschsprachige Oberfläche im HZD-Farbschema

## Wichtiger Hinweis zur Frequenz

Die meisten **implantierten** EU-Tierchips (Hund, Pferd) nach ISO 11785 arbeiten auf **134,2 kHz (FDX-B)**. Das NFC-Modul eines Android-Handys arbeitet auf **13,56 MHz**.

Die App liest deshalb zuverlässig:

- NFC-Halsband- und Sattelmarken
- ISO-15693-Transponder (NFC-V)
- Dual-Frequency-Chips, falls vorhanden

Reine 134,2-kHz-Implantate brauchen ein spezielles Lesegerät. Die App macht das transparent und versucht trotzdem, jede vom Telefon erkannte Nummer nach ISO 11784 zu decodieren.

## Bauen

Voraussetzung: Android SDK 34, JDK 17.

```bash
cd animal-chip-reader/android
echo "sdk.dir=$HOME/Android/Sdk" > local.properties
./gradlew assembleDebug test
```

Die APK liegt danach unter `app/build/outputs/apk/debug/app-debug.apk`.

In Android Studio: Ordner `animal-chip-reader/android` öffnen, Gerät mit NFC wählen, App starten.

## Emulator (API 34)

`./gradlew installDebug` schlägt auf Pixel-AVDs mit Android 14 oft fehl
(`PackageManagerInternal.freeStorage` ist `null`). Das ist ein Emulator-Bug
bei der Incremental-Installation, nicht an der APK.

Emulator starten, dann:

```bash
cd animal-chip-reader/android
./gradlew installOnEmulator
adb shell am start -n de.hzd.animalchipreader/.MainActivity
```

Oder direkt:

```bash
adb install -r -t --no-incremental app/build/outputs/apk/debug/app-debug.apk
```

In Android Studio: Run → Edit Configurations → Installation Options →
Additional install flags: `--no-incremental`.

Wenn der Fehler bleibt: Device Manager → Cold Boot Now (Snapshot kann den
Package Manager in einem kaputten Zustand lassen). NFC selbst emuliert
dieser AVD nicht; die UI ist trotzdem bedienbar.
