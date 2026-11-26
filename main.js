const { clipboard, app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, dialog, shell, safeStorage, powerMonitor, net } = require('electron');
const { execFile, spawn } = require('child_process');
const dav = require('./dav');
const tasks = require('./tasks');
const gcal = require('./gcal');
const desk = require('./desktop');
const path = require('path');
const fs = require('fs');
const os = require('os');
const updater = require('./updater');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

const startHidden = process.argv.includes('--hidden');
if (process.platform === 'win32') app.setAppUserModelId('ch.jafy.widgets');
// Umbenennung «Apple Widgets» → «Jafy Widgets»: Widgets und Einstellungen aus dem alten Ordner übernehmen
try {
  const NEWD = app.getPath('userData'), OLDD = path.join(app.getPath('appData'), 'Apple Widgets');
  if (!fs.existsSync(path.join(NEWD, 'config.json')) && fs.existsSync(path.join(OLDD, 'config.json'))) {
    fs.mkdirSync(NEWD, { recursive: true });
    for (const e of fs.readdirSync(OLDD, { withFileTypes: true })) { const a = path.join(OLDD, e.name), b = path.join(NEWD, e.name);
      if (e.isFile()) fs.copyFileSync(a, b); else if (e.isDirectory() && /^(Local Storage|IndexedDB)$/.test(e.name)) fs.cpSync(a, b, { recursive: true }); }
  }
} catch (e) { /* nicht kritisch */ }
if (!app.requestSingleInstanceLock()) { app.quit(); } else { boot(); }

// Native Windows-Funktionen (nur unter Windows verfügbar; ohne sie laufen die Widgets trotzdem)
let WIN = null;
try {
  const koffi = require('koffi'); const u = koffi.load('user32.dll');
  WIN = { setPos: u.func('bool __stdcall SetWindowPos(uintptr_t, uintptr_t, int, int, int, int, uint)'), key: u.func('void __stdcall keybd_event(uint8_t, uint8_t, uint32_t, uintptr_t)') };
} catch { WIN = null; }
function pushBottom(win) { // Widget unter alle anderen Fenster legen (Desktop-Modus)
  try { if (WIN && !win.isDestroyed()) WIN.setPos(Number(win.getNativeWindowHandle().readBigUInt64LE(0)), 1, 0, 0, 0, 0, 0x13); } catch {}
}
// ---------- Gäste-Modus: gesperrte Funktionen ----------
let lockUnlocked = false;
const isLocked = () => !!(cfg && cfg.lock && cfg.lock.enabled && cfg.lock.hash && !lockUnlocked);
const LOCK_BLOCK = new Set(['widget:add', 'widget:update', 'widget:remove', 'widget:duplicate', 'widget:toDisplay', 'widgets:allOnTop', 'widgets:allVisible', 'layout:save', 'layout:apply',
  'drag:begin', 'widget:menu', 'autostart:set', 'app:reset', 'app:openData', 'cfg:import', 'cfg:export', 'icloud:connect', 'icloud:disconnect', 'gcal:set', 'gcal:sync',
  'dock:reorder', 'dock:remove', 'dock:addPath', 'dock:pickApp', 'dock:itemMenu', 'tb:pickApp', 'upd:install', 'focus:set', 'pick:folder', 'pick:image']);
{ const _h = ipcMain.handle.bind(ipcMain), _o = ipcMain.on.bind(ipcMain);
  ipcMain.handle = (ch, fn) => _h(ch, (e, ...a) => (LOCK_BLOCK.has(ch) && isLocked() ? null : fn(e, ...a)));
  ipcMain.on = (ch, fn) => _o(ch, (e, ...a) => { if (LOCK_BLOCK.has(ch) && isLocked()) return; return fn(e, ...a); }); }
const WPS = require('./renderer/shared/sizes.js'); const SIZES = WPS.dims;

const DEFAULTS = {
  settings: { autostart: true, snap: false, grid: 20, lang: 'de', unitT: 'C', unitW: 'kmh', h12: 'auto', weekStart: 'mon', refreshMin: 20, effects: false },
  theme: {
    bg1: '#1c1c1e', bg2: '#3a3a3c', gradient: false, angle: 135, opacity: 0.55,
    text: '#ffffff', accent: '#0a84ff', icon: '#ffffff', btn: '#0a84ff', progress: '#30d158',
    border: '#ffffff', borderOpacity: 0.12, radius: 22, acrylic: false,
    font: "'Segoe UI Variable Display','Segoe UI',system-ui,sans-serif"
  },
  widgets: [], layouts: {}, templates: [], cache: {}, events: [], eventsRev: 0, dock: { enabled: false, position: 'bottom', display: 'primary', autoHide: false, size: 56, spacing: 10, magnify: 1.6, thickness: 10, widthMode: 'auto', widthPx: 640, radius: 24, sync: false, showRunning: true, theme: { bg1: '#1c1c1e', opacity: 0.45, border: '#ffffff', borderOpacity: 0.18, shadow: 40, indicator: '#ffffff', blur: 0, preset: 'Apple Dark' }, items: [] }, appearance: { schedule: { enabled: false, dayStart: '07:00', nightStart: '19:00', dayPreset: 'Apple Light', nightPreset: 'Apple Dark', alsoDock: true }, wallpaper: { follow: false } }, gcalEvents: [], gcal: {}, tasks: [], taskLog: [], tasksRev: 0, ui: { selId: null }, appTheme: { mode: 'dark', accent: '#0a84ff' }, icloudUser: '', screentime: { date: '', secs: Array(24).fill(0) }
};

const ACRYLIC_OK = process.platform === 'win32' && (parseInt((os.release().split('.')[2]) || '0', 10) >= 22621);
let cfg, saveTimer, mainWin = null, tray = null, drag = null, allHidden = false;
const widgetWins = new Map();
const uid = () => crypto.randomUUID();
const cfgFile = () => path.join(app.getPath('userData'), 'config.json');

function loadCfg() {
  try {
    const j = JSON.parse(fs.readFileSync(cfgFile(), 'utf8'));
    return { ...structuredClone(DEFAULTS), ...j, settings: { ...DEFAULTS.settings, ...j.settings }, theme: { ...DEFAULTS.theme, ...j.theme }, dock: { ...DEFAULTS.dock, ...(j.dock || {}), theme: { ...DEFAULTS.dock.theme, ...((j.dock || {}).theme || {}) } }, appearance: { schedule: { ...DEFAULTS.appearance.schedule, ...((j.appearance || {}).schedule || {}) }, wallpaper: { ...DEFAULTS.appearance.wallpaper, ...((j.appearance || {}).wallpaper || {}) } } };
  } catch { return structuredClone(DEFAULTS); }
}
function writeCfgNow() {
  try {
    fs.mkdirSync(path.dirname(cfgFile()), { recursive: true });
    const { runtime, ...persist } = cfg; const tmp = cfgFile() + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(persist, null, 2)); fs.renameSync(tmp, cfgFile()); // atomar: keine halb geschriebene Datei
  } catch (e) { logErr('Speichern', e); }
}
function saveCfg() { clearTimeout(saveTimer); saveTimer = setTimeout(writeCfgNow, 120); }
function logErr(where, e) {
  try { fs.appendFileSync(path.join(app.getPath('userData'), 'log.txt'), `${new Date().toISOString()} ${where}: ${e && e.stack || e}\n`); } catch {}
}
process.on('uncaughtException', (e) => logErr('uncaughtException', e));
process.on('unhandledRejection', (e) => logErr('unhandledRejection', e));
const find = (id) => cfg.widgets.find((w) => w.id === id);
const allWins = () => [mainWin, ...widgetWins.values()].filter((w) => w && !w.isDestroyed());
const pubCfg = () => ({ ...cfg, lock: { enabled: !!(cfg.lock && cfg.lock.enabled), allow: (cfg.lock && cfg.lock.allow) || {} } }); // PIN-Hash bleibt im Hauptprozess
const broadcast = () => { const c = pubCfg(); allWins().forEach((w) => w.webContents.send('cfg', c)); };

