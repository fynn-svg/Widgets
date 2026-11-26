// ---------- 50 weitere Widgets für den Widget Store ----------
(() => {
const P2 = (n) => String(n).padStart(2, '0');
const DE_DOW = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const DE_MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${P2(d.getMonth() + 1)}-${P2(d.getDate())}`; };
const loop = (fn, ms) => { fn(); const i = setInterval(fn, ms); return () => clearInterval(i); };
const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];
const daySeed = () => { const d = new Date(); return d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate(); };
const ring = (p, label, sub, col) => `<div class="mw-ringw"><svg viewBox="0 0 100 100" class="mw-ring"><circle cx="50" cy="50" r="42" class="tr"/><circle cx="50" cy="50" r="42" class="pr" style="stroke-dasharray:${(Math.max(0, Math.min(1, p)) * 263.9).toFixed(1)} 264;${col ? 'stroke:' + col : ''}"/></svg><div class="mw-ringt"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</div></div>`;
const daysUntil = (iso) => { if (!iso) return null; const t = new Date(iso + 'T00:00'); const n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((t - n) / 864e5); };

const BL = { bg1: '#1c1c1e', gradient: false, opacity: 0.92, text: '#ffffff', icon: '#ffffff', accent: '#0a84ff', btn: '#0a84ff', progress: '#30d158', border: '#ffffff', borderOpacity: 0.1, glass: true, radius: 22 };
const GL = { ...BL, bg1: '#1c1c20', opacity: 0.45, borderOpacity: 0.16 };
const WH = { ...BL, bg1: '#f5f5f7', opacity: 0.96, text: '#1d1d1f', icon: '#1d1d1f', accent: '#ff3b30', border: '#000000', borderOpacity: 0.06 };
const G = (a, b, ang = 160) => ({ ...BL, bg1: a, bg2: b, gradient: true, angle: ang, opacity: 0.97, accent: '#ffffff', btn: '#ffffff', progress: '#ffffff', borderOpacity: 0.14 });
const NO = { ...BL, opacity: 0, borderOpacity: 0, glass: false };

const add = (id, d) => reg('mw-' + id, { cat: 'more', size: 'S', theme: BL, settings: [], ...d });

// ===================== Uhr & Zeit =====================
add('flip', { name: 'Flip-Uhr', scat: 'zeit', icon: '🔢', size: 'M', desc: 'Klassische Klappzahlen-Uhr', theme: { ...BL, bg1: '#000000', opacity: 0.9 },
  render(c) { c.el.innerHTML = '<div class="mw-flip"></div>'; const b = c.el.firstChild;
    return loop(() => { const n = new Date(), s = P2(n.getHours()) + P2(n.getMinutes()); b.innerHTML = `<span>${s[0]}</span><span>${s[1]}</span><i>:</i><span>${s[2]}</span><span>${s[3]}</span>`; }, 1000); } });

add('wordclock', { name: 'Wortuhr', scat: 'zeit', icon: '🔤', size: 'L', desc: 'Die Uhrzeit in Worten, wie die berühmte Wortuhr', theme: { ...BL, bg1: '#111113' },
  render(c) { c.el.innerHTML = '<div class="mw-words"></div>'; const b = c.el.firstChild;
    const H = ['zwölf', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
    return loop(() => { const n = new Date(); let h = n.getHours() % 12, m = Math.round(n.getMinutes() / 5) * 5; if (m === 60) { m = 0; h = (h + 1) % 12; }
      const nx = H[(h + 1) % 12], cur = m === 0 && h === 1 ? 'ein' : H[h];
      const t = { 0: `${cur} Uhr`, 5: `fünf nach ${H[h]}`, 10: `zehn nach ${H[h]}`, 15: `viertel nach ${H[h]}`, 20: `zwanzig nach ${H[h]}`, 25: `fünf vor halb ${nx}`, 30: `halb ${nx}`, 35: `fünf nach halb ${nx}`, 40: `zwanzig vor ${nx}`, 45: `viertel vor ${nx}`, 50: `zehn vor ${nx}`, 55: `fünf vor ${nx}` }[m];
      b.innerHTML = `<small>Es ist</small>${t.split(' ').map((w) => `<b>${w}</b>`).join(' ')}`; }, 5000); } });

add('binary', { name: 'Binäruhr', scat: 'zeit', icon: '💡', size: 'M', desc: 'Stunden, Minuten und Sekunden als leuchtende Punkte', theme: { ...BL, bg1: '#0b0b10', accent: '#30d158' },
  render(c) { c.el.innerHTML = '<div class="mw-bin"></div>'; const b = c.el.firstChild;
    return loop(() => { const n = new Date(), digs = (P2(n.getHours()) + P2(n.getMinutes()) + P2(n.getSeconds())).split('').map(Number);
      b.innerHTML = digs.map((d, i) => `<div class="col ${i % 2 ? 'gap' : ''}">${[8, 4, 2, 1].map((v) => `<i class="${d & v ? 'on' : ''}"></i>`).join('')}<small>${d}</small></div>`).join(''); }, 1000); } });

add('progress', { name: 'Zeit-Fortschritt', scat: 'zeit', icon: '⏳', size: 'M', desc: 'Wie viel vom Tag, der Woche, dem Monat und dem Jahr schon vorbei ist',
  render(c) { c.el.innerHTML = '<div class="mw-bars"></div>'; const b = c.el.firstChild;
    return loop(() => { const n = new Date(), y = n.getFullYear();
      const day = (n - new Date(y, n.getMonth(), n.getDate())) / 864e5, wk = (((n.getDay() + 6) % 7) + day) / 7;
      const mo = (n.getDate() - 1 + day) / new Date(y, n.getMonth() + 1, 0).getDate(), yr = (n - new Date(y, 0, 1)) / (new Date(y + 1, 0, 1) - new Date(y, 0, 1));
      b.innerHTML = [['Tag', day], ['Woche', wk], ['Monat', mo], ['Jahr', yr]].map(([l, p]) => `<div class="r"><span>${l}</span><div class="bar"><i style="width:${(p * 100).toFixed(1)}%"></i></div><b>${Math.floor(p * 100)}%</b></div>`).join(''); }, 30000); } });

add('stopwatch', { name: 'Stoppuhr', scat: 'zeit', icon: '⏱️', size: 'S', desc: 'Start, Stopp und Runden', theme: { ...BL, accent: '#ff9f0a' },
  render(c) { let t0 = c.data.t0 || 0, acc = c.data.acc || 0, run = !!c.data.run;
    c.el.innerHTML = '<div class="mw-sw"><div class="t"></div><div class="row"><button class="mw-b g">Start</button><button class="mw-b">Reset</button></div></div>';
    const [bs, br] = c.el.querySelectorAll('button'), tt = c.el.querySelector('.t');
    const now = () => acc + (run ? Date.now() - t0 : 0);
    const draw = () => { const ms = now(), m = Math.floor(ms / 6e4), s = Math.floor(ms / 1000) % 60, cs = Math.floor(ms / 10) % 100; tt.textContent = `${P2(m)}:${P2(s)},${P2(cs)}`; bs.textContent = run ? 'Stopp' : 'Start'; bs.classList.toggle('r', run); };
    const save = () => c.save({ ...c.data, t0, acc, run });
    bs.onclick = () => { if (run) { acc += Date.now() - t0; run = false; } else { t0 = Date.now(); run = true; } save(); draw(); };
    br.onclick = () => { acc = 0; t0 = Date.now(); run = false; save(); draw(); };
    return loop(draw, 50); } });

add('timer', { name: 'Kurzzeitwecker', scat: 'zeit', icon: '⏲️', size: 'S', desc: 'Countdown mit Ring, z. B. für Pasta oder Pausen', theme: { ...BL, accent: '#ff9f0a' },
  settings: [{ key: 'min', label: 'Minuten', type: 'number', def: 10 }],
  render(c) { const total = Math.max(1, +c.props.min || 10) * 6e4; let end = c.data.end || 0;
    c.el.innerHTML = '<div class="mw-tm"><div class="rg"></div><div class="row"><button class="mw-b g">Start</button><button class="mw-b">↺</button></div></div>';
    const [bs, br] = c.el.querySelectorAll('button'), rg = c.el.querySelector('.rg');
    const draw = () => { const left = end ? Math.max(0, end - Date.now()) : total, m = Math.floor(left / 6e4), s = Math.floor(left / 1000) % 60;
      rg.innerHTML = ring(left / total, `${P2(m)}:${P2(s)}`, end && !left ? 'Fertig!' : '', end && !left ? '#ff453a' : ''); bs.textContent = end && left ? 'Läuft' : 'Start'; };
    bs.onclick = () => { if (!end || end < Date.now()) { end = Date.now() + total; c.save({ ...c.data, end }); } draw(); };
    br.onclick = () => { end = 0; c.save({ ...c.data, end }); draw(); };
    return loop(draw, 250); } });

add('week', { name: 'Kalenderwoche', scat: 'zeit', icon: '📅', size: 'S', desc: 'Aktuelle Kalenderwoche und Tag im Jahr', theme: G('#5e5ce6', '#3634a3'),
  render(c) { return loop(() => { const n = new Date(), d = new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())), dn = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - dn);
    const kw = Math.ceil(((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7), doy = Math.floor((n - new Date(n.getFullYear(), 0, 0)) / 864e5);
    c.el.innerHTML = `<div class="big"><div class="l">Kalenderwoche</div><div class="n">${kw}</div><div class="l">Tag ${doy} von ${new Date(n.getFullYear(), 1, 29).getMonth() === 1 ? 366 : 365}</div></div>`; }, 60000); } });

add('rings', { name: 'Ringuhr', scat: 'zeit', icon: '⭕', size: 'S', desc: 'Stunden, Minuten und Sekunden als Aktivitätsringe', theme: { ...BL, bg1: '#000000' },
  render(c) { c.el.innerHTML = '<svg viewBox="0 0 100 100" class="mw-3r"></svg>'; const s = c.el.firstChild;
    const R = [[44, '#fa114f'], [34, '#a6ff00'], [24, '#00e5ff']];
    return loop(() => { const n = new Date(), v = [(n.getHours() % 12 + n.getMinutes() / 60) / 12, (n.getMinutes() + n.getSeconds() / 60) / 60, (n.getSeconds() + n.getMilliseconds() / 1000) / 60];
      s.innerHTML = R.map(([r, col], i) => { const L = 2 * Math.PI * r; return `<circle cx="50" cy="50" r="${r}" stroke="${col}" opacity=".22" stroke-width="8" fill="none"/><circle cx="50" cy="50" r="${r}" stroke="${col}" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="${(v[i] * L).toFixed(2)} ${L}" transform="rotate(-90 50 50)"/>`; }).join('') + `<text x="50" y="54" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">${P2(n.getHours())}:${P2(n.getMinutes())}</text>`; }, 200); } });

add('bigdate', { name: 'Datum gross', scat: 'zeit', icon: '🗓️', size: 'S', desc: 'Wochentag und Tag in grosser Schrift', theme: WH,
  render(c) { return loop(() => { const n = new Date(); c.el.innerHTML = `<div class="mw-bd"><span class="acc">${DE_DOW[n.getDay()]}</span><b>${n.getDate()}</b><span class="dim">${DE_MON[n.getMonth()]} ${n.getFullYear()}</span></div>`; }, 60000); } });

add('zones', { name: 'Zeitzonen-Leiste', scat: 'zeit', icon: '🌍', size: 'M', desc: 'Drei Städte mit Tag- und Nachtanzeige',
  settings: [{ key: 'cities', label: 'Städte (Name=Zeitzone, mit Komma)', type: 'text', def: 'New York=America/New_York, London=Europe/London, Tokio=Asia/Tokyo' }],
  render(c) { const list = String(c.props.cities || 'New York=America/New_York, London=Europe/London, Tokio=Asia/Tokyo').split(',').map((x) => x.split('=').map((y) => y.trim())).filter((x) => x[1]).slice(0, 4);
    c.el.innerHTML = '<div class="mw-zones"></div>'; const b = c.el.firstChild;
    return loop(() => { b.innerHTML = list.map(([n, tz]) => { let h = 12, t = '–'; try { const f = new Intl.DateTimeFormat('de-CH', { timeZone: tz, hour: '2-digit', minute: '2-digit' }); t = f.format(new Date()); h = +t.slice(0, 2); } catch {}
      return `<div class="z"><span class="ic">${h >= 7 && h < 19 ? '☀️' : '🌙'}</span><b>${esc(n)}</b><span class="t">${t}</span></div>`; }).join(''); }, 15000); } });

// ===================== Wetter & Natur =====================
function moonPhase(d = new Date()) { const lp = 2551443, nm = new Date(1970, 0, 7, 20, 35, 0); const ph = ((d.getTime() - nm.getTime()) / 1000) % lp; return ph / lp; }
add('moon', { name: 'Mondphase', scat: 'wetter', icon: '🌙', size: 'S', desc: 'Aktuelle Mondphase und Tage bis Vollmond', theme: G('#0b1630', '#26385f'),
  render(c) { return loop(() => { const p = moonPhase(), names = ['Neumond', 'Zunehmende Sichel', 'Erstes Viertel', 'Zunehmender Mond', 'Vollmond', 'Abnehmender Mond', 'Letztes Viertel', 'Abnehmende Sichel'], i = Math.round(p * 8) % 8;
    const toFull = Math.round(((0.5 - p + 1) % 1) * 29.53), lit = (1 - Math.cos(p * 2 * Math.PI)) / 2, x = p < 0.5 ? 1 : -1;
    const rx = Math.abs(Math.cos(p * 2 * Math.PI)) * 40, sweep = p < 0.5 ? (p < 0.25 ? 0 : 1) : (p < 0.75 ? 1 : 0);
    c.el.innerHTML = `<div class="big"><svg viewBox="0 0 100 100" style="width:48cqmin;height:48cqmin"><circle cx="50" cy="50" r="40" fill="#2a3550"/><path d="M50 10 A40 40 0 0 ${x > 0 ? 1 : 0} 50 90 A${rx} 40 0 0 ${sweep} 50 10" fill="#f4efd6"/></svg><div class="l" style="color:#fff">${names[i]}</div><div class="l">${Math.round(lit * 100)}% · Vollmond in ${toFull} T</div></div>`; }, 3600000); } });

add('seasons', { name: 'Jahreszeit', scat: 'wetter', icon: '🍂', size: 'S', desc: 'Welche Jahreszeit gerade ist und wie lange noch',
  render(c) { return loop(() => { const n = new Date(), y = n.getFullYear(), S = [['Frühling', '🌸', new Date(y, 2, 20), '#30d158'], ['Sommer', '☀️', new Date(y, 5, 21), '#ff9f0a'], ['Herbst', '🍂', new Date(y, 8, 23), '#ff6b2c'], ['Winter', '❄️', new Date(y, 11, 21), '#64d2ff']];
    let cur = S[3], nx = S[0]; for (let i = 0; i < 4; i++) if (n >= S[i][2]) { cur = S[i]; nx = S[(i + 1) % 4]; }
    const nd = new Date(nx[2]); if (nd < n) nd.setFullYear(y + 1); const left = Math.ceil((nd - n) / 864e5);
    c.el.innerHTML = `<div class="big"><div style="font-size:30cqmin">${cur[1]}</div><b style="font-size:max(14px,10cqmin);color:${cur[3]}">${cur[0]}</b><div class="l">noch ${left} Tage bis ${nx[0]}</div></div>`; }, 3600000); } });

function wxGetSimple(c, extra) { return resolveLoc(c, false).then((loc) => { if (loc.err) throw new Error('Ort wählen'); return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&timezone=auto&${extra}`).then((r) => r.json()).then((j) => ({ j, loc })); }); }
const WXSET = [{ key: 'src', label: 'set.src', type: 'select', options: [['auto', 'set.src.auto'], ['city', 'set.src.city']], def: 'city' }, { key: 'city', label: 'set.city', type: 'city' }];
const ZH = () => (globalThis.FY_ZH ? { ...globalThis.FY_ZH } : { src: 'city', city: 'Zürich', lat: 47.3769, lon: 8.5417 });
const wxWidget = (id, d, extra, paint) => add(id, { ...d, scat: 'wetter', settings: WXSET, variants: [{ name: 'Standard', size: d.size || 'S', props: ZH(), theme: null }],
  render(c) { if (!c.props.src) Object.assign(c.props, ZH()); c.el.innerHTML = '<div class="big"><div class="l">Lädt …</div></div>';
    const go = () => wxGetSimple(c, extra).then(({ j, loc }) => paint(c, j, loc)).catch(() => { c.el.innerHTML = '<div class="big"><div class="l">Keine Wetterdaten.<br>Ort in den Einstellungen wählen.</div></div>'; });
    return loop(go, 20 * 60000); } });

wxWidget('temp', { name: 'Temperatur gross', icon: '🌡️', desc: 'Nur die Temperatur, riesig und klar', theme: G('#2b6fd1', '#4d9be9') }, 'current=temperature_2m,apparent_temperature',
  (c, j, loc) => { c.el.innerHTML = `<div class="big"><div class="l" style="color:inherit">${esc(loc.name || '')}</div><div class="n" style="font-weight:300">${Math.round(j.current.temperature_2m)}°</div><div class="l">gefühlt ${Math.round(j.current.apparent_temperature)}°</div></div>`; });

wxWidget('rain', { name: 'Regen-Vorschau', icon: '☔', size: 'M', desc: 'Regenwahrscheinlichkeit der nächsten 12 Stunden', theme: G('#34465c', '#5b6e85') }, 'hourly=precipitation_probability&forecast_days=2',
  (c, j, loc) => { const now = new Date(), idx = j.hourly.time.findIndex((t) => new Date(t) >= new Date(now.getTime() - 36e5)), arr = j.hourly.precipitation_probability.slice(idx, idx + 12);
    c.el.innerHTML = `<div class="mw-chart"><div class="h"><b>☔ Regen</b><span class="dim">${esc(loc.name || '')}</span></div><div class="cols">${arr.map((v, i) => `<div><i style="height:${Math.max(4, v)}%"></i><small>${(new Date(j.hourly.time[idx + i]).getHours())}</small></div>`).join('')}</div></div>`; });

wxWidget('wind', { name: 'Wind', icon: '💨', desc: 'Windstärke und Richtung als Kompass', theme: G('#4f6d8f', '#7f9bb8') }, 'current=wind_speed_10m,wind_direction_10m,wind_gusts_10m',
  (c, j) => { const dir = j.current.wind_direction_10m, D = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'][Math.round(dir / 45) % 8];
    c.el.innerHTML = `<div class="big"><svg viewBox="0 0 100 100" style="width:52cqmin;height:52cqmin"><circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="2"/>${['N', 'O', 'S', 'W'].map((t, i) => `<text x="${50 + 34 * Math.sin(i * Math.PI / 2)}" y="${54 - 34 * Math.cos(i * Math.PI / 2)}" text-anchor="middle" font-size="10" fill="#fff" opacity=".7">${t}</text>`).join('')}<path d="M50 18 L57 54 L50 48 L43 54Z" fill="#fff" transform="rotate(${dir + 180} 50 50)"/></svg><b>${Math.round(j.current.wind_speed_10m)} km/h ${D}</b><div class="l">Böen ${Math.round(j.current.wind_gusts_10m)} km/h</div></div>`; });

wxWidget('sunbar', { name: 'Tageslicht', icon: '🌅', size: 'M', desc: 'Sonnenaufgang, Sonnenuntergang und wie lange es noch hell ist', theme: G('#ff9f0a', '#ff375f', 170) }, 'daily=sunrise,sunset&forecast_days=1',
  (c, j) => { const sr = new Date(j.daily.sunrise[0]), ss = new Date(j.daily.sunset[0]), n = new Date(), p = Math.max(0, Math.min(1, (n - sr) / (ss - sr))), hm2 = (d) => `${P2(d.getHours())}:${P2(d.getMinutes())}`;
    const len = (ss - sr) / 36e5, x = 10 + p * 80, y = 50 - Math.sin(p * Math.PI) * 32;
    c.el.innerHTML = `<div class="mw-sun"><svg viewBox="0 0 100 56"><path d="M10 50 Q50 -14 90 50" fill="none" stroke="rgba(255,255,255,.5)" stroke-dasharray="2 3"/><line x1="4" y1="50" x2="96" y2="50" stroke="rgba(255,255,255,.4)"/><circle cx="${x}" cy="${y}" r="5" fill="#fff6b0"/></svg><div class="row"><span>↑ ${hm2(sr)}</span><b>${Math.floor(len)} h ${Math.round((len % 1) * 60)} min hell</b><span>↓ ${hm2(ss)}</span></div></div>`; });

add('air', { name: 'Luftqualität', scat: 'wetter', icon: '🍃', size: 'S', desc: 'Europäischer Luftqualitäts-Index mit Farbe', settings: WXSET, variants: [{ name: 'Standard', size: 'S', props: ZH(), theme: null }],
  render(c) { if (!c.props.src) Object.assign(c.props, ZH()); c.el.innerHTML = '<div class="big"><div class="l">Lädt …</div></div>';
    const go = () => resolveLoc(c, false).then((loc) => fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lon}&current=european_aqi,pm2_5`).then((r) => r.json())).then((j) => {
      const v = j.current.european_aqi, L = v <= 20 ? ['Sehr gut', '#30d158'] : v <= 40 ? ['Gut', '#a6e22e'] : v <= 60 ? ['Mittel', '#ffd60a'] : v <= 80 ? ['Schlecht', '#ff9f0a'] : ['Sehr schlecht', '#ff453a'];
      c.el.innerHTML = `<div class="big">${ring(Math.min(1, v / 100), Math.round(v), 'AQI', L[1])}<div class="l" style="color:${L[1]}">${L[0]}</div></div>`; }).catch(() => { c.el.innerHTML = '<div class="big"><div class="l">Keine Daten</div></div>'; });
    return loop(go, 30 * 60000); } });

