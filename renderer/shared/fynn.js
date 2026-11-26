// ---------- Widgets von Fynn (aus "Desktop Widgets" übernommen) ----------
(() => {
/* Kleine SVG-Icons (selbst gezeichnet) */
const ICONS = {
  check: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-7"/></svg>',
  plus: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',
  x: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
  left: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3L5 8l5 5"/></svg>',
  right: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l5 5-5 5"/></svg>',
  pin: '<svg viewBox="0 0 12 12" fill="currentColor"><path d="M6 0.5a4 4 0 0 0-4 4c0 3 4 7 4 7s4-4 4-7a4 4 0 0 0-4-4zm0 5.6a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2z"/></svg>',
};

/* Wetter-Icons */
const W = (() => {
  const defs = `
    <defs>
      <radialGradient id="sunG" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#ffb800"/></radialGradient>
      <linearGradient id="cloudG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9dee8"/></linearGradient>
      <linearGradient id="darkCloudG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9ced8"/><stop offset="1" stop-color="#8e95a3"/></linearGradient>
      <linearGradient id="moonG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffbe6"/><stop offset="1" stop-color="#e8dca8"/></linearGradient>
    </defs>`;
  const sun = (cx = 32, cy = 32, r = 13) => {
    let rays = '';
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      const x1 = cx + Math.cos(a) * (r + 5), y1 = cy + Math.sin(a) * (r + 5);
      const x2 = cx + Math.cos(a) * (r + 10), y2 = cy + Math.sin(a) * (r + 10);
      rays += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#ffc400" stroke-width="3.2" stroke-linecap="round"/>`;
    }
    return rays + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#sunG)"/>`;
  };
  const moon = (cx = 30, cy = 28) => `<path d="M${cx + 10} ${cy - 14} a15 15 0 1 0 12 22 a12 12 0 1 1 -12 -22z" fill="url(#moonG)"/>`;
  const cloud = (dx = 0, dy = 0, s = 1, fill = 'url(#cloudG)') =>
    `<g transform="translate(${dx} ${dy}) scale(${s})"><path d="M18 50 h30 a10 10 0 0 0 0-20 a14 14 0 0 0-26-4 a11 11 0 0 0-4 24z" fill="${fill}" filter="drop-shadow(0 2px 3px rgba(0,0,0,.25))"/></g>`;
  const drops = (n = 3, color = '#5ac8fa') => {
    let s = '';
    for (let i = 0; i < n; i++) { const x = 24 + i * 9; s += `<line x1="${x}" y1="54" x2="${x - 3}" y2="61" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`; }
    return s;
  };
  const flakes = () => {
    let s = '';
    [24, 33, 42].forEach((x, i) => { s += `<circle cx="${x}" cy="${57 + (i % 2) * 3}" r="2.6" fill="#ffffff"/>`; });
    return s;
  };
  const bolt = '<path d="M34 48 l-7 10 h6 l-3 8 l10-12 h-6 l3-6z" fill="#ffd60a"/>';
  const fog = '<g stroke="#e5e5ea" stroke-width="3.2" stroke-linecap="round"><line x1="14" y1="40" x2="50" y2="40"/><line x1="10" y1="48" x2="46" y2="48"/><line x1="18" y1="56" x2="54" y2="56"/></g>';
  const svg = (body) => `<svg viewBox="0 0 64 64">${defs}${body}</svg>`;

  function icon(code, isDay = true) {
    const celestial = isDay ? sun(24, 24, 11) : moon(16, 20);
    if (code === 0) return svg(isDay ? sun() : moon(22, 26));
    if (code === 1) return svg(celestial + cloud(10, 6, 0.8));
    if (code === 2) return svg(celestial + cloud(4, 2, 0.95));
    if (code === 3) return svg(cloud(-6, -6, 0.8, 'url(#darkCloudG)') + cloud(2, 0, 0.95));
    if (code === 45 || code === 48) return svg(cloud(0, -10, 0.85) + fog);
    if (code >= 51 && code <= 57) return svg(cloud(0, -6) + drops(2));
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return svg(cloud(0, -6, 1, 'url(#darkCloudG)') + drops(3));
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return svg(cloud(0, -6) + flakes());
    if (code >= 95) return svg(cloud(0, -8, 1, 'url(#darkCloudG)') + bolt);
    return svg(cloud(0, 0));
  }

  function desc(code) {
    const m = {
      0: 'Klar', 1: 'Überwiegend klar', 2: 'Teilweise bewölkt', 3: 'Bedeckt',
      45: 'Nebel', 48: 'Raureifnebel',
      51: 'Leichter Nieselregen', 53: 'Nieselregen', 55: 'Starker Nieselregen', 56: 'Gefrierender Niesel', 57: 'Gefrierender Niesel',
      61: 'Leichter Regen', 63: 'Regen', 65: 'Starker Regen', 66: 'Gefrierender Regen', 67: 'Gefrierender Regen',
      71: 'Leichter Schneefall', 73: 'Schneefall', 75: 'Starker Schneefall', 77: 'Schneegriesel',
      80: 'Regenschauer', 81: 'Regenschauer', 82: 'Heftige Schauer', 85: 'Schneeschauer', 86: 'Schneeschauer',
      95: 'Gewitter', 96: 'Gewitter mit Hagel', 99: 'Gewitter mit Hagel',
    };
    return m[code] || '–';
  }
  return { icon, desc };
})();

const ICONS_FY = ICONS, WX = W;
const DOW_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const DOW_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const pad = (n) => String(n).padStart(2, '0');

function gcalMap(c) {
  const m = {};
  const list = [...((c.cache && c.cache.events) || []), ...(c.events || [])];
  for (const e of list) {
    if (!e || !isFinite(e.start)) continue;
    const s = new Date(e.start);
    const days = e.allDay ? Math.max(1, Math.min(60, Math.round(((e.end || e.start + 864e5) - e.start) / 864e5))) : 1;
    for (let i = 0; i < days; i++) {
      const d = new Date(s.getFullYear(), s.getMonth(), s.getDate() + i);
      const k = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      (m[k] = m[k] || []).push({ t: e.allDay ? '' : `${pad(s.getHours())}:${pad(s.getMinutes())}`, title: e.title || '', color: e.color });
    }
  }
  for (const k in m) m[k].sort((a, b) => (a.t || '').localeCompare(b.t || ''));
  return m;
}

function fyEnv(C, type) {
  const timers = [];
  const every = (ms, fn) => { timers.push(setInterval(fn, ms)); };
  const W_ = { type, options: { ...(C.props || {}), ...(C.data || {}) } };
  const S = { use24h: !use12(C.props.h12 || (C.settings && C.settings.h12) || 'auto'), name: C.props.name || '' };
  const GCAL = gcalMap(C);
  const saveOpts = (patch) => { Object.assign(W_.options, patch); Object.assign(C.data, patch); C.save(C.data); };
  const ICONS = ICONS_FY, W = WX;
  C.el.style.padding = '0';
  C.el.innerHTML = '<div class="fy-fit"><div class="fy widget"></div></div>';
  const fit = C.el.firstChild, root = fit.firstChild;
// =================== Digitaluhr ===================
const clock = {
  mount() {
    const o = W_.options;
    root.classList.add('style-' + (o.style || 'thin'));
    if (o.blink === false) root.classList.add('no-blink');
    root.innerHTML = `<div class="time"></div>${o.showDate !== false ? '<div class="date"></div>' : ''}${o.showGreeting !== false ? '<div class="greet"></div>' : ''}`;
    this.tick();
    every(1000, () => this.tick());
  },
  tick() {
    const o = W_.options;
    const d = new Date();
    let h = d.getHours(), ampm = '';
    if (!S.use24h) { ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; }
    const hh = S.use24h ? pad(h) : String(h);
    root.querySelector('.time').innerHTML =
      `${hh}<span class="colon">:</span>${pad(d.getMinutes())}` +
      (o.showSeconds ? `<span class="sec">${pad(d.getSeconds())}</span>` : '') +
      (ampm ? `<span class="ampm">${ampm}</span>` : '');
    const date = root.querySelector('.date');
    if (date) date.textContent = `${DOW_LONG[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
    const g = root.querySelector('.greet');
    if (g) {
      const hr = d.getHours();
      const word = hr < 5 ? 'Gute Nacht' : hr < 11 ? 'Guten Morgen' : hr < 17 ? 'Guten Tag' : hr < 22 ? 'Guten Abend' : 'Gute Nacht';
      g.textContent = `${word}${S.name ? ', ' + S.name : ''} 👋`;
    }
  },
};

// =================== Analoguhr ===================
const analog = {
  mount() {
    let ticks = '';
    for (let i = 0; i < 60; i++) {
      const a = i * 6 * Math.PI / 180, big = i % 5 === 0;
      const r1 = big ? 82 : 86, r2 = 90;
      ticks += `<line x1="${(100 + Math.sin(a) * r1).toFixed(2)}" y1="${(100 - Math.cos(a) * r1).toFixed(2)}" x2="${(100 + Math.sin(a) * r2).toFixed(2)}" y2="${(100 - Math.cos(a) * r2).toFixed(2)}" stroke="currentColor" stroke-opacity="${big ? .9 : .3}" stroke-width="${big ? 2.6 : 1.1}" stroke-linecap="round"/>`;
    }
    let nums = '';
    for (let i = 1; i <= 12; i++) {
      const a = i * 30 * Math.PI / 180;
      nums += `<text x="${(100 + Math.sin(a) * 68).toFixed(2)}" y="${(100 - Math.cos(a) * 68).toFixed(2)}" text-anchor="middle" dominant-baseline="central" font-size="16" font-weight="600" fill="currentColor">${i}</text>`;
    }
    root.innerHTML = `<svg viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-width="1"/>
      ${ticks}${nums}
      <g id="hh"><line x1="100" y1="106" x2="100" y2="56" stroke="currentColor" stroke-width="5.5" stroke-linecap="round"/></g>
      <g id="mm"><line x1="100" y1="108" x2="100" y2="30" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></g>
      <g id="ss" style="color:var(--accent)"><line x1="100" y1="118" x2="100" y2="22" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="100" cy="100" r="4.5" fill="currentColor"/></g>
      <circle cx="100" cy="100" r="1.8" fill="#fff"/></svg>`;
    const hh = root.querySelector('#hh'), mm = root.querySelector('#mm'), ss = root.querySelector('#ss');
    const tick = () => {
      const d = new Date();
      const s = d.getSeconds() + d.getMilliseconds() / 1000, m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
      hh.setAttribute('transform', `rotate(${(h * 30).toFixed(2)} 100 100)`);
      mm.setAttribute('transform', `rotate(${(m * 6).toFixed(2)} 100 100)`);
      ss.setAttribute('transform', `rotate(${(s * 6).toFixed(2)} 100 100)`);
    };
    tick();
    every(100, tick);
  },
};

// =================== Kalender ===================
const calendar = {
  view: null, sel: null, adding: false,
  mount() {
    const now = new Date();
    this.view = new Date(now.getFullYear(), now.getMonth(), 1);
    this.sel = ymd(now);
    this.adding = false;
    this.render();
    let lastDay = ymd(now);
    every(30000, () => { const t = ymd(new Date()); if (t !== lastDay) { lastDay = t; this.mount(); } });
  },
  events() { return W_.options.events || {}; },
  render() {
    const y = this.view.getFullYear(), m = this.view.getMonth();
    const today = ymd(new Date());
    const first = new Date(y, m, 1);
    const offset = (first.getDay() + 6) % 7; // Montag = 0
    const days = new Date(y, m + 1, 0).getDate();
    const ev = this.events();
    let cells = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => `<div class="cal-dow">${d}</div>`).join('');
    for (let i = 0; i < offset; i++) cells += '<div></div>';
    for (let d = 1; d <= days; d++) {
      const key = `${y}-${pad(m + 1)}-${pad(d)}`;
      const col = (offset + d - 1) % 7;
      const cls = ['cal-day'];
      if (col >= 5) cls.push('weekend');
      if (key === today) cls.push('today');
      if (key === this.sel) cls.push('sel');
      const dot = (ev[key] && ev[key].length) || (GCAL[key] && GCAL[key].length) ? '<span class="dot"></span>' : '';
      cells += `<button class="${cls.join(' ')}" data-k="${key}">${d}${dot}</button>`;
    }
    const showEvents = W_.options.showEvents !== false;
    root.innerHTML = `
      <div class="cal-head">
        <button class="cal-title nodrag" title="Heute">${MONTHS[m]} <span class="yr">${y}</span></button>
        <div class="cal-nav"><button class="icon-btn" data-nav="-1">${ICONS.left}</button><button class="icon-btn" data-nav="1">${ICONS.right}</button></div>
      </div>
      <div class="cal-grid">${cells}</div>
      ${showEvents ? this.eventsHtml() : ''}`;

    root.querySelector('.cal-title').onclick = () => { const n = new Date(); this.view = new Date(n.getFullYear(), n.getMonth(), 1); this.sel = ymd(n); this.render(); };
    root.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => { this.view = new Date(y, m + Number(b.dataset.nav), 1); this.render(); });
    root.querySelectorAll('.cal-day').forEach(b => {
      b.onclick = () => { this.sel = b.dataset.k; this.adding = false; this.render(); };
      b.ondblclick = () => { this.sel = b.dataset.k; this.adding = true; this.render(); };
    });
    if (showEvents) this.bindEvents();
  },
  eventsHtml() {
    const [yy, mm, dd] = this.sel.split('-').map(Number);
    const d = new Date(yy, mm - 1, dd);
    const label = this.sel === ymd(new Date()) ? 'Heute' : `${DOW_SHORT[d.getDay()]}., ${dd}. ${MONTHS[mm - 1].slice(0, 3)}.`;
    const list = this.events()[this.sel] || [];
    const g = (GCAL[this.sel] || []).map(e => `<div class="cal-ev g"><span class="bar"></span><span class="tm">${e.t || 'Ganztägig'}</span><span class="t">${esc(e.title)}</span></div>`).join('');
    const items = g + list.map((t, i) => `<div class="cal-ev"><span class="bar"></span><span class="t">${esc(t)}</span><button class="icon-btn" data-del="${i}" title="Löschen">${ICONS.x}</button></div>`).join('');
    return `<div class="cal-events">
      <div class="cal-events-head"><span>${label}</span><button class="icon-btn" data-add title="Termin hinzufügen">${ICONS.plus}</button></div>
      <div class="cal-list">${items || (this.adding ? '' : '<div class="cal-empty">Keine Termine</div>')}</div>
      ${this.adding ? '<div class="cal-add"><input class="inline" placeholder="z.B. 14:00 Zahnarzt" maxlength="80"></div>' : ''}
    </div>`;
  },
  bindEvents() {
    const add = root.querySelector('[data-add]');
    add.onclick = () => { this.adding = !this.adding; this.render(); };
    root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      const ev = Object.assign({}, this.events());
      ev[this.sel] = (ev[this.sel] || []).filter((_, i) => i !== Number(b.dataset.del));
      if (!ev[this.sel].length) delete ev[this.sel];
      saveOpts({ events: ev });
      this.render();
    });
    const input = root.querySelector('.cal-add input');
    if (input) {
      input.focus();
      input.onkeydown = (e) => {
        if (e.key === 'Escape') { this.adding = false; this.render(); }
        if (e.key === 'Enter' && input.value.trim()) {
          const ev = Object.assign({}, this.events());
          ev[this.sel] = [...(ev[this.sel] || []), input.value.trim()].sort((a, b) => a.localeCompare(b, 'de', { numeric: true }));
          saveOpts({ events: ev });
          this.adding = false; this.render();
        }
      };
      input.onblur = () => setTimeout(() => { if (this.adding && document.activeElement !== input) { this.adding = false; this.render(); } }, 150);
    }
  },
};

// =================== Wetter ===================
const weather = {
  mount() {
    const cached = W_.options.cache;
    if (cached) this.render(cached); else root.innerHTML = '<div class="w-msg">Wetter wird geladen…</div>';
    this.load();
    every(15 * 60 * 1000, () => this.load());
  },
  async load() {
    try {
      const loc = await resolveLoc(C, false);
      if (loc.err) { if (!W_.options.cache) root.innerHTML = '<div class="w-msg">' + (loc.err.reason === 'nocity' ? 'Ort in den Widget-Einstellungen wählen.' : 'Standort nicht gefunden.<br>Ort in den Widget-Einstellungen wählen.') + '</div>'; return; }
      const lat = loc.lat, lon = loc.lon; W_.options.city = W_.options.city || loc.name;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=6`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(r.status);
      const data = await r.json();
      data._city = loc.name || W_.options.city || '';
      data._at = Date.now();
      saveOpts({ cache: data });
      this.render(data);
    } catch (e) {
      if (!W_.options.cache) root.innerHTML = '<div class="w-msg">Keine Verbindung zum Wetterdienst.<br>Neuer Versuch in 15 Minuten.</div>';
    }
  },
  render(d) {
    const c = d.current, dl = d.daily;
    const code = c.weather_code, day = !!c.is_day;
    const kind = !day ? 'night' : code <= 1 ? 'clear' : code <= 3 || code === 45 || code === 48 ? 'cloudy' : (code >= 71 && code <= 77) || code === 85 || code === 86 ? 'snow' : 'rain';
    root.dataset.sky = kind; if (W_.options.sky !== false) { C.el.dataset.sky = kind; C.el.classList.add('fy-sky'); }
    const city = C.props.cityName || C.props.city || d._city || '';
    let days = '';
    for (let i = 1; i <= 5 && i < dl.time.length; i++) {
      const dt = new Date(dl.time[i] + 'T12:00');
      days += `<div class="w-day"><div class="d">${DOW_SHORT[dt.getDay()]}</div>${W.icon(dl.weather_code[i], true)}<div class="mx">${Math.round(dl.temperature_2m_max[i])}°</div><div class="mn">${Math.round(dl.temperature_2m_min[i])}°</div></div>`;
    }
    root.innerHTML = `
      <div class="w-top">
        <div class="big-icon">${W.icon(c.weather_code, !!c.is_day)}</div>
        <div>
          <div class="w-city">${esc(city)} ${ICONS.pin}</div>
          <div class="w-temp">${Math.round(c.temperature_2m)}°</div>
        </div>
      </div>
      <div class="w-desc">${W.desc(c.weather_code)}</div>
      <div class="w-hl">H:${Math.round(dl.temperature_2m_max[0])}° T:${Math.round(dl.temperature_2m_min[0])}°</div>
      <div class="w-days">${days}</div>`;
  },
};

// =================== Aufgaben ===================
const todos = {
  adding: false, editing: -1,
  mount() { this.adding = false; this.editing = -1; this.render(); },
  list() { return W_.options.todos || []; },
  save(list) { saveOpts({ todos: list }); this.render(); },
  render() {
    const list = this.list();
    const done = list.filter(t => t.done).length;
    const items = list.map((t, i) => this.editing === i
      ? `<div class="t-item"><span class="t-check"></span><input class="inline" data-edit="${i}" value="${esc(t.text)}" maxlength="120"></div>`
      : `<div class="t-item ${t.done ? 'done' : ''}"><button class="t-check" data-tog="${i}">${ICONS.check}</button><span class="t-text nodrag" data-i="${i}" title="Doppelklick zum Bearbeiten">${esc(t.text)}</span><button class="icon-btn" data-del="${i}" title="Löschen">${ICONS.x}</button></div>`).join('');
    root.innerHTML = `
      <div class="t-head"><span class="badge">${ICONS.check}</span><span class="title">${esc(W_.options.title || 'Meine Aufgaben')}</span><span class="count">${list.length - done}</span><button class="icon-btn" data-add title="Aufgabe hinzufügen">${ICONS.plus}</button></div>
      <div class="t-list">${items}${!list.length && !this.adding ? '<div class="t-empty">Keine Aufgaben – klicke auf +</div>' : ''}
      ${this.adding ? '<div class="t-item"><span class="t-check"></span><input class="inline" data-new placeholder="Neue Aufgabe…" maxlength="120"></div>' : ''}</div>
      ${list.length ? `<div class="t-foot"><span>${done} / ${list.length} erledigt</span><div class="t-progress"><div style="width:${list.length ? done / list.length * 100 : 0}%"></div></div>${done ? '<button class="icon-btn" data-clear title="Erledigte entfernen" style="width:auto;padding:0 6px;border-radius:6px;font-size:12px">Aufräumen</button>' : ''}</div>` : ''}`;

    root.querySelector('[data-add]').onclick = () => { this.adding = true; this.render(); };
    root.querySelectorAll('[data-tog]').forEach(b => b.onclick = () => {
      const l = this.list().map(x => ({ ...x })); l[b.dataset.tog].done = !l[b.dataset.tog].done; this.save(l);
    });
    root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => this.save(this.list().filter((_, i) => i !== Number(b.dataset.del))));
    root.querySelectorAll('.t-text').forEach(s => s.ondblclick = () => { this.editing = Number(s.dataset.i); this.render(); });
    const clr = root.querySelector('[data-clear]');
    if (clr) clr.onclick = () => this.save(this.list().filter(t => !t.done));

    const nw = root.querySelector('[data-new]');
    if (nw) {
      nw.focus();
      nw.onkeydown = (e) => {
        if (e.key === 'Escape') { this.adding = false; this.render(); }
        if (e.key === 'Enter') {
          const v = nw.value.trim();
          if (v) { this.adding = true; this.save([...this.list(), { text: v, done: false }]); }
          else { this.adding = false; this.render(); }
        }
      };
      nw.onblur = () => setTimeout(() => { if (this.adding && !root.contains(document.activeElement)) { this.adding = false; this.render(); } }, 150);
    }
    const ed = root.querySelector('[data-edit]');
    if (ed) {
      ed.focus(); ed.select();
      const commit = () => {
        const i = Number(ed.dataset.edit); const v = ed.value.trim();
        const l = this.list().map(x => ({ ...x }));
        if (v) l[i].text = v; else l.splice(i, 1);
        this.editing = -1; this.save(l);
      };
      ed.onkeydown = (e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { this.editing = -1; this.render(); } };
      ed.onblur = () => { if (this.editing !== -1) commit(); };
    }
  },
};

