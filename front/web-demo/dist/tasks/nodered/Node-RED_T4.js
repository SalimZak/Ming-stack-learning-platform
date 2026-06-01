// Node-RED task 4 - Node-RED simulator (loadcell)

(function () {

const Lastcelle_url = "/lastcelle"; // loadcell endpoint

let _nrCtrl = null;  // AbortController, abort() removes all event listeners at once
let _rafMove = 0;    // requestAnimationFrame handle — 0 means no frame is queued

// simple in-memory MQTT broker for the simulator
// uses an IIFE so the subs Map stays private
const Broker = (() => {
  const subs = new Map();  // topic string -> Set of callback functions
  return {
    sub(topic, cb) {
      if (!subs.has(topic)) subs.set(topic, new Set());
      subs.get(topic).add(cb);
      return () => subs.get(topic)?.delete(cb);
      // returns an unsubscribe function — ?. prevents errors if the topic was already deleted
    },
    pub(topic, payload) {
      const set = subs.get(topic);
      if (!set) return;  // no subscribers on this topic
      for (const cb of set) cb({ topic, payload, ts: Date.now() });
    },
    clear() { subs.clear(); }
  };
})();

const TOPIC_OPTIONS = ['sensor/temperatur', 'sensor/fuktighet', 'sensor/trykk'];
const CORRECT_TOPIC = 'sensor/trykk';
// only sensor/trykk is correct, the sensor sends pressure data

// scoring: starts at 5, -1 per hint used, floor at 0
const NR_MAX_SCORE = 5;
const NR_MIN_SCORE = 0;

let _selectedTopicIndex = 0;  // which topic is shown on the MQTT nodes
let _hintIndex = 0;           // which hint shows next
let _nrNodeId  = 1;           // auto-increment ID for node instances on the canvas
const _nrWires = [];          // all drawn wires — updated by nrRedrawWires()
let _nrCompleted = false;     // true once the user has completed the flow at least once this session

// fetches loadcell value from the backend, falls back to simulated if ESP32 is offline
async function nrGetSensorValue() {
  try {
    const res = await fetch(Lastcelle_url);
    const data = await res.json(); // parse the response body as a JS object
    return { value: parseFloat(data.loadcell.toFixed(2)), real: true }; // round to 2 decimals
  } catch {
    // ESP32 not reachable, return simulated value and mark as not real
    return { value: parseFloat((Math.random() * 1500).toFixed(2)), real: false };
  }
}

// adds a new line to the debug panel, newest on top
function nrDebugLog(root, msg) {
  const out = root.querySelector('#debug-lines');
  if (!out) return;
  const line = document.createElement('div');
  line.className   = 'dbg-line';
  line.textContent = msg;
  out.prepend(line);
}

// like nrDebugLog but replaces the previous sim result instead of stacking new lines
function nrSimLog(root, msg) {
  const out = root.querySelector('#debug-lines');
  if (!out) return;
  out.querySelectorAll('.dbg-sim-line').forEach(el => el.remove());
  const line = document.createElement('div');
  line.className   = 'dbg-line dbg-sim-line';
  line.textContent = msg;
  out.prepend(line);
}

// returns the HTML for a draggable node tile in the left panel
function nrNodeTile(title, kind) {
  return `<div class="nr-node" draggable="true" data-title="${title}" data-kind="${kind}">
    <div class="nr-node-title">${title}</div>
    <div class="nr-node-sub">${t('nr_kind_' + kind)}</div>
    <div class="nr-node-drag">${t('nr_drag')}</div>
  </div>`;
}

// returns the HTML for the topic selector inside MQTT nodes
function nrTopicSliderHtml() {
  return `<div class="nr-topic-slider">
    <button class="nr-topic-arrow" data-dir="-1">←</button>
    <span class="nr-topic-value">${TOPIC_OPTIONS[_selectedTopicIndex]}</span>
    <button class="nr-topic-arrow" data-dir="1">→</button>
  </div>`;
}

// updates the topic text on all MQTT nodes after the user clicks an arrow
function nrUpdateTopicSliders(root) {
  root.querySelectorAll('.nr-topic-value').forEach(el => {
    el.textContent = TOPIC_OPTIONS[_selectedTopicIndex];
  });
}

// builds a node instance that can be placed on the canvas
function nrCreateNodeInst(title, x, y) {
  const id  = 'n' + (_nrNodeId++);
  const el  = document.createElement('div');
  el.className     = 'nr-node-inst';
  el.dataset.id    = id;
  el.dataset.title = title;

  const isMQTT  = title.indexOf('MQTT') !== -1; // drag nodes here and connect them with wires
  const hasPlay = title === 'Inject';
  const hasIn   = title !== 'Inject';  // Inject has no input port — it starts the chain
  const hasOut  = title !== 'Debug';   // Debug has no output port — it ends the chain

  const bodyHtml = isMQTT  ? `<div class="nr-field"><span>${t('nr_topicLabel')}</span>${nrTopicSliderHtml()}</div>` : '';
  const playBtn  = hasPlay ? '<button class="nr-play" title="Inject">&#9654;</button>' : '';
  // &#9654; is the HTML code for the play button symbol

  el.innerHTML = `
    <div class="nr-node-inst-head"><div class="nr-node-inst-title">${title}</div>${playBtn}</div>
    <div class="nr-node-inst-body">${bodyHtml}</div>
    ${hasIn  ? '<div class="nr-port nr-port-in"  data-port="in"></div>'  : ''}
    ${hasOut ? '<div class="nr-port nr-port-out" data-port="out"></div>' : ''}`;

  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  return el;
}

// removes all SVG wires from the canvas and empties the array
function nrClearWires(root) {
  const svg = root.querySelector('#wires');
  if (svg) svg.innerHTML = '';
  _nrWires.length = 0;
}

// calculates the center point of a port relative to the canvas corner
// SVG coordinates are relative to the SVG element, not the screen
function nrGetPortCenter(portEl, canvasRect) {
  const r = portEl.getBoundingClientRect();
  return {
    x: r.left + r.width  / 2 - canvasRect.left,
    y: r.top  + r.height / 2 - canvasRect.top
  };
}

// returns a cubic Bezier SVG path between two points
// the dx offset creates the characteristic S-curve that real Node-RED uses
function nrSvgPath(a, b) {
  const dx = Math.max(50, Math.abs(b.x - a.x) * 0.5);
  // minimum 50px offset so short connections still show a visible curve
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
}

// redraws all wires — called after a node moves or the window resizes
function nrRedrawWires(root) {
  const canvas = root.querySelector('#canvas');
  const svg    = root.querySelector('#wires');
  if (!canvas || !svg) return;
  const cr = canvas.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${cr.width} ${cr.height}`);
  for (const w of _nrWires) {
    const fn = root.querySelector(`.nr-node-inst[data-id="${w.from.nodeId}"]`);
    const tn = root.querySelector(`.nr-node-inst[data-id="${w.to.nodeId}"]`);
    if (!fn || !tn) continue;  // node was removed, skip
    const fp = fn.querySelector(`.nr-port[data-port="${w.from.port}"]`);
    const tp = tn.querySelector(`.nr-port[data-port="${w.to.port}"]`);
    if (!fp || !tp) continue;
    w.pathEl.setAttribute('d', nrSvgPath(nrGetPortCenter(fp, cr), nrGetPortCenter(tp, cr)));
  }
}

// creates a permanent SVG wire from an output port to an input port
function nrAddWire(root, fromPortEl, toPortEl) {
  const svg = root.querySelector('#wires');
  if (!svg) return;
  const fromNode = fromPortEl.closest('.nr-node-inst');
  const toNode   = toPortEl.closest('.nr-node-inst');
  if (!fromNode || !toNode) return;
  if (!(fromPortEl.dataset.port === 'out' && toPortEl.dataset.port === 'in')) return;
  // only out -> in connections are allowed

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  // createElementNS is required for SVG elements — regular createElement creates HTML, not SVG
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

// finds the first node instance with a given title, or null
function nrGetNodeByTitle(root, title) {
  return Array.from(root.querySelectorAll('.nr-node-inst'))
    .find(n => n.dataset.title === title) || null;
}

function nrGetTopic() { return TOPIC_OPTIONS[_selectedTopicIndex]; }

// checks if a wire exists from node 'a' to node 'b'
function nrHasWire(root, a, b) {
  const fn = nrGetNodeByTitle(root, a);
  const tn = nrGetNodeByTitle(root, b);
  if (!fn || !tn) return false;
  return _nrWires.some(w => w.from.nodeId === fn.dataset.id && w.to.nodeId === tn.dataset.id);
}

// silently checks if the flow is valid — returns true/false
// order: nodes exist -> correct topic -> wires in the right order
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

// calculates the current score based on hints used
function nrCurrentScore() {
  return Math.max(NR_MIN_SCORE, NR_MAX_SCORE - _hintIndex);
}

// shows the completion banner with the score and saves it to the shared point system
function nrShowCompleteBanner() {
  const banner = document.getElementById('nrt4-complete-banner');
  if (!banner) return;
  const score = nrCurrentScore();
  banner.textContent = t('nr_complete') + ' \u2014 ' + t('nr_completeScore') +
                       ': ' + score + '/' + NR_MAX_SCORE;
  banner.style.display = 'block';
  if (typeof pointSystem === 'function') pointSystem('nodered-t4', score);
  _nrCompleted = true;
}

// simulates the Inject node sending a message through the flow
async function nrHandlePlay(root) {
  if (!nrFlowValid(root)) { nrDebugLog(root, t('nr_flowInvalid')); return; }

  const result = await nrGetSensorValue();
  const source = result.real ? '[ESP32]' : '[sim]';
  const topic  = nrGetTopic();

  // subscribe BEFORE publishing — same as how real MQTT works
  const unsub = Broker.sub(topic, m => {
    unsub();  // one-time subscription — remove itself after the first message
    // without this, every Play press would add a new listener
    const raw = m.payload.toString().replace(/trykk=/i, ''); // strip the "trykk=" prefix
    const v   = parseFloat(raw); // convert the string to a number
    let msg;
    if (!isNaN(v)) { // isNaN means "is Not a Number" — checks we got a valid value
      msg = 'Pressure received: ' + v.toFixed(2) + ' kg';
    } else {
      msg = t('nr_msgReceived') + m.payload; // show raw payload if parsing failed
    }
    nrDebugLog(root, source + ' ' + msg);
  });

  Broker.pub(topic, 'trykk=' + result.value.toFixed(2)); // publish the pressure value

  // flow is valid and a message was sent — register completion
  if (!_nrCompleted) nrShowCompleteBanner();
}

// checks the flow and logs the first error it finds — one at a time to avoid overwhelming the user
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

// builds the full simulator UI inside the root element
// the _nrInit flag prevents it from being built twice if the user navigates back and forth
function initNodeRed(rootId) {
  const root = document.getElementById(rootId);
  if (!root || root._nrInit) return;
  root._nrInit = true;

  // abort any leftover listeners from the previous session
  if (_nrCtrl) { try { _nrCtrl.abort(); } catch(e) {} }
  _nrCtrl = new AbortController();
  const signal = _nrCtrl.signal;
  // all addEventListener calls below use { signal }
  // when _nrCtrl.abort() is called all listeners are removed at once — no memory leaks

  // reset all state
  _hintIndex = 0; _selectedTopicIndex = 0; _nrNodeId = 1;
  _nrWires.length = 0;
  _nrCompleted = false;
  Broker.clear();

  // inject the simulator HTML
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

  // redraw wires when the window is resized
  window.addEventListener('resize', () => nrRedrawWires(root), { signal });

  // drag from palette to canvas
  // store the node title in drag data so the drop handler knows what was dropped
  root.querySelector('#node-list').addEventListener('dragstart', e => {
    const tile = e.target.closest('.nr-node');
    if (!tile) return;
    e.dataTransfer.setData('text/plain', tile.dataset.title);
    e.dataTransfer.effectAllowed = 'copy';
  }, { signal });

  // dragover must call preventDefault or the drop event won't fire
  canvas.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, { signal });

  // create a node instance where the user drops
  canvas.addEventListener('drop', e => {
    e.preventDefault();
    const title = e.dataTransfer.getData('text/plain');
    if (!title) return;
    const cr = canvas.getBoundingClientRect();
    canvas.appendChild(nrCreateNodeInst(title, e.clientX - cr.left - 70, e.clientY - cr.top - 24));
    nrRedrawWires(root);
  }, { signal });

  // topic selector (event delegation)
  canvas.addEventListener('click', e => {
    const arrow = e.target.closest('.nr-topic-arrow');
    if (!arrow) return;
    // + TOPIC_OPTIONS.length before modulo ensures the result never goes negative
    _selectedTopicIndex = (_selectedTopicIndex + parseInt(arrow.dataset.dir) + TOPIC_OPTIONS.length) % TOPIC_OPTIONS.length;
    nrUpdateTopicSliders(root);
  }, { signal });

  // drag nodes around the canvas
  let dragNode = null, dragOffset = { x: 0, y: 0 };

  canvas.addEventListener('pointerdown', e => {
    if (e.target.closest('.nr-port') || e.target.closest('.nr-topic-arrow')) return;
    const node = e.target.closest('.nr-node-inst');
    if (!node) return;
    dragNode = node;
    const r = node.getBoundingClientRect();
    dragOffset = { x: e.clientX - r.left, y: e.clientY - r.top };
    node.setPointerCapture(e.pointerId);
    // setPointerCapture keeps sending events even if the pointer moves outside the node
  }, { signal });

  canvas.addEventListener('pointermove', e => {
    if (!dragNode || _rafMove) return;
    // _rafMove !== 0 means a frame is already queued — skip this event
    // pointermove can fire 1000+ times per second but the screen only refreshes ~60 times
    // requestAnimationFrame throttles updates to the screen's refresh rate
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
      // try/catch because releasePointerCapture can throw if the pointer was already released
    }
    dragNode = null;
  }, { signal });

  // draw wires between ports
  let wiring = null;

  canvas.addEventListener('pointerdown', e => {
    const port = e.target.closest('.nr-port');
    if (!port || port.dataset.port !== 'out') return;  // only start from output ports
    const cr = canvas.getBoundingClientRect();
    const a  = nrGetPortCenter(port, cr);

    // create a dashed temporary wire that follows the pointer
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class',          'nr-wire nr-wire-temp');
    path.setAttribute('fill',           'none');
    path.setAttribute('stroke-width',   '4');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);

    wiring = { fromPortEl: port, tempPath: path, a };
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();  // prevents the node drag listener from firing at the same time
  }, { signal });

  // update the dashed wire as the user drags
  canvas.addEventListener('pointermove', e => {
    if (!wiring) return;
    const cr = canvas.getBoundingClientRect();
    wiring.tempPath.setAttribute('d', nrSvgPath(wiring.a, { x: e.clientX - cr.left, y: e.clientY - cr.top }));
  }, { signal });

  // remove temp wire and create a permanent connection if dropped on an input port
  canvas.addEventListener('pointerup', e => {
    if (!wiring) return;
    const from = wiring.fromPortEl;
    wiring.tempPath.remove();  // always remove the temporary wire
    wiring = null;
    const el     = document.elementFromPoint(e.clientX, e.clientY);
    const target = el ? el.closest('.nr-port') : null;
    if (target && target.dataset.port === 'in') nrAddWire(root, from, target);
  }, { signal });

  // play button on the Inject node (event delegation)
  canvas.addEventListener('click', e => {
    if (!e.target.closest('.nr-play')) return;
    nrHandlePlay(root);
  }, { signal });

  // toolbar buttons

  // hint — shows hints one at a time in order
  root.querySelector('#btn-hint').addEventListener('click', () => {
    const hints = t('nr_hints');
    nrDebugLog(root, _hintIndex < hints.length ? hints[_hintIndex++] : t('nr_noMore'));
  }, { signal });

  // clear — clears the debug log without resetting the flow
  root.querySelector('#btn-clear').addEventListener('click', () => {
    root.querySelector('#debug-lines').innerHTML = '';
  }, { signal });

  // check flow — logs the first problem found
  root.querySelector('#btn-check').addEventListener('click', () => nrCheckFlow(root), { signal });

  // reset — removes all nodes and wires, resets everything
  // sets _nrInit = false so initNodeRed runs fresh next time
  root.querySelector('#btn-reset').addEventListener('click', () => {
    root.querySelectorAll('.nr-node-inst').forEach(n => n.remove());
    nrClearWires(root);
    root.querySelector('#debug-lines').innerHTML = '';
    _hintIndex = 0; _selectedTopicIndex = 0;
    _nrCompleted = false;
    const banner = document.getElementById('nrt4-complete-banner');
    if (banner) banner.style.display = 'none';
    root._nrInit = false;
    Broker.clear();
    nrDebugLog(root, t('nr_resetOk'));
  }, { signal });

  // simulate sensor — checks the flow is valid before simulating
  // uses nrSimLog so repeated presses replace the previous result instead of stacking
  root.querySelector('#btn-sim').addEventListener('click', async () => {
    if (!nrFlowValid(root)) { nrDebugLog(root, t('nr_simInvalid')); return; }
    const topic = nrGetTopic();
    const result = await nrGetSensorValue(); // fetch from ESP32, falls back to simulated if offline
    const val = result.value.toFixed(2);
    const unsub = Broker.sub(topic, m => {
      unsub(); // one-time subscription
      const raw = m.payload.toString().replace(/trykk=/i, ''); // strip the "trykk=" prefix
      const v = parseFloat(raw); // convert to number
      let msg;
      if (!isNaN(v)) { // isNaN means "is Not a Number" — checks we got a valid value
        msg = 'Pressure received: ' + v.toFixed(2) + ' kg';
      } else {
        msg = t('nr_msgReceived') + m.payload; // show raw payload if parsing failed
      }
      nrSimLog(root, msg); // replaces the previous sim line instead of stacking
    });
    Broker.pub(topic, 'trykk=' + val); // publish so the subscriber above receives it

    // flow is valid and a message was sent — register completion
    if (!_nrCompleted) nrShowCompleteBanner();
  }, { signal });

  // initial wire draw (empty canvas) and ready message in the debug log
  nrRedrawWires(root);
  nrDebugLog(root, t('nr_initOk'));
}

window.initNodeRedT4 = initNodeRed;
})();