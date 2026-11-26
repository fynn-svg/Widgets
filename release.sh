#!/usr/bin/env bash
# Neue Version veröffentlichen: ./release.sh "Was ist neu"
# 1. Version in package.json erhöhen, 2. dieses Skript ausführen.
set -e
cd "$(dirname "$0")"
V=$(node -p "require('./package.json').version")
./build.sh
git add -A && git commit -m "Version $V" || true
git tag -f "v$V" && git push && git push -f origin "v$V"
gh release create "v$V" dist/AppleWidgets-Setup.exe --title "Apple Widgets $V" --notes "${1:-Neue Version}"