// =================== Notizen ===================
const notes = {
  mount() {
    root.innerHTML = `<div class="n-head"><span class="pin"></span>${esc(W_.options.title || 'Notizen')}</div><textarea placeholder="Schreib etwas…" spellcheck="false"></textarea>`;
    const ta = root.querySelector('textarea');
    ta.value = W_.options.text || '';
    let t;
    ta.oninput = () => { clearTimeout(t); t = setTimeout(() => saveOpts({ text: ta.value }), 400); };
  },
};

// =================== System ===================
const system = {
  mount() {
    root.innerHTML = `<div class="s-head">System</div>
      <div class="s-row"><div class="lbl">Prozessor <b id="cpu">–</b></div><div class="s-bar"><div id="cpub" style="width:0"></div></div></div>
      <div class="s-row"><div class="lbl">Arbeitsspeicher <b id="mem">–</b></div><div class="s-bar"><div id="memb" style="width:0"></div></div></div>
      <div class="s-foot" id="up"></div>`;
    const upd = async () => {
      const i = await C.api.fySys(); if (!root.isConnected) return;
      const used = i.memTotal - i.memFree;
      root.querySelector('#cpu').textContent = Math.round(i.cpu) + ' %';
      root.querySelector('#cpub').style.width = Math.min(100, i.cpu) + '%';
      root.querySelector('#mem').textContent = `${(used / 1073741824).toFixed(1)} / ${(i.memTotal / 1073741824).toFixed(0)} GB`;
      root.querySelector('#memb').style.width = (used / i.memTotal * 100) + '%';
      const h = Math.floor(i.uptime / 3600), m = Math.floor(i.uptime % 3600 / 60);
      root.querySelector('#up').textContent = `${i.host} · läuft seit ${h > 24 ? Math.floor(h / 24) + ' T ' + (h % 24) + ' Std' : h + ' Std ' + m + ' Min'}`;
    };
    upd();
    every(2000, upd);
  },
};

  const MODULES = { clock, analog, calendar, weather, todos, notes, system };
  root.className = 'fy widget ' + type + (type === 'clock' && !C.theme.opacity ? '' : ' glass');
  MODULES[type].mount();
  const doFit = () => {
    const bw = C.el.clientWidth, bh = C.el.clientHeight, nw = root.offsetWidth, nh = root.offsetHeight;
    if (!bw || !nw) return;
    const s = Math.min(bw / nw, bh / nh) * 0.98;
    root.style.transform = `translate(-50%,-50%) scale(${s})`;
  };
  let ro = null;
  if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(doFit); ro.observe(C.el); ro.observe(root); }
  doFit(); setTimeout(doFit, 60); setTimeout(doFit, 400);
  return () => { timers.forEach(clearInterval); if (ro) ro.disconnect(); };
}

