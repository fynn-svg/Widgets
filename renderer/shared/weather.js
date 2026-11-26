// ======================================================================
// Wetter-Widgets (Apple-Look): W1 gross, W2 mittel, W3 Sonnenauf-/untergang, W4 klein
// Open-Meteo, dynamischer Hintergrund (Wetter + Tag/Nacht), Standort pro Widget, Cache, Mehrsprachigkeit
// ======================================================================
const condKey = (c) => c === 0 ? 'clear' : c === 1 ? 'mainlyClear' : c === 2 ? 'partly' : c === 3 ? 'overcast' : (c === 45 || c === 48) ? 'fog' : (c >= 51 && c <= 57) ? 'drizzle' : (c >= 61 && c <= 67) ? 'rain' : (c >= 71 && c <= 77) ? 'snow' : (c >= 80 && c <= 82) ? 'showers' : (c === 85 || c === 86) ? 'snowShowers' : c >= 95 ? 'thunder' : 'overcast';
const condKind = (c) => ({ clear: 'clear', mainlyClear: 'clear', partly: 'partly', overcast: 'cloud', fog: 'fog', drizzle: 'rain', rain: 'rain', showers: 'rain', snow: 'snow', snowShowers: 'snow', thunder: 'storm' }[condKey(c)]);
const condText = (c) => t('cond.' + condKey(c));

