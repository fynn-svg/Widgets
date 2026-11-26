const WIDGETS = {};
const SIZES = { XS: [120, 120], S: [170, 170], M: [360, 170], L: [360, 360], XL: [540, 360] };
const SIZE_NAMES = { XS: 'Sehr klein', S: 'Klein', M: 'Mittel', L: 'Gross', XL: 'Sehr gross' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reg = (id, def) => { WIDGETS[id] = { id, ...def }; };
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return ymd(d); };

const TH = {
  white: { bg1: '#ffffff', bg2: '#f2f2f7', gradient: false, opacity: 0.94, text: '#1d1d1f', icon: '#1d1d1f', accent: '#ff3b30', btn: '#ff3b30', progress: '#34c759', border: '#000000', borderOpacity: 0.06, acrylic: false },
  black: { bg1: '#000000', gradient: false, opacity: 0.86, text: '#ffffff', icon: '#ffffff', accent: '#ff9f0a', btn: '#ff9f0a', progress: '#30d158', border: '#ffffff', borderOpacity: 0.1, acrylic: false },
  blue: { bg1: '#4a9bf0', bg2: '#1f5fbf', gradient: true, angle: 165, opacity: 0.96, text: '#ffffff', icon: '#ffffff', accent: '#ffffff', btn: '#ffffff', progress: '#ffffff', border: '#ffffff', borderOpacity: 0.12, acrylic: false },
  yellow: { bg1: '#fff3b0', bg2: '#ffe066', gradient: true, angle: 160, opacity: 0.97, text: '#2b2600', icon: '#2b2600', accent: '#d99a00', btn: '#d99a00', progress: '#d99a00', border: '#000000', borderOpacity: 0.06, acrylic: false },
  red: { bg1: '#ff5e72', bg2: '#c2102b', gradient: true, angle: 160, opacity: 0.97, text: '#ffffff', icon: '#ffffff', accent: '#ffffff', btn: '#ffffff', progress: '#ffffff', border: '#ffffff', borderOpacity: 0.12, acrylic: false },
  none: { bg1: '#000000', gradient: false, opacity: 0, text: '#ffffff', icon: '#ffffff', accent: '#ffffff', btn: '#ffffff', progress: '#ffffff', border: '#ffffff', borderOpacity: 0, acrylic: false }
};
const sized = (c, draw) => { const run = () => draw(c.el.clientWidth, c.el.clientHeight); if (typeof ResizeObserver === 'undefined') { run(); return () => {}; } const ro = new ResizeObserver(run); ro.observe(c.el); run(); return () => ro.disconnect(); };
const hm = (ms) => new Date(ms).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });

// ---------- Apple-Widgets ----------
// Uhr-Hilfen
function wallParts(tz) {
  const f = new Intl.DateTimeFormat('en-GB', { ...(tz ? { timeZone: tz } : {}), hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' });
  const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, +x.value])); return p;
}
const FACES = { weiss: { bg: '#ffffff', fg: '#111111' }, schwarz: { bg: '#1c1c1e', fg: '#ffffff' }, strich: { bg: '#2c2c2e', fg: '#ffffff' } };
function clockSVG(o) {
  const f = FACES[o.face] || FACES.weiss; let t = '', n = '';
  for (let i = 0; i < 60; i++) { if (o.face === 'strich' && i % 5) continue; const a = i * 6 * Math.PI / 180, big = i % 5 === 0, r1 = o.face === 'strich' ? 38 : big ? 41 : 44, r2 = 47; t += `<line x1="${50 + r1 * Math.sin(a)}" y1="${50 - r1 * Math.cos(a)}" x2="${50 + r2 * Math.sin(a)}" y2="${50 - r2 * Math.cos(a)}" stroke="${f.fg}" stroke-width="${o.face === 'strich' ? 3 : big ? 1.4 : .5}" opacity="${big || o.face === 'strich' ? 1 : .55}"/>`; }
  if (o.numbers) for (let i = 1; i <= 12; i++) { const a = i * 30 * Math.PI / 180; n += `<text x="${50 + 33 * Math.sin(a)}" y="${50 - 33 * Math.cos(a) + 4}" text-anchor="middle" font-size="${o.mini ? 10 : 11}" fill="${f.fg}" font-weight="600" font-family="Segoe UI,sans-serif">${i}</text>`; }
  const lbl = o.label ? `<text x="50" y="${o.numbers ? 66 : 38}" text-anchor="middle" font-size="8" fill="${f.fg}" opacity=".55" font-family="Segoe UI,sans-serif" font-weight="600">${esc(o.label)}</text>` : '';
  return `<svg class="ck" viewBox="0 0 100 100" data-tz="${esc(o.tz || '')}"><circle cx="50" cy="50" r="49" fill="${f.bg}"/>${t}${n}${lbl}
    <line class="hh" x1="50" y1="52" x2="50" y2="28" stroke="${f.fg}" stroke-width="3.4" stroke-linecap="round"/><line class="mh" x1="50" y1="52" x2="50" y2="15" stroke="${f.fg}" stroke-width="2.4" stroke-linecap="round"/>
    <line class="sh" x1="50" y1="60" x2="50" y2="12" stroke="#ff9f0a" stroke-width="1.1" stroke-linecap="round"/><circle cx="50" cy="50" r="2.6" fill="#ff9f0a"/></svg>`;
}
function tickClocks(root) {
  root.querySelectorAll('svg.ck').forEach((s) => { const p = wallParts(s.dataset.tz || undefined), ms = new Date().getMilliseconds() / 1000, sec = p.second + ms, mi = p.minute + sec / 60, ho = (p.hour % 12) + mi / 60;
    s.querySelector('.hh').setAttribute('transform', `rotate(${ho * 30} 50 50)`); s.querySelector('.mh').setAttribute('transform', `rotate(${mi * 6} 50 50)`); s.querySelector('.sh').setAttribute('transform', `rotate(${sec * 6} 50 50)`); });
}
const FACE_OPT = [['weiss', 'Weiss'], ['schwarz', 'Schwarz'], ['strich', 'Schwarz mit Strichen']];

reg('clock-digital', { name: 'Uhr digital', cat: 'apple', icon: '🕐', size: 'S', theme: TH.black, desc: 'Uhrzeit und Datum, auch gross und fett wie bei Apple',
  settings: [{ key: 'style', label: 'Stil', type: 'select', options: [['gross', 'Gross und fett'], ['modern', 'Dünn mit Datum']], def: 'gross' }, { key: 'h12', label: 'set.h12', type: 'select', options: [['', 'set.default'], ['24', 'st.h24'], ['12', 'st.h12']], def: '' }, { key: 'seconds', label: 'Sekunden anzeigen', type: 'bool', def: false }, { key: 'tz', label: 'Zeitzone (leer = lokal)', type: 'text' }, { key: 'label', label: 'Kurzname', type: 'text' }],
  render(c) {
    const tz = c.props.tz || undefined, big = (c.props.style || 'gross') === 'gross';
    c.el.innerHTML = big ? `<div class="clk"><div class="dim" style="text-align:center;font-weight:600;font-size:max(11px,5cqmin)">${esc(c.props.label || '')}</div><div class="clk-b"></div></div>` : '<div class="clk"><div class="clk-t"></div><div class="clk-d"></div></div>';
    const h12 = use12(c.props.h12 || (c.settings && c.settings.h12) || 'auto'), sec = !!c.props.seconds;
    const fmtT = (n, two) => new Intl.DateTimeFormat(LANG_TAG[getLang()], { ...(tz ? { timeZone: tz } : {}), hour: two ? '2-digit' : 'numeric', minute: '2-digit', ...(sec ? { second: '2-digit' } : {}), hour12: h12 }).formatToParts(n).filter((p) => p.type !== 'dayPeriod' && !(p.type === 'literal' && /\s/.test(p.value) && p === null)).map((p) => p.value).join('').trim();
    const tick = () => { const n = new Date(), o = { ...(tz ? { timeZone: tz } : {}), hour: 'numeric', minute: '2-digit', hourCycle: 'h23' };
      if (big) c.el.querySelector('.clk-b').textContent = fmtT(n, false);
      else { c.el.querySelector('.clk-t').textContent = fmtT(n, true); c.el.querySelector('.clk-d').textContent = n.toLocaleDateString('de-CH', { ...(tz ? { timeZone: tz } : {}), weekday: 'long', day: 'numeric', month: 'long' }); } };
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i);
  } });

