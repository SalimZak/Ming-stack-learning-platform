// ── GRAFANA OPPGAVE 4 — Live Dashboard Simulation ────────────

(()=>{

const GT4_REQUIRED    = 8;    // antall datapunkter for å fylle dashbordet
const GT4_HOLD_TIME   = 3000; // millisekunder sensoren må holdes i område
const GT4_POLL        = 500;  // avlesningsintervall i ms

let _gt4Task      = null;  // aktiv SensorTask-instans
let _gt4Chart     = null;  // Chart.js-instans for dashbord-panelet
let _gt4Count     = 0;     // antall datapunkter lagt til grafen
let _gt4Labels    = [];    // tidsstempler på x-aksen
let _gt4Values    = [];    // sensorverdier på y-aksen

// Genererer en tilfeldig målsone for avstandssensoren
function gt4NewTarget() {
  const center    = Math.floor(100 + Math.random() * 700); // 100–800 mm
  const tolerance = Math.random() < 0.5 ? 25 : 50;        // ±25 eller ±50 mm
  return {
    min:       Math.max(0, center - tolerance),
    max:       center + tolerance,
    tolerance,
  };
}

// Formaterer et Unix-tidsstempel til HH:MM:SS
function gt4FormatTs(ts) {
  return new Date(ts).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Bygger Chart.js-panelet første gang
function gt4BuildChart() {
  const ctx = document.getElementById('gt4-chart');
  if (!ctx) return;
  if (_gt4Chart) { _gt4Chart.destroy(); _gt4Chart = null; }

  _gt4Chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels:   _gt4Labels,
      datasets: [{
        label:           t('gt4_panelLabel'),
        data:            _gt4Values,
        borderColor:     '#38B8D0',      // cyan — Grafana-aksentfarge
        backgroundColor: 'rgba(56,184,208,.10)',
        fill:            true,
        tension:         0.3,
        pointRadius:     5,
        pointBackgroundColor: '#38B8D0',
      }]
    },
    options: {
      animation:   false,  // oppdatering skal føles som live-panel, ikke animert
      responsive:  true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: { color: 'white', maxRotation: 0 },
          grid:  { color: 'rgba(255,255,255,.06)' },
          title: { display: true, text: t('gt4_axisTime'), color: '#8fa3b3' },
        },
        y: {
          min:   0,
          max:   1200,
          ticks: { color: 'white', stepSize: 200 },
          grid:  { color: 'rgba(255,255,255,.06)' },
          title: { display: true, text: t('gt4_axisValue'), color: '#8fa3b3' },
        },
      },
    },
  });
}

// Legger et nytt punkt til grafen og oppdaterer Chart.js
function gt4AddPoint(timestamp, value) {
  _gt4Labels.push(gt4FormatTs(timestamp));
  _gt4Values.push(value);
  if (_gt4Chart) {
    _gt4Chart.update();  // oppdater panel uten å bygge på nytt — simulerer live Grafana-refresh
  }
}

