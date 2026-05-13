// ── SENSORPOLLING ────────────────────────────────────────────

// Henter sensordata fra ESP32 hvert sekund
const SENSOR_POLL_INTERVAL = 1000;
const SENSOR_URL    = '/sensor';     // returnerer { ok, pot, dist }
const LOADCELL_URL  = '/lastcelle';  // returnerer { loadcell }
const TEMP_URL      = '/influx';     // returnerer { sensorName, label, temp, tid }
let _sensorInterval = null;          // lagrer setInterval-ID for å unngå doble løkker

// Realistiske simulerings-områder — samme intervall som ekte hardware kan returnere
// pot:      0–1 (ratio fra ADC 12-bit, hardware-grense)
// dist:     30–4000 mm (VL53L1X long-mode datasheet)
// temp:     18–28 °C (innendørs romtemperatur — DS18B20 kan måle -55 til 125)
// loadcell: 0–1500 g (tommeltrykk-område for HX711)

// Henter pot+dist fra /sensor med 2-sekunders timeout
async function fetchPotDist() {
  try {
    const res = await fetch(SENSOR_URL, { signal: AbortSignal.timeout(2000) });
    // AbortSignal.timeout(2000) avbryter forespørselen etter 2 sekunder
    // Uten dette ville siden henge i 30+ sekunder om ESP32 ikke svarer
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

// Henter loadcell fra /lastcelle
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

// Henter temperatur fra /influx (endpointen returnerer temp-felt)
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

// Bygger en LIVE/sim-badge basert på om dataene er ekte
function sensorBadge(real) {
  return real
    ? `<span class="status-live">${t('sensors_live')}</span>`
    : `<span class="status-sim">${t('sensors_sim')}</span>`;
}

// Starter pollingsløkken første gang sensorsiden åpnes
function startSensorPolling() {
  const MAX_LOG_ENTRIES = 10;
  if (_sensorInterval) return;  // løkken kjører allerede, ikke start en til

  _sensorInterval = setInterval(async () => {
    if (_currentPage !== 'sensors') return;  // brukeren har navigert bort, hopp over

    // Henter alle tre endepunkter parallelt — feiler én, påvirker det ikke de andre
    const [pd, lc, tp] = await Promise.all([fetchPotDist(), fetchLoadcell(), fetchTemp()]);

    // Oppdaterer store tallvisninger
    document.getElementById('pot-value').textContent  = pd.pot.toFixed(3);
    document.getElementById('dist-value').textContent = pd.dist;
    document.getElementById('temp-value').textContent = tp.temp.toFixed(2);
    document.getElementById('load-value').textContent = lc.load.toFixed(1);

    // Grønn badge for ekte data, gul for simulert — uavhengig per kort
    document.getElementById('pot-status').innerHTML  = sensorBadge(pd.real);
    document.getElementById('dist-status').innerHTML = sensorBadge(pd.real);
    document.getElementById('temp-status').innerHTML = sensorBadge(tp.real);
    document.getElementById('load-status').innerHTML = sensorBadge(lc.real);

    // Legger nyeste logg-innlegg øverst
    const logContainer = document.getElementById('sensor-log-lines');
    const entry = document.createElement('div');
    entry.className = 'log-line';
    // [sim]-merket vises hvis minst én av kildene var simulert
    const anySim = !(pd.real && lc.real && tp.real);
    entry.innerHTML =
      `<span class="log-ts">${new Date().toLocaleTimeString()}</span>` +
      `pot = ${pd.pot.toFixed(3)} &nbsp;|&nbsp; ` +
      `dist = ${pd.dist} mm &nbsp;|&nbsp; ` +
      `temp = ${tp.temp.toFixed(2)} \u00b0C &nbsp;|&nbsp; ` +
      `load = ${lc.load.toFixed(1)} g` +
      (anySim ? ' <span class="status-sim">[sim]</span>' : '');
    logContainer.prepend(entry);

    // Fjerner det eldste innlegget om loggen overstiger maks
    while (logContainer.children.length > MAX_LOG_ENTRIES) {
      logContainer.removeChild(logContainer.lastChild);
    }
  }, SENSOR_POLL_INTERVAL);
}