reg('clock-analog', { name: 'Uhr analog', cat: 'apple', icon: '🕰️', size: 'S', theme: TH.none, desc: 'Analoge Uhr: weiss, schwarz oder mit Strichen',
  settings: [{ key: 'face', label: 'Zifferblatt', type: 'select', options: FACE_OPT, def: 'weiss' }, { key: 'numbers', label: 'Zahlen', type: 'select', options: [['1', 'Anzeigen'], ['0', 'Ausblenden']], def: '1' }, { key: 'tz', label: 'Zeitzone (leer = lokal)', type: 'text' }, { key: 'label', label: 'Kurzname (z. B. NYC)', type: 'text' }],
  render(c) {
    c.el.style.padding = '0';
    c.el.innerHTML = `<div class="analog">${clockSVG({ face: c.props.face || 'weiss', numbers: (c.props.numbers ?? '1') !== '0', tz: c.props.tz, label: c.props.label })}</div>`;
    tickClocks(c.el); const i = setInterval(() => tickClocks(c.el), 250); return () => clearInterval(i);
  } });

reg('world-clock', { name: 'Weltuhr', cat: 'apple', icon: '🌍', size: 'M', theme: TH.black, desc: 'Analoge Uhren mit Heute/Morgen und Zeitunterschied',
  settings: [{ key: 'zones', label: 'Zeitzonen (IANA, mit Komma)', type: 'text', def: 'Europe/Zurich, Asia/Tokyo, Australia/Sydney, America/New_York' }],
  render(c) {
    const zones = (c.props.zones || this.settings[0].def).split(',').map((z) => z.trim()).filter(Boolean).slice(0, 4);
    const draw = () => {
      const now = new Date(), loc = new Date(now.toLocaleString('en-US')), day = (tz) => now.toLocaleDateString('en-CA', { timeZone: tz }), ld = now.toLocaleDateString('en-CA');
      c.el.innerHTML = '<div class="wcl">' + zones.map((z) => { let nm = z.split('/').pop().replace(/_/g, ' '), tzh = 0, lbl = 'Heute', face = 'schwarz';
        try { const t = new Date(now.toLocaleString('en-US', { timeZone: z })); tzh = Math.round((t - loc) / 36e5 * 2) / 2; const d = day(z); lbl = d > ld ? 'Morgen' : d < ld ? 'Gestern' : 'Heute'; const h = wallParts(z).hour; face = h >= 6 && h < 18 ? 'weiss' : 'schwarz'; } catch {}
        return `<div class="wcl-i">${clockSVG({ face, numbers: true, tz: z, mini: true })}<b>${esc(nm)}</b><span class="dim">${lbl}</span><span class="dim">${tzh >= 0 ? '+' : ''}${String(tzh).replace('.5', ':30')} Std</span></div>`; }).join('') + '</div>';
      tickClocks(c.el);
    };
    draw(); const i = setInterval(() => tickClocks(c.el), 500), j = setInterval(draw, 60000); return () => { clearInterval(i); clearInterval(j); };
  } });

