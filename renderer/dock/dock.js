// Dock-Fenster: Apple-ähnlicher Dock mit Vergrösserung, Laufend-Anzeige, Drag-and-Drop-Sortierung
const root = document.getElementById('root');
let S = null, over = false, hideTimer = null, hiddenNow = false, dragId = null, mouse = null;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function look() { // Aussehen: eigener Dock-Stil oder mit dem globalen Widget-Design synchronisiert
  const d = S.dock, t = d.sync ? { bg1: S.global.bg1, opacity: Math.min(0.9, Math.max(0.2, S.global.opacity)), border: S.global.border, borderOpacity: S.global.borderOpacity, shadow: 40, indicator: S.global.text, blur: 0 } : d.theme;
  return { t, bg: rgba(t.bg1, t.opacity), bd: rgba(t.border, t.borderOpacity) };
}
function render() {
  if (!S) return; const d = S.dock, { t, bg, bd } = look(), vert = d.position === 'left' || d.position === 'right';
  const exact = (t.blur || 0) > 0 && d.magnify <= 1.05 && S.acrylicOk;
  root.className = 'pos-' + d.position + (hiddenNow && d.autoHide ? ' hidden-' + d.position : '');
  const r = root.style; r.setProperty('--s', d.size + 'px'); r.setProperty('--sp', d.spacing + 'px'); r.setProperty('--pad', d.thickness + 'px'); r.setProperty('--rad', d.radius + 'px'); r.setProperty('--bg', exact ? rgba(t.bg1, Math.min(0.55, Math.max(0.1, t.opacity))) : bg); r.setProperty('--bd', bd);
  r.setProperty('--sha', (t.shadow || 0) / 110); r.setProperty('--blur', (t.shadow || 0) * 0.7 + 'px'); r.setProperty('--ind', t.indicator || '#fff'); r.setProperty('--tx', '#fff'); r.setProperty('--bar', (d.size + d.thickness * 2) + 'px');
  const items = S.items.map((it) => `<div class="di ${it.running ? 'run' : ''} ${it.active ? 'act' : ''}" data-id="${it.id}" draggable="true"><div class="tip">${esc(it.name)}</div>${it.icon ? `<img src="${it.icon}" draggable="false">` : `<div class="ph">${esc((it.name || '?')[0].toUpperCase())}</div>`}<i class="dot"></i></div>`).join('');
  root.innerHTML = `<div class="dock ${exact ? 'exact' : ''} ${d.widthMode === 'fixed' ? 'wide' : ''}" ${d.widthMode === 'fixed' ? `style="${vert ? 'height' : 'width'}:${d.widthPx}px"` : ''}>${items || '<div class="empty">+</div>'}</div>`;
  bind();
}
function bind() {
  const dock = root.querySelector('.dock'); if (!dock) return; const d = S.dock;
  dock.querySelectorAll('.di').forEach((el) => {
    el.onclick = () => { el.classList.add('bounce'); setTimeout(() => el.classList.remove('bounce'), 1200); api.dockLaunch(el.dataset.id); };
    el.oncontextmenu = (e) => { e.preventDefault(); api.dockItemMenu(el.dataset.id); };
    el.ondragstart = (e) => { dragId = el.dataset.id; el.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); };
    el.ondragend = () => { el.classList.remove('drag'); const ids = [...dock.querySelectorAll('.di')].map((x) => x.dataset.id); dragId = null; api.dockReorder(ids); };
    el.ondragover = (e) => { e.preventDefault(); if (!dragId || dragId === el.dataset.id) return; const me = dock.querySelector(`.di[data-id="${dragId}"]`); if (!me) return; const rc = el.getBoundingClientRect(), vert = d.position === 'left' || d.position === 'right', after = vert ? e.clientY > rc.top + rc.height / 2 : e.clientX > rc.left + rc.width / 2; dock.insertBefore(me, after ? el.nextSibling : el); };
  });
  dock.ondragover = (e) => e.preventDefault();
  dock.ondrop = (e) => { e.preventDefault(); if (e.dataTransfer.files && e.dataTransfer.files.length) [...e.dataTransfer.files].forEach((f) => { const p = api.pathOf(f); if (p) api.dockAddPath(p); }); };
}
// Vergrösserung wie beim macOS-Dock: Symbole nahe am Mauszeiger wachsen weich
function magnify(ev) {
  const dock = root.querySelector('.dock'); if (!dock || !S) return; const d = S.dock, vert = d.position === 'left' || d.position === 'right', mag = d.magnify;
  const els = [...dock.querySelectorAll('.di')]; if (mag <= 1.02) return;
  els.forEach((el) => { const rc = el.getBoundingClientRect(), base = d.size, c = vert ? rc.top + rc.height / 2 : rc.left + rc.width / 2, p = vert ? ev.clientY : ev.clientX, dist = Math.abs(p - c); const sc = 1 + (mag - 1) * Math.exp(-(dist * dist) / (2 * Math.pow(base * 0.95, 2))); el.style.width = el.style.height = (base * sc) + 'px'; });
}
function resetMag() { root.querySelectorAll('.di').forEach((el) => { el.style.width = el.style.height = ''; }); }
document.addEventListener('mousemove', (e) => {
  const inside = !!document.elementFromPoint(e.clientX, e.clientY)?.closest('.dock'); mouse = e;
  if (inside !== over) { over = inside; api.dockHover(inside); if (!inside) resetMag(); }
  if (inside) { magnify(e); clearTimeout(hideTimer); if (hiddenNow) setHidden(false); }
  else if (S && S.dock.autoHide && !hiddenNow && !dragId) { clearTimeout(hideTimer); hideTimer = setTimeout(() => setHidden(true), 700); }
});
document.addEventListener('mouseenter', () => { if (hiddenNow) setHidden(false); });
document.addEventListener('mouseleave', () => { if (over) { over = false; api.dockHover(false); resetMag(); } if (S && S.dock.autoHide && !hiddenNow) { clearTimeout(hideTimer); hideTimer = setTimeout(() => setHidden(true), 700); } });
function setHidden(v) { if (hiddenNow === v) return; hiddenNow = v; api.dockHidden(v); root.className = 'pos-' + S.dock.position + (v && S.dock.autoHide ? ' hidden-' + S.dock.position : ''); }
async function load() { S = await api.dockGet(); if (!S.dock.autoHide && hiddenNow) { hiddenNow = false; api.dockHidden(false); } if (S.dock.autoHide && !hiddenNow && !over && !window.__init) { window.__init = 1; hiddenNow = true; api.dockHidden(true); } render(); }
api.onDockUpdate(() => { if (!dragId) load(); }); api.onCfg(() => { if (!dragId) load(); }); load();
