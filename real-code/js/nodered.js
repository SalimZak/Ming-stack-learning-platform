// ── NODE-RED SIMULATOR ───────────────────────────────────────

let _nrCtrl = null;  // AbortController — abort() fjerner alle event listeners på en gang
let _rafMove = 0;    // requestAnimationFrame-handle — 0 betyr ingen frame er planlagt

// Enkel in-memory MQTT-megler for simulatoren
// Bruker IIFE (funksjon som kjører seg selv) slik at subs-Map-en er privat
const Broker = (() => {
  const subs = new Map();  // topic-streng -> Set av callback-funksjoner
  return {
    sub(topic, cb) {
      if (!subs.has(topic)) subs.set(topic, new Set());
      subs.get(topic).add(cb);
      return () => subs.get(topic)?.delete(cb);
      // Returnerer en avslutt-funksjon — ?. forhindrer feil om topic allerede er slettet
    },
    pub(topic, payload) {
      const set = subs.get(topic);
      if (!set) return;  // ingen abonnenter på dette topic
      for (const cb of set) cb({ topic, payload, ts: Date.now() });
    },
    clear() { subs.clear(); }
  };
})();

const TOPIC_OPTIONS = ['sensor/temperatur', 'sensor/fuktighet', 'sensor/trykk'];
const CORRECT_TOPIC = 'sensor/temperatur';
// Bare sensor/temperatur er riktig — sensoren sender temperaturdata

let _selectedTopicIndex = 0;  // hvilket topic som vises på MQTT-nodene
let _hintIndex = 0;           // hvilket hint som vises neste gang
let _nrNodeId  = 1;           // auto-inkrement ID for nodeinstanser på lerretet
const _nrWires = [];          // alle tegnede koblinger — oppdateres av nrRedrawWires()

