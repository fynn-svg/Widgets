// ---------- Werkzeuge: kleine Tools direkt in der App ----------
const TOOLS = [
  ['picker', '🎨', 'Farbpipette', 'Farbe irgendwo vom Bildschirm aufnehmen'],
  ['qr', '🔳', 'QR-Code', 'Text oder Link als QR-Code'],
  ['convert', '📐', 'Umrechner', 'Länge, Gewicht, Temperatur, Daten …'],
  ['timer', '⏱️', 'Timer & Stoppuhr', 'Countdown mit Ton und Stoppuhr mit Runden'],
  ['password', '🔑', 'Passwort-Generator', 'Sichere Passwörter erstellen'],
  ['text', '🔤', 'Text-Werkzeuge', 'Zählen, Gross/klein, Base64 …'],
  ['clip', '📋', 'Zwischenablage-Verlauf', 'Zuletzt kopierte Texte wiederfinden'],
  ['date', '📅', 'Datumsrechner', 'Tage zwischen Daten, Alter, Datum + Tage'],
  ['percent', '💯', 'Prozent & Trinkgeld', 'Prozente, Rabatt und Rechnung teilen'],
  ['random', '🎲', 'Zufall', 'Zahl, Würfel, Münze, Namen und Teams'],
  ['sys', '🖥️', 'Systeminfo', 'PC, Prozessor, Speicher und IP-Adresse'],
  ['note', '📝', 'Notizblock', 'Schnelle Notiz, wird automatisch gespeichert']
];
const copyTxt = async (t, el) => { try { await navigator.clipboard.writeText(String(t)); if (el) { const o = el.textContent; el.textContent = '✓ Kopiert'; setTimeout(() => (el.textContent = o), 1200); } } catch {} };
const toolCard = (inner) => { const c = h(`<div class="card tl-box">${inner}</div>`); return c; };

PAGES.tools = (m) => {
  const cur = pkState.tool;
  if (!cur || !TOOLS.find((x) => x[0] === cur)) {
    m.innerHTML = '<h2>Werkzeuge</h2><p class="sub">Kleine Helfer für jeden Tag. Alle Werkzeuge kannst du auch in die Shortcut-Leiste legen.</p><div class="tl-grid" id="tg"></div>';
    TOOLS.forEach(([k, i, n, d]) => { const e = h(`<div class="tl-card"><span>${i}</span><b>${n}</b><small>${d}</small></div>`); e.onclick = () => { pkState.tool = k; go('tools'); }; $('#tg').append(e); });
    return;
  }
  const [, ic, nm, ds] = TOOLS.find((x) => x[0] === cur);
  m.innerHTML = `<button class="st-back" id="tb0">‹ Alle Werkzeuge</button><div class="sw-head"><span class="sw-ic">${ic}</span><div style="flex:1"><h2>${nm}</h2><div class="dim">${ds}</div></div></div><div class="st-chips" id="tc"></div><div id="tw"></div>`;
  $('#tb0').onclick = () => { pkState.tool = null; go('tools'); };
  TOOLS.forEach(([k, i, n]) => { const b = h(`<button class="${k === cur ? 'on' : ''}"><span>${i}</span>${n}</button>`); b.onclick = () => { pkState.tool = k; go('tools'); }; $('#tc').append(b); });
  (TOOL_UI[cur] || (() => {}))($('#tw'));
};

