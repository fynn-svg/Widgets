// Aufgaben-Speicher: reine Funktionen auf dem Konfigurationsobjekt (gut testbar).
// Erledigte Aufgaben werden nie gelöscht, sondern markiert und im Verlauf protokolliert.
const crypto = require('crypto');
const uid = () => crypto.randomUUID();
const addDays = (s, n) => { const d = new Date((s || new Date().toISOString().slice(0, 10)) + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

function ensure(cfg) { cfg.tasks = cfg.tasks || []; cfg.taskLog = cfg.taskLog || []; cfg.tasksRev = cfg.tasksRev || 0; }
function log(cfg, t, action) {
  cfg.taskLog.push({ id: uid(), taskId: t.id, title: t.t, action, at: Date.now() });
  if (cfg.taskLog.length > 1000) cfg.taskLog.splice(0, cfg.taskLog.length - 1000);
}
const find = (cfg, id) => { ensure(cfg); return cfg.tasks.find((t) => t.id === id); };

function add(cfg, p) {
  ensure(cfg); const text = String(p.t || '').trim(); if (!text) return null;
  const t = { id: uid(), t: text, due: p.due || '', prio: Math.max(0, Math.min(3, +p.prio || 0)), rep: p.rep || '', list: p.list || '', done: false, doneAt: 0, createdAt: Date.now() };
  cfg.tasks.push(t); log(cfg, t, 'erstellt'); cfg.tasksRev++; return t;
}
function setDone(cfg, id, done) {
  const t = find(cfg, id); if (!t) return null;
  if (done && t.rep && !t.done) { // wiederkehrend: bleibt aktiv, Fälligkeit rückt vor
    const today = new Date().toISOString().slice(0, 10), base = t.due && t.due > today ? t.due : today;
    t.due = addDays(base, t.rep === 'd' ? 1 : 7); log(cfg, t, 'erledigt (wiederkehrend)');
  } else { t.done = !!done; t.doneAt = done ? Date.now() : 0; log(cfg, t, done ? 'erledigt' : 'wiederhergestellt'); }
  cfg.tasksRev++; return t;
}
function update(cfg, id, p) {
  const t = find(cfg, id); if (!t) return null;
  for (const k of ['t', 'due', 'prio', 'rep', 'list']) if (k in p) t[k] = k === 'prio' ? Math.max(0, Math.min(3, +p[k] || 0)) : String(p[k] ?? '');
  if (!t.t.trim()) t.t = '(ohne Titel)'; cfg.tasksRev++; return t;
}
function remove(cfg, id) { // endgültig löschen
  const t = find(cfg, id); if (!t) return false;
  log(cfg, t, 'endgültig gelöscht'); cfg.tasks = cfg.tasks.filter((x) => x.id !== id); cfg.tasksRev++; return true;
}
// Einmalige Übernahme alter Aufgaben aus den Widget-Daten (Version bis 0.3)
function migrate(cfg) {
  ensure(cfg); let n = 0;
  for (const w of cfg.widgets || []) {
    const items = w.data && w.data.items; if (!Array.isArray(items) || !items.length || !['todo', 'reminders', 'shopping'].includes(w.type)) continue;
    for (const i of items) { const t = add(cfg, { t: i.t, due: i.due, prio: i.prio, rep: i.rep, list: w.type === 'shopping' ? 'Einkauf' : '' }); if (t && i.done) { t.done = true; t.doneAt = Date.now(); } n++; }
    w.data.items = [];
  }
  return n;
}
module.exports = { add, setDone, update, remove, migrate, ensure };
