const bar = document.getElementById('bar'); let st = null, clockT = null;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function tick() { const c = document.querySelector('.clk'); if (!c || !st) return; const n = new Date(), loc = st.lang === 'en' ? 'en-GB' : st.lang === 'ru' ? 'ru-RU' : 'de-CH';
  c.querySelector('b').textContent = n.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit', hour12: st.h12 === '12' });
  c.querySelector('small').textContent = n.toLocaleDateString(loc, { weekday: 'short', day: 'numeric', month: 'short' }); }
async function load() {
  st = await window.api.tbGet(); const s = { compact: 62, normal: 76, big: 92 }[st.size] || 76;
  document.documentElement.style.setProperty('--s', s + 'px'); document.body.classList.toggle('light', (st.appTheme || {}).mode === 'light');
  bar.innerHTML = (st.clock ? '<div class="clk"><b></b><small></small></div>' : '') + st.items.map((it) => { const f = tbItemInfo(it); return `<div class="it" data-id="${esc(it.id)}" title="${esc(f.name)}">${it.img ? `<img src="${it.img}" alt="">` : `<i>${esc(f.icon)}</i>`}<span>${esc(f.name)}</span></div>`; }).join('')
    + (st.locked ? '' : '<div class="it gear" data-id="__set" title="Leiste anpassen"><i>⚙️</i><span>Anpassen</span></div>');
  bar.querySelectorAll('.it').forEach((e) => (e.onclick = () => (e.dataset.id === '__set' ? window.api.openApp('tbsettings') : window.api.tbRun(e.dataset.id))));
  tick(); clearInterval(clockT); clockT = setInterval(tick, 5000);
}
window.api.onTb((ev) => { if (ev === 'update') load(); else { document.body.classList.toggle('show', ev === 'show'); if (ev === 'show') tick(); } });
load();
