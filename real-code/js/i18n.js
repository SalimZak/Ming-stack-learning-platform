// ══════════════════════════════════════════════════════════
//  i18n — OVERSETTELSESSYSTEM
//  Egenutviklet, ingen eksterne pakker.
//  Bruker data-i18n-attributter i HTML for å oversette tekst.
// ══════════════════════════════════════════════════════════

// To objekter med alle tekster — ett per språk, med samme nøkler
const LANGUAGES = {

  en: {
    brand: 'ARTIFICER',
    langSwitch: 'Switch language', langEN: 'English', langNO: 'Norsk',
    langENSub: 'Continue in English.', langNOSub: 'Fortsett på norsk.',
    nav_switchLang: 'Switch language', nav_home: 'Home', nav_manual: 'Manual',
    nav_tasks: 'Tasks', nav_settings: 'Settings', nav_sensors: 'Sensor Data', nav_dashboard: 'Dashboard',
    role_title: 'Select role', role_sub: 'Choose whether you are a student or a teacher.',
    role_student: 'Student', role_studentSub: 'Student guide and tasks.',
    role_teacher: 'Teacher', role_teacherSub: 'Teacher guide and support.',
    student_title: 'Student Manual', student_sub: 'Your guide to the MING tasks.',
    teacher_title: 'Teacher Manual', teacher_sub: 'Your guide to teaching with the MING platform.',
    manual_openMING: 'Open MING tasks', manual_openMINGsub: 'MQTT, InfluxDB, Node-RED, Grafana',
    manual_back: 'Back', manual_backSub: 'Return to role selection.',
    settings_title: 'Settings', settings_sub: 'Configure your preferences here.',
    ming_title: 'MING', ming_sub: 'Select a module.',
    ming_mqttSub: 'Message protocol for IoT devices.', ming_influxSub: 'Time-series database for sensor data.',
    ming_noderedSub: 'Visual flow-based programming.', ming_grafanaSub: 'Data visualisation and dashboards.',
    mqtt_title: 'MQTT', mqtt_sub: 'Select a task.',
    mqtt_task1: 'Task 1', mqtt_task1sub: 'Simple test flow in Node-RED.',
    mqtt_task2: 'Task 2', mqtt_task2sub: 'Explore MQTT further.',
    mqtt_task3: 'Task 3', mqtt_task3sub: 'Click and place.',
    mqtt_task4: 'Task 4',
    mqtt_t1_title: 'MQTT – Task 1', mqtt_t1_placeholder: '[ Insert task content here ]', mqtt_t1_back: '← Back to MQTT tasks',
    mqtt_t2_title: 'MQTT – Task 2', mqtt_t2_desc: 'Fill in here.', mqtt_t2_back: '← Back to MQTT tasks',
    influx_title: 'InfluxDB', influx_sub: 'Select a task.',
    influx_task1: 'Task 1', influx_task1sub: 'Getting started with InfluxDB.',
    influx_task2: 'Task 2', influx_task2sub: 'Querying time-series data.',
    influx_t1_title: 'InfluxDB – Task 1', influx_t1_desc: 'Fill in here.', influx_t1_back: '← Back to InfluxDB tasks',
    influx_t2_title: 'InfluxDB – Task 2', influx_t2_desc: 'Fill in here.', influx_t2_back: '← Back to InfluxDB tasks',
    nodered_title: 'Node-RED', nodered_sub: 'Select a task.',
    nodered_task1: 'Task 1', nodered_task1sub: 'Getting started with Node-RED.',
    nodered_task2: 'Task 2', nodered_task2sub: 'Advanced flows.',
    nodered_t1_title: 'Node-RED – Task 1', nodered_t1_desc: 'Fill in here.', nodered_t1_back: '← Back to Node-RED tasks',
    nodered_t2_title: 'Node-RED – Task 2', nodered_t2_desc: 'Fill in here.', nodered_t2_back: '← Back to Node-RED tasks',
    grafana_title: 'Grafana', grafana_sub: 'Select a task.',
    grafana_task1: 'Task 1', grafana_task1sub: 'Setting up your first dashboard.',
    grafana_task2: 'Task 2', grafana_task2sub: 'Advanced visualisations.',
    grafana_t1_title: 'Grafana – Task 1', grafana_t1_desc: 'Fill in here.', grafana_t1_back: '← Back to Grafana tasks',
    grafana_t2_title: 'Grafana – Task 2', grafana_t2_desc: 'Fill in here.', grafana_t2_back: '← Back to Grafana tasks',
    sensors_title: 'Live Sensor Data',
    sensors_sub: 'Real-time readings from the ESP32. Shows simulated values when the device is not connected.',
    sensors_pot: 'Potentiometer', sensors_dist: 'Distance (VL53L0X)', sensors_log: 'Log',
    sensors_live: '● LIVE', sensors_sim: '◌ simulated',
    t3_header: 'MQTT – Task 3', t3_infoTitle: 'MQTT Flow Explanation',
    t3_infoBody: 'Devices such as sensors first connect to an MQTT broker through a handshake. After the connection is established, the device can publish data to specific topics. Other clients can subscribe to topics to receive relevant messages. Temperature messages go to Temp subscribers. Humidity messages go to Hum subscribers.',
    t3_startBtn: 'Start Task', t3_complete: '✓ MQTT Task Complete!',
    t3_taskbox: 'Click an arrow from the Select panel, then click the correct drop zone to place it. Client 1 and Client 3 subscribe to Temperature. Client 2 subscribes to Humidity only.',
    t3_clickPlace: 'Click to place', t3_sendBroker: 'Send to Broker', t3_recvBroker: 'Receive from Broker',
    t3_hintPublish: 'Send message to publisher', t3_hintSubscribe: 'Receive messages from publisher', t3_hintForward: 'Send message to subscriber',
    t3_select: 'Select', t3_valid: '✓ Valid', t3_invalid: '✗ Invalid',
    t3_tempSensor: 'Temp Sensor (Publisher)', t3_humSensor: 'Humidity Sensor (Publisher)',
    t3_publisher: '(Publisher)', t3_subscriber: '(Subscriber)',
    t3_broker: 'MQTT\nBroker',
    t3_client1: 'Client 1 (Subscriber)', t3_client2: 'Client 2 (Subscriber)', t3_client3: 'Client 3 (Subscriber)',
    nr_title: 'Setting up MQTT in Node-RED',
    nr_desc: 'In this task you will create a simple test flow in Node-RED that sends one fixed value through MQTT and receives it back. Use an Inject node to start the message manually, publish it via MQTT Out, then subscribe to the same topic with MQTT In to receive it. The goal is to verify that MQTT communication works correctly, and to give you insight into how messages are sent, received and processed in Node-RED before sensor data is added later. When the flow is set up correctly, the message will appear in the debug window.',
    nr_brand: 'Node-RED (simulation)', nr_hint: 'Hint', nr_check: 'Check flow',
    nr_reset: 'Reset', nr_simulate: 'Simulate sensor', nr_nodes: 'Nodes',
    nr_debug: 'Debug', nr_clear: 'Clear',
    nr_dropHint: 'Drag nodes here and connect them with wires',
    nr_ready: 'Ready. Drag in nodes and connect with wires.',
    nr_resetOk: 'Reset OK', nr_initOk: 'Init OK',
    nr_noMore: 'No more hints. You can do it!',
    nr_wrongTopic: 'Wrong topic selected. Tip: what kind of data does the sensor send?',
    nr_flowOk: '✓ Flow OK! All nodes, topic and connections are correct.',
    nr_flowInvalid: 'Flow is not set up correctly. Check the flow first.',
    nr_simInvalid: 'Flow incomplete or wrong topic — check the flow first.',
    nr_missing: 'Missing node: ', nr_missingWire: 'Missing connection: ',
    nr_tempResult: 'Room temperature is {value} degrees Celsius',
    // {value} erstattes med faktisk tall ved kjøring
    nr_msgReceived: 'Message received: ',
    // nr_hints er et array — t('nr_hints') returnerer hele arrayen, hint-knappen velger riktig indeks
    nr_hints: [
      'Hint 1/5: Drag one of each node type from the left panel.',
      'Hint 2/5: Drag between the ports to connect nodes.',
      'Hint 3/5: Enter the same topic in both MQTT Out and MQTT In.',
      'Hint 4/5: The order should be: Inject → MQTT Out → MQTT In → Debug.',
      'Hint 5/5: Press the play button (▶) on the Inject node to send.',
    ],
    home_headline: 'IIoT in a Shoebox',
    home_sub: 'A compact, self-contained teaching platform demonstrating the MING stack — MQTT, InfluxDB, Node-RED and Grafana — running fully locally.',
    home_card_sensors_title: 'Live Sensor Data', home_card_sensors_desc: 'View real-time readings from the potentiometer and VL53L0X distance sensor.',
    home_card_t3_title: 'MQTT Task 3', home_card_t3_desc: 'Click and place arrows to simulate the MQTT publish/subscribe flow.',
    home_card_t4_title: 'Node-RED Simulator', home_card_t4_desc: 'Build a Node-RED flow by dragging nodes onto the canvas and wiring them together.',
    back: 'Back', fillIn: 'Fill in here.',
  },

  no: {
    brand: 'ARTIFICER',
    langSwitch: 'Velg språk', langEN: 'English', langNO: 'Norsk',
    langENSub: 'Continue in English.', langNOSub: 'Fortsett på norsk.',
    nav_switchLang: 'Bytt språk', nav_home: 'Hjem', nav_manual: 'Manual',
    nav_tasks: 'Oppgaver', nav_settings: 'Innstillinger', nav_sensors: 'Sensordata', nav_dashboard: 'Dashboard',
    role_title: 'Velg rolle', role_sub: 'Velg om du er elev eller lærer.',
    role_student: 'Elev', role_studentSub: 'Elevveiledning og oppgaver.',
    role_teacher: 'Lærer', role_teacherSub: 'Lærerveiledning og støtte.',
    student_title: 'Elevveiledning', student_sub: 'Din guide til MING-oppgavene.',
    teacher_title: 'Lærerveiledning', teacher_sub: 'Din guide til undervisning med MING-plattformen.',
    manual_openMING: 'Åpne MING-oppgaver', manual_openMINGsub: 'MQTT, InfluxDB, Node-RED, Grafana',
    manual_back: 'Tilbake', manual_backSub: 'Til rollevalg.',
    settings_title: 'Innstillinger', settings_sub: 'Konfigurer preferansene dine her.',
    ming_title: 'MING', ming_sub: 'Velg en modul.',
    ming_mqttSub: 'Meldingsprotokoll for IoT-enheter.', ming_influxSub: 'Tidsserie-database for sensordata.',
    ming_noderedSub: 'Visuell flyt-basert programmering.', ming_grafanaSub: 'Datavisualisering og dashboards.',
    mqtt_title: 'MQTT', mqtt_sub: 'Velg en oppgave.',
    mqtt_task1: 'Oppgave 1', mqtt_task1sub: 'Enkel testflyt i Node-RED.',
    mqtt_task2: 'Oppgave 2', mqtt_task2sub: 'Utforsk MQTT videre.',
    mqtt_task3: 'Oppgave 3', mqtt_task3sub: 'Klikk og plasser.',
    mqtt_task4: 'Oppgave 4',
    mqtt_t1_title: 'MQTT – Oppgave 1', mqtt_t1_placeholder: '[ Sett inn oppgaveinnhold her ]', mqtt_t1_back: '← Tilbake til MQTT-oppgaver',
    mqtt_t2_title: 'MQTT – Oppgave 2', mqtt_t2_desc: 'Fyll inn her.', mqtt_t2_back: '← Tilbake til MQTT-oppgaver',
    influx_title: 'InfluxDB', influx_sub: 'Velg en oppgave.',
    influx_task1: 'Oppgave 1', influx_task1sub: 'Kom i gang med InfluxDB.',
    influx_task2: 'Oppgave 2', influx_task2sub: 'Spørringer på tidsseriedata.',
    influx_t1_title: 'InfluxDB – Oppgave 1', influx_t1_desc: 'Fyll inn her.', influx_t1_back: '← Tilbake til InfluxDB-oppgaver',
    influx_t2_title: 'InfluxDB – Oppgave 2', influx_t2_desc: 'Fyll inn her.', influx_t2_back: '← Tilbake til InfluxDB-oppgaver',
    nodered_title: 'Node-RED', nodered_sub: 'Velg en oppgave.',
    nodered_task1: 'Oppgave 1', nodered_task1sub: 'Kom i gang med Node-RED.',
    nodered_task2: 'Oppgave 2', nodered_task2sub: 'Avanserte flyter.',
    nodered_t1_title: 'Node-RED – Oppgave 1', nodered_t1_desc: 'Fyll inn her.', nodered_t1_back: '← Tilbake til Node-RED-oppgaver',
    nodered_t2_title: 'Node-RED – Oppgave 2', nodered_t2_desc: 'Fyll inn her.', nodered_t2_back: '← Tilbake til Node-RED-oppgaver',
    grafana_title: 'Grafana', grafana_sub: 'Velg en oppgave.',
    grafana_task1: 'Oppgave 1', grafana_task1sub: 'Sett opp ditt første dashboard.',
    grafana_task2: 'Oppgave 2', grafana_task2sub: 'Avanserte visualiseringer.',
    grafana_t1_title: 'Grafana – Oppgave 1', grafana_t1_desc: 'Fyll inn her.', grafana_t1_back: '← Tilbake til Grafana-oppgaver',
    grafana_t2_title: 'Grafana – Oppgave 2', grafana_t2_desc: 'Fyll inn her.', grafana_t2_back: '← Tilbake til Grafana-oppgaver',
    sensors_title: 'Live sensordata',
    sensors_sub: 'Sanntidsavlesninger fra ESP32. Viser simulerte verdier når enheten ikke er tilkoblet.',
    sensors_pot: 'Potensiometer', sensors_dist: 'Avstand (VL53L0X)', sensors_log: 'Logg',
    sensors_live: '● LIVE', sensors_sim: '◌ simulert',
    t3_header: 'MQTT – Oppgave 3', t3_infoTitle: 'Forklaring av MQTT-flyt',
    t3_infoBody: 'Enheter som sensorer kobler seg først til en MQTT-megler gjennom et håndtrykk. Etter at tilkoblingen er etablert, kan enheten publisere data til spesifikke topics. Andre klienter kan abonnere på topics for å motta relevante meldinger. Temperaturmeldinger går til Temp-abonnenter. Fuktighetsmeldinger går til Hum-abonnenter.',
    t3_startBtn: 'Start oppgave', t3_complete: '✓ MQTT-oppgave fullført!',
    t3_taskbox: 'Klikk en pil fra Valg-panelet, klikk deretter riktig droppunkt for å plassere den. Klient 1 og Klient 3 abonnerer på Temperatur. Klient 2 abonnerer kun på Fuktighet.',
    t3_clickPlace: 'Klikk for å plassere', t3_sendBroker: 'Send til megler', t3_recvBroker: 'Motta fra megler',
    t3_hintPublish: 'Send melding til utgiver', t3_hintSubscribe: 'Motta meldinger fra utgiver', t3_hintForward: 'Send melding til abonnent',
    t3_select: 'Velg', t3_valid: '✓ Riktig', t3_invalid: '✗ Feil',
    t3_tempSensor: 'Temperatursensor (Utgiver)', t3_humSensor: 'Fuktighetssensor (Utgiver)',
    t3_publisher: '(Utgiver)', t3_subscriber: '(Abonnent)',
    t3_broker: 'MQTT\nMegler',
    t3_client1: 'Klient 1 (Abonnent)', t3_client2: 'Klient 2 (Abonnent)', t3_client3: 'Klient 3 (Abonnent)',
    nr_title: 'Sette opp MQTT i Node-RED',
    nr_desc: 'I denne oppgaven skal du lage en enkel testflyt i Node-RED som sender én fast verdi gjennom MQTT og mottar den igjen. Du skal bruke en Inject-node for å starte meldingen manuelt, publisere den via MQTT Out, og deretter abonnere på samme topic med MQTT In for å ta imot meldingen. Hensikten er å verifisere at MQTT-kommunikasjonen fungerer korrekt, og å gi deg innsikt i hvordan meldinger sendes, mottas og behandles i Node-RED. Når flyten er riktig satt opp, skal meldingen vises i debug-vinduet.',
    nr_brand: 'Node-RED (simulering)', nr_hint: 'Hint', nr_check: 'Sjekk flyt',
    nr_reset: 'Reset', nr_simulate: 'Simuler sensor', nr_nodes: 'Noder',
    nr_debug: 'Debug', nr_clear: 'Tøm',
    nr_dropHint: 'Dra noder hit og koble dem med piler',
    nr_ready: 'Klar. Dra inn noder og koble med piler.',
    nr_resetOk: 'Reset OK', nr_initOk: 'Init OK',
    nr_noMore: 'Ingen flere hint. Du klarer dette!',
    nr_wrongTopic: 'Feil topic valgt. Tips: hvilken type data sender sensoren?',
    nr_flowOk: '✓ Flyt OK! Alle noder, topic og koblinger er riktige.',
    nr_flowInvalid: 'Flyten er ikke riktig satt opp. Sjekk flyt først.',
    nr_simInvalid: 'Flyt ikke komplett eller feil topic - sjekk flyten først.',
    nr_missing: 'Mangler node: ', nr_missingWire: 'Mangler kobling: ',
    nr_tempResult: 'Temperaturen i rommet er {value} grader Celsius',
    nr_msgReceived: 'Melding mottatt: ',
    nr_hints: [
      'Hint 1/5: Dra inn en av hver node fra venstre panel.',
      'Hint 2/5: Dra piler mellom portene for å koble nodene sammen.',
      'Hint 3/5: Skriv samme topic i både MQTT Out og MQTT In.',
      'Hint 4/5: Rekkefølgen bør være: Inject → MQTT Out → MQTT In → Debug.',
      'Hint 5/5: Trykk på play-knappen (▶) på Inject-noden for å sende.',
    ],
    home_headline: 'IIoT i en skoeske',
    home_sub: 'En kompakt, selvstendig undervisningsplattform som demonstrerer MING-stacken — MQTT, InfluxDB, Node-RED og Grafana — som kjører fullt lokalt.',
    home_card_sensors_title: 'Live sensordata', home_card_sensors_desc: 'Se sanntidsavlesninger fra potensiometeret og VL53L0X-avstandssensoren.',
    home_card_t3_title: 'MQTT Oppgave 3', home_card_t3_desc: 'Klikk og plasser piler for å simulere MQTT publish/subscribe-flyten.',
    home_card_t4_title: 'Node-RED Simulator', home_card_t4_desc: 'Bygg en Node-RED-flyt ved å dra noder inn på lerretet og koble dem sammen.',
    back: 'Tilbake', fillIn: 'Fyll inn her.',
  }
};