// ===================== Kalender & Planung =====================
add('daytile', { name: 'Heute-Kachel', scat: 'planung', icon: '📆', size: 'XS', desc: 'Wie das Kalender-Symbol vom iPhone', theme: WH,
  render(c) { return loop(() => { const n = new Date(); c.el.style.padding = '0'; c.el.innerHTML = `<div class="mw-tile"><div class="t">${DE_DOW[n.getDay()].slice(0, 2).toUpperCase()}</div><b>${n.getDate()}</b></div>`; }, 60000); } });

add('cdring', { name: 'Countdown-Ring', scat: 'planung', icon: '🎯', size: 'S', desc: 'Tage bis zu deinem Ereignis, mit Ring', theme: G('#bf5af2', '#5e5ce6'),
  settings: [{ key: 'title', label: 'Ereignis', type: 'text', def: 'Ferien' }, { key: 'date', label: 'Datum', type: 'date' }, { key: 'from', label: 'Startdatum (für den Ring)', type: 'date' }],
  render(c) { return loop(() => { const d = daysUntil(c.props.date), f = daysUntil(c.props.from || todayKey()); const tot = d !== null ? Math.max(1, d - f) : 1;
    c.el.innerHTML = `<div class="big">${ring(d === null ? 0 : 1 - d / tot, d === null ? '?' : Math.max(0, d), 'Tage')}<div class="l" style="color:inherit">${esc(c.props.title || 'Ferien')}</div></div>`; }, 3600000); } });

