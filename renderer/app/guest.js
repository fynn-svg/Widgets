// ---------- Gäste-Modus: App für andere Leute freigeben, ohne dass sie etwas verstellen ----------
function pinPad(onDone, opts = {}) {
  const el = h(`<div class="pin"><div class="pin-dots"></div><div class="pin-msg dim">${opts.msg || ''}</div><div class="pin-keys"></div></div>`);
  let v = ''; const max = opts.max || 8, dots = $('.pin-dots', el), msg = $('.pin-msg', el);
  const draw = () => { dots.innerHTML = Array.from({ length: Math.max(4, v.length) }, (_, i) => `<i class="${i < v.length ? 'on' : ''}"></i>`).join(''); };
  const press = (k) => { if (k === '⌫') v = v.slice(0, -1); else if (k === '✓') { if (v.length >= 4) { const x = v; v = ''; onDone(x, { msg, el, draw }); } } else if (v.length < max) v += k; draw(); };
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].forEach((k) => { const b = h(`<button class="${k === '✓' ? 'p' : ''}">${k}</button>`); b.onclick = () => press(k); $('.pin-keys', el).append(b); });
  const kd = (e) => { if (!document.body.contains(el)) return document.removeEventListener('keydown', kd); if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('⌫'); else if (e.key === 'Enter') press('✓'); };
  document.addEventListener('keydown', kd); cleanups.push(() => document.removeEventListener('keydown', kd));
  el.shake = () => { el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad'); };
  draw(); return el;
}

PAGES.unlock = (m) => {
  m.innerHTML = '<div class="lock-pg"><div class="lock-ic">🔒</div><h2>Entsperren</h2><p class="sub">Diese App ist im Gäste-Modus. Gib die Support-PIN ein, um Einstellungen, Widget Store und Widgets zu bearbeiten.</p><div id="pp"></div></div>';
  const pad = pinPad(async (pin, ui) => {
    const r = await api.lockUnlock(pin);
    if (r && r.ok) { const nx = pkState.afterUnlock || 'home'; pkState.afterUnlock = null; cfg.runtime = { ...cfg.runtime, locked: false }; go(nx); return; }
    pad.shake(); ui.msg.innerHTML = r && r.wait ? `<span class="no">Zu viele Versuche. Warte ${r.wait} Sekunden.</span>` : '<span class="no">Falsche PIN.</span>';
  }, { msg: 'PIN eingeben (4 bis 8 Ziffern)' });
  $('#pp').append(pad);
};

function guestHome(m) {
  const a = (cfg.lock && cfg.lock.allow) || {}, hr = new Date().getHours(), greet = hr < 11 ? 'Guten Morgen' : hr < 18 ? 'Guten Tag' : 'Guten Abend';
  const date = new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' });
  m.innerHTML = `<div class="hm-h"><div><div class="hm-d">${esc(date)}</div><h2>${greet}</h2></div></div>
    <div class="guest-hero"><span>👥</span><div><b>Willkommen bei Jafy Widgets</b><small>Du kannst die Widgets und Werkzeuge benutzen. Einstellungen sind gesperrt.</small></div></div>
    <div id="gq"></div>`;
  const q = $('#gq');
  if (a.tools !== false) { q.append(h('<h3>Werkzeuge</h3>')); const g = h('<div class="tl-grid"></div>'); q.append(g);
    TOOLS.forEach(([k, i, n, d]) => { const e = h(`<div class="tl-card"><span>${i}</span><b>${n}</b><small>${d}</small></div>`); e.onclick = () => { pkState.tool = k; go('tools'); }; g.append(e); }); }
  if (a.tasks !== false) { const open = (cfg.tasks || []).filter((x) => !x.done).length; const e = h(`<div class="hm-qi" style="margin-top:16px;max-width:360px"><span>✅</span><div><b>Aufgaben</b><small>${open} offen</small></div></div>`); e.onclick = () => go('tasks'); q.append(e); }
  if (a.tools === false && a.tasks === false) q.append(h('<div class="hint">Die Widgets auf dem Desktop kannst du ganz normal benutzen.</div>'));
}

// Admin-PIN-Abfrage direkt im Einstellungsbereich
function adminGate(B) {
  const box = h(`<div class="card adm"><div class="lock-ic">🔒</div><h3>Support-PIN nötig</h3><p class="dim">Dieser Bereich ist für Entwickler und Support. Er ist geschützt, damit niemand aus Versehen die App kaputt macht. Nach der Eingabe bleibt er offen, bis du das Fenster schliesst.</p><div class="adm-p"></div></div>`);
  B.append(box);
  const pad = pinPad(async (pin, ui) => {
    const r = await api.lockUnlock(pin);
    if (r && r.ok) { cfg.runtime = { ...cfg.runtime, admin: true, locked: false }; go('settings'); return; }
    pad.shake(); ui.msg.innerHTML = r && r.wait ? `<span class="no">Zu viele Versuche. Warte ${r.wait} Sekunden.</span>` : '<span class="no">Falsche PIN.</span>';
  }, { msg: 'Support-PIN eingeben' });
  $('.adm-p', box).append(pad);
}