// Henter sensorverdi for simulatoren — skalerer potmeter-volt til temperaturlignende tall,
// fjernes når temperatur sensor er lagt til
async function nrGetSensorValue() {
  try {
    const res = await fetch(SENSOR_URL, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    return { value: parseFloat((data.pot * 10).toFixed(2)), real: true };
    // Ganger med 10 for å gjøre 0–3.3V om til 0–33°C
  } catch {
    return { value: parseFloat((18 + Math.random() * 10).toFixed(2)), real: false };
    // Tilfeldig innendørs temperatur 18–28°C som reserve
  }
}

// Legger til en ny linje i debug-panelet, nyeste øverst
function nrDebugLog(root, msg) {
  const out = root.querySelector('#debug-lines');
  if (!out) return;
  const line = document.createElement('div');
  line.className   = 'dbg-line';
  line.textContent = msg;
  out.prepend(line);
}

// Som nrDebugLog men erstatter forrige sim-resultat i stedet for å stable nye linjer
function nrSimLog(root, msg) {
  const out = root.querySelector('#debug-lines');
  if (!out) return;
  out.querySelectorAll('.dbg-sim-line').forEach(el => el.remove());
  const line = document.createElement('div');
  line.className   = 'dbg-line dbg-sim-line';
  line.textContent = msg;
  out.prepend(line);
}

// Returnerer HTML for en drabar nodebrikke i venstre panel
function nrNodeTile(title, kind) {
  return `<div class="nr-node" draggable="true" data-title="${title}" data-kind="${kind}">
    <div class="nr-node-title">${title}</div>
    <div class="nr-node-sub">${kind}</div>
    <div class="nr-node-drag">drag</div>
  </div>`;
}

// Returnerer HTML for topic-velgeren inne i MQTT-noder
function nrTopicSliderHtml() {
  return `<div class="nr-topic-slider">
    <button class="nr-topic-arrow" data-dir="-1">←</button>
    <span class="nr-topic-value">${TOPIC_OPTIONS[_selectedTopicIndex]}</span>
    <button class="nr-topic-arrow" data-dir="1">→</button>
  </div>`;
}

// Oppdaterer topic-teksten på alle MQTT-noder etter at brukeren klikker pilen
function nrUpdateTopicSliders(root) {
  root.querySelectorAll('.nr-topic-value').forEach(el => {
    el.textContent = TOPIC_OPTIONS[_selectedTopicIndex];
  });
}

// Bygger en nodeinstans som kan plasseres på lerretet
function nrCreateNodeInst(title, x, y) {
  const id  = 'n' + (_nrNodeId++);
  const el  = document.createElement('div');
  el.className     = 'nr-node-inst';
  el.dataset.id    = id;
  el.dataset.title = title;

  const isMQTT  = title.indexOf('MQTT') !== -1;
  const hasPlay = title === 'Inject';
  const hasIn   = title !== 'Inject';  // Inject har ingen innport — den starter kjeden
  const hasOut  = title !== 'Debug';   // Debug har ingen utport — den avslutter kjeden

  const bodyHtml = isMQTT  ? `<div class="nr-field"><span>Topic</span>${nrTopicSliderHtml()}</div>` : '';
  const playBtn  = hasPlay ? '<button class="nr-play" title="Inject">&#9654;</button>' : '';
  // &#9654; er HTML-koden for ▶-tegnet

  el.innerHTML = `
    <div class="nr-node-inst-head"><div class="nr-node-inst-title">${title}</div>${playBtn}</div>
    <div class="nr-node-inst-body">${bodyHtml}</div>
    ${hasIn  ? '<div class="nr-port nr-port-in"  data-port="in"></div>'  : ''}
    ${hasOut ? '<div class="nr-port nr-port-out" data-port="out"></div>' : ''}`;

  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  return el;
}

// Fjerner alle SVG-ledninger fra lerretet og tømmer arrayen
function nrClearWires(root) {
  const svg = root.querySelector('#wires');
  if (svg) svg.innerHTML = '';
  _nrWires.length = 0;
}

// Beregner midtpunktet til en port relativt til lerretets hjørne
// SVG-koordinater er relative til SVG-elementet, ikke skjermen
function nrGetPortCenter(portEl, canvasRect) {
  const r = portEl.getBoundingClientRect();
  return {
    x: r.left + r.width  / 2 - canvasRect.left,
    y: r.top  + r.height / 2 - canvasRect.top
  };
}

// Returnerer en kubisk Bezier-kurve SVG-sti mellom to punkter
// dx-offsettet gir den karakteristiske S-kurven som ekte Node-RED bruker
function nrSvgPath(a, b) {
  const dx = Math.max(50, Math.abs(b.x - a.x) * 0.5);
  // Minimum 50px offset slik at korte koblinger fortsatt viser en synlig kurve
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
}

// Tegner alle ledninger på nytt — kalles etter nodebevegelse eller vindusendring
function nrRedrawWires(root) {
  const canvas = root.querySelector('#canvas');
  const svg    = root.querySelector('#wires');
  if (!canvas || !svg) return;
  const cr = canvas.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${cr.width} ${cr.height}`);
  for (const w of _nrWires) {
    const fn = root.querySelector(`.nr-node-inst[data-id="${w.from.nodeId}"]`);
    const tn = root.querySelector(`.nr-node-inst[data-id="${w.to.nodeId}"]`);
    if (!fn || !tn) continue;  // noden er fjernet, hopp over
    const fp = fn.querySelector(`.nr-port[data-port="${w.from.port}"]`);
    const tp = tn.querySelector(`.nr-port[data-port="${w.to.port}"]`);
    if (!fp || !tp) continue;
    w.pathEl.setAttribute('d', nrSvgPath(nrGetPortCenter(fp, cr), nrGetPortCenter(tp, cr)));
  }
}

// Oppretter en permanent SVG-ledning fra utport til innport
function nrAddWire(root, fromPortEl, toPortEl) {
  const svg = root.querySelector('#wires');
  if (!svg) return;
  const fromNode = fromPortEl.closest('.nr-node-inst');
  const toNode   = toPortEl.closest('.nr-node-inst');
  if (!fromNode || !toNode) return;
  if (!(fromPortEl.dataset.port === 'out' && toPortEl.dataset.port === 'in')) return;
  // Kun ut -> inn er tillatt

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  // createElementNS kreves for SVG-elementer — vanlig createElement lager HTML, ikke SVG
  path.setAttribute('class',          'nr-wire');
  path.setAttribute('fill',           'none');
  path.setAttribute('stroke-width',   '4');
  path.setAttribute('stroke-linecap', 'round');
  svg.appendChild(path);

  _nrWires.push({
    from:   { nodeId: fromNode.dataset.id, port: 'out' },
    to:     { nodeId: toNode.dataset.id,   port: 'in'  },
    pathEl: path
  });
  nrRedrawWires(root);
}

// Finner den første nodeinstansen med et gitt navn, eller null
function nrGetNodeByTitle(root, title) {
  return Array.from(root.querySelectorAll('.nr-node-inst'))
    .find(n => n.dataset.title === title) || null;
}

function nrGetTopic() { return TOPIC_OPTIONS[_selectedTopicIndex]; }

// Sjekker om det finnes en kobling fra node 'a' til node 'b'
function nrHasWire(root, a, b) {
  const fn = nrGetNodeByTitle(root, a);
  const tn = nrGetNodeByTitle(root, b);
  if (!fn || !tn) return false;
  return _nrWires.some(w => w.from.nodeId === fn.dataset.id && w.to.nodeId === tn.dataset.id);
}

// Sjekker stille om flyten er gyldig — returnerer true/false
// Rekkefølge: noder finnes -> riktig topic -> koblinger i riktig orden
function nrFlowValid(root) {
  for (const title of ['Inject', 'MQTT Out', 'MQTT In', 'Debug']) {
    if (!nrGetNodeByTitle(root, title)) return false;
  }
  if (nrGetTopic() !== CORRECT_TOPIC)           return false;
  if (!nrHasWire(root, 'Inject',   'MQTT Out')) return false;
  if (!nrHasWire(root, 'MQTT Out', 'MQTT In'))  return false;
  if (!nrHasWire(root, 'MQTT In',  'Debug'))    return false;
  return true;
}

// Simulerer at Inject-noden sender en melding gjennom flyten
async function nrHandlePlay(root) {
  if (!nrFlowValid(root)) { nrDebugLog(root, t('nr_flowInvalid')); return; }

  const result = await nrGetSensorValue();
  const source = result.real ? '[ESP32]' : '[sim]';
  const topic  = nrGetTopic();

  // Abonnerer FØR publisering — slik fungerer ekte MQTT også
  const unsub = Broker.sub(topic, m => {
    unsub();  // éngangsabonnement — fjern deg selv etter første melding
    // Uten dette ville hver Play-trykk legge til en ny lytter
    const raw = m.payload.toString().replace(/temp=/i, '');
    const v   = parseFloat(raw);
    const msg = !isNaN(v)
      ? t('nr_tempResult').replace('{value}', v.toFixed(2))
      : t('nr_msgReceived') + m.payload;
    nrDebugLog(root, source + ' ' + msg);
  });

  Broker.pub(topic, 'temp=' + result.value.toFixed(2));
}

// Sjekker flyten og logger første feil den finner — én feil om gangen for å ikke overvelde
function nrCheckFlow(root) {
  for (const title of ['Inject', 'MQTT Out', 'MQTT In', 'Debug']) {
    if (!nrGetNodeByTitle(root, title)) {
      nrDebugLog(root, t('nr_missing') + title);
      return;
    }
  }
  if (nrGetTopic() !== CORRECT_TOPIC) { nrDebugLog(root, t('nr_wrongTopic')); return; }
  if (!nrHasWire(root, 'Inject',   'MQTT Out')) { nrDebugLog(root, t('nr_missingWire') + 'Inject → MQTT Out'); return; }
  if (!nrHasWire(root, 'MQTT Out', 'MQTT In'))  { nrDebugLog(root, t('nr_missingWire') + 'MQTT Out → MQTT In'); return; }
  if (!nrHasWire(root, 'MQTT In',  'Debug'))    { nrDebugLog(root, t('nr_missingWire') + 'MQTT In → Debug'); return; }
  nrDebugLog(root, t('nr_flowOk'));
}

// Bygger hele simulator-UI-en inne i #nr-root
// _nrInit-flagget hindrer at den bygges to ganger om brukeren navigerer frem og tilbake
function initNodeRed(rootId) {
  const root = document.getElementById(rootId);
  if (!root || root._nrInit) return;
  root._nrInit = true;

  // Avbryter eventuelle gjenværende lyttere fra forrige økt
  if (_nrCtrl) { try { _nrCtrl.abort(); } catch(e) {} }
  _nrCtrl = new AbortController();
  const signal = _nrCtrl.signal;
  // Alle addEventListener-kall nedenfor bruker { signal }
  // Når _nrCtrl.abort() kalles fjernes alle lyttere på en gang — ingen minnelekkasjer

  // Nullstiller all tilstand
  _hintIndex = 0; _selectedTopicIndex = 0; _nrNodeId = 1;
  _nrWires.length = 0;
  Broker.clear();

  // Injiserer simulator-HTML
  root.innerHTML = `<div class="nr-app">
    <div class="nr-topbar">
      <div class="nr-brand"><span>${t('nr_brand')}</span></div>
      <div class="nr-actions">
        <button class="nr-btn" id="btn-hint">${t('nr_hint')}</button>
        <button class="nr-btn" id="btn-check">${t('nr_check')}</button>
        <button class="nr-btn" id="btn-reset">${t('nr_reset')}</button>
        <button class="nr-btn" id="btn-sim">${t('nr_simulate')}</button>
      </div>
    </div>
    <div class="nr-main">
      <aside class="nr-left">
        <div class="nr-panel-title">${t('nr_nodes')}</div>
        <div class="nr-node-list" id="node-list">
          ${nrNodeTile('Inject',       'input')}
          ${nrNodeTile('MQTT Out',     'output')}
          ${nrNodeTile('MQTT In',      'input')}
          ${nrNodeTile('Debug',        'viewer')}
          ${nrNodeTile('Filter',       'function')}
          ${nrNodeTile('HTTP Request', 'function')}
        </div>
      </aside>
      <section class="nr-canvas-wrap">
        <div class="nr-canvas" id="canvas">
          <svg class="nr-wires" id="wires" width="100%" height="100%"></svg>
          <div class="nr-drop-hint">${t('nr_dropHint')}</div>
        </div>
      </section>
      <aside class="nr-right" id="debug-pane">
        <div class="nr-debug-header">
          <div class="nr-debug-title">${t('nr_debug')}</div>
          <button class="nr-btn nr-btn-small" id="btn-clear">${t('nr_clear')}</button>
        </div>
        <div class="nr-debug-body">
          <div class="nr-debug-bubble">${t('nr_ready')}</div>
          <div class="nr-debug-lines" id="debug-lines"></div>
        </div>
      </aside>
    </div>
  </div>`;

  const canvas = root.querySelector('#canvas');
  const svg    = root.querySelector('#wires');

  // Tegner ledninger på nytt når vindusbredden endres
  window.addEventListener('resize', () => nrRedrawWires(root), { signal });

  // ── Dra fra palette til lerret ──

  // Lagrer node-tittelen i drag-dataen så drop-hendelsen vet hva som slippes
  root.querySelector('#node-list').addEventListener('dragstart', e => {
    const tile = e.target.closest('.nr-node');
    if (!tile) return;
    e.dataTransfer.setData('text/plain', tile.dataset.title);
    e.dataTransfer.effectAllowed = 'copy';
  }, { signal });

  // dragover må kalle preventDefault() ellers vil ikke 'drop'-hendelsen utløses
  canvas.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, { signal });

  // Oppretter en nodeinstans der brukeren slipper
  canvas.addEventListener('drop', e => {
    e.preventDefault();
    const title = e.dataTransfer.getData('text/plain');
    if (!title) return;
    const cr = canvas.getBoundingClientRect();
    canvas.appendChild(nrCreateNodeInst(title, e.clientX - cr.left - 70, e.clientY - cr.top - 24));
    nrRedrawWires(root);
  }, { signal });

  // ── Topic-velger (event delegation) ──
  canvas.addEventListener('click', e => {
    const arrow = e.target.closest('.nr-topic-arrow');
    if (!arrow) return;
    // + TOPIC_OPTIONS.length før modulo sikrer at resultatet aldri blir negativt
    _selectedTopicIndex = (_selectedTopicIndex + parseInt(arrow.dataset.dir) + TOPIC_OPTIONS.length) % TOPIC_OPTIONS.length;
    nrUpdateTopicSliders(root);
  }, { signal });

  // ── Dra noder rundt på lerretet ──
  let dragNode = null, dragOffset = { x: 0, y: 0 };

  canvas.addEventListener('pointerdown', e => {
    if (e.target.closest('.nr-port') || e.target.closest('.nr-topic-arrow')) return;
    const node = e.target.closest('.nr-node-inst');
    if (!node) return;
    dragNode = node;
    const r = node.getBoundingClientRect();
    dragOffset = { x: e.clientX - r.left, y: e.clientY - r.top };
    node.setPointerCapture(e.pointerId);
    // setPointerCapture fortsetter å sende hendelser selv om musepekeren beveger seg utenfor noden
  }, { signal });

  canvas.addEventListener('pointermove', e => {
    if (!dragNode || _rafMove) return;
    // _rafMove !== 0 betyr en frame er allerede planlagt — hopp over denne hendelsen
    // pointermove kan utløses 1000+ ganger i sekundet, men skjermen oppdateres bare ~60 ganger
    // requestAnimationFrame begrenser oppdateringene til skjermens refresh-rate
    const target = dragNode;
    _rafMove = requestAnimationFrame(() => {
      _rafMove = 0;
      if (!dragNode || dragNode !== target || !target.isConnected) return;
      const cr = canvas.getBoundingClientRect();
      target.style.left = (e.clientX - cr.left - dragOffset.x) + 'px';
      target.style.top  = (e.clientY - cr.top  - dragOffset.y) + 'px';
      nrRedrawWires(root);
    });
  }, { signal });

  canvas.addEventListener('pointerup', e => {
    if (dragNode) {
      try { dragNode.releasePointerCapture(e.pointerId); } catch(ex) {}
      // try/catch fordi releasePointerCapture kan kaste feil om pekeren allerede er frigjort
    }
    dragNode = null;
  }, { signal });

  // ── Tegne koblinger mellom porter ──
  let wiring = null;

  canvas.addEventListener('pointerdown', e => {
    const port = e.target.closest('.nr-port');
    if (!port || port.dataset.port !== 'out') return;  // bare start fra utporter
    const cr = canvas.getBoundingClientRect();
    const a  = nrGetPortCenter(port, cr);

    // Lager en stiplet midlertidig linje som følger musepekeren
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class',          'nr-wire nr-wire-temp');
    path.setAttribute('fill',           'none');
    path.setAttribute('stroke-width',   '4');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);

    wiring = { fromPortEl: port, tempPath: path, a };
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();  // hindrer at node-drag-lytteren utløses samtidig
  }, { signal });

  // Oppdaterer den stiplede linjen mens brukeren drar
  canvas.addEventListener('pointermove', e => {
    if (!wiring) return;
    const cr = canvas.getBoundingClientRect();
    wiring.tempPath.setAttribute('d', nrSvgPath(wiring.a, { x: e.clientX - cr.left, y: e.clientY - cr.top }));
  }, { signal });

  // Fjerner midlertidig linje og oppretter permanent kobling om sluppet på input
  canvas.addEventListener('pointerup', e => {
    if (!wiring) return;
    const from = wiring.fromPortEl;
    wiring.tempPath.remove();  // fjern alltid den midlertidige linjen
    wiring = null;
    const el     = document.elementFromPoint(e.clientX, e.clientY);
    const target = el ? el.closest('.nr-port') : null;
    if (target && target.dataset.port === 'in') nrAddWire(root, from, target);
  }, { signal });

  // ── Play-knapp på Inject-node (event delegation) ──
  canvas.addEventListener('click', e => {
    if (!e.target.closest('.nr-play')) return;
    nrHandlePlay(root);
  }, { signal });

  // ── Verktøylinje-knapper ──

  // Hint — viser hint ett om gangen i rekkefølge
  root.querySelector('#btn-hint').addEventListener('click', () => {
    const hints = t('nr_hints');
    nrDebugLog(root, _hintIndex < hints.length ? hints[_hintIndex++] : t('nr_noMore'));
  }, { signal });

  // Tøm — sletter debug-loggen uten å nullstille flyten
  root.querySelector('#btn-clear').addEventListener('click', () => {
    root.querySelector('#debug-lines').innerHTML = '';
  }, { signal });

  // Sjekk flyt — logger første problem som finnes
  root.querySelector('#btn-check').addEventListener('click', () => nrCheckFlow(root), { signal });

  // Reset — fjerner alle noder og koblinger, nullstiller alt
  // Setter _nrInit = false så initNodeRed kjører på nytt neste gang
  root.querySelector('#btn-reset').addEventListener('click', () => {
    root.querySelectorAll('.nr-node-inst').forEach(n => n.remove());
    nrClearWires(root);
    root.querySelector('#debug-lines').innerHTML = '';
    _hintIndex = 0; _selectedTopicIndex = 0;
    root._nrInit = false;
    Broker.clear();
    nrDebugLog(root, t('nr_resetOk'));
  }, { signal });

  // Simuler sensor — i tilfelle sensor blir ødelagt etc.
  // Bruker nrSimLog slik at gjentatte trykk erstatter forrige resultat
  root.querySelector('#btn-sim').addEventListener('click', async () => {
    if (!nrFlowValid(root)) { nrDebugLog(root, t('nr_simInvalid')); return; }
    const topic = nrGetTopic();
    const val   = (20 + Math.random() * 10).toFixed(2);  // tilfeldig 20–30°C
    const unsub = Broker.sub(topic, m => {
      unsub();  // éngangsabonnement
      const raw = m.payload.toString().replace(/temp=/i, '');
      const v   = parseFloat(raw);
      const msg = !isNaN(v)
        ? t('nr_tempResult').replace('{value}', v.toFixed(2))
        : t('nr_msgReceived') + m.payload;
      nrSimLog(root, msg);
    });
    Broker.pub(topic, 'temp=' + val);
  }, { signal });

  // Første tegning (tomt lerret) og klar-melding i debug-loggen
  nrRedrawWires(root);
  nrDebugLog(root, t('nr_initOk'));
}