function monthGrid(first = 1) {
  const n = new Date(), y = n.getFullYear(), m = n.getMonth(), off = (new Date(y, m, 1).getDay() - first + 7) % 7, dim = new Date(y, m + 1, 0).getDate(), prev = new Date(y, m, 0).getDate();
  const L0 = weekLetters(), L = first === 0 ? [L0[6], ...L0.slice(0, 6)] : L0; let g = L.map((d) => `<div class="h">${d}</div>`).join('');
  for (let i = 0; i < 42; i++) { const dn = i - off + 1; if (dn < 1) g += `<div class="o">${prev + dn}</div>`; else if (dn > dim) { if (i >= 35 && off + dim <= 35) break; g += `<div class="o">${dn - dim}</div>`; } else g += `<div class="${dn === n.getDate() ? 't' : ''}"><span>${dn}</span></div>`; }
  return `<div class="cal-g">${g}</div>`;
}
const allEvents = (c) => [...(c.cache.events || []), ...(c.events || [])].sort((a, b) => a.start - b.start);
function eventList(c, max) {
  const cache = c.cache, now = Date.now(), evs = allEvents(c).filter((e) => e.end > now).slice(0, max);
  if (!cache.connected && !(c.events || []).length) return `<div class="dim ev-n">${t('cal.connect')} <button class="ic-btn" style="border:0;border-radius:8px;padding:.2em .7em;background:var(--accent);color:#fff;cursor:pointer;margin-top:4px">${t('cal.signin')}</button></div>`;
  if (!evs.length) return `<div class="dim ev-n">${t('cal.none')}</div>`;
  const today = new Date().toDateString();
  return evs.map((e) => { const d = new Date(e.start); const lbl = e.allDay ? t('allday') : hm(e.start); const day = d.toDateString() === today ? '' : d.toLocaleDateString(LANG_TAG[getLang()], { weekday: 'short' }) + ' ';
    return `<div class="ev"><i style="background:${esc(e.color)}"></i><div><b>${esc(e.title)}</b><span class="dim">${day}${lbl}</span></div></div>`; }).join('');
}
function weekView(c) { // Wochenübersicht: 7 Spalten mit Datum und Terminen
  const n = new Date(), first = ((c.props.weekStart || (c.settings && c.settings.weekStart) || 'mon') === 'sun') ? 0 : 1, off = (n.getDay() - first + 7) % 7, start = new Date(n.getFullYear(), n.getMonth(), n.getDate() - off), tag = LANG_TAG[getLang()], evs = allEvents(c);
  const cols = [...Array(7)].map((_, i) => { const d = new Date(+start + i * 864e5), d0 = +d, d1 = d0 + 864e5, list = evs.filter((e) => e.start < d1 && e.end > d0).slice(0, 4), today = d.toDateString() === n.toDateString();
    return `<div class="wk-c ${today ? 'tod' : ''}"><div class="wk-h">${esc(d.toLocaleDateString(tag, { weekday: 'short' }))}</div><div class="wk-d"><span>${d.getDate()}</span></div>${list.map((e) => `<div class="wk-e" style="--ec:${esc(e.color)}">${esc(e.title)}</div>`).join('')}</div>`; }).join('');
  c.el.innerHTML = `<div class="wk"><div class="wk-t">${esc(n.toLocaleDateString(tag, { month: 'long', year: 'numeric' }))}</div><div class="wk-g">${cols}</div></div>`;
}
function iosCalendar(c) {
  const n = new Date(), wk = c.props.weekStart || (c.settings && c.settings.weekStart) || 'mon', first = wk === 'sun' ? 0 : 1;
  const y = n.getFullYear(), m = n.getMonth(), dim = new Date(y, m + 1, 0).getDate(), off = (new Date(y, m, 1).getDay() - first + 7) % 7, rows = Math.ceil((off + dim) / 7);
  const L0 = weekLetters(), L = first === 0 ? [L0[6], ...L0.slice(0, 6)] : L0, wend = first === 0 ? [0, 6] : [5, 6], tag = LANG_TAG[getLang()];
  let g = L.map((d, i) => `<div class="ic-h ${wend.includes(i) ? 'we' : ''}">${d}</div>`).join('') + '<div></div>'.repeat(off);
  for (let d = 1; d <= dim; d++) { const col = (off + d - 1) % 7; g += `<div class="ic-d ${wend.includes(col) ? 'we' : ''} ${d === n.getDate() ? 'tod' : ''}"><span>${d}</span></div>`; }
  c.el.style.setProperty('--u', 'calc(min(100cqw, 100cqh) / 360 * var(--fs,1))'); c.el.style.padding = 'calc(var(--u) * 24)';
  c.el.innerHTML = `<div class="ic"><div class="ic-m">${esc(n.toLocaleDateString(tag, { month: 'long' }).toLocaleUpperCase(tag))}</div><div class="ic-g" style="grid-template-rows:auto repeat(${rows},1fr)">${g}</div></div>`;
}
reg('calendar', { name: 'Kalender', cat: 'apple', icon: '📅', size: 'S', theme: TH.white, desc: 'Monatsansicht, Datum und Termine aus iCloud, passt sich der Grösse an',
  settings: [{ key: 'view', label: 'Ansicht', type: 'select', options: [['auto', 'Automatisch nach Grösse'], ['ios', 'iOS-Kalender (Monat)'], ['week', 'Wochenübersicht'], ['month', 'Monat'], ['day', 'Tag und Termine']], def: 'auto' }, { key: 'weekStart', label: 'set.weekStart', type: 'select', options: [['', 'set.default'], ['mon', 'st.mon'], ['sun', 'st.sun']], def: '' }],
  render(c) {
    const draw = (w, h) => {
      if (c.props.view === 'ios') { iosCalendar(c); return; }
      if (c.props.view === 'week') { weekView(c); return; }
      const n = new Date(), v = c.props.view || 'auto', big = v === 'auto' ? (w >= 260 && h >= 260) : v === 'month' && h >= 260, wide = w >= 260, monthOnly = v === 'month' || (v === 'auto' && !wide);
      const date = `<div class="ac-w">${n.toLocaleDateString(LANG_TAG[getLang()], { weekday: 'long' }).toUpperCase()}</div><div class="ac-d">${n.getDate()}</div>`;
      const max = big ? 3 : wide ? Math.max(2, Math.floor(h / 46)) : 2;
      if (w < 150 && v !== 'month') c.el.innerHTML = `<div class="ac ac-xs">${date}<div class="dim ac-m">${n.toLocaleDateString(LANG_TAG[getLang()], { month: 'long' })}</div></div>`;
      else if (monthOnly && !big) c.el.innerHTML = `<div class="cal"><h3>${n.toLocaleDateString(LANG_TAG[getLang()], { month: 'long' }).toUpperCase()}</h3>${monthGrid(((c.props.weekStart || (c.settings && c.settings.weekStart) || 'mon') === 'sun') ? 0 : 1)}</div>`;
      else if (big) c.el.innerHTML = `<div class="cal calx"><h3>${n.toLocaleDateString(LANG_TAG[getLang()], { month: 'long', year: 'numeric' })}</h3>${monthGrid(((c.props.weekStart || (c.settings && c.settings.weekStart) || 'mon') === 'sun') ? 0 : 1)}<div class="evs">${eventList(c, max)}</div></div>`;
      else if (wide) c.el.innerHTML = `<div class="ac2"><div class="ac">${date}</div><div class="evs">${eventList(c, max)}</div></div>`;
      else c.el.innerHTML = `<div class="ac">${date}<div class="evs">${eventList(c, max)}</div></div>`;
      c.el.querySelectorAll('.ic-btn').forEach((b) => (b.onclick = () => c.api.openApp('iphone')));
    };
    // jede Minute neu zeichnen; nach Mitternacht erscheint dadurch automatisch das neue Datum
    const stop = sized(c, draw); const i = setInterval(() => draw(c.el.clientWidth, c.el.clientHeight), 30000); return () => { stop(); clearInterval(i); };
  } });

const batIcon = (n) => /head|buds|airpod|sound|audio|kopf/i.test(n) ? '🎧' : /mouse|maus/i.test(n) ? '🖱️' : /key|tasta/i.test(n) ? '⌨️' : /pen|stift/i.test(n) ? '🖊️' : /watch|uhr/i.test(n) ? '⌚' : /phone|iphone|galaxy|pixel/i.test(n) ? '📱' : '🔵';
reg('battery', { name: 'Batterie', cat: 'apple', icon: '🔋', size: 'S', theme: TH.none, desc: 'Laptop-Akku mit Ladestatus; angeschlossene Bluetooth-Geräte, soweit Windows den Akkustand liefert',
  render(c) {
    let bat = null, devs = [], dead = false; const el = c.el;
    const ring = (p, ic, label, sub) => `<div class="bt"><div class="bwrap"><div class="ring" style="--p:${p}"></div><span class="bi">${ic}</span></div><div class="bp">${p}%</div><div class="l bl">${esc(label || '')}${sub ? ' · ' + sub : ''}</div></div>`;
    const draw = () => { const w = el.clientWidth, rings = [];
      if (bat) rings.push(ring(Math.round(bat.level * 100), '💻', w > 150 ? 'Laptop' : '', bat.charging ? '⚡' : '')); else rings.push(`<div class="bt"><div class="bwrap"><div class="ring" style="--p:0"></div><span class="bi">💻</span></div><div class="bp">–</div><div class="l bl">${w > 150 ? 'nicht verfügbar' : ''}</div></div>`);
      if (w >= 260) devs.slice(0, Math.max(0, Math.floor(w / 110) - 1)).forEach((d) => rings.push(ring(d.level, batIcon(d.name), d.name.slice(0, 14))));
      el.innerHTML = `<div class="bts">${rings.join('')}</div>`; };
    navigator.getBattery?.().then((x) => { bat = x; draw(); x.addEventListener('levelchange', draw); x.addEventListener('chargingchange', draw); }).catch(() => draw());
    const loadDev = async () => { try { const r = await c.api.batteryDevices(); if (!dead) { devs = r.devices || []; draw(); } } catch { } }; loadDev(); const iv = setInterval(loadDev, 300000);
    const stop = sized(c, draw); return () => { dead = true; clearInterval(iv); stop(); };
  } });