function ensureVisible(w) {
  const ds = screen.getAllDisplays();
  const inside = ds.some((d) => {
    const b = d.workArea;
    return w.x + 40 > b.x && w.x < b.x + b.width - 40 && w.y + 20 > b.y && w.y < b.y + b.height - 20;
  });
  if (!inside) { const b = screen.getPrimaryDisplay().workArea; w.x = b.x + 60; w.y = b.y + 60; }
}
function applyMaterial(w, win) {
  try { win.setBackgroundMaterial(ACRYLIC_OK && (w.theme?.acrylic ?? cfg.theme.acrylic) ? 'acrylic' : 'none'); } catch { }
  try { win.setIgnoreMouseEvents(!!w.clickThrough, { forward: true }); } catch { }
}
function openWidget(w) {
  if (widgetWins.has(w.id) || w.visible === false) return;
  ensureVisible(w);
  const win = new BrowserWindow({
    x: w.x, y: w.y, width: w.w, height: w.h, minWidth: 100, minHeight: 60,
    frame: false, transparent: true, hasShadow: false, skipTaskbar: true, resizable: false, type: 'toolbar',
    maximizable: false, minimizable: false, fullscreenable: false, show: false,
    backgroundColor: '#00000000',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.setAlwaysOnTop(!!w.onTop, 'floating');
  win.loadFile(path.join(__dirname, 'renderer/widget/widget.html'), { query: { id: w.id } });
  win.once('ready-to-show', () => { const q = find(w.id); if (q && !q.onTop) desk.pin(win); if (!allHidden) win.showInactive(); });
  win.on('closed', () => widgetWins.delete(w.id));
  win.on('focus', () => { const q = find(w.id); if (q && !q.onTop) setTimeout(() => pushBottom(win), 30); });
  win.on('show', () => { const q = find(w.id); if (q && !q.onTop) pushBottom(win); });
  widgetWins.set(w.id, win);
  applyMaterial(w, win);
}
function reconcile() {
  const ids = new Set(cfg.widgets.map((w) => w.id));
  for (const [id, win] of widgetWins) if (!ids.has(id)) { win.destroy(); widgetWins.delete(id); }
  for (const w of cfg.widgets) {
    const win = widgetWins.get(w.id);
    if (w.visible === false) { if (win) { win.destroy(); widgetWins.delete(w.id); } continue; }
    if (!win) { openWidget(w); continue; }
    const b = win.getBounds();
    if (Math.abs(b.x - w.x) > 1 || Math.abs(b.y - w.y) > 1 || Math.abs(b.width - w.w) > 1 || Math.abs(b.height - w.h) > 1)
      win.setBounds({ x: w.x, y: w.y, width: w.w, height: w.h });
    win.setAlwaysOnTop(!!w.onTop, 'floating');
    if (!!w.onTop !== !!win._onTop) { win._onTop = !!w.onTop; if (w.onTop) desk.unpin(win); else desk.pin(win); }
    if (!w.onTop) pushBottom(win);
    applyMaterial(w, win);
  }
  broadcast(); saveCfg();
}
function openMain(page) {
  if (mainWin && !mainWin.isDestroyed()) { if (mainWin.isMinimized()) mainWin.restore(); mainWin.show(); mainWin.focus(); if (page) mainWin.webContents.send('navigate', page); return; }
  mainWin = new BrowserWindow({
    width: 1240, height: 800, minWidth: 980, minHeight: 640, title: 'Jafy Widgets', show: false,
    frame: false, skipTaskbar: false, backgroundColor: '#161618', icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  mainWin.loadFile(path.join(__dirname, 'renderer/app/index.html'), { hash: page || 'home' });
  mainWin.once('ready-to-show', () => mainWin.show());
  mainWin.on('closed', () => { mainWin = null; if (lockUnlocked) { lockUnlocked = false; lockApply(); } });
  const st = () => { if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send('win:state', { max: mainWin.isMaximized(), full: mainWin.isFullScreen() }); };
  ['maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen'].forEach((ev) => mainWin.on(ev, st));
  mainWin.on('closed', () => { mainWin = null; });
}
// Die drei Fensterknöpfe steuern ausschliesslich das Fenster, von dem der Klick kommt (nie ein Widget, nie Windows selbst).
ipcMain.on('win:ctl', (e, action) => {
  const win = BrowserWindow.fromWebContents(e.sender); if (!win || win !== mainWin) return;
  if (process.env.WP_TEST) console.log('WINCTL', action);
  if (action === 'close') win.close();
  else if (action === 'min') win.minimize();
  else if (action === 'max') { if (win.isFullScreen()) win.setFullScreen(false); else if (win.isMaximized()) win.unmaximize(); else win.maximize(); }
  else if (action === 'full') win.setFullScreen(!win.isFullScreen());
});
function applyAutostart() {
  if (!app.isPackaged) return;
  app.setLoginItemSettings({ openAtLogin: !!cfg.settings.autostart, args: ['--hidden'] });
}
['en', 'de', 'ru'].forEach((l) => require('./renderer/shared/locales/' + l + '.js'));
const tt = (k) => (globalThis.LOCALES[cfg.settings.lang] || globalThis.LOCALES.de)[k] || k;
function updateTray() {
  if (!tray) return;
  if (isLocked()) return tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Jafy Widgets öffnen', click: () => openMain('home') },
    { label: tt('tray.hide'), click: toggleAllHidden },
    { type: 'separator' },
    { label: '🔒 Entsperren …', click: () => openMain('unlock') }
  ]));
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: tt('tray.settings'), click: () => openMain('settings') },
    { label: tt('tray.add'), click: () => openMain('store') },
    { label: tt('tray.refresh'), click: () => { locCache = { t: 0, v: null }; refreshAll(); } },
    { label: tt('tray.startup'), type: 'checkbox', checked: !!cfg.settings.autostart, click: (i) => { cfg.settings.autostart = i.checked; applyAutostart(); saveCfg(); broadcast(); } },
    { label: tt('tray.hide'), click: toggleAllHidden },
    { label: 'Dock', type: 'checkbox', checked: !!cfg.dock.enabled, click: (i) => { cfg.dock.enabled = i.checked; applyDock(); saveCfg(); broadcast(); } },
    { label: tt('tray.clickthrough'), click: () => { cfg.widgets.forEach((w) => (w.clickThrough = false)); reconcile(); } },
    { type: 'separator' },
    { label: tt('tray.exit'), click: () => app.exit(0) }
  ]));
}
function toggleAllHidden() {
  allHidden = !allHidden;
  for (const win of widgetWins.values()) allHidden ? win.hide() : win.showInactive();
}
function boot() {
  app.on('second-instance', () => { if (splashWin) return; showSplash(() => openMain()); });
  app.on('window-all-closed', () => { /* im Hintergrund weiterlaufen */ });
  app.on('before-quit', () => { clearTimeout(saveTimer); if (cfg) writeCfgNow(); });
  app.whenReady().then(() => {
    cfg = loadCfg(); cfg.runtime = { acrylicOk: ACRYLIC_OK }; tasks.ensure(cfg); if (tasks.migrate(cfg)) writeCfgNow();
    applyAutostart();
    for (const w of cfg.widgets) openWidget(w);
    tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'assets/icon.png')).resize({ width: 20, height: 20 }));
    tray.setToolTip('Jafy Widgets');
    updateTray();
    tray.on('click', () => openMain());
    const wantMain = !startHidden || cfg.widgets.length === 0;
    showSplash(() => { if (wantMain) openMain(process.env.WP_PAGE); });
    startGcal();
    if (!process.env.AW_CAPTURE && cfg.settings.autoUpdateCheck !== false) { setTimeout(updCheck, 8000); setInterval(updCheck, 6 * 3600 * 1000); }
    if (process.env.AW_CAPTURE) startCapture();
    applyDock(); startDockPolling(); applyTopbar(); startSchedule(); clipEnsure(cfg.settings); lockApply();
    startIcloud(); startScreentime();
  });
}

// ---------- IPC ----------
ipcMain.handle('cfg:get', () => pubCfg());
ipcMain.handle('cfg:patch', (_e, key, value) => {
  if (!['settings', 'theme', 'layouts', 'templates', 'appTheme', 'ui', 'dock', 'appearance', 'topbar'].includes(key)) return;
  if (isLocked() && key !== 'ui') return pubCfg();
  if (key === 'settings') clipEnsure(value);
  cfg[key] = value; if (key === 'settings') { applyAutostart(); updateTray(); } if (key === 'dock') applyDock(); if (key === 'topbar' || key === 'theme' || key === 'appTheme') applyTopbar(); if (key === 'appearance') { lastNight = null; scheduleTick(); followWallpaper(); } reconcile(); return pubCfg();
});
ipcMain.handle('widget:add', (_e, w) => {
  const [dw, dh] = SIZES[w.size || 'M'];
  const wa = screen.getPrimaryDisplay().workArea;
  const n = cfg.widgets.length;
  const nw = { id: uid(), type: w.type, name: w.name || '', x: wa.x + 80 + (n % 8) * 36, y: wa.y + 80 + (n % 8) * 36,
    w: w.w || dw, h: w.h || dh, visible: true, locked: false, onTop: false, theme: w.theme || null, props: w.props || {}, data: w.data || {} };
  cfg.widgets.push(nw); reconcile(); return nw;
});
ipcMain.handle('widget:update', (_e, id, p) => {
  const w = find(id); if (!w) return; Object.assign(w, p); reconcile(); return w;
});
ipcMain.handle('widget:remove', (_e, id) => { cfg.widgets = cfg.widgets.filter((w) => w.id !== id); reconcile(); });
ipcMain.handle('widget:duplicate', (_e, id) => {
  const w = find(id); if (!w) return;
  const c = structuredClone(w); c.id = uid(); c.x += 28; c.y += 28; c.locked = false;
  cfg.widgets.push(c); reconcile(); return c;
});
ipcMain.on('widget:data', (_e, id, d) => { const w = find(id); if (w) { w.data = d; saveCfg(); } });
ipcMain.handle('widget:toDisplay', (_e, id, did) => {
  const w = find(id); const d = screen.getAllDisplays().find((x) => x.id === did); if (!w || !d) return;
  w.x = d.workArea.x + 60; w.y = d.workArea.y + 60; reconcile();
});
ipcMain.handle('widgets:allOnTop', (_e, on) => { cfg.widgets.forEach((w) => (w.onTop = on)); reconcile(); });
ipcMain.handle('widgets:allVisible', (_e, on) => { cfg.widgets.forEach((w) => (w.visible = on)); reconcile(); });
ipcMain.handle('layout:save', (_e, name) => {
  cfg.layouts[name] = cfg.widgets.map(({ id, x, y, w, h, visible, onTop, locked }) => ({ id, x, y, w, h, visible, onTop, locked }));
  cfg.layoutDocks = cfg.layoutDocks || {}; cfg.layoutDocks[name] = structuredClone(cfg.dock); // Dock gehört zum Profil
  saveCfg(); broadcast();
});
ipcMain.handle('layout:apply', (_e, name) => {
  const l = cfg.layouts[name]; if (!l) return;
  for (const w of cfg.widgets) { const s = l.find((q) => q.id === w.id); if (s) Object.assign(w, s); else w.visible = false; }
  if (cfg.layoutDocks && cfg.layoutDocks[name]) { cfg.dock = structuredClone(cfg.layoutDocks[name]); applyDock(); }
  reconcile();
});

ipcMain.on('drag:begin', (_e, id, mode) => {
  const w = find(id), win = widgetWins.get(id);
  if (!w || !win || w.locked) return;
  drag = { id, mode, b: win.getBounds(), p: screen.getCursorScreenPoint() };
});
ipcMain.on('drag:move', () => {
  if (!drag) return; const win = widgetWins.get(drag.id); if (!win) return;
  const p = screen.getCursorScreenPoint(), dx = p.x - drag.p.x, dy = p.y - drag.p.y, b = drag.b;
  const g = cfg.settings.snap ? Math.max(5, +cfg.settings.grid || 20) : 0, sn = (v) => (g ? Math.round(v / g) * g : v);
  win.setBounds(drag.mode === 'move'
    ? { x: sn(b.x + dx), y: sn(b.y + dy), width: b.width, height: b.height }
    : { x: b.x, y: b.y, width: Math.max(100, sn(b.width + dx)), height: Math.max(60, sn(b.height + dy)) });
});
ipcMain.on('drag:end', () => {
  if (!drag) return; const w = find(drag.id), win = widgetWins.get(drag.id);
  if (w && win) { const b = win.getBounds(); w.x = b.x; w.y = b.y; w.w = b.width; w.h = b.height; if (drag.mode === 'resize') { w.base = [b.width, b.height]; w.scale = 1; } }
  drag = null; saveCfg(); if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send('cfg', pubCfg());
});
ipcMain.on('widget:menu', (_e, id) => {
  const w = find(id); if (!w) return; const lang = cfg.settings.lang || 'de', nm = WPS.names[lang] || WPS.names.de;
  const cur = Object.keys(SIZES).find((k) => SIZES[k][0] === w.w && SIZES[k][1] === w.h);
  Menu.buildFromTemplate([
    { label: tt('ctx.settings'), click: () => openMain('widgets:' + id) },
    { type: 'separator' },
    { label: tt('ctx.size'), enabled: false },
    ...WPS.of(w.type).map((k) => ({ label: nm[k], type: 'radio', checked: k === cur, click: () => { [w.w, w.h] = SIZES[k]; w.base = [w.w, w.h]; w.scale = 1; reconcile(); } })),
    { type: 'separator' },
    { label: w.locked ? tt('ctx.unlock') : tt('ctx.lock'), click: () => { w.locked = !w.locked; reconcile(); } },
    { label: tt('ctx.top'), type: 'checkbox', checked: !!w.onTop, click: () => { w.onTop = !w.onTop; reconcile(); } },
    { label: tt('ctx.duplicate'), click: () => { const c = structuredClone(w); c.id = uid(); c.x += 28; c.y += 28; cfg.widgets.push(c); reconcile(); } },
    { type: 'separator' },
    { label: tt('ctx.remove'), click: () => { cfg.widgets = cfg.widgets.filter((q) => q.id !== id); reconcile(); } }
  ]).popup({ window: widgetWins.get(id) });
});