// ---- Symbole (SVG, Tag/Nacht) ----
function wxIcon(code, night) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const r = a * Math.PI / 180; return `<line x1="${32 + 17 * Math.sin(r)}" y1="${32 - 17 * Math.cos(r)}" x2="${32 + 23 * Math.sin(r)}" y2="${32 - 23 * Math.cos(r)}"/>`; }).join('');
  const sun = `<g stroke="#ffd60a" stroke-width="3" stroke-linecap="round">${rays}</g><circle cx="32" cy="32" r="11" fill="#ffd60a"/>`;
  const moon = '<path d="M40 10a22 22 0 1 0 14 38A18 18 0 0 1 40 10z" fill="#eae6ff"/>';
  const cloud = (dy = 0, k = 1, col = 'var(--icon)') => `<g fill="${col}" transform="translate(${(1 - k) * 32} ${(1 - k) * 32 + dy}) scale(${k})"><circle cx="24" cy="38" r="10"/><circle cx="37" cy="33" r="13"/><circle cx="48" cy="40" r="8"/><rect x="24" y="38" width="24" height="10"/></g>`;
  const k = condKind(code); let g;
  if (k === 'clear') g = night ? moon : sun;
  else if (k === 'partly') g = `<g transform="translate(-6 -8) scale(.7)">${night ? moon : sun}</g>` + cloud(2, .85);
  else if (k === 'cloud') g = cloud();
  else if (k === 'fog') g = cloud(-4, .9) + '<g stroke="var(--icon)" stroke-width="3" stroke-linecap="round" opacity=".8"><line x1="14" y1="50" x2="50" y2="50"/><line x1="20" y1="57" x2="56" y2="57"/></g>';
  else if (k === 'snow') g = cloud(-6, .9) + '<g fill="#fff"><circle cx="22" cy="54" r="2.6"/><circle cx="34" cy="58" r="2.6"/><circle cx="46" cy="54" r="2.6"/></g>';
  else if (k === 'storm') g = cloud(-6, .95, '#aeb4bb') + '<polygon points="34,44 26,56 32,56 29,64 40,50 34,50" fill="#ffd60a"/>';
  else g = (night ? '' : '') + cloud(-6, .9, night ? '#c9d1da' : 'var(--icon)') + '<g stroke="#5ac8fa" stroke-width="3" stroke-linecap="round"><line x1="22" y1="52" x2="19" y2="60"/><line x1="34" y1="52" x2="31" y2="60"/><line x1="46" y1="52" x2="43" y2="60"/></g>';
  return `<svg class="wi" viewBox="0 0 64 64">${g}</svg>`;
}
// Sonne am Horizont mit Pfeil (Aufgang ↑ / Untergang ↓)
const horizonIcon = (up) => `<svg class="wi" viewBox="0 0 64 64"><path d="M14 44a18 18 0 0 1 36 0z" fill="#ffd60a"/><line x1="8" y1="48" x2="56" y2="48" stroke="var(--icon)" stroke-width="3" stroke-linecap="round"/><path d="${up ? 'M32 22V4M25 11l7-7 7 7' : 'M32 4v18M25 15l7 7 7-7'}" fill="none" stroke="var(--icon)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const locArrow = '<svg class="wl-arrow" viewBox="0 0 12 12"><path d="M1 6L11 1 6 11 5.2 6.8z" fill="currentColor"/></svg>';

// ---- Hintergrund nach Wetter (Standard-Palette, oben → unten) ----
const WX_BG = { clearDay: ['#3A7BD5', '#7FB7EA'], clearNight: ['#0B1B3F', '#243B6B'], partlyDay: ['#5B8DBE', '#9DB9D3'], partlyNight: ['#1C2A4A', '#3A4A6B'], cloudDay: ['#7D8A99', '#A5B0BC'], cloudNight: ['#2A313B', '#444D5A'],
  fog: ['#9AA3AB', '#BFC6CC'], rainDay: ['#4B5A6B', '#6F8094'], rainNight: ['#1E2630', '#36424F'], storm: ['#2B2F3E', '#4C5068'], snowDay: ['#A8B8C8', '#D6E0EA'], snowNight: ['#3A4656', '#5A6879'], golden: ['#FF8A5B', '#C25B8A', '#5F4B9B'] };
const BG_PRESET = { blue: { g: ['#4A9BF0', '#1F5FBF'] }, gray: { g: ['#8A93A6', '#6F788C'] }, transparent: { g: null }, white: { g: ['#FFFFFF', '#F2F2F7'], text: '#111111' }, dark: { g: ['#2C2C2E', '#1C1C1E'] } };
const minutesOf = (s) => Date.parse(s.slice(0, 16) + ':00Z') / 60000;
function autoGradient(code, isDay, nowStr, rise, set) {
  const now = minutesOf(nowStr); if (Math.abs(now - minutesOf(rise)) <= 45 || Math.abs(now - minutesOf(set)) <= 45) return ['golden', WX_BG.golden]; // ±45 min um Sonnenauf-/untergang
  const k = condKind(code), d = isDay ? 'Day' : 'Night', key = k === 'fog' ? 'fog' : k === 'storm' ? 'storm' : k === 'clear' ? 'clear' + d : k === 'partly' ? 'partly' + d : k === 'cloud' ? 'cloud' + d : k === 'rain' ? 'rain' + d : 'snow' + d;
  return [key, WX_BG[key]];
}
function bgLayer(c, key, grad, opacity) { // weiche Überblendung (~1 s) zwischen Hintergründen
  const card = c.el.parentElement; let host = card.querySelector(':scope > .wbgs');
  if (!host) { host = document.createElement('div'); host.className = 'wbgs'; card.insertBefore(host, card.firstChild); }
  card.style.setProperty('--bg', 'transparent'); if (host.dataset.sig === key + opacity) return; host.dataset.sig = key + opacity;
  const l = document.createElement('div'); l.className = 'wbg'; l.style.background = grad ? `linear-gradient(180deg, ${grad.join(', ')})` : 'transparent'; l.style.opacity = 0; host.appendChild(l); void l.offsetWidth; l.style.opacity = opacity;
  setTimeout(() => { while (host.children.length > 1) host.firstChild.remove(); }, 1100);
}
function clearBg(c) { const h = c.el.parentElement.querySelector(':scope > .wbgs'); if (h) h.remove(); const f = c.el.parentElement.querySelector(':scope > .wfx'); if (f) f.remove(); }

// ---- optionale Effekte (nur CSS-Animationen, pausiert wenn nicht sichtbar / Akku schwach) ----
let lowPower = false; try { navigator.getBattery?.().then((b) => { const up = () => { lowPower = !b.charging && b.level <= 0.2; }; up(); b.addEventListener('levelchange', up); b.addEventListener('chargingchange', up); }); } catch {}
function effects(c, kind, night, on) {
  const card = c.el.parentElement; let fx = card.querySelector(':scope > .wfx');
  if (!on || lowPower) { if (fx) fx.remove(); return; }
  const sig = kind + night; if (fx && fx.dataset.sig === sig) return; if (fx) fx.remove();
  fx = document.createElement('div'); fx.className = 'wfx'; fx.dataset.sig = sig; const r = (a, b) => (a + Math.random() * (b - a)).toFixed(2); let h = '';
  if (kind === 'rain' || kind === 'storm') for (let i = 0; i < 26; i++) h += `<i class="fr" style="left:${r(0, 100)}%;animation-delay:${r(0, 1.2)}s;animation-duration:${r(.7, 1.1)}s"></i>`;
  else if (kind === 'snow') for (let i = 0; i < 22; i++) h += `<i class="fs" style="left:${r(0, 100)}%;animation-delay:${r(0, 6)}s;animation-duration:${r(5, 9)}s"></i>`;
  else if (kind === 'cloud' || kind === 'partly') for (let i = 0; i < 3; i++) h += `<i class="fc" style="top:${r(5, 60)}%;animation-delay:-${r(0, 40)}s;animation-duration:${r(50, 80)}s;opacity:${r(.12, .25)}"></i>`;
  else if (kind === 'clear' && night) for (let i = 0; i < 16; i++) h += `<i class="fst" style="left:${r(3, 97)}%;top:${r(3, 70)}%;animation-delay:${r(0, 4)}s"></i>`;
  fx.innerHTML = h; card.insertBefore(fx, c.el); const pause = () => fx.classList.toggle('paused', document.hidden); document.addEventListener('visibilitychange', pause); pause();
}

// ---- Einheiten, Standort, Daten ----
const unitsOf = (c) => { const s = c.settings || {}; return { t: c.props.unitT || s.unitT || 'C', w: c.props.unitW || s.unitW || 'kmh', h12: c.props.h12 || s.h12 || 'auto' }; };
const tempColor = (v, u) => { const x = u.t === 'F' ? (v - 32) * 5 / 9 : v, S = [[-15, [106, 167, 255]], [0, [90, 200, 250]], [10, [76, 217, 160]], [18, [200, 220, 80]], [24, [255, 214, 10]], [30, [255, 159, 10]], [38, [255, 69, 58]]];
  if (x <= S[0][0]) return `rgb(${S[0][1]})`; for (let i = 1; i < S.length; i++) if (x <= S[i][0]) { const f = (x - S[i - 1][0]) / (S[i][0] - S[i - 1][0]); return `rgb(${S[i - 1][1].map((v, k) => Math.round(v + (S[i][1][k] - v) * f))})`; } return `rgb(${S[S.length - 1][1]})`; };
const WXMEM = {};
async function getWx(c, loc, u, force) {
  const key = `${loc.lat.toFixed(2)},${loc.lon.toFixed(2)},${u.t},${u.w}`, every = Math.max(1, (c.settings && c.settings.refreshMin) || 20) * 60000;
  if (force) delete WXMEM[key]; const m = WXMEM[key]; if (m && Date.now() - m.at < every) return m;
  try {
    const q = `latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability,is_day&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,precipitation_sum&timezone=auto&forecast_days=10&temperature_unit=${u.t === 'F' ? 'fahrenheit' : 'celsius'}&wind_speed_unit=${u.w === 'mph' ? 'mph' : u.w === 'ms' ? 'ms' : 'kmh'}`;
    const r = await fetch('https://api.open-meteo.com/v1/forecast?' + q); if (!r.ok) throw new Error('HTTP ' + r.status); const w = await r.json(); if (!w.current) throw new Error('no data');
    const v = { w, at: Date.now(), stale: false }; WXMEM[key] = v; c.api.wxSet(key, { w, at: v.at }); return v;
  } catch (e) { const d = await c.api.wxGet(key); if (d) return { w: d.w, at: d.at, stale: true }; throw e; } // offline: letzte Daten zeigen
}
async function geocode(q, lang) { const g = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=${lang}`)).json(); return g.results && g.results[0]; }
async function resolveLoc(c, force) { // Standort pro Widget: automatisch (echte Windows-Ortung, kein Ersatzort) oder manuell gewählte Stadt
  const p = c.props, src = p.src || 'auto';
  if (src === 'city') {
    if (p.lat !== undefined && p.lat !== '' && p.lon !== undefined) return { lat: +p.lat, lon: +p.lon, name: p.cityName || p.city || '', source: 'city' };
    const q = (p.city || '').trim(); if (!q) return { err: { reason: 'nocity' } };
    const g = await geocode(q, getLang()); return g ? { lat: g.latitude, lon: g.longitude, name: g.name, source: 'city' } : { err: { reason: 'notfound', c: q } };
  }
  const r = await c.api.location(!!force); return r.ok ? r : { err: r };
}
const WX_SET = [
  { key: 'src', label: 'set.src', type: 'select', options: [['auto', 'set.src.auto'], ['city', 'set.src.city']], def: 'auto' },
  { key: 'city', label: 'set.city', type: 'city' },
  { key: 'bgMode', label: 'set.bgMode', type: 'select', options: [['auto', 'set.bg.auto'], ['fixed', 'set.bg.fixed'], ['blue', 'set.bg.blue'], ['gray', 'set.bg.gray'], ['transparent', 'set.bg.transparent'], ['white', 'set.bg.white'], ['dark', 'set.bg.dark']], def: 'auto' },
  { key: 'unitT', label: 'set.unitT', type: 'select', options: [['', 'set.default'], ['C', '°C'], ['F', '°F']], def: '' },
  { key: 'unitW', label: 'set.unitW', type: 'select', options: [['', 'set.default'], ['kmh', 'wind.kmh'], ['mph', 'wind.mph'], ['ms', 'wind.ms']], def: '' },
  { key: 'h12', label: 'set.h12', type: 'select', options: [['', 'set.default'], ['24', 'st.h24'], ['12', 'st.h12']], def: '' },
  { key: 'showHourly', label: 'set.showHourly', type: 'bool', def: true }, { key: 'showDaily', label: 'set.showDaily', type: 'bool', def: true },
  { key: 'showWind', label: 'set.showWind', type: 'bool', def: true }, { key: 'showPrecip', label: 'set.showPrecip', type: 'bool', def: true }, { key: 'showFeels', label: 'set.showFeels', type: 'bool', def: false },
  { key: 'effects', label: 'set.effects', type: 'bool', def: false },
  { key: 'barMode', label: 'set.barMode', type: 'select', options: [['grad', 'set.bar.grad'], ['accent', 'set.bar.accent']], def: 'grad' }
];
const flag = (c, k, def = true) => c.props[k] === undefined ? def : !!c.props[k];