add('birthdays', { name: 'Geburtstage', scat: 'planung', icon: '🎂', size: 'M', desc: 'Die nächsten Geburtstage mit Alter',
  settings: [{ key: 'list', label: 'Liste (Name=JJJJ-MM-TT, mit Komma)', type: 'text', def: 'Anna=2001-03-14, Ben=1999-12-02' }],
  render(c) { return loop(() => { const n = new Date(); n.setHours(0, 0, 0, 0);
    const L = String(c.props.list || 'Anna=2001-03-14, Ben=1999-12-02').split(',').map((x) => x.split('=').map((y) => y.trim())).filter((x) => /^\d{4}-\d\d-\d\d$/.test(x[1] || '')).map(([nm, d]) => { const [y, m, dd] = d.split('-').map(Number); let nx = new Date(n.getFullYear(), m - 1, dd); if (nx < n) nx = new Date(n.getFullYear() + 1, m - 1, dd); return { nm, days: Math.round((nx - n) / 864e5), age: nx.getFullYear() - y, nx }; }).sort((a, b) => a.days - b.days).slice(0, 4);
    c.el.innerHTML = `<div class="mw-list"><div class="h">🎂 Geburtstage</div>${L.map((x) => `<div class="i"><b>${esc(x.nm)}</b><span class="dim">${x.nx.getDate()}. ${DE_MON[x.nx.getMonth()].slice(0, 3)} · wird ${x.age}</span><span class="acc">${x.days === 0 ? 'Heute! 🎉' : x.days === 1 ? 'Morgen' : 'in ' + x.days + ' T'}</span></div>`).join('') || '<div class="dim">In den Einstellungen eintragen</div>'}</div>`; }, 3600000); } });

