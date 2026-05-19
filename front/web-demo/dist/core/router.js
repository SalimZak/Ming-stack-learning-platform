// router - handles navigation and breadcrumbs

// breadcrumb paths for each page — stored as functions instead of strings
// because t() must be called when the breadcrumb is displayed, not when this object is created
// (at creation time the language isn't loaded yet)
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
  'influx-t3':  () => `MING → InfluxDB → ${t('influx_task3')}`,
  'influx-t4':  () => `MING → InfluxDB → ${t('influx_task4')}`,
  nodered:      () => 'MING → Node-RED',
  'nodered-t1': () => `MING → Node-RED → ${t('nodered_task1')}`,
  'nodered-t2': () => `MING → Node-RED → ${t('nodered_task2')}`,
  'nodered-t3': () => `MING → Node-RED → ${t('nodered_task3')}`,
  'nodered-t4': () => `MING → Node-RED → ${t('nodered_task4')}`,
  grafana:      () => 'MING → Grafana',
  'grafana-t1': () => `MING → Grafana → ${t('grafana_task1')}`,
  'grafana-t2': () => `MING → Grafana → ${t('grafana_task2')}`,
  'grafana-t3': () => `MING → Grafana → ${t('grafana_task3')}`,
  'grafana-t4': () => `MING → Grafana → ${t('grafana_task4')}`,
};

// tracks which page is currently shown — used by the sensor polling loop
let _currentPage = 'home';

// updates the breadcrumb text in the topbar
function updateBreadcrumb() {
  const bc = document.getElementById('breadcrumb');
  if (!bc) return;
  const fn = BREADCRUMBS[_currentPage];
  bc.innerHTML = `<span>${fn ? fn() : _currentPage}</span>`;
}

// switches between Norwegian and English, then manually updates JS-built text
function toggleLang() {
  setLang(getLang() === 'no' ? 'en' : 'no');
  t3RefreshLabels();   // these elements don't have data-i18n, so they need manual updates
  if (typeof gt2RefreshLabels  === 'function') gt2RefreshLabels();
  if (typeof nrt3RefreshLabels === 'function') nrt3RefreshLabels();
  updateBreadcrumb();
  // reset the Node-RED simulator so node labels rebuild with the new language
  const nrRoot = document.getElementById('nr-root');
  if (nrRoot && nrRoot._nrInit) { nrRoot._nrInit = false; initNodeRed('nr-root'); }
}