// Mehrsprachigkeit: Texte stehen ausschliesslich in locales/{ru,en,de}.js
let LANG = 'de';
const LANG_TAG = { ru: 'ru-RU', en: 'en-US', de: 'de-DE' };
function setLang(l) { LANG = (typeof LOCALES !== 'undefined' && LOCALES[l]) ? l : 'de'; }
const getLang = () => LANG;
function t(key, params) {
  let s = (LOCALES[LANG] && LOCALES[LANG][key]) ?? (LOCALES.en && LOCALES.en[key]) ?? key;
  if (params) s = s.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? ''));
  return s;
}
const hasKey = (k) => !!(LOCALES.en && k in LOCALES.en);
const tl = (k) => (hasKey(k) ? t(k) : k); // Beschriftung übersetzen, wenn ein Schlüssel existiert
// Uhrzeit aus lokaler Zeichenkette "YYYY-MM-DDTHH:MM" (Ortszeit der Stadt). EN: 12 h "7:54PM", RU/DE: 24 h "19:54"
function use12(h12) { return h12 === '12' || ((h12 === 'auto' || !h12) && LANG === 'en'); }
function fmtHM(str, h12) {
  const hh = +str.slice(11, 13), mm = str.slice(14, 16);
  if (use12(h12)) return `${hh % 12 || 12}:${mm}${hh < 12 ? 'AM' : 'PM'}`;
  return `${String(hh).padStart(2, '0')}:${mm}`;
}
function fmtHour(str, h12) { const hh = +str.slice(11, 13); return use12(h12) ? `${hh % 12 || 12}${hh < 12 ? 'AM' : 'PM'}` : String(hh).padStart(2, '0'); }
const weekLetters = () => t('weekLetters').split(',');
const monthName = (d) => new Date(d).toLocaleDateString(LANG_TAG[LANG], { month: 'long' });
const weekdayShort = (d) => new Date(d).toLocaleDateString(LANG_TAG[LANG], { weekday: 'short' });
