// Musik-Widget: zeigt automatisch die aktuelle Windows-Mediensitzung (Spotify, Apple Music, YouTube Music, Media Player …)
const MU_ICON = {
  play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><rect x="5.5" y="4.5" width="4.5" height="15" rx="1.2" fill="currentColor"/><rect x="14" y="4.5" width="4.5" height="15" rx="1.2" fill="currentColor"/></svg>',
  prev: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="2.6" height="14" rx="1" fill="currentColor"/><path d="M20 5v14L8.5 12z" fill="currentColor"/></svg>',
  next: '<svg viewBox="0 0 24 24"><rect x="17.4" y="5" width="2.6" height="14" rx="1" fill="currentColor"/><path d="M4 5v14l11.5-7z" fill="currentColor"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/></svg>'
};
const fmtSec = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function dominantColor(img) { // mittlere, kräftige Farbe des Covers (für dynamische Hintergründe)
  try {
    const c = document.createElement('canvas'); c.width = c.height = 12; const x = c.getContext('2d'); x.drawImage(img, 0, 0, 12, 12); const d = x.getImageData(0, 0, 12, 12).data; let r = 0, g = 0, b = 0, w = 0;
    for (let i = 0; i < d.length; i += 4) { const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]), sat = mx ? (mx - mn) / mx : 0, wt = 0.15 + sat * sat * 2 + (mx > 40 && mx < 235 ? 0.3 : 0); r += d[i] * wt; g += d[i + 1] * wt; b += d[i + 2] * wt; w += wt; }
    return w ? [Math.round(r / w), Math.round(g / w), Math.round(b / w)] : null;
  } catch { return null; }
}
reg('music', { name: 'Musik', cat: 'apple', icon: '🎵', size: 'M', theme: { ...TH.black, bg1: '#1c1c1e', opacity: 0.92, radius: 26 }, desc: 'Erkennt automatisch, was unter Windows spielt: Cover, Titel, Interpret, Wiedergabe-Steuerung',
  settings: [
    { key: 'mode', label: 'Darstellung', type: 'select', options: [['auto', 'Automatisch nach Grösse'], ['minimal', 'Minimal (nur Cover)'], ['compact', 'Kompakt'], ['medium', 'Mittel'], ['expanded', 'Erweitert (mit Fortschritt)'], ['hover', 'Hover: Steuerung beim Darüberfahren']], def: 'auto' },
    { key: 'bgMode', label: 'Hintergrund', type: 'select', options: [['album', 'Cover (unscharf)'], ['color', 'Farbe aus dem Cover'], ['theme', 'Mein Design']], def: 'album' },
    { key: 'titleColor', label: 'Titelfarbe', type: 'color' }, { key: 'artistColor', label: 'Interpretenfarbe', type: 'color' }, { key: 'btnColor', label: 'Farbe der Tasten', type: 'color' }, { key: 'progColor', label: 'Farbe des Fortschrittsbalkens', type: 'color' }
  ],
  render(c) {
    let st = { active: false }, art = '', artKey = '', dead = false, shown = '', domBg = null;
    const P = c.props, root = c.el, card = c.el.parentElement, bg0 = card.style.getPropertyValue('--bg');
    const col = (k, v) => (P[k] ? `style="--${v}:${P[k]}"` : '');
    c.el.style.padding = '0';
    const modeNow = (w, h) => { const m = P.mode || 'auto'; return m !== 'auto' ? m : w < 150 ? 'minimal' : w < 260 ? 'compact' : h < 200 ? 'medium' : 'expanded'; };
    const bgLayer = () => { // Hintergrund: Cover unscharf oder Farbe aus dem Cover
      let l = card.querySelector(':scope > .mu-bg'); const bm = P.bgMode || 'album';
      if (bm === 'theme' || !art) { if (l) l.remove(); card.style.setProperty('--bg', bg0); return; } if (!l) { l = document.createElement('div'); l.className = 'mu-bg'; card.insertBefore(l, card.firstChild); }
      if (bm === 'album') { l.innerHTML = `<img src="${art}" style="opacity:0"><i></i>`; const im = l.firstChild; requestAnimationFrame(() => (im.style.opacity = '1')); card.style.setProperty('--bg', 'transparent'); }
      else if (domBg) { l.innerHTML = '<i></i>'; l.style.background = `linear-gradient(160deg, rgb(${domBg.map((v) => Math.round(v * 0.8))}), rgb(${domBg.map((v) => Math.round(v * 0.35))}))`; card.style.setProperty('--bg', 'transparent'); }
    };
    const draw = () => {
      const w = root.clientWidth, h = root.clientHeight; if (!w) return; const mode = modeNow(w, h), playing = st.status === 'Playing';
      card.classList.toggle('mu-card', true);
      if (!st.active || !st.title) {
        const unsup = st.supported === false;
        root.innerHTML = `<div class="mu mu-empty"><span class="mu-note">${MU_ICON.note}</span><b>${unsup ? 'Windows only' : t('music.none')}</b>${w > 200 && !unsup ? `<span>${t('music.hint')}</span>` : ''}</div>`;
        bgLayer(); return;
      }
      const cover = art ? `<img class="mu-art" src="${art}">` : `<div class="mu-art mu-noart">${MU_ICON.note}</div>`;
      const btn = (k, big) => `<button class="mu-b ${big ? 'big' : ''}" data-k="${k}" ${col('btnColor', 'mb')}>${MU_ICON[k === 'play' ? (playing ? 'pause' : 'play') : k]}</button>`;
      const titles = `<div class="mu-t"><b class="mu-title" ${col('titleColor', 'mt')}>${esc(st.title)}</b><span class="mu-artist" ${col('artistColor', 'ma')}>${esc([st.artist, mode === 'expanded' || mode === 'hover' ? st.album : ''].filter(Boolean).join(' — '))}</span></div>`;
      const prog = `<div class="mu-p"><div class="mu-bar" ${col('progColor', 'mp')}><i></i></div><div class="mu-tm"><span class="mu-cur">0:00</span><span class="mu-rem">-0:00</span></div></div>`;
      let h2;
      if (mode === 'minimal') h2 = `<div class="mu mu-min">${cover}<div class="mu-ov">${btn('play', true)}</div></div>`;
      else if (mode === 'compact') h2 = `<div class="mu mu-cmp">${cover}${titles}<div class="mu-row">${btn('prev')}${btn('play', true)}${btn('next')}</div></div>`;
      else if (mode === 'medium') h2 = `<div class="mu mu-med">${cover}<div class="mu-r">${titles}<div class="mu-row">${btn('prev')}${btn('play', true)}${btn('next')}</div></div></div>`;
      else if (mode === 'hover') h2 = `<div class="mu mu-med mu-hov">${cover}<div class="mu-r">${titles}<div class="mu-hide">${prog}<div class="mu-row">${btn('prev')}${btn('play', true)}${btn('next')}</div></div></div></div>`;
      else h2 = `<div class="mu mu-exp"><div class="mu-top">${cover}${titles}</div>${prog}<div class="mu-row">${btn('prev')}${btn('play', true)}${btn('next')}</div></div>`;
      root.innerHTML = h2; root.classList.add('mu-fade'); setTimeout(() => root.classList.remove('mu-fade'), 450);
      root.querySelectorAll('.mu-b').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); c.api.media(b.dataset.k); setTimeout(poll, 400); }));
      const im = root.querySelector('img.mu-art'); if (im) { im.onload = () => { const d = dominantColor(im); if (d) { domBg = d; if ((P.bgMode || 'album') === 'color') bgLayer(); } }; }
      tickBar(); bgLayer();
    };
    const tickBar = () => { // Fortschritt zwischen den Abfragen selbst weiterrechnen
      const bar = root.querySelector('.mu-bar i'); if (!bar || !st.dur) return; const el = (st.status === 'Playing' ? (Date.now() - st.at) / 1000 : 0), pos = Math.min(st.dur, (st.pos || 0) + el);
      bar.style.width = (pos / st.dur * 100) + '%'; const a = root.querySelector('.mu-cur'), r = root.querySelector('.mu-rem'); if (a) a.textContent = fmtSec(pos); if (r) r.textContent = '-' + fmtSec(Math.max(0, st.dur - pos));
    };
    const poll = async () => {
      if (dead || document.hidden) return; let s; try { s = await c.api.mediaState(artKey); } catch { return; } if (dead) return;
      if (s.art !== undefined) { art = s.art || ''; domBg = null; } if (s.artKey !== undefined) artKey = s.artKey || ''; if (!s.active) { art = ''; artKey = ''; }
      const sig = [s.active, s.title, s.artist, s.album, s.status, artKey, s.supported].join('|'); st = s;
      if (sig !== shown) { shown = sig; draw(); } else tickBar();
    };
    root.innerHTML = '<div class="mu mu-empty"><span class="mu-note">' + MU_ICON.note + '</span></div>';
    const stop = sized(c, () => { shown = ''; draw(); }), iv = setInterval(poll, 1200), tk = setInterval(tickBar, 500); poll();
    return () => { dead = true; stop(); clearInterval(iv); clearInterval(tk); const l = card.querySelector(':scope > .mu-bg'); if (l) l.remove(); card.style.setProperty('--bg', bg0); card.classList.remove('mu-card'); };
  } });