add('weekgoal', { name: 'Wochen-Tracker', scat: 'planung', icon: '✅', size: 'M', desc: 'Ein Ziel für jeden Tag der Woche abhaken', theme: { ...BL, accent: '#30d158' },
  settings: [{ key: 'title', label: 'Ziel', type: 'text', def: 'Sport gemacht' }],
  render(c) { const wk = () => { const n = new Date(); const m = new Date(n); m.setDate(n.getDate() - ((n.getDay() + 6) % 7)); return m.toISOString().slice(0, 10); };
    const draw = () => { const k = wk(), done = (c.data.wk === k ? c.data.d : null) || [0, 0, 0, 0, 0, 0, 0], today = (new Date().getDay() + 6) % 7;
      c.el.innerHTML = `<div class="mw-wg"><div class="h"><b>${esc(c.props.title || 'Sport gemacht')}</b><span class="acc">${done.filter(Boolean).length}/7</span></div><div class="d">${'MDMDFSS'.split('').map((l, i) => `<button class="${done[i] ? 'on' : ''} ${i === today ? 'td' : ''}" data-i="${i}"><i>${done[i] ? '✓' : ''}</i><small>${l}</small></button>`).join('')}</div></div>`;
      c.el.querySelectorAll('button').forEach((b) => b.onclick = () => { done[+b.dataset.i] = done[+b.dataset.i] ? 0 : 1; c.save({ ...c.data, wk: k, d: done }); draw(); }); };
    return loop(draw, 600000); } });

add('holiday', { name: 'Ferien-Countdown', scat: 'planung', icon: '🏖️', size: 'S', desc: 'Wie viele Tage, Stunden und Minuten bis zu den Ferien', theme: G('#30d158', '#0a84ff', 150),
  settings: [{ key: 'date', label: 'Ferienbeginn', type: 'date' }, { key: 'title', label: 'Titel', type: 'text', def: 'Ferien' }],
  render(c) { return loop(() => { const t = c.props.date ? new Date(c.props.date + 'T00:00') : null, ms = t ? t - Date.now() : 0;
    const dd = Math.floor(ms / 864e5), hh = Math.floor(ms / 36e5) % 24, mm = Math.floor(ms / 6e4) % 60;
    c.el.innerHTML = `<div class="big"><div class="l" style="color:inherit">🏖️ ${esc(c.props.title || 'Ferien')}</div>${t ? (ms > 0 ? `<div class="mw-cd"><div><b>${dd}</b><small>Tage</small></div><div><b>${hh}</b><small>Std</small></div><div><b>${mm}</b><small>Min</small></div></div>` : '<b style="font-size:10cqmin">Endlich Ferien! 🎉</b>') : '<div class="l">Datum in den Einstellungen wählen</div>'}</div>`; }, 30000); } });

add('timetable', { name: 'Stundenplan heute', scat: 'planung', icon: '🏫', size: 'L', desc: 'Zeigt nur die Lektionen von heute',
  settings: ['Mo', 'Di', 'Mi', 'Do', 'Fr'].map((d) => ({ key: 'd' + d, label: d + ' (Fächer mit Komma)', type: 'text', def: d === 'Mo' ? 'Mathe, Deutsch, Englisch, Sport' : '' })),
  render(c) { return loop(() => { const n = new Date(), k = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', ''][n.getDay()], L = k ? String(c.props['d' + k] || (k === 'Mo' ? 'Mathe, Deutsch, Englisch, Sport' : '')).split(',').map((x) => x.trim()).filter(Boolean) : [];
    c.el.innerHTML = `<div class="mw-list"><div class="h">🏫 ${DE_DOW[n.getDay()]}</div>${!k ? '<div class="dim" style="padding:20px 0">Wochenende, keine Schule 😎</div>' : L.map((f, i) => `<div class="i"><span class="mw-num">${i + 1}</span><b>${esc(f)}</b></div>`).join('') || '<div class="dim">In den Einstellungen eintragen</div>'}</div>`; }, 600000); } });

add('yeardots', { name: 'Jahr in Punkten', scat: 'planung', icon: '⚫', size: 'L', desc: 'Jeder Tag des Jahres ein Punkt, die vergangenen leuchten', theme: { ...BL, bg1: '#0c0c0e', accent: '#ff9f0a' },
  render(c) { return loop(() => { const n = new Date(), y = n.getFullYear(), tot = (new Date(y + 1, 0, 1) - new Date(y, 0, 1)) / 864e5, doy = Math.floor((n - new Date(y, 0, 1)) / 864e5);
    let s = ''; for (let i = 0; i < tot; i++) s += `<i class="${i < doy ? 'p' : i === doy ? 't' : ''}"></i>`;
    c.el.innerHTML = `<div class="mw-yd"><div class="h"><b>${y}</b><span class="dim">${tot - doy - 1} Tage übrig · ${Math.round(doy / tot * 100)}%</span></div><div class="g">${s}</div></div>`; }, 3600000); } });

add('nextevent', { name: 'Nächster Termin', scat: 'planung', icon: '🔔', size: 'M', desc: 'Dein nächster Termin aus Google Kalender oder iCloud', theme: G('#ff3b30', '#c2102b'),
  render(c) { return loop(() => { const now = Date.now(), list = [...((c.cache && c.cache.events) || []), ...(c.events || [])].filter((e) => e && (e.end || e.start) > now).sort((a, b) => a.start - b.start), e = list[0];
    if (!e) { c.el.innerHTML = '<div class="big"><div class="l" style="color:inherit">Keine kommenden Termine</div><div class="l">Google Kalender unter «Kalender und iCloud» verbinden</div></div>'; return; }
    const d = new Date(e.start), mins = Math.round((e.start - now) / 6e4), when = e.start <= now ? 'Läuft gerade' : mins < 60 ? `in ${mins} Min` : mins < 1440 ? `in ${Math.round(mins / 60)} Std` : `${DE_DOW[d.getDay()]}, ${d.getDate()}. ${DE_MON[d.getMonth()]}`;
    c.el.innerHTML = `<div class="mw-ne"><small>NÄCHSTER TERMIN</small><b>${esc(e.title)}</b><span>${when}${e.allDay ? ' · ganztägig' : ' · ' + P2(d.getHours()) + ':' + P2(d.getMinutes())}</span>${list[1] ? `<em>Danach: ${esc(list[1].title)}</em>` : ''}</div>`; }, 30000); } });