reg('notes', { name: 'Notizen', cat: 'apple', icon: '📝', size: 'M', theme: TH.white, desc: 'Mehrere Notizen mit Blättern, Neu und Löschen; wird automatisch gespeichert',
  render(c) {
    const d = c.data; if (!d.notes) d.notes = [{ id: 'n' + Date.now(), t: d.text || '', at: Date.now() }]; d.i = Math.min(d.i || 0, d.notes.length - 1);
    c.el.style.padding = '0';
    c.el.innerHTML = '<div style="display:flex;flex-direction:column;height:100%"><div class="nt-h"><span>📁 Notizen</span><span class="nt-c"><button class="nt-b" data-a="prev" title="Vorherige">‹</button><span class="nt-n"></span><button class="nt-b" data-a="next" title="Nächste">›</button><button class="nt-b" data-a="new" title="Neue Notiz">＋</button><button class="nt-b" data-a="del" title="Notiz löschen">🗑</button></span></div><textarea class="note" style="flex:1;height:auto;padding:max(10px,4cqmin)" placeholder="Notiz schreiben …" spellcheck="false"></textarea></div>';
    const t = c.el.querySelector('textarea'), nn = c.el.querySelector('.nt-n'); const show = () => { t.value = d.notes[d.i].t; nn.textContent = `${d.i + 1}/${d.notes.length}`; };
    t.addEventListener('input', () => { d.notes[d.i].t = t.value; d.notes[d.i].at = Date.now(); c.save(d); });
    c.el.querySelectorAll('.nt-b').forEach((b) => b.addEventListener('click', () => { const a = b.dataset.a;
      if (a === 'prev') d.i = (d.i + d.notes.length - 1) % d.notes.length; else if (a === 'next') d.i = (d.i + 1) % d.notes.length;
      else if (a === 'new') { d.notes.push({ id: 'n' + Date.now(), t: '', at: Date.now() }); d.i = d.notes.length - 1; }
      else if (a === 'del') { if (d.notes[d.i].t.trim() && !confirm('Diese Notiz löschen?')) return; d.notes.splice(d.i, 1); if (!d.notes.length) d.notes.push({ id: 'n' + Date.now(), t: '', at: Date.now() }); d.i = Math.min(d.i, d.notes.length - 1); }
      c.save(d); show(); }));
    show();
  } });

reg('photos', { name: 'Fotos', cat: 'apple', icon: '🖼️', size: 'M', theme: TH.none, desc: 'Diashow aus Ordnern/Alben mit Layouts (einzeln, Raster, Collage) und weichen Übergängen (iCloud-Fotos: Ordner von «iCloud für Windows»)',
  settings: [{ key: 'folders', label: 'Alben (Ordner)', type: 'folders' }, { key: 'deep', label: 'Unterordner einbeziehen', type: 'bool', def: true }, { key: 'layout', label: 'Layout', type: 'select', options: [['single', 'Einzelfoto'], ['grid', 'Raster (2×2)'], ['collage', 'Collage']], def: 'single' }, { key: 'fit', label: 'Bildausschnitt', type: 'select', options: [['cover', 'Füllen'], ['contain', 'Ganzes Bild']], def: 'cover' }, { key: 'shuffle', label: 'Zufällige Reihenfolge', type: 'bool', def: true }, { key: 'secs', label: 'Sekunden pro Bild', type: 'number', def: 8 }],
  render(c) {
    let dead = false, tm; c.el.style.padding = '0'; const P = c.props, dirs = [...(P.folders || []), ...(P.folder ? [P.folder] : [])];
    c.el.innerHTML = '<div class="empty">Alben in den Widget-Einstellungen wählen</div>';
    (async () => {
      if (!dirs.length) return; let list = await c.api.listPhotos(dirs, P.deep !== false); if (dead || !list.length) { if (!dead) c.el.innerHTML = '<div class="empty">Keine Fotos gefunden</div>'; return; }
      if (P.shuffle !== false) list = list.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
      const lay = P.layout || 'single', slots = lay === 'grid' ? 4 : lay === 'collage' ? 3 : 1, fit = P.fit || 'cover'; let i = 0, k = 0;
      c.el.innerHTML = `<div class="ph-g ph-${lay}">` + [...Array(slots)].map((_, n) => `<div class="ph-s ph-s${n}"><div class="photo" style="opacity:0;background-size:${fit}"></div><div class="photo" style="opacity:0;background-size:${fit}"></div></div>`).join('') + '</div>';
      const slotsEl = [...c.el.querySelectorAll('.ph-s')], front = slotsEl.map(() => 0);
      const setImg = (n, url) => { const s = slotsEl[n], a = s.children[front[n]], b = s.children[1 - front[n]]; b.style.backgroundImage = `url("${url}")`; b.style.opacity = 1; a.style.opacity = 0; front[n] = 1 - front[n]; };
      slotsEl.forEach((_, n) => setImg(n, list[i++ % list.length]));
      tm = setInterval(() => { setImg(k++ % slots, list[i++ % list.length]); }, (P.secs || 8) * 1000 / (slots > 1 ? Math.min(slots, 3) : 1));
    })();
    return () => { dead = true; clearInterval(tm); };
  } });

reg('calculator', { name: 'Rechner', cat: 'apple', icon: '🧮', size: 'L', theme: TH.black, desc: 'Taschenrechner',
  render(c) {
    const keys = ['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', '.', '⌫', '='];
    c.el.innerHTML = `<div class="calc"><div class="o">0</div><div class="k">${keys.map((k) => `<button class="${'÷×−+='.includes(k) ? 'op' : ''}">${k}</button>`).join('')}</div></div>`;
    const o = c.el.querySelector('.o'); let cur = '0', acc = null, op = null, fresh = true;
    const calc = (a, b, p) => p === '+' ? a + b : p === '−' ? a - b : p === '×' ? a * b : p === '÷' ? (b === 0 ? NaN : a / b) : b;
    const show = () => { o.textContent = cur; };
    c.el.querySelectorAll('button').forEach((bt) => bt.addEventListener('click', () => {
      const k = bt.textContent;
      if (/\d/.test(k)) { cur = fresh || cur === '0' ? k : cur + k; fresh = false; }
      else if (k === '.') { if (fresh) { cur = '0.'; fresh = false; } else if (!cur.includes('.')) cur += '.'; }
      else if (k === 'C') { cur = '0'; acc = null; op = null; fresh = true; }
      else if (k === '⌫') { cur = cur.length > 1 ? cur.slice(0, -1) : '0'; }
      else if (k === '±') { cur = String(-parseFloat(cur)); }
      else if (k === '%') { cur = String(parseFloat(cur) / 100); }
      else { const v = parseFloat(cur); acc = acc === null || fresh && op === null ? v : calc(acc, v, op); if (k === '=') { cur = String(+acc.toPrecision(12)); acc = null; op = null; } else { op = k; cur = String(+acc.toPrecision(12)); } fresh = true; }
      show();
    }));
  } });

