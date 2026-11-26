#!/usr/bin/env bash
# Baut dist/AppleWidgets-Setup.exe (Linux mit wine/makensis aus dem electron-builder-Cache)
set -e
cd "$(dirname "$0")"
V=$(node -p "require('./package.json').version")
rm -rf dist/win-unpacked
npx electron-builder --win --x64
NSIS=${NSISDIR:-$HOME/.cache/electron-builder/nsis/nsis-3.0.4.1}
(cd build/nsis && NSISDIR=$NSIS $NSIS/linux/makensis -V2 -DVERSION=$V installer.nsi)
echo "Fertig: dist/AppleWidgets-Setup.exe (Version $V)"
node build/check.js
