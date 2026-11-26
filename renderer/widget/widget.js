const id = new URLSearchParams(location.search).get('id');
const card = document.getElementById('card'), body = document.getElementById('body');
let cfg, cleanup = null, lastSig = '', tasksCb = null, lastRev = -1, refreshCb = null;
const sig = (w) => JSON.stringify([w.type, w.props, w.theme, cfg.theme, cfg.cache?.lastSync, cfg.cache?.connected, cfg.settings.lang, cfg.settings.unitT, cfg.settings.unitW, cfg.settings.h12, cfg.settings.weekStart, cfg.settings.refreshMin, cfg.settings.effects, cfg.runtime, cfg.eventsRev]);

function mount() {
  const w = cfg.widgets.find((x) => x.id === id);
  if (!w) return;
  document.body.classList.toggle('locked', !!w.locked);
  const s = sig(w); if (s === lastSig) return; lastSig = s;
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; } tasksCb = null; refreshCb = null;
  setLang(cfg.settings.lang); const theme = { ...cfg.theme, ...(w.theme || {}) }; applyTheme(card, theme, cfg.runtime); card.querySelectorAll(':scope > .wbgs, :scope > .wfx').forEach((n) => n.remove());
  body.innerHTML = ''; body.removeAttribute('style');
  const def = WIDGETS[w.type];
  if (!def) { body.innerHTML = '<div class="empty">Unbekannter Widget-Typ</div>'; return; }
  const data = w.data || (w.data = {});
  try { cleanup = def.render.call(def, { el: body, w, props: w.props || {}, data, cache: cfg.cache || {}, events: [...(cfg.events || []), ...(cfg.gcalEvents || [])], theme, settings: cfg.settings, runtime: cfg.runtime, onRefresh: (fn) => { refreshCb = fn; }, tasks: cfg.tasks || [], onTasks: (fn) => { tasksCb = fn; }, save: (d) => api.saveData(id, d), api }); }
  catch (e) { body.innerHTML = `<div class="empty">Fehler: ${esc(e.message)}</div>`; }
}

function pushTasks() { if (cfg.tasksRev !== lastRev) { lastRev = cfg.tasksRev; if (tasksCb) tasksCb(cfg.tasks || []); } }
api.getCfg().then((c) => { cfg = c; mount(); lastRev = cfg.tasksRev; });
api.onCfg((c) => { cfg = c; mount(); pushTasks(); });
api.onRefresh(() => { if (refreshCb) refreshCb(); });

function dragger(el, mode) {
  el.addEventListener('pointerdown', (e) => { el.setPointerCapture(e.pointerId); api.dragBegin(id, mode); });
  el.addEventListener('pointermove', (e) => { if (el.hasPointerCapture(e.pointerId)) api.dragMove(); });
  el.addEventListener('pointerup', (e) => { el.releasePointerCapture(e.pointerId); api.dragEnd(); });
}
dragger(document.getElementById('drag'), 'move');
dragger(document.getElementById('grip'), 'resize');
window.addEventListener('contextmenu', (e) => { e.preventDefault(); api.widgetMenu(id); });
