// Prüft, ob alle eigenen Module, die main.js lädt, in der fertigen App stecken
const asar = require('@electron/asar'); const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..');
const list = asar.listPackage(path.join(root, 'dist/win-unpacked/resources/app.asar')).map((p) => p.replace(/\\/g, '/'));
const src = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const miss = [...src.matchAll(/require\('\.\/([\w.-]+)'\)/g)].map((m) => (m[1].endsWith('.json') ? m[1] : m[1] + '.js')).filter((f) => !list.includes('/' + f));
if (miss.length) { console.error('FEHLT in der App: ' + miss.join(', ')); process.exit(1); }
console.log('Alle Module vorhanden.');
