// Monitore und Werkzeug-Widgets: CPU, RAM, GPU, Datenträger, Netzwerk, Pomodoro, Zwischenablage, Schnelleinstellungen, Fokus, Agenda
const fmtBytes = (b, unit) => { b = +b || 0; if (unit === 'mbit') return (b * 8 / 1e6).toFixed(b * 8 / 1e6 < 10 ? 1 : 0) + ' Mbit/s'; if (b >= 1e9) return (b / 1e9).toFixed(1) + ' GB/s'; if (b >= 1e6) return (b / 1e6).toFixed(1) + ' MB/s'; if (b >= 1e3) return Math.round(b / 1e3) + ' KB/s'; return Math.round(b) + ' B/s'; };
const fmtGB = (b) => (b / 2 ** 30).toFixed(b / 2 ** 30 >= 100 ? 0 : 1) + ' GB';
const sparkPath = (h, w, ht, max) => { if (h.length < 2) return ''; const m = max || Math.max(1e-9, ...h), st = w / (h.length - 1); return h.map((v, i) => `${i ? 'L' : 'M'}${(i * st).toFixed(1)} ${(ht - Math.min(1, v / m) * (ht - 3) - 1.5).toFixed(1)}`).join(''); };
const spark = (h, max) => `<svg class="mo-sp" viewBox="0 0 100 36" preserveAspectRatio="none"><path d="${sparkPath(h, 100, 36, max)} L100 36 L0 36Z" fill="var(--accent)" opacity=".18"/><path d="${sparkPath(h, 100, 36, max)}" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
const ringSvg = (p) => `<svg class="mo-ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--track)" stroke-width="3.4"/><circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--accent)" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="${Math.max(0, Math.min(100, p))} 100" transform="rotate(-90 18 18)"/></svg>`;

// Gemeinsame Bauart für Ring + Verlauf (CPU, RAM, GPU)
function monitor(id, name, icon, desc, source) {
  reg(id, { name, cat: 'extra', icon, size: 'S', theme: TH.black, desc, settings: [{ key: 'warn', label: 'Warnfarbe ab (%)', type: 'number', def: 85 }],
    render(c) {
      const hist = []; let cur = null, dead = false;
      const draw = () => { const w = c.el.clientWidth, h = c.el.clientHeight; if (!cur) return; const pct = cur.v == null ? null : Math.round(cur.v * 100), hot = pct != null && pct >= (c.props.warn || 85);
        if (pct == null) { c.el.innerHTML = `<div class="mo mo-na"><b>${name}</b><span>${esc(cur.sub || 'nicht verfügbar')}</span></div>`; return; }
        const ring = `<div class="mo-r ${hot ? 'hot' : ''}">${ringSvg(pct)}<span class="mo-v">${pct}%</span></div>`, info = `<div class="mo-i"><b>${name}</b><span>${esc(cur.text || '')}</span><span class="dim">${esc(cur.sub || '')}</span></div>`;
        c.el.innerHTML = w < 260 ? `<div class="mo mo-s"><b>${name}</b>${ring}<span class="dim">${esc(cur.text || '')}</span></div>` : `<div class="mo mo-m">${ring}<div class="mo-x">${info}${spark(hist, 1)}</div></div>`; };
      const poll = async () => { if (dead || document.hidden) return; try { cur = await source(c); } catch { cur = { v: null }; } if (cur.v != null) { hist.push(cur.v); if (hist.length > 45) hist.shift(); } draw(); };
      poll(); const iv = setInterval(poll, 2000), stop = sized(c, draw); return () => { dead = true; clearInterval(iv); stop(); };
    } });
}
monitor('cpu', 'CPU', '🧠', 'Prozessorauslastung live mit Verlauf', async (c) => { const s = await c.api.sys(); return { v: s.cpu, text: `${s.cores} Kerne`, sub: s.cpuModel }; });
monitor('ram', 'RAM', '🧩', 'Arbeitsspeicher: belegt/gesamt mit Verlauf', async (c) => { const s = await c.api.sys(); return { v: s.mem, text: `${fmtGB(s.memTotal * s.mem)} von ${fmtGB(s.memTotal)}`, sub: `${fmtGB(s.memFree)} frei` }; });
monitor('gpu', 'GPU', '🎮', 'Grafikkarten-Auslastung (3D-Engine, Windows)', async (c) => { const p = await c.api.perf(); if (!p.supported) return { v: null, sub: 'nur unter Windows' }; if (p.gpu === undefined) return { v: null, sub: 'wird gemessen …' }; if (p.gpu < 0) return { v: null, sub: 'Windows liefert keine GPU-Werte' }; return { v: Math.min(1, p.gpu / 100), text: p.gpuName || '', sub: '3D-Engine' }; });

