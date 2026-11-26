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
  m.innerHTML = '<div class="lock-pg"><div class="lock-ic">🔒</div><h2>Entsperren</h2><p class="sub">Diese App ist im Gäste-Modus. Gib die PIN ein, um Einstellungen, Widget Store und Widgets zu bearbeiten.</p><div id="pp"></div></div>';
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

function guestSettings(B) {
  const on = !!(cfg.lock && cfg.lock.enabled), allow = { tools: true, tasks: true, widgetsToggle: true, ...((cfg.lock && cfg.lock.allow) || {}) };
  B.append(h(`<div class="tb-hero"><div class="lock-ic" style="font-size:44px">${on ? '🔐' : '👥'}</div><div><b>Gäste-Modus ${on ? 'ist eingeschaltet' : ''}</b><div class="dim" style="font-size:13px;margin-top:4px;line-height:1.45">Gib die App an andere Leute weiter, ohne dass sie etwas verstellen. Im Gäste-Modus sind Einstellungen, Widget Store, Widgets bearbeiten, verschieben und löschen, Designs, Layouts, Dock und Konten mit einer PIN gesperrt. Die Widgets auf dem Desktop funktionieren normal weiter.</div></div></div>`));
  const allowGroup = (save) => {
    const g = group(B, 'Das dürfen Gäste', 'Alles andere bleibt gesperrt, bis jemand die PIN eingibt.');
    [['tools', 'Werkzeuge benutzen', 'QR-Code, Umrechner, Timer und mehr'], ['tasks', 'Aufgaben ansehen und abhaken', '']].forEach(([k, l, d]) => srow(g, l, d, tg(allow[k] !== false, (v) => { allow[k] = v; save && save(); })));
  };
  if (!on) {
    allowGroup(null);
    const g = group(B, 'PIN festlegen', 'Merke dir die PIN gut. Ohne PIN kommst du nur über eine Neuinstallation wieder in die Einstellungen.');
    const p1 = h('<input type="password" inputmode="numeric" maxlength="8" placeholder="4 bis 8 Ziffern" style="width:160px">'), p2 = h('<input type="password" inputmode="numeric" maxlength="8" placeholder="Nochmal" style="width:160px">');
    srow(g, 'Neue PIN', '', p1); srow(g, 'PIN wiederholen', '', p2);
    const msg = h('<span class="no"></span>');
    srow(g, 'Gäste-Modus einschalten', 'Die App ist danach sofort gesperrt', [msg, btn('Einschalten und sperren', async () => {
      if (!/^\d{4,8}$/.test(p1.value)) return (msg.textContent = 'Die PIN muss aus 4 bis 8 Ziffern bestehen. ');
      if (p1.value !== p2.value) return (msg.textContent = 'Die beiden PINs sind nicht gleich. ');
      if (await api.lockSetup(p1.value, allow)) { pkState.setTab = 'general'; cfg.runtime = { ...cfg.runtime, locked: true }; go('home'); }
    }, 'p')]);
    return;
  }
  const g0 = group(B, 'Status');
  srow(g0, 'Entsperrt', 'Die App sperrt sich wieder, sobald du das Fenster schliesst', btn('🔒 Jetzt sperren', () => api.lockRelock(), 'p'));
  allowGroup(() => api.lockAllow(allow));
  const g = group(B, 'PIN und Ausschalten');
  const np = h('<input type="password" inputmode="numeric" maxlength="8" placeholder="Neue PIN" style="width:140px">'), msg = h('<span class="dim"></span>');
  srow(g, 'PIN ändern', '4 bis 8 Ziffern', [msg, np, btn('Ändern', async () => { if (!/^\d{4,8}$/.test(np.value)) { msg.textContent = 'Nur 4 bis 8 Ziffern. '; return; } if (await api.lockChangePin(np.value)) { np.value = ''; msg.textContent = '✓ Geändert '; } })]);
  srow(g, 'Gäste-Modus ausschalten', 'Alles ist wieder frei zugänglich', btn('Ausschalten', async () => { if (confirm('Gäste-Modus wirklich ausschalten?')) { await api.lockDisable(); } }, 'dg'));
}
