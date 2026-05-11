// ── MENU ──────────────────────────────────────────────────

// Breadcrumbs-stier for hver side — funksjoner i stedet for strenger
// fordi t() må kalles når brødsmulene vises, ikke når objektet lages (da vet vi ikke språk)
const BREADCRUMBS = {
  home:         () => t('nav_home'),
  role:         () => t('role_title'),
  student:      () => t('student_title'),
  teacher:      () => t('teacher_title'),
  settings:     () => t('settings_title'),
  sensors:      () => t('sensors_title'),
  ming:         () => 'MING',
  mqtt:         () => 'MING → MQTT',
  'mqtt-t1':    () => `MING → MQTT → ${t('mqtt_task1')}`,
  'mqtt-t2':    () => `MING → MQTT → ${t('mqtt_task2')}`,
  task3:        () => `MING → MQTT → ${t('mqtt_task3')}`,
  task4:        () => 'MING → MQTT → Node-RED',
  influx:       () => 'MING → InfluxDB',
  'influx-t1':  () => `MING → InfluxDB → ${t('influx_task1')}`,
  'influx-t2':  () => `MING → InfluxDB → ${t('influx_task2')}`,
  nodered:      () => 'MING → Node-RED',
  'nodered-t1': () => `MING → Node-RED → ${t('nodered_task1')}`,
  'nodered-t2': () => `MING → Node-RED → ${t('nodered_task2')}`,
  grafana:      () => 'MING → Grafana',
  'grafana-t1': () => `MING → Grafana → ${t('grafana_task1')}`,
  'grafana-t2': () => `MING → Grafana → ${t('grafana_task2')}`,
  'grafana-t3': () => `MING → Grafana → ${t('grafana_task3')}`,
  'grafana-t4': () => `MING → Grafana → ${t('grafana_task4')}`,
};

// Holder styr på hvilken side som vises — brukes av sensor-pollingsløkken
let _currentPage = 'home';

/*
// Hoved-navigasjonsfunksjon — skjuler alle sider og viser den riktige
function go(page) {
  document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

  const target = document.getElementById('page-' + page);
  if (!target) return;  // sikkerhetsvakt mot ukjente side-IDer
  target.classList.add('active');

  document.querySelectorAll(`.nav-link[data-page="${page}"]`)
    .forEach(el => el.classList.add('active'));

  _currentPage = page;
  updateBreadcrumb();
  document.querySelector('.content').scrollTop = 0;

  // Starter sensor/simulator kun når brukeren navigerer dit — sparer ressurser
  if (page === 'sensors') startSensorPolling();
  if (page === 'task4')   initNodeRed('nr-root');
  if (page === 'task3')   t3RefreshLabels();
}
*/

// Oppdaterer brødsmule-teksten i topbaren
function updateBreadcrumb() {
  const bc = document.getElementById('breadcrumb');
  if (!bc) return;
  const fn = BREADCRUMBS[_currentPage];
  bc.innerHTML = `<span>${fn ? fn() : _currentPage}</span>`;
}

// Bytter mellom norsk og engelsk, oppdaterer JS-bygd tekst manuelt etterpå
function toggleLang() {
  setLang(getLang() === 'no' ? 'en' : 'no');
  t3RefreshLabels();   // disse elementene har ikke data-i18n, må oppdateres manuelt
  if (typeof gt2RefreshLabels === 'function') gt2RefreshLabels();
  updateBreadcrumb();
  // Tilbakestiller Node-RED simulator slik at nodeetiketter bygges på nytt med nytt språk
  const nrRoot = document.getElementById('nr-root');
  if (nrRoot && nrRoot._nrInit) { nrRoot._nrInit = false; initNodeRed('nr-root'); }
}