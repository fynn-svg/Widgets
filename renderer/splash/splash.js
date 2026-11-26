// Animation startet erst, wenn das Fenster sichtbar ist (Hauptprozess ruft start() auf)
const ms = Number(new URLSearchParams(location.search).get('ms')) || 3000;
let started = false;
function start() {
  if (started) return; started = true;
  document.body.classList.add('go');
  setTimeout(() => document.getElementById('panel').classList.add('out'), ms - 450);
}
window.start = start;
