// ---------- Kategorien und Designs für die Widget-Auswahl (wie macOS) ----------
TH.gray = { bg1: '#8a93a6', bg2: '#6f788c', gradient: true, angle: 170, opacity: 0.78, text: '#ffffff', icon: '#ffffff', accent: '#ffffff', btn: '#ffffff', progress: '#ffffff', border: '#ffffff', borderOpacity: 0.3, acrylic: false };
const CATS = [
  { id: 'clock', name: 'Uhr', icon: '🕐', group: 'apple', types: ['clock-analog', 'clock-digital', 'world-clock'] },
  { id: 'weather', name: 'Wetter', icon: '⛅', group: 'apple', types: ['weather', 'sunset'] },
  { id: 'calendar', name: 'Kalender', icon: '📅', group: 'apple', types: ['calendar', 'agenda'] },
  { id: 'reminders', name: 'Erinnerungen / To-do', icon: '✅', group: 'apple', types: ['reminders', 'todo', 'shopping'] },
  { id: 'notes', name: 'Notizen', icon: '📝', group: 'apple', types: ['notes'] },
  { id: 'photos', name: 'Fotos', icon: '🖼️', group: 'apple', types: ['photos'] },
  { id: 'battery', name: 'Batterien', icon: '🔋', group: 'apple', types: ['battery'] },
  { id: 'stocks', name: 'Aktien', icon: '📈', group: 'apple', types: ['stocks'] },
  { id: 'news', name: 'Nachrichten', icon: '📰', group: 'apple', types: ['news'] },
  { id: 'music', name: 'Musik', icon: '🎵', group: 'apple', types: ['music'] },
  { id: 'contacts', name: 'Kontakte', icon: '👤', group: 'apple', types: ['contacts'] },
  { id: 'screentime', name: 'Bildschirmzeit', icon: '⏱️', group: 'apple', types: ['screentime'] },
  { id: 'shortcuts', name: 'Suche und Kurzbefehle', icon: '🔍', group: 'apple', types: ['search', 'shortcut'] },
  { id: 'calc', name: 'Rechner', icon: '🧮', group: 'apple', types: ['calculator'] },
  { id: 'system', name: 'Computer und System', icon: '📊', group: 'extra', types: ['system', 'cpu', 'ram', 'gpu', 'disk', 'netactivity', 'network', 'sysinfo', 'temperature'] },
  { id: 'plan', name: 'Planung', icon: '🗓️', group: 'extra', types: ['weekplan', 'dayplan', 'countdown', 'pomodoro', 'habits', 'goals', 'eisenhower'] },
  { id: 'tools', name: 'Werkzeuge', icon: '🧰', group: 'extra', types: ['clipboard', 'quicksettings', 'focus'] },
  { id: 'misc', name: 'Weitere', icon: '💬', group: 'extra', types: ['quote'] },
  { id: 'fy-clocks', name: 'Uhren XL', icon: '⏰', group: 'fynn', types: ['fy-clock', 'fy-analog'] },
  { id: 'fy-cal', name: 'Kalender Plus', icon: '📆', group: 'fynn', types: ['fy-calendar'] },
  { id: 'fy-wx', name: 'Wetter Himmel', icon: '🌤️', group: 'fynn', types: ['fy-weather'] },
  { id: 'fy-todo', name: 'Aufgaben und Notizen', icon: '☑️', group: 'fynn', types: ['fy-todos', 'fy-notes'] },
  { id: 'fy-sys', name: 'Systemmonitor', icon: '🖥️', group: 'fynn', types: ['fy-system'] }
];
// Wer hat welche Gruppe gebaut (für den Widget Store)
const CREATORS = { apple: 'Arsenii', extra: 'Arsenii', fynn: 'Fynn' };
const creatorOf = (cat) => CREATORS[cat.group] || 'Arsenii';
const V = (name, size, props, theme) => ({ name, size, props: props || {}, theme: theme || null });
const BLK = { ...TH.black }, WHT = { ...TH.white };
const VAR = {
  'music': [V('Minimal (Cover)', 'S', { mode: 'minimal' }), V('Kompakt', 'S', { mode: 'compact' }), V('Mittel', 'M', { mode: 'medium' }), V('Erweitert', 'L', { mode: 'expanded' }, null), V('Erweitert, breit', [470, 200], { mode: 'expanded' }), V('Hover: Steuerung beim Darüberfahren', 'M', { mode: 'hover' }), V('Farbe aus dem Cover', 'M', { mode: 'medium', bgMode: 'color' }), V('Mein Design (ohne Cover-Hintergrund)', 'M', { mode: 'medium', bgMode: 'theme' }, { ...TH.black })],
  'clock-analog': [V('Analog hell', 'S', { face: 'weiss' }, BLK), V('Analog dunkel', 'S', { face: 'schwarz' }, BLK), V('Strichuhr', 'S', { face: 'strich' }, BLK), V('Analog ohne Hintergrund', 'S', { face: 'weiss' }, TH.none), V('Analog sehr klein', 'XS', { face: 'weiss' }, BLK), V('Analog gross', 'L', { face: 'weiss' }, BLK)],
  'clock-digital': [V('Digital gross (hell)', 'S', { style: 'gross' }, { ...WHT, accent: '#111' }), V('Digital gross (dunkel)', 'S', { style: 'gross' }, BLK), V('Digital dünn mit Datum', 'M', { style: 'modern' }, BLK), V('Digital sehr klein', 'XS', { style: 'gross' }, BLK), V('Digital gross, breit', 'M', { style: 'gross' }, { ...WHT, accent: '#111' })],
  'world-clock': [V('Weltuhr 2×2', 'S', {}, BLK), V('Weltuhr breit', 'M', {}, BLK), V('Weltuhr hell', 'M', {}, { ...WHT, accent: '#111' }), V('Weltuhr gross', 'L', {}, BLK)],
  'weather': [V('W1 Gross · Automatisch (Wetter)', [470, 470], { bgMode: 'auto' }), V('W1 Gross · Graues Glas', [470, 470], { bgMode: 'gray' }), V('W2 Mittel · Automatisch', [470, 220], { bgMode: 'auto' }), V('W2 Mittel · Graues Glas', [470, 220], { bgMode: 'gray' }), V('W4 Klein · Automatisch', [220, 220], { bgMode: 'auto' }, { radius: 36 }), V('W4 Klein · Dunkel', [220, 220], { bgMode: 'dark' }, { radius: 36 }), V('Sehr klein', 'XS', { bgMode: 'auto' }, { radius: 28 }), V('Mittel · Blaues Glas', [470, 220], { bgMode: 'blue' }), V('Mittel · Transparent', [470, 220], { bgMode: 'transparent' }), V('Mittel · Weiss', [470, 220], { bgMode: 'white' })],
  'sunset': [V('W3 Sonnenauf-/untergang', [220, 220], { bgMode: 'auto' }), V('Blaues Glas', [220, 220], { bgMode: 'blue' }), V('Graues Glas', [220, 220], { bgMode: 'gray' }), V('Dunkel', [220, 220], { bgMode: 'dark' })],
  'calendar': [V('Wochenübersicht', 'L', { view: 'week' }), V('Wochenübersicht, breit', 'XL', { view: 'week' }), V('W5 iOS-Kalender hell', [360, 360], { view: 'ios' }, { ...WHT, radius: '28%', todayColor: '#FF3B30' }), V('W5 iOS-Kalender dunkel', [360, 360], { view: 'ios' }, { ...BLK, bg1: '#1C1C1E', opacity: 1, radius: '28%', todayColor: '#FF3B30', text2Color: '#8E8E93' }), V('Monat, klein', 'S', { view: 'month' }), V('Monat dunkel, klein', 'S', { view: 'month' }, { ...BLK, accent: '#ff453a', todayColor: '#ff453a' }), V('Monat Glas, klein', 'S', { view: 'month' }, { ...TH.gray, todayColor: '#ff3b30' }), V('Datum, sehr klein', 'XS'), V('Tag und Termine, mittel', 'M', { view: 'day' }), V('Monat und Termine, gross', 'L', { view: 'month' }), V('Dunkel, mittel', 'M', { view: 'day' }, BLK), V('Sehr gross', 'XL', { view: 'month' })],
  'reminders': [V('Sehr klein', 'XS'), V('Klein', 'S'), V('Mittel', 'M'), V('Gross', 'L'), V('Dunkel, gross', 'L', {}, { ...BLK, accent: '#ff9f0a' }), V('Glas, mittel', 'M', {}, { ...TH.gray, accent: '#ffffff' })],
  'todo': [V('Dunkel, gross', 'L', {}, TH.black), V('Dunkel, mittel', 'M', {}, TH.black), V('Hell, gross', 'L', {}, { ...WHT, accent: '#0a84ff' }), V('Glas, gross', 'L', {}, { ...TH.gray, accent: '#ffffff' }), V('Klein', 'S', {}, TH.black)],
  'battery': [V('Ring, klein', 'S'), V('Ring, sehr klein', 'XS'), V('Ring, mittel', 'M', {}, { ...TH.gray })],
  'notes': [V('Gelb-weiss, klein', 'S'), V('Mittel', 'M'), V('Gross', 'L'), V('Dunkel, mittel', 'M', {}, BLK)]
};
for (const [t, v] of Object.entries(VAR)) if (WIDGETS[t]) WIDGETS[t].variants = v;
const variantsOf = (def) => def.variants && def.variants.length ? def.variants : [...new Set(['XS', 'S', 'M', 'L', 'XL'])].filter((k) => k !== 'XS' || ['clock-digital', 'clock-analog', 'weather', 'calendar', 'reminders', 'battery', 'stocks', 'screentime'].includes(def.id)).map((k) => V(SIZE_NAMES[k], k));
const supportedOf = (def) => WP_SIZES.of(def.id);
const sizeOf = (v) => Array.isArray(v.size) ? v.size : SIZES[v.size];