reg('disk', { name: 'Datenträger', cat: 'extra', icon: '💽', size: 'M', theme: TH.black, desc: 'Belegter Speicher des Systemlaufwerks und Lese-/Schreibgeschwindigkeit',
  render(c) {
    let dead = false, hr = [], hw = [];
    const poll = async () => { if (dead || document.hidden) return; const s = await c.api.sys(), p = await c.api.perf().catch(() => ({})), pct = s.disk == null ? 0 : Math.round(s.disk * 100);
      if (p.dr !== undefined) { hr.push(p.dr); hw.push(p.dw); if (hr.length > 45) { hr.shift(); hw.shift(); } }
      const w = c.el.clientWidth; c.el.innerHTML = `<div class="mo mo-d"><div class="mo-h"><b>${(c.props.label || 'System')}</b><span>${pct}%</span></div><div class="bar"><i style="width:${pct}%"></i></div><span class="dim">${s.diskTotal ? `${fmtGB(s.diskTotal - s.diskFree)} von ${fmtGB(s.diskTotal)} belegt · ${fmtGB(s.diskFree)} frei` : 'nicht verfügbar'}</span>${p.supported && p.dr !== undefined ? `<div class="mo-io"><span>↓ Lesen ${fmtBytes(p.dr)}</span><span>↑ Schreiben ${fmtBytes(p.dw)}</span></div>${w > 260 ? spark(hr.map((v, i) => v + hw[i])) : ''}` : ''}</div>`; };
    poll(); const iv = setInterval(poll, 2500); return () => { dead = true; clearInterval(iv); };
  } });

reg('netactivity', { name: 'Netzwerk-Aktivität', cat: 'extra', icon: '📡', size: 'M', theme: TH.black, desc: 'Aktuelle Download-/Upload-Geschwindigkeit mit Verlauf',
  settings: [{ key: 'unit', label: 'Einheit', type: 'select', options: [['bytes', 'Byte/s (KB, MB)'], ['mbit', 'Mbit/s']], def: 'bytes' }],
  render(c) {
    let dead = false; const rx = [], tx = [];
    const poll = async () => { if (dead || document.hidden) return; const p = await c.api.perf().catch(() => ({})); if (!p.supported) { c.el.innerHTML = '<div class="mo mo-na"><b>Netzwerk</b><span>nur unter Windows</span></div>'; return; } if (p.rx === undefined) { c.el.innerHTML = '<div class="mo mo-na"><b>Netzwerk</b><span>wird gemessen …</span></div>'; return; }
      rx.push(p.rx); tx.push(p.tx); if (rx.length > 45) { rx.shift(); tx.shift(); } const u = c.props.unit || 'bytes';
      c.el.innerHTML = `<div class="mo mo-n"><div class="mo-nl"><div><span class="dim">↓ Empfang</span><b>${fmtBytes(p.rx, u)}</b></div><div><span class="dim">↑ Senden</span><b>${fmtBytes(p.tx, u)}</b></div></div>${spark(rx)}</div>`; };
    poll(); const iv = setInterval(poll, 2500); return () => { dead = true; clearInterval(iv); };
  } });

reg('sysinfo', { name: 'Systeminfo', cat: 'extra', icon: 'ℹ️', size: 'M', theme: TH.black, desc: 'Gerät, Betriebssystem, Prozessor, Grafikkarte, Arbeitsspeicher, Laufzeit',
  render(c) {
    const up = async () => { const s = await c.api.sys(), p = await c.api.perf().catch(() => ({})), hrs = Math.floor(s.uptime / 3600), row = (k, v) => v ? `<div><span class="dim">${k}</span><span>${esc(v)}</span></div>` : '';
      c.el.innerHTML = `<div class="wc">${row('Gerät', s.host)}${row('System', s.osName)}${row('Prozessor', s.cpuModel && `${s.cpuModel.replace(/\(R\)|\(TM\)|CPU/g, '').replace(/\s+/g, ' ').trim()} (${s.cores} Kerne)`)}${row('Grafik', p.gpuName)}${row('Arbeitsspeicher', fmtGB(s.memTotal))}${row('Läuft seit', `${hrs} h ${Math.floor(s.uptime / 60) % 60} min`)}</div>`; };
    up(); const i = setInterval(up, 30000); return () => clearInterval(i);
  } });

