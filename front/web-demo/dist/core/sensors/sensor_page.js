// sensor page - live polling of all sensors

// fetches sensor data from the ESP32 every second
const SENSOR_POLL_INTERVAL = 1000;
const SENSOR_URL    = '/sensor';     // returns { ok, pot, dist }
const LOADCELL_URL  = '/lastcelle';  // returns { loadcell }
const TEMP_URL      = '/influx';     // returns { sensorName, label, temp, tid }
let _sensorInterval = null;          // stores the setInterval ID to prevent duplicate loops

// realistic simulation ranges — same intervals the real hardware can return
// pot:      0–1 (ratio from 12-bit ADC, hardware limit)
// dist:     30–4000 mm (VL53L1X long-mode datasheet)
// temp:     18–28 °C (indoor room temperature — DS18B20 can measure -55 to 125)
// loadcell: 0–1500 g (thumb-pressure range for HX711)

// fetches pot + dist from /sensor with a 2 second timeout
async function fetchPotDist() {
  try {
    const res = await fetch(SENSOR_URL, { signal: AbortSignal.timeout(2000) });
    // AbortSignal.timeout(2000) cancels the request after 2 seconds
    // without this the page would hang for 30+ seconds if the ESP32 doesn't respond
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'firmware reported error');
    return { pot: parseFloat(data.pot), dist: parseInt(data.dist), real: true };
  } catch {
    return {
      pot:  parseFloat(Math.random().toFixed(3)),           // 0–1 ratio
      dist: Math.floor(30 + Math.random() * 3970),          // 30–4000 mm
      real: false
    };
  }
}

// fetches loadcell from /lastcelle
async function fetchLoadcell() {
  try {
    const res = await fetch(LOADCELL_URL, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return { load: parseFloat(data.loadcell), real: true };
  } catch {
    return {
      load: parseFloat((Math.random() * 1500).toFixed(1)),  // 0–1500 g
      real: false
    };
  }
}

// fetches temperature from /influx
async function fetchTemp() {
  try {
    const res = await fetch(TEMP_URL, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return { temp: parseFloat(data.temp), real: true };
  } catch {
    return {
      temp: parseFloat((18 + Math.random() * 10).toFixed(2)), // 18–28 °C
      real: false
    };
  }
}

// builds a LIVE/sim badge depending on whether the data is real
function sensorBadge(real) {
  return real
    ? `<span class="status-live">${t('sensors_live')}</span>`
    : `<span class="status-sim">${t('sensors_sim')}</span>`;
}

// starts the polling loop the first time the sensor page is opened
function startSensorPolling() {
  const MAX_LOG_ENTRIES = 10;
  if (_sensorInterval) return;  // loop is already running, don't start another

  _sensorInterval = setInterval(async () => {
    if (_currentPage !== 'sensors') return;  // user has navigated away, skip this tick

    // fetch all three endpoints in parallel — if one fails it doesn't affect the others
    const [pd, lc, tp] = await Promise.all([fetchPotDist(), fetchLoadcell(), fetchTemp()]);

    // update the large number displays
    document.getElementById('pot-value').textContent  = pd.pot.toFixed(3);
    document.getElementById('dist-value').textContent = pd.dist;
    document.getElementById('temp-value').textContent = tp.temp.toFixed(2);
    document.getElementById('load-value').textContent = lc.load.toFixed(1);

    // green badge for real data, yellow for simulated — tracked independently per card
    document.getElementById('pot-status').innerHTML  = sensorBadge(pd.real);
    document.getElementById('dist-status').innerHTML = sensorBadge(pd.real);
    document.getElementById('temp-status').innerHTML = sensorBadge(tp.real);
    document.getElementById('load-status').innerHTML = sensorBadge(lc.real);

    // prepend the newest log entry so the latest reading is always at the top
    const logContainer = document.getElementById('sensor-log-lines');
    const entry = document.createElement('div');
    entry.className = 'log-line';
    // [sim] tag is shown if at least one of the sources was simulated
    const anySim = !(pd.real && lc.real && tp.real);
    entry.innerHTML =
      `<span class="log-ts">${new Date().toLocaleTimeString()}</span>` +
      `pot = ${pd.pot.toFixed(3)} &nbsp;|&nbsp; ` +
      `dist = ${pd.dist} mm &nbsp;|&nbsp; ` +
      `temp = ${tp.temp.toFixed(2)} \u00b0C &nbsp;|&nbsp; ` +
      `load = ${lc.load.toFixed(1)} g` +
      (anySim ? ' <span class="status-sim">[sim]</span>' : '');
    logContainer.prepend(entry);

    // remove the oldest entry if the log exceeds the maximum
    while (logContainer.children.length > MAX_LOG_ENTRIES) {
      logContainer.removeChild(logContainer.lastChild);
    }
  }, SENSOR_POLL_INTERVAL);
}