function locError(c, err, retry) {
  const msg = err.reason === 'nocity' ? t('loc.nocity') : err.reason === 'notfound' ? t('loc.notfound', { c: err.c }) : err.reason === 'denied' ? t('loc.denied') : err.reason === 'unavailable' ? t('loc.unavailable') : t('loc.unknown');
  const small = c.el.clientWidth < 260, btn = (a, k) => `<button class="wx-b" data-a="${a}">${t(k)}</button>`;
  const fix = err.reason === 'nocity' || err.reason === 'notfound' ? btn('set', 'loc.setcity') : (['denied', 'unknown', 'unavailable'].includes(err.reason) ? btn('win', small ? 'loc.enable' : 'loc.open') : '') + btn('retry', 'loc.retry') + (small ? '' : btn('set', 'loc.setcity'));
  if (c.el.clientWidth < 150) { c.el.style.padding = ''; c.el.innerHTML = `<div class="wx-e"><span>${t('loc.short')}</span><div><button class="wx-b" data-a="retry">${t('loc.retry')}</button></div></div>`; c.el.querySelector('.wx-b').onclick = retry; return; }
  c.el.style.padding = ''; c.el.innerHTML = `<div class="wx-e"><b>${t(small ? 'loc.short' : 'loc.title')}</b><span>${esc(msg)}</span>${['denied', 'unknown', 'unavailable'].includes(err.reason) && !small ? `<span class="dim">${esc(t('loc.help'))}</span>` : ''}<div>${fix}</div></div>`;
  c.el.querySelectorAll('.wx-b').forEach((b) => (b.onclick = () => { if (b.dataset.a === 'win') c.api.openUrl('ms-settings:privacy-location'); else if (b.dataset.a === 'retry') retry(); else c.api.openApp('widgets:' + (c.w.id || '')); }));
}

