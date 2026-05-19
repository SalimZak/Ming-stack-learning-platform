// grafana task 4 - live dashboard simulation

(()=>{

const GT4_REQUIRED    = 8;    // number of data points needed to fill the dashboard
const GT4_HOLD_TIME   = 3000; // milliseconds the sensor must stay in range
const GT4_POLL        = 500;  // polling interval in ms

let _gt4Task      = null;  // active SensorTask instance
let _gt4Chart     = null;  // Chart.js instance for the dashboard panel
let _gt4Count     = 0;     // number of data points added to the chart
let _gt4Score     = 0;     // score for this task
let _gt4Labels    = [];    // timestamps for the x-axis
let _gt4Values    = [];    // sensor values for the y-axis

// generates a random target zone for the distance sensor
function gt4NewTarget() {
  const center    = Math.floor(100 + Math.random() * 700); // 100–800 mm
  const tolerance = Math.random() < 0.5 ? 25 : 50;        // ±25 or ±50 mm
  return {
    min:       Math.max(0, center - tolerance),
    max:       center + tolerance,
    tolerance,
  };
}

// formats a unix timestamp to HH:MM:SS for the chart x-axis
function gt4FormatTs(ts) {
  return new Date(ts).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// builds the Chart.js panel, destroys any existing instance first
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
        borderColor:     '#38B8D0',      // cyan to match the Grafana accent color
        backgroundColor: 'rgba(56,184,208,.10)',
        fill:            true,
        tension:         0.3,
        pointRadius:     5,
        pointBackgroundColor: '#38B8D0',
      }]
    },
    options: {
      animation:   false,  // disabled so updates feel instant like a real Grafana panel
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

// adds a new data point and tells Chart.js to re-render
function gt4AddPoint(timestamp, value) {
  _gt4Labels.push(gt4FormatTs(timestamp));
  _gt4Values.push(value);
  if (_gt4Chart) {
    _gt4Chart.update();  // update without rebuilding the whole chart, simulates a live Grafana refresh
  }
}

// starts a new measurement round with a fresh target zone
function gt4StartRound() {
  const target = gt4NewTarget();

  // update the instruction box with the new target range
  const instrEl = document.getElementById('gt4-instr-range');
  if (instrEl) instrEl.textContent = `${target.min} – ${target.max} mm  (±${target.tolerance} mm)`;

  // reset the hold progress bar and status text
  const fillEl = document.getElementById('gt4-hold-fill');
  if (fillEl) { fillEl.style.width = '0%'; fillEl.style.background = '#38B8D0'; }

  const statusEl = document.getElementById('gt4-status');
  if (statusEl) statusEl.textContent = '';

  const liveEl = document.getElementById('gt4-live-value');
  if (liveEl) liveEl.textContent = '— mm';

  const srcEl = document.getElementById('gt4-live-src');
  if (srcEl) srcEl.textContent = '';

  // clean up the previous SensorTask before starting a new one
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
      // animate the hold bar so the user can see they need to stay in range
      const pct   = Math.min(100, (elapsed / required) * 100);
      const fillEl = document.getElementById('gt4-hold-fill');
      if (fillEl) fillEl.style.width = pct + '%';
      const statusEl = document.getElementById('gt4-status');
      if (statusEl) statusEl.textContent = t('gt4_holding').replace('{pct}', pct.toFixed(0));
    },

    onComplete(reading) {
      // reading confirmed, show the InfluxDB write confirmation and update the chart
      const fillEl = document.getElementById('gt4-hold-fill');
      if (fillEl) fillEl.style.background = '#4ade80';  // green means the reading was confirmed

      const statusEl = document.getElementById('gt4-status');
      if (statusEl) statusEl.textContent = t('gt4_written');

      gt4AddPoint(reading.timestamp, reading.value);
      _gt4Count++;

      // update the score
      _gt4Score++;
      pointSystem('grafana-t4', Math.min(_gt4Score, GT4_REQUIRED));
      scoreGt4();

      // show the InfluxDB write confirmation entry
      gt4ShowWriteConfirm(reading);

      if (_gt4Count >= GT4_REQUIRED) {
        setTimeout(gt4Finish, 1000);
      } else {
        setTimeout(gt4StartRound, 1500);  // short pause so the user can see the confirmation
      }
    },

    onReset() {
      // value left the target range, reset the hold bar
      const fillEl = document.getElementById('gt4-hold-fill');
      if (fillEl) { fillEl.style.width = '0%'; fillEl.style.background = '#38B8D0'; }
      const statusEl = document.getElementById('gt4-status');
      if (statusEl) statusEl.textContent = t('gt4_leftRange');
    },
  });

  _gt4Task.start();
}

// shows a short InfluxDB write confirmation entry below the chart
function gt4ShowWriteConfirm(reading) {
  const el = document.getElementById('gt4-write-log');
  if (!el) return;
  const ts   = new Date(reading.timestamp).toISOString();
  const line = document.createElement('div');
  line.className   = 'gt4-write-line';
  line.textContent = `✓ sensor,type=dist value=${reading.value} ${reading.timestamp}000000  (${ts})`;
  el.prepend(line);  // newest on top, same as how InfluxDB logs look
}

// shows the completion banner and cleans everything up
function gt4Finish() {
  if (_gt4Task) { _gt4Task.destroy(); _gt4Task = null; }
  const gameEl = document.getElementById('gt4-game');
  if (gameEl) gameEl.style.display = 'none';
  const doneEl = document.getElementById('gt4-complete');
  if (doneEl) doneEl.style.display = 'block';
}

// updates the score display
function scoreGt4() {
  const el = document.getElementById('gt4-score');
  if (el) el.textContent = 'Score: ' + _gt4Score;
}

// called by the start button
function gt4Start() {
  _gt4Count  = 0;
  // reset all data arrays so the chart starts empty
  _gt4Labels = [];
  _gt4Values = [];
  _gt4Score  = 0;

  const infoEl = document.getElementById('gt4-infobox');
  if (infoEl) infoEl.style.display = 'none';
  const doneEl = document.getElementById('gt4-complete');
  if (doneEl) doneEl.style.display = 'none';
  const gameEl = document.getElementById('gt4-game');
  if (gameEl) gameEl.style.display = 'block';

  gt4BuildChart();
  scoreGt4();
  gt4StartRound();
}

window.gt4Start = gt4Start;

})();