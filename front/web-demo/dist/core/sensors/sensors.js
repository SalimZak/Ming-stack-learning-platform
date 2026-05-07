// ── SENSORPOLLING ────────────────────────────────────────────

// Henter sensordata fra ESP32 hvert sekund
const SENSOR_POLL_INTERVAL = 1000;
const SENSOR_URL = '/sensor'; 
let _sensorInterval = null;    // lagrer setInterval-ID for å unngå doble løkker

// Henter data fra ESP32 med 2-sekunders timeout
// Om noe feiler (offline, timeout, feil JSON) returneres simulerte verdier i stedet
async function fetchSensor() {
  try {
    const res = await fetch(SENSOR_URL, { signal: AbortSignal.timeout(2000) });
    // AbortSignal.timeout(2000) avbryter forespørselen etter 2 sekunder
    // Uten dette ville siden henge i 30+ sekunder om ESP32 ikke svarer
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'firmware reported error');
    return { pot: parseFloat(data.pot), dist: parseInt(data.dist), real: true };
  } catch {
    // Simulerte verdier innenfor reelle hardware-grenser:
    // volt: 0–3.3V, distanse: 30–1200mm (VL53L0X datasheet)
    return {
      pot:  parseFloat((Math.random() * 3.3).toFixed(3)),
      dist: Math.floor(30 + Math.random() * 1170),
      real: false
    };
  }
}

// Starter pollingsløkken første gang sensorsiden åpnes
function startSensorPolling() {
  const MAX_LOG_ENTRIES = 10;
  if (_sensorInterval) return;  // løkken kjører allerede, ikke start en til

  _sensorInterval = setInterval(async () => {
    if (_currentPage !== 'sensors') return;  // brukeren har navigert bort, hopp over

    const d = await fetchSensor();

    // Oppdaterer store tallvisninger
    document.getElementById('pot-value').textContent  = d.pot.toFixed(3);
    document.getElementById('dist-value').textContent = d.dist;

    // Grønn badge for ekte data, gul for simulert
    const badge = d.real
      ? `<span class="status-live">${t('sensors_live')}</span>`
      : `<span class="status-sim">${t('sensors_sim')}</span>`;
    document.getElementById('pot-status').innerHTML  = badge;
    document.getElementById('dist-status').innerHTML = badge;

    // Legger nyeste logg-innlegg øverst
    const logContainer = document.getElementById('sensor-log-lines');
    const entry = document.createElement('div');
    entry.className = 'log-line';
    entry.innerHTML =
      `<span class="log-ts">${new Date().toLocaleTimeString()}</span>` +
      `pot = ${d.pot.toFixed(3)} V &nbsp;|&nbsp; dist = ${d.dist} mm` +
      (d.real ? '' : ' <span class="status-sim">[sim]</span>');
    logContainer.prepend(entry);

    // Fjerner det eldste innlegget om loggen overstiger maks
    while (logContainer.children.length > MAX_LOG_ENTRIES) {
      logContainer.removeChild(logContainer.lastChild);
    }
  }, SENSOR_POLL_INTERVAL);
}