// ---- Pomodoro ----
reg('pomodoro', { name: 'Pomodoro-Timer', cat: 'extra', icon: '🍅', size: 'S', theme: TH.black, desc: 'Arbeits- und Pausenintervalle mit Benachrichtigung; läuft auch nach Neustart des Widgets weiter',
  settings: [{ key: 'work', label: 'Arbeit (Minuten)', type: 'number', def: 25 }, { key: 'short', label: 'Kurze Pause (Minuten)', type: 'number', def: 5 }, { key: 'long', label: 'Lange Pause (Minuten)', type: 'number', def: 15 }, { key: 'every', label: 'Lange Pause nach … Runden', type: 'number', def: 4 }],
  render(c) {
    const d = c.data, P = c.props, dur = (m) => (m === 'work' ? P.work || 25 : m === 'short' ? P.short || 5 : P.long || 15) * 60;
    d.mode = d.mode || 'work'; d.count = d.count || 0; if (d.left === undefined) d.left = dur(d.mode);
    const names = { work: 'Fokus', short: 'Kurze Pause', long: 'Lange Pause' };
    const left = () => (d.running ? Math.max(0, Math.round((d.endAt - Date.now()) / 1000)) : d.left);
    const next = () => { if (d.mode === 'work') { d.count++; d.mode = d.count % (P.every || 4) === 0 ? 'long' : 'short'; } else d.mode = 'work'; d.running = false; d.left = dur(d.mode); c.save(d); };
    const draw = () => { const l = left(), tot = dur(d.mode), p = (1 - l / tot) * 100, w = c.el.clientWidth;
      c.el.innerHTML = `<div class="pm"><div class="pm-m">${names[d.mode]}${d.count ? ` · ${d.count}` : ''}</div><div class="pm-r">${ringSvg(p)}<span class="pm-t">${String(Math.floor(l / 60)).padStart(2, '0')}:${String(l % 60).padStart(2, '0')}</span></div><div class="pm-b"><button data-a="toggle">${d.running ? 'Pause' : 'Start'}</button>${w > 200 ? '<button data-a="reset">Zurück</button><button data-a="skip">Weiter</button>' : ''}</div></div>`;
      c.el.querySelectorAll('button').forEach((b) => (b.onclick = () => { const a = b.dataset.a;
        if (a === 'toggle') { if (d.running) { d.left = left(); d.running = false; } else { d.endAt = Date.now() + d.left * 1000; d.running = true; } } else if (a === 'reset') { d.running = false; d.left = dur(d.mode); } else if (a === 'skip') next(); c.save(d); draw(); })); };
    const tick = () => { if (d.running && left() <= 0) { try { new Notification('Pomodoro', { body: d.mode === 'work' ? 'Runde geschafft – Zeit für eine Pause!' : 'Pause vorbei – weiter geht’s!' }); } catch {} next(); draw(); } else { const t = c.el.querySelector('.pm-t'); if (t) { const l = left(); t.textContent = `${String(Math.floor(l / 60)).padStart(2, '0')}:${String(l % 60).padStart(2, '0')}`; const r = c.el.querySelector('.mo-ring circle:nth-child(2)'); if (r) r.setAttribute('stroke-dasharray', `${(1 - l / dur(d.mode)) * 100} 100`); } } };
    draw(); const iv = setInterval(tick, 500), stop = sized(c, draw); return () => { clearInterval(iv); stop(); };
  } });