// ---------- Aufgaben (dauerhaft in der App gespeichert, gemeinsam mit der Haupt-App) ----------
const dueLbl = (d, today) => { if (!d) return ''; const t = new Date(d + 'T12:00'); return d === today ? 'Heute' : new Date(+t - 864e5).toISOString().slice(0, 10) === today ? 'Morgen' : t.toLocaleDateString('de-CH', { day: 'numeric', month: 'short' }); };
function todoRender(c, mode) { // mode: 'apple' | 'plain' | 'shop'
  const list = (c.props.list || (mode === 'shop' ? 'Einkauf' : '')).trim(), el = c.el; let tasks = c.tasks || [];
  const title = c.props.title || (mode === 'shop' ? 'Einkaufsliste' : mode === 'apple' ? 'Erinnerungen' : 'Meine Aufgaben');
  el.innerHTML = `<div class="todo ${mode}"><div class="todo-h"><b>${esc(title)}</b><span class="todo-n"></span></div><div class="bar"><i></i></div><div class="todo-l"></div>
    <form class="todo-add"><input class="ti" placeholder="${mode === 'apple' ? 'Neue Erinnerung' : 'Neue Aufgabe'} …" spellcheck="false"><input type="date" class="td"><select class="tp" title="Priorität"><option value="0">Priorität –</option><option value="1">!</option><option value="2">!!</option><option value="3">!!!</option></select><select class="tr" title="Wiederholen"><option value="">einmalig</option><option value="d">↻ täglich</option><option value="w">↻ wöchentlich</option></select></form></div>`;
  const L = el.querySelector('.todo-l'), N = el.querySelector('.todo-n'), B = el.querySelector('.bar i'), F = el.querySelector('form'), root = el.querySelector('.todo');
  const draw = () => {
    const today = new Date().toISOString().slice(0, 10), mine = tasks.filter((t) => !list || t.list === list), open = mine.filter((t) => !t.done), done = mine.filter((t) => t.done);
    N.textContent = mode === 'apple' ? open.length : `${open.length} offen`; B.style.width = mine.length ? (done.length / mine.length * 100) + '%' : '0';
    const w = el.clientWidth, h = el.clientHeight; root.classList.toggle('xs', w < 150); root.classList.toggle('narrow', w < 300 || h < 300); root.classList.toggle('short', h < 200);
    const groups = { 'Heute': [], 'Morgen': [], 'Später': [], 'Ohne Datum': [] }; const tom = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
    open.sort((a, b) => (b.prio || 0) - (a.prio || 0) || (a.due || '9').localeCompare(b.due || '9') || a.createdAt - b.createdAt);
    open.forEach((i) => groups[!i.due ? 'Ohne Datum' : i.due <= today ? 'Heute' : i.due === tom ? 'Morgen' : 'Später'].push(i));
    const row = (i) => { const tg = i.t.match(/#(\S+)/); return `<div class="todo-i" data-id="${i.id}"><span class="cb"></span><span class="tx">${esc(i.t.replace(/#\S+/, '').trim())}</span>${tg ? `<span class="tag">${esc(tg[1])}</span>` : ''}${i.rep ? '<span class="m">↻</span>' : ''}${i.due ? `<span class="m ${i.due < today ? 'p' : ''}">${dueLbl(i.due, today)}</span>` : ''}${i.prio ? `<span class="p">${'!'.repeat(i.prio)}</span>` : ''}<span class="x" title="Aufgabe löschen">✕</span></div>`; };
    const flat = mode === 'apple' || w < 300;
    L.innerHTML = open.length ? (flat ? open.map(row).join('') : Object.entries(groups).filter(([, v]) => v.length).map(([k, v]) => `<div class="todo-g">${k}</div>${v.map(row).join('')}`).join('')) : `<div class="dim" style="padding:.8em 0">${mine.length ? 'Alles erledigt 🎉' : 'Keine Aufgaben'}</div>`;
  };
  L.addEventListener('click', async (e) => { // Haken: Aufgabe verschwindet aus der Liste, bleibt aber gespeichert (Erledigt/Verlauf in der App)
    const r = e.target.closest('.todo-i'); if (r && e.target.classList.contains('x')) { const tk = tasks.find((q) => q.id === r.dataset.id); if (tk && confirm(`«${tk.t.replace(/#\S+/, '').trim()}» endgültig löschen?`)) c.api.taskRemove(r.dataset.id); return; }
    if (!r || !e.target.classList.contains('cb')) return;
    r.classList.add('d'); e.target.textContent = '✓'; setTimeout(() => c.api.taskDone(r.dataset.id, true), 220);
  });
  L.addEventListener('dblclick', (e) => {
    const tx = e.target.closest('.tx'); if (!tx) return; const id = tx.parentElement.dataset.id; tx.contentEditable = 'plaintext-only'; tx.focus();
    const end = () => { tx.contentEditable = 'false'; const v = tx.textContent.trim(); const old = tasks.find((t) => t.id === id), tag = old && old.t.match(/#\S+/); if (v && old) c.api.taskUpdate(id, { t: v + (tag ? ' ' + tag[0] : '') }); else draw(); };
    tx.addEventListener('blur', end, { once: true }); tx.addEventListener('keydown', (k) => { if (k.key === 'Enter') { k.preventDefault(); tx.blur(); } });
  });
  F.addEventListener('submit', async (e) => { e.preventDefault(); const t = F.querySelector('.ti').value.trim(); if (!t) return;
    await c.api.taskAdd({ t, due: F.querySelector('.td').value, prio: +F.querySelector('.tp').value, rep: F.querySelector('.tr').value, list }); F.reset(); F.querySelector('.ti').focus(); });
  c.onTasks((t) => { tasks = t; draw(); }); const stop = sized(c, draw);
  const check = () => { // Benachrichtigung für fällige Aufgaben (einmal pro Tag und Aufgabe)
    const today = new Date().toISOString().slice(0, 10), d = c.data; d.n = d.n || {}; let ch = false;
    tasks.filter((t) => !t.done && t.due && t.due <= today && d.n[t.id] !== today && (!list || t.list === list)).forEach((t) => { try { new Notification('Aufgabe fällig', { body: t.t.replace(/#\S+/, '').trim() }); } catch {} d.n[t.id] = today; ch = true; });
    if (ch) c.save(d);
  };
  check(); const iv = setInterval(() => { check(); draw(); }, 60000); return () => { stop(); clearInterval(iv); };
}
const TASK_SETTINGS = [{ key: 'title', label: 'Titel', type: 'text' }, { key: 'list', label: 'Liste (leer = alle Aufgaben)', type: 'text' }];
reg('todo', { name: 'Aufgaben', cat: 'extra', icon: '✅', size: 'L', desc: 'Aufgaben mit Datum, Priorität, #Kategorie und Wiederholung, dauerhaft gespeichert', settings: TASK_SETTINGS, render: (c) => todoRender(c, 'plain') });
reg('shopping', { name: 'Einkaufsliste', cat: 'extra', icon: '🛒', size: 'M', desc: 'Einfache Einkaufsliste zum Abhaken', settings: TASK_SETTINGS, render: (c) => todoRender(c, 'shop') });
reg('reminders', { name: 'Erinnerungen', cat: 'apple', icon: '🔔', size: 'L', theme: { ...TH.white, accent: '#ff9500', btn: '#ff9500' }, desc: 'Wie Apple Erinnerungen, dauerhaft gespeichert (oder iCloud-Erinnerungen)',
  settings: [{ key: 'source', label: 'Quelle', type: 'select', options: [['local', 'Meine Aufgaben (lokal, dauerhaft)'], ['icloud', 'iCloud-Erinnerungen']], def: 'local' }, ...TASK_SETTINGS],
  render(c) {
    if (c.props.source !== 'icloud' || !c.cache.connected) return todoRender(c, 'apple');
    const todos = (c.cache.todos || []).filter((t) => !t.done), shown = todos.slice(0, 12);
    c.el.innerHTML = `<div class="rm"><div class="rm-h"><b class="acc">Erinnerungen</b><span class="rm-n">${todos.length}</span></div><div class="rm-l">${shown.map((t) => `<div class="todo-i" data-u="${esc(t.uid)}"><span class="cb"></span><span class="tx">${esc(t.title)}</span>${t.due ? `<span class="m ${t.due < Date.now() - 864e5 ? 'p' : ''}">${new Date(t.due).toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })}</span>` : ''}</div>`).join('') || '<div class="dim" style="padding:.6em 0">Alles erledigt 🎉</div>'}</div></div>`;
    c.el.querySelectorAll('.cb').forEach((cb) => cb.addEventListener('click', async () => { const row = cb.parentElement; row.classList.add('d'); cb.textContent = '✓'; await c.api.icloudToggleTodo(row.dataset.u, true); }));
  } });

// ---------- Vorschlags-Widgets ----------
reg('system', { name: 'System', cat: 'extra', icon: '📊', size: 'M', theme: TH.black, desc: 'CPU, RAM und Speicherplatz live',
  render(c) {
    c.el.innerHTML = '<div class="sys">' + ['CPU', 'RAM', 'Disk'].map((n) => `<div class="ringw"><div class="ring"></div><div class="ringv">–</div><div class="dim">${n}</div></div>`).join('') + '</div>';
    const rings = [...c.el.querySelectorAll('.ring')], vals = [...c.el.querySelectorAll('.ringv')];
    const up = async () => { const s = await c.api.sys(); [s.cpu, s.mem, s.disk].forEach((v, i) => { if (v == null) return; rings[i].style.setProperty('--p', Math.round(v * 100)); vals[i].textContent = Math.round(v * 100) + '%'; }); };
    up(); const i = setInterval(up, 2000); return () => clearInterval(i);
  } });

reg('countdown', { name: 'Countdown', cat: 'extra', icon: '⏳', size: 'S', desc: 'Tage bis zu einem Ereignis',
  settings: [{ key: 'title', label: 'Titel', type: 'text', def: 'Ferien' }, { key: 'date', label: 'Datum', type: 'date' }],
  render(c) {
    const draw = () => { const t = c.props.date ? new Date(c.props.date + 'T00:00') : null; const dd = t ? Math.ceil((t - new Date()) / 864e5) : null;
      c.el.innerHTML = `<div class="big"><div class="n">${dd === null ? '?' : Math.max(0, dd)}</div><div class="l">${dd === null ? 'Datum in den Einstellungen wählen' : (dd < 0 ? 'vorbei: ' : 'Tage bis ') + esc(c.props.title || '')}</div></div>`; };
    draw(); const i = setInterval(draw, 60000); return () => clearInterval(i);
  } });

const QUOTES = [['Der beste Zeitpunkt anzufangen ist jetzt.', 'Unbekannt'], ['Kleine Schritte führen auch ans Ziel.', 'Unbekannt'], ['Was du heute kannst besorgen, das verschiebe nicht auf morgen.', 'Sprichwort'], ['Fehler sind der Beweis, dass du es versuchst.', 'Unbekannt'], ['Disziplin ist die Brücke zwischen Zielen und Erfolg.', 'Jim Rohn'], ['Wer rastet, der rostet.', 'Sprichwort'], ['Übung macht den Meister.', 'Sprichwort'], ['Einfach machen.', 'Unbekannt']];
reg('quote', { name: 'Zitat des Tages', cat: 'extra', icon: '💬', size: 'M', desc: 'Täglich wechselndes Zitat',
  render(c) { const q = QUOTES[Math.floor(Date.now() / 864e5) % QUOTES.length]; c.el.innerHTML = `<div class="quote">„${esc(q[0])}“<small>${esc(q[1])}</small></div>`; } });

reg('goals', { name: 'Persönliche Ziele', cat: 'extra', icon: '🎯', size: 'M', desc: 'Ziele mit Fortschrittsbalken (Klick auf Balken setzt Wert)',
  render(c) {
    const d = c.data; d.goals = d.goals || [{ t: 'Mini-Projekt fertig', p: 30 }, { t: 'Sport pro Woche', p: 60 }];
    c.el.innerHTML = '<div class="goals"></div><input class="ti" placeholder="Neues Ziel + Enter" style="background:var(--track);border:0;border-radius:8px;padding:.3em .6em;width:100%;margin-top:.4em">';
    const box = c.el.querySelector('.goals');
    const draw = () => { box.innerHTML = d.goals.map((g, i) => `<div class="goal"><div class="r"><span>${esc(g.t)}</span><span class="dim">${g.p}% <span data-x="${i}" style="cursor:pointer">✕</span></span></div><div class="bar" data-i="${i}"><i style="width:${g.p}%"></i></div></div>`).join(''); };
    box.addEventListener('click', (e) => { if (e.target.dataset.x) { d.goals.splice(+e.target.dataset.x, 1); } else { const b = e.target.closest('.bar'); if (!b) return; const r = b.getBoundingClientRect(); d.goals[+b.dataset.i].p = Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * 20) * 5; } c.save(d); draw(); });
    c.el.querySelector('.ti').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.value.trim()) { d.goals.push({ t: e.target.value.trim(), p: 0 }); e.target.value = ''; c.save(d); draw(); } });
    draw();
  } });

reg('eisenhower', { name: 'Eisenhower-Matrix', cat: 'extra', icon: '🧭', size: 'XL', desc: 'Wichtig/Dringend in 4 Feldern (Klick auf Eintrag löscht)',
  render(c) {
    const d = c.data; d.q = d.q || [[], [], [], []]; const names = ['Wichtig + dringend', 'Wichtig, nicht dringend', 'Dringend, nicht wichtig', 'Weder noch'];
    const draw = () => { c.el.innerHTML = '<div class="eis">' + names.map((n, i) => `<div><b>${n}</b><ul>${d.q[i].map((t, j) => `<li data-i="${i}" data-j="${j}">• ${esc(t)}</li>`).join('')}</ul><input data-i="${i}" placeholder="+ hinzufügen"></div>`).join('') + '</div>';
      c.el.querySelectorAll('li').forEach((li) => li.addEventListener('click', () => { d.q[li.dataset.i].splice(li.dataset.j, 1); c.save(d); draw(); }));
      c.el.querySelectorAll('input').forEach((inp) => inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && inp.value.trim()) { d.q[inp.dataset.i].push(inp.value.trim()); c.save(d); draw(); } })); };
    draw();
  } });

reg('habits', { name: 'Gewohnheiten', cat: 'extra', icon: '🔁', size: 'M', desc: 'Habit-Tracker der letzten 7 Tage',
  render(c) {
    const d = c.data; d.h = d.h || [{ n: 'Wasser trinken', days: {} }];
    const days = [...Array(7)].map((_, i) => addDays(ymd(new Date()), i - 6));
    const draw = () => { c.el.innerHTML = '<div class="hab">' + d.h.map((h, i) => `<div class="r"><span>${esc(h.n)}</span>${days.map((x) => `<span class="dot ${h.days[x] ? 'on' : ''}" data-i="${i}" data-d="${x}"></span>`).join('')}</div>`).join('') + '<input placeholder="Neue Gewohnheit + Enter"></div>';
      c.el.querySelectorAll('.dot').forEach((o) => o.addEventListener('click', () => { const h = d.h[o.dataset.i]; h.days[o.dataset.d] = !h.days[o.dataset.d]; c.save(d); draw(); }));
      c.el.querySelector('input').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.value.trim()) { d.h.push({ n: e.target.value.trim(), days: {} }); c.save(d); draw(); } }); };
    draw();
  } });