// ---- Daten für die Ansichten aufbereiten ----
function prep(c, data) {
  const x = data.w, cur = x.current, d = x.daily, u = unitsOf(c), T = (v) => Math.round(v) + '°', night = !cur.is_day;
  return { x, cur, d, u, T, night, name: data.name, auto: data.auto, stale: data.stale, at: data.at, locStale: data.locStale, accuracy: data.accuracy };
}
const arrowFor = (p) => (p.auto === 'auto' ? locArrow : '');
const windStr = (p) => `${Math.round(p.cur.wind_speed_10m)} ${t('wind.' + p.u.w)}`;
function precipStr(p) {
  const s = p.d.precipitation_sum || [], i = s.findIndex((v) => v >= 0.1), n = s.length || 10;
  return i < 0 ? t('precipNone', { n }) : i === 0 ? t('precipToday', { v: s[0].toFixed(1) }) : t('precipIn', { v: s[i].toFixed(1), n: i });
}
function hourItems(p, n) { // Stundenverlauf inkl. Sonnenauf-/untergang als eigene Spalte (Ortszeit der Stadt)
  const { x, cur, d, u, T } = p, i0 = Math.max(0, x.hourly.time.findIndex((q) => q >= cur.time.slice(0, 13) + ':00')), items = [];
  for (let k = 0; items.length < n + 1 && i0 + k < x.hourly.time.length; k++) { const i = i0 + k; items.push({ at: x.hourly.time[i], label: fmtHour(x.hourly.time[i], u.h12), icon: wxIcon(x.hourly.weather_code[i], !x.hourly.is_day[i]), temp: T(x.hourly.temperature_2m[i]), i }); }
  const last = items[items.length - 1] && items[items.length - 1].at;
  [[d.sunrise[0], true], [d.sunset[0], false], [d.sunrise[1], true], [d.sunset[1], false]].filter(([e]) => e && e > cur.time && last && e < last).forEach(([e, up]) => {
    const k = items.findIndex((q) => q.at > e); if (k > 0) items.splice(k, 0, { at: e, label: fmtHM(e, u.h12), icon: horizonIcon(up), temp: T(x.hourly.temperature_2m[items[k - 1].i]) });
  });
  return items.slice(0, n);
}
const hourHtml = (items) => '<div class="wl-hours">' + items.map((q) => `<div><span class="t">${q.label}</span>${q.icon}<b>${q.temp}</b></div>`).join('') + '</div>';
function headHtml(c, p) {
  const { cur, d, T } = p, show = flag(c, 'showFeels', false);
  return `<div class="wl-h"><div><div class="wl-city">${esc(p.name || t('currentLocation'))}${arrowFor(p)}</div><div class="wl-temp">${T(cur.temperature_2m)}</div></div><div class="wl-hr">${wxIcon(cur.weather_code, p.night)}<div class="wl-cond">${condText(cur.weather_code)}</div><div class="wl-hlo">${t('hl', { h: Math.round(d.temperature_2m_max[0]), l: Math.round(d.temperature_2m_min[0]) })}</div>${show ? `<div class="wl-hlo">${t('feels', { t: Math.round(cur.apparent_temperature) })}</div>` : ''}</div></div>`;
}
function dailyHtml(c, p) {
  const { d, cur, u, T } = p, rows = 5, lo = Math.min(...d.temperature_2m_min.slice(0, rows)), hi = Math.max(...d.temperature_2m_max.slice(0, rows)), span = Math.max(1, hi - lo), accent = flag(c, 'barMode', true) && (c.props.barMode === 'accent');
  return '<div class="wl-days">' + d.time.slice(0, rows).map((day, i) => {
    const a = (d.temperature_2m_min[i] - lo) / span * 100, b = (d.temperature_2m_max[i] - lo) / span * 100, bg = accent ? 'var(--accent)' : `linear-gradient(90deg, ${tempColor(d.temperature_2m_min[i], u)}, ${tempColor(d.temperature_2m_max[i], u)})`;
    const dot = i === 0 ? `<u style="left:${Math.min(100, Math.max(0, (cur.temperature_2m - lo) / span * 100))}%"></u>` : '';
    return `<div><b>${i === 0 ? t('today') : weekdayShort(day + 'T12:00')}</b>${wxIcon(d.weather_code[i], false)}<span class="lo">${T(d.temperature_2m_min[i])}</span><div class="wl-bar"><i style="left:${a}%;width:${Math.max(6, b - a)}%;background:${bg}"></i>${dot}</div><span class="hi">${T(d.temperature_2m_max[i])}</span></div>`;
  }).join('') + '</div>';
}
function scaleBox(c, ref, refH) { c.el.style.setProperty('--u', `calc(min(100cqw / ${ref}, 100cqh / ${refH}) * var(--fs, 1))`); c.el.style.padding = `calc(var(--u) * ${ref === 470 ? 24 : 18} * var(--pad, 1))`; }
const hhmm = (ms) => new Date(ms).toLocaleTimeString(LANG_TAG[getLang()], { hour: '2-digit', minute: '2-digit' });
const staleHint = (p) => { const h = []; if (p.stale) h.push(t('offlineHint', { t: hhmm(p.at) })); if (p.locStale) h.push(t('loc.stale', { t: hhmm(p.locStale) })); if (p.accuracy > 3000) h.push(t('loc.approx', { km: Math.round(p.accuracy / 1000) }));
  if (p.xs) return ''; return h.length ? `<div class="wl-stale">${esc(h.join(' · '))}</div>` : ''; };

