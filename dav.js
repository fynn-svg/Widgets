// iCloud-Anbindung über CalDAV (Kalender, Erinnerungen) und CardDAV (Kontakte).
// Nutzt ein app-spezifisches Passwort. Nicht gegen ein echtes Konto getestet.
const crypto = require('crypto');
let electronNet = null; try { electronNet = require('electron').net; } catch {}
// Chromium-Netzwerk von Electron verwenden (nutzt Windows-Proxy und -Zertifikate, wichtig in Schul- und Firmennetzen)
const doFetch = (url, o) => (electronNet && electronNet.fetch ? electronNet.fetch(url, o).catch((e) => { if (/ERR_(INVALID|NOT_IMPLEMENTED|UNSAFE)/.test(String(e.message))) return fetch(url, o); throw e; }) : fetch(url, o));
function netError(e) {
  const m = String(e && (e.message || e));
  if (/ERR_NAME_NOT_RESOLVED|ENOTFOUND/.test(m)) return 'Keine Verbindung zu iCloud: Der Server wurde nicht gefunden (Internet, DNS oder Firewall prüfen).';
  if (/ERR_PROXY|PROXY|ERR_TUNNEL/.test(m)) return 'Keine Verbindung zu iCloud: Ein Proxy blockiert die Verbindung (z. B. im Schulnetz).';
  if (/ERR_CERT|CERT|SSL/.test(m)) return 'Die sichere Verbindung zu iCloud wurde abgelehnt (Zertifikatsfehler, evtl. Schul- oder Firmennetz).';
  if (/ERR_INTERNET_DISCONNECTED|ERR_NETWORK_CHANGED|ECONNRESET|ETIMEDOUT|TIMED_OUT|ERR_CONNECTION/.test(m)) return 'Keine Verbindung zu iCloud: Internet prüfen und erneut versuchen.';
  return m;
}
const NS = { cal: 'urn:ietf:params:xml:ns:caldav', card: 'urn:ietf:params:xml:ns:carddav' };
let auth = null;
const st = { cals: [], books: [], todoRaw: {} };