// ---------- Eigene Widgets (Block-Baukasten) ----------
const BLOCK_TYPES = { title: 'Titel', text: 'Text', list: 'Checkliste', progress: 'Fortschritt', countdown: 'Countdown', divider: 'Trennlinie' };
const DEFAULT_BLOCKS = [{ type: 'title', value: 'Mein Widget' }, { type: 'text', value: 'Hier kannst du eigene Inhalte anzeigen.' }, { type: 'progress', label: 'Fortschritt', value: 40 }];
reg('custom', { name: 'Eigenes Widget', cat: 'custom', icon: '🧩', size: 'M', desc: 'Selbst gebautes Widget aus Blöcken',
  render(c) {
    const blocks = c.props.blocks || DEFAULT_BLOCKS, d = c.data; d.checks = d.checks || {};
    c.el.style.overflow = 'auto'; c.el.style.scrollbarWidth = 'none';
    c.el.innerHTML = blocks.map((b, bi) => {
      switch (b.type) {
        case 'title': return `<div class="cb-t">${esc(b.value)}</div>`;
        case 'text': return `<div class="cb-x">${esc(b.value).replace(/\n/g, '<br>')}</div>`;
        case 'divider': return '<hr class="cb-hr">';
        case 'progress': return `<div class="goal"><div class="r"><span>${esc(b.label)}</span><span class="dim">${+b.value || 0}%</span></div><div class="bar"><i style="width:${+b.value || 0}%"></i></div></div>`;
        case 'countdown': { const dd = b.date ? Math.ceil((new Date(b.date + 'T00:00') - new Date()) / 864e5) : '?'; return `<div class="cb-x"><b style="font-size:1.8em;font-weight:300">${dd}</b> Tage bis ${esc(b.label)}</div>`; }
        case 'list': return `<div class="cb-l">${(b.items || '').split('\n').filter(Boolean).map((t, ti) => `<label><input type="checkbox" data-k="${bi}-${ti}" ${d.checks[bi + '-' + ti] ? 'checked' : ''}>${esc(t)}</label>`).join('')}</div>`;
      } return '';
    }).join('');
    c.el.querySelectorAll('input[type=checkbox]').forEach((i) => i.addEventListener('change', () => { d.checks[i.dataset.k] = i.checked; c.save(d); }));
  } });

