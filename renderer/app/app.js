let cfg, page = 'home', selId = null, cleanups = [];
const $ = (s, r = document) => r.querySelector(s);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
const debounce = (fn, ms = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const nameOf = (w) => w.name || WIDGETS[w.type]?.name || w.type;
const mergedTheme = (w) => ({ ...cfg.theme, ...(w?.theme || {}) });

const ICON = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  store: '<path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  apple: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/>',
  extra: '<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/>',
  custom: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l4 4"/>',
  widgets: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  tasks: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
  editor: '<path d="M12 20h9"/><path d="M16.5 3.5l4 4L8 20l-5 1 1-5z"/>',
  designs: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.2"/><circle cx="12" cy="7" r="1.2"/><circle cx="16" cy="10" r="1.2"/><path d="M12 21c-2 0-2-2 0-3 2-1 3-3 1-4"/>',
  layouts: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  iphone: '<rect x="7" y="2" width="10" height="20" rx="3"/><path d="M11 18h2"/>',
  tools: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'
};
const ico = (k) => `<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[k] || ''}</svg>`;
const NAV = [['', ['home', 'store', 'tools']], ['Meine Sachen', ['widgets', 'tasks', 'iphone']], ['Gestalten', ['designs', 'layouts', 'custom']], ['', ['settings']]];
const NAV_ON = { sw: 'store', apple: 'store', extra: 'store', fynn: 'store', editor: 'custom' };

const APPLE_COLORS = [['Blau (Standard)', '#0a84ff'], ['Violett', '#bf5af2'], ['Pink', '#ff375f'], ['Rot', '#ff453a'], ['Orange', '#ff9f0a'], ['Gelb', '#ffd60a'], ['Grün', '#30d158'], ['Graphit', '#8e8e93']];
function applyLang() { setLang((cfg.settings && cfg.settings.lang) || 'de'); }
function applyAppTheme() {
  const t = cfg.appTheme || { mode: 'dark', accent: '#0a84ff' }, r = document.documentElement, { r: R, g, b } = hexRgb(t.accent);
  r.dataset.mode = t.mode; r.style.setProperty('--a', t.accent); r.style.setProperty('--ai', (R * 299 + g * 587 + b * 114) / 1000 > 170 ? '#1d1d1f' : '#ffffff');
}
// Gäste-Modus: welche Seiten ohne PIN erlaubt sind
const isLocked = () => !!(cfg && cfg.runtime && cfg.runtime.locked);
const guestPages = () => { const a = (cfg.lock && cfg.lock.allow) || {}; return ['home', 'unlock', ...(a.tools !== false ? ['tools'] : []), ...(a.tasks !== false ? ['tasks'] : [])]; };
// Fensterknöpfe: Windows-Stil (Standard) oder Mac-Stil
const WB_ICONS = { y: '<svg viewBox="0 0 10 10"><path d="M0 5h10"/></svg>', g: '<svg viewBox="0 0 10 10"><rect x=".5" y=".5" width="9" height="9"/></svg>', gm: '<svg viewBox="0 0 10 10"><rect x=".5" y="2.5" width="7" height="7"/><path d="M2.5 2.5V.5h7v7h-2"/></svg>', r: '<svg viewBox="0 0 10 10"><path d="M0 0l10 10M10 0L0 10"/></svg>' };
function applyWinButtons() {
  const win = ((cfg && cfg.settings.winButtons) || 'win') === 'win', maxed = document.body.classList.contains('maxed');
  document.body.classList.toggle('wb-win', win);
  const set = (k, html, title) => { const b = document.getElementById('tl-' + k); if (b) { b.innerHTML = html; b.title = title; } };
  if (win) { set('y', WB_ICONS.y, 'Minimieren'); set('g', maxed ? WB_ICONS.gm : WB_ICONS.g, maxed ? 'Verkleinern' : 'Maximieren'); set('r', WB_ICONS.r, 'Schliessen (Jafy Widgets läuft im Hintergrund weiter)'); }
  else { set('r', '<i>×</i>', 'Schliessen'); set('y', '<i>−</i>', 'Minimieren'); set('g', '<i>+</i>', 'Vergrössern (Alt: Vollbild)'); }
  let ub = document.getElementById('tb-up'); const up = cfg && cfg.update && cfg.update.available;
  if (up && !ub) { ub = h('<button id="tb-up" title="Update installieren">⬆️ Update verfügbar</button>'); ub.onclick = () => { pkState.setTab = 'update'; pkState.setQ = ''; go(isLocked() ? 'unlock' : 'settings'); }; document.getElementById('tb').append(ub); }
  if (ub) ub.hidden = !up;
}
function go(p) {
  if (cfg) { applyAppTheme(); applyLang(); applyWinButtons(); }
  if (p === 'updates') { pkState.setTab = 'update'; pkState.setQ = ''; p = 'settings'; }
  if (/^tool:/.test(p)) { pkState.tool = p.slice(5); p = 'tools'; }
  let [k, id] = p.split(':');
  if (isLocked() && !guestPages().includes(k)) { if (k !== 'home') pkState.afterUnlock = p; k = 'unlock'; id = null; }
  if (!isLocked() && k === 'unlock') k = 'home';
  page = k; if (id) { selId = id; api.patch('ui', { ...(cfg.ui || {}), selId: id }); }
  cleanups.forEach((f) => { try { f && f(); } catch {} }); cleanups = [];
  const L = isLocked();
  $('#nav').innerHTML = L ? '<div class="guest-b">👥 Gäste-Modus</div>' : `<button class="addw" id="addw">${t('nav.add')}</button>`;
  if (!L) $('#addw').onclick = () => go('store');
  const cur = NAV_ON[page] || page;
  const NV = L ? [['', guestPages().filter((x) => x !== 'unlock')], ['', ['unlock']]] : NAV;
  NV.forEach(([title, keys], gi) => { if (gi === NV.length - 1) $('#nav').append(h('<div class="nav-sp"></div>')); else if (title) $('#nav').append(h(`<div class="nav-t">${title}</div>`));
    keys.forEach((key) => { const a = h(`<a class="${key === cur ? 'on' : ''}">${ico(key)}<span>${t('nav.' + key)}</span>${key === 'settings' && cfg.update && cfg.update.available ? '<em class="bdg">1</em>' : ''}</a>`); a.onclick = () => go(key); $('#nav').append(a); }); });
  const m = $('#main'); m.innerHTML = ''; m.scrollTop = 0; m.classList.remove('fade'); void m.offsetWidth; m.classList.add('fade');
  try { (PAGES[page] || PAGES.home)(m); } catch (e) { m.innerHTML = `<h2>Fehler</h2><div class="hint">${esc(e.message)}</div>`; }
}

function preview(type, w, hh, theme, props = {}, data = {}, maxW = 240, maxH = 170, sink = cleanups) {
  const sc = Math.min(maxW / w, maxH / hh, 1);
  const wrap = h(`<div class="pvw" style="width:${Math.round(w * sc)}px;height:${Math.round(hh * sc)}px"><div class="pvi" style="width:${w}px;height:${hh}px;transform:scale(${sc})"><div class="wcard"><div class="wbody"></div></div></div></div>`);
  const box = wrap.firstChild; applyTheme(box.firstChild, theme, cfg.runtime);
  const def = WIDGETS[type];
  try { sink.push(def.render.call(def, { el: box.firstChild.firstChild, w: {}, props, data: structuredClone(data), cache: cfg.cache || {}, events: [...(cfg.events || []), ...(cfg.gcalEvents || [])], theme, settings: cfg.settings, runtime: cfg.runtime, onRefresh() {}, tasks: cfg.tasks || [], onTasks() {}, save() {}, api })); } catch (e) { box.firstChild.firstChild.textContent = e.message; }
  return wrap;
}

