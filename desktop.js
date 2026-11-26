'use strict';
// Hält Widget-Fenster auf dem Desktop: hinter allen App-Fenstern, auch nach Windows+D sichtbar.
// Technik: Fenster wird dem Desktop-Fenster "Progman" untergeordnet (Owner) und ganz nach hinten gesetzt.
let api = null;

function init() {
  if (api !== null) return !!api;
  api = false;
  if (process.platform !== 'win32') return false;
  try {
    const koffi = require('koffi');
    const u = koffi.load('user32.dll');
    api = {
      FindWindowW: u.func('intptr_t __stdcall FindWindowW(str16 cls, str16 name)'),
      SetWindowLongPtrW: u.func('intptr_t __stdcall SetWindowLongPtrW(intptr_t hwnd, int idx, intptr_t val)'),
      SetWindowPos: u.func('bool __stdcall SetWindowPos(intptr_t hwnd, intptr_t after, int x, int y, int cx, int cy, uint32_t flags)'),
    };
  } catch (e) {
    console.error('desktop pinning unavailable', e);
    api = false;
  }
  return !!api;
}

function hwndOf(win) {
  const b = win.getNativeWindowHandle();
  return b.length >= 8 ? Number(b.readBigUInt64LE(0)) : b.readUInt32LE(0);
}

const SWP_NOSIZE = 0x1, SWP_NOMOVE = 0x2, SWP_NOACTIVATE = 0x10, SWP_NOOWNERZORDER = 0x200;
const HWND_BOTTOM = 1, GWLP_HWNDPARENT = -8;

function pin(win) {
  if (!init() || win.isDestroyed()) return;
  try {
    const progman = api.FindWindowW('Progman', null);
    if (progman) api.SetWindowLongPtrW(hwndOf(win), GWLP_HWNDPARENT, progman);
    toBottom(win);
  } catch (e) { console.error(e); }
}

function unpin(win) {
  if (!init() || win.isDestroyed()) return;
  try { api.SetWindowLongPtrW(hwndOf(win), GWLP_HWNDPARENT, 0); } catch (e) { console.error(e); }
}

function toBottom(win) {
  if (!init() || win.isDestroyed()) return;
  try { api.SetWindowPos(hwndOf(win), HWND_BOTTOM, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE | SWP_NOACTIVATE | SWP_NOOWNERZORDER); } catch (e) { console.error(e); }
}

module.exports = { init, pin, unpin, toBottom };