// ---------- weitere Vorschlags-Widgets ----------
reg('network', { name: 'Netzwerk', cat: 'extra', icon: '📶', size: 'M', desc: 'Online-Status, Latenz und Geschwindigkeitstest (Cloudflare)',
  render(c) {
    c.el.innerHTML = '<div class="big"><div class="l net-s">…</div><div class="n net-d" style="font-size:min(30cqh,16cqw)">–</div><div class="l net-l">Download</div><button class="net-b" style="margin-top:.5em;border:0;border-radius:8px;padding:.3em .9em;background:var(--btn);color:#fff;cursor:pointer">Test starten</button></div>';
    const S = c.el.querySelector('.net-s'), D = c.el.querySelector('.net-d'), L = c.el.querySelector('.net-l'), B = c.el.querySelector('.net-b'); let dead = false;
    const ping = async () => { if (dead) return; if (!navigator.onLine) { S.textContent = '❌ offline'; return; } const t = performance.now(); try { await fetch('https://speed.cloudflare.com/__down?bytes=0', { cache: 'no-store' }); S.textContent = `🟢 online · ${Math.round(performance.now() - t)} ms`; } catch { S.textContent = '🟠 online, Server nicht erreichbar'; } };
    B.onclick = async () => { B.disabled = true; D.textContent = '…'; try { const t = performance.now(); const r = await fetch('https://speed.cloudflare.com/__down?bytes=10000000', { cache: 'no-store' }); const b = await r.arrayBuffer(); D.textContent = (b.byteLength * 8 / 1e6 / ((performance.now() - t) / 1000)).toFixed(0) + ' Mbit/s'; } catch { D.textContent = 'Fehler'; } B.disabled = false; };
    ping(); const i = setInterval(ping, 8000); return () => { dead = true; clearInterval(i); };
  } });

reg('sysinfo', { name: 'Systeminfo', cat: 'extra', icon: 'ℹ️', size: 'M', desc: 'Gerätename, Prozessorkerne, Arbeitsspeicher, Laufzeit',
  render(c) {
    const up = async () => { const s = await c.api.sys(); const hrs = Math.floor(s.uptime / 3600);
      c.el.innerHTML = `<div class="wc"><div><span class="dim">Gerät</span><span>${esc(s.host)}</span></div><div><span class="dim">Prozessorkerne</span><span>${s.cores}</span></div><div><span class="dim">Arbeitsspeicher</span><span>${(s.memTotal / 2 ** 30).toFixed(1)} GB</span></div><div><span class="dim">Läuft seit</span><span>${hrs} h ${Math.floor(s.uptime / 60) % 60} min</span></div></div>`; };
    up(); const i = setInterval(up, 30000); return () => clearInterval(i);
  } });

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
reg('weekplan', { name: 'Wochenplan / Stundenplan', cat: 'extra', icon: '🗓️', size: 'XL', desc: 'Pro Wochentag eine editierbare Liste (auch als Stundenplan nutzbar)',
  render(c) {
    const d = c.data; d.w = d.w || DAYS.map(() => ''); const today = (new Date().getDay() + 6) % 7;
    c.el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;height:100%;font-size:max(10px,3.2cqmin)">' + DAYS.map((n, i) => `<div style="display:flex;flex-direction:column;min-width:0"><b style="text-align:center;margin-bottom:4px;${i === today ? 'color:var(--accent)' : ''}">${n}</b><textarea data-i="${i}" style="flex:1;resize:none;border:0;border-radius:8px;background:var(--track);color:inherit;font:inherit;padding:5px;outline:0;user-select:text">${esc(d.w[i])}</textarea></div>`).join('') + '</div>';
    c.el.querySelectorAll('textarea').forEach((t) => t.addEventListener('input', () => { d.w[t.dataset.i] = t.value; c.save(d); }));
  } });

reg('dayplan', { name: 'Tagesplan', cat: 'extra', icon: '⏰', size: 'L', desc: 'Stundenplan für heute, wird täglich geleert',
  render(c) {
    const d = c.data, today = ymd(new Date()); if (d.day !== today) { d.day = today; d.s = {}; c.save(d); }
    const hrs = [...Array(14)].map((_, i) => i + 7), nowH = new Date().getHours();
    c.el.innerHTML = '<div style="height:100%;overflow:auto;scrollbar-width:none;font-size:max(11px,3.8cqmin)">' + hrs.map((h) => `<div style="display:flex;gap:8px;align-items:center;border-bottom:1px solid var(--line);padding:2px 0"><span class="${h === nowH ? 'acc' : 'dim'}" style="width:3.2em">${h}:00</span><input data-h="${h}" value="${esc(d.s[h] || '')}" style="flex:1;background:transparent;border:0;outline:0;color:inherit;font:inherit;user-select:text"></div>`).join('') + '</div>';
    c.el.querySelectorAll('input').forEach((i) => i.addEventListener('input', () => { d.s[i.dataset.h] = i.value; c.save(d); }));
  } });

// ---------- weitere Apple-Widgets ----------
reg('stocks', { name: 'Aktien', cat: 'apple', icon: '📈', size: 'S', theme: TH.black, desc: 'Klein: ein Wert gross. Mittel/Gross: Liste (Yahoo Finance, inoffiziell, evtl. verzögert)',
  settings: [{ key: 'symbols', label: 'Kürzel (Komma)', type: 'text', def: '^GSPC, AAPL, MSFT, NVDA, TSLA, NESN.SW' }],
  render(c) {
    let dead = false, data = null; const syms = c.props.symbols || this.settings[0].def;
    const draw = (w, h) => { if (!data) return;
      const chg = (x) => x.prev ? (x.price - x.prev) / x.prev * 100 : 0, col = (v) => v >= 0 ? '#30d158' : '#ff453a';
      if (w < 260 && h < 260) { const x = data[0]; if (x.err) { c.el.innerHTML = `<div class="empty">${esc(x.s)}<br>nicht verfügbar</div>`; return; } const ch = chg(x);
        c.el.innerHTML = `<div class="stk1"><div><b style="color:${col(ch)}">${ch >= 0 ? '▲' : '▼'} ${esc(x.s)}</b><div class="dim">${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%</div></div><div class="stk1-p">${x.price.toLocaleString('de-CH', { maximumFractionDigits: 2 })}</div></div>`; return; }
      c.el.innerHTML = '<div class="stk">' + data.map((x) => { if (x.err) return `<div class="stk-r"><b>${esc(x.s)}</b><span class="dim">nicht verfügbar</span></div>`; const ch = chg(x);
        return `<div class="stk-r"><div><b>${esc(x.s)}</b><div class="dim" style="font-size:.8em">${esc(x.cur || '')}</div></div><span class="stk-p">${x.price.toFixed(2)}</span><span class="stk-c" style="background:${col(ch)}">${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%</span></div>`; }).join('') + '</div>'; };
    c.el.innerHTML = '<div class="empty">Lade Kurse …</div>'; const stop = sized(c, draw);
    const load = async () => { data = await c.api.stocks(syms); if (!dead) draw(c.el.clientWidth, c.el.clientHeight); }; load(); const i = setInterval(load, 120000); return () => { dead = true; stop(); clearInterval(i); };
  } });

