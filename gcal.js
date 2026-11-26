'use strict';
// Liest Google-Kalender (oder jeden anderen) über die private iCal-Adresse (nur lesen).
const { net } = require('electron');

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function tzOffset(tz, t) {
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const p = {}; for (const x of f.formatToParts(new Date(t))) p[x.type] = x.value;
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - t;
  } catch (e) { return null; }
}

// -> { date: Date, allDay: bool }
function parseDate(value, params) {
  const v = value.trim();
  const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return null;
  const [, Y, M, D, h, mi, s, z] = m;
  if (h === undefined || /VALUE=DATE(?!-)/.test(params || '')) return { date: new Date(+Y, +M - 1, +D), allDay: true };
  if (z) return { date: new Date(Date.UTC(+Y, +M - 1, +D, +h, +mi, +(s || 0))), allDay: false };
  const tzm = (params || '').match(/TZID=([^;:]+)/);
  if (tzm) {
    const guess = Date.UTC(+Y, +M - 1, +D, +h, +mi, +(s || 0));
    const off = tzOffset(tzm[1].replace(/"/g, ''), guess);
    if (off !== null) {
      let t = guess - off;
      const off2 = tzOffset(tzm[1].replace(/"/g, ''), t); // Sommerzeit-Korrektur
      if (off2 !== null && off2 !== off) t = guess - off2;
      return { date: new Date(t), allDay: false };
    }
  }
  return { date: new Date(+Y, +M - 1, +D, +h, +mi, +(s || 0)), allDay: false };
}

function parseICS(text) {
  const lines = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
  const events = [];
  let cur = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { cur = { exdates: [] }; continue; }
    if (line === 'END:VEVENT') { if (cur) events.push(cur); cur = null; continue; }
    if (!cur) continue;
    const i = line.indexOf(':'); if (i < 0) continue;
    const left = line.slice(0, i), value = line.slice(i + 1);
    const semi = left.indexOf(';');
    const key = (semi < 0 ? left : left.slice(0, semi)).toUpperCase();
    const params = semi < 0 ? '' : left.slice(semi + 1);
    if (key === 'SUMMARY') cur.summary = value.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1');
    else if (key === 'DTSTART') cur.start = parseDate(value, params);
    else if (key === 'DTEND') cur.end = parseDate(value, params);
    else if (key === 'RRULE') cur.rrule = Object.fromEntries(value.split(';').map(kv => kv.split('=')));
    else if (key === 'EXDATE') value.split(',').forEach(v => { const d = parseDate(v, params); if (d) cur.exdates.push(ymd(d.date)); });
    else if (key === 'RECURRENCE-ID') cur.recurrenceId = parseDate(value, params);
    else if (key === 'UID') cur.uid = value;
    else if (key === 'STATUS') cur.status = value;
  }
  return events;
}

const DAYS = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

function expand(ev, from, to) {
  const s = ev.start.date;
  const out = [];
  if (!ev.rrule) { if (s >= from && s <= to) out.push(s); else if (ev.end && ev.start.allDay && ev.end.date > from && s < to) out.push(s); return out; }
  const r = ev.rrule;
  const freq = r.FREQ, interval = Math.max(1, +(r.INTERVAL || 1));
  const count = r.COUNT ? +r.COUNT : Infinity;
  const until = r.UNTIL ? parseDate(r.UNTIL, '').date : null;
  const byday = r.BYDAY ? r.BYDAY.split(',') : null;
  const bymd = r.BYMONTHDAY ? r.BYMONTHDAY.split(',').map(Number) : null;
  const H = s.getHours(), Mi = s.getMinutes();
  const at = (y, m, d) => new Date(y, m, d, H, Mi);
  let n = 0, guard = 0;
  const push = (d) => {
    if (d < s) return true;
    if (until && d > until) return false;
    if (n >= count) return false;
    n++;
    if (d > to) return false;
    if (d >= from) out.push(d);
    return true;
  };
  if (freq === 'DAILY') {
    for (let d = new Date(s); guard++ < 3000; d = at(d.getFullYear(), d.getMonth(), d.getDate() + interval)) if (!push(d)) break;
  } else if (freq === 'WEEKLY') {
    const days = byday ? byday.map(x => DAYS[x.slice(-2)]).sort() : [s.getDay()];
    const monday = at(s.getFullYear(), s.getMonth(), s.getDate() - ((s.getDay() + 6) % 7));
    outer: for (let w = 0; guard++ < 3000; w += interval) {
      for (const wd of days.map(x => (x + 6) % 7).sort((a, b) => a - b)) {
        const d = at(monday.getFullYear(), monday.getMonth(), monday.getDate() + w * 7 + wd);
        if (!push(d)) break outer;
      }
    }
  } else if (freq === 'MONTHLY') {
    outer: for (let k = 0; guard++ < 1000; k += interval) {
      const y = s.getFullYear(), m = s.getMonth() + k;
      let cands = [];
      if (byday) {
        for (const b of byday) {
          const mm = b.match(/^([+-]?\d+)?([A-Z]{2})$/); if (!mm) continue;
          const nth = mm[1] ? +mm[1] : 0, wd = DAYS[mm[2]];
          const last = new Date(y, m + 1, 0).getDate();
          const all = []; for (let d = 1; d <= last; d++) if (new Date(y, m, d).getDay() === wd) all.push(d);
          if (nth > 0 && all[nth - 1]) cands.push(all[nth - 1]); else if (nth < 0 && all[all.length + nth]) cands.push(all[all.length + nth]); else if (!nth) cands.push(...all);
        }
      } else cands = bymd || [s.getDate()];
      for (const d of cands.sort((a, b) => a - b)) {
        if (d > new Date(y, m + 1, 0).getDate()) continue;
        if (!push(at(y, m, d))) break outer;
      }
    }
  } else if (freq === 'YEARLY') {
    for (let k = 0; guard++ < 200; k += interval) {
      const d = at(s.getFullYear() + k, s.getMonth(), s.getDate());
      if (d.getMonth() !== s.getMonth()) continue;
      if (!push(d)) break;
    }
  } else if (s >= from && s <= to) out.push(s);
  return out.filter(d => !ev.exdates.includes(ymd(d)));
}

function build(events) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const to = new Date(now.getFullYear() + 1, now.getMonth() + 1, 1);
  const map = {};
  const overrides = new Set(events.filter(e => e.recurrenceId && e.uid).map(e => e.uid + '|' + ymd(e.recurrenceId.date)));
  const add = (d, item) => { const k = ymd(d); (map[k] = map[k] || []).push(item); };
  for (const ev of events) {
    if (!ev.start || ev.status === 'CANCELLED') continue;
    const title = ev.summary || '(Ohne Titel)';
    for (const d of expand(ev, from, to)) {
      if (!ev.recurrenceId && ev.uid && ev.rrule && overrides.has(ev.uid + '|' + ymd(d))) continue;
      if (ev.start.allDay) {
        const days = ev.end ? Math.max(1, Math.round((ev.end.date - ev.start.date) / 86400000)) : 1;
        for (let i = 0; i < Math.min(days, 60); i++) add(new Date(d.getFullYear(), d.getMonth(), d.getDate() + i), { t: '', title });
      } else add(d, { t: `${pad(d.getHours())}:${pad(d.getMinutes())}`, title });
    }
  }
  for (const k in map) map[k].sort((a, b) => (a.t || '').localeCompare(b.t || ''));
  return map;
}

async function fetchAll(urls) {
  const list = urls.split(/\s+/).map(u => u.trim()).filter(Boolean).map(u => u.replace(/^webcal:\/\//i, 'https://'));
  const all = [];
  for (const u of list) {
    const r = await net.fetch(u, { cache: 'no-store' });
    if (!r.ok) throw new Error(`Kalender-Adresse antwortet mit Fehler ${r.status}`);
    const text = await r.text();
    if (!text.includes('BEGIN:VCALENDAR')) throw new Error('Das ist keine iCal-Adresse (Datei beginnt nicht mit VCALENDAR)');
    all.push(...parseICS(text));
  }
  return build(all);
}

// Liste im Format der Jafy Widgets: { id, title, start, end, allDay, color, cal }
function buildList(events) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const to = new Date(now.getFullYear() + 1, now.getMonth() + 1, 1);
  const out = [];
  const overrides = new Set(events.filter(e => e.recurrenceId && e.uid).map(e => e.uid + '|' + ymd(e.recurrenceId.date)));
  for (const ev of events) {
    if (!ev.start || ev.status === 'CANCELLED') continue;
    const title = ev.summary || '(Ohne Titel)';
    const dur = ev.end ? Math.max(0, ev.end.date - ev.start.date) : (ev.start.allDay ? 864e5 : 36e5);
    for (const d of expand(ev, from, to)) {
      if (!ev.recurrenceId && ev.uid && ev.rrule && overrides.has(ev.uid + '|' + ymd(d))) continue;
      const st = d.getTime();
      out.push({ id: 'g' + out.length, title, start: st, end: st + (dur || (ev.start.allDay ? 864e5 : 36e5)), allDay: !!ev.start.allDay, color: '#34c759', cal: 'Google' });
    }
  }
  return out.sort((a, b) => a.start - b.start).slice(0, 3000);
}
async function fetchList(urls) {
  const list = urls.split(/\s+/).map(u => u.trim()).filter(Boolean).map(u => u.replace(/^webcal:\/\//i, 'https://'));
  const all = [];
  for (const u of list) {
    const r = await net.fetch(u, { cache: 'no-store' });
    if (!r.ok) throw new Error(`Kalender-Adresse antwortet mit Fehler ${r.status}`);
    const text = await r.text();
    if (!text.includes('BEGIN:VCALENDAR')) throw new Error('Das ist keine iCal-Adresse (Datei beginnt nicht mit VCALENDAR)');
    all.push(...parseICS(text));
  }
  return buildList(all);
}
module.exports = { fetchAll, fetchList, parseICS, build, buildList };