const GLASS = { bg1: '#1c1c20', gradient: false, opacity: 0.45, text: '#ffffff', icon: '#ffffff', accent: '#0a84ff', btn: '#0a84ff', progress: '#0a84ff', border: '#ffffff', borderOpacity: 0.16, glass: true, acrylic: false, radius: 24 };
const LIGHTG = { ...GLASS, bg1: '#fafafc', opacity: 0.6, text: '#1c1c1e', icon: '#1c1c1e', border: '#ffffff', borderOpacity: 0.6 };
const SOLID = { ...GLASS, bg1: '#1c1c1e', opacity: 0.94 };
const NONE = { ...TH.none, accent: '#0a84ff' };
globalThis.FY_ZH = { src: 'city', city: 'Zürich', cityName: 'Zürich', lat: 47.3769, lon: 8.5417 };
const V2 = (name, size, props, theme) => ({ name, size, props: props || {}, theme: theme || null });
const H12 = { key: 'h12', label: 'set.h12', type: 'select', options: [['', 'set.default'], ['24', 'st.h24'], ['12', 'st.h12']], def: '' };
const DEFS = {
  clock: { name: 'Digitaluhr XL', icon: '⏰', theme: NONE, desc: 'Grosse, schöne Uhr mit Datum und persönlicher Begrüssung', size: [380, 220],
    settings: [{ key: 'style', label: 'Schrift', type: 'select', options: [['thin', 'Dünn'], ['bold', 'Fett'], ['mono', 'Digital'], ['neon', 'Neon']], def: 'thin' }, { key: 'name', label: 'Dein Name (Begrüssung)', type: 'text' }, { key: 'showSeconds', label: 'Sekunden anzeigen', type: 'bool', def: false }, { key: 'showDate', label: 'Datum anzeigen', type: 'bool', def: true }, { key: 'showGreeting', label: 'Begrüssung anzeigen', type: 'bool', def: true }, { key: 'blink', label: 'Doppelpunkt blinkt', type: 'bool', def: true }, H12],
    variants: [V2('Dünn, ohne Hintergrund', [380, 220], { style: 'thin' }, NONE), V2('Fett, ohne Hintergrund', [380, 220], { style: 'bold' }, NONE), V2('Neon', [380, 220], { style: 'neon' }, NONE), V2('Digital', [380, 220], { style: 'mono' }, NONE), V2('Dünn auf Glas', [380, 220], { style: 'thin' }, GLASS), V2('Nur Uhrzeit', [340, 150], { style: 'thin', showDate: false, showGreeting: false }, NONE)] },
  analog: { name: 'Analoguhr Glas', icon: '🕰️', theme: GLASS, desc: 'Klassische Uhr mit Zahlen auf Milchglas', size: [220, 220], settings: [],
    variants: [V2('Glas dunkel', [220, 220], {}, GLASS), V2('Glas hell', [220, 220], {}, LIGHTG), V2('Ohne Hintergrund', [220, 220], {}, NONE), V2('Gross', [320, 320], {}, GLASS)] },
  calendar: { name: 'Kalender mit Terminen', icon: '📆', theme: GLASS, desc: 'Monat mit Terminen, auch aus Google Kalender und iCloud', size: [360, 470],
    settings: [{ key: 'showEvents', label: 'Termine unter dem Kalender', type: 'bool', def: true }],
    variants: [V2('Mit Terminen', [360, 470], {}, GLASS), V2('Nur Monat', [360, 340], { showEvents: false }, GLASS), V2('Hell', [360, 470], {}, LIGHTG), V2('Dunkel', [360, 470], {}, SOLID)] },
  weather: { name: 'Wetter Himmel', icon: '🌤️', theme: { ...GLASS, opacity: 0 }, desc: 'Wetter mit Himmel-Farbverlauf wie auf dem iPhone, 5 Tage', size: [350, 260],
    settings: [{ key: 'src', label: 'set.src', type: 'select', options: [['auto', 'set.src.auto'], ['city', 'set.src.city']], def: 'auto' }, { key: 'city', label: 'set.city', type: 'city' }, { key: 'sky', label: 'Himmel-Farbverlauf', type: 'bool', def: true }],
    variants: [V2('Himmel', [350, 260], { ...FY_ZH }, { ...GLASS, opacity: 0 }), V2('Glas', [350, 260], { ...FY_ZH, sky: false }, GLASS), V2('Hell', [350, 260], { ...FY_ZH, sky: false }, LIGHTG), V2('Himmel, mein Standort', [350, 260], { src: 'auto' }, { ...GLASS, opacity: 0 })] },
  todos: { name: 'Aufgabenliste', icon: '☑️', theme: GLASS, desc: 'Aufgaben abhaken wie in «Erinnerungen», mit Fortschritt', size: [320, 300],
    settings: [{ key: 'title', label: 'Titel', type: 'text', def: 'Meine Aufgaben' }],
    variants: [V2('Glas', [320, 300], {}, GLASS), V2('Hell', [320, 300], {}, LIGHTG), V2('Dunkel', [320, 300], {}, SOLID)] },
  notes: { name: 'Notizzettel', icon: '🗒️', theme: GLASS, desc: 'Schnelle Notizen direkt auf dem Desktop', size: [310, 240],
    settings: [{ key: 'title', label: 'Titel', type: 'text', def: 'Notizen' }],
    variants: [V2('Glas', [310, 240], {}, GLASS), V2('Gelb', [310, 240], {}, { ...TH.yellow, radius: 24 }), V2('Hell', [310, 240], {}, LIGHTG)] },
  system: { name: 'Systemmonitor', icon: '🖥️', theme: GLASS, desc: 'Prozessor, Arbeitsspeicher und Laufzeit als Balken', size: [300, 180], settings: [],
    variants: [V2('Glas', [300, 180], {}, GLASS), V2('Dunkel', [300, 180], {}, SOLID)] },
};
for (const [t, d] of Object.entries(DEFS)) {
  reg('fy-' + t, { name: d.name, cat: 'fynn', icon: d.icon, size: 'M', theme: d.theme, desc: d.desc, settings: d.settings, variants: d.variants, by: 'fynn', render(c) { return fyEnv(c, t); } });
}
})();