// ---- Zwischenablage-Verlauf ----
reg('clipboard', { name: 'Zwischenablage', cat: 'extra', icon: '📋', size: 'M', theme: TH.black, desc: 'Verlauf kopierter Texte (nur im Arbeitsspeicher, wird beim Beenden gelöscht); Klick kopiert erneut',
  render(c) {
    let dead = false, list = [], flash = '';
    const draw = () => { c.el.innerHTML = `<div class="cb2"><div class="cb2-h"><b>Zwischenablage</b>${list.length ? '<button class="cb2-x" data-a="clear">Leeren</button>' : ''}</div><div class="cb2-l">${list.length ? list.map((t, i) => `<div class="cb2-i ${flash === t ? 'ok' : ''}" data-i="${i}" title="Klicken zum Kopieren"><span>${esc(t.replace(/\s+/g, ' ').slice(0, 160))}</span><i data-x="${i}">✕</i></div>`).join('') : '<div class="dim" style="padding:8px 0">Noch nichts kopiert. Kopierte Texte erscheinen hier.</div>'}</div></div>`;
      c.el.querySelectorAll('.cb2-i').forEach((r) => (r.onclick = async (e) => { const t = list[+r.dataset.i]; if (e.target.dataset.x !== undefined) { list = await c.api.clipRemove(t); } else { await c.api.clipCopy(t); flash = t; setTimeout(() => { flash = ''; draw(); }, 900); } draw(); }));
      const cl = c.el.querySelector('[data-a=clear]'); if (cl) cl.onclick = async () => { if (confirm('Den gesamten Verlauf löschen?')) { await c.api.clipClear(); list = []; draw(); } }; };
    const poll = async () => { if (dead || document.hidden) return; const l = await c.api.clipGet(); if (JSON.stringify(l) !== JSON.stringify(list)) { list = l; draw(); } };
    draw(); poll(); const iv = setInterval(poll, 1500); return () => { dead = true; clearInterval(iv); };
  } });

// ---- Schnelleinstellungen ----
reg('quicksettings', { name: 'Schnelleinstellungen', cat: 'extra', icon: '🎛️', size: 'M', theme: TH.black, desc: 'Ton, Helligkeit, Sperren, Screenshot und Windows-Einstellungen mit einem Klick',
  render(c) {
    const B = [['mute', '🔇', 'Stumm'], ['voldown', '🔉', 'Leiser'], ['volup', '🔊', 'Lauter'], ['bdown', '🔅', 'Dunkler'], ['bup', '🔆', 'Heller'], ['lock', '🔒', 'Sperren'], ['screenshot', '📸', 'Screenshot'], ['wifi', '📶', 'WLAN'], ['bt', '🔵', 'Bluetooth'], ['display', '🖥️', 'Anzeige']];
    c.el.innerHTML = `<div class="qs">${B.map(([k, ic, l]) => `<button data-k="${k}" title="${l}"><span>${ic}</span><small>${l}</small></button>`).join('')}</div><div class="qs-m dim"></div>`;
    const msg = c.el.querySelector('.qs-m'); let tm;
    const say = (t) => { msg.textContent = t; clearTimeout(tm); tm = setTimeout(() => (msg.textContent = ''), 2500); };
    c.el.querySelectorAll('button').forEach((b) => (b.onclick = async () => { const k = b.dataset.k; let r;
      if (k === 'bdown') r = await c.api.qs('brightness', -10); else if (k === 'bup') r = await c.api.qs('brightness', 10);
      else if (k === 'wifi') r = await c.api.qs('settings', 'ms-settings:network-wifi'); else if (k === 'bt') r = await c.api.qs('settings', 'ms-settings:bluetooth'); else if (k === 'display') r = await c.api.qs('settings', 'ms-settings:display'); else r = await c.api.qs(k);
      if (!r.ok) say(r.reason === 'windows-only' ? 'Nur unter Windows' : r.reason === 'unsupported' ? 'Von diesem Display nicht unterstützt' : 'Hat nicht geklappt'); else if (r.value) say('Helligkeit ' + r.value + ' %'); }));
  } });