// Starter en ny målingsrunde
function gt4StartRound() {
  const target = gt4NewTarget();

  // Oppdater instruksjonsboksen med nytt målområde
  const instrEl = document.getElementById('gt4-instr-range');
  if (instrEl) instrEl.textContent = `${target.min} – ${target.max} mm  (±${target.tolerance} mm)`;

  // Nullstill hold-fremdriftslinje og status
  const fillEl = document.getElementById('gt4-hold-fill');
  if (fillEl) { fillEl.style.width = '0%'; fillEl.style.background = '#38B8D0'; }

  const statusEl = document.getElementById('gt4-status');
  if (statusEl) statusEl.textContent = '';

  const liveEl = document.getElementById('gt4-live-value');
  if (liveEl) liveEl.textContent = '— mm';

  const srcEl = document.getElementById('gt4-live-src');
  if (srcEl) srcEl.textContent = '';

  // Rydd forrige SensorTask
  if (_gt4Task) { _gt4Task.destroy(); _gt4Task = null; }

  _gt4Task = new SensorTask({
    sensorKey:    'dist',
    targetMin:    target.min,
    targetMax:    target.max,
    holdTime:     GT4_HOLD_TIME,
    pollInterval: GT4_POLL,

    onValue(reading) {
      const src = reading.real ? '● LIVE' : '◌ sim';
      const el  = document.getElementById('gt4-live-value');
      if (el) el.textContent = reading.value + ' mm';
      const sEl = document.getElementById('gt4-live-src');
      if (sEl) sEl.textContent = src;
    },

    onProgress(elapsed, required) {
      // Animer hold-fremdriftslinjen — viser brukeren at stabil avlesning = god data
      const pct   = Math.min(100, (elapsed / required) * 100);
      const fillEl = document.getElementById('gt4-hold-fill');
      if (fillEl) fillEl.style.width = pct + '%';
      const statusEl = document.getElementById('gt4-status');
      if (statusEl) statusEl.textContent = t('gt4_holding').replace('{pct}', pct.toFixed(0));
    },

    onComplete(reading) {
      // Punkt bekreftet — vis InfluxDB-skrivemelding og oppdater Grafana-panelet
      const fillEl = document.getElementById('gt4-hold-fill');
      if (fillEl) fillEl.style.background = '#4ade80';  // grønn = bekreftet skrevet

      const statusEl = document.getElementById('gt4-status');
      if (statusEl) statusEl.textContent = t('gt4_written');

      gt4AddPoint(reading.timestamp, reading.value);
      _gt4Count++;

      // Vis InfluxDB-skrivebekreftelse
      gt4ShowWriteConfirm(reading);

      if (_gt4Count >= GT4_REQUIRED) {
        setTimeout(gt4Finish, 1000);
      } else {
        setTimeout(gt4StartRound, 1500);  // kort pause så brukeren rekker å se bekreftelsen
      }
    },

    onReset() {
      // Verdien forlot området — nullstill hold-linjen
      const fillEl = document.getElementById('gt4-hold-fill');
      if (fillEl) { fillEl.style.width = '0%'; fillEl.style.background = '#38B8D0'; }
      const statusEl = document.getElementById('gt4-status');
      if (statusEl) statusEl.textContent = t('gt4_leftRange');
    },
  });

  _gt4Task.start();
}

// Viser en kort InfluxDB-skrivebekreftelse under grafen
function gt4ShowWriteConfirm(reading) {
  const el = document.getElementById('gt4-write-log');
  if (!el) return;
  const ts   = new Date(reading.timestamp).toISOString();
  const line = document.createElement('div');
  line.className   = 'gt4-write-line';
  line.textContent = `✓ sensor,type=dist value=${reading.value} ${reading.timestamp}000000  (${ts})`;
  el.prepend(line);  // nyeste øverst — slik InfluxDB-logger ser ut
}

// Viser fullføringsbanneret og stopper alt
function gt4Finish() {
  if (_gt4Task) { _gt4Task.destroy(); _gt4Task = null; }
  const gameEl = document.getElementById('gt4-game');
  if (gameEl) gameEl.style.display = 'none';
  const doneEl = document.getElementById('gt4-complete');
  if (doneEl) doneEl.style.display = 'block';
}

// Kalles av Start-knappen
function gt4Start() {
  _gt4Count  = 0;
  _gt4Labels = [];
  _gt4Values = [];

  const infoEl = document.getElementById('gt4-infobox');
  if (infoEl) infoEl.style.display = 'none';
  const doneEl = document.getElementById('gt4-complete');
  if (doneEl) doneEl.style.display = 'none';
  const gameEl = document.getElementById('gt4-game');
  if (gameEl) gameEl.style.display = 'block';

  gt4BuildChart();
  gt4StartRound();
}

window.gt4Start = gt4Start;

})();