function guestSettings(B) {
  const on = !!(cfg.lock && cfg.lock.enabled), allow = { tools: true, tasks: true, ...((cfg.lock && cfg.lock.allow) || {}) }, def = cfg.runtime && cfg.runtime.pinDefault;
  const g2 = group(B, 'Gäste-Modus', 'Im Gäste-Modus sind auch Widget Store, Widgets bearbeiten, verschieben und löschen, Designs, Layouts und Dock gesperrt. Die Widgets auf dem Desktop funktionieren normal weiter.');
  srow(g2, 'Gäste-Modus', on ? 'Eingeschaltet: ohne Admin-PIN ist fast alles gesperrt' : 'Für fremde Leute: sperrt die ganze App mit der Support-PIN', on ? btn('Ausschalten', () => api.lockDisable(), 'dg') : btn('Einschalten und sperren', async () => { if (await api.lockSetup(allow)) { pkState.setTab = 'general'; cfg.runtime = { ...cfg.runtime, locked: true, admin: false }; go('home'); } }, 'p'));
  const g3 = group(B, 'Das dürfen Gäste');
  [['tools', 'Werkzeuge benutzen', 'QR-Code, Umrechner, Timer und mehr'], ['tasks', 'Aufgaben ansehen und abhaken', '']].forEach(([k, l, d]) => srow(g3, l, d, tg(allow[k] !== false, (v) => { allow[k] = v; if (on) api.lockAllow(allow); else cfg.lock = { ...(cfg.lock || {}), allow }; })));
}

function supportSettings(B, S) {
  const def = cfg.runtime && cfg.runtime.pinDefault;
  const g0 = group(B, 'Diagnose', 'Für Hilfe: Diagnose kopieren und dem Entwickler schicken. Es sind keine Passwörter oder Kalender-Links enthalten.');
  const pre = h('<pre class="diag">…</pre>'); g0.append(pre);
  api.devDiag().then((d) => { pre.textContent = [`Jafy Widgets ${d.app} (Electron ${d.electron})`, `System: ${d.os}`, `Widgets: ${d.widgets} · Sprache: ${d.lang} · Gäste-Modus: ${d.guest ? 'an' : 'aus'}`, `Update-Quelle: ${d.repo || '–'}`, `Letzte Update-Prüfung: ${d.update && d.update.at ? new Date(d.update.at).toLocaleString('de-CH') + (d.update.ok === false ? ' – Fehler: ' + (d.update.error || '') : d.update.available ? ' – ' + d.update.latest + ' verfügbar' : ' – aktuell') : 'noch nie'}`, `Daten: ${d.data}`, `Programm: ${d.exe}`].join('\n'); });
  srow(g0, 'Diagnose kopieren', '', btn('Kopieren', (e) => copyTxt(pre.textContent, e.target)));
  srow(g0, 'Fehlerprotokoll', 'log.txt mit Fehlern der App', btn('Öffnen', () => api.devLog()));
  srow(g0, 'Entwickler-Tools', 'Konsole für die Fehlersuche', btn('Öffnen', () => api.devTools()));
  const g1 = group(B, 'Software-Update');
  srow(g1, 'Automatisch nach Updates suchen', 'Beim Start und danach jede Stunde', tg(S.autoUpdateCheck !== false, (v) => setS({ autoUpdateCheck: v })));
  const rp = h(`<input type="text" placeholder="fynn-svg/Widgets" value="${esc(S.updateRepo || '')}" style="width:200px">`); rp.onchange = () => setS({ updateRepo: rp.value.trim() });
  srow(g1, 'Update-Quelle (GitHub)', 'Leer lassen für die Standard-Quelle', rp);
  const g2 = group(B, 'Daten', 'Zurücksetzen löscht alle Widgets, Designs und Einstellungen. Das kann nicht rückgängig gemacht werden.');
  const msg = h('<span class="dim"></span>');
  srow(g2, 'Sicherung wiederherstellen', 'Eine exportierte Datei laden (ersetzt die aktuellen Einstellungen)', [msg, btn('Importieren …', async () => { const r = await api.importCfg(); msg.textContent = r && r.ok ? t('st.imported') : r && !r.canceled ? t('st.importFail') : ''; })]);
  srow(g2, 'Daten-Ordner', 'Hier liegen Konfiguration und Protokoll', btn('Öffnen', () => api.openDataFolder()));
  srow(g2, 'Alles zurücksetzen', '', btn('Zurücksetzen …', async () => { if (await api.resetAll()) go('home'); }, 'dg'));
  const g3 = group(B, 'Support-PIN', 'Die PIN schützt diesen Bereich und den Gäste-Modus. Nach der Eingabe bleibt alles offen, bis das Fenster geschlossen wird.');
  if (def) srow(g3, '⚠️ Standard-PIN aktiv', 'Auf diesem PC kann man sie ändern', null);
  const np = h('<input type="password" inputmode="numeric" maxlength="8" placeholder="Neue PIN" style="width:120px">'), np2 = h('<input type="password" inputmode="numeric" maxlength="8" placeholder="Wiederholen" style="width:120px">'), pm = h('<span class="dim"></span>');
  srow(g3, 'PIN ändern', '4 bis 8 Ziffern', [pm, np, np2, btn('Ändern', async () => { if (!/^\d{4,8}$/.test(np.value)) { pm.textContent = 'Nur 4 bis 8 Ziffern. '; return; } if (np.value !== np2.value) { pm.textContent = 'Nicht gleich. '; return; } if (await api.lockChangePin(np.value)) { np.value = np2.value = ''; pm.textContent = '✓ Geändert '; } })]);
  srow(g3, 'Support wieder sperren', '', btn('🔒 Jetzt sperren', () => api.lockRelock()));
}
