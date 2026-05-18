// ── INFLUXDB OPPGAVE 2 — Sensor Measurement ──────────────────

(()=>{

const IT2_REQUIRED = 5;  // antall vellykkede målinger for å fullføre
const IT2_TIMEOUT  = 10; // sekunder brukeren har per måling

let _it2Task  = null;  // aktiv SensorTask-instans
let _it2Timer = null;  // nedtellingsintervall-ID
let _it2Count = 0;     // antall lagrede målinger
let _it2Score = 0;     // poeng for denne oppgaven

// Genererer en tilfeldig målsone for potmeteret (ratio 0.0–1.0)
function it2NewTarget() {
  const center    = parseFloat((0.1 + Math.random() * 0.8).toFixed(2)); // 0.10–0.90
  const tolerance = 0.05;                 // alltid ±0.05
  return {
    min:       parseFloat(Math.max(0, center - tolerance).toFixed(2)),
    max:       parseFloat(Math.min(1, center + tolerance).toFixed(2)),
    tolerance,
  };
}

// Formaterer et Unix-tidsstempel til lesbar streng
function it2FormatTs(ts) {
  return new Date(ts).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Starter en enkelt målerunde
function it2StartRound() {
  const target   = it2NewTarget();
  let   timeLeft = IT2_TIMEOUT;

  // Oppdater prompt-boksene
  const roundEl = document.getElementById('it2-round');
  if (roundEl) roundEl.textContent = t('it2_roundOf').replace('{n}', _it2Count + 1);

  const rangeEl = document.getElementById('it2-range');
  if (rangeEl) rangeEl.textContent = `${target.min.toFixed(2)} – ${target.max.toFixed(2)}  (±${target.tolerance} ratio)`;

  const liveValEl = document.getElementById('it2-live-value');
  if (liveValEl) liveValEl.textContent = '—';

  const liveSrcEl = document.getElementById('it2-live-status');
  if (liveSrcEl) liveSrcEl.textContent = '';

  const timerEl = document.getElementById('it2-timer-val');
  if (timerEl) { timerEl.textContent = timeLeft; timerEl.style.color = ''; }

  // Rydder forrige runde
  if (_it2Task)  { _it2Task.destroy();      _it2Task  = null; }
  if (_it2Timer) { clearInterval(_it2Timer); _it2Timer = null; }

  // SensorTask for denne runden
  _it2Task = new SensorTask({
    sensorKey:    'pot',
    targetMin:    target.min,
    targetMax:    target.max,
    holdTime:     0,       // fullfør ved første avlesning innenfor området
    pollInterval: 500,

    onValue(reading) {
      const src = reading.real ? '● LIVE' : '◌ sim';
      const el  = document.getElementById('it2-live-value');
      if (el) el.textContent = reading.value.toFixed(3) + ' ratio';
      const srcEl = document.getElementById('it2-live-status');
      if (srcEl) srcEl.textContent = src;
    },

    onComplete(reading) {
      // Stopp nedtelling
      if (_it2Timer) { clearInterval(_it2Timer); _it2Timer = null; }

      // Legg til rad i databasetabellen
      it2AddRow(reading.timestamp, reading.value);
      _it2Count++;

      // Oppdater poeng
      _it2Score++;
      pointSystem('influx-t2', Math.min(_it2Score, IT2_REQUIRED));
      scoreIt2();

      if (_it2Count >= IT2_REQUIRED) {
        it2Finish();
      } else {
        it2StartRound();
      }
    },
  });

  _it2Task.start();

  // Nedtellingstimer — 10 sekunder per måling
  _it2Timer = setInterval(() => {
    timeLeft--;
    const el = document.getElementById('it2-timer-val');
    if (el) {
      el.textContent = timeLeft;
      if (timeLeft <= 3) el.style.color = '#f87171'; // rød de siste 3 sekundene
    }
    if (timeLeft <= 0) {
      // Tid ute — stopp denne runden og start ny
      clearInterval(_it2Timer);
      _it2Timer = null;
      _it2Task.destroy();
      _it2Task = null;
      const srcEl = document.getElementById('it2-live-status');
      if (srcEl) srcEl.textContent = t('it2_timeout');
      setTimeout(it2StartRound, 1200);
    }
  }, 1000);
}

// Legger til en vellykket rad i databasetabellen
function it2AddRow(timestamp, value) {
  const tbody = document.getElementById('it2-tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.className = 'it2-row-ok';
  tr.innerHTML = `
    <td>${it2FormatTs(timestamp)}</td>
    <td>${typeof value === 'number' ? value.toFixed(3) : value} ratio</td>
    <td class="it2-status-ok">${t('it2_saved')}</td>
  `;
  tbody.appendChild(tr);
}

// Viser fullføringsbanneret og stopper all aktivitet
function it2Finish() {
  if (_it2Task)  { _it2Task.destroy();      _it2Task  = null; }
  if (_it2Timer) { clearInterval(_it2Timer); _it2Timer = null; }
  const gameEl = document.getElementById('it2-game');
  if (gameEl) gameEl.style.display = 'none';
  const doneEl = document.getElementById('it2-complete');
  if (doneEl) doneEl.style.display = 'block';
}

// Oppdaterer poenget for oppgaven
function scoreIt2() {
  const el = document.getElementById('it2-score');
  if (el) el.textContent = 'Poeng: ' + _it2Score;
}

// Kalles av Start-knappen
function it2Start() {
  _it2Count = 0;
  _it2Score = 0;
  const infoEl = document.getElementById('it2-infobox');
  if (infoEl) infoEl.style.display = 'none';
  const tbodyEl = document.getElementById('it2-tbody');
  if (tbodyEl) tbodyEl.innerHTML = '';
  const doneEl = document.getElementById('it2-complete');
  if (doneEl) doneEl.style.display = 'none';
  const gameEl = document.getElementById('it2-game');
  if (gameEl) gameEl.style.display = 'block';
  scoreIt2();
  it2StartRound();
}

window.it2Start = it2Start;

})();