# Jafy Widgets

Widgets im Apple-Stil für den Windows-Desktop. Es gibt über 100 Widgets in einem eigenen Widget Store: Uhren, Wetter, Kalender (Google und iCloud), Aufgaben, Systemanzeigen und vieles mehr. Dazu kommen ein Dock, Designs und Layouts.

## ⬇️ Software herunterladen

### [Jafy Widgets für Windows herunterladen](https://github.com/fynn-svg/Widgets/releases/latest/download/JafyWidgets-Setup.exe)

So installierst du die Software:

1. Klicke auf den Link oben und öffne danach die Datei `JafyWidgets-Setup.exe`.
2. Falls Windows SmartScreen warnt, klicke auf «Weitere Informationen» und dann auf «Trotzdem ausführen».
3. Klicke auf «Installieren». Die App erscheint danach im Startmenü und auf dem Desktop.

Mehr dazu steht im Ordner [Software](Software/). Alle Versionen findest du unter [Releases](https://github.com/fynn-svg/Widgets/releases).

## Updates

Unter **Einstellungen → Software-Update** klickst du auf «Nach Updates suchen». Ist eine neue Version da, reicht ein Klick auf «Jetzt aktualisieren». Deine Widgets und Einstellungen bleiben dabei erhalten. Die App sucht ausserdem beim Start und danach alle 6 Stunden selbst nach Updates.

## Für Entwickler

```bash
npm install
npm start            # App starten
./build.sh           # Installer bauen -> dist/JafyWidgets-Setup.exe
```

Eine neue Version veröffentlichst du so: Erhöhe `version` in `package.json`, zum Beispiel auf 1.4.0, und pushe auf `main`. Die erste Zeile der Commit-Nachricht wird zur Überschrift der Update-Notizen. GitHub Actions baut dann unter Windows automatisch den Installer und veröffentlicht das Release `v1.4.0` mit `JafyWidgets-Setup.exe`. Kurz danach zeigt die App das Update an.

Die App vergleicht ihre eigene Version mit dem neuesten Release. Die Quelle steht unter `updateRepo` in `package.json`.

made by Arsenii and Fynn