let lastCpu = os.cpus();
ipcMain.handle('sys:stats', async () => {
  const now = os.cpus(); let idle = 0, total = 0;
  now.forEach((c, i) => { const p = lastCpu[i]; for (const k in c.times) total += c.times[k] - p.times[k]; idle += c.times.idle - p.times.idle; });
  lastCpu = now;
  let disk = null, diskTotal = 0, diskFree = 0;
  try { const s = await fs.promises.statfs(process.platform === 'win32' ? (process.env.SystemDrive || 'C:') + '\\' : '/'); disk = 1 - s.bavail / s.blocks; diskTotal = s.blocks * s.bsize; diskFree = s.bavail * s.bsize; } catch {}
  return { cpu: total ? 1 - idle / total : 0, mem: 1 - os.freemem() / os.totalmem(), disk, memFree: os.freemem(),
    memTotal: os.totalmem(), host: os.hostname(), uptime: os.uptime(), cores: now.length, cpuModel: (now[0] && now[0].model || '').trim(), osName: `${os.type()} ${os.release()}`, arch: os.arch(), diskTotal, diskFree };
});
ipcMain.handle('displays:get', () => screen.getAllDisplays().map((d, i) => ({ id: d.id, name: `Monitor ${i + 1} (${d.size.width}×${d.size.height})` })));
ipcMain.handle('pick:folder', async () => {
  const r = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle('photos:list', async (_e, dirs, deep) => {
  const out = [], list = Array.isArray(dirs) ? dirs : [dirs];
  const walk = async (dir, depth) => { let es; try { es = await fs.promises.readdir(dir, { withFileTypes: true }); } catch { return; } for (const e of es) { if (out.length > 600) return; const p = path.join(dir, e.name); if (e.isDirectory()) { if (deep && depth < 3) await walk(p, depth + 1); } else if (/\.(jpe?g|png|webp|gif|bmp)$/i.test(e.name)) out.push(pathToFileURL(p).href); } };
  for (const d of list.filter(Boolean)) await walk(d, 0); return out;
});
ipcMain.handle('photos:albums', async (_e, dir) => { try { return (await fs.promises.readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => ({ name: e.name, path: path.join(dir, e.name) })); } catch { return []; } });
ipcMain.handle('autostart:set', (_e, on) => { cfg.settings.autostart = on; applyAutostart(); saveCfg(); broadcast(); });
ipcMain.handle('app:openData', () => shell.openPath(app.getPath('userData')));
ipcMain.handle('app:reset', async () => {
  const r = await dialog.showMessageBox({ type: 'warning', buttons: ['Abbrechen', 'Alles zurücksetzen'], defaultId: 0, message: 'Alle Widgets, Designs und Layouts löschen?' });
  if (r.response !== 1) return false;
  cfg = { ...structuredClone(DEFAULTS), runtime: cfg.runtime }; lockUnlocked = false; reconcile(); lockApply(); return true;
});

// ---------- iCloud ----------
const secretFile = () => path.join(app.getPath('userData'), 'icloud.bin');
function saveSecret(user, pass) {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Verschlüsselte Speicherung ist auf diesem PC nicht verfügbar.');
  fs.writeFileSync(secretFile(), safeStorage.encryptString(JSON.stringify({ user, pass })));
}
function loadSecret() { try { return JSON.parse(safeStorage.decryptString(fs.readFileSync(secretFile()))); } catch { return null; } }
let syncing = false;
async function doSync() {
  if (syncing) return; syncing = true;
  try { const c = await dav.syncAll(); cfg.cache = { ...cfg.cache, ...c, connected: true }; saveCfg(); broadcast(); } finally { syncing = false; }
}
async function startIcloud() {
  const s = loadSecret(); if (!s) return;
  try { await dav.connect(s.user, s.pass); await doSync(); } catch (e) { cfg.cache = { ...cfg.cache, connected: false, errors: [e.message] }; broadcast(); }
  setInterval(() => { if (cfg.cache?.connected) doSync().catch(() => {}); }, 10 * 60 * 1000);
}
ipcMain.handle('icloud:connect', async (_e, user, pass) => {
  try {
    const cals = await dav.connect(user, pass); saveSecret(user, pass); cfg.icloudUser = user; cfg.cache = { connected: true, calendars: cals, errors: [] }; saveCfg();
    await doSync(); return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('icloud:sync', async () => { try { await doSync(); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; } });
ipcMain.handle('icloud:disconnect', () => { try { fs.unlinkSync(secretFile()); } catch {} cfg.icloudUser = ''; cfg.cache = {}; saveCfg(); broadcast(); return true; });
ipcMain.handle('icloud:toggleTodo', async (_e, uid, done) => { try { await dav.toggleTodo(uid, done); await doSync(); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; } });
ipcMain.handle('icloud:createTodo', async (_e, title, due) => { try { await dav.createTodo(title, due); await doSync(); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; } });
ipcMain.handle('icloud:createEvent', async (_e, title, start, end) => { try { await dav.createEvent(title, start, end); await doSync(); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; } });

// ---------- Netz, Medien, Bildschirmzeit, Temperatur ----------
const decodeX = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").trim();
ipcMain.handle('net:stocks', async (_e, symbols) => Promise.all(String(symbols).split(',').map((x) => x.trim()).filter(Boolean).slice(0, 8).map(async (s) => {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}?interval=1d&range=1d`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const m = (await r.json()).chart.result[0].meta; return { s, price: m.regularMarketPrice, prev: m.chartPreviousClose, cur: m.currency };
  } catch { return { s, err: 1 }; }
})));
ipcMain.handle('net:rss', async (_e, url) => {
  try {
    if (!/^https?:\/\//.test(url)) throw new Error('URL');
    const x = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
    return [...x.matchAll(/<item[\s>]([\s\S]*?)<\/item>/g)].slice(0, 12).map((m) => {
      const g = (t) => { const q = m[1].match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return q ? decodeX(q[1]) : ''; };
      return { title: g('title'), link: g('link'), date: g('pubDate') };
    });
  } catch { return null; }
});
ipcMain.handle('shell:open', (_e, url) => { if (/^(https?:\/\/|tel:|mailto:|ms-settings:)/i.test(String(url))) shell.openExternal(String(url)); });
ipcMain.handle('app:open', (_e, page) => openMain(page));
ipcMain.handle('media:key', (_e, name) => {
  const vk = { prev: 0xB1, next: 0xB0, play: 0xB3, mute: 0xAD, down: 0xAE, up: 0xAF }[name]; if (!WIN || !vk) return false;
  try { WIN.key(vk, 0, 0, 0); WIN.key(vk, 0, 2, 0); return true; } catch { return false; }
});
let tempCache = { t: 0, v: null };
ipcMain.handle('temp:get', () => new Promise((resolve) => {
  if (Date.now() - tempCache.t < 20000) return resolve(tempCache.v);
  execFile('powershell', ['-NoProfile', '-Command', '(Get-CimInstance -Namespace root/wmi -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction Stop | Select-Object -First 1).CurrentTemperature'], { timeout: 8000, windowsHide: true }, (err, out) => {
    const k = parseFloat(String(out).trim()); const v = !err && k > 2000 ? Math.round((k / 10 - 273.15) * 10) / 10 : null; tempCache = { t: Date.now(), v }; resolve(v);
  });
}));
function startScreentime() {
  setInterval(() => {
    const d = new Date(), key = d.toISOString().slice(0, 10);
    if (cfg.screentime.date !== key) cfg.screentime = { date: key, secs: Array(24).fill(0) };
    if (powerMonitor.getSystemIdleTime() < 60) { cfg.screentime.secs[d.getHours()] += 30; saveCfg(); }
  }, 30000);
}
ipcMain.handle('screentime:get', () => cfg.screentime);

// ---------- Aufgaben (gemeinsamer, dauerhafter Speicher für Widgets und App) ----------
const taskDone = (r) => { saveCfg(); broadcast(); return r; };
ipcMain.handle('tasks:add', (_e, p) => taskDone(tasks.add(cfg, p)));
ipcMain.handle('tasks:done', (_e, id, done) => taskDone(tasks.setDone(cfg, id, done)));
ipcMain.handle('tasks:update', (_e, id, p) => taskDone(tasks.update(cfg, id, p)));
ipcMain.handle('tasks:remove', (_e, id) => taskDone(tasks.remove(cfg, id)));
ipcMain.handle('tasks:clearLog', () => { cfg.taskLog = []; return taskDone(true); });

// ---------- Standort: ausschliesslich echte Ortung über den Windows-Standortdienst ----------
// Kein Ersatz durch Internet-Adresse (IP-Standorte zeigen oft den Sitz des Providers, z. B. Genf) und keine feste Stadt.
let locCache = { t: 0, v: null }, locPending = null, lastGood = null;
const toB64 = (s) => Buffer.from(s, 'utf16le').toString('base64');
// Moderne Windows-Geolocator-API (WLAN/GPS/Mobilfunk); liefert Genauigkeit und Quelle mit
const PS_WINRT = `
$ErrorActionPreference = 'Stop'
try {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  $null = [Windows.Devices.Geolocation.Geolocator, Windows.Devices.Geolocation, ContentType = WindowsRuntime]
  $null = [Windows.Devices.Geolocation.Geoposition, Windows.Devices.Geolocation, ContentType = WindowsRuntime]
  $asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' })[0]
  $g = New-Object Windows.Devices.Geolocation.Geolocator
  $g.DesiredAccuracy = [Windows.Devices.Geolocation.PositionAccuracy]::High
  $op = $g.GetGeopositionAsync([TimeSpan]::FromMinutes(1), [TimeSpan]::FromSeconds(15))
  $task = $asTask.MakeGenericMethod([Windows.Devices.Geolocation.Geoposition]).Invoke($null, @($op))
  if (-not $task.Wait(25000)) { 'UNKNOWN'; exit }
  $p = $task.Result; $pt = $p.Coordinate.Point.Position; $inv = [Globalization.CultureInfo]::InvariantCulture
  'OK;{0};{1};{2};{3}' -f $pt.Latitude.ToString($inv), $pt.Longitude.ToString($inv), ([math]::Round($p.Coordinate.Accuracy)), $p.Coordinate.PositionSource
} catch {
  $m = $_.Exception.ToString()
  if ($m -match 'UnauthorizedAccess|0x80070005|Access is denied|E_ACCESSDENIED') { 'DENIED' } else { 'ERR;' + $_.Exception.Message }
}`;
// Ältere API als zweiter Versuch
const PS_LEGACY = `
try {
  Add-Type -AssemblyName System.Device
  $w = New-Object System.Device.Location.GeoCoordinateWatcher([System.Device.Location.GeoPositionAccuracy]::High)
  $null = $w.TryStart($false, [TimeSpan]::FromSeconds(10))
  if ($w.Permission -eq 'Denied') { 'DENIED' } elseif ($w.Position.Location.IsUnknown) { 'UNKNOWN' }
  else { $l = $w.Position.Location; $inv = [Globalization.CultureInfo]::InvariantCulture; 'OK;{0};{1};{2};{3}' -f $l.Latitude.ToString($inv), $l.Longitude.ToString($inv), ([math]::Round($l.HorizontalAccuracy)), 'Legacy' }
} catch { 'ERR;' + $_.Exception.Message }`;
const runPS = (script) => new Promise((resolve) => execFile('powershell', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', toB64(script)], { timeout: 40000, windowsHide: true }, (err, out) => resolve(String(out || '').trim().split(/\r?\n/).pop() || (err ? 'ERR;' + err.message : 'UNKNOWN'))));
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
const nameCache = {};
// Ortsname zu den echten Koordinaten (in der App-Sprache); nichts erfinden: ohne Treffer bleibt der Name leer
async function placeName(lat, lon) {
  const lang = (cfg && cfg.settings && cfg.settings.lang) || 'de', key = lat.toFixed(3) + ',' + lon.toFixed(3) + lang; if (nameCache[key] !== undefined) return nameCache[key];
  let nm = '';
  try { const j = await withTimeout(net.fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=12&addressdetails=1&accept-language=${lang}&lat=${lat}&lon=${lon}`, { headers: { 'User-Agent': 'WidgetPlatform/0.6 (desktop weather widget)' } }).then((r) => r.json()), 8000); const a = j.address || {}; nm = a.city || a.town || a.village || a.municipality || a.suburb || a.county || ''; } catch {}
  if (!nm) { try { const j = await withTimeout(net.fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${lang}`).then((r) => r.json()), 8000); nm = j.city || j.locality || ''; } catch {} }
  if (nm) nameCache[key] = nm; return nm;
}
async function realLocation() {
  if (process.platform !== 'win32' && !process.env.WP_TEST_WIN) return { ok: false, reason: 'unavailable' };
  let s = await runPS(PS_WINRT);
  if (!s.startsWith('OK;') && s !== 'DENIED') { const s2 = await runPS(PS_LEGACY); if (s2.startsWith('OK;') || s2 === 'DENIED') s = s2; else if (s === 'UNKNOWN' || s2 === 'UNKNOWN') s = 'UNKNOWN'; }
  if (s === 'DENIED') return { ok: false, reason: 'denied' };
  const p = s.split(';');
  if (p[0] !== 'OK' || !isFinite(+p[1]) || !isFinite(+p[2])) { logErr('Standort', s); return { ok: false, reason: s === 'UNKNOWN' ? 'unknown' : 'unavailable', detail: s }; }
  const lat = +p[1], lon = +p[2], acc = +p[3] || 0, src = p[4] || '';
  return { ok: true, lat, lon, accuracy: acc, posSource: src, name: await placeName(lat, lon), source: 'windows', at: Date.now() };
}
ipcMain.handle('loc:get', async (_e, force) => {
  if (!force && locCache.v && Date.now() - locCache.t < 2 * 60 * 1000) return locCache.v;
  if (locPending) return locPending;
  locPending = realLocation().then((v) => {
    locPending = null;
    if (v.ok) { locCache = { t: Date.now(), v }; lastGood = v; return v; }
    // kurzzeitig kein Fix (z. B. WLAN-Wechsel): letzte echte Position bis 30 min weiterverwenden, klar als «Stand» markiert
    if (v.reason === 'denied') { lastGood = null; locCache = { t: 0, v: null }; return v; } // Berechtigung fehlt: nie eine alte Position zeigen
    if (lastGood && Date.now() - lastGood.at < 30 * 60 * 1000) return { ...lastGood, stale: true };
    return v;
  });
  return locPending;
});
// ---------- Wetter-Cache (offline anzeigen) ----------
const wxFile = () => path.join(app.getPath('userData'), 'weather-cache.json');
let wxMem = null;
const wxLoad = () => { if (!wxMem) { try { wxMem = JSON.parse(fs.readFileSync(wxFile(), 'utf8')); } catch { wxMem = {}; } } return wxMem; };
ipcMain.handle('wx:get', (_e, key) => wxLoad()[key] || null);
ipcMain.handle('wx:set', (_e, key, val) => { const c = wxLoad(); c[key] = val; const ks = Object.keys(c); if (ks.length > 40) delete c[ks[0]]; try { fs.writeFileSync(wxFile(), JSON.stringify(c)); } catch (e) { logErr('wx-cache', e); } return true; });
app.whenReady().then(() => { try { powerMonitor.on('resume', () => setTimeout(() => { locCache = { t: 0, v: null }; refreshAll(); }, 4000)); } catch { } });
function refreshAll() { allWins().forEach((w) => w.webContents.send('refresh')); }
ipcMain.handle('app:refresh', () => { locCache = { t: 0, v: null }; refreshAll(); return true; });

// ---------- Einstellungen exportieren / importieren ----------
ipcMain.handle('cfg:export', async () => {
  const r = await dialog.showSaveDialog({ defaultPath: 'widget-platform-settings.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
  if (r.canceled || !r.filePath) return { ok: false, canceled: true };
  const out = { format: 'widget-platform-settings', version: 1, settings: cfg.settings, theme: cfg.theme, appTheme: cfg.appTheme, widgets: cfg.widgets.map((w) => ({ ...w, data: undefined })), layouts: cfg.layouts, templates: cfg.templates };
  try { fs.writeFileSync(r.filePath, JSON.stringify(out, null, 2)); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('cfg:import', async () => {
  const r = await dialog.showOpenDialog({ filters: [{ name: 'JSON', extensions: ['json'] }], properties: ['openFile'] });
  if (r.canceled || !r.filePaths[0]) return { ok: false, canceled: true };
  try {
    const j = JSON.parse(fs.readFileSync(r.filePaths[0], 'utf8'));
    if (j.format !== 'widget-platform-settings') throw new Error('format');
    if (j.settings) cfg.settings = { ...DEFAULTS.settings, ...j.settings };
    if (j.theme) cfg.theme = { ...DEFAULTS.theme, ...j.theme };
    if (j.appTheme) cfg.appTheme = j.appTheme;
    if (Array.isArray(j.widgets)) { const old = Object.fromEntries(cfg.widgets.map((w) => [w.id, w.data])); cfg.widgets = j.widgets.map((w) => ({ ...w, id: w.id || uid(), data: old[w.id] || {} })); }
    if (j.layouts) cfg.layouts = j.layouts; if (Array.isArray(j.templates)) cfg.templates = j.templates;
    applyAutostart(); updateTray(); reconcile(); return { ok: true };
  } catch { return { ok: false, error: 'format' }; }
});

// ---------- Dateien: Bilder wählen, JSON speichern/laden ----------
ipcMain.handle('pick:image', async () => { const r = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Bilder', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'] }] }); return r.canceled ? null : pathToFileURL(r.filePaths[0]).href; });
ipcMain.handle('file:saveJson', async (_e, name, data) => { const r = await dialog.showSaveDialog({ defaultPath: name, filters: [{ name: 'JSON', extensions: ['json'] }] }); if (r.canceled || !r.filePath) return { ok: false, canceled: true }; try { fs.writeFileSync(r.filePath, JSON.stringify(data, null, 2)); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; } });
ipcMain.handle('file:openJson', async () => { const r = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'JSON', extensions: ['json'] }] }); if (r.canceled || !r.filePaths[0]) return { ok: false, canceled: true }; try { return { ok: true, data: JSON.parse(fs.readFileSync(r.filePaths[0], 'utf8')) }; } catch { return { ok: false, error: 'format' }; } });

// ---------- Musik: Windows-Mediensitzung (SMTC) ----------
// Ein PowerShell-Prozess liest alle 1,5 s die aktuelle Mediensitzung (Spotify, Apple Music, YouTube Music, Media Player, Browser …).
// Er läuft nur, solange ein Musik-Widget danach fragt, und beendet sich 30 s nach der letzten Anfrage.
const PS_MEDIA = `
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
$null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.IRandomAccessStreamWithContentType, Windows.Storage.Streams, ContentType = WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' })[0]
function Await($op, $t) { $task = $asTask.MakeGenericMethod($t).Invoke($null, @($op)); $null = $task.Wait(6000); $task.Result }
$mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
$lastKey = $null; $lastArt = ''
while ($true) {
  try {
    $s = $mgr.GetCurrentSession()
    if ($s -eq $null) { $o = @{ active = $false } }
    else {
      $p = Await ($s.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
      $pi = $s.GetPlaybackInfo(); $tl = $s.GetTimelineProperties()
      $key = '' + $p.Title + '|' + $p.Artist + '|' + $p.AlbumTitle
      $o = @{ active = $true; title = '' + $p.Title; artist = '' + $p.Artist; album = '' + $p.AlbumTitle; status = '' + $pi.PlaybackStatus; app = '' + $s.SourceAppUserModelId; pos = [int]$tl.Position.TotalSeconds; dur = [int]($tl.EndTime - $tl.StartTime).TotalSeconds; key = $key }
      if ($key -ne $lastKey) {
        $lastKey = $key; $lastArt = ''
        if ($p.Thumbnail) {
          try {
            $st = Await ($p.Thumbnail.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
            $size = [uint32]$st.Size; $rd = New-Object Windows.Storage.Streams.DataReader($st.GetInputStreamAt(0))
            $null = Await ($rd.LoadAsync($size)) ([uint32]); $bytes = New-Object byte[] $size; $rd.ReadBytes($bytes)
            $lastArt = 'data:' + $st.ContentType + ';base64,' + [Convert]::ToBase64String($bytes)
          } catch { $lastArt = '' }
        }
        $o.art = $lastArt
      }
    }
    [Console]::Out.WriteLine(($o | ConvertTo-Json -Compress)); [Console]::Out.Flush()
  } catch { [Console]::Out.WriteLine('{"active":false}'); [Console]::Out.Flush() }
  Start-Sleep -Milliseconds 1500
}`;
let mediaProc = null, mediaState = { active: false }, mediaAsk = 0, mediaWatch = null;
function startMedia() {
  if (mediaProc) return;
  const fake = process.env.WP_FAKE_MEDIA; // Testhilfe: Zeilen aus einer Datei statt PowerShell
  if (process.platform !== 'win32' && !fake) return;
  mediaProc = fake ? spawn('tail', ['-n', '1', '-F', fake]) : spawn('powershell', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', toB64(PS_MEDIA)], { windowsHide: true });
  let buf = '';
  mediaProc.stdout.on('data', (d) => {
    buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line) continue;
      try {
        const j = JSON.parse(line), prev = mediaState;
        if (!j.active) mediaState = { active: false, at: Date.now() };
        else { const fresh = j.art !== undefined; mediaState = { ...j, art: fresh ? j.art : prev.art, artKey: fresh ? j.key + ':' + Date.now() : prev.artKey, at: Date.now() }; }
      } catch { }
    }
  });
  mediaProc.on('exit', () => { mediaProc = null; });
  mediaWatch = setInterval(() => { if (Date.now() - mediaAsk > 30000) { try { mediaProc && mediaProc.kill(); } catch { } clearInterval(mediaWatch); mediaProc = null; } }, 10000);
}
ipcMain.handle('media:state', (_e, knownArtKey) => {
  mediaAsk = Date.now(); startMedia();
  const s = { ...mediaState }; if (s.artKey && s.artKey === knownArtKey) delete s.art; // Cover nur senden, wenn es sich geändert hat
  s.supported = process.platform === 'win32' || !!process.env.WP_FAKE_MEDIA; return s;
});

// ======================================================================
// Apple-ähnlicher Dock (eigenes Fenster neben der Windows-Taskleiste, ersetzt sie nicht)
// ======================================================================
const dockWins = new Map(); const iconCache = {}; let dockRunning = [], dockActive = '', dockHidden = new Map();
const baseName = (p) => path.basename(String(p || '')).toLowerCase();
function dockTarget(item) { // ausführbare Datei hinter einem Eintrag (für Laufend-Anzeige)
  const p = String(item.path || ''); if (/\.lnk$/i.test(p)) { try { return baseName(shell.readShortcutLink(p).target); } catch { return ''; } } return baseName(p);
}
async function dockIcon(p) {
  if (iconCache[p]) return iconCache[p];
  try { const img = await app.getFileIcon(p, { size: 'large' }); iconCache[p] = img.toDataURL(); } catch { iconCache[p] = ''; } return iconCache[p];
}
function dockGeo(d, disp) {
  const n = Math.max(1, d.items.length), s = d.size, sp = d.spacing, pad = d.thickness, vert = d.position === 'left' || d.position === 'right';
  const exact = (d.theme.blur || 0) > 0 && d.magnify <= 1.05 && ACRYLIC_OK; // Windows-Blur nur, wenn das Fenster genau so gross wie der Dock ist
  const barLen = d.widthMode === 'fixed' ? d.widthPx : n * s + (n + 1) * sp, barThick = s + pad * 2;
  const spill = exact ? 0 : Math.round(s * (d.magnify - 1) * 1.1) + 8, crossExtra = exact ? 0 : Math.round(s * (d.magnify - 1)) + 40, margin = exact ? 6 : 10;
  const along = barLen + 2 * spill, cross = barThick + crossExtra + margin, wa = disp.workArea; let b;
  if (d.position === 'bottom') b = { x: wa.x + Math.round((wa.width - along) / 2), y: wa.y + wa.height - cross, width: along, height: cross };
  else if (d.position === 'top') b = { x: wa.x + Math.round((wa.width - along) / 2), y: wa.y, width: along, height: cross };
  else if (d.position === 'left') b = { x: wa.x, y: wa.y + Math.round((wa.height - along) / 2), width: cross, height: along };
  else b = { x: wa.x + wa.width - cross, y: wa.y + Math.round((wa.height - along) / 2), width: cross, height: along };
  return { bounds: b, exact, vert, barLen, barThick, spill, cross };
}
function dockDisplays() {
  const all = screen.getAllDisplays(), d = cfg.dock;
  if (d.display === 'all') return all; const f = all.find((x) => String(x.id) === String(d.display)); return [f || screen.getPrimaryDisplay()];
}
function applyDock() {
  const d = cfg.dock, targets = d.enabled ? dockDisplays() : [], ids = new Set(targets.map((x) => x.id));
  for (const [id, win] of dockWins) if (!ids.has(id)) { win.destroy(); dockWins.delete(id); dockHidden.delete(id); }
  for (const disp of targets) {
    let win = dockWins.get(disp.id);
    if (!win) {
      win = new BrowserWindow({ frame: false, transparent: true, hasShadow: false, skipTaskbar: true, resizable: false, focusable: false, type: 'toolbar', show: false, backgroundColor: '#00000000', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false } });
      win.setIgnoreMouseEvents(true, { forward: true }); win.setAlwaysOnTop(true, 'floating');
      win.loadFile(path.join(__dirname, 'renderer/dock/dock.html'), { query: { display: String(disp.id) } }); win.once('ready-to-show', () => win.showInactive());
      win.on('closed', () => dockWins.delete(disp.id)); dockWins.set(disp.id, win);
    }
    const g = dockGeo(d, disp); const hid = dockHidden.get(disp.id);
    let b = g.bounds; if (hid && d.autoHide) { const t = 4; b = d.position === 'bottom' ? { ...b, y: b.y + b.height - t, height: t } : d.position === 'top' ? { ...b, height: t } : d.position === 'left' ? { ...b, width: t } : { ...b, x: b.x + b.width - t, width: t }; }
    win.setBounds(b); try { win.setBackgroundMaterial(g.exact && !(hid && d.autoHide) ? 'acrylic' : 'none'); } catch { }
    win.setIgnoreMouseEvents(!(hid && d.autoHide), { forward: true });
    win.webContents.send('dock:update');
  }
}
async function dockState() {
  const d = cfg.dock, items = [];
  for (const it of d.items) items.push({ id: it.id, name: it.name, icon: await dockIcon(it.path), running: !!(d.showRunning && dockTarget(it) && dockRunning.includes(dockTarget(it))), active: !!(dockTarget(it) && dockTarget(it) === dockActive) });
  return { dock: d, global: cfg.theme, items, acrylicOk: ACRYLIC_OK };
}
ipcMain.handle('dock:get', () => dockState());
ipcMain.handle('dock:launch', (_e, id) => { const it = cfg.dock.items.find((x) => x.id === id); if (!it) return false; try { if (it.args) spawn(it.path, String(it.args).split(' '), { detached: true, stdio: 'ignore' }).unref(); else shell.openPath(it.path); return true; } catch { return false; } });
ipcMain.on('dock:hover', (e, inside) => { const win = BrowserWindow.fromWebContents(e.sender); if (win && !win.isDestroyed()) { const hid = [...dockHidden.values()].some(Boolean); if (!(hid && cfg.dock.autoHide)) win.setIgnoreMouseEvents(!inside, { forward: true }); } });
ipcMain.on('dock:hidden', (e, hidden) => {
  const win = BrowserWindow.fromWebContents(e.sender); if (!win) return; const id = [...dockWins.entries()].find(([, w]) => w === win)?.[0]; if (id === undefined) return;
  if (!!dockHidden.get(id) !== !!hidden) { dockHidden.set(id, !!hidden); applyDock(); }
});
ipcMain.handle('dock:reorder', (_e, ids) => { const by = Object.fromEntries(cfg.dock.items.map((i) => [i.id, i])); cfg.dock.items = ids.map((i) => by[i]).filter(Boolean); saveCfg(); applyDock(); broadcast(); return true; });
ipcMain.handle('dock:remove', (_e, id) => { cfg.dock.items = cfg.dock.items.filter((i) => i.id !== id); saveCfg(); applyDock(); broadcast(); return true; });
function addDockPath(p, name) { if (!p) return null; if (cfg.dock.items.some((i) => i.path === p)) return null; const it = { id: uid(), name: name || path.basename(p).replace(/\.(lnk|exe|url)$/i, ''), path: p }; cfg.dock.items.push(it); saveCfg(); applyDock(); broadcast(); return it; }
ipcMain.handle('dock:addPath', (_e, p, name) => addDockPath(p, name));
ipcMain.handle('dock:pickApp', async () => { const r = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Programme und Verknüpfungen', extensions: ['exe', 'lnk', 'bat', 'cmd', 'url'] }, { name: 'Alle Dateien', extensions: ['*'] }] }); return r.canceled ? null : addDockPath(r.filePaths[0]); });
ipcMain.handle('dock:scanApps', async () => { // Programme aus dem Startmenü zur Auswahl
  const roots = [path.join(process.env.ProgramData || '', 'Microsoft/Windows/Start Menu/Programs'), path.join(process.env.APPDATA || '', 'Microsoft/Windows/Start Menu/Programs')], out = [];
  const walk = (dir, depth) => { if (depth > 3) return; let es; try { es = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; } for (const e of es) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p, depth + 1); else if (/\.lnk$/i.test(e.name) && !/uninstall|deinstall/i.test(e.name)) out.push({ name: e.name.replace(/\.lnk$/i, ''), path: p }); } };
  roots.forEach((r) => walk(r, 0)); const seen = new Set(); return out.filter((x) => (seen.has(x.name) ? false : seen.add(x.name))).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 400);
});
ipcMain.on('dock:itemMenu', (e, id) => {
  const it = cfg.dock.items.find((x) => x.id === id); if (!it) return; const lang = cfg.settings.lang;
  const L = { de: ['Öffnen', 'Aus dem Dock entfernen'], en: ['Open', 'Remove from Dock'], ru: ['Открыть', 'Убрать из Dock'] }[lang] || ['Öffnen', 'Aus dem Dock entfernen'];
  Menu.buildFromTemplate([{ label: L[0], click: () => shell.openPath(it.path) }, { type: 'separator' }, { label: L[1], click: () => { cfg.dock.items = cfg.dock.items.filter((x) => x.id !== id); saveCfg(); applyDock(); broadcast(); } }]).popup({ window: BrowserWindow.fromWebContents(e.sender) });
});
// laufende / aktive Programme erkennen (nur solange der Dock aktiv ist)
let dockPoll = null, winApi = null;
try { const koffi = require('koffi'), u = koffi.load('user32.dll'), k = koffi.load('kernel32.dll'); winApi = { fg: u.func('void* __stdcall GetForegroundWindow()'), pid: u.func('uint32 __stdcall GetWindowThreadProcessId(void* h, _Out_ uint32_t* pid)'), open: k.func('void* __stdcall OpenProcess(uint32 a, bool b, uint32 pid)'), close: k.func('bool __stdcall CloseHandle(void* h)'), name: k.func('bool __stdcall QueryFullProcessImageNameW(void* h, uint32 f, _Out_ uint16_t* buf, _Inout_ uint32_t* size)') }; } catch { winApi = null; }
function activeExe() {
  if (!winApi) return ''; try { const h = winApi.fg(); if (!h) return ''; const pid = [0]; winApi.pid(h, pid); const hp = winApi.open(0x1000, false, pid[0]); if (!hp) return ''; const buf = new Uint16Array(1024), size = [1024]; const ok = winApi.name(hp, 0, buf, size); winApi.close(hp); return ok ? baseName(Buffer.from(buf.buffer, 0, size[0] * 2).toString('utf16le')) : ''; } catch { return ''; }
}
// Widgets, die nur beim Darüberfahren erscheinen (Hover-to-show)
setInterval(() => {
  if (!cfg) return; const p = screen.getCursorScreenPoint();
  for (const w of cfg.widgets) { const win = widgetWins.get(w.id); if (!win || win.isDestroyed()) continue; if (!w.hoverShow) { if (win._hs) { win.setOpacity(1); win.setIgnoreMouseEvents(!!w.clickThrough, { forward: true }); win._hs = false; } continue; }
    const b = win.getBounds(), near = p.x >= b.x - 20 && p.x <= b.x + b.width + 20 && p.y >= b.y - 20 && p.y <= b.y + b.height + 20;
    if (near && win._hs !== 'in') { win.setOpacity(1); win.setIgnoreMouseEvents(!!w.clickThrough, { forward: true }); win._hs = 'in'; } else if (!near && win._hs !== 'out') { win.setOpacity(0); win.setIgnoreMouseEvents(true, { forward: true }); win._hs = 'out'; } }
}, 200);
function startDockPolling() {
  if (dockPoll) return;
  dockPoll = setInterval(() => {
    if (!cfg.dock.enabled || !dockWins.size) return;
    const send = () => dockWins.forEach((w) => w.webContents.send('dock:update'));
    dockActive = activeExe();
    if (cfg.dock.showRunning && process.platform === 'win32') execFile('tasklist', ['/fo', 'csv', '/nh'], { windowsHide: true, maxBuffer: 4e6 }, (err, out) => { if (!err) dockRunning = [...new Set(String(out).split(/\r?\n/).map((l) => (l.match(/^"([^"]+)"/) || [])[1]).filter(Boolean).map((x) => x.toLowerCase()))]; send(); }); else send();
    // Auto-Ausblenden: Mauszeiger am Rand zeigt den Dock wieder an
    if (cfg.dock.autoHide) { const p = screen.getCursorScreenPoint(); for (const [id, win] of dockWins) { const disp = screen.getAllDisplays().find((x) => x.id === id); if (!disp) continue; const b = disp.bounds, near = cfg.dock.position === 'bottom' ? p.y >= b.y + b.height - 3 : cfg.dock.position === 'top' ? p.y <= b.y + 2 : cfg.dock.position === 'left' ? p.x <= b.x + 2 : p.x >= b.x + b.width - 3;
        const inWin = (() => { const bb = win.getBounds(); return p.x >= bb.x && p.x <= bb.x + bb.width && p.y >= bb.y && p.y <= bb.y + bb.height; })();
        if (dockHidden.get(id) && near && inWin !== undefined) { dockHidden.set(id, false); applyDock(); } } }
  }, 1500);
}
app.whenReady().then(() => { screen.on('display-added', () => applyDock()); screen.on('display-removed', () => applyDock()); screen.on('display-metrics-changed', () => applyDock()); });

// ---------- Hintergrundbild-Farben, Tag-/Nacht-Design ----------
function wallpaperColors() { return new Promise((resolve) => {
  const fail = (m) => resolve({ ok: false, reason: m });
  if (process.platform !== 'win32' && !process.env.WP_FAKE_WALL) return fail('windows-only');
  const read = (file) => {
    try {
      let img = nativeImage.createFromPath(file); if (img.isEmpty()) { const tmp = path.join(app.getPath('temp'), 'wp-wall.jpg'); fs.copyFileSync(file, tmp); img = nativeImage.createFromPath(tmp); }
      if (img.isEmpty()) return fail('unreadable');
      const sm = img.resize({ width: 48, height: 27 }), bmp = sm.toBitmap(), buckets = {}; let lum = 0, n = 0;
      for (let i = 0; i < bmp.length; i += 4) { const b = bmp[i], g = bmp[i + 1], r = bmp[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0; lum += 0.2126 * r + 0.7152 * g + 0.0722 * b; n++;
        const k = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5); const e = buckets[k] || (buckets[k] = { r: 0, g: 0, b: 0, w: 0 }); const wt = 0.2 + sat * 2; e.r += r * wt; e.g += g * wt; e.b += b * wt; e.w += wt; }
      const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v / c.w).toString(16).padStart(2, '0')).join('');
      const cols = Object.values(buckets).sort((a, b) => b.w - a.w).slice(0, 5).map(hex);
      resolve({ ok: true, path: file, colors: cols, dominant: cols[0], dark: lum / n < 115 });
    } catch (e) { fail(String(e.message || e)); }
  };
  if (process.env.WP_FAKE_WALL) return read(process.env.WP_FAKE_WALL);
  execFile('reg', ['query', 'HKCU\\Control Panel\\Desktop', '/v', 'WallPaper'], { windowsHide: true }, (err, out) => {
    let f = (String(out).match(/WallPaper\s+REG_SZ\s+(.+)/i) || [])[1]; f = f && f.trim();
    if (!f || !fs.existsSync(f)) f = path.join(process.env.APPDATA || '', 'Microsoft/Windows/Themes/TranscodedWallpaper');
    if (!fs.existsSync(f)) return fail('no-wallpaper'); read(f);
  });
}); }
ipcMain.handle('wallpaper:colors', () => wallpaperColors());
// Optional: Dock-/Akzentfarben folgen dem Hintergrundbild (nur wenn aktiviert, überschreibt nie Widget-Farben)
const mixHex = (h, k) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(h.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
async function followWallpaper() {
  const w = cfg.appearance.wallpaper; if (!w.follow && !w.followAccent) return; const r = await wallpaperColors(); if (!r.ok) return;
  if (w.follow) cfg.dock.theme = { ...cfg.dock.theme, bg1: mixHex(r.dominant, r.dark ? 0.55 : 0.4), preset: 'Wallpaper' };
  if (w.followAccent) { cfg.appTheme = { ...cfg.appTheme, accent: r.dominant }; cfg.theme = { ...cfg.theme, accent: r.dominant, btn: r.dominant }; }
  applyDock(); reconcile();
}
setTimeout(() => { followWallpaper(); setInterval(followWallpaper, 10 * 60 * 1000); }, 8000);

let lastNight = null, scheduleTick = () => { };
function startSchedule() {
  const tick = scheduleTick = () => {
    const s = cfg.appearance.schedule; if (!s.enabled) { lastNight = null; return; }
    const now = new Date(), mins = now.getHours() * 60 + now.getMinutes(), hm = (x) => { const [h, m] = String(x).split(':').map(Number); return h * 60 + (m || 0); }, d0 = hm(s.dayStart), n0 = hm(s.nightStart);
    const night = d0 < n0 ? (mins < d0 || mins >= n0) : (mins >= n0 && mins < d0); if (night === lastNight) return; lastNight = night;
    const TH = require('./renderer/shared/theme.js'), pr = TH.PRESETS[night ? s.nightPreset : s.dayPreset]; if (!pr) return;
    cfg.theme = { ...cfg.theme, ...pr }; cfg.appTheme = { ...cfg.appTheme, mode: night ? 'dark' : 'light' };
    if (s.alsoDock) { cfg.dock.theme = { ...cfg.dock.theme, bg1: pr.bg1, opacity: Math.min(0.9, Math.max(0.25, pr.opacity)), border: pr.border, borderOpacity: pr.borderOpacity, preset: night ? s.nightPreset : s.dayPreset }; }
    reconcile(); applyDock();
  };
  tick(); setInterval(tick, 60000);
}

// ======================================================================
// Monitore (GPU, Datenträger, Netzwerk): sprachunabhängige WMI-Zähler, nur aktiv solange ein Widget fragt
// ======================================================================
const PS_PERF = `
$ErrorActionPreference = 'SilentlyContinue'
$gpuName = (Get-CimInstance Win32_VideoController | Select-Object -First 1).Name
while ($true) {
  $g = -1; try { $g = [math]::Round((Get-CimInstance Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine -ErrorAction Stop | Where-Object { $_.Name -like '*engtype_3D*' } | Measure-Object UtilizationPercentage -Sum).Sum, 1) } catch { $g = -1 }
  $d = Get-CimInstance Win32_PerfFormattedData_PerfDisk_PhysicalDisk -Filter "Name='_Total'"
  $nics = Get-CimInstance Win32_PerfFormattedData_Tcpip_NetworkInterface
  $rx = ($nics | Measure-Object BytesReceivedPersec -Sum).Sum; $tx = ($nics | Measure-Object BytesSentPersec -Sum).Sum
  $o = @{ gpu = $g; gpuName = '' + $gpuName; dr = [double]$d.DiskReadBytesPersec; dw = [double]$d.DiskWriteBytesPersec; rx = [double]$rx; tx = [double]$tx }
  [Console]::Out.WriteLine(($o | ConvertTo-Json -Compress)); [Console]::Out.Flush()
  Start-Sleep -Milliseconds 2500
}`;
let perfProc = null, perfState = {}, perfAsk = 0, perfWatch = null;
ipcMain.handle('perf:get', () => {
  perfAsk = Date.now();
  if (!perfProc && (process.platform === 'win32' || process.env.WP_FAKE_PERF)) {
    perfProc = process.env.WP_FAKE_PERF ? spawn('tail', ['-n', '1', '-F', process.env.WP_FAKE_PERF]) : spawn('powershell', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', toB64(PS_PERF)], { windowsHide: true });
    let buf = ''; perfProc.stdout.on('data', (d) => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1); try { perfState = { ...JSON.parse(l), at: Date.now() }; } catch { } } });
    perfProc.on('exit', () => { perfProc = null; });
    perfWatch = setInterval(() => { if (Date.now() - perfAsk > 30000) { try { perfProc && perfProc.kill(); } catch { } clearInterval(perfWatch); perfProc = null; } }, 10000);
  }
  return { ...perfState, supported: process.platform === 'win32' || !!process.env.WP_FAKE_PERF };
});

// ---------- Zwischenablage-Verlauf (nur im Arbeitsspeicher) ----------
let clipHist = [], clipTimer = null, clipAsk = 0, lastClip = '';
function clipTick() { try { const t = clipboard.readText(); if (t && t !== lastClip && t.length <= 4000 && t.trim()) { lastClip = t; clipHist = [t, ...clipHist.filter((x) => x !== t)].slice(0, 50); } } catch { } if (Date.now() - clipAsk > 30000 && !(cfg && cfg.settings.clipHistory)) { clearInterval(clipTimer); clipTimer = null; } }
function clipEnsure(st) { if (st && st.clipHistory && !clipTimer) { clipTick(); clipTimer = setInterval(clipTick, 1000); } }
ipcMain.handle('clip:get', () => { clipAsk = Date.now(); if (!clipTimer) { clipTick(); clipTimer = setInterval(clipTick, 1000); } return clipHist; });
ipcMain.handle('clip:copy', (_e, t) => { lastClip = String(t); clipboard.writeText(String(t)); clipHist = [String(t), ...clipHist.filter((x) => x !== t)].slice(0, 25); return true; });
ipcMain.handle('clip:remove', (_e, t) => { clipHist = clipHist.filter((x) => x !== t); return clipHist; });
ipcMain.handle('clip:clear', () => { clipHist = []; return true; });

// ---------- Schnelleinstellungen ----------
const runPSOnce = (script) => new Promise((resolve) => execFile('powershell', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', toB64(script)], { timeout: 15000, windowsHide: true }, (err, out) => resolve(err ? null : String(out).trim())));
const keyTap = (vk) => { if (!WIN) return false; try { WIN.key(vk, 0, 0, 0); WIN.key(vk, 0, 2, 0); return true; } catch { return false; } };
ipcMain.handle('qs:action', async (_e, name, arg) => {
  if (process.platform !== 'win32') return { ok: false, reason: 'windows-only' };
  switch (name) {
    case 'mute': return { ok: keyTap(0xAD) }; case 'volup': return { ok: keyTap(0xAF) }; case 'voldown': return { ok: keyTap(0xAE) };
    case 'lock': execFile('rundll32.exe', ['user32.dll,LockWorkStation']); return { ok: true };
    case 'screenshot': if (!WIN) return { ok: false }; try { WIN.key(0x5B, 0, 0, 0); WIN.key(0x10, 0, 0, 0); WIN.key(0x53, 0, 0, 0); WIN.key(0x53, 0, 2, 0); WIN.key(0x10, 0, 2, 0); WIN.key(0x5B, 0, 2, 0); return { ok: true }; } catch { return { ok: false }; }
    case 'settings': if (/^ms-settings:[a-z-]+$/i.test(String(arg))) { shell.openExternal(String(arg)); return { ok: true }; } return { ok: false };
    case 'brightness': { // nur Laptop-Displays (WMI)
      const cur = await runPSOnce("(Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightness | Select-Object -First 1).CurrentBrightness"); if (cur === null || cur === '') return { ok: false, reason: 'unsupported' };
      const v = Math.max(5, Math.min(100, (+cur || 50) + (+arg || 0))); await runPSOnce(`Invoke-CimMethod -InputObject (Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightnessMethods | Select-Object -First 1) -MethodName WmiSetBrightness -Arguments @{Timeout=1;Brightness=${v}} | Out-Null`); return { ok: true, value: v };
    }
  }
  return { ok: false };
});

// ---------- Fokus-Modus: blendet andere Widgets (und optional den Dock) aus ----------
let focusOn = null;
ipcMain.handle('focus:set', (_e, on, keepId, hideDock) => {
  if (on) { focusOn = { keepId, hideDock }; for (const [id, win] of widgetWins) if (id !== keepId) win.hide(); if (hideDock) dockWins.forEach((w) => w.hide()); }
  else { focusOn = null; if (!allHidden) for (const win of widgetWins.values()) win.showInactive(); dockWins.forEach((w) => w.showInactive()); }
  return true;
});

// ---------- Akku externer Geräte (Bluetooth, soweit Windows den Wert bereitstellt) ----------
let batDev = { t: 0, v: [] };
ipcMain.handle('battery:devices', async () => {
  if (process.platform !== 'win32') return { supported: false, devices: [] }; if (Date.now() - batDev.t < 120000) return { supported: true, devices: batDev.v };
  const out = await runPSOnce(`$r = @(); Get-PnpDevice -Class Bluetooth -PresentOnly -ErrorAction SilentlyContinue | ForEach-Object { $p = Get-PnpDeviceProperty -InstanceId $_.InstanceId -KeyName '{104EA319-6EE2-4701-BD47-8DDBF425BBE5} 2' -ErrorAction SilentlyContinue; if ($p -and $p.Data -ne $null -and $_.FriendlyName) { $r += [pscustomobject]@{ name = $_.FriendlyName; level = [int]$p.Data } } }; ConvertTo-Json -Compress -InputObject @($r)`);
  let v = []; try { v = JSON.parse(out || '[]'); if (!Array.isArray(v)) v = [v]; } catch { v = []; } batDev = { t: Date.now(), v: v.filter((d) => d && d.name && d.level >= 0 && d.level <= 100).slice(0, 6) }; return { supported: true, devices: batDev.v };
});

// ---------- Eigene Termine (ohne iCloud) ----------
ipcMain.handle('events:add', (_e, ev) => { cfg.events = cfg.events || []; const e = { id: uid(), title: String(ev.title || '').slice(0, 120), start: +ev.start, end: +ev.end || +ev.start + 36e5, allDay: !!ev.allDay, color: ev.color || '#0a84ff', cal: 'Lokal', local: true }; if (!e.title || !isFinite(e.start)) return null; cfg.events.push(e); cfg.eventsRev = (cfg.eventsRev || 0) + 1; saveCfg(); broadcast(); return e; });
ipcMain.handle('events:remove', (_e, id) => { cfg.events = (cfg.events || []).filter((x) => x.id !== id); cfg.eventsRev = (cfg.eventsRev || 0) + 1; saveCfg(); broadcast(); return true; });



// ---------- Shortcut-Leiste am oberen Bildschirmrand ----------
const TB_DEFAULT = { enabled: false, delay: 250, size: 'normal', clock: true, corner: false,
  items: ['store', 'toggleWidgets', 'showDesktop', 'explorer', 'downloads', 'calc', 'snip', 'clipboard', 'play', 'mute', 'wifi', 'settings', 'lock'].map((a) => ({ id: 'tb-' + a, kind: 'action', action: a })) };
const tbCfg = () => ({ ...TB_DEFAULT, ...(cfg.topbar || {}) });
let tbWin = null, tbShown = false, tbEdgeSince = 0, tbOutSince = 0, tbPoll = null;
function winCombo(...vks) { if (!WIN) return false; try { vks.forEach((k) => WIN.key(k, 0, 0, 0)); [...vks].reverse().forEach((k) => WIN.key(k, 0, 2, 0)); return true; } catch { return false; } }
const TB_RUN = {
  store: () => openMain('store'), widgets: () => openMain('widgets'), appSettings: () => openMain('settings'), toggleWidgets: () => toggleAllHidden(),
  showDesktop: () => winCombo(0x5B, 0x44), search: () => winCombo(0x5B, 0x53), taskview: () => winCombo(0x5B, 0x09), clipboard: () => winCombo(0x5B, 0x56), emoji: () => winCombo(0x5B, 0xBE),
  notifications: () => winCombo(0x5B, 0x4E), quick: () => winCombo(0x5B, 0x41), snip: () => shell.openExternal('ms-screenclip:'), lock: () => execFile('rundll32.exe', ['user32.dll,LockWorkStation']),
  play: () => winCombo(0xB3), next: () => winCombo(0xB0), prev: () => winCombo(0xB1), mute: () => winCombo(0xAD), volup: () => winCombo(0xAF), voldown: () => winCombo(0xAE),
  explorer: () => spawn('explorer.exe', [], { detached: true, stdio: 'ignore' }).unref(), downloads: () => shell.openPath(app.getPath('downloads')), documents: () => shell.openPath(app.getPath('documents')), pictures: () => shell.openPath(app.getPath('pictures')),
  calc: () => shell.openExternal('calculator:'), notepad: () => spawn('notepad.exe', [], { detached: true, stdio: 'ignore' }).unref(), taskmgr: () => spawn('taskmgr.exe', [], { detached: true, stdio: 'ignore' }).unref(), terminal: () => shell.openExternal('wt:').catch(() => spawn('cmd.exe', ['/c', 'start', 'powershell'], { detached: true, stdio: 'ignore' }).unref()),
  settings: () => shell.openExternal('ms-settings:'), wifi: () => shell.openExternal('ms-settings:network-wifi'), bluetooth: () => shell.openExternal('ms-settings:bluetooth'), sound: () => shell.openExternal('ms-settings:sound'), display: () => shell.openExternal('ms-settings:display'), power: () => shell.openExternal('ms-settings:powersleep'),
  darkmode: () => { const k = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize'; execFile('reg', ['query', k, '/v', 'AppsUseLightTheme'], { windowsHide: true }, (e, out) => { const light = /0x1/.test(String(out)) ? 0 : 1; ['AppsUseLightTheme', 'SystemUsesLightTheme'].forEach((v) => execFile('reg', ['add', k, '/v', v, '/t', 'REG_DWORD', '/d', String(light), '/f'], { windowsHide: true })); }); },
  trash: () => shell.openExternal('shell:RecycleBinFolder').catch(() => spawn('explorer.exe', ['shell:RecycleBinFolder'], { detached: true, stdio: 'ignore' }).unref()),
  gcal: () => shell.openExternal('https://calendar.google.com/'), mail: () => shell.openExternal('mailto:'), focusOn: () => { for (const win of widgetWins.values()) win.hide(); allHidden = true; }
};
function tbGeo() {
  const t = tbCfg(), disp = screen.getPrimaryDisplay(), b = disp.bounds, sz = { compact: 62, normal: 76, big: 92 }[t.size] || 76;
  const n = (t.items || []).length + 1, w = Math.min(b.width - 40, Math.max(360, n * (sz + 4) + (t.clock ? 150 : 0) + 70)), h = sz + 44;
  return { disp, bounds: { x: Math.round(b.x + (b.width - w) / 2), y: b.y, width: w, height: h } };
}
function applyTopbar() {
  const t = tbCfg();
  if (!t.enabled) { if (tbWin && !tbWin.isDestroyed()) tbWin.destroy(); tbWin = null; tbShown = false; return; }
  if (!tbWin || tbWin.isDestroyed()) {
    tbWin = new BrowserWindow({ frame: false, transparent: true, hasShadow: false, skipTaskbar: true, resizable: false, movable: false, focusable: false, show: false, type: 'toolbar', backgroundColor: '#00000000', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false } });
    tbWin.setAlwaysOnTop(true, 'pop-up-menu'); tbWin.loadFile(path.join(__dirname, 'renderer/topbar/topbar.html')); tbWin.on('closed', () => { tbWin = null; tbShown = false; });
  }
  tbWin.setBounds(tbGeo().bounds); tbWin.webContents.send('tb:update');
  if (!tbPoll) tbPoll = setInterval(tbTick, 80);
}
function tbShow(on) {
  if (!tbWin || tbWin.isDestroyed() || tbShown === on) return; tbShown = on;
  if (on) { tbWin.setBounds(tbGeo().bounds); tbWin.showInactive(); tbWin.moveTop(); tbWin.webContents.send('tb:show', true); }
  else { tbWin.webContents.send('tb:show', false); setTimeout(() => { if (!tbShown && tbWin && !tbWin.isDestroyed()) tbWin.hide(); }, 220); }
}
function tbTick() {
  if (!tbWin || tbWin.isDestroyed()) return; const t = tbCfg(), p = screen.getCursorScreenPoint(), g = tbGeo(), b = g.bounds, d = g.disp.bounds, now = Date.now();
  const atEdge = p.y <= d.y + 1 && p.x >= d.x && p.x < d.x + d.width && (t.corner || (p.x >= b.x && p.x <= b.x + b.width));
  if (!tbShown) { if (atEdge) { if (!tbEdgeSince) tbEdgeSince = now; if (now - tbEdgeSince >= (+t.delay || 0)) { tbEdgeSince = 0; tbOutSince = 0; tbShow(true); } } else tbEdgeSince = 0; return; }
  const inside = p.x >= b.x - 24 && p.x <= b.x + b.width + 24 && p.y >= b.y && p.y <= b.y + b.height + 24;
  if (inside) tbOutSince = 0; else { if (!tbOutSince) tbOutSince = now; if (now - tbOutSince > 450) tbShow(false); }
}
async function tbState() {
  const t = tbCfg(), items = [];
  for (const it of t.items || []) items.push({ ...it, img: it.kind === 'app' ? await dockIcon(it.path).catch(() => null) : null });
  return { ...t, items, theme: cfg.theme, appTheme: cfg.appTheme, lang: cfg.settings.lang, h12: cfg.settings.h12, locked: isLocked() };
}
ipcMain.handle('tb:get', () => tbState());
ipcMain.handle('tb:run', (_e, id) => {
  const it = (tbCfg().items || []).find((x) => x.id === id); if (!it) return false; tbShow(false);
  try {
    if (it.kind === 'action') { const f = TB_RUN[it.action] || (/^tool_\w+$/.test(it.action) ? () => openMain('tool:' + it.action.slice(5)) : null); if (f) f(); }
    else if (it.kind === 'url' && /^https?:\/\//i.test(it.url || '')) shell.openExternal(it.url);
    else if (it.kind === 'app' || it.kind === 'folder') shell.openPath(it.path);
    return true;
  } catch { return false; }
});
ipcMain.handle('tb:preview', () => { if (!tbCfg().enabled) return false; tbShow(true); tbOutSince = Date.now() + 2500; return true; });
ipcMain.handle('tb:pickApp', async () => { const r = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Programme und Verknüpfungen', extensions: ['exe', 'lnk', 'bat', 'cmd', 'url'] }, { name: 'Alle Dateien', extensions: ['*'] }] }); return r.canceled ? null : { path: r.filePaths[0], name: path.basename(r.filePaths[0]).replace(/\.(lnk|exe|url|bat|cmd)$/i, '') }; });
ipcMain.handle('tb:icon', (_e, p) => dockIcon(p).catch(() => null));
app.whenReady().then(() => { screen.on('display-metrics-changed', () => tbWin && applyTopbar()); });

// ---------- System-Update (GitHub Releases) ----------
const UPDATE_REPO_DEFAULT = (() => { try { return require('./package.json').updateRepo || ''; } catch { return ''; } })();
const updRepo = () => (cfg.settings.updateRepo || UPDATE_REPO_DEFAULT || '').trim();
let updInfo = null;
async function updCheck() {
  try { updInfo = await updater.check(updRepo()); } catch (e) { updInfo = { ok: false, error: 'Keine Verbindung zu GitHub.' }; }
  cfg.update = { ...updInfo, at: Date.now(), repo: updRepo() }; delete cfg.update.notes; broadcast(); return { ...updInfo, repo: updRepo() };
}
ipcMain.handle('upd:check', () => updCheck());
ipcMain.handle('upd:info', () => ({ version: app.getVersion(), repo: updRepo(), last: updInfo }));
ipcMain.handle('upd:install', async (e) => {
  if (!updInfo || !updInfo.available) await updCheck();
  if (!updInfo || !updInfo.available) return { ok: false, error: 'Kein Update verfügbar.' };
  try { writeCfgNow(); await updater.install(updInfo, (p) => { try { e.sender.send('upd:progress', p); } catch {} }); return { ok: true }; } catch (err) { return { ok: false, error: String(err.message || err) }; }
});

// ---------- Start-Animation ----------
let splashWin = null;
function showSplash(done) {
  const mode = (cfg && cfg.settings && cfg.settings.splash) || 'normal';
  if (mode === 'off' && !process.env.AW_CAPTURE) { done && done(); return; }
  const ms = Number(process.env.AW_SPLASH_MS || (mode === 'short' ? 1700 : 3000));
  const d = screen.getPrimaryDisplay().workArea, W = 600, H = 420;
  splashWin = new BrowserWindow({
    width: W, height: H, x: Math.round(d.x + (d.width - W) / 2), y: Math.round(d.y + (d.height - H) / 2),
    frame: false, transparent: true, resizable: false, movable: false, skipTaskbar: true, alwaysOnTop: true, hasShadow: false,
    show: false, backgroundColor: '#00000000', paintWhenInitiallyHidden: true, webPreferences: { contextIsolation: true, nodeIntegration: false }
  });
  splashWin.loadFile(path.join(__dirname, 'renderer/splash/splash.html'), { query: { ms: String(ms) } });
  let finished = false;
  const finish = () => { if (finished) return; finished = true; try { if (splashWin && !splashWin.isDestroyed()) splashWin.destroy(); } catch {} splashWin = null; done && done(); };
  // Die Animation läuft erst ab dem Moment, in dem das Fenster wirklich sichtbar ist (erster Start kann langsam sein)
  splashWin.once('ready-to-show', () => { if (!splashWin) return; splashWin.showInactive(); splashWin.moveTop(); splashWin.webContents.executeJavaScript('start()').catch(() => {}); setTimeout(finish, ms); });
  setTimeout(finish, ms + 12000);
}

// ---------- Google Kalender (private iCal-Adresse, nur lesen; von Fynn) ----------
let gcalBusy = false;
async function syncGcal() {
  const urls = (cfg.settings.icalUrls || '').trim();
  if (!urls) { cfg.gcalEvents = []; cfg.gcal = { ok: null }; cfg.eventsRev = (cfg.eventsRev || 0) + 1; saveCfg(); broadcast(); return; }
  if (gcalBusy) return; gcalBusy = true;
  cfg.gcal = { ...(cfg.gcal || {}), syncing: true }; broadcast();
  try {
    const list = await gcal.fetchList(urls);
    cfg.gcalEvents = list; cfg.gcal = { ok: true, count: list.length, at: Date.now() };
  } catch (e) {
    cfg.gcal = { ok: false, msg: String(e.message || e), at: Date.now() };
  } finally { gcalBusy = false; }
  cfg.eventsRev = (cfg.eventsRev || 0) + 1; saveCfg(); broadcast();
}
function startGcal() { syncGcal(); setInterval(syncGcal, 10 * 60 * 1000); }
ipcMain.handle('gcal:set', (_e, urls) => { cfg.settings.icalUrls = String(urls || '').trim(); saveCfg(); syncGcal(); return true; });
ipcMain.handle('gcal:sync', () => syncGcal());
ipcMain.handle('gcal:open', () => shell.openExternal('https://calendar.google.com/calendar/u/0/r/settings'));

// ---------- Systemdaten für Fynns Systemmonitor ----------
let fyLastCpu = null;
function fyCpuUsage() {
  const cpus = os.cpus(); let idle = 0, total = 0;
  for (const c of cpus) { for (const k in c.times) total += c.times[k]; idle += c.times.idle; }
  let pct = 0; if (fyLastCpu) { const di = idle - fyLastCpu.idle, dt = total - fyLastCpu.total; pct = dt > 0 ? (1 - di / dt) * 100 : 0; }
  fyLastCpu = { idle, total }; return pct;
}
ipcMain.handle('fy:sysinfo', () => ({ cpu: fyCpuUsage(), memTotal: os.totalmem(), memFree: os.freemem(), uptime: os.uptime(), host: os.hostname() }));

// ---------- Vorschau-Bilder für Tests (AW_CAPTURE=Ordner) ----------
function startCapture() {
  const out = process.env.AW_CAPTURE;
  const snap = async (win, name) => { try { if (win && !win.isDestroyed()) fs.writeFileSync(path.join(out, name + '.png'), (await win.webContents.capturePage()).toPNG()); } catch (e) { console.error(e); } };
  setTimeout(() => snap(splashWin, 'splash-1'), 900);
  setTimeout(() => snap(splashWin, 'splash-2'), 2300);
  setTimeout(async () => {
    for (const pg of (process.env.AW_PAGES || 'store').split('|')) {
      if (mainWin && pg.includes('=')) { const [nm, code] = pg.split(/=(.*)/s); await mainWin.webContents.executeJavaScript(code).catch((e) => console.error(e)); await new Promise((r) => setTimeout(r, 2500)); await snap(mainWin, 'page-' + nm); continue; }
      if (mainWin) { mainWin.webContents.send('navigate', pg); await new Promise((r) => setTimeout(r, 2500)); await snap(mainWin, 'page-' + pg.replace(/[^a-z0-9-]/gi, '_')); }
    }
    for (const [id, win] of widgetWins) { const w = find(id); await snap(win, 'w-' + (w ? w.type : id)); }
    if (tbWin) { tbShow(true); tbOutSince = Date.now() + 9e9; await new Promise((r) => setTimeout(r, 1500)); await snap(tbWin, 'topbar'); }
    app.exit(0);
  }, Number(process.env.AW_CAPTURE_DELAY || 6000));
}

// ---------- Werkzeuge ----------
ipcMain.handle('tool:copyImage', (_e, url) => { try { clipboard.writeImage(nativeImage.createFromDataURL(String(url))); return true; } catch { return false; } });
ipcMain.handle('tool:savePng', async (_e, url, name) => {
  const m = /^data:image\/(png|gif|jpeg);base64,(.+)$/.exec(String(url)); if (!m) return false;
  const r = await dialog.showSaveDialog(mainWin, { defaultPath: path.join(app.getPath('downloads'), name || 'bild.png'), filters: [{ name: 'Bild', extensions: [m[1] === 'jpeg' ? 'jpg' : m[1]] }] });
  if (r.canceled || !r.filePath) return false; fs.writeFileSync(r.filePath, Buffer.from(m[2], 'base64')); return true;
});
ipcMain.handle('tool:sys', () => {
  const net = []; for (const [name, list] of Object.entries(os.networkInterfaces())) for (const a of list || []) if (a.family === 'IPv4' && !a.internal) net.push({ name, ip: a.address });
  const c = os.cpus();
  return { host: os.hostname(), os: (os.version ? os.version() : os.type()) + ' (' + os.release() + ', ' + os.arch() + ')', cpu: (c[0] && c[0].model || '').trim(), cores: c.length, memTotal: os.totalmem(), memFree: os.freemem(), uptime: os.uptime(), user: (() => { try { return os.userInfo().username; } catch { return ''; } })(), net, app: app.getVersion() };
});

// ---------- Gäste-Modus (PIN) ----------
const pinHash = (pin, salt) => crypto.scryptSync(String(pin), salt, 32).toString('hex');
const pinOk = (pin) => { const l = cfg.lock || {}; if (!l.hash || !l.salt) return false; try { return crypto.timingSafeEqual(Buffer.from(pinHash(pin, l.salt), 'hex'), Buffer.from(l.hash, 'hex')); } catch { return false; } };
let pinFails = 0, pinWaitUntil = 0;
function lockApply() { cfg.runtime = { ...(cfg.runtime || {}), locked: isLocked(), lockOn: !!(cfg.lock && cfg.lock.enabled) }; updateTray(); if (tbWin && !tbWin.isDestroyed()) tbWin.webContents.send('tb:update'); broadcast(); }
const LOCK_ALLOW_DEFAULT = { tools: true, tasks: true, widgetsToggle: true };
ipcMain.handle('lock:setup', (_e, pin, allow) => {
  if (isLocked() || !/^\d{4,8}$/.test(String(pin))) return false;
  const salt = crypto.randomBytes(16).toString('hex');
  cfg.lock = { enabled: true, salt, hash: pinHash(pin, salt), allow: { ...LOCK_ALLOW_DEFAULT, ...(allow || {}) } };
  lockUnlocked = false; saveCfg(); lockApply(); return true;
});
ipcMain.handle('lock:unlock', (_e, pin) => {
  if (Date.now() < pinWaitUntil) return { ok: false, wait: Math.ceil((pinWaitUntil - Date.now()) / 1000) };
  if (pinOk(pin)) { pinFails = 0; lockUnlocked = true; lockApply(); return { ok: true }; }
  pinFails++; if (pinFails >= 5) { pinWaitUntil = Date.now() + 30000 * Math.min(pinFails - 4, 10); }
  return { ok: false, wait: Date.now() < pinWaitUntil ? Math.ceil((pinWaitUntil - Date.now()) / 1000) : 0 };
});
ipcMain.handle('lock:relock', () => { if (!(cfg.lock && cfg.lock.enabled)) return false; lockUnlocked = false; lockApply(); if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send('navigate', 'home'); return true; });
ipcMain.handle('lock:allow', (_e, allow) => { if (isLocked() || !cfg.lock) return false; cfg.lock.allow = { ...LOCK_ALLOW_DEFAULT, ...(allow || {}) }; saveCfg(); lockApply(); return true; });
ipcMain.handle('lock:changePin', (_e, pin) => { if (isLocked() || !cfg.lock || !/^\d{4,8}$/.test(String(pin))) return false; cfg.lock.salt = crypto.randomBytes(16).toString('hex'); cfg.lock.hash = pinHash(pin, cfg.lock.salt); saveCfg(); return true; });
ipcMain.handle('lock:disable', () => { if (isLocked()) return false; cfg.lock = { enabled: false }; lockUnlocked = false; saveCfg(); lockApply(); return true; });