// Henter lagret språk fra localStorage, standard er norsk
let _lang = localStorage.getItem('artificer_lang') || 'no';

// Slår opp riktig tekst for en nøkkel — returnerer selve nøkkelen om oversettelsen mangler
function t(key) {
  const dict = LANGUAGES[_lang] || LANGUAGES['no'];
  return dict[key] !== undefined ? dict[key] : key;
}

function getLang() { return _lang; }

// Bytter språk, lagrer valget og oppdaterer all tekst i DOM-en
function setLang(code) {
  if (!LANGUAGES[code]) return;
  _lang = code;
  localStorage.setItem('artificer_lang', code);
  applyI18n();
}

// Går gjennom alle elementer med data-i18n og bytter ut teksten
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  });

  // Oppdaterer språkknappen til å vise det andre språket
  const toggle = document.getElementById('lang-toggle');
  if (toggle) {
    toggle.textContent = _lang === 'no' ? '🇬🇧 EN' : '🇳🇴 NB';
    toggle.title       = _lang === 'no' ? 'Switch to English' : 'Bytt til norsk';
  }

  // Oppdaterer html lang-attributtet for skjermlesere
  document.documentElement.lang = _lang;
}

// Kjører oversettelsen så snart DOM-en er klar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyI18n);
} else {
  applyI18n();
}