// ===================== Produktivität =====================
add('focusring', { name: 'Fokus 25', scat: 'produktiv', icon: '🎧', size: 'S', desc: '25 Minuten konzentriert arbeiten, dann 5 Minuten Pause', theme: G('#ff375f', '#bf5af2'),
  render(c) { let st = c.data.st || 0, mode = c.data.mode || 'work';
    c.el.innerHTML = '<div class="mw-tm"><div class="rg"></div><div class="row"><button class="mw-b g">Start</button></div></div>'; const rg = c.el.querySelector('.rg'), b = c.el.querySelector('button');
    const draw = () => { const len = (mode === 'work' ? 25 : 5) * 6e4, left = st ? Math.max(0, st + len - Date.now()) : len;
      if (st && !left) { mode = mode === 'work' ? 'pause' : 'work'; st = Date.now(); c.save({ ...c.data, st, mode }); }
      rg.innerHTML = ring(1 - left / len, `${P2(Math.floor(left / 6e4))}:${P2(Math.floor(left / 1000) % 60)}`, mode === 'work' ? 'Fokus' : 'Pause'); b.textContent = st ? 'Stopp' : 'Start'; };
    b.onclick = () => { st = st ? 0 : Date.now(); if (!st) mode = 'work'; c.save({ ...c.data, st, mode }); draw(); };
    return loop(draw, 500); } });

add('water', { name: 'Wasser trinken', scat: 'gesundheit', icon: '💧', size: 'S', desc: 'Gläser zählen, Ziel pro Tag', theme: G('#64d2ff', '#0a84ff'),
  settings: [{ key: 'goal', label: 'Ziel (Gläser)', type: 'number', def: 8 }],
  render(c) { const draw = () => { const g = Math.max(1, +c.props.goal || 8), n = c.data.day === todayKey() ? c.data.n || 0 : 0;
    c.el.innerHTML = `<div class="mw-water"><div class="glass"><i style="height:${Math.min(100, n / g * 100)}%"></i><b>${n}/${g}</b></div><div class="row"><button class="mw-b">−</button><button class="mw-b g">+ Glas</button></div></div>`;
    const [m, p] = c.el.querySelectorAll('button'); m.onclick = () => { c.save({ ...c.data, day: todayKey(), n: Math.max(0, n - 1) }); draw(); }; p.onclick = () => { c.save({ ...c.data, day: todayKey(), n: n + 1 }); draw(); }; };
    return loop(draw, 600000); } });

add('streak', { name: 'Serie', scat: 'produktiv', icon: '🔥', size: 'S', desc: 'Wie viele Tage am Stück du etwas geschafft hast', theme: G('#ff9f0a', '#ff375f'),
  settings: [{ key: 'title', label: 'Gewohnheit', type: 'text', def: 'Lernen' }],
  render(c) { const draw = () => { const days = c.data.days || [], t = todayKey(); let s = 0; const d = new Date(); if (!days.includes(t)) d.setDate(d.getDate() - 1);
      while (days.includes(`${d.getFullYear()}-${P2(d.getMonth() + 1)}-${P2(d.getDate())}`)) { s++; d.setDate(d.getDate() - 1); }
      c.el.innerHTML = `<div class="big"><div style="font-size:24cqmin">🔥</div><div class="n" style="font-weight:700;font-size:26cqmin">${s}</div><div class="l" style="color:inherit">Tage ${esc(c.props.title || 'Lernen')}</div><button class="mw-b g" style="margin-top:4px">${days.includes(t) ? '✓ Heute erledigt' : 'Heute erledigt'}</button></div>`;
      c.el.querySelector('button').onclick = () => { const nd = days.includes(t) ? days.filter((x) => x !== t) : [...days, t].slice(-400); c.save({ ...c.data, days: nd }); draw(); }; };
    return loop(draw, 600000); } });

add('sticky', { name: 'Haftnotiz', scat: 'produktiv', icon: '📌', size: 'S', desc: 'Bunter Notizzettel wie am Kühlschrank', theme: { ...G('#fff3b0', '#ffe066'), text: '#3a3000', icon: '#3a3000', accent: '#b8860b' },
  render(c) { c.el.innerHTML = '<textarea class="mw-ta" placeholder="Notiz …" spellcheck="false"></textarea>'; const ta = c.el.firstChild; ta.value = c.data.t || ''; let tm; ta.oninput = () => { clearTimeout(tm); tm = setTimeout(() => c.save({ ...c.data, t: ta.value }), 400); }; } });

add('check', { name: 'Schnell-Checkliste', scat: 'produktiv', icon: '☑️', size: 'M', desc: 'Kurze Liste, abhaken und neu anfangen',
  render(c) { const draw = () => { const L = c.data.l || [{ t: 'Erste Aufgabe', d: false }];
      c.el.innerHTML = `<div class="mw-ck">${L.map((x, i) => `<label class="${x.d ? 'd' : ''}"><input type="checkbox" data-i="${i}" ${x.d ? 'checked' : ''}><span>${esc(x.t)}</span><button data-x="${i}">×</button></label>`).join('')}<input class="nw" placeholder="+ Neu (Enter)"></div>`;
      c.el.querySelectorAll('[data-i]').forEach((b) => b.onchange = () => { L[+b.dataset.i].d = b.checked; c.save({ ...c.data, l: L }); draw(); });
      c.el.querySelectorAll('[data-x]').forEach((b) => b.onclick = (e) => { e.preventDefault(); L.splice(+b.dataset.x, 1); c.save({ ...c.data, l: L }); draw(); });
      const nw = c.el.querySelector('.nw'); nw.onkeydown = (e) => { if (e.key === 'Enter' && nw.value.trim()) { L.push({ t: nw.value.trim(), d: false }); c.save({ ...c.data, l: L }); draw(); c.el.querySelector('.nw').focus(); } }; };
    draw(); } });

const QUOTES = ['Der beste Weg, die Zukunft vorherzusagen, ist, sie zu gestalten.', 'Kleine Schritte sind auch Schritte.', 'Mach es einfach. Perfekt wird es später.', 'Jeder Tag ist eine neue Chance.', 'Disziplin schlägt Motivation.', 'Fortschritt, nicht Perfektion.', 'Du schaffst mehr, als du denkst.', 'Fang an, wo du bist.', 'Heute ist ein guter Tag für einen guten Tag.', 'Ruhe ist auch eine Leistung.', 'Wer aufhört, besser zu werden, hört auf, gut zu sein.', 'Gute Dinge brauchen Zeit.'];
add('motivation', { name: 'Motivation', scat: 'produktiv', icon: '💪', size: 'M', desc: 'Jeden Tag ein neuer motivierender Satz', theme: G('#1c1c1e', '#3a3a3c', 135),
  render(c) { return loop(() => { c.el.innerHTML = `<div class="mw-quote"><span>“</span><b>${pick(QUOTES, daySeed())}</b></div>`; }, 3600000); } });

add('tally', { name: 'Zähler', scat: 'werkzeuge', icon: '🔢', size: 'S', desc: 'Einfach hochzählen, z. B. Liegestütze oder Kaffees',
  settings: [{ key: 'title', label: 'Titel', type: 'text', def: 'Zähler' }],
  render(c) { const draw = () => { const n = c.data.n || 0; c.el.innerHTML = `<div class="big"><div class="l">${esc(c.props.title || 'Zähler')}</div><div class="n" style="font-weight:600">${n}</div><div class="row" style="gap:8px"><button class="mw-b">−</button><button class="mw-b g">+1</button><button class="mw-b">0</button></div></div>`;
      const [m, p, z] = c.el.querySelectorAll('button'); m.onclick = () => { c.save({ ...c.data, n: n - 1 }); draw(); }; p.onclick = () => { c.save({ ...c.data, n: n + 1 }); draw(); }; z.onclick = () => { c.save({ ...c.data, n: 0 }); draw(); }; };
    draw(); } });