// ---------- Farbwähler & Theme-Formular ----------
function colorField(val, on, opt = {}) {
  const el = h('<div class="cfw"><div class="cf"><input type="color"><input type="text" class="hx" maxlength="7"><input type="text" class="rg" title="R,G,B"></div></div>');
  const [c, hx, rg] = el.querySelectorAll('input');
  const set = (v) => { c.value = v; hx.value = v; const { r, g, b } = hexRgb(v); rg.value = `${r},${g},${b}`; };
  set(/^#[0-9a-f]{6}$/i.test(val) ? val : '#000000');
  c.oninput = () => { set(c.value); on(c.value); };
  hx.onchange = () => { if (/^#?[0-9a-f]{6}$/i.test(hx.value)) { const v = '#' + hx.value.replace('#', ''); set(v); on(v); } else set(c.value); };
  rg.onchange = () => { const p = rg.value.split(/[ ,;]+/).map(Number); if (p.length === 3 && p.every((n) => n >= 0 && n <= 255)) { const v = toHex(...p); set(v); on(v); } else set(c.value); };
  if (opt.swatches !== false) { const sw = h('<div class="swr"></div>'); PALETTE.forEach(([n, v]) => { const d = h(`<i title="${n}" style="background:${v}"></i>`); d.onclick = () => { set(v); on(v); }; sw.append(d); }); el.append(sw); }
  if (opt.reset) { const r = h('<button class="rs" title="Zurücksetzen (folgt der Textfarbe)">↺</button>'); r.onclick = () => opt.reset(); el.firstChild.append(r); }
  return el;
}
function themeForm(t, onChange, opt = {}) {
  const fire = debounce(() => onChange(t));
  const root = h('<div></div>'), form = h('<div class="f"></div>');
  const draw = () => {
    form.innerHTML = '';
    const head = (x) => form.append(h(`<h4 class="fh">${x}</h4>`));
    const row = (label, el) => { form.append(h(`<label>${label}</label>`), el); };
    const col = (label, key, clearable) => row(label, colorField(t[key] || (key === 'todayColor' ? '#ff3b30' : t.text), (v) => { t[key] = v; fire(); }, clearable ? { reset: () => { delete t[key]; fire(); draw(); } } : {}));
    const rng = (label, key, min, max, step) => { const dv = key === 'fontSizeScale' ? 1 : 0; const i = h(`<input type="range" min="${min}" max="${max}" step="${step}" value="${t[key] ?? dv}">`); const v = h(`<span> ${t[key] ?? dv}</span>`); i.oninput = () => { t[key] = +i.value; if (key === 'blur') t.acrylic = +i.value > 0; v.textContent = ' ' + i.value; fire(); }; const w = h('<div class="row"></div>'); w.append(i, v); row(label, w); };
    const chk = (label, key, def) => { const i = h('<input type="checkbox">'); i.checked = t[key] ?? def; i.onchange = () => { t[key] = i.checked; fire(); draw(); }; row(label, i); };
    head('Hintergrund');
    const bs = h('<div class="row"></div>'); Object.entries(BG_STYLES).forEach(([n, p]) => { const b = h(`<button>${n}</button>`); b.onclick = () => { Object.assign(t, p); fire(); draw(); }; bs.append(b); }); bs.style.gridColumn = '1/-1'; form.append(bs);
    col('Eigene Farbe', 'bg1'); chk('Farbverlauf', 'gradient'); if (t.gradient) { col('Verlauf-Endfarbe', 'bg2'); rng('Verlaufswinkel', 'angle', 0, 360, 5); }
    rng('Transparenz (Deckkraft)', 'opacity', 0, 1, 0.01);
    head('Effekte'); chk('Milchglas (Windows Acrylic)', 'acrylic', false); rng('Blur (0 = aus; Windows bestimmt die Stärke)', 'blur', 0, 30, 1); chk('Glanzkante (Glas-Rand)', 'glass', true);
    head('Farben der Inhalte');
    col('Textfarbe', 'text'); col('Zweite Textfarbe (gedämpft)', 'text2Color', true); col('Zahlen', 'numColor', true); col('Symbole', 'icon'); col('Temperatur', 'tempColor', true);
    col('Kalender: normale Tage', 'dayColor', true); col('Kalender: heutiger Tag', 'todayColor', true); col('Akzentfarbe', 'accent'); col('Buttons', 'btn'); col('Fortschrittsanzeige', 'progress');
    head('Schrift'); rng('Schriftgrösse (Faktor)', 'fontSizeScale', 0.8, 1.4, 0.05); const fw = h('<select></select>'); [['thin', 'Dünn'], ['light', 'Leicht'], ['regular', 'Normal'], ['medium', 'Mittel']].forEach(([v, l]) => fw.append(new Option(l, v, false, (t.fontWeight || 'light') === v))); fw.onchange = () => { t.fontWeight = fw.value; fire(); }; row('Schriftstärke (Zahlen)', fw);
    head('Rahmen, Form und Abstand'); col('Rahmenfarbe', 'border'); rng('Rahmen-Transparenz', 'borderOpacity', 0, 1, 0.01); rng('Eckenradius', 'radius', 0, 60, 1);
    rng('Schatten (Tiefe)', 'shadow', 0, 100, 1); rng('Innenabstand (Faktor)', 'padding', 0.5, 2, 0.05); rng('Widget-Deckkraft (gesamt)', 'widgetOpacity', 0.1, 1, 0.05);
    const al = h('<select></select>'); [['left', 'Links'], ['center', 'Zentriert'], ['right', 'Rechts']].forEach(([v, l]) => al.append(new Option(l, v, false, (t.align || 'left') === v))); al.onchange = () => { t.align = al.value; fire(); }; row('Ausrichtung', al);
    head('Hintergrundbild');
    const bi = h('<div class="row"><button>Bild wählen …</button><button class="dg">Entfernen</button></div>'); bi.firstChild.onclick = async () => { const u = await api.pickImage(); if (u) { t.bgImage = u; t.bgImageOpacity = t.bgImageOpacity ?? 0.6; fire(); draw(); } }; bi.lastChild.onclick = () => { delete t.bgImage; fire(); draw(); }; row('Bild', bi);
    if (t.bgImage) { rng('Bild-Deckkraft', 'bgImageOpacity', 0, 1, 0.05); rng('Bild-Unschärfe', 'bgImageBlur', 0, 30, 1); }
    const f = h('<select></select>'); Object.entries(FONTS).forEach(([n, v]) => f.append(new Option(n, v, false, t.font === v))); f.onchange = () => { t.font = f.value; fire(); }; row('Schriftart', f);
  };
  const pf = h('<div class="row" style="margin-bottom:12px"></div>');
  const bReset = h('<button title="Setzt dieses Design auf die ursprüngliche Vorlage zurück">↺ Zurücksetzen</button>'); bReset.onclick = () => { if (!opt.original) return; Object.keys(t).forEach((k) => delete t[k]); Object.assign(t, structuredClone(opt.original)); fire(); draw(); }; if (opt.original) pf.append(bReset);
  const bExp = h('<button>Profil exportieren</button>'); bExp.onclick = async () => { await api.saveJson('widget-design-profil.json', { format: 'widget-platform-theme', theme: t }); };
  const bImp = h('<button>Profil importieren</button>'); bImp.onclick = async () => { const r = await api.openJson(); if (r.ok && r.data && r.data.format === 'widget-platform-theme' && r.data.theme) { Object.keys(t).forEach((k) => delete t[k]); Object.assign(t, r.data.theme); fire(); draw(); } else if (!r.canceled) alert('Diese Datei ist kein Design-Profil.'); };
  pf.append(bExp, bImp);
  const pr = h('<div><b>Komplett-Vorlagen</b><div class="row" style="margin:8px 0 14px"></div></div>');
  Object.entries(PRESETS).forEach(([n, p]) => { const b = h(`<button>${n}</button>`); b.onclick = () => { Object.assign(t, p); ['numColor', 'tempColor', 'dayColor', 'todayColor'].forEach((k) => delete t[k]); fire(); draw(); }; pr.lastChild.append(b); });
  root.append(pf, pr, form); draw(); return root;
}

function themeSection(w, onAfter) {
  const box = h('<div></div>'); const chk = h('<label class="row"><input type="checkbox"> Eigenes Design für dieses Widget (überschreibt global)</label>');
  const cb = chk.firstChild; cb.checked = !!w.theme; const holder = h('<div></div>');
  const draw = () => { holder.innerHTML = ''; if (w.theme) holder.append(themeForm(w.theme, (t) => { w.theme = t; api.updateWidget(w.id, { theme: t }); onAfter?.(); }, { original: { ...cfg.theme, ...(WIDGETS[w.type] && WIDGETS[w.type].theme || {}) } })); };
  cb.onchange = () => { w.theme = cb.checked ? { ...cfg.theme } : null; api.updateWidget(w.id, { theme: w.theme }); draw(); onAfter?.(); };
  draw(); box.append(chk, holder); return box;
}

// ---------- Seiten ----------
function renderTaskLists() {
  const box = $('#tl'); if (!box) return; const tab = pkState.taskTab || 'active', ts = cfg.tasks || [], today = new Date().toISOString().slice(0, 10);
  const when = (ms) => new Date(ms).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const due = (t) => t.due ? `<span class="pill ${t.due < today && !t.done ? 'no' : ''}">${new Date(t.due + 'T12:00').toLocaleDateString('de-CH')}</span>` : '';
  if (tab === 'log') {
    const lg = [...(cfg.taskLog || [])].reverse();
    box.innerHTML = `<div class="row" style="margin-bottom:10px"><b style="flex:1">${lg.length} Einträge</b>${lg.length ? '<button class="dg" id="cl">Verlauf leeren</button>' : ''}</div>` + (lg.length ? lg.map((l) => `<div class="tk"><span class="dim" style="width:140px">${when(l.at)}</span><span class="pill">${esc(l.action)}</span><span style="flex:1">${esc(l.title)}</span></div>`).join('') : '<div class="dim">Noch keine Einträge.</div>');
    if ($('#cl')) $('#cl').onclick = async () => { if (confirm('Den gesamten Verlauf löschen? Die Aufgaben selbst bleiben erhalten.')) await api.taskClearLog(); };
    return;
  }
  const list = ts.filter((t) => tab === 'done' ? t.done : !t.done).sort((a, b) => tab === 'done' ? b.doneAt - a.doneAt : (b.prio - a.prio) || (a.due || '9').localeCompare(b.due || '9') || a.createdAt - b.createdAt);
  box.innerHTML = list.length ? list.map((t) => `<div class="tk" data-id="${t.id}"><span class="cb ${t.done ? 'on' : ''}" title="${t.done ? 'Wiederherstellen' : 'Als erledigt markieren'}">${t.done ? '✓' : ''}</span><span class="tx" title="Doppelklick zum Bearbeiten">${esc(t.t)}</span>${t.list ? `<span class="pill">${esc(t.list)}</span>` : ''}${t.rep ? '<span class="pill">↻</span>' : ''}${due(t)}${t.prio ? `<span class="p">${'!'.repeat(t.prio)}</span>` : ''}${t.done ? `<span class="dim" style="font-size:12px">${when(t.doneAt)}</span><button class="rs2">Wiederherstellen</button>` : ''}<button class="dg del">Endgültig löschen</button></div>`).join('') : `<div class="dim">${tab === 'done' ? 'Noch keine erledigten Aufgaben.' : 'Keine aktiven Aufgaben.'}</div>`;
  box.querySelectorAll('.tk').forEach((r) => { const id = r.dataset.id, t = ts.find((x) => x.id === id);
    r.querySelector('.cb').onclick = () => api.taskDone(id, !t.done); const rs = r.querySelector('.rs2'); if (rs) rs.onclick = () => api.taskDone(id, false);
    r.querySelector('.del').onclick = () => { if (confirm(`«${t.t}» endgültig löschen? Das kann nicht rückgängig gemacht werden.`)) api.taskRemove(id); };
    r.querySelector('.tx').ondblclick = (e) => { const x = e.target; x.contentEditable = 'plaintext-only'; x.focus(); x.onblur = () => { x.contentEditable = 'false'; const v = x.textContent.trim(); if (v && v !== t.t) api.taskUpdate(id, { t: v }); }; x.onkeydown = (k) => { if (k.key === 'Enter') { k.preventDefault(); x.blur(); } }; };
  });
}
async function createExampleProfiles() {
  const W = Math.min(screen.availWidth || 1600, 2600), H = screen.availHeight || 900;
  const specs = [
    ['Minimal', [['clock-analog', 'S', 40, 60], ['music', 'M', 40, 260]], { enabled: true, size: 44, magnify: 1.5, theme: { preset: 'Transparent', opacity: 0, borderOpacity: 0, shadow: 0 } }],
    ['Produktivität', [['calendar', 'S', 40, 60], ['reminders', 'L', 240, 60], ['weather', 'M', 620, 60], ['system', 'M', 620, 250]], { enabled: true, size: 52, magnify: 1.6 }],
    ['Unterhaltung', [['music', 'L', 40, 60], ['photos', 'L', 420, 60]], { enabled: true, size: 64, magnify: 1.9 }]
  ];
  for (const [name, list, dock] of specs) {
    const cur = (await api.getCfg()).widgets; for (const w of cur) await api.updateWidget(w.id, { visible: false });
    for (const [type, size, x, y] of list) {
      const [w, h] = SIZES[size]; let inst = (await api.getCfg()).widgets.find((q) => q.type === type);
      if (!inst) inst = await api.addWidget({ type, w, h, theme: WIDGETS[type].theme ? { ...cfg.theme, ...WIDGETS[type].theme } : null });
      await api.updateWidget(inst.id, { visible: true, x: Math.min(x, W - w - 20), y: Math.min(y, H - h - 20), w, h });
    }
    const base = (await api.getCfg()).dock; await api.patch('dock', { ...base, ...dock, theme: { ...base.theme, ...(dock.theme || {}) } }); await api.saveLayout(name);
  }
  await api.applyLayout('Minimal');
}
function layTabs() { const lt = $('#lt'); if (!lt) return; [['layouts', 'Layouts und Profile'], ['dock', 'Dock']].forEach(([k, l]) => { const b = h(`<button class="${(pkState.layTab || 'layouts') === k ? 'sel' : ''}">${l}</button>`); b.onclick = () => { pkState.layTab = k; go('layouts'); }; lt.append(b); }); }
const PAGES = {
  apple: (m) => picker(m, 'apple'),
  extra: (m) => picker(m, 'extra'),
  custom(m) {
    const list = cfg.widgets.filter((w) => w.type === 'custom');
    m.innerHTML = '<h2>Eigene Widgets</h2><p class="sub">Baue Widgets aus Blöcken: Titel, Text, Checkliste, Fortschritt, Countdown.</p><div class="row"><button class="p" id="new">+ Neues eigenes Widget</button></div><h3>Deine Widgets</h3><div class="card list" id="l"></div>';
    $('#new').onclick = async () => { const w = await api.addWidget({ type: 'custom', name: 'Eigenes Widget', props: { blocks: structuredClone(DEFAULT_BLOCKS) } }); go('editor:' + w.id); };
    const l = $('#l'); if (!list.length) l.textContent = 'Noch keine eigenen Widgets.';
    list.forEach((w) => { const r = h(`<div class="it"><b style="flex:1">${esc(nameOf(w))}</b><button>Bearbeiten</button><button>Duplizieren</button><button class="dg">Löschen</button></div>`); const [e, d, x] = r.querySelectorAll('button');
      e.onclick = () => go('editor:' + w.id); d.onclick = async () => { await api.duplicateWidget(w.id); go('custom'); }; x.onclick = async () => { await api.removeWidget(w.id); go('custom'); }; l.append(r); });
  },
  widgets(m) {
    m.innerHTML = '<div class="hm-h"><div><h2>Meine Widgets</h2><p class="sub" style="margin:0">Wähle links ein Widget, um es einzustellen.</p></div><button class="p" id="wadd">＋ Widget hinzufügen</button></div><div class="two wtwo"><div class="card list" id="l"></div><div id="p"></div></div>';
    $('#wadd').onclick = () => go('store');
    const l = $('#l'); if (!cfg.widgets.length) { $('.two', m).outerHTML = '<div class="card" style="text-align:center;padding:50px 20px"><div style="font-size:40px">🧩</div><h3>Noch keine Widgets</h3><p class="sub">Im Widget Store findest du über 100 Widgets.</p><button class="p" id="wgo">Zum Widget Store</button></div>'; $('#wgo').onclick = () => go('store'); return; }
    if (!cfg.widgets.find((w) => w.id === selId)) selId = cfg.widgets[0]?.id;
    cfg.widgets.forEach((w) => { const r = h(`<div class="it ${w.id === selId ? 'on' : ''}"><span>${WIDGETS[w.type]?.icon || '▫️'}</span><div style="flex:1"><b>${esc(nameOf(w))}</b><small>${w.visible === false ? 'Ausgeblendet' : 'Sichtbar'}${w.locked ? ' · gesperrt' : ''}${w.onTop ? ' · vorne' : ''}</small></div></div>`); if (w.visible === false) r.classList.add('off'); r.onclick = () => { selId = w.id; go('widgets'); }; l.append(r); });
    const w = cfg.widgets.find((x) => x.id === selId); if (w) widgetPanel($('#p'), w);
  },
  tasks(m) {
    const tab = pkState.taskTab || 'active';
    m.innerHTML = `<h2>Aufgaben</h2><p class="sub">Alle Aufgaben sind dauerhaft gespeichert und mit den Widgets synchron. Erledigte Aufgaben werden nie automatisch gelöscht.</p>
      <div class="row" style="margin-bottom:14px" id="tt"></div><div id="tadd"></div><div class="card" id="tl"></div>`;
    [['active', 'Aktiv'], ['done', 'Erledigt'], ['log', 'Verlauf']].forEach(([k, l]) => { const b = h(`<button class="${k === tab ? 'sel' : ''}">${l}</button>`); b.onclick = () => { pkState.taskTab = k; go('tasks'); }; $('#tt').append(b); });
    if (tab === 'active') {
      const f = h(`<form class="card row" id="tf"><input type="text" id="tn" placeholder="Neue Aufgabe, z. B. Andrea helfen" style="flex:1;min-width:220px"><input type="date" id="td"><select id="tp"><option value="0">Priorität –</option><option value="1">!</option><option value="2">!!</option><option value="3">!!!</option></select><select id="tr"><option value="">einmalig</option><option value="d">täglich</option><option value="w">wöchentlich</option></select><input type="text" id="tli" placeholder="Liste (optional)" style="width:130px"><button class="p">Hinzufügen</button></form>`);
      f.onsubmit = async (e) => { e.preventDefault(); const t = $('#tn').value.trim(); if (!t) return; await api.taskAdd({ t, due: $('#td').value, prio: +$('#tp').value, rep: $('#tr').value, list: $('#tli').value.trim() }); f.reset(); $('#tn').focus(); };
      $('#tadd').append(f);
    }
    renderTaskLists();
  },
  editor(m) {
    const customs = cfg.widgets.filter((w) => w.type === 'custom');
    m.innerHTML = '<button class="st-back" id="eb0">‹ Eigene Widgets</button><h2>Widget-Editor</h2><p class="sub">Inhalte, Grösse und Farben deines eigenen Widgets.</p>'; $('#eb0').onclick = () => go('custom');
    if (!customs.length) { const b = h('<button class="p">+ Erstes eigenes Widget erstellen</button>'); b.onclick = async () => { const w = await api.addWidget({ type: 'custom', name: 'Eigenes Widget', props: { blocks: structuredClone(DEFAULT_BLOCKS) } }); go('editor:' + w.id); }; m.append(b); return; }
    let w = customs.find((x) => x.id === selId) || customs[0]; selId = w.id;
    const sel = h('<select></select>'); customs.forEach((c) => sel.append(new Option(nameOf(c), c.id, false, c.id === w.id))); sel.onchange = () => go('editor:' + sel.value);
    const nm = h(`<input type="text" value="${esc(w.name || '')}" placeholder="Name">`); nm.onchange = () => api.updateWidget(w.id, { name: nm.value });
    const bar = h('<div class="row" style="margin-bottom:14px"></div>'); bar.append(sel, nm); m.append(bar);
    const two = h('<div class="two" style="grid-template-columns:1fr 420px"></div>'); const left = h('<div class="card"></div>'), right = h('<div></div>'); two.append(left, right); m.append(two);
    w.props = w.props || {}; w.props.blocks = w.props.blocks || structuredClone(DEFAULT_BLOCKS);
    const stage = h('<div class="stage"></div>'); right.append(stage);
    const drawPrev = () => { cleanups.forEach((f) => f && f()); cleanups = []; stage.innerHTML = ''; stage.append(preview('custom', w.w, w.h, mergedTheme(w), w.props, w.data || {}, 380, 300)); };
    const saveBlocks = debounce(() => { api.updateWidget(w.id, { props: w.props }); drawPrev(); }, 200);
    const drawBlocks = () => {
      left.innerHTML = '<b>Inhalte</b>'; const bl = w.props.blocks;
      bl.forEach((b, i) => {
        const r = h(`<div class="blk"><b>${BLOCK_TYPES[b.type]}</b><div class="bf"></div><div class="row"><button>↑</button><button>↓</button><button class="dg">✕</button></div></div>`); const bf = $('.bf', r);
        const inp = (k, ph, tag = 'input') => { const e = h(tag === 'input' ? `<input type="text" placeholder="${ph}">` : `<textarea placeholder="${ph}"></textarea>`); e.value = b[k] ?? ''; e.oninput = () => { b[k] = e.value; saveBlocks(); }; bf.append(e); };
        if (b.type === 'title') inp('value', 'Titel'); if (b.type === 'text') inp('value', 'Text', 'ta'); if (b.type === 'list') inp('items', 'Ein Punkt pro Zeile', 'ta');
        if (b.type === 'progress') { inp('label', 'Bezeichnung'); const g = h(`<input type="range" min="0" max="100" value="${b.value ?? 0}">`); g.oninput = () => { b.value = +g.value; saveBlocks(); }; bf.append(g); }
        if (b.type === 'countdown') { inp('label', 'Ereignis'); const d = h('<input type="date">'); d.value = b.date || ''; d.onchange = () => { b.date = d.value; saveBlocks(); }; bf.append(d); }
        const [up, dn, del] = r.querySelectorAll('button');
        up.onclick = () => { if (i) { [bl[i - 1], bl[i]] = [bl[i], bl[i - 1]]; saveBlocks(); drawBlocks(); } }; dn.onclick = () => { if (i < bl.length - 1) { [bl[i + 1], bl[i]] = [bl[i], bl[i + 1]]; saveBlocks(); drawBlocks(); } };
        del.onclick = () => { bl.splice(i, 1); saveBlocks(); drawBlocks(); }; left.append(r);
      });
      const add = h('<div class="row" style="margin-top:12px"><select></select><button class="p">+ Block hinzufügen</button></div>'); Object.entries(BLOCK_TYPES).forEach(([k, v]) => $('select', add).append(new Option(v, k)));
      $('button', add).onclick = () => { w.props.blocks.push({ type: $('select', add).value, value: '', label: '', items: '' }); saveBlocks(); drawBlocks(); }; left.append(add);
    };
    drawBlocks(); drawPrev();
    const sz = h(`<div class="card"><b>Grösse</b><div class="row" style="margin-top:8px"></div></div>`); const sr = $('.row', sz);
    WP_SIZES.of(w.type).forEach((k) => { const b = h(`<button title="${SIZES[k].join(' × ')}">${SIZE_NAMES[k]}</button>`); b.onclick = () => { [w.w, w.h] = SIZES[k]; api.updateWidget(w.id, { w: w.w, h: w.h }); wi.value = w.w; hi.value = w.h; drawPrev(); }; sr.append(b); });
    const wi = h(`<input type="number" style="width:80px" value="${w.w}">`), hi = h(`<input type="number" style="width:80px" value="${w.h}">`);
    const ch = () => { w.w = Math.max(100, +wi.value); w.h = Math.max(60, +hi.value); api.updateWidget(w.id, { w: w.w, h: w.h }); drawPrev(); }; wi.onchange = hi.onchange = ch; sr.append(wi, '×', hi);
    const th = h('<div class="card"></div>'); th.append(themeSection(w, drawPrev)); right.append(sz, th);
  },
  designs(m) {
    m.innerHTML = '<h2>Designs und Farben</h2><p class="sub">Globales Design für alle Widgets. Einzelne Widgets können es in „Meine Widgets“ überschreiben.</p><div class="two" style="grid-template-columns:1fr 440px"><div class="card" id="f"></div><div><div class="stage" id="st" style="flex-wrap:wrap;gap:14px"></div><div class="card" style="margin-top:16px" id="tp"></div></div></div>';
    const t = structuredClone(cfg.theme);
    const draw = () => { cleanups.forEach((f) => f && f()); cleanups = []; const st = $('#st'); st.innerHTML = ''; st.append(preview('clock-digital', 170, 170, t, {}, {}, 200, 200), preview('todo', 300, 260, t, {}, { items: [{ id: 'a', t: 'Für die Schule lernen', prio: 2 }, { id: 'b', t: 'E-Mail beantworten', done: true }] }, 300, 260)); };
    $('#f').append(themeForm(t, (v) => { api.patch('theme', structuredClone(v)); draw(); }, { original: structuredClone(cfg.theme) })); draw();
    const tp = $('#tp'); tp.innerHTML = '<b>Design-Vorlagen</b><div class="row" style="margin:10px 0"><input type="text" id="tn" placeholder="Name der Vorlage"><button class="p" id="ts">Aktuelles Design speichern</button></div><div id="tl"></div>';
    $('#ts').onclick = async () => { const n = $('#tn').value.trim(); if (!n) return; await api.patch('templates', [...cfg.templates.filter((x) => x.name !== n), { name: n, theme: structuredClone(t) }]); go('designs'); };
    cfg.templates.forEach((x) => { const r = h(`<div class="row" style="margin:6px 0"><span style="flex:1">${esc(x.name)}</span><button>Anwenden</button><button class="dg">Löschen</button></div>`); const [a, d] = r.querySelectorAll('button');
      a.onclick = async () => { await api.patch('theme', structuredClone(x.theme)); go('designs'); }; d.onclick = async () => { await api.patch('templates', cfg.templates.filter((q) => q !== x && q.name !== x.name)); go('designs'); }; $('#tl').append(r); });
  },
  layouts(m) {
    if (pkState.layTab === 'dock') return dockPage(m);
    m.innerHTML = '<h2>Desktop-Layouts</h2><div class="row" id="lt" style="margin-bottom:14px"></div><p class="sub">Speichert Position, Grösse und Sichtbarkeit aller Widgets (und die Dock-Einstellungen), z. B. „Schule“ und „Zuhause“.</p><div class="card"><div class="row"><input type="text" id="n" placeholder="Name des Layouts"><button class="p" id="s">Aktuelles Layout speichern</button></div></div><div class="card" id="l"></div>';
    layTabs();
    const sn = h(`<div class="card row"><label class="row"><input type="checkbox" id="sg" ${cfg.settings.snap ? 'checked' : ''}> Widgets am Raster ausrichten</label><span class="dim">Rastergrösse (px)</span><input type="number" id="gs" min="5" max="200" value="${cfg.settings.grid || 20}" style="width:80px"></div>`); m.append(sn);
    $('#sg', sn).onchange = (e) => api.patch('settings', { ...cfg.settings, snap: e.target.checked }); $('#gs', sn).onchange = (e) => api.patch('settings', { ...cfg.settings, grid: Math.max(5, Math.min(200, +e.target.value || 20)) });
    const ex = h('<div class="card"><b>Beispiel-Profile</b><div class="sub" style="margin:4px 0 10px">Erstellt drei fertige Desktop-Profile (Minimal, Produktivität, Unterhaltung) mit passenden Widgets und Dock. Du kannst sie danach beliebig ändern.</div><button id="ep">Beispiel-Profile erstellen</button></div>'); m.append(ex);
    $('#ep', ex).onclick = async () => { if (!confirm('Die drei Beispiel-Profile erstellen? Dabei werden fehlende Widgets hinzugefügt; dein aktueller Desktop wird danach durch das Profil «Minimal» ersetzt.')) return; await createExampleProfiles(); go('layouts'); };
    $('#s').onclick = async () => { const n = $('#n').value.trim(); if (n) { await api.saveLayout(n); go('layouts'); } };
    const names = Object.keys(cfg.layouts); if (!names.length) $('#l').textContent = 'Noch keine Layouts gespeichert.';
    names.forEach((n) => { const r = h(`<div class="row" style="margin:6px 0"><b style="flex:1">${esc(n)}</b><span class="pill">${cfg.layouts[n].length} Widgets</span><button>Anwenden</button><button class="dg">Löschen</button></div>`); const [a, d] = r.querySelectorAll('button');
      a.onclick = () => api.applyLayout(n); d.onclick = async () => { const l = { ...cfg.layouts }; delete l[n]; await api.patch('layouts', l); go('layouts'); }; $('#l').append(r); });
  },
  iphone(m) {
    const ca = cfg.cache || {}, on = !!ca.connected;
    const gs = cfg.gcal || {}, gst = gs.syncing ? '<span class="pill">wird geladen …</span>' : gs.ok === true ? `<span class="pill ok-p">verbunden · ${gs.count} Termine</span>` : gs.ok === false ? '<span class="pill no-p">Fehler</span>' : '<span class="pill">nicht verbunden</span>';
    const gcard = `<div class="card gc-card"><div class="row" style="align-items:flex-start;flex-wrap:nowrap"><span class="gc-ic">📆</span><div style="flex:1"><b>Google Kalender</b> ${gst}<div class="sub" style="margin:4px 0 0">Deine Google-Termine erscheinen in allen Kalender-Widgets (grün) und werden alle 10 Minuten aktualisiert.</div></div></div>
      ${gs.ok === false ? `<div class="hint" style="margin-top:10px;color:#ff6b6b">${esc(gs.msg || '')}</div>` : ''}
      <textarea id="gu" rows="2" spellcheck="false" style="width:100%;margin-top:12px;font-family:Consolas,monospace;font-size:12px" placeholder="https://calendar.google.com/calendar/ical/…/private-…/basic.ics">${esc(cfg.settings.icalUrls || '')}</textarea>
      <div class="row" style="margin-top:8px;justify-content:flex-end"><button id="go">Google Kalender öffnen</button>${cfg.settings.icalUrls ? '<button id="gs">Jetzt aktualisieren</button><button class="dg" id="gd">Trennen</button>' : ''}<button class="p" id="gc">Verbinden</button></div>
      <ol class="steps"><li>«Google Kalender öffnen» klicken. Links unter «Einstellungen für meine Kalender» deinen Kalender wählen.</li><li>Nach unten zu «Kalender integrieren» scrollen und bei «Privatadresse im iCal-Format» auf Kopieren klicken.</li><li>Oben einfügen und «Verbinden» klicken. Mehrere Kalender: jede Adresse in eine eigene Zeile.</li></ol>
      <div class="hint">Die Adresse bleibt nur auf deinem PC. Neue Termine trägst du in Google Kalender ein.</div></div>`;
    m.innerHTML = gcard + `<h2 style="margin-top:26px">iPhone-Verbindung</h2><p class="sub">Verbindung zu iCloud über CalDAV/CardDAV mit einem app-spezifischen Passwort. <b>Noch nicht gegen ein echtes Konto getestet.</b> Wenn etwas nicht klappt, wird die Fehlermeldung unten angezeigt.</p>
    <div class="card"><b>Status: </b><span class="${on ? 'ok' : 'no'}">${on ? 'verbunden' + (cfg.icloudUser ? ' als ' + esc(cfg.icloudUser) : '') : 'nicht verbunden'}</span>
      ${on ? `<div class="sub" style="margin:8px 0 0">Letzter Abgleich: ${ca.lastSync ? new Date(ca.lastSync).toLocaleString('de-CH') : '–'} · ${(ca.events || []).length} Termine · ${(ca.todos || []).length} offene Erinnerungen · ${(ca.contacts || []).length} Kontakte</div>` : ''}
      <div id="msg" class="hint" style="margin-top:12px;display:${(ca.errors || []).length ? 'block' : 'none'}">${esc((ca.errors || []).join(' | '))}</div></div>
    ${on ? `<div class="card"><div class="row"><button class="p" id="sy">Jetzt abgleichen</button><button class="dg" id="di">Trennen</button></div>
      <h3>Termin erstellen</h3><div class="row"><input type="text" id="et" placeholder="Titel"><input type="datetime-local" id="es"><select id="ed"><option value="30">30 min</option><option value="60" selected>1 h</option><option value="120">2 h</option></select><button id="eb">Erstellen</button></div>
      <h3>Erinnerung erstellen</h3><div class="row"><input type="text" id="tt" placeholder="Titel"><input type="date" id="td"><button id="tb">Erstellen</button></div>
      <h3>Kalender und Listen</h3>${(ca.calendars || []).map((c) => `<div class="row" style="margin:4px 0"><span style="width:10px;height:10px;border-radius:50%;background:${esc(c.color || '#888')}"></span>${esc(c.name)} <span class="pill">${c.comps.map((x) => x === 'VEVENT' ? 'Termine' : 'Erinnerungen').join(', ')}</span></div>`).join('')}</div>`
    : `<div class="card"><b>Anmelden</b><div class="f"><label>Apple-ID</label><input type="text" id="u" placeholder="name@icloud.com"><label>App-spez. Passwort</label><input type="password" id="pw" placeholder="xxxx-xxxx-xxxx-xxxx"></div>
      <div class="row"><button class="p" id="cn">Verbinden</button></div>
      <ol class="steps"><li>Öffne dein Apple-Konto <button id="ao">Apple-Konto-Seite öffnen</button> und melde dich an.</li><li>Gehe zu «Anmelden und Sicherheit», dann «App-spezifische Passwörter», und erzeuge eines (z. B. «Widgets»).</li><li>Trage hier deine Apple-ID und dieses Passwort ein und klicke «Verbinden».</li></ol>
      <div class="hint">«Mit Apple anmelden» (OAuth) gibt es für Programme von Drittanbietern nicht. Der offizielle Weg für iCloud-Daten ist das app-spezifische Passwort. Dein normales Apple-Passwort funktioniert hier nicht. Das Passwort wird verschlüsselt mit Windows gespeichert und nur an Apple gesendet.</div></div>`}
    <div class="card"><table style="width:100%;border-collapse:collapse;line-height:1.5">
    ${[['Kalender', 'Termine der nächsten 14 Tage anzeigen und neue erstellen', on ? 'aktiv' : 'nach Verbinden', on ? 'ok' : 'no'], ['Erinnerungen', 'anzeigen, abhaken, neu erstellen. Apple hat das Format geändert; bei manchen Konten sind Listen über CalDAV nicht sichtbar', 'eingeschränkt', 'no'],
      ['Kontakte', 'Namen mit Telefon/E-Mail (nur lesen)', on ? 'aktiv' : 'nach Verbinden', on ? 'ok' : 'no'], ['Notizen', 'keine offizielle Schnittstelle', 'nicht möglich', 'no'],
      ['Fotos', 'keine offizielle API. Workaround: „iCloud für Windows“ installieren und im Foto-Widget den iCloud-Fotos-Ordner wählen', 'per Ordner', 'ok'], ['iPhone-Akku', 'Apple stellt den Akkustand nicht für Windows bereit', 'nicht möglich', 'no']]
      .map((r) => `<tr style="border-bottom:1px solid var(--ln)"><td style="padding:10px 8px"><b>${r[0]}</b></td><td style="color:var(--t2)">${r[1]}</td><td class="${r[3]}">${r[2]}</td></tr>`).join('')}</table></div>`;
    const msg = (t) => { const e = $('#msg'); e.style.display = 'block'; e.textContent = t; };
    $('#go').onclick = () => api.gcalOpen();
    $('#gc').onclick = async () => { await api.gcalSet($('#gu').value); };
    if ($('#gs')) $('#gs').onclick = () => api.gcalSync();
    if ($('#gd')) $('#gd').onclick = async () => { await api.gcalSet(''); };
    if ($('#ao')) $('#ao').onclick = () => api.openUrl('https://account.apple.com/account/manage');
    if ($('#cn')) $('#cn').onclick = async () => { const u = $('#u').value.trim(), p = $('#pw').value.trim(); if (!u || !p) return msg('Bitte Apple-ID und Passwort eingeben.'); $('#cn').disabled = true; msg('Verbinde …'); const r = await api.icloudConnect(u, p); if (r.ok) go('iphone'); else { msg(r.error); $('#cn').disabled = false; } };
    if ($('#sy')) { $('#sy').onclick = async () => { msg('Gleiche ab …'); const r = await api.icloudSync(); msg(r.ok ? 'Fertig.' : r.error); };
      $('#di').onclick = async () => { await api.icloudDisconnect(); go('iphone'); };
      $('#eb').onclick = async () => { const t = $('#et').value.trim(), s = $('#es').value; if (!t || !s) return msg('Titel und Startzeit angeben.'); const st = new Date(s).getTime(); const r = await api.icloudCreateEvent(t, st, st + $('#ed').value * 6e4); msg(r.ok ? 'Termin erstellt.' : r.error); };
      $('#tb').onclick = async () => { const t = $('#tt').value.trim(); if (!t) return; const r = await api.icloudCreateTodo(t, $('#td').value); msg(r.ok ? 'Erinnerung erstellt.' : r.error); } }
  },

};


// ---------- Dock (Reiter in „Desktop-Layouts“) ----------
const DOCK_PRESETS = {
  'Apple Dark': { bg1: '#1c1c1e', opacity: 0.55, border: '#ffffff', borderOpacity: 0.16, shadow: 45, indicator: '#ffffff', blur: 0 },
  'Apple Light': { bg1: '#f5f5f7', opacity: 0.6, border: '#ffffff', borderOpacity: 0.7, shadow: 30, indicator: '#1d1d1f', blur: 0 },
  'Grey Glass': { bg1: '#8e8e93', opacity: 0.45, border: '#ffffff', borderOpacity: 0.3, shadow: 30, indicator: '#ffffff', blur: 0 },
  'Black Glass': { bg1: '#000000', opacity: 0.42, border: '#ffffff', borderOpacity: 0.2, shadow: 50, indicator: '#ffffff', blur: 0 },
  'White Glass': { bg1: '#ffffff', opacity: 0.38, border: '#ffffff', borderOpacity: 0.65, shadow: 25, indicator: '#1d1d1f', blur: 0 },
  'Transparent': { bg1: '#000000', opacity: 0, border: '#ffffff', borderOpacity: 0, shadow: 0, indicator: '#ffffff', blur: 0 }
};
function dockPage(m) {
  const d = structuredClone(cfg.dock), save = debounce(() => api.patch('dock', structuredClone(d)), 120);
  m.innerHTML = '<h2>Desktop-Layouts</h2><div class="row" id="lt" style="margin-bottom:14px"></div><p class="sub">Ein Apple-ähnlicher Dock als eigenes Fenster. Er läuft neben der Windows-Taskleiste und ersetzt sie nicht.</p><div class="two" style="grid-template-columns:1fr 1fr"><div id="dl"></div><div id="dr"></div></div>';
  layTabs(); const L = $('#dl'), R = $('#dr');
  const card = (title) => { const c = h(`<div class="card"><b>${title}</b><div class="f"></div></div>`); return [c, $('.f', c)]; };
  const row = (f, label, el) => f.append(h(`<label>${label}</label>`), el);
  const chk = (f, label, get, set, tip) => { const e = h('<input type="checkbox">'); e.checked = !!get(); e.title = tip || ''; e.onchange = () => { set(e.checked); save(); }; row(f, label, e); };
  const rng = (f, label, get, set, min, max, step) => { const w = h(`<div class="row"><input type="range" min="${min}" max="${max}" step="${step}" value="${get()}"><span>${get()}</span></div>`); w.firstChild.oninput = () => { set(+w.firstChild.value); w.lastChild.textContent = w.firstChild.value; save(); }; row(f, label, w); };
  const sel = (f, label, opts, get, set) => { const e = h('<select></select>'); opts.forEach(([v, l]) => e.append(new Option(l, v, false, String(get()) === String(v)))); e.onchange = () => { set(e.value); save(); }; row(f, label, e); };
  // Allgemein
  const [c1, f1] = card('Allgemein'); L.append(c1);
  chk(f1, 'Dock anzeigen', () => d.enabled, (v) => (d.enabled = v));
  sel(f1, 'Position', [['bottom', 'Unten'], ['left', 'Links'], ['right', 'Rechts'], ['top', 'Oben']], () => d.position, (v) => (d.position = v));
  const ds = h('<select></select>'); ds.append(new Option('Hauptbildschirm', 'primary'), new Option('Alle Bildschirme', 'all')); api.displays().then((l) => { l.forEach((x) => ds.append(new Option(x.name, x.id))); ds.value = String(d.display); }); ds.onchange = () => { d.display = ds.value; save(); }; row(f1, 'Bildschirm', ds);
  chk(f1, 'Automatisch ausblenden (am Rand einblenden)', () => d.autoHide, (v) => (d.autoHide = v), 'Der Dock verschwindet und erscheint wieder, sobald der Mauszeiger den Bildschirmrand berührt.');
  chk(f1, 'Laufende Programme anzeigen (Punkt)', () => d.showRunning, (v) => (d.showRunning = v));
  // Grösse
  const [c2, f2] = card('Grösse und Verhalten'); L.append(c2);
  rng(f2, 'Symbolgrösse', () => d.size, (v) => (d.size = v), 32, 96, 1); rng(f2, 'Symbolabstand', () => d.spacing, (v) => (d.spacing = v), 0, 28, 1);
  rng(f2, 'Vergrösserung beim Darüberfahren', () => d.magnify, (v) => (d.magnify = v), 1, 2.2, 0.05); rng(f2, 'Höhe / Dicke (Rand)', () => d.thickness, (v) => (d.thickness = v), 0, 30, 1);
  rng(f2, 'Eckenradius', () => d.radius, (v) => (d.radius = v), 0, 48, 1);
  sel(f2, 'Breite', [['auto', 'Automatisch'], ['fixed', 'Feste Breite']], () => d.widthMode, (v) => (d.widthMode = v)); rng(f2, 'Feste Breite (px)', () => d.widthPx, (v) => (d.widthPx = v), 200, 1800, 10);
  // Farben
  const [c3, f3] = card('Farben und Transparenz'); R.append(c3);
  const pr = h('<div class="row" style="grid-column:1/-1"></div>'); Object.entries(DOCK_PRESETS).forEach(([n, p]) => { const b = h(`<button class="${d.theme.preset === n ? 'sel' : ''}">${n}</button>`); b.onclick = () => { d.theme = { ...d.theme, ...p, preset: n }; save(); dockPage(m); }; pr.append(b); });
  const bc = h('<button class="' + (d.theme.preset === 'Custom' ? 'sel' : '') + '">Custom</button>'); bc.onclick = () => { d.theme.preset = 'Custom'; save(); }; pr.append(bc); f3.append(pr);
  chk(f3, 'Mit Widget-Design synchronisieren', () => d.sync, (v) => (d.sync = v), 'Der Dock übernimmt Hintergrund, Rahmen und Transparenz des globalen Widget-Designs.');
  const col = (label, key) => row(f3, label, colorField(d.theme[key], (v) => { d.theme[key] = v; d.theme.preset = 'Custom'; save(); }));
  col('Hintergrundfarbe', 'bg1'); col('Rahmenfarbe', 'border'); col('Farbe des Aktiv-Punkts', 'indicator');
  const tr = (label, key, min, max, step) => rng(f3, label, () => d.theme[key] ?? 0, (v) => { d.theme[key] = v; d.theme.preset = 'Custom'; }, min, max, step);
  tr('Transparenz (Deckkraft)', 'opacity', 0, 1, 0.01); tr('Rahmen-Transparenz', 'borderOpacity', 0, 1, 0.01); tr('Schatten', 'shadow', 0, 100, 1); tr('Blur (Windows-Acrylic, 0 = aus)', 'blur', 0, 30, 1);
  f3.append(h('<div class="hint" style="grid-column:1/-1">Echter Windows-Blur ist nur möglich, wenn die Vergrösserung auf 1 steht (das Fenster hat dann genau die Grösse des Docks). Sonst zeigt der Dock eine Glas-Optik aus Transparenz und Glanzkante.</div>'));
  // Hintergrundbild und Zeitplan
  const [c4, f4] = card('Hintergrundbild-Farben und Tag/Nacht'); R.append(c4);
  const ap = structuredClone(cfg.appearance), saveAp = debounce(() => api.patch('appearance', structuredClone(ap)), 150);
  const wp = h('<div class="row" style="grid-column:1/-1"><button id="wc">Farben aus dem Hintergrundbild lesen</button><span id="ws" class="dim"></span></div>'); f4.append(wp);
  $('#wc', wp).onclick = async () => { const r = await api.wallpaperColors(); const ws = $('#ws', wp); if (!r.ok) { ws.textContent = r.reason === 'windows-only' ? 'Nur unter Windows verfügbar.' : 'Hintergrundbild nicht lesbar.'; return; } ws.textContent = ''; const sw = h('<div class="swr" style="margin-left:8px"></div>'); r.colors.forEach((c) => { const i = h(`<i title="${c} – als Dock-Farbe verwenden" style="background:${c};width:22px;height:22px"></i>`); i.onclick = () => { d.theme.bg1 = c; d.theme.preset = 'Custom'; save(); dockPage(m); }; sw.append(i); }); ws.append(sw); };
  const ck = (label, get, set, tip) => { const e = h('<input type="checkbox">'); e.checked = !!get(); e.title = tip || ''; e.onchange = () => { set(e.checked); saveAp(); }; row(f4, label, e); };
  ck('Dock-Farbe folgt dem Hintergrundbild', () => ap.wallpaper.follow, (v) => (ap.wallpaper.follow = v), 'Passt die Dock-Farbe automatisch an. Überschreibt nie eigene Widget-Farben.');
  ck('Akzentfarbe folgt dem Hintergrundbild (App und globales Design)', () => ap.wallpaper.followAccent, (v) => (ap.wallpaper.followAccent = v), 'Widgets mit eigenem Design bleiben unverändert.');
  const sc = ap.schedule; ck('Automatisch zwischen Tag- und Nacht-Design wechseln', () => sc.enabled, (v) => (sc.enabled = v));
  const tm = (label, key) => { const e = h(`<input type="time" value="${sc[key]}">`); e.onchange = () => { sc[key] = e.value; saveAp(); }; row(f4, label, e); };
  tm('Tag beginnt um', 'dayStart'); tm('Nacht beginnt um', 'nightStart');
  const ps = (label, key) => { const e = h('<select></select>'); Object.keys(PRESETS).slice(0, 6).forEach((n) => e.append(new Option(n, n, false, sc[key] === n))); e.onchange = () => { sc[key] = e.value; saveAp(); }; row(f4, label, e); };
  ps('Tag-Design', 'dayPreset'); ps('Nacht-Design', 'nightPreset'); ck('Auch Dock-Farben wechseln', () => sc.alsoDock, (v) => (sc.alsoDock = v));
  // Programme
  const [c5] = card('Programme im Dock'); R.append(c5); c5.lastChild.remove(); const lst = h('<div id="di"></div>'); c5.append(lst);
  const draw = () => { lst.innerHTML = ''; if (!d.items.length) lst.append(h('<div class="dim" style="padding:8px 0">Noch keine Programme. Füge welche hinzu.</div>'));
    d.items.forEach((it, i) => { const r = h(`<div class="tk"><span style="flex:1">${esc(it.name)}</span><button>↑</button><button>↓</button><button class="dg">Entfernen</button></div>`); const [u, dn, rm] = r.querySelectorAll('button');
      u.onclick = () => { if (i) { [d.items[i - 1], d.items[i]] = [d.items[i], d.items[i - 1]]; api.dockReorder(d.items.map((x) => x.id)); draw(); } }; dn.onclick = () => { if (i < d.items.length - 1) { [d.items[i + 1], d.items[i]] = [d.items[i], d.items[i + 1]]; api.dockReorder(d.items.map((x) => x.id)); draw(); } };
      rm.onclick = async () => { if (confirm(`«${it.name}» aus dem Dock entfernen?`)) { await api.dockRemove(it.id); d.items.splice(i, 1); draw(); } }; lst.append(r); }); };
  draw(); const add = h('<div class="row" style="margin-top:10px"><button class="p" id="ap">+ Programm aus dem Startmenü</button><button id="af">Datei wählen …</button></div>'); c5.append(add);
  $('#af', add).onclick = async () => { const r = await api.dockPickApp(); if (r) { d.items.push(r); draw(); } };
  $('#ap', add).onclick = async () => { // Auswahl aus dem Startmenü
    const apps = await api.dockScanApps(), box = h('<div class="card" style="margin-top:10px"><input type="text" placeholder="Programm suchen …" style="width:100%"><div class="pl" style="max-height:240px;overflow:auto;margin-top:8px"></div></div>'); c5.append(box); const pl = $('.pl', box);
    const fill = () => { const q = box.firstChild.value.toLowerCase(); pl.innerHTML = ''; if (!apps.length) pl.append(h('<div class="dim">Keine Programme gefunden (nur unter Windows).</div>')); apps.filter((x) => x.name.toLowerCase().includes(q)).slice(0, 60).forEach((x) => { const r = h(`<div class="tk" style="cursor:pointer"><span>${esc(x.name)}</span></div>`); r.onclick = async () => { const it = await api.dockAddPath(x.path, x.name); if (it) { d.items.push(it); draw(); } }; pl.append(r); }); };
    box.firstChild.oninput = fill; fill(); };
}

// ---------- Widget-Auswahl wie bei macOS ----------
const pkState = { catId: {}, type: {}, vi: {}, size: {} };
function picker(m, group) {
  const cats = CATS.filter((c) => c.group === group);
  m.innerHTML = `<button class="st-back" id="stb">‹ Widget Store</button><h2>${group === 'apple' ? 'Klassische Widgets' : group === 'fynn' ? 'Weitere Widgets' : 'Vorschlags-Widgets'}</h2><p class="sub">Kategorie links wählen, durch die Designs blättern und «Hinzufügen» drücken. Danach lässt sich das Widget auf dem Desktop verschieben.</p>
    <div class="pk"><div class="pk-l"><input type="text" id="q" placeholder="Widgets suchen …"><div id="cl"></div></div><div class="pk-r" id="pr"></div></div>`;
  $('#stb').onclick = () => go('store');
  if (!pkState.catId[group] || !cats.find((c) => c.id === pkState.catId[group])) { pkState.catId[group] = cats[0].id; pkState.type[group] = cats[0].types[0]; pkState.vi[group] = 0; pkState.size[group] = null; }
  let stage = [], strip = [];
  const clean = (l) => { l.forEach((f) => { try { f && f(); } catch {} }); l.length = 0; };
  cleanups.push(() => { clean(stage); clean(strip); });
  const tint = (def, v) => ({ ...cfg.theme, ...(def.theme || {}), ...((v && v.theme) || {}) });
  const drawList = () => {
    const q = $('#q').value.trim().toLowerCase(), cl = $('#cl'); cl.innerHTML = '';
    if (q) { Object.values(WIDGETS).filter((d) => d.cat !== 'custom' && (d.name + ' ' + d.desc).toLowerCase().includes(q)).forEach((d) => { const cat = CATS.find((c) => c.types.includes(d.id)); const it = h(`<div class="pk-i"><span>${d.icon}</span>${d.name}<small></small></div>`);
        it.onclick = () => { if (cat) { const g = cat.group; pkState.catId[g] = cat.id; pkState.type[g] = d.id; pkState.vi[g] = 0; pkState.size[g] = null; if (g !== group) return go(g); } drawList(); drawRight(); }; cl.append(it); }); return; }
    cats.forEach((c) => { const it = h(`<div class="pk-i ${c.id === pkState.catId[group] ? 'on' : ''}"><span>${c.icon}</span>${c.name}</div>`); it.onclick = () => { pkState.catId[group] = c.id; pkState.type[group] = c.types[0]; pkState.vi[group] = 0; pkState.size[group] = null; drawList(); drawRight(); }; cl.append(it); });
  };
  const drawRight = () => {
    clean(stage); clean(strip); const pr = $('#pr'); pr.innerHTML = '';
    const cat = CATS.find((c) => c.types.includes(pkState.type[group])) || cats[0], def = WIDGETS[pkState.type[group]]; if (!def) return;
    if (cat.types.length > 1) { const tabs = h('<div class="row" style="margin-bottom:12px"></div>'); cat.types.forEach((t) => { const b = h(`<button class="${t === def.id ? 'sel' : ''}">${WIDGETS[t].icon} ${WIDGETS[t].name}</button>`); b.onclick = () => { pkState.type[group] = t; pkState.vi[group] = 0; pkState.size[group] = null; drawRight(); }; tabs.append(b); }); pr.append(tabs); }
    const vs = variantsOf(def).filter((x) => Array.isArray(x.size) || supportedOf(def).includes(x.size)), vi = Math.min(pkState.vi[group] || 0, vs.length - 1), v = vs[vi], ov = pkState.size[group];
    const [w, hh] = ov ? SIZES[ov] : sizeOf(v);
    const box = h(`<div class="pk-s"><button class="pk-a" id="pv">‹</button><div class="stage" id="sg"></div><button class="pk-a" id="nx">›</button></div>`); pr.append(box);
    $('#sg').append(preview(def.id, w, hh, tint(def, v), v.props, {}, 560, 330, stage));
    $('#pv').onclick = () => { pkState.vi[group] = (vi + vs.length - 1) % vs.length; pkState.size[group] = null; drawRight(); };
    $('#nx').onclick = () => { pkState.vi[group] = (vi + 1) % vs.length; pkState.size[group] = null; drawRight(); };
    const info = h(`<div class="pk-c"><div><b>${def.name}: ${esc(v.name)}</b><div class="dim">${esc(def.desc)}</div><div class="dim">Design ${vi + 1} von ${vs.length} · ${w} × ${hh}</div></div></div>`);
    const act = h('<div class="row"></div>'); const szs = h('<div class="row"></div>');
    supportedOf(def).forEach((k) => { const b = h(`<button class="${ov === k || (!ov && Array.isArray(v.size) === false && v.size === k) ? 'sel' : ''}" title="${SIZES[k].join(' × ')}">${SIZE_NAMES[k]}</button>`); b.onclick = () => { pkState.size[group] = k; drawRight(); }; szs.append(b); });
    const add = h('<button class="p">Hinzufügen</button>');
    add.onclick = async () => { const w0 = await api.addWidget({ type: def.id, w, h: hh, props: structuredClone(v.props || {}), theme: tint(def, v) }); add.textContent = '✓ Hinzugefügt'; setTimeout(() => (add.textContent = 'Hinzufügen'), 1500); if (def.settings) { selId = w0.id; } };
    act.append(szs, add); info.append(act); pr.append(info);
    const st = h('<div class="pk-t"></div>'); pr.append(st);
    vs.forEach((x, i) => { const [a, b] = sizeOf(x); const t = h(`<div class="pk-th ${i === vi ? 'on' : ''}"><div class="pk-tp"></div><small>${esc(x.name)}</small></div>`); $('.pk-tp', t).append(preview(def.id, a, b, tint(def, x), x.props, {}, 130, 96, strip)); t.onclick = () => { pkState.vi[group] = i; pkState.size[group] = null; drawRight(); }; st.append(t); });
  };
  $('#q').oninput = debounce(() => { drawList(); }, 150); drawList(); drawRight();
}

function citySearch(w, save, s) {
  const box = h(`<div style="position:relative"><input type="text" placeholder="…" value="${esc(w.props.cityName || w.props.city || '')}" style="width:100%"><div class="ac-l"></div></div>`), inp = box.firstChild, list = box.lastChild; let tm;
  const close = () => (list.style.display = 'none');
  inp.oninput = () => { clearTimeout(tm); const q = inp.value.trim(); if (q.length < 2) return close();
    tm = setTimeout(async () => { try { const g = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=${getLang()}`)).json(); const rs = g.results || [];
      list.innerHTML = rs.map((r, i) => `<div data-i="${i}">${esc(r.name)}<small>${esc([r.admin1, r.country].filter(Boolean).join(', '))}</small></div>`).join('') || `<div class="dim">–</div>`; list.style.display = 'block';
      list.querySelectorAll('[data-i]').forEach((d) => (d.onclick = () => { const r = rs[+d.dataset.i]; Object.assign(w.props, { src: 'city', city: r.name, cityName: r.name, lat: r.latitude, lon: r.longitude }); inp.value = r.name; close(); save(); })); } catch { close(); } }, 250); };
  inp.onblur = () => setTimeout(close, 200); return box;
}

// ---------- UI-Bausteine im Stil der macOS-Systemeinstellungen ----------
const tg = (on, cb) => { const e = h('<input type="checkbox" class="tg">'); e.checked = !!on; e.onchange = () => cb(e.checked); return e; };
function group(parent, title, foot) { const g = h(`<section class="sg">${title ? `<div class="sg-t">${title}</div>` : ''}<div class="sg-b"></div>${foot ? `<div class="sg-f">${foot}</div>` : ''}</section>`); parent.append(g); return g.querySelector('.sg-b'); }
function srow(body, label, desc, ctl) { const r = h(`<div class="sr"><div class="sr-l"><div>${label}</div>${desc ? `<small>${desc}</small>` : ''}</div><div class="sr-c"></div></div>`); if (ctl) [].concat(ctl).forEach((c) => r.lastChild.append(c)); body.append(r); return r; }
function seg(opts, val, cb) { const e = h('<div class="seg"></div>'); opts.forEach(([v, l]) => { const b = h(`<button class="${String(v) === String(val) ? 'on' : ''}">${l}</button>`); b.onclick = () => { e.querySelectorAll('button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); cb(v); }; e.append(b); }); return e; }
function selEl(opts, val, cb) { const e = h('<select></select>'); opts.forEach(([v, l]) => e.append(new Option(l, v, false, String(val) === String(v)))); e.onchange = () => cb(e.value); return e; }
function btn(label, cb, cls = '') { const b = h(`<button class="${cls}">${label}</button>`); b.onclick = cb; return b; }
function tabsEl(list, cur, cb) { const e = h('<div class="seg tabs"></div>'); list.forEach(([k, l]) => { const b = h(`<button class="${k === cur ? 'on' : ''}">${l}</button>`); b.onclick = () => cb(k); e.append(b); }); return e; }
const S_ = () => ({ ...cfg.settings });
const setS = async (p) => { cfg.settings = { ...S_(), ...p }; await api.patch('settings', cfg.settings); };

PAGES.home = (m) => {
  if (isLocked()) return guestHome(m);
  const S = cfg.settings, hr = new Date().getHours(), greet = hr < 11 ? 'Guten Morgen' : hr < 18 ? 'Guten Tag' : 'Guten Abend';
  const vis = cfg.widgets.filter((w) => w.visible !== false), open = (cfg.tasks || []).filter((x) => !x.done).length, gs = cfg.gcal || {}, ic = (cfg.cache || {}).connected;
  const date = new Date().toLocaleDateString(getLang() === 'de' ? 'de-CH' : getLang(), { weekday: 'long', day: 'numeric', month: 'long' });
  m.innerHTML = `<div class="hm-h"><div><div class="hm-d">${esc(date)}</div><h2>${greet}${S.userName ? ', ' + esc(S.userName) : ''}</h2></div></div>
    ${cfg.update && cfg.update.available ? `<div class="hm-up" id="hup"><span>⬆️</span><div style="flex:1"><b>Update verfügbar</b><small>Version ${esc(cfg.update.latest)} ist bereit. Deine Widgets bleiben erhalten.</small></div><button class="p">Ansehen</button></div>` : ''}
    <div class="hm-t" id="ht"></div>
    <div class="st-sh"><h3>Auf deinem Desktop</h3><button class="st-all" id="hw">Alle verwalten</button></div><div class="hm-w" id="hwl"></div>
    <h3>Schnellzugriff</h3><div class="hm-q" id="hq"></div>
    <div class="hint" style="margin-top:18px">Tipp: Widgets oben am Griff verschieben und unten rechts grösser ziehen. Mit <b>Rechtsklick</b> auf ein Widget kannst du es sperren, duplizieren oder entfernen. Die App läuft im Hintergrund weiter (Symbol neben der Uhr).</div>`;
  $('#hw').onclick = () => go('widgets'); if ($('#hup')) $('#hup').onclick = () => { pkState.setTab = 'update'; go('settings'); };
  [['🧩', `${vis.length}<small> / ${cfg.widgets.length}</small>`, 'Widgets sichtbar', 'widgets'], ['✅', String(open), open === 1 ? 'offene Aufgabe' : 'offene Aufgaben', 'tasks'],
    ['📅', gs.ok ? String(gs.count) : '–', gs.ok ? 'Google-Termine' : 'Google Kalender nicht verbunden', 'iphone'], ['☁️', ic ? 'An' : 'Aus', 'iCloud', 'iphone'], ['⚡', S.autostart ? 'An' : 'Aus', 'Start mit Windows', 'settings']]
    .forEach(([i, v, l, p]) => { const e = h(`<div class="hm-ti"><span>${i}</span><b>${v}</b><small>${l}</small></div>`); e.onclick = () => go(p); $('#ht').append(e); });
  const wl = $('#hwl');
  if (!vis.length) wl.append(h('<div class="dim" style="padding:10px 2px">Noch keine Widgets auf dem Desktop. Hol dir welche im Widget Store.</div>'));
  vis.slice(0, 8).forEach((w) => { const e = h(`<div class="hm-wi"><div class="hm-pv"></div><b>${esc(nameOf(w))}</b></div>`); $('.hm-pv', e).append(preview(w.type, w.w, w.h, mergedTheme(w), w.props || {}, w.data || {}, 180, 110)); e.onclick = () => { selId = w.id; go('widgets'); }; wl.append(e); });
  [['⌨️', 'Shortcut-Leiste', 'Leiste am oberen Rand', 'tbsettings'], ['🛍️', 'Widget Store', 'Über 100 Widgets', 'store'], ['🎨', 'Designs', 'Farben, Glas, Schrift', 'designs'], ['🖥️', 'Desktop & Dock', 'Layouts und Dock', 'layouts'], ['⚙️', 'Einstellungen', 'Alles einstellen', 'settings']]
    .forEach(([i, a, b, p]) => { const e = h(`<div class="hm-qi"><span>${i}</span><div><b>${a}</b><small>${b}</small></div></div>`); e.onclick = () => { if (p === 'tbsettings') { pkState.setTab = 'topbar'; return go('settings'); } go(p); }; $('#hq').append(e); });
};

const SET_TABS = [['general', 'Allgemein', '⚙️', 'Sprache, Name und Start mit Windows'], ['update', 'Software-Update', '⬆️', 'Neue Versionen installieren'], ['look', 'Darstellung', '🎨', 'Hell oder dunkel, Farbe und Fensterknöpfe'],
  ['desktop', 'Widgets & Desktop', '🖥️', 'Raster, Verhalten und Dock'], ['topbar', 'Shortcut-Leiste', '⌨️', 'Leiste am oberen Bildschirmrand'], ['units', 'Wetter & Einheiten', '🌤️', 'Ort, Temperatur und Uhrzeit'],
  ['accounts', 'Kalender & Konten', '📅', 'Google Kalender und iCloud'], ['guest', 'Gäste-Modus', '👥', 'App mit PIN für andere sperren'], ['data', 'Daten & Sicherung', '💾', 'Deine Einstellungen als Datei sichern'], ['support', 'Support', '🛠️', 'Für Entwickler und Hilfe, mit PIN'], ['about', 'Über', 'ℹ️', 'Version und Hilfe']];
PAGES.settings = (m) => {
  const tab = pkState.setTab || 'general', upd = cfg.update && cfg.update.available, q = pkState.setQ || '';
  m.innerHTML = `<div class="set-top"><div><h2>${t('st.title')}</h2><p class="sub">Änderungen werden sofort gespeichert.</p></div>${isAdmin() ? '<button id="alk" title="Admin-Bereiche wieder sperren">🔓 Support offen · Sperren</button>' : ''}<div class="set-q"><span>🔍</span><input type="search" id="sq" placeholder="Einstellung suchen …" value="${esc(q)}"></div></div>
    ${upd && !(tab === 'update' && !q) ? `<div class="hm-up set-up" id="sup"><span>⬆️</span><div style="flex:1"><b>Update auf Version ${esc(cfg.update.latest)} verfügbar</b><small>Mit einem Klick installieren. Deine Widgets und Einstellungen bleiben erhalten.</small></div><button class="p">Jetzt aktualisieren</button></div>` : ''}
    <div class="set"><div class="set-n" id="sn"></div><div class="set-b" id="sb"></div></div>`;
  if ($('#alk')) $('#alk').onclick = () => api.lockRelock();
  if ($('#sup')) $('#sup').onclick = () => { pkState.setTab = 'update'; pkState.setQ = ''; go('settings'); };
  SET_TABS.forEach(([k, l, i, d]) => { const e = h(`<div class="set-i ${k === tab && !q ? 'on' : ''}"><span>${i}</span><div class="set-il"><b>${l}</b><small>${d}</small></div>${k === 'update' && upd ? '<em class="bdg">1</em>' : ''}${ADMIN_TABS.includes(k) && !isAdmin() ? '<em class="set-lk" title="Support-PIN nötig">🔒</em>' : ''}</div>`); e.onclick = () => { pkState.setTab = k; pkState.setQ = ''; go('settings'); }; $('#sn').append(e); });
  const sq = $('#sq'); sq.oninput = debounce(() => { pkState.setQ = sq.value; const sc = $('#main').scrollTop; go('settings'); $('#main').scrollTop = sc; const n = $('#sq'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 200);
  const B = $('#sb');
  if (q.trim()) return settingsSearch(B, q.trim().toLowerCase());
  const [, tl, ti, td] = SET_TABS.find((x) => x[0] === tab) || SET_TABS[0];
  B.append(h(`<div class="set-h"><span>${ti}</span><div><h3>${tl}</h3><small>${td}</small></div></div>`));
  renderSetTab(tab, B);
};
function settingsSearch(B, q) {
  const words = q.split(/\s+/); let hits = 0;
  SET_TABS.filter(([k]) => k !== 'about').forEach(([k, l, i]) => {
    const tmp = document.createElement('div'); try { renderSetTab(k, tmp); } catch {}
    const rows = [...tmp.querySelectorAll('.sr')].filter((r) => { const tx = (r.querySelector('.sr-l') || r).textContent.toLowerCase() + ' ' + l.toLowerCase(); return words.every((w) => tx.includes(w)); });
    if (!rows.length) return; hits += rows.length;
    const g = group(B, `${i} ${l}`); rows.forEach((r) => g.append(r));
    const more = h(`<button class="st-all" style="margin:-12px 4px 18px">Alle ${esc(l)}-Einstellungen öffnen ›</button>`); more.onclick = () => { pkState.setTab = k; pkState.setQ = ''; go('settings'); }; B.append(more);
  });
  if (!hits) B.append(h(`<div class="hint">Nichts gefunden für «${esc(q)}». Versuch ein anderes Wort, zum Beispiel <b>Update</b>, <b>Farbe</b>, <b>Start</b> oder <b>PIN</b>.</div>`));
}
const ADMIN_TABS = ['guest', 'support'];
const isAdmin = () => !!(cfg && cfg.runtime && cfg.runtime.admin);
function renderSetTab(tab, B) {
  if (ADMIN_TABS.includes(tab) && !isAdmin()) return adminGate(B);
  const S = S_();
  if (tab === 'general') {
    let g = group(B, 'Allgemein');
    srow(g, t('st.language'), '', selEl([['de', 'Deutsch'], ['en', 'English'], ['ru', 'Русский']], S.lang, (v) => setS({ lang: v })));
    const nm = h(`<input type="text" placeholder="z. B. Fynn" value="${esc(S.userName || '')}" style="width:200px">`); nm.onchange = () => setS({ userName: nm.value.trim() });
    srow(g, 'Dein Name', 'Für die Begrüssung auf der Übersicht', nm);
    g = group(B, 'Start');
    srow(g, 'Mit Windows starten', 'Die Widgets erscheinen nach der Anmeldung automatisch', tg(S.autostart, (v) => api.autostart(v)));
    srow(g, 'Startanimation', 'Wird bei jedem Öffnen der App gezeigt', seg([['normal', 'Normal'], ['short', 'Kurz'], ['off', 'Aus']], S.splash || 'normal', (v) => setS({ splash: v })));
    srow(g, 'Beim Start öffnen', 'Welche Seite die App zuerst zeigt', selEl([['home', 'Übersicht'], ['store', 'Widget Store'], ['widgets', 'Meine Widgets']], S.startPage || 'home', (v) => setS({ startPage: v })));
  }
  if (tab === 'update') {
    const u = cfg.update || {};
    const box = h(`<div class="upd"><img src="../../assets/icon.png" alt=""><div style="flex:1;min-width:0"><b>Jafy Widgets</b><div class="dim" id="uv">Version …</div><div id="us" style="margin-top:6px"></div><div class="upb" id="upb" hidden><i></i></div></div><div id="ub"></div></div>`); B.append(box);
    const us = $('#us', box), ub = $('#ub', box), bar = $('#upb', box);
    const show = (r) => {
      ub.innerHTML = '';
      if (r && r.available) { us.innerHTML = `<span class="ok">Version ${esc(r.latest)} ist verfügbar.</span>`; const b = btn('Jetzt aktualisieren', async () => { b.disabled = true; b.textContent = 'Wird geladen …'; bar.hidden = false; const x = await api.updInstall(); if (x.ok) { us.textContent = 'Wird installiert. Die App startet gleich neu …'; } else { us.innerHTML = `<span class="no">${esc(x.error)}</span>`; b.disabled = false; b.textContent = 'Nochmal versuchen'; bar.hidden = true; } }, 'p'); ub.append(b); if (r.notes) box.after(h(`<div class="sg"><div class="sg-t">Was ist neu in ${esc(r.latest)}</div><div class="sg-b"><div class="notes">${esc(r.notes)}</div></div></div>`)); }
      else { us.innerHTML = r ? (r.ok ? '<span class="ok">✓ Du hast die neueste Version.</span>' : `<span class="no">${esc(r.error || '')}</span>`) : '<span class="dim">Noch nicht geprüft.</span>'; const b = btn('Nach Updates suchen', async () => { b.disabled = true; b.textContent = 'Suche …'; const x = await api.updCheck(); B.querySelectorAll('.notes').forEach((n) => n.closest('.sg').remove()); show(x); }); ub.append(b); }
    };
    api.onUpdProgress((p) => { const i = $('#upb i'); if (i) i.style.width = Math.round(p * 100) + '%'; });
    api.updInfo().then((x) => { $('#uv', box).textContent = 'Version ' + x.version + (x.repo ? ' · github.com/' + x.repo : ''); show(x.last || (u.at ? u : null)); });
    B.append(h('<div class="hint" style="margin-top:4px">Deine Widgets und Einstellungen bleiben beim Update erhalten. Die App sucht beim Start und danach jede Stunde automatisch nach Updates.</div>'));
  }
  if (tab === 'topbar') {
    const TBD = { enabled: false, delay: 250, size: 'normal', clock: true, corner: false, items: ['store', 'toggleWidgets', 'showDesktop', 'explorer', 'downloads', 'calc', 'snip', 'clipboard', 'play', 'mute', 'wifi', 'settings', 'lock'].map((a) => ({ id: 'tb-' + a, kind: 'action', action: a })) };
    const tb = { ...TBD, ...structuredClone(cfg.topbar || {}) }; tb.items = tb.items || [];
    const save = async (redraw = true) => { cfg.topbar = structuredClone(tb); await api.patch('topbar', cfg.topbar); if (redraw) { const sc = $('#main').scrollTop; go('settings'); $('#main').scrollTop = sc; } };
    B.append(h('<div class="tb-hero"><div class="tb-demo"><div class="tb-edge"></div><div class="tb-mini"><i>🕒</i><i>🛍️</i><i>📁</i><i>✂️</i><i>⏯️</i><i>🔒</i></div><div class="tb-cur">↑</div></div><div><b>Shortcut-Leiste</b><div class="dim" style="font-size:13px;margin-top:4px;line-height:1.45">Fahre mit der Maus ganz an den oberen Bildschirmrand. Dann gleitet eine Leiste mit deinen Lieblings-Funktionen herunter. Geht die Maus weg, verschwindet sie wieder.</div></div></div>'));
    let g = group(B, 'Allgemein');
    srow(g, 'Shortcut-Leiste aktivieren', 'Erscheint am oberen Rand des Hauptbildschirms', tg(tb.enabled, (v) => { tb.enabled = v; save(); }));
    if (tb.enabled) srow(g, 'Ausprobieren', 'Zeigt die Leiste jetzt kurz an', btn('Leiste zeigen', () => api.tbPreview()));
    srow(g, 'Verzögerung', 'Wie lange die Maus am Rand sein muss', seg([[0, 'Sofort'], [250, 'Kurz'], [500, 'Mittel'], [900, 'Lang']], tb.delay, (v) => { tb.delay = +v; save(false); }));
    srow(g, 'Auslösen', 'Wo am oberen Rand die Leiste erscheint', seg([['false', 'Nur in der Mitte'], ['true', 'Ganzer Rand']], String(!!tb.corner), (v) => { tb.corner = v === 'true'; save(false); }));
    srow(g, 'Grösse', '', seg([['compact', 'Kompakt'], ['normal', 'Normal'], ['big', 'Gross']], tb.size, (v) => { tb.size = v; save(false); }));
    srow(g, 'Uhr und Datum anzeigen', 'Links in der Leiste', tg(tb.clock, (v) => { tb.clock = v; save(false); }));
    // Knöpfe der Leiste
    const lb = group(B, `In der Leiste (${tb.items.length})`, 'Mit ↑ und ↓ sortieren. Unten weitere Funktionen hinzufügen.');
    if (!tb.items.length) lb.append(h('<div class="dim" style="padding:14px 16px">Noch keine Knöpfe. Füge unten welche hinzu.</div>'));
    tb.items.forEach((it, i) => {
      const f = tbItemInfo(it), kind = { action: 'Funktion', app: 'Programm', folder: 'Ordner', url: 'Webseite' }[it.kind];
      const nm = h(`<input type="text" value="${esc(it.name || '')}" placeholder="${esc(f.name)}" style="width:150px">`); nm.onchange = () => { it.name = nm.value.trim(); save(false); };
      const r = srow(lb, `<span class="tb-ic">${esc(f.icon)}</span>${esc(f.name)}`, kind + (it.url ? ' · ' + esc(it.url) : it.path ? ' · ' + esc(it.path) : ''), [nm,
        btn('↑', () => { if (i) { [tb.items[i - 1], tb.items[i]] = [tb.items[i], tb.items[i - 1]]; save(); } }), btn('↓', () => { if (i < tb.items.length - 1) { [tb.items[i + 1], tb.items[i]] = [tb.items[i], tb.items[i + 1]]; save(); } }),
        btn('✕', () => { tb.items.splice(i, 1); save(); }, 'dg')]);
      r.classList.add('tb-row');
    });
    // Hinzufügen
    const ab = group(B, 'Funktionen hinzufügen', 'Klicke auf eine Funktion, um sie hinten an die Leiste anzuhängen.');
    const have = new Set(tb.items.filter((x) => x.kind === 'action').map((x) => x.action)), groups = {};
    Object.entries(TB_ACTIONS).forEach(([k, [ic, nm, gr]]) => (groups[gr] = groups[gr] || []).push([k, ic, nm]));
    Object.entries(groups).forEach(([gr, list]) => {
      const wrap = h(`<div class="tb-add"><div class="tb-ag">${gr}</div><div class="tb-chips"></div></div>`);
      list.forEach(([k, ic, nm]) => { const c = h(`<button class="${have.has(k) ? 'on' : ''}" title="${have.has(k) ? 'Schon in der Leiste' : 'Hinzufügen'}"><span>${ic}</span>${nm}${have.has(k) ? ' ✓' : ''}</button>`); c.onclick = () => { if (have.has(k)) return; tb.items.push({ id: 'tb-' + k + '-' + Date.now().toString(36), kind: 'action', action: k }); save(); }; $('.tb-chips', wrap).append(c); });
      ab.append(wrap);
    });
    const own = group(B, 'Eigene Knöpfe');
    srow(own, '🚀 Programm', 'Eine App oder Verknüpfung (.exe, .lnk)', btn('Programm wählen …', async () => { const r = await api.tbPickApp(); if (r) { tb.items.push({ id: 'tb-app-' + Date.now().toString(36), kind: 'app', path: r.path, name: r.name }); save(); } }));
    srow(own, '📂 Ordner', 'Öffnet einen Ordner im Explorer', btn('Ordner wählen …', async () => { const p = await api.pickFolder(); if (p) { tb.items.push({ id: 'tb-dir-' + Date.now().toString(36), kind: 'folder', path: p, name: p.split(/[\\/]/).filter(Boolean).pop() }); save(); } }));
    const un = h('<input type="text" placeholder="Name, z. B. YouTube" style="width:150px">'), uu = h('<input type="text" placeholder="https://…" style="width:200px">');
    srow(own, '🌐 Webseite', 'Öffnet eine Webseite im Browser', [un, uu, btn('Hinzufügen', () => { let u = uu.value.trim(); if (!u) return; if (!/^https?:\/\//i.test(u)) u = 'https://' + u; tb.items.push({ id: 'tb-url-' + Date.now().toString(36), kind: 'url', url: u, name: un.value.trim() || u.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0] }); save(); }, 'p')]);
    const rs = group(B, '');
    srow(rs, 'Auf Standard zurücksetzen', 'Stellt die ursprünglichen Knöpfe wieder her', btn('Zurücksetzen', () => { tb.items = structuredClone(TBD.items); save(); }));
  }
  if (tab === 'look') {
    { const g0 = group(B, 'Fenster'); srow(g0, 'Fensterknöpfe', 'Minimieren, Maximieren und Schliessen', seg([['win', 'Windows (rechts)'], ['mac', 'Mac (links, farbig)']], S.winButtons || 'win', async (v) => { await setS({ winButtons: v }); applyWinButtons(); })); }
    const at = () => ({ ...(cfg.appTheme || { mode: 'dark', accent: '#0a84ff' }) });
    const setT = async (p) => { cfg.appTheme = { ...at(), ...p }; applyAppTheme(); await api.patch('appTheme', cfg.appTheme); go('settings'); };
    let g = group(B, 'App');
    srow(g, 'Erscheinungsbild', 'Hell oder dunkel', seg([['dark', 'Dunkel'], ['light', 'Hell']], at().mode, (v) => setT({ mode: v })));
    const sw = h('<div class="sw"></div>'); APPLE_COLORS.forEach(([n, v]) => { const b = h(`<b title="${n}" style="background:${v}" class="${at().accent.toLowerCase() === v ? 'on' : ''}"></b>`); b.onclick = () => setT({ accent: v }); sw.append(b); });
    srow(g, 'Akzentfarbe', 'Für Knöpfe und Auswahl', sw);
    srow(g, 'Eigene Akzentfarbe', '', colorField(at().accent, debounce((v) => setT({ accent: v }), 300), { swatches: false }));
    g = group(B, 'Widgets');
    srow(g, 'Design aller Widgets', 'Hintergrund, Glas, Farben, Schrift und Ecken', btn('Designs öffnen', () => go('designs'), 'p'));
    const ap = structuredClone(cfg.appearance), sc = ap.schedule, saveAp = () => api.patch('appearance', structuredClone(ap));
    srow(g, 'Tag- und Nacht-Design', 'Wechselt automatisch zwischen zwei Designs', tg(sc.enabled, (v) => { sc.enabled = v; saveAp(); go('settings'); }));
    if (sc.enabled) {
      const tm = (k) => { const e = h(`<input type="time" value="${sc[k]}">`); e.onchange = () => { sc[k] = e.value; saveAp(); }; return e; };
      const ps = (k) => selEl(Object.keys(PRESETS).map((n) => [n, n]), sc[k], (v) => { sc[k] = v; saveAp(); });
      srow(g, 'Tag ab', '', [tm('dayStart'), ps('dayPreset')]); srow(g, 'Nacht ab', '', [tm('nightStart'), ps('nightPreset')]);
    }
    srow(g, 'Akzent folgt dem Hintergrundbild', 'Nimmt die Farbe deines Windows-Hintergrunds', tg(ap.wallpaper.followAccent, (v) => { ap.wallpaper.followAccent = v; saveAp(); }));
    srow(g, 'Animierte Wettereffekte', 'Regen, Wolken und Sterne in den Wetter-Widgets', tg(S.effects, (v) => setS({ effects: v })));
  }
  if (tab === 'desktop') {
    let g = group(B, 'Alle Widgets', 'Im Desktop-Modus liegen die Widgets hinter allen Fenstern, direkt auf dem Hintergrundbild.');
    const allTop = cfg.widgets.length && cfg.widgets.every((w) => w.onTop);
    srow(g, 'Ebene', 'Wo die Widgets liegen', seg([['desk', 'Desktop'], ['top', 'Immer vorne']], allTop ? 'top' : 'desk', (v) => api.setAllOnTop(v === 'top')));
    srow(g, 'Sichtbarkeit', `${cfg.widgets.filter((w) => w.visible !== false).length} von ${cfg.widgets.length} sichtbar`, [btn('Alle einblenden', () => api.setAllVisible(true)), btn('Alle ausblenden', () => api.setAllVisible(false))]);
    srow(g, 'Einzelne Widgets', 'Grösse, Inhalt und Design pro Widget', btn('Meine Widgets', () => go('widgets')));
    g = group(B, 'Anordnen');
    srow(g, 'Am Raster ausrichten', 'Widgets rasten beim Verschieben ein', tg(S.snap, (v) => setS({ snap: v })));
    const gs = h(`<input type="number" min="5" max="200" value="${S.grid || 20}" style="width:80px">`); gs.onchange = () => setS({ grid: Math.max(5, Math.min(200, +gs.value || 20)) });
    srow(g, 'Rastergrösse', 'In Pixeln', gs);
    srow(g, 'Layouts', `${Object.keys(cfg.layouts || {}).length} gespeichert, z. B. «Schule» und «Zuhause»`, btn('Layouts öffnen', () => { pkState.layTab = 'layouts'; go('layouts'); }));
    g = group(B, 'Dock');
    srow(g, 'Dock anzeigen', 'Ein Dock wie beim Mac, zusätzlich zur Taskleiste', tg(cfg.dock.enabled, (v) => api.patch('dock', { ...cfg.dock, enabled: v })));
    srow(g, 'Dock einrichten', 'Programme, Grösse, Position und Farben', btn('Dock öffnen', () => { pkState.layTab = 'dock'; go('layouts'); }));
  }
  if (tab === 'units') {
    let g = group(B, 'Wetter', t('st.locNote'));
    srow(g, t('st.tempUnit'), '', seg([['C', '°C'], ['F', '°F']], S.unitT, (v) => setS({ unitT: v })));
    srow(g, t('st.windUnit'), '', seg([['kmh', 'km/h'], ['mph', 'mph'], ['ms', 'm/s']], S.unitW, (v) => setS({ unitW: v })));
    const rf = h(`<input type="number" min="5" max="180" value="${S.refreshMin || 20}" style="width:80px">`); rf.onchange = () => setS({ refreshMin: Math.max(5, Math.min(180, +rf.value || 20)) });
    srow(g, 'Aktualisieren alle', 'Minuten', rf);
    srow(g, 'Standort', 'Wetter für deinen aktuellen Ort', btn(t('st.locOpen'), () => api.openUrl('ms-settings:privacy-location')));
    g = group(B, 'Zeit und Kalender');
    srow(g, t('st.timeFmt'), '', seg([['auto', 'Auto'], ['24', '24 h'], ['12', '12 h']], S.h12, (v) => setS({ h12: v })));
    srow(g, t('st.weekStart'), '', seg([['mon', 'Montag'], ['sun', 'Sonntag']], S.weekStart, (v) => setS({ weekStart: v })));
  }
  if (tab === 'accounts') {
    const gs = cfg.gcal || {}, ca = cfg.cache || {};
    let g = group(B, 'Konten', 'Die Zugangsdaten bleiben nur auf diesem PC.');
    srow(g, '📆 Google Kalender', gs.ok ? `Verbunden · ${gs.count} Termine` : gs.ok === false ? 'Fehler beim Laden' : 'Nicht verbunden', btn(cfg.settings.icalUrls ? 'Verwalten' : 'Verbinden', () => go('iphone'), cfg.settings.icalUrls ? '' : 'p'));
    if (cfg.settings.icalUrls) srow(g, 'Termine jetzt neu laden', 'Sonst automatisch alle 10 Minuten', btn('Aktualisieren', () => api.gcalSync()));
    srow(g, '☁️ iCloud', ca.connected ? 'Verbunden' + (cfg.icloudUser ? ' als ' + esc(cfg.icloudUser) : '') : 'Nicht verbunden', btn(ca.connected ? 'Verwalten' : 'Verbinden', () => go('iphone'), ca.connected ? '' : 'p'));
  }
  if (tab === 'data') {
    const g = group(B, 'Sicherung', 'Wiederherstellen und Zurücksetzen gibt es unter Support, damit nichts aus Versehen kaputtgeht.');
    const msg = h('<span class="dim"></span>');
    srow(g, t('st.export'), 'Alle Widgets, Designs und Einstellungen als Datei', [msg, btn('Exportieren …', async () => { const r = await api.exportCfg(); msg.textContent = r && r.ok ? t('st.exported') : r && !r.canceled ? r.error : ''; })]);
  }
  if (tab === 'support') supportSettings(B, S);
  if (tab === 'guest') guestSettings(B);
  if (tab === 'about') {
    B.append(h(`<div class="ab"><img src="../../assets/icon.png" alt=""><h3>Jafy Widgets</h3><div class="dim">Version <span id="abv"></span> · ${storeList().length} Widgets im Store</div><div class="dim" style="margin-top:10px">made by Arsenii and Fynn</div></div>`));
    api.updInfo().then((x) => { const e = $('#abv'); if (e) e.textContent = x.version; });
    const g = group(B, 'Quellen'); srow(g, 'Wetterdaten', esc(t('st.attribution')), btn('open-meteo.com', () => api.openUrl('https://open-meteo.com/')));
  }
};

function widgetPanel(host, w) {
  const def = WIDGETS[w.type] || {}; w.props = w.props || {};
  const tab = pkState.wTab || 'content';
  host.innerHTML = '';
  const top = h(`<div class="wp-top"><div class="stage" id="wst"></div><div class="wp-hd"><span class="sw-ic">${def.icon || '▫️'}</span><div style="flex:1;min-width:0"><b>${esc(nameOf(w))}</b><div class="dim">${esc(def.name || '')} · ${w.w} × ${w.h}</div></div><div class="row" id="wact"></div></div></div>`); host.append(top);
  const stage = $('#wst', top);
  const drawPrev = () => { stage.innerHTML = ''; stage.append(preview(w.type, w.w, w.h, mergedTheme(w), w.props, w.data || {}, 420, 220)); }; drawPrev();
  const act = $('#wact', top);
  act.append(tg(w.visible !== false, (v) => { w.visible = v; api.updateWidget(w.id, { visible: v }); }));
  act.firstChild.title = 'Auf dem Desktop anzeigen';
  if (w.type === 'custom') act.append(btn('Bearbeiten', () => go('editor:' + w.id), 'p'));
  act.append(btn('Duplizieren', async () => { const c = await api.duplicateWidget(w.id); selId = c.id; go('widgets'); }), btn('Entfernen', async () => { await api.removeWidget(w.id); selId = null; go('widgets'); }, 'dg'));
  host.append(tabsEl([['content', 'Inhalt'], ['place', 'Grösse & Position'], ['design', 'Design']], tab, (k) => { pkState.wTab = k; widgetPanel(host, w); }));
  const body = h('<div></div>'); host.append(body);
  if (tab === 'content') {
    const g = group(body, '');
    const nm = h(`<input type="text" value="${esc(w.name || '')}" placeholder="${esc(def.name || '')}" style="width:220px">`); nm.onchange = () => { w.name = nm.value; api.updateWidget(w.id, { name: w.name }); };
    srow(g, 'Name', 'Nur für dich, zum Wiederfinden', nm);
    const sets = def.settings || [];
    sets.forEach((s) => {
      const val = w.props[s.key] ?? s.def ?? ''; let e; const save = () => { api.updateWidget(w.id, { props: { ...w.props } }); drawPrev(); };
      if (s.type === 'folder') { e = h(`<div class="row"><small style="color:var(--t2)">${esc(val)}</small><button>Ordner wählen …</button></div>`); $('button', e).onclick = async () => { const p = await api.pickFolder(); if (p) { w.props[s.key] = p; save(); $('small', e).textContent = p; } }; }
      else if (s.type === 'select') { e = selEl(s.options.map(([v, l]) => [v, tl(l)]), val, (v) => { w.props[s.key] = v; save(); }); }
      else if (s.type === 'bool') { e = tg(w.props[s.key] === undefined ? !!s.def : !!w.props[s.key], (v) => { w.props[s.key] = v; save(); }); }
      else if (s.type === 'city') { e = citySearch(w, save, s); e.style.width = '240px'; }
      else if (s.type === 'folders') { e = h('<div style="min-width:240px"></div>'); const fl = () => { e.innerHTML = ''; (w.props.folders || []).forEach((p, i) => { const r = h(`<div class="row" style="margin-bottom:4px;flex-wrap:nowrap"><small style="flex:1;color:var(--t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(p)}">${esc(p)}</small><button class="dg">✕</button></div>`); r.lastChild.onclick = () => { w.props.folders.splice(i, 1); save(); fl(); }; e.append(r); }); const b = h('<button>+ Ordner hinzufügen</button>'); b.onclick = async () => { const p = await api.pickFolder(); if (p) { w.props.folders = [...(w.props.folders || []), p]; save(); fl(); } }; e.append(b); }; fl(); }
      else if (s.type === 'color') { e = colorField(w.props[s.key] || '#ffffff', (v) => { w.props[s.key] = v; save(); }, { swatches: false, reset: () => { delete w.props[s.key]; save(); go('widgets'); } }); }
      else { e = h(`<input type="${s.type === 'number' ? 'number' : s.type === 'date' ? 'date' : 'text'}" style="width:${s.type === 'number' ? 90 : 220}px">`); e.value = val; e.onchange = () => { w.props[s.key] = s.type === 'number' ? +e.value : e.value; save(); }; }
      srow(g, tl(s.label), '', e);
    });
    if (!sets.length) body.append(h('<div class="dim" style="padding:4px 4px 12px">Dieses Widget braucht keine weiteren Einstellungen.</div>'));
  }
  if (tab === 'place') {
    let g = group(body, 'Grösse');
    const sz = h('<div class="seg"></div>'); const sup = WP_SIZES.of(w.type);
    sup.forEach((k) => { const [a, b] = SIZES[k]; const e = h(`<button class="${a === w.w && b === w.h ? 'on' : ''}" title="${a} × ${b}">${SIZE_NAMES[k]}</button>`); e.onclick = () => { [w.w, w.h] = SIZES[k]; api.updateWidget(w.id, { w: w.w, h: w.h }); widgetPanel(host, w); }; sz.append(e); });
    if (sup.length) srow(g, 'Vorgabe', '', sz);
    const wi = h(`<input type="number" style="width:80px" value="${w.w}">`), hi = h(`<input type="number" style="width:80px" value="${w.h}">`);
    wi.onchange = hi.onchange = () => { w.w = Math.max(100, +wi.value); w.h = Math.max(60, +hi.value); api.updateWidget(w.id, { w: w.w, h: w.h }); drawPrev(); };
    srow(g, 'Breite × Höhe', 'In Pixeln', [wi, h('<span class="dim">×</span>'), hi]);
    const sc = h(`<div class="row"><input type="range" min="50" max="200" step="5" value="${Math.round((w.scale || 1) * 100)}"><span style="width:44px">${Math.round((w.scale || 1) * 100)} %</span></div>`);
    sc.firstChild.oninput = () => { const k = +sc.firstChild.value / 100; if (!w.base) w.base = [w.w / (w.scale || 1), w.h / (w.scale || 1)]; w.scale = k; w.w = Math.max(100, Math.round(w.base[0] * k)); w.h = Math.max(60, Math.round(w.base[1] * k)); sc.lastChild.textContent = Math.round(k * 100) + ' %'; wi.value = w.w; hi.value = w.h; api.updateWidget(w.id, { base: w.base, scale: k, w: w.w, h: w.h }); drawPrev(); };
    srow(g, t('set.scale'), 'Alles grösser oder kleiner', sc);
    g = group(body, 'Verhalten');
    srow(g, 'Gesperrt', 'Kann nicht verschoben werden', tg(w.locked, (v) => { w.locked = v; api.updateWidget(w.id, { locked: v }); }));
    srow(g, 'Immer im Vordergrund', 'Liegt über allen Fenstern', tg(w.onTop, (v) => { w.onTop = v; api.updateWidget(w.id, { onTop: v }); }));
    srow(g, 'Nur beim Darüberfahren zeigen', 'Unsichtbar, bis die Maus darüber ist', tg(w.hoverShow, (v) => { w.hoverShow = v; api.updateWidget(w.id, { hoverShow: v }); }));
    srow(g, t('set.clickThrough'), 'Klicks gehen zum Desktop darunter', tg(w.clickThrough, (v) => { w.clickThrough = v; api.updateWidget(w.id, { clickThrough: v }); }));
    const ds = selEl([['', 'Wählen …']], '', (v) => v && api.moveToDisplay(w.id, +v)); api.displays().then((l) => l.forEach((d) => ds.append(new Option(d.name, d.id))));
    srow(g, 'Auf Bildschirm verschieben', '', ds);
  }
  if (tab === 'design') { const c = h('<div class="card"></div>'); c.append(themeSection(w, drawPrev)); body.append(c); }
}


// ---------- Widget Store ----------
const STORE_CATS = [['all', 'Alle', '✨'], ['zeit', 'Uhr & Zeit', '⏰'], ['wetter', 'Wetter & Natur', '🌤️'], ['planung', 'Kalender & Planung', '📅'], ['produktiv', 'Produktivität', '✅'], ['gesundheit', 'Gesundheit', '💚'], ['system', 'System', '🖥️'], ['medien', 'Medien & News', '🎵'], ['finanzen', 'Finanzen', '💰'], ['werkzeuge', 'Werkzeuge', '🧰'], ['spass', 'Spass & Deko', '🎉']];
const STORE_MAP = { zeit: 'clock-digital clock-analog world-clock fy-clock fy-analog', wetter: 'weather sunset temperature fy-weather', planung: 'calendar agenda weekplan dayplan countdown fy-calendar',
  produktiv: 'reminders todo shopping notes goals eisenhower habits pomodoro focus contacts fy-todos fy-notes', system: 'system cpu ram gpu disk netactivity network sysinfo battery screentime fy-system',
  medien: 'music photos news', finanzen: 'stocks', werkzeuge: 'search shortcut calculator clipboard quicksettings', spass: 'quote' };
const STORE_OF = {}; Object.entries(STORE_MAP).forEach(([k, v]) => v.split(' ').forEach((t) => (STORE_OF[t] = k)));
const storeCatOf = (d) => d.scat || STORE_OF[d.id] || 'werkzeuge';
const storeCatName = (k) => (STORE_CATS.find((c) => c[0] === k) || ['', 'Weitere'])[1];
const storeList = () => Object.values(WIDGETS).filter((d) => d.cat !== 'custom' && d.render);
const firstVariant = (def) => (def.variants && def.variants.length ? null : variantsOf(def).find((x) => x.size === def.size && supportedOf(def).includes(x.size))) || variantsOf(def).find((x) => Array.isArray(x.size) || supportedOf(def).includes(x.size)) || variantsOf(def)[0] || { name: '', size: def.size || 'M', props: {} };
const tintOf = (def, v) => ({ ...cfg.theme, ...(def.theme || {}), ...((v && v.theme) || {}) });
async function storeAddDef(def, v, size) {
  v = v || firstVariant(def); const [w, hh] = size ? SIZES[size] : sizeOf(v);
  return api.addWidget({ type: def.id, w, h: hh, props: structuredClone(v.props || {}), theme: tintOf(def, v) });
}
function getBtn(def, v, size) {
  const b = h('<button class="st-get">Laden</button>');
  b.onclick = async (e) => { e.stopPropagation(); b.disabled = true; await storeAddDef(def, v, size && size()); b.classList.add('done'); b.textContent = '✓'; setTimeout(() => { b.disabled = false; b.classList.remove('done'); b.textContent = 'Laden'; }, 1400); };
  return b;
}
function storeCard(def) {
  const v = firstVariant(def), [w, hh] = sizeOf(v);
  const el = h(`<div class="st-card"><div class="st-pv"></div><div class="st-info"><span class="st-ic">${def.icon || '▫️'}</span><div class="st-tx"><b>${esc(def.name)}</b><small>${esc(storeCatName(storeCatOf(def)))}</small></div></div></div>`);
  el.querySelector('.st-pv').append(preview(def.id, w, hh, tintOf(def, v), v.props, {}, 220, 140));
  el.querySelector('.st-info').append(getBtn(def, v));
  el.onclick = () => { pkState.storeSel = def.id; pkState.storeVi = 0; pkState.storeSize = null; go('sw'); };
  return el;
}
const STORE_HERO = ['mw-aquarium', 'fy-weather', 'mw-flip', 'mw-rings', 'calendar', 'mw-lava'];
PAGES.store = (m) => {
  const cat = pkState.storeCat || 'all', q = (pkState.storeQ || '').trim().toLowerCase(), all = storeList();
  const heroId = STORE_HERO[(pkState.heroI || 0) % STORE_HERO.length], hd = WIDGETS[heroId] || all[0];
  m.innerHTML = `<div class="st-hero"><div class="st-hero-tx"><div class="st-kicker">Widget Store · Highlight</div><h2>${esc(hd.name)}</h2><p>${esc(hd.desc || '')}</p><div class="row" id="hb" style="margin-top:16px"></div>
      <div class="st-dots" id="hdots"></div></div><div class="st-hero-pv" id="hpv"></div></div>
    <div class="st-bar"><div><h3 style="margin:0">Alle Widgets</h3><div class="dim">${all.length} Widgets zum Laden</div></div><input type="text" id="sq" placeholder="Im Store suchen …" value="${esc(pkState.storeQ || '')}"></div>
    <div class="st-chips" id="chips"></div><div id="sl"></div>`;
  const hv = firstVariant(hd), [hw, hh2] = sizeOf(hv);
  $('#hpv').append(preview(hd.id, hw, hh2, tintOf(hd, hv), hv.props, {}, 300, 210));
  const hb = $('#hb'); const g1 = getBtn(hd, hv); g1.classList.add('big'); hb.append(g1); const more = h('<button class="st-more">Mehr Designs</button>'); more.onclick = () => { pkState.storeSel = hd.id; pkState.storeVi = 0; pkState.storeSize = null; go('sw'); }; hb.append(more);
  STORE_HERO.forEach((id, i) => { const d = h(`<i class="${id === heroId ? 'on' : ''}"></i>`); d.onclick = () => { pkState.heroI = i; go('store'); }; $('#hdots').append(d); });
  const chips = $('#chips');
  STORE_CATS.forEach(([k, l, ic]) => { const n = k === 'all' ? all.length : all.filter((d) => storeCatOf(d) === k).length; if (!n) return; const b = h(`<button class="${cat === k ? 'on' : ''}"><span>${ic}</span>${l}<small>${n}</small></button>`); b.onclick = () => { pkState.storeCat = k; go('store'); }; chips.append(b); });
  const sl = $('#sl'), match = (d) => !q || (d.name + ' ' + (d.desc || '') + ' ' + storeCatName(storeCatOf(d))).toLowerCase().includes(q);
  const grid = (list) => { const g = h('<div class="st-grid"></div>'); list.forEach((d) => g.append(storeCard(d))); return g; };
  if (q || cat !== 'all') {
    const list = all.filter((d) => (cat === 'all' || storeCatOf(d) === cat) && match(d));
    sl.append(list.length ? grid(list) : h('<div class="dim" style="padding:30px 4px">Nichts gefunden.</div>'));
  } else {
    STORE_CATS.slice(1).forEach(([k, l, ic]) => {
      const list = all.filter((d) => storeCatOf(d) === k); if (!list.length) return;
      const sec = h(`<section class="st-sec"><div class="st-sh"><h3>${ic} ${l}</h3>${list.length > 8 ? `<button class="st-all">Alle ${list.length} anzeigen</button>` : ''}</div></section>`);
      const al = sec.querySelector('.st-all'); if (al) al.onclick = () => { pkState.storeCat = k; go('store'); };
      sec.append(grid(list.slice(0, 8))); sl.append(sec);
    });
  }
  const sq = $('#sq'); sq.oninput = debounce(() => { pkState.storeQ = sq.value; const pos = sq.selectionStart; go('store'); const n = $('#sq'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }, 250);
  const hi = setInterval(() => { if (page !== 'store' || document.activeElement === $('#sq')) return; pkState.heroI = ((pkState.heroI || 0) + 1) % STORE_HERO.length; const sc = $('#main').scrollTop; go('store'); $('#main').scrollTop = sc; }, 9000);
  cleanups.push(() => clearInterval(hi));
};
PAGES.sw = (m) => {
  const def = WIDGETS[pkState.storeSel]; if (!def) return go('store');
  const vs = variantsOf(def).filter((x) => Array.isArray(x.size) || supportedOf(def).includes(x.size)), vi = Math.min(pkState.storeVi || 0, vs.length - 1), v = vs[vi] || firstVariant(def), ov = pkState.storeSize;
  const [w, hh] = ov ? SIZES[ov] : sizeOf(v);
  m.innerHTML = `<button class="st-back" id="stb">‹ Widget Store</button>
    <div class="sw-head"><span class="sw-ic">${def.icon || '▫️'}</span><div style="flex:1"><h2>${esc(def.name)}</h2><div class="dim">${esc(storeCatName(storeCatOf(def)))} · ${vs.length} Design${vs.length === 1 ? '' : 's'}</div></div><div id="ga"></div></div>
    <div class="sw-stage" id="sg"></div><p class="sub" style="margin:14px 0 6px">${esc(def.desc || '')}</p>
    <div class="row" id="szs" style="margin-bottom:6px"></div><h3>Designs</h3><div class="pk-t" id="vt"></div>`;
  $('#stb').onclick = () => go('store');
  $('#sg').append(preview(def.id, w, hh, tintOf(def, v), v.props, {}, 620, 320));
  const add = h('<button class="p sw-add">Hinzufügen</button>'); add.onclick = async () => { await storeAddDef(def, v, ov); add.textContent = '✓ Auf dem Desktop'; setTimeout(() => (add.textContent = 'Hinzufügen'), 1500); }; $('#ga').append(add);
  supportedOf(def).forEach((k) => { const b = h(`<button class="${ov === k || (!ov && v.size === k) ? 'sel' : ''}">${SIZE_NAMES[k]}</button>`); b.onclick = () => { pkState.storeSize = k; go('sw'); }; $('#szs').append(b); });
  vs.forEach((x, i) => { const [a, b] = sizeOf(x); const t = h(`<div class="pk-th ${i === vi ? 'on' : ''}"><div class="pk-tp"></div><small>${esc(x.name)}</small></div>`); t.querySelector('.pk-tp').append(preview(def.id, a, b, tintOf(def, x), x.props, {}, 130, 96)); t.onclick = () => { pkState.storeVi = i; pkState.storeSize = null; go('sw'); }; $('#vt').append(t); });
};


api.getCfg().then((c) => { cfg = c; selId = cfg.ui?.selId || null; applyAppTheme(); applyLang(); go(location.hash.slice(1) || (cfg.settings && cfg.settings.startPage) || 'home'); });
api.onCfg((c) => {
  setTimeout(applyWinButtons, 0);
  const langChanged = cfg && cfg.settings.lang !== c.settings.lang, lockChanged = cfg && !!(cfg.runtime || {}).locked !== !!(c.runtime || {}).locked, adminChanged = cfg && !!(cfg.runtime || {}).admin !== !!(c.runtime || {}).admin; cfg = c; if (langChanged) { applyLang(); return go(page); }
  if (adminChanged && !lockChanged && page === 'settings') return go('settings');
  if (lockChanged) return go(isLocked() ? 'home' : (page === 'unlock' ? 'home' : page));
  if (page === 'tasks') { renderTaskLists(); return; }
  const a = document.activeElement, typing = a && /INPUT|TEXTAREA|SELECT/.test(a.tagName);
  if (page === 'iphone' && !typing) return go('iphone');
  if (!typing && ['home', 'widgets', 'layouts', 'settings'].includes(page)) { const sc = $('#main').scrollTop; go(page); $('#main').scrollTop = sc; $('#main').classList.remove('fade'); }
});
api.onNavigate((p) => { if (p === 'updates') { pkState.setTab = 'update'; pkState.setQ = ''; return go(isLocked() ? 'unlock' : 'settings'); } if (p === 'tbsettings') { pkState.setTab = 'topbar'; return go(isLocked() ? 'unlock' : 'settings'); } go(p); });
// Fensterknöpfe (rot/gelb/grün) – steuern nur dieses Fenster
['r:close', 'y:min', 'g:max'].forEach((x) => { const [k, a] = x.split(':'); const b = document.getElementById('tl-' + k); if (b) b.onclick = (e) => api.winCtl(a === 'max' && e.altKey ? 'full' : a); });
api.onWinState((st) => { document.body.classList.toggle('maxed', st.max || st.full); applyWinButtons(); });
