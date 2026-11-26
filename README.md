# Apple Widgets

Widgets im Apple-Stil für den Windows-Desktop. Es gibt über 100 Widgets in einem eigenen Widget Store: Uhren, Wetter, Kalender (Google und iCloud), Aufgaben, Systemanzeigen und vieles mehr. Dazu kommen ein Dock, Designs und Layouts.

## Installieren

1. Lade unter **Releases** die neueste Datei `AppleWidgets-Setup.exe` herunter.
2. Starte die Datei. Falls Windows SmartScreen warnt, klicke auf «Weitere Informationen» und dann auf «Trotzdem ausführen».
3. Die App erscheint im Startmenü und auf dem Desktop.

## Updates

Unter **Einstellungen → Software-Update** klickst du auf «Nach Updates suchen». Ist eine neue Version da, reicht ein Klick auf «Jetzt aktualisieren». Deine Widgets und Einstellungen bleiben dabei erhalten. Die App sucht ausserdem beim Start und danach alle 6 Stunden selbst nach Updates.

## Für Entwickler

```bash
npm install
npm start            # App starten
./build.sh           # Installer bauen -> dist/AppleWidgets-Setup.exe
```

Eine neue Version veröffentlichst du so:

1. Erhöhe `version` in `package.json`, zum Beispiel auf 1.4.0.
2. Führe `./release.sh "Was ist neu"` aus. Das Skript baut den Installer, setzt den Git-Tag `v1.4.0` und erstellt ein GitHub-Release mit `AppleWidgets-Setup.exe`.

Die App vergleicht ihre eigene Version mit dem neuesten Release. Die Quelle steht unter `updateRepo` in `package.json`.

made by Arsenii and Fynn