// ---- Ansichten ----
function viewMain(c, data, w, h) { // W1 (gross), W2 (mittel), W4 (klein), XS
  const p = prep(c, data), { cur, d, T } = p;
  if (w < 150) { scaleBox(c, 120, 120); return `<div class="w4 w-xs"><div class="w4-city">${esc(p.name || t('currentLocation'))}</div><div class="w4-temp">${T(cur.temperature_2m)}</div><div class="w4-r2">${wxIcon(cur.weather_code, p.night)}<span>↑${T(d.temperature_2m_max[0])} ↓${T(d.temperature_2m_min[0])}</span></div></div>`; }
  if (w < 300) { scaleBox(c, 220, 220);
    return `<div class="w4"><div class="w4-top"><div><div class="w4-city">${esc(p.name || t('currentLocation'))}${arrowFor(p)}</div><div class="w4-temp">${T(cur.temperature_2m)}</div></div><div class="w4-r">${wxIcon(cur.weather_code, p.night)}<div>↑${T(d.temperature_2m_max[0])}</div><div>↓${T(d.temperature_2m_min[0])}</div></div></div>
      <div class="w4-b">${flag(c, 'showPrecip') ? `<b>${t('precipitation')}</b><span>${precipStr(p)}</span>` : ''}${flag(c, 'showWind') ? `<b>${t('wind')}</b><span>${windStr(p)}</span>` : ''}</div></div>${staleHint(p)}`; }
  const tall = h / w >= 0.75 && flag(c, 'showDaily'); scaleBox(c, 470, tall ? 470 : 220);
  const hours = flag(c, 'showHourly') ? hourHtml(hourItems(p, 6)) : '';
  return `<div class="wl">${headHtml(c, p)}${hours ? `<div class="wl-div"></div>${hours}` : ''}${tall ? `<div class="wl-div"></div>${dailyHtml(c, p)}` : ''}${flag(c, 'showWind') && tall ? `<div class="wl-ex"><span>${t('wind')}: <b>${windStr(p)}</b></span><span>${t('precipitation')}: <b>${precipStr(p)}</b></span></div>` : ''}</div>${staleHint(p)}`;
}
function viewSun(c, data) { // W3
  const p = prep(c, data), { d, cur, u } = p, now = minutesOf(cur.time), r0 = minutesOf(d.sunrise[0]), s0 = minutesOf(d.sunset[0]);
  let main, footLabel, footTime, up, f, nightDot = false;
  if (now < r0) { main = d.sunrise[0]; footLabel = 'sunset'; footTime = d.sunset[0]; up = true; nightDot = true; f = (now + 1440 - s0) / Math.max(1, r0 + 1440 - s0); }
  else if (now > s0) { main = d.sunrise[1]; footLabel = 'sunset'; footTime = d.sunset[1]; up = true; nightDot = true; f = (now - s0) / Math.max(1, minutesOf(d.sunrise[1]) - s0); }
  else { main = d.sunset[0]; footLabel = 'sunrise'; footTime = d.sunrise[0]; up = false; f = (now - r0) / Math.max(1, s0 - r0); }
  const W = 200, hor = 46, A = 26, x0 = 0.2 * W, x1 = 0.8 * W; let path = ''; for (let x = 0; x <= W; x += 4) path += (x ? 'L' : 'M') + x + ' ' + (hor - A * Math.sin(Math.PI * (x - x0) / (x1 - x0))).toFixed(1);
  let dx; if (!nightDot) dx = x0 + f * (x1 - x0); else { dx = x1 + Math.min(1, Math.max(0, f)) * (W - x1 + x0); if (dx > W) dx -= W; }
  const dy = hor - A * Math.sin(Math.PI * (dx - x0) / (x1 - x0)); scaleBox(c, 220, 220);
  return `<div class="w3"><div class="w3-t">${horizonIcon(up)}<span>${t(up ? 'sunrise' : 'sunset').toLocaleUpperCase(LANG_TAG[getLang()])}</span></div><div class="w3-v">${fmtHM(main, u.h12)}</div>
    <svg viewBox="0 0 200 80" preserveAspectRatio="xMidYMid meet"><path d="${path}" fill="none" stroke="var(--text)" stroke-width="2.2" opacity=".4"/><line x1="0" y1="${hor}" x2="200" y2="${hor}" stroke="var(--text)" stroke-width="1" opacity=".45"/><circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="5" fill="#fff"/></svg>
    <div class="w3-f">${t(footLabel)}: ${fmtHM(footTime, u.h12)}</div></div>${staleHint(p)}`;
}

