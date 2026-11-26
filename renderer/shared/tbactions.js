// Alle eingebauten Funktionen der Shortcut-Leiste: [Symbol, Name, Gruppe]
const TB_ACTIONS = {
  store: ['🛍️', 'Widget Store', 'Apple Widgets'], widgets: ['🧩', 'Meine Widgets', 'Apple Widgets'], toggleWidgets: ['👁️', 'Widgets ein/aus', 'Apple Widgets'], appSettings: ['⚙️', 'App-Einstellungen', 'Apple Widgets'], focusOn: ['🎯', 'Widgets ausblenden', 'Apple Widgets'],
  showDesktop: ['🖥️', 'Desktop zeigen', 'Windows'], search: ['🔍', 'Suchen', 'Windows'], taskview: ['🪟', 'Alle Fenster', 'Windows'], quick: ['🎛️', 'Schnelleinstellungen', 'Windows'], notifications: ['🔔', 'Mitteilungen', 'Windows'], lock: ['🔒', 'Sperren', 'Windows'], darkmode: ['🌓', 'Hell / Dunkel', 'Windows'],
  snip: ['✂️', 'Screenshot', 'Werkzeuge'], clipboard: ['📋', 'Zwischenablage', 'Werkzeuge'], emoji: ['😀', 'Emojis', 'Werkzeuge'], calc: ['🧮', 'Rechner', 'Werkzeuge'], notepad: ['📝', 'Editor', 'Werkzeuge'], taskmgr: ['📊', 'Task-Manager', 'Werkzeuge'], terminal: ['⌨️', 'Terminal', 'Werkzeuge'],
  explorer: ['📁', 'Explorer', 'Ordner'], downloads: ['⬇️', 'Downloads', 'Ordner'], documents: ['📄', 'Dokumente', 'Ordner'], pictures: ['🖼️', 'Bilder', 'Ordner'], trash: ['🗑️', 'Papierkorb', 'Ordner'],
  play: ['⏯️', 'Play / Pause', 'Medien'], prev: ['⏮️', 'Zurück', 'Medien'], next: ['⏭️', 'Weiter', 'Medien'], mute: ['🔇', 'Ton aus', 'Medien'], voldown: ['🔉', 'Leiser', 'Medien'], volup: ['🔊', 'Lauter', 'Medien'],
  settings: ['⚙️', 'Einstellungen', 'System'], wifi: ['📶', 'WLAN', 'System'], bluetooth: ['🔷', 'Bluetooth', 'System'], sound: ['🎚️', 'Sound', 'System'], display: ['🔆', 'Bildschirm', 'System'], power: ['🔋', 'Energie', 'System'],
  gcal: ['📅', 'Google Kalender', 'Web'], mail: ['✉️', 'Neue E-Mail', 'Web']
};
const tbItemInfo = (it) => it.kind === 'action' ? { icon: (TB_ACTIONS[it.action] || ['❔'])[0], name: it.name || (TB_ACTIONS[it.action] || ['', it.action])[1] }
  : { icon: it.icon || (it.kind === 'url' ? '🌐' : it.kind === 'folder' ? '📂' : '🚀'), name: it.name || it.path || it.url };
