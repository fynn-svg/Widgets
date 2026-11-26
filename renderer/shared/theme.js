const hexRgb = (h) => { h = (h || '#000000').replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16) || 0; return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; };
const rgba = (h, a) => { const { r, g, b } = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };
const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const FONTS = {
  'System (Segoe UI)': "'Segoe UI Variable Display','Segoe UI',system-ui,sans-serif",
  'Windows (Segoe UI)': "'Segoe UI Variable Display','Segoe UI',system-ui,sans-serif",
  'Apple (SF Pro, falls installiert)': "'SF Pro Display','Segoe UI Variable Display','Segoe UI',sans-serif",
  'Serif (Georgia)': "Georgia,'Times New Roman',serif",
  'Monospace (Consolas)': "Consolas,'Cascadia Mono',monospace",
  'Rund (Trebuchet)': "'Trebuchet MS','Segoe UI',sans-serif"
};
const PRESETS = {
  'Apple Dark': { bg1: '#1c1c1e', bg2: '#2c2c2e', gradient: false, opacity: 0.94, text: '#ffffff', text2Color: '', icon: '#ffffff', accent: '#ff9f0a', btn: '#0a84ff', progress: '#30d158', border: '#ffffff', borderOpacity: 0.1, glass: true, acrylic: false, radius: 22, shadow: 30 },
  'Apple Light': { bg1: '#f5f5f7', bg2: '#ffffff', gradient: false, opacity: 0.97, text: '#1d1d1f', text2Color: '', icon: '#1d1d1f', accent: '#ff3b30', btn: '#0a84ff', progress: '#30d158', border: '#000000', borderOpacity: 0.06, glass: true, acrylic: false, radius: 22, shadow: 30 },
  'Grey Minimal': { bg1: '#8e8e93', bg2: '#636366', gradient: false, opacity: 0.88, text: '#ffffff', text2Color: '', icon: '#ffffff', accent: '#ffffff', btn: '#ffffff', progress: '#ffffff', border: '#ffffff', borderOpacity: 0.08, glass: false, acrylic: false, radius: 20, shadow: 0 },
  'Black Glass': { bg1: '#000000', bg2: '#1c1c1e', gradient: false, opacity: 0.5, text: '#ffffff', text2Color: '', icon: '#ffffff', accent: '#ffffff', btn: '#0a84ff', progress: '#30d158', border: '#ffffff', borderOpacity: 0.18, glass: true, acrylic: true, radius: 24, shadow: 20 },
  'White Glass': { bg1: '#ffffff', bg2: '#e5e5ea', gradient: false, opacity: 0.45, text: '#1d1d1f', text2Color: '', icon: '#1d1d1f', accent: '#ff3b30', btn: '#0a84ff', progress: '#30d158', border: '#ffffff', borderOpacity: 0.6, glass: true, acrylic: true, radius: 24, shadow: 20 },
  'Transparent': { bg1: '#000000', bg2: '#000000', gradient: false, opacity: 0, text: '#ffffff', text2Color: '', icon: '#ffffff', accent: '#ffffff', btn: '#ffffff', progress: '#ffffff', border: '#ffffff', borderOpacity: 0, glass: false, acrylic: false, radius: 22, shadow: 0 },
  'Transparentes Schwarz': { bg1: '#000000', gradient: false, opacity: 0.55, text: '#ffffff', icon: '#ffffff', border: '#ffffff', borderOpacity: 0.12, acrylic: false },
  'Transparentes Weiss': { bg1: '#ffffff', gradient: false, opacity: 0.62, text: '#111111', icon: '#111111', border: '#ffffff', borderOpacity: 0.5, acrylic: false },
  'Dunkel': { bg1: '#1c1c1e', gradient: false, opacity: 0.96, text: '#ffffff', icon: '#ffffff', border: '#ffffff', borderOpacity: 0.08, acrylic: false },
  'Hell': { bg1: '#f5f5f7', gradient: false, opacity: 0.97, text: '#1d1d1f', icon: '#1d1d1f', border: '#000000', borderOpacity: 0.06, acrylic: false },
  'Glassmorphism': { bg1: '#ffffff', bg2: '#8ab4ff', gradient: true, angle: 135, opacity: 0.22, text: '#ffffff', icon: '#ffffff', border: '#ffffff', borderOpacity: 0.35, acrylic: false },
  'Milchglas (Acrylic)': { bg1: '#202020', gradient: false, opacity: 0.35, text: '#ffffff', icon: '#ffffff', border: '#ffffff', borderOpacity: 0.1, acrylic: true },
  'Apple Glas (grau)': { bg1: '#8a93a6', gradient: false, opacity: 0.55, text: '#ffffff', icon: '#ffffff', border: '#ffffff', borderOpacity: 0.28, acrylic: false },
  'Apple Glas (violett)': { bg1: '#c9b8ff', bg2: '#7b61ff', gradient: true, angle: 150, opacity: 0.35, text: '#ffffff', icon: '#ffffff', border: '#ffffff', borderOpacity: 0.4, acrylic: false },
  'Sonnenuntergang': { bg1: '#ff9f0a', bg2: '#ff375f', gradient: true, angle: 150, opacity: 0.92, text: '#ffffff', icon: '#ffffff', border: '#ffffff', borderOpacity: 0.15, acrylic: false },
  'Ozean': { bg1: '#0a84ff', bg2: '#5e5ce6', gradient: true, angle: 160, opacity: 0.92, text: '#ffffff', icon: '#ffffff', border: '#ffffff', borderOpacity: 0.15, acrylic: false }
};
const BG_STYLES = {
  'Vollständig transparent': { bg1: '#000000', gradient: false, opacity: 0, acrylic: false, borderOpacity: 0, glass: false },
  'Leicht transparent': { bg1: '#000000', gradient: false, opacity: 0.22, acrylic: false },
  'Milchglas (Glassmorphism)': { bg1: '#ffffff', bg2: '#9bb8ff', gradient: true, angle: 135, opacity: 0.22, acrylic: false, borderOpacity: 0.35, glass: true },
  'Milchglas (Windows Acrylic)': { bg1: '#202020', gradient: false, opacity: 0.35, acrylic: true },
  'Dunkel transparent': { bg1: '#1c1c1e', gradient: false, opacity: 0.62, acrylic: false },
  'Hell transparent': { bg1: '#ffffff', gradient: false, opacity: 0.62, acrylic: false },
  'Grau transparent': { bg1: '#8e8e93', gradient: false, opacity: 0.55, acrylic: false },
  'Schwarz transparent': { bg1: '#000000', gradient: false, opacity: 0.55, acrylic: false }
};
const PALETTE = [['Schwarz', '#000000'], ['Dunkelgrau', '#3a3a3c'], ['Hellgrau', '#d1d1d6'], ['Weiss', '#ffffff'], ['Rot', '#ff3b30'], ['Blau', '#0a84ff'], ['Grün', '#30d158'], ['Violett', '#bf5af2'], ['Rosa', '#ff375f'], ['Orange', '#ff9f0a'], ['Gelb', '#ffd60a']];
function applyTheme(el, t, rt) {
  const acr = t.acrylic && !(rt && rt.acrylicOk === false);
  const bg = t.gradient ? `linear-gradient(${t.angle ?? 135}deg, ${rgba(t.bg1, t.opacity)}, ${rgba(t.bg2 || t.bg1, t.opacity)})` : rgba(t.bg1, t.opacity);
  const s = el.style;
  s.setProperty('--bg', acr ? rgba(t.bg1, Math.min(0.6, t.opacity)) : (t.acrylic ? rgba(t.bg1, Math.max(t.opacity, 0.7)) : bg));
  s.setProperty('--hl', t.glass === false ? 'transparent' : 'rgba(255,255,255,.16)');
  s.setProperty('--num', t.numColor || t.text); s.setProperty('--temp', t.tempColor || t.text); s.setProperty('--day', t.dayColor || t.text); s.setProperty('--today', t.todayColor || '#ff3b30');
  s.setProperty('--text', t.text); s.setProperty('--text2', t.text2Color || rgba(t.text, 0.62)); s.setProperty('--line', rgba(t.text, 0.14));
  s.setProperty('--accent', t.accent); s.setProperty('--icon', t.icon); s.setProperty('--btn', t.btn);
  s.setProperty('--progress', t.progress); s.setProperty('--track', rgba(t.text, 0.16));
  s.setProperty('--border', rgba(t.border, t.borderOpacity)); s.setProperty('--radius', typeof t.radius === 'string' ? t.radius : (t.radius ?? 22) + 'px');
  s.setProperty('--fs', t.fontSizeScale || 1); s.setProperty('--fw', { thin: 200, light: 300, regular: 400, medium: 500 }[t.fontWeight] || 300);
  s.setProperty('--font', t.font);
  s.setProperty('--pad', t.padding || 1); s.setProperty('--align', t.align || 'left');
  const sh = +t.shadow || 0; s.setProperty('--shadow', sh > 0 ? `inset 0 ${-(sh / 10).toFixed(1)}px ${(sh / 4).toFixed(1)}px ${-(sh / 12).toFixed(1)}px rgba(0,0,0,${(sh / 220).toFixed(2)})` : 'inset 0 0 0 0 transparent');
  el.style.opacity = t.widgetOpacity !== undefined && t.widgetOpacity !== '' ? t.widgetOpacity : '';
  if (t.fontPx) s.setProperty('--fpx', t.fontPx + 'px'); else s.removeProperty('--fpx');
  // Hintergrundbild (optional) mit eigener Deckkraft und Unschärfe
  let img = el.querySelector(':scope > .wimg');
  if (t.bgImage) { if (!img) { img = document.createElement('div'); img.className = 'wimg'; el.insertBefore(img, el.firstChild); } img.style.backgroundImage = `url("${t.bgImage}")`; img.style.opacity = t.bgImageOpacity ?? 0.6; img.style.filter = `blur(${t.bgImageBlur || 0}px)`; }
  else if (img) img.remove();
}

if (typeof module !== 'undefined' && module.exports) module.exports = { PRESETS, BG_STYLES, hexRgb, rgba };