// ---- Gemeinsame Steuerung ----
function weatherBase(c, view, withBg = true) {
  let dead = false, data = null, busy = false, locTried = 0;
  const mode = c.props.bgMode || 'auto';
  if (mode === 'fixed') clearBg(c);
  const paint = () => {
    if (!data) return; const w = c.el.clientWidth, h = c.el.clientHeight; if (!w) return;
    try { c.el.innerHTML = view(c, data, w, h); } catch (e) { c.el.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
    const cur = data.w.current, d = data.w.daily;
    if (mode === 'auto') { const [key, g] = autoGradient(cur.weather_code, !!cur.is_day, cur.time, d.sunrise[0], d.sunset[0]); bgLayer(c, key, g, (c.theme && c.theme.opacity !== undefined ? Math.max(c.theme.opacity, 0) : 1)); }
    else if (BG_PRESET[mode]) { const pr = BG_PRESET[mode]; bgLayer(c, 'p' + mode, pr.g, c.theme && c.theme.opacity !== undefined ? c.theme.opacity : 1); if (pr.text) { const cs = c.el.parentElement.style; cs.setProperty('--text', pr.text); cs.setProperty('--text2', 'rgba(17,17,17,.6)'); cs.setProperty('--line', 'rgba(17,17,17,.15)'); cs.setProperty('--icon', '#6b7480'); cs.setProperty('--temp', pr.text); cs.setProperty('--num', pr.text); } }
    effects(c, condKind(cur.weather_code), !cur.is_day, flag(c, 'effects', !!(c.settings && c.settings.effects)));
  };
  const load = async (force) => {
    if (busy) return; busy = true;
    try {
      const loc = await resolveLoc(c, force); if (dead) return; if (loc.err) { data = null; locError(c, loc.err, () => load(true)); return; }
      const v = await getWx(c, loc, unitsOf(c), force); if (dead) return;
      data = { ...v, name: loc.name || '', auto: c.props.src === 'city' ? 'city' : 'auto', locStale: loc.stale ? loc.at : 0, accuracy: loc.accuracy || 0, posSource: loc.posSource || '' }; paint();
    } catch (e) { if (!dead) { data = null; c.el.style.padding = ''; c.el.innerHTML = `<div class="wx-e"><b>${t('wxUnavailable')}</b><span>${esc(e.message)}</span><div><button class="wx-b">${t('loc.retry')}</button></div></div>`; const b = c.el.querySelector('.wx-b'); if (b) b.onclick = () => load(true); } }
    finally { busy = false; }
  };
  c.el.innerHTML = `<div class="empty">${t('locating')}</div>`;
  const stop = sized(c, paint); load(false);
  // Standort alle 5 Minuten neu bestimmen (auch ohne manuelles Aktualisieren); neue Koordinaten holen sofort neues Wetter
  const every = c.props.src === 'city' ? Math.max(1, (c.settings && c.settings.refreshMin) || 20) * 60000 : 5 * 60000, iv = setInterval(() => load(false), every);
  const onl = () => load(false); window.addEventListener('online', onl);
  c.onRefresh(() => load(true));
  return () => { dead = true; stop(); clearInterval(iv); window.removeEventListener('online', onl); const f = c.el.parentElement && c.el.parentElement.querySelector(':scope > .wfx'); if (f) f.remove(); };
}
reg('weather', { name: 'Wetter', cat: 'apple', icon: '⛅', size: 'M', theme: { ...TH.blue, opacity: 0.96, radius: 40 }, desc: 'Gross, mittel oder klein: Standort automatisch, Hintergrund nach Wetter und Tageszeit',
  settings: WX_SET, render(c) { return weatherBase(c, viewMain); } });
reg('sunset', { name: 'Sonnenauf-/untergang', cat: 'apple', icon: '🌇', size: 'S', theme: { ...TH.blue, opacity: 0.96, radius: 36 }, desc: 'Sonnenuntergang (nach Sonnenuntergang: Sonnenaufgang) mit Sonnenbogen',
  settings: WX_SET.filter((s) => !['showHourly', 'showDaily', 'showWind', 'showPrecip', 'showFeels', 'unitT', 'unitW', 'barMode'].includes(s.key)), render(c) { return weatherBase(c, viewSun); } });