const TOOL_UI = {
  picker(w) {
    const hist = (cfg.ui && cfg.ui.colors) || [];
    w.append(toolCard(`<div class="tl-pick"><div class="tl-sw" id="ps"></div><div style="flex:1"><div class="tl-big" id="ph">–</div><div class="dim" id="pr"></div><div class="row" style="margin-top:12px"><button class="p" id="pb">🎨 Farbe aufnehmen</button><button id="pc1">HEX kopieren</button><button id="pc2">RGB kopieren</button></div></div></div>
      <div class="hint" style="margin-top:14px">Klicke auf «Farbe aufnehmen». Danach wird der Mauszeiger zur Lupe. Klicke irgendwo auf dem Bildschirm, auch ausserhalb der App. Mit Esc brichst du ab.</div><h3>Zuletzt aufgenommen</h3><div class="swr tl-hist" id="phs"></div>`));
    let val = hist[0] || null;
    const show = (v) => { if (!v) return; val = v; const { r, g, b } = hexRgb(v); $('#ps').style.background = v; $('#ph').textContent = v.toUpperCase(); const mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255, l = (mx + mn) / 2; $('#pr').textContent = `RGB ${r}, ${g}, ${b} · Helligkeit ${Math.round(l * 100)} %`; };
    const drawHist = () => { const hs = $('#phs'); hs.innerHTML = ''; ((cfg.ui && cfg.ui.colors) || []).forEach((c) => { const i = h(`<i title="${c}" style="background:${c};width:28px;height:28px"></i>`); i.onclick = () => show(c); hs.append(i); }); };
    $('#pb').onclick = async () => { if (!window.EyeDropper) return alert('Die Farbpipette wird hier nicht unterstützt.'); try { const r = await new EyeDropper().open(); show(r.sRGBHex); const list = [r.sRGBHex, ...((cfg.ui && cfg.ui.colors) || []).filter((x) => x !== r.sRGBHex)].slice(0, 16); cfg.ui = { ...(cfg.ui || {}), colors: list }; api.patch('ui', cfg.ui); drawHist(); } catch {} };
    $('#pc1').onclick = (e) => val && copyTxt(val.toUpperCase(), e.target); $('#pc2').onclick = (e) => { if (!val) return; const { r, g, b } = hexRgb(val); copyTxt(`rgb(${r}, ${g}, ${b})`, e.target); };
    show(val); drawHist();
  },
  qr(w) {
    w.append(toolCard(`<div class="tl-qr"><div style="flex:1;min-width:240px"><textarea id="qt" rows="5" style="width:100%" placeholder="Text oder Link, z. B. https://github.com/fynn-svg/Widgets"></textarea>
      <div class="row" style="margin-top:10px"><span class="dim">Grösse</span><input type="range" id="qs" min="4" max="12" value="7"><button id="qc">Bild kopieren</button><button id="qd">Als PNG speichern</button></div><div class="dim" id="qi" style="margin-top:8px"></div></div><div class="tl-qrimg" id="qo"></div></div>`));
    const draw = () => { const t = $('#qt').value.trim(), o = $('#qo'); o.innerHTML = ''; if (!t) { o.innerHTML = '<div class="dim">Vorschau</div>'; return; }
      try { qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8']; const q = qrcode(0, 'M'); q.addData(t); q.make(); const url = q.createDataURL(+$('#qs').value, 4), img = h(`<img src="${url}" alt="QR-Code">`); o.append(img); img.onload = () => { const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0); o.dataset.url = c.toDataURL('image/png'); }; $('#qi').textContent = `${t.length} Zeichen`; } catch { o.innerHTML = '<div class="no">Zu viel Text für einen QR-Code.</div>'; } };
    $('#qt').oninput = debounce(draw, 150); $('#qs').oninput = draw;
    $('#qc').onclick = async (e) => { const u = $('#qo').dataset.url; if (u && await api.toolCopyImage(u)) { e.target.textContent = '✓ Kopiert'; setTimeout(() => (e.target.textContent = 'Bild kopieren'), 1200); } };
    $('#qd').onclick = () => { const u = $('#qo').dataset.url; if (u) api.toolSavePng(u, 'qr-code.png'); };
    draw();
  },
  convert(w) {
    const U = {
      'Länge': { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 },
      'Gewicht': { kg: 1, g: 0.001, mg: 1e-6, t: 1000, lb: 0.45359237, oz: 0.028349523 },
      'Fläche': { 'm²': 1, 'km²': 1e6, 'cm²': 1e-4, ha: 1e4, a: 100, 'ft²': 0.09290304, acre: 4046.8564 },
      'Volumen': { l: 1, ml: 0.001, 'm³': 1000, dl: 0.1, cl: 0.01, gal: 3.785411784, 'Tasse': 0.25 },
      'Geschwindigkeit': { 'km/h': 1, 'm/s': 3.6, mph: 1.609344, Knoten: 1.852 },
      'Daten': { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12, KiB: 1024, MiB: 1048576, GiB: 1073741824 },
      'Zeit': { s: 1, min: 60, h: 3600, Tag: 86400, Woche: 604800, Jahr: 31557600 },
      'Temperatur': { '°C': 'c', '°F': 'f', K: 'k' }
    };
    const st = pkState.conv || (pkState.conv = { cat: 'Länge', a: 'm', b: 'km', v: 1 });
    const box = toolCard('<div class="st-chips" id="cc"></div><div class="tl-conv"><input type="number" id="cv" step="any"><select id="ca"></select><span class="tl-eq">=</span><div class="tl-big" id="cr"></div><select id="cb"></select><button id="cs" title="Tauschen">⇄</button></div><div class="tl-all" id="cl"></div>'); w.append(box);
    Object.keys(U).forEach((k) => { const b = h(`<button class="${k === st.cat ? 'on' : ''}">${k}</button>`); b.onclick = () => { const ks = Object.keys(U[k]); Object.assign(st, { cat: k, a: ks[0], b: ks[1] }); go('tools'); }; $('#cc').append(b); });
    const ks = Object.keys(U[st.cat]); [$('#ca'), $('#cb')].forEach((s, i) => ks.forEach((x) => s.append(new Option(x, x, false, x === (i ? st.b : st.a)))));
    $('#cv').value = st.v;
    const conv = (v, a, b) => { const T = U[st.cat]; if (st.cat === 'Temperatur') { const c = a === '°C' ? v : a === '°F' ? (v - 32) * 5 / 9 : v - 273.15; return b === '°C' ? c : b === '°F' ? c * 9 / 5 + 32 : c + 273.15; } return v * T[a] / T[b]; };
    const fmt = (n) => (Math.abs(n) >= 1e9 || (Math.abs(n) < 1e-4 && n !== 0)) ? n.toExponential(4) : (+n.toPrecision(10)).toLocaleString('de-CH', { maximumFractionDigits: 6 });
    const calc = () => { st.v = +$('#cv').value || 0; st.a = $('#ca').value; st.b = $('#cb').value; $('#cr').textContent = fmt(conv(st.v, st.a, st.b));
      $('#cl').innerHTML = ks.filter((x) => x !== st.a).map((x) => `<div><b>${fmt(conv(st.v, st.a, x))}</b> ${x}</div>`).join(''); };
    $('#cv').oninput = $('#ca').onchange = $('#cb').onchange = calc; $('#cs').onclick = () => { const a = $('#ca').value; $('#ca').value = $('#cb').value; $('#cb').value = a; calc(); }; calc();
  },
  timer(w) {
    const T = window.__tmr || (window.__tmr = { end: 0, left: 0, run: false, sw: 0, swStart: 0, swRun: false, laps: [] });
    w.append(toolCard(`<h3 style="margin-top:0">Timer</h3><div class="tl-big tl-time" id="tt">00:00</div><div class="row" id="tp"></div><div class="row" style="margin-top:10px"><input type="number" id="tm" min="0" placeholder="Min" style="width:80px"><input type="number" id="tsec" min="0" max="59" placeholder="Sek" style="width:80px"><button class="p" id="tgo">Start</button><button id="tst">Stopp</button></div>`));
    w.append(toolCard(`<h3 style="margin-top:0">Stoppuhr</h3><div class="tl-big tl-time" id="sw">00:00.0</div><div class="row"><button class="p" id="sgo">Start</button><button id="slap">Runde</button><button id="srs">Zurücksetzen</button></div><div id="slaps" class="tl-laps"></div>`));
    const f2 = (n) => String(Math.floor(n)).padStart(2, '0'), fmtT = (ms) => { const s = Math.ceil(ms / 1000); return (s >= 3600 ? Math.floor(s / 3600) + ':' : '') + f2((s / 60) % 60) + ':' + f2(s % 60); }, fmtS = (ms) => f2(ms / 60000) + ':' + f2((ms / 1000) % 60) + '.' + Math.floor((ms % 1000) / 100);
    [1, 3, 5, 10, 15, 25, 30, 60].forEach((mn) => { const b = h(`<button>${mn} min</button>`); b.onclick = () => start(mn * 60000); $('#tp').append(b); });
    const beep = () => { try { const ac = new AudioContext(); [0, .35, .7].forEach((t) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ac.destination); g.gain.setValueAtTime(.25, ac.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + t + .3); o.start(ac.currentTime + t); o.stop(ac.currentTime + t + .3); }); } catch {} try { new Notification('⏱️ Timer abgelaufen', { body: 'Deine Zeit ist um.' }); } catch {} };
    const start = (ms) => { T.end = Date.now() + ms; T.run = true; if (!T.iv) T.iv = setInterval(() => { if (T.run && Date.now() >= T.end) { T.run = false; beep(); } }, 250); };
    $('#tgo').onclick = () => { const ms = ((+$('#tm').value || 0) * 60 + (+$('#tsec').value || 0)) * 1000; if (ms > 0) start(ms); }; $('#tst').onclick = () => { T.run = false; T.end = 0; };
    $('#sgo').onclick = () => { if (T.swRun) { T.sw += Date.now() - T.swStart; T.swRun = false; } else { T.swStart = Date.now(); T.swRun = true; } };
    $('#slap').onclick = () => { if (T.swRun) T.laps.unshift(T.sw + Date.now() - T.swStart); };
    $('#srs').onclick = () => { T.sw = 0; T.swRun = false; T.laps = []; };
    const iv = setInterval(() => { const t = $('#tt'); if (!t) return; t.textContent = T.run ? fmtT(T.end - Date.now()) : '00:00'; const cur = T.sw + (T.swRun ? Date.now() - T.swStart : 0); $('#sw').textContent = fmtS(cur); $('#sgo').textContent = T.swRun ? 'Pause' : 'Start';
      $('#slaps').innerHTML = T.laps.map((l, i) => `<div><span class="dim">Runde ${T.laps.length - i}</span><b>${fmtS(l)}</b></div>`).join(''); }, 100);
    cleanups.push(() => clearInterval(iv));
  },
  password(w) {
    const o = pkState.pw || (pkState.pw = { len: 16, up: true, low: true, num: true, sym: true, noAmb: true });
    w.append(toolCard('<div class="tl-pw"><code id="po"></code><button class="p" id="pcp">Kopieren</button><button id="pnew">↻ Neu</button></div><div class="tl-meter"><i id="pm"></i></div><div class="dim" id="pmt"></div><div id="pf" style="margin-top:12px"></div>'));
    const g = group($('#pf'), '');
    const sl = h(`<div class="row"><input type="range" min="6" max="64" value="${o.len}"><b style="width:30px">${o.len}</b></div>`); sl.firstChild.oninput = () => { o.len = +sl.firstChild.value; sl.lastChild.textContent = o.len; gen(); }; srow(g, 'Länge', '', sl);
    [['up', 'Grossbuchstaben (A–Z)'], ['low', 'Kleinbuchstaben (a–z)'], ['num', 'Zahlen (0–9)'], ['sym', 'Sonderzeichen (!#%…)'], ['noAmb', 'Ähnliche Zeichen vermeiden (l, 1, O, 0)']].forEach(([k, l]) => srow(g, l, '', tg(o[k], (v) => { o[k] = v; gen(); })));
    function gen() { let set = ''; if (o.up) set += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; if (o.low) set += 'abcdefghijklmnopqrstuvwxyz'; if (o.num) set += '0123456789'; if (o.sym) set += '!#$%&*+-=?@^_~.:;'; if (o.noAmb) set = set.replace(/[lI1O0o]/g, ''); if (!set) set = 'abcdefghijkmnpqrstuvwxyz';
      const r = new Uint32Array(o.len); crypto.getRandomValues(r); const pw = [...r].map((x) => set[x % set.length]).join(''); $('#po').textContent = pw;
      const bits = Math.round(o.len * Math.log2(set.length)), lv = bits < 50 ? ['Schwach', '#ff453a', 25] : bits < 75 ? ['Mittel', '#ff9f0a', 55] : bits < 100 ? ['Stark', '#30d158', 80] : ['Sehr stark', '#30d158', 100];
      $('#pm').style.cssText = `width:${lv[2]}%;background:${lv[1]}`; $('#pmt').textContent = `${lv[0]} · ${bits} Bit`; }
    $('#pnew').onclick = gen; $('#pcp').onclick = (e) => copyTxt($('#po').textContent, e.target); gen();
  },
  text(w) {
    w.append(toolCard('<textarea id="tx" rows="8" style="width:100%" placeholder="Text hier einfügen …"></textarea><div class="tl-stats" id="ts"></div><div class="row" id="ta" style="margin-top:12px"></div>'));
    const tx = $('#tx'); tx.value = pkState.txt || '';
    const stats = () => { const v = tx.value; pkState.txt = v; const words = (v.match(/\S+/g) || []).length; $('#ts').innerHTML = [[v.length, 'Zeichen'], [v.replace(/\s/g, '').length, 'ohne Leerzeichen'], [words, 'Wörter'], [v ? v.split(/\n/).length : 0, 'Zeilen'], [(v.match(/[.!?]+(\s|$)/g) || []).length, 'Sätze'], [Math.max(1, Math.round(words / 200)) + ' min', 'Lesezeit']].map(([n, l]) => `<div><b>${n}</b><small>${l}</small></div>`).join(''); };
    const b64e = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s))), b64d = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.trim()), (c) => c.charCodeAt(0)));
    [['GROSS', (s) => s.toUpperCase()], ['klein', (s) => s.toLowerCase()], ['Erster Gross', (s) => s.toLowerCase().replace(/(^|\s)(\p{L})/gu, (m, a, b) => a + b.toUpperCase())], ['Leerzeichen säubern', (s) => s.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim()],
      ['Zeilen sortieren', (s) => s.split('\n').sort((a, b) => a.localeCompare(b, 'de')).join('\n')], ['Doppelte Zeilen weg', (s) => [...new Set(s.split('\n'))].join('\n')], ['Umkehren', (s) => [...s].reverse().join('')],
      ['Base64 kodieren', b64e], ['Base64 dekodieren', b64d], ['URL kodieren', encodeURIComponent], ['URL dekodieren', decodeURIComponent]]
      .forEach(([l, f]) => { const b = h(`<button>${l}</button>`); b.onclick = () => { try { tx.value = f(tx.value); stats(); } catch { b.classList.add('dg'); setTimeout(() => b.classList.remove('dg'), 800); } }; $('#ta').append(b); });
    const c = h('<button class="p">Kopieren</button>'); c.onclick = (e) => copyTxt(tx.value, e.target); $('#ta').append(c);
    tx.oninput = stats; stats();
  },
  clip(w) {
    const on = !!cfg.settings.clipHistory;
    const g = group(w, '', 'Der Verlauf bleibt nur im Arbeitsspeicher und wird beim Beenden der App gelöscht. Nichts verlässt deinen PC.');
    srow(g, 'Im Hintergrund aufzeichnen', on ? 'Merkt sich die letzten 50 kopierten Texte, auch wenn dieses Fenster zu ist' : 'Aus: aufgezeichnet wird nur, solange diese Seite offen ist', tg(on, async (v) => { await setS({ clipHistory: v }); go('tools'); }));
    w.append(toolCard('<div class="row" style="margin-bottom:10px"><input type="text" id="cq" placeholder="Im Verlauf suchen …" style="flex:1"><button class="dg" id="cx">Verlauf leeren</button></div><div id="cls"></div>'));
    let last = '';
    const draw = async () => { const list = await api.clipGet(), q = $('#cq') ? $('#cq').value.toLowerCase() : '', l = $('#cls'); if (!l) return;
      const f = list.filter((x) => !q || x.toLowerCase().includes(q)), key = q + '|' + f.join('\u0000'); if (key === last) return; last = key;
      l.innerHTML = f.length ? '' : '<div class="dim">Noch nichts kopiert. Kopiere irgendwo Text mit Strg+C, er erscheint dann hier.</div>';
      f.forEach((x) => { const r = h(`<div class="tl-clip" title="Klicken zum Kopieren"><span>${esc(x.length > 300 ? x.slice(0, 300) + ' …' : x)}</span><small>${x.length} Zeichen</small></div>`); r.onclick = async () => { await api.clipCopy(x); r.classList.add('ok'); setTimeout(() => r.classList.remove('ok'), 700); }; l.append(r); }); };
    $('#cq').oninput = draw; $('#cx').onclick = async () => { await api.clipClear(); draw(); };
    draw(); const iv = setInterval(draw, 1500); cleanups.push(() => clearInterval(iv));
  },
  date(w) {
    const today = new Date().toISOString().slice(0, 10);
    w.append(toolCard(`<h3 style="margin-top:0">Abstand zwischen zwei Daten</h3><div class="row"><input type="date" id="d1" value="${today}"><span>bis</span><input type="date" id="d2"></div><div class="tl-big" id="dr1" style="margin-top:10px">–</div><div class="dim" id="dr1b"></div>`));
    w.append(toolCard(`<h3 style="margin-top:0">Datum plus / minus Tage</h3><div class="row"><input type="date" id="d3" value="${today}"><select id="dop"><option value="1">+</option><option value="-1">−</option></select><input type="number" id="dn" value="30" style="width:90px"><select id="du"><option value="d">Tage</option><option value="w">Wochen</option><option value="m">Monate</option></select></div><div class="tl-big" id="dr2" style="margin-top:10px">–</div>`));
    w.append(toolCard(`<h3 style="margin-top:0">Alter berechnen</h3><div class="row"><span class="dim">Geburtstag</span><input type="date" id="d4"></div><div class="tl-big" id="dr3" style="margin-top:10px">–</div><div class="dim" id="dr3b"></div>`));
    const D = (s) => new Date(s + 'T12:00'), fmt = (d) => d.toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const c1 = () => { if (!$('#d1').value || !$('#d2').value) return; const a = D($('#d1').value), b = D($('#d2').value), days = Math.round((b - a) / 864e5); let wd = 0; for (let d = new Date(Math.min(a, b)); d < Math.max(a, b); d.setDate(d.getDate() + 1)) if (d.getDay() % 6) wd++;
      $('#dr1').textContent = `${days} Tage`; $('#dr1b').textContent = `${(days / 7).toFixed(1)} Wochen · ${wd} Werktage (Mo–Fr)`; };
    const c2 = () => { if (!$('#d3').value) return; const d = D($('#d3').value), n = +$('#dn').value * +$('#dop').value, u = $('#du').value; if (u === 'd') d.setDate(d.getDate() + n); if (u === 'w') d.setDate(d.getDate() + n * 7); if (u === 'm') d.setMonth(d.getMonth() + n); $('#dr2').textContent = fmt(d); };
    const c3 = () => { if (!$('#d4').value) return; const b = D($('#d4').value), n = new Date(); let y = n.getFullYear() - b.getFullYear(); const had = n.getMonth() > b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() >= b.getDate()); if (!had) y--;
      const nx = new Date(n.getFullYear() + (had ? 1 : 0), b.getMonth(), b.getDate(), 12), dd = Math.ceil((nx - n) / 864e5); $('#dr3').textContent = `${y} Jahre`; $('#dr3b').textContent = `${Math.floor((n - b) / 864e5).toLocaleString('de-CH')} Tage alt · nächster Geburtstag in ${dd} Tagen (${fmt(nx)})`; };
    ['d1', 'd2'].forEach((i) => ($('#' + i).oninput = c1)); ['d3', 'dop', 'dn', 'du'].forEach((i) => ($('#' + i).oninput = c2)); $('#d4').oninput = c3; c2();
  },
  percent(w) {
    const n = (id) => +String($('#' + id).value).replace(',', '.') || 0, f = (x) => (+x.toFixed(2)).toLocaleString('de-CH');
    w.append(toolCard('<h3 style="margin-top:0">Prozentrechner</h3><div class="tl-pc"><div><input id="p1" value="20" inputmode="decimal"> % von <input id="p2" value="150" inputmode="decimal"> = <b id="pr1"></b></div><div><input id="p3" value="30" inputmode="decimal"> ist wie viel % von <input id="p4" value="120" inputmode="decimal"> = <b id="pr2"></b></div><div>Von <input id="p5" value="80" inputmode="decimal"> auf <input id="p6" value="100" inputmode="decimal"> = <b id="pr3"></b></div><div>Preis <input id="p7" value="59.90" inputmode="decimal"> mit <input id="p8" value="25" inputmode="decimal"> % Rabatt = <b id="pr4"></b></div></div>'));
    w.append(toolCard('<h3 style="margin-top:0">Trinkgeld und Rechnung teilen</h3><div class="tl-pc"><div>Rechnung <input id="t1" value="84.50" inputmode="decimal"> Trinkgeld <input id="t2" value="10" inputmode="decimal"> % Personen <input id="t3" value="3" inputmode="decimal"></div></div><div class="tl-stats" id="tr"></div>'));
    const calc = () => { $('#pr1').textContent = f(n('p1') * n('p2') / 100); $('#pr2').textContent = n('p4') ? f(n('p3') / n('p4') * 100) + ' %' : '–'; $('#pr3').textContent = n('p5') ? (n('p6') >= n('p5') ? '+' : '') + f((n('p6') - n('p5')) / n('p5') * 100) + ' %' : '–'; $('#pr4').textContent = f(n('p7') * (1 - n('p8') / 100)) + ` (du sparst ${f(n('p7') * n('p8') / 100)})`;
      const tip = n('t1') * n('t2') / 100, tot = n('t1') + tip, p = Math.max(1, Math.round(n('t3'))); $('#tr').innerHTML = [[f(tip), 'Trinkgeld'], [f(tot), 'Total'], [f(tot / p), 'pro Person'], [f(Math.ceil(tot / p)), 'pro Person (aufgerundet)']].map(([a, b]) => `<div><b>${a}</b><small>${b}</small></div>`).join(''); };
    w.querySelectorAll('input').forEach((i) => (i.oninput = calc)); calc();
  },
  random(w) {
    const R = (a, b) => { const r = new Uint32Array(1); crypto.getRandomValues(r); return a + (r[0] % (b - a + 1)); };
    w.append(toolCard('<h3 style="margin-top:0">Zufallszahl</h3><div class="row"><span class="dim">von</span><input type="number" id="r1" value="1" style="width:90px"><span class="dim">bis</span><input type="number" id="r2" value="100" style="width:90px"><button class="p" id="rg">Würfeln</button><div class="tl-big" id="rr" style="margin-left:14px">–</div></div>'));
    w.append(toolCard('<h3 style="margin-top:0">Würfel und Münze</h3><div class="row"><button id="rd">🎲 Würfeln</button><button id="rd2">🎲🎲 Zwei Würfel</button><button id="rc">🪙 Münze werfen</button><div class="tl-big" id="rdr" style="margin-left:14px">–</div></div>'));
    w.append(toolCard('<h3 style="margin-top:0">Namen auslosen und Teams</h3><textarea id="rn" rows="5" style="width:100%" placeholder="Ein Name pro Zeile"></textarea><div class="row" style="margin-top:10px"><button class="p" id="rpick">Einen Namen ziehen</button><span class="dim">Teams:</span><input type="number" id="rtn" value="2" min="2" style="width:70px"><button id="rteam">Teams einteilen</button></div><div id="rno" class="tl-teams"></div>'));
    $('#rg').onclick = () => { const a = Math.min(+$('#r1').value, +$('#r2').value), b = Math.max(+$('#r1').value, +$('#r2').value); $('#rr').textContent = R(a, b); };
    const F = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']; $('#rd').onclick = () => { const x = R(1, 6); $('#rdr').textContent = F[x - 1] + ' ' + x; }; $('#rd2').onclick = () => { const a = R(1, 6), b = R(1, 6); $('#rdr').textContent = `${F[a - 1]} ${F[b - 1]} = ${a + b}`; }; $('#rc').onclick = () => ($('#rdr').textContent = R(0, 1) ? 'Kopf' : 'Zahl');
    const names = () => $('#rn').value.split('\n').map((s) => s.trim()).filter(Boolean); $('#rn').value = pkState.rnames || ''; $('#rn').oninput = () => (pkState.rnames = $('#rn').value);
    $('#rpick').onclick = () => { const n = names(); if (n.length) $('#rno').innerHTML = `<div class="tl-big">🎉 ${esc(n[R(0, n.length - 1)])}</div>`; };
    $('#rteam').onclick = () => { const n = names(); const k = Math.max(2, +$('#rtn').value || 2); for (let i = n.length - 1; i > 0; i--) { const j = R(0, i); [n[i], n[j]] = [n[j], n[i]]; } const t = Array.from({ length: k }, () => []); n.forEach((x, i) => t[i % k].push(x));
      $('#rno').innerHTML = t.map((m, i) => `<div class="card"><b>Team ${i + 1}</b><div class="dim">${m.map(esc).join('<br>') || '–'}</div></div>`).join(''); };
  },
  async sys(w) {
    const s = await api.toolSys(); const gb = (b) => (b / 1073741824).toFixed(1) + ' GB', up = (x) => `${Math.floor(x / 86400)} Tage ${Math.floor((x % 86400) / 3600)} Std ${Math.floor((x % 3600) / 60)} Min`;
    const g = group(w, 'Dieser PC');
    [['Name', s.host], ['System', s.os], ['Prozessor', `${s.cpu} (${s.cores} Kerne)`], ['Arbeitsspeicher', `${gb(s.memTotal - s.memFree)} von ${gb(s.memTotal)} belegt`], ['Läuft seit', up(s.uptime)], ['Benutzer', s.user]].forEach(([a, b]) => srow(g, a, '', h(`<span class="dim">${esc(b)}</span>`)));
    const n = group(w, 'Netzwerk', 'Die lokale IP-Adresse gilt nur in deinem Heim- oder Schulnetz.');
    if (!s.net.length) srow(n, 'Keine Verbindung', '', null);
    s.net.forEach((x) => { const b = btn('Kopieren', (e) => copyTxt(x.ip, e.target)); srow(n, esc(x.name), 'IPv4 ' + esc(x.ip), b); });
    const a = group(w, 'Jafy Widgets'); srow(a, 'Version', '', h(`<span class="dim">${esc(s.app)}</span>`)); srow(a, 'Widgets', '', h(`<span class="dim">${cfg.widgets.length} angelegt, ${storeList().length} im Store</span>`));
  },
  note(w) {
    const box = toolCard('<textarea id="nt" rows="16" style="width:100%;font-size:15px;line-height:1.5" placeholder="Schreib einfach los …"></textarea><div class="row" style="margin-top:8px"><span class="dim" id="ns"></span><span style="flex:1"></span><button id="nc">Kopieren</button><button class="dg" id="nx">Leeren</button></div>'); w.append(box);
    const t = $('#nt'); t.value = (cfg.ui && cfg.ui.quickNote) || '';
    const save = debounce(() => { cfg.ui = { ...(cfg.ui || {}), quickNote: t.value }; api.patch('ui', cfg.ui); $('#ns').textContent = 'Gespeichert ' + new Date().toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }); }, 500);
    t.oninput = save; $('#nc').onclick = (e) => copyTxt(t.value, e.target); $('#nx').onclick = () => { if (confirm('Notiz wirklich leeren?')) { t.value = ''; save(); } }; t.focus();
  }
};