reg('news', { name: 'Nachrichten', cat: 'apple', icon: '📰', size: 'M', theme: TH.white, desc: 'Schlagzeilen aus einem RSS-Feed (Standard: Tagesschau), Klick öffnet den Artikel',
  settings: [{ key: 'feed', label: 'RSS-Feed-Adresse', type: 'text', def: 'https://www.tagesschau.de/index~rss2.xml' }],
  render(c) {
    let dead = false, items = null; const feed = c.props.feed || this.settings[0].def, src = (() => { try { return new URL(feed).hostname.replace(/^www\./, ''); } catch { return ''; } })();
    const draw = (w, h) => { if (!items) return; if (!items.length) { c.el.innerHTML = '<div class="empty">Nachrichten nicht verfügbar</div>'; return; }
      const n = h < 200 ? 1 : Math.max(2, Math.floor(h / 52));
      c.el.innerHTML = `<div class="nws"><b class="acc">Schlagzeilen</b><div class="dim" style="font-size:.75em;margin-bottom:.3em">${esc(src).toUpperCase()}</div>` + items.slice(0, n).map((i, k) => `<div class="nws-i ${k ? '' : 'nws-1'}" data-l="${esc(i.link)}">${esc(i.title)}</div>`).join('') + '</div>';
      c.el.querySelectorAll('.nws-i').forEach((q) => q.addEventListener('click', () => c.api.openUrl(q.dataset.l))); };
    c.el.innerHTML = '<div class="empty">Lade Nachrichten …</div>'; const stop = sized(c, draw);
    const load = async () => { items = (await c.api.rss(feed)) || []; if (!dead) draw(c.el.clientWidth, c.el.clientHeight); }; load(); const i = setInterval(load, 600000); return () => { dead = true; stop(); clearInterval(i); };
  } });

reg('contacts', { name: 'Kontakte', cat: 'apple', icon: '👤', size: 'M', theme: TH.white, desc: 'Kontakte aus iCloud (CardDAV), als Kreise mit Anfangsbuchstaben',
  render(c) {
    const list = c.cache.contacts || [];
    if (!c.cache.connected) { c.el.innerHTML = '<div class="empty"><div>Kontakte aus iCloud<br><button class="ic-btn" style="margin-top:6px;border:0;border-radius:8px;padding:.3em .8em;background:#0a84ff;color:#fff;cursor:pointer">Mit iCloud anmelden</button></div></div>'; c.el.querySelector('.ic-btn').onclick = () => c.api.openApp('iphone'); return; }
    if (!list.length) { c.el.innerHTML = '<div class="empty">Keine Kontakte gefunden</div>'; return; }
    const cols = ['#8e8e93', '#ff9f0a', '#30d158', '#0a84ff', '#bf5af2', '#ff375f'];
    return sized(c, (w) => { const n = w < 260 ? 1 : Math.min(4, Math.floor(w / 90)), st = Math.floor(Date.now() / 864e5) % list.length;
      c.el.innerHTML = '<div class="cts">' + [...Array(n)].map((_, k) => { const p = list[(st + k) % list.length], ini = p.name.split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase();
        return `<div class="cts-i"><div class="ct-a" style="background:${cols[(st + k) % cols.length]}">${esc(ini)}</div><b>${esc(p.name.split(' ')[0])}</b><span class="dim">${esc(p.tel || p.mail || '')}</span></div>`; }).join('') + '</div>'; });
  } });

reg('screentime', { name: 'Bildschirmzeit', cat: 'apple', icon: '⏱️', size: 'M', theme: TH.black, desc: 'Aktive Zeit am PC heute, pro Stunde (gemessen ab Programmstart)',
  render(c) {
    const up = async () => { const s = await c.api.screentime(); s.secs = s.secs || []; const tot = s.secs.reduce((a, b) => a + b, 0), mx = Math.max(300, ...s.secs);
      c.el.innerHTML = `<div class="stm"><div class="dim">Bildschirmzeit heute</div><div class="stm-t">${Math.floor(tot / 3600)} h ${Math.floor(tot / 60) % 60} min</div><div class="stm-b">${s.secs.map((v) => `<i style="height:${Math.max(3, v / mx * 100)}%"></i>`).join('')}</div></div>`; };
    up(); const i = setInterval(up, 30000); return () => clearInterval(i);
  } });

reg('temperature', { name: 'Temperatur', cat: 'extra', icon: '🌡️', size: 'S', theme: TH.black, desc: 'CPU-/Systemtemperatur, falls Windows sie bereitstellt',
  render(c) {
    c.el.innerHTML = '<div class="big"><div class="n tv">…</div><div class="l tl">Systemtemperatur</div></div>'; const v = c.el.querySelector('.tv'), l = c.el.querySelector('.tl'); let dead = false;
    const up = async () => { const t = await c.api.temp(); if (dead) return; if (t == null) { v.textContent = '–'; l.textContent = 'von diesem PC nicht lesbar'; } else { v.textContent = t + '°'; l.textContent = 'Systemtemperatur'; } };
    up(); const i = setInterval(up, 30000); return () => { dead = true; clearInterval(i); };
  } });

reg('search', { name: 'Websuche', cat: 'apple', icon: '🔍', size: 'M', theme: TH.white, desc: 'Suchfeld: Eingabe + Enter öffnet die Suche im Browser',
  settings: [{ key: 'engine', label: 'Suchmaschine', type: 'select', options: [['https://www.google.com/search?q=', 'Google'], ['https://duckduckgo.com/?q=', 'DuckDuckGo'], ['https://www.bing.com/search?q=', 'Bing']], def: 'https://www.google.com/search?q=' }],
  render(c) {
    c.el.innerHTML = '<div class="srch"><div class="srch-b"><span>🔍</span><input placeholder="Im Web suchen" spellcheck="false"></div></div>';
    c.el.querySelector('input').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.value.trim()) { c.api.openUrl((c.props.engine || this.settings[0].def) + encodeURIComponent(e.target.value.trim())); e.target.value = ''; } });
  } });

reg('shortcut', { name: 'Kurzbefehl', cat: 'apple', icon: '⚡', size: 'S', theme: { ...TH.white, bg1: '#e9e9f2', bg2: '#c9cde8', gradient: true, opacity: 0.7 }, desc: 'Grosse Taste für Anrufe, E-Mails oder Webseiten (tel:, mailto:, https:)',
  settings: [{ key: 'label', label: 'Beschriftung', type: 'text', def: 'Mama anrufen' }, { key: 'icon', label: 'Symbol (Emoji)', type: 'text', def: '😊' }, { key: 'url', label: 'Ziel (tel:+41…, mailto:…, https://…)', type: 'text' }],
  render(c) {
    c.el.innerHTML = `<div class="sc"><div class="sc-i">${esc(c.props.icon || '😊')}</div><b>${esc(c.props.label ?? 'Mama anrufen')}</b></div>`;
    c.el.querySelector('.sc').addEventListener('click', () => c.props.url && c.api.openUrl(c.props.url));
  } });