// ---- Fokus-Modus ----
reg('focus', { name: 'Fokus-Modus', cat: 'extra', icon: '🎯', size: 'S', theme: TH.black, desc: 'Blendet alle anderen Widgets (und optional den Dock) für eine Fokus-Zeit aus',
  settings: [{ key: 'minutes', label: 'Dauer (Minuten)', type: 'number', def: 25 }, { key: 'hideDock', label: 'Dock ebenfalls ausblenden', type: 'bool', def: true }],
  render(c) {
    const d = c.data, P = c.props, hideDock = P.hideDock !== false; const left = () => Math.max(0, Math.round(((d.endAt || 0) - Date.now()) / 1000));
    const stop = (note) => { d.on = false; c.save(d); c.api.focusSet(false); if (note) { try { new Notification('Fokus beendet', { body: 'Deine Fokus-Zeit ist vorbei. Alle Widgets sind wieder sichtbar.' }); } catch {} } draw(); };
    const draw = () => { const l = left(); c.el.innerHTML = `<div class="fo ${d.on ? 'on' : ''}"><div class="fo-t">${d.on ? 'Fokus aktiv' : 'Fokus-Modus'}</div><div class="fo-c">${d.on ? `${String(Math.floor(l / 60)).padStart(2, '0')}:${String(l % 60).padStart(2, '0')}` : `${P.minutes || 25} min`}</div><button>${d.on ? 'Beenden' : 'Starten'}</button></div>`;
      c.el.querySelector('button').onclick = () => { if (d.on) stop(false); else { d.on = true; d.endAt = Date.now() + (P.minutes || 25) * 60000; c.save(d); c.api.focusSet(true, c.w.id, hideDock); draw(); } }; };
    if (d.on) { if (left() > 0) c.api.focusSet(true, c.w.id, hideDock); else stop(true); }
    draw(); const iv = setInterval(() => { if (d.on && left() <= 0) stop(true); else if (d.on) { const e = c.el.querySelector('.fo-c'); if (e) { const l = left(); e.textContent = `${String(Math.floor(l / 60)).padStart(2, '0')}:${String(l % 60).padStart(2, '0')}`; } } }, 1000);
    return () => clearInterval(iv);
  } });

// ---- Kalender-Agenda (iCloud + eigene Termine) ----
reg('agenda', { name: 'Kalender-Agenda', cat: 'apple', icon: '🗒️', size: 'M', theme: TH.white, desc: 'Kommende Termine nach Tagen (iCloud und eigene Termine); neue Termine direkt eintragen',
  render(c) {
    let form = false; const tag = () => LANG_TAG[getLang()];
    const draw = () => {
      const now = Date.now(), evs = allEvents(c).filter((e) => e.end > now).slice(0, 40), groups = {};
      evs.forEach((e) => { const k = new Date(e.start).toDateString(); (groups[k] = groups[k] || []).push(e); });
      const lbl = (k) => { const d = new Date(k), t = new Date(); return d.toDateString() === t.toDateString() ? t0('today') : new Date(+t + 864e5).toDateString() === k ? t0('tomorrow') : d.toLocaleDateString(tag(), { weekday: 'long', day: 'numeric', month: 'short' }); }; const t0 = (k) => t(k);
      c.el.innerHTML = `<div class="ag"><div class="ag-h"><b>${esc(new Date().toLocaleDateString(tag(), { weekday: 'long', day: 'numeric', month: 'long' }))}</b><button class="ag-p" title="Termin hinzufügen">＋</button></div>${form ? `<form class="ag-f"><input class="at" placeholder="Titel" required><input type="datetime-local" class="ad" required><button>Hinzufügen</button></form>` : ''}<div class="ag-l">${Object.keys(groups).length ? Object.entries(groups).map(([k, l]) => `<div class="ag-g">${esc(lbl(k))}</div>${l.map((e) => `<div class="ev"><i style="background:${esc(e.color)}"></i><div><b>${esc(e.title)}</b><span class="dim">${e.allDay ? t('allday') : hm(e.start)}${e.cal && e.cal !== 'Lokal' ? ' · ' + esc(e.cal) : ''}</span></div>${e.local ? `<u data-r="${esc(e.id)}" title="Termin löschen">✕</u>` : ''}</div>`).join('')}`).join('') : `<div class="dim ag-n">${esc(t('cal.none'))}${!c.cache.connected ? ` <button class="ic-btn">${esc(t('cal.signin'))}</button>` : ''}</div>`}</div></div>`;
      c.el.querySelector('.ag-p').onclick = () => { form = !form; draw(); };
      const f = c.el.querySelector('.ag-f'); if (f) { const d0 = new Date(Date.now() + 36e5); d0.setMinutes(0); f.querySelector('.ad').value = new Date(d0 - d0.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); f.onsubmit = async (e) => { e.preventDefault(); const s = new Date(f.querySelector('.ad').value).getTime(); await c.api.eventAdd({ title: f.querySelector('.at').value.trim(), start: s, end: s + 36e5 }); form = false; }; }
      c.el.querySelectorAll('[data-r]').forEach((u) => (u.onclick = () => confirm('Diesen Termin löschen?') && c.api.eventRemove(u.dataset.r)));
      c.el.querySelectorAll('.ic-btn').forEach((b) => (b.onclick = () => c.api.openApp('iphone')));
    };
    const stop = sized(c, draw), iv = setInterval(draw, 60000); return () => { stop(); clearInterval(iv); };
  } });