add('links', { name: 'Lieblingsseiten', scat: 'werkzeuge', icon: '🔗', size: 'M', desc: 'Deine wichtigsten Webseiten mit einem Klick',
  settings: [{ key: 'list', label: 'Seiten (Name=Adresse, mit Komma)', type: 'text', def: 'YouTube=https://youtube.com, Google=https://google.com, GitHub=https://github.com, Wikipedia=https://wikipedia.org' }],
  render(c) { const L = String(c.props.list || 'YouTube=https://youtube.com, Google=https://google.com, GitHub=https://github.com, Wikipedia=https://wikipedia.org').split(',').map((x) => x.split('=').map((y) => y.trim())).filter((x) => /^https?:\/\//.test(x[1] || '')).slice(0, 8);
    const col = ['#ff3b30', '#0a84ff', '#30d158', '#ff9f0a', '#bf5af2', '#64d2ff', '#ff375f', '#ffd60a'];
    c.el.innerHTML = `<div class="mw-links">${L.map(([n, u], i) => `<button data-u="${esc(u)}"><i style="background:${col[i]}">${esc(n[0] || '?')}</i><small>${esc(n)}</small></button>`).join('')}</div>`;
    c.el.querySelectorAll('button').forEach((b) => b.onclick = () => c.api.openUrl(b.dataset.u)); } });

// ===================== System =====================
add('cpugraph', { name: 'CPU-Verlauf', scat: 'system', icon: '📈', size: 'M', desc: 'Prozessorlast der letzten Minute als Kurve', theme: { ...BL, bg1: '#0c0c0e', accent: '#30d158' },
  render(c) { const hist = []; c.el.innerHTML = '<div class="mw-graph"><div class="h"><b>CPU</b><span class="v acc">–</span></div><svg viewBox="0 0 100 40" preserveAspectRatio="none"><path class="a"/><path class="l"/></svg></div>';
    const v = c.el.querySelector('.v'), a = c.el.querySelector('.a'), l = c.el.querySelector('.l');
    return loop(async () => { try { const s = await c.api.fySys(); hist.push(s.cpu); if (hist.length > 30) hist.shift(); v.textContent = Math.round(s.cpu) + ' %';
      const pts = hist.map((y, i) => `${(i / 29 * 100).toFixed(1)},${(40 - y / 100 * 38).toFixed(1)}`); if (pts.length > 1) { l.setAttribute('d', 'M' + pts.join(' L')); a.setAttribute('d', 'M' + pts[0].split(',')[0] + ',40 L' + pts.join(' L') + ` L${pts[pts.length - 1].split(',')[0]},40Z`); } } catch {} }, 2000); } });

add('ramring', { name: 'Arbeitsspeicher', scat: 'system', icon: '🧠', size: 'S', desc: 'Belegter Arbeitsspeicher als Ring', theme: { ...BL, accent: '#bf5af2' },
  render(c) { return loop(async () => { try { const s = await c.api.fySys(), u = s.memTotal - s.memFree; c.el.innerHTML = `<div class="big">${ring(u / s.memTotal, Math.round(u / s.memTotal * 100) + '%', 'RAM', '#bf5af2')}<div class="l">${(u / 1073741824).toFixed(1)} von ${Math.round(s.memTotal / 1073741824)} GB</div></div>`; } catch {} }, 3000); } });

add('batt', { name: 'Akku gross', scat: 'system', icon: '🔋', size: 'S', desc: 'Akkustand des Laptops mit Ladeanzeige', theme: { ...BL, accent: '#30d158' },
  render(c) { let bat = null; const draw = () => { if (!bat) { c.el.innerHTML = '<div class="big"><div class="l">Kein Akku gefunden (PC am Strom)</div></div>'; return; } const p = bat.level, col = p < 0.2 ? '#ff453a' : p < 0.4 ? '#ffd60a' : '#30d158';
      c.el.innerHTML = `<div class="big"><div class="mw-bat"><i style="width:${p * 100}%;background:${col}"></i>${bat.charging ? '<span>⚡</span>' : ''}</div><div class="n" style="font-size:22cqmin;font-weight:600">${Math.round(p * 100)}%</div><div class="l">${bat.charging ? 'Wird geladen' : 'Akkubetrieb'}</div></div>`; };
    if (navigator.getBattery) navigator.getBattery().then((b) => { bat = b; b.onlevelchange = b.onchargingchange = draw; draw(); }).catch(draw); else draw();
    return loop(draw, 60000); } });

add('uptime', { name: 'Laufzeit', scat: 'system', icon: '⏰', size: 'S', desc: 'Wie lange der Computer schon läuft',
  render(c) { return loop(async () => { try { const s = await c.api.fySys(), d = Math.floor(s.uptime / 86400), h = Math.floor(s.uptime / 3600) % 24, m = Math.floor(s.uptime / 60) % 60;
    c.el.innerHTML = `<div class="big"><div class="l">Läuft seit</div><div class="mw-cd"><div><b>${d}</b><small>Tage</small></div><div><b>${h}</b><small>Std</small></div><div><b>${m}</b><small>Min</small></div></div><div class="l">${esc(s.host)}</div></div>`; } catch {} }, 30000); } });

add('online', { name: 'Internet-Status', scat: 'system', icon: '📶', size: 'S', desc: 'Zeigt sofort, ob das Internet funktioniert',
  render(c) { const draw = async () => { let ms = null; if (navigator.onLine) { const t = performance.now(); try { await fetch('https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current=is_day', { cache: 'no-store' }); ms = Math.round(performance.now() - t); } catch { ms = null; } }
      const ok = ms !== null; c.el.innerHTML = `<div class="big"><div class="mw-dot ${ok ? 'ok' : ''}"></div><b style="font-size:max(14px,9cqmin)">${ok ? 'Online' : 'Offline'}</b><div class="l">${ok ? 'Antwortzeit ' + ms + ' ms' : 'Keine Verbindung'}</div></div>`; };
    window.addEventListener('online', draw); window.addEventListener('offline', draw); const st = loop(draw, 30000); return () => { st(); window.removeEventListener('online', draw); window.removeEventListener('offline', draw); }; } });

add('screens', { name: 'Bildschirme', scat: 'system', icon: '🖥️', size: 'M', desc: 'Angeschlossene Monitore mit Auflösung',
  render(c) { c.api.displays().then((ds) => { c.el.innerHTML = `<div class="mw-list"><div class="h">🖥️ ${ds.length} Bildschirm${ds.length === 1 ? '' : 'e'}</div>${ds.map((d, i) => `<div class="i"><span class="mw-num">${i + 1}</span><b>${esc(d.name)}</b></div>`).join('')}</div>`; }).catch(() => {}); } });

add('diskbar', { name: 'Speicherplatz', scat: 'system', icon: '💽', size: 'M', desc: 'Wie voll die Festplatte ist, als Balken', theme: { ...BL, accent: '#0a84ff' },
  render(c) { return loop(async () => { try { const s = await c.api.sys(); const p = s.disk || 0; c.el.innerHTML = `<div class="mw-bars"><div class="h"><b>💽 Speicherplatz</b><span class="acc">${Math.round(p * 100)}% belegt</span></div><div class="bar big"><i style="width:${p * 100}%;background:${p > 0.9 ? '#ff453a' : 'var(--accent)'}"></i></div><div class="dim">${p > 0.9 ? 'Fast voll, aufräumen lohnt sich' : 'Alles im grünen Bereich'}</div></div>`; } catch {} }, 60000); } });

// ===================== Spass & Deko =====================
add('dice', { name: 'Würfel', scat: 'spass', icon: '🎲', size: 'S', desc: 'Antippen und würfeln', theme: WH,
  render(c) { const F = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']; let v = c.data.v || 5; c.el.innerHTML = `<div class="big"><button class="mw-dice">${F[v - 1]}</button><div class="l">Klicken zum Würfeln</div></div>`;
    const b = c.el.querySelector('button'); b.onclick = () => { let n = 0; const i = setInterval(() => { v = 1 + Math.floor(Math.random() * 6); b.textContent = F[v - 1]; if (++n > 8) { clearInterval(i); c.save({ ...c.data, v }); } }, 60); }; } });

add('coin', { name: 'Münzwurf', scat: 'spass', icon: '🪙', size: 'S', desc: 'Kopf oder Zahl? Die Münze entscheidet', theme: G('#3a3a3c', '#1c1c1e'),
  render(c) { c.el.innerHTML = '<div class="big"><button class="mw-coin">?</button><div class="l">Klicken zum Werfen</div></div>'; const b = c.el.querySelector('button'), l = c.el.querySelector('.l');
    b.onclick = () => { b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin'); setTimeout(() => { const k = Math.random() < 0.5; b.textContent = k ? '👑' : '1'; l.textContent = k ? 'Kopf' : 'Zahl'; }, 600); }; } });

add('palette', { name: 'Farbpalette', scat: 'spass', icon: '🎨', size: 'M', desc: 'Jeden Tag eine schöne Farbpalette, Klick kopiert den Farbcode',
  render(c) { const draw = (seed) => { const h0 = (seed * 47) % 360, cols = [0, 30, 60, 180, 210].map((o, i) => `hsl(${(h0 + o) % 360} ${55 + i * 7}% ${45 + (i % 3) * 12}%)`);
      c.el.style.padding = '0'; c.el.innerHTML = `<div class="mw-pal">${cols.map((x) => `<button style="background:${x}" title="Kopieren"></button>`).join('')}<span class="dim">↻</span></div>`;
      const toHex2 = (el) => { const m = getComputedStyle(el).backgroundColor.match(/\d+/g).map(Number); return '#' + m.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join(''); };
      c.el.querySelectorAll('button').forEach((b) => b.onclick = () => { const hx = toHex2(b); c.api.clipCopy(hx); b.textContent = hx; setTimeout(() => (b.textContent = ''), 1200); });
      c.el.querySelector('span').onclick = () => draw(Math.floor(Math.random() * 1e6)); };
    draw(daySeed()); } });

add('mood', { name: 'Stimmung', scat: 'gesundheit', icon: '😊', size: 'M', desc: 'Wie geht es dir heute? Mit Verlauf der letzten Woche',
  render(c) { const E = ['😫', '😕', '😐', '🙂', '😄']; const draw = () => { const m = c.data.m || {}, t = todayKey(), last = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = `${d.getFullYear()}-${P2(d.getMonth() + 1)}-${P2(d.getDate())}`; last.push(m[k] !== undefined ? E[m[k]] : '·'); }
      c.el.innerHTML = `<div class="mw-mood"><b>Wie geht es dir heute?</b><div class="e">${E.map((e, i) => `<button class="${m[t] === i ? 'on' : ''}" data-i="${i}">${e}</button>`).join('')}</div><div class="w">${last.map((x) => `<span>${x}</span>`).join('')}</div></div>`;
      c.el.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { m[t] = +b.dataset.i; c.save({ ...c.data, m }); draw(); }); };
    draw(); } });

const FACTS = ['Honig wird nie schlecht. Archäologen fanden 3000 Jahre alten, essbaren Honig.', 'Ein Tag auf der Venus dauert länger als ein Jahr auf der Venus.', 'Oktopusse haben drei Herzen.', 'Bananen sind botanisch gesehen Beeren, Erdbeeren nicht.', 'Die Schweiz hat mehr als 1500 Seen.', 'Ein Blitz ist etwa fünfmal heisser als die Sonnenoberfläche.', 'Kühe haben beste Freundinnen.', 'Der Eiffelturm ist im Sommer bis zu 15 cm grösser.', 'Haie gab es schon vor den Bäumen.', 'Ein Mensch blinzelt etwa 15 000 Mal am Tag.', 'Schnecken können bis zu drei Jahre schlafen.', 'Das Herz eines Blauwals ist so gross wie ein Kleinwagen.'];
add('fact', { name: 'Wusstest du?', scat: 'spass', icon: '🤓', size: 'M', desc: 'Jeden Tag ein überraschender Fakt', theme: G('#5e5ce6', '#bf5af2', 135),
  render(c) { let i = daySeed(); const draw = () => { c.el.innerHTML = `<div class="mw-fact"><small>WUSSTEST DU?</small><b>${pick(FACTS, i)}</b><button class="mw-b">Noch einer</button></div>`; c.el.querySelector('button').onclick = () => { i++; draw(); }; }; draw(); } });

add('lava', { name: 'Lavalampe', scat: 'spass', icon: '🫧', size: 'S', desc: 'Langsam fliessende Farben, beruhigend', theme: { ...BL, bg1: '#12002b', opacity: 0.95 },
  render(c) { c.el.style.padding = '0'; c.el.innerHTML = '<div class="mw-lava"><i></i><i></i><i></i><i></i></div>'; } });

add('aquarium', { name: 'Aquarium', scat: 'spass', icon: '🐠', size: 'M', desc: 'Kleine Fische schwimmen über deinen Desktop', theme: G('#0a4d8c', '#05213d', 180),
  render(c) { c.el.style.padding = '0'; const F = ['🐠', '🐟', '🐡', '🐠', '🦐']; c.el.innerHTML = `<div class="mw-aq">${F.map((f, i) => `<span style="top:${12 + i * 17}%;animation-duration:${9 + i * 3}s;animation-delay:-${i * 2.3}s">${f}</span>`).join('')}${Array.from({ length: 8 }, (_, i) => `<b style="left:${8 + i * 12}%;animation-delay:-${i * 0.9}s"></b>`).join('')}<div class="sand"></div></div>`; } });

add('stars', { name: 'Sternenhimmel', scat: 'spass', icon: '✨', size: 'M', desc: 'Funkelnde Sterne und ab und zu eine Sternschnuppe', theme: G('#05051a', '#1b1b4a', 180),
  render(c) { c.el.style.padding = '0'; let s = ''; for (let i = 0; i < 60; i++) s += `<i style="left:${(i * 37) % 100}%;top:${(i * 53) % 100}%;animation-delay:-${(i % 7) * 0.6}s;transform:scale(${0.5 + (i % 4) * 0.3})"></i>`; c.el.innerHTML = `<div class="mw-stars">${s}<b></b></div>`; } });

add('snow', { name: 'Schneekugel', scat: 'spass', icon: '❄️', size: 'S', desc: 'Leise fallender Schnee für den Winter', theme: G('#3a5f8f', '#1b2d4a', 180),
  render(c) { c.el.style.padding = '0'; c.el.innerHTML = `<div class="mw-snow">${Array.from({ length: 40 }, (_, i) => `<i style="left:${(i * 29) % 100}%;animation-duration:${4 + (i % 5)}s;animation-delay:-${(i * 0.37) % 5}s;width:${2 + (i % 3)}px;height:${2 + (i % 3)}px"></i>`).join('')}<span>⛄</span></div>`; } });

// ===================== Gesundheit / Finanzen / Werkzeuge =====================
add('breathe', { name: 'Atemübung', scat: 'gesundheit', icon: '🫁', size: 'S', desc: 'Einatmen, halten, ausatmen: zur Ruhe kommen', theme: G('#30d158', '#0a8f6a', 160),
  render(c) { c.el.innerHTML = '<div class="mw-br"><i></i><b>Einatmen</b></div>'; const b = c.el.querySelector('b'); let t = 0;
    return loop(() => { const s = t++ % 12; b.textContent = s < 4 ? 'Einatmen' : s < 6 ? 'Halten' : s < 10 ? 'Ausatmen' : 'Pause'; }, 1000); } });

add('steps', { name: 'Schritte-Ziel', scat: 'gesundheit', icon: '👟', size: 'S', desc: 'Schritte vom Handy eintragen und Ziel verfolgen', theme: { ...BL, accent: '#30d158' },
  settings: [{ key: 'goal', label: 'Tagesziel', type: 'number', def: 10000 }],
  render(c) { const draw = () => { const g = +c.props.goal || 10000, n = c.data.day === todayKey() ? c.data.n || 0 : 0;
      c.el.innerHTML = `<div class="big">${ring(n / g, n.toLocaleString('de-CH'), 'von ' + g.toLocaleString('de-CH'), '#30d158')}<input class="mw-in" type="number" placeholder="Schritte eintragen"></div>`;
      const i = c.el.querySelector('input'); i.onchange = () => { c.save({ ...c.data, day: todayKey(), n: Math.max(0, +i.value || 0) }); draw(); }; };
    return loop(draw, 600000); } });

add('savings', { name: 'Sparziel', scat: 'finanzen', icon: '🐷', size: 'M', desc: 'Wie viel du schon für dein Ziel gespart hast', theme: G('#ff375f', '#ff9f0a', 150),
  settings: [{ key: 'title', label: 'Wofür?', type: 'text', def: 'Neues Velo' }, { key: 'goal', label: 'Ziel (CHF)', type: 'number', def: 800 }],
  render(c) { const draw = () => { const g = +c.props.goal || 800, n = c.data.n || 0;
      c.el.innerHTML = `<div class="mw-sav"><div class="h"><b>🐷 ${esc(c.props.title || 'Neues Velo')}</b><span>${Math.round(n / g * 100)}%</span></div><div class="amt">CHF ${n.toLocaleString('de-CH')} <small>von ${g.toLocaleString('de-CH')}</small></div><div class="bar"><i style="width:${Math.min(100, n / g * 100)}%"></i></div><div class="row"><button class="mw-b" data-v="-10">−10</button><button class="mw-b" data-v="10">+10</button><button class="mw-b" data-v="50">+50</button></div></div>`;
      c.el.querySelectorAll('[data-v]').forEach((b) => b.onclick = () => { c.save({ ...c.data, n: Math.max(0, n + +b.dataset.v) }); draw(); }); };
    draw(); } });

add('budget', { name: 'Taschengeld', scat: 'finanzen', icon: '💰', size: 'M', desc: 'Monatsbudget und was davon noch übrig ist', theme: { ...BL, accent: '#30d158' },
  settings: [{ key: 'budget', label: 'Budget pro Monat (CHF)', type: 'number', def: 100 }],
  render(c) { const draw = () => { const mk = todayKey().slice(0, 7), b = +c.props.budget || 100, sp = c.data.mk === mk ? c.data.sp || 0 : 0, left = b - sp;
      c.el.innerHTML = `<div class="mw-sav"><div class="h"><b>💰 ${DE_MON[new Date().getMonth()]}</b><span class="${left < 0 ? 'neg' : 'acc'}">noch CHF ${left.toLocaleString('de-CH')}</span></div><div class="bar"><i style="width:${Math.min(100, sp / b * 100)}%;background:${left < 0 ? '#ff453a' : 'var(--accent)'}"></i></div><div class="row"><input class="mw-in" type="number" placeholder="Ausgabe CHF"><button class="mw-b g">Abziehen</button></div></div>`;
      const i = c.el.querySelector('input'); c.el.querySelector('.g').onclick = () => { const v = +i.value; if (v) { c.save({ ...c.data, mk, sp: sp + v }); draw(); } }; };
    draw(); } });

add('convert', { name: 'Umrechner', scat: 'werkzeuge', icon: '📐', size: 'M', desc: 'Grad, Kilometer, Kilo und mehr umrechnen',
  render(c) { const U = { 'Grad °C → °F': (v) => v * 9 / 5 + 32, 'Grad °F → °C': (v) => (v - 32) * 5 / 9, 'km → Meilen': (v) => v / 1.609344, 'Meilen → km': (v) => v * 1.609344, 'kg → Pfund': (v) => v * 2.20462, 'cm → Zoll': (v) => v / 2.54, 'km/h → m/s': (v) => v / 3.6 };
    c.el.innerHTML = `<div class="mw-conv"><select>${Object.keys(U).map((k) => `<option>${k}</option>`).join('')}</select><div class="row"><input class="mw-in" type="number" value="20"><b>=</b><output></output></div></div>`;
    const s = c.el.querySelector('select'), i = c.el.querySelector('input'), o = c.el.querySelector('output'); const run = () => { const r = U[s.value](+i.value || 0); o.textContent = (Math.round(r * 100) / 100).toLocaleString('de-CH'); }; s.onchange = i.oninput = run; run(); } });

add('password', { name: 'Passwort-Generator', scat: 'werkzeuge', icon: '🔐', size: 'M', desc: 'Sichere Passwörter erzeugen und kopieren',
  render(c) { const gen = (n) => { const ch = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!?#%&*+-='; const a = new Uint32Array(n); crypto.getRandomValues(a); return Array.from(a, (x) => ch[x % ch.length]).join(''); };
    let len = 16; const draw = () => { const p = gen(len); c.el.innerHTML = `<div class="mw-pw"><code>${esc(p)}</code><div class="row"><input type="range" min="8" max="32" value="${len}"><span>${len}</span><button class="mw-b">↻</button><button class="mw-b g">Kopieren</button></div></div>`;
      const [r] = c.el.querySelectorAll('input'), [nb, cb] = c.el.querySelectorAll('button'); r.oninput = () => { len = +r.value; draw(); }; nb.onclick = draw; cb.onclick = () => { c.api.clipCopy(p); cb.textContent = '✓ Kopiert'; }; };
    draw(); } });

add('decide', { name: 'Entscheidungshilfe', scat: 'spass', icon: '🎱', size: 'S', desc: 'Stell eine Ja/Nein-Frage und klick auf die Kugel', theme: { ...BL, bg1: '#000000' },
  render(c) { const A = ['Ja!', 'Auf jeden Fall', 'Eher nicht', 'Frag später nochmal', 'Nein', 'Sieht gut aus', 'Ganz sicher', 'Lieber nicht', 'Vielleicht']; c.el.innerHTML = '<div class="big"><button class="mw-8">8</button><div class="l">Frage denken, dann klicken</div></div>';
    const b = c.el.querySelector('button'), l = c.el.querySelector('.l'); b.onclick = () => { b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin'); setTimeout(() => { b.textContent = '🔮'; l.textContent = pick(A, Math.floor(Math.random() * 1e6)); l.style.color = '#fff'; }, 500); }; } });

add('morse', { name: 'Wort des Tages', scat: 'spass', icon: '📖', size: 'M', desc: 'Jeden Tag ein englisches Wort mit Übersetzung', theme: WH,
  render(c) { const W = [['serendipity', 'glücklicher Zufall'], ['resilient', 'widerstandsfähig'], ['curious', 'neugierig'], ['brilliant', 'genial'], ['journey', 'Reise'], ['whisper', 'flüstern'], ['thrive', 'aufblühen'], ['genuine', 'echt, aufrichtig'], ['awkward', 'peinlich, unbeholfen'], ['breeze', 'leichte Brise'], ['delight', 'Freude'], ['wander', 'umherwandern']];
    return loop(() => { const [e, d] = pick(W, daySeed()); c.el.innerHTML = `<div class="mw-fact"><small class="acc">WORT DES TAGES</small><b style="font-size:max(18px,12cqmin)">${e}</b><span class="dim">${d}</span></div>`; }, 3600000); } });

add('countdownnew', { name: 'Silvester-Countdown', scat: 'planung', icon: '🎆', size: 'M', desc: 'Countdown bis zum neuen Jahr', theme: G('#1c1c1e', '#5e5ce6', 160),
  render(c) { return loop(() => { const n = new Date(), t = new Date(n.getFullYear() + 1, 0, 1), ms = t - n; const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1000) % 60;
    c.el.innerHTML = `<div class="big"><div class="l" style="color:inherit">🎆 Bis ${t.getFullYear()}</div><div class="mw-cd"><div><b>${d}</b><small>Tage</small></div><div><b>${h}</b><small>Std</small></div><div><b>${m}</b><small>Min</small></div><div><b>${s}</b><small>Sek</small></div></div></div>`; }, 1000); } });
})();