const tagRe = (t) => `<(?:[\\w-]+:)?${t}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w-]+:)?${t}>`;
const first = (x, t) => { const m = (x || '').match(new RegExp(tagRe(t), 'i')); return m ? m[1] : null; };
const all = (x, t) => [...(x || '').matchAll(new RegExp(tagRe(t), 'gi'))].map((m) => m[1]);
const decode = (s) => (s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#13;/g, '\r').replace(/&amp;/g, '&');

async function req(url, method, body, depth, headers = {}) {
  for (let i = 0; i < 5; i++) {
    const r = await doFetch(url, { method, redirect: 'manual', body, headers: { Authorization: auth, 'Content-Type': 'application/xml; charset=utf-8', ...(depth != null ? { Depth: depth } : {}), ...headers } });
    if ([301, 302, 307, 308].includes(r.status)) { url = new URL(r.headers.get('location'), url).href; continue; }
    return { status: r.status, text: await r.text(), headers: r.headers, url };
  }
  throw new Error('Zu viele Weiterleitungen');
}
async function discover(base, homeTag, ns) {
  const r1 = await req(base, 'PROPFIND', '<d:propfind xmlns:d="DAV:"><d:prop><d:current-user-principal/></d:prop></d:propfind>', '0');
  if (r1.status === 401 || r1.status === 403) throw new Error('Anmeldung abgelehnt (HTTP ' + r1.status + '). Prüfe: 1) Apple-ID = deine E-Mail-Adresse, 2) du verwendest ein APP-SPEZIFISCHES Passwort (nicht dein normales Apple-Passwort), 3) Zwei-Faktor-Authentifizierung ist bei deiner Apple-ID aktiv, 4) das Passwort ist fehlerfrei kopiert.');
  if (r1.status >= 500) throw new Error('iCloud antwortet gerade nicht (HTTP ' + r1.status + '). Bitte später erneut versuchen.');
  const ph = decode(first(first(r1.text, 'current-user-principal'), 'href'));
  if (!ph) throw new Error('iCloud-Konto nicht gefunden (HTTP ' + r1.status + ')');
  const principal = new URL(ph, base).href;
  const r2 = await req(principal, 'PROPFIND', `<d:propfind xmlns:d="DAV:" xmlns:x="${ns}"><d:prop><x:${homeTag}/></d:prop></d:propfind>`, '0');
  const hh = decode(first(first(r2.text, homeTag), 'href'));
  if (!hh) throw new Error('Sammlung nicht gefunden');
  return new URL(hh, principal).href;
}
async function collections(home, kind) {
  const r = await req(home, 'PROPFIND', `<d:propfind xmlns:d="DAV:" xmlns:c="${NS.cal}" xmlns:a="http://apple.com/ns/ical/"><d:prop><d:displayname/><d:resourcetype/><a:calendar-color/><c:supported-calendar-component-set/></d:prop></d:propfind>`, '1');
  return all(r.text, 'response').map((x) => ({
    href: new URL(decode(first(x, 'href')), home).href, name: decode(first(x, 'displayname') || '').trim(), color: (first(x, 'calendar-color') || '').trim().slice(0, 7),
    comps: [...x.matchAll(/name="(VEVENT|VTODO)"/g)].map((m) => m[1]), ok: new RegExp(`<(?:[\\w-]+:)?${kind}\\s*/>`).test(first(x, 'resourcetype') || '')
  })).filter((c) => c.ok);
}

// ---- ICS ----
function zoned(y, mo, d, h, mi, s, tz) {
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
    const p = Object.fromEntries(f.formatToParts(guess).map((x) => [x.type, x.value]));
    return guess - (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - guess);
  } catch { return guess; }
}
function parseDT(line) {
  if (!line) return null;
  const m = line.match(/^[A-Z-]+((?:;[^:]+)*):(.*)$/); if (!m) return null;
  const tz = (m[1].match(/TZID=([^;:]+)/) || [])[1], v = m[2].trim();
  const d = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z?))?/); if (!d) return null;
  const [, y, mo, da, h, mi, s, z] = d;
  if (h === undefined) return { ms: new Date(+y, +mo - 1, +da).getTime(), allDay: true };
  if (z) return { ms: Date.UTC(+y, +mo - 1, +da, +h, +mi, +s) };
  if (tz) return { ms: zoned(+y, +mo, +da, +h, +mi, +s, tz) };
  return { ms: new Date(+y, +mo - 1, +da, +h, +mi, +s).getTime() };
}
const unfold = (s) => s.replace(/\r?\n[ \t]/g, '');
const line = (blk, name) => { const m = blk.match(new RegExp('^' + name + '(?:;[^:\\r\\n]*)?:.*$', 'm')); return m ? m[0].replace(/\r$/, '') : null; };
const val = (l) => l ? l.slice(l.indexOf(':', l.search(/[:;]/) === -1 ? 0 : 0) + 1).replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\') : '';
const pad = (n) => String(n).padStart(2, '0');
const utc = (ms) => { const d = new Date(ms); return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`; };
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

async function report(url, body) { const r = await req(url, 'REPORT', body, '1'); return all(r.text, 'response'); }

async function syncEvents() {
  const from = new Date(); from.setHours(0, 0, 0, 0); const to = new Date(+from + 14 * 864e5);
  const body = `<c:calendar-query xmlns:d="DAV:" xmlns:c="${NS.cal}"><d:prop><d:getetag/><c:calendar-data><c:expand start="${utc(+from)}" end="${utc(+to)}"/></c:calendar-data></d:prop><c:filter><c:comp-filter name="VCALENDAR"><c:comp-filter name="VEVENT"><c:time-range start="${utc(+from)}" end="${utc(+to)}"/></c:comp-filter></c:comp-filter></c:filter></c:calendar-query>`;
  const out = [];
  for (const cal of st.cals.filter((c) => c.comps.includes('VEVENT'))) {
    try {
      for (const x of await report(cal.href, body)) {
        const ics = unfold(decode(first(x, 'calendar-data') || ''));
        for (const m of ics.matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g)) {
          const b = m[1], s = parseDT(line(b, 'DTSTART')); if (!s) continue; let e = parseDT(line(b, 'DTEND'));
          out.push({ title: val(line(b, 'SUMMARY')) || '(ohne Titel)', start: s.ms, end: e ? e.ms : s.ms + (s.allDay ? 864e5 : 36e5), allDay: !!s.allDay, loc: val(line(b, 'LOCATION')), cal: cal.name, color: cal.color || '#0a84ff' });
        }
      }
    } catch (e) { /* einzelner Kalender fehlgeschlagen */ }
  }
  return out.sort((a, b) => a.start - b.start).slice(0, 150);
}
async function syncTodos() {
  const body = `<c:calendar-query xmlns:d="DAV:" xmlns:c="${NS.cal}"><d:prop><d:getetag/><c:calendar-data/></d:prop><c:filter><c:comp-filter name="VCALENDAR"><c:comp-filter name="VTODO"/></c:comp-filter></c:filter></c:calendar-query>`;
  const out = []; st.todoRaw = {};
  for (const cal of st.cals.filter((c) => c.comps.includes('VTODO'))) {
    try {
      for (const x of await report(cal.href, body)) {
        const raw = decode(first(x, 'calendar-data') || ''), ics = unfold(raw), b = (ics.match(/BEGIN:VTODO([\s\S]*?)END:VTODO/) || [])[1]; if (!b) continue;
        const uid = val(line(b, 'UID')), done = /^STATUS:COMPLETED/m.test(b) || !!line(b, 'COMPLETED'), due = parseDT(line(b, 'DUE'));
        st.todoRaw[uid] = { raw, href: new URL(decode(first(x, 'href')), cal.href).href, etag: decode(first(x, 'getetag') || '') };
        out.push({ uid, title: val(line(b, 'SUMMARY')) || '(ohne Titel)', done, due: due ? due.ms : null, list: cal.name, color: cal.color || '#0a84ff' });
      }
    } catch (e) {}
  }
  return out.filter((t) => !t.done).sort((a, b) => (a.due ?? 9e15) - (b.due ?? 9e15)).slice(0, 80);
}
async function syncContacts() {
  const body = `<card:addressbook-query xmlns:d="DAV:" xmlns:card="${NS.card}"><d:prop><card:address-data><card:prop name="FN"/><card:prop name="TEL"/><card:prop name="EMAIL"/></card:address-data></d:prop></card:addressbook-query>`;
  const out = [];
  for (const b of st.books) { try { for (const x of await report(b.href, body)) { const v = unfold(decode(first(x, 'address-data') || '')); const fn = val(line(v, 'FN')); if (fn) out.push({ name: fn, tel: val(line(v, 'TEL')), mail: val(line(v, 'EMAIL')) }); } } catch (e) {} }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'de')).slice(0, 300);
}

async function connect(user, pass) {
  user = String(user || '').trim(); pass = String(pass || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(user)) throw new Error('Bitte die Apple-ID als E-Mail-Adresse eingeben (z. B. name@icloud.com).');
  const flat = pass.replace(/[\s-]/g, '');
  if (/^[a-z]{16}$/i.test(flat)) pass = flat.match(/.{4}/g).join('-').toLowerCase();
  else throw new Error('Das ist kein app-spezifisches Passwort. Es sieht so aus: xxxx-xxxx-xxxx-xxxx. Erzeuge eines auf account.apple.com unter «Anmelden und Sicherheit».');
  auth = 'Basic ' + Buffer.from(user + ':' + pass).toString('base64');
  let home;
  try { home = await discover('https://caldav.icloud.com/', 'calendar-home-set', NS.cal); st.cals = await collections(home, 'calendar'); }
  catch (e) { auth = null; throw new Error(netError(e)); }
  try { const bh = await discover('https://contacts.icloud.com/', 'addressbook-home-set', NS.card); st.books = await collections(bh, 'addressbook'); } catch { st.books = []; }
  return st.cals.map((c) => ({ name: c.name, color: c.color, comps: c.comps }));
}
function setAuth(user, pass) { user = String(user || '').trim(); pass = String(pass || '').trim(); auth = 'Basic ' + Buffer.from(user + ':' + pass).toString('base64'); }
async function syncAll() {
  const res = { lastSync: Date.now(), calendars: st.cals.map((c) => ({ name: c.name, color: c.color, comps: c.comps })), errors: [] };
  for (const [k, fn] of [['events', syncEvents], ['todos', syncTodos], ['contacts', syncContacts]]) { try { res[k] = await fn(); } catch (e) { res[k] = []; res.errors.push(k + ': ' + e.message); } }
  return res;
}
async function toggleTodo(uid, done) {
  const t = st.todoRaw[uid]; if (!t) throw new Error('Aufgabe nicht gefunden');
  let raw = t.raw.replace(/\r?\n/g, '\r\n'); const nl = '\r\n';
  raw = raw.replace(/^(STATUS|COMPLETED|PERCENT-COMPLETE)[:;].*\r\n/gm, '');
  const ins = done ? `STATUS:COMPLETED${nl}COMPLETED:${utc(Date.now())}${nl}PERCENT-COMPLETE:100${nl}` : `STATUS:NEEDS-ACTION${nl}`;
  raw = raw.replace('END:VTODO', ins + 'END:VTODO');
  const r = await req(t.href, 'PUT', raw, null, { 'Content-Type': 'text/calendar; charset=utf-8', ...(t.etag ? { 'If-Match': t.etag } : {}) });
  if (r.status >= 300) throw new Error('Speichern fehlgeschlagen (HTTP ' + r.status + ')');
}
async function put(cal, ics) {
  const uid = crypto.randomUUID().toUpperCase();
  const r = await req(cal.href + uid + '.ics', 'PUT', ics.replace('{UID}', uid), null, { 'Content-Type': 'text/calendar; charset=utf-8', 'If-None-Match': '*' });
  if (r.status >= 300) throw new Error('Anlegen fehlgeschlagen (HTTP ' + r.status + ')');
}
async function createTodo(title, dueYmd) {
  const cal = st.cals.find((c) => c.comps.includes('VTODO')); if (!cal) throw new Error('Keine Erinnerungsliste gefunden');
  await put(cal, ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//WidgetPlatform//DE', 'BEGIN:VTODO', 'UID:{UID}', 'DTSTAMP:' + utc(Date.now()), 'SUMMARY:' + esc(title), ...(dueYmd ? ['DUE;VALUE=DATE:' + dueYmd.replace(/-/g, '')] : []), 'STATUS:NEEDS-ACTION', 'END:VTODO', 'END:VCALENDAR', ''].join('\r\n'));
}
async function createEvent(title, startMs, endMs) {
  const cal = st.cals.find((c) => c.comps.includes('VEVENT')); if (!cal) throw new Error('Kein Kalender gefunden');
  await put(cal, ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//WidgetPlatform//DE', 'BEGIN:VEVENT', 'UID:{UID}', 'DTSTAMP:' + utc(Date.now()), 'DTSTART:' + utc(startMs), 'DTEND:' + utc(endMs), 'SUMMARY:' + esc(title), 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n'));
}
module.exports = { connect, setAuth, syncAll, toggleTodo, createTodo, createEvent };
