// System-Update über GitHub Releases (öffentliches Repository, kein Passwort nötig)
const { app, net } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ASSET = 'JafyWidgets-Setup.exe';
const cmp = (a, b) => { const p = (v) => String(v).replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0); const x = p(a), y = p(b); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0) ? 1 : -1; } return 0; };

async function check(repo) {
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) return { ok: false, error: 'Kein Update-Repository eingestellt.' };
  const r = await net.fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'JafyWidgets-Updater' } });
  if (r.status === 404) return { ok: false, error: 'Auf GitHub gibt es noch keine veröffentlichte Version.' };
  if (!r.ok) return { ok: false, error: 'GitHub antwortet nicht (' + r.status + ').' };
  const j = await r.json(), latest = String(j.tag_name || '').replace(/^v/i, ''), cur = app.getVersion();
  const asset = (j.assets || []).find((a) => a.name === ASSET || a.name === 'AppleWidgets-Setup.exe') || (j.assets || []).find((a) => /\.exe$/i.test(a.name));
  return { ok: true, current: cur, latest, available: !!asset && cmp(latest, cur) > 0, notes: String(j.body || '').slice(0, 2000), url: asset && asset.browser_download_url, size: asset && asset.size, date: j.published_at };
}

async function install(info, onProgress) {
  if (!info || !info.url || !/^https:\/\/github\.com\//.test(info.url)) throw new Error('Ungültige Download-Adresse.');
  const file = path.join(os.tmpdir(), 'JafyWidgets-Update-' + info.latest + '.exe');
  const r = await net.fetch(info.url, { headers: { 'User-Agent': 'JafyWidgets-Updater' } });
  if (!r.ok) throw new Error('Download fehlgeschlagen (' + r.status + ').');
  const total = Number(r.headers.get('content-length')) || info.size || 0, out = fs.createWriteStream(file), rd = r.body.getReader();
  let got = 0;
  for (;;) { const { done, value } = await rd.read(); if (done) break; got += value.length; if (!out.write(Buffer.from(value))) await new Promise((res) => out.once('drain', res)); onProgress && onProgress(total ? got / total : 0); }
  await new Promise((res, rej) => out.end((e) => (e ? rej(e) : res())));
  if (info.size && fs.statSync(file).size !== info.size) throw new Error('Download unvollständig.');
  // Installer still ausführen; er beendet die App und startet danach die neue Version selbst
  // Installer direkt starten (ohne cmd: Pfade mit Leerzeichen/Umlauten gingen dort kaputt)
  await new Promise((res, rej) => {
    let ch; try { ch = spawn(file, ['/S'], { detached: true, stdio: 'ignore', windowsHide: false }); } catch (e) { return rej(new Error('Installer konnte nicht gestartet werden: ' + e.message)); }
    ch.once('error', (e) => rej(new Error(e.code === 'EACCES' || e.code === 'EPERM' ? 'Windows oder ein Virenschutz hat den Installer blockiert.' : 'Installer konnte nicht gestartet werden (' + (e.code || e.message) + ').')));
    ch.once('spawn', () => { ch.unref(); res(); });
  });
  setTimeout(() => app.exit(0), 800);
  return true;
}
module.exports = { check, install, cmp };
