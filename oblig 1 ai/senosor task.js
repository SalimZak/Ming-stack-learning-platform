class SensorTask {

  constructor(config = {}) {
    // ── Config with defaults ──
    this.sensorKey    = config.sensorKey    || 'pot';
    this.targetMin    = config.targetMin    ?? 0;
    this.targetMax    = config.targetMax    ?? 3.3;
    this.holdTime     = config.holdTime     ?? 0;       // 0 = complete on first in-range reading
    this.pollInterval = config.pollInterval ?? 1000;
    this.sensorUrl    = config.sensorUrl    || '/sensor';

    // ── Callbacks ──
    this.onValue    = config.onValue    || null;
    this.onProgress = config.onProgress || null;
    this.onComplete = config.onComplete || null;
    this.onReset    = config.onReset    || null;
    this.onError    = config.onError    || null;

    // ── Internal state ──
    this._intervalId    = null;
    this._completed     = false;
    this._holdStart     = null;   // timestamp when value first entered range
    this._lastReading   = null;
  }

  // Public API

  start() {
    if (this._intervalId) return; // already running
    this._intervalId = setInterval(() => this._poll(), this.pollInterval);
    this._poll(); // fire immediately, don't wait for first interval
  }

  stop() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  reset() {
    this._completed   = false;
    this._holdStart   = null;
    this._lastReading = null;
    if (this.onReset) this.onReset();
  }

  destroy() {
    this.stop();
    this._completed   = false;
    this._holdStart   = null;
    this._lastReading = null;
    this.onValue      = null;
    this.onProgress   = null;
    this.onComplete   = null;
    this.onReset      = null;
    this.onError      = null;
  }

  /** True if the task has been completed */
  get completed() { return this._completed; }

  /** Last reading object, or null */
  get lastReading() { return this._lastReading; }

  // ── Private ────────────────────────────────────────────────

  async _poll() {
    if (this._completed) return; // nothing to do

    const reading = await this._fetchReading();
    this._lastReading = reading;

    // Always fire onValue so the UI can update the live display
    if (this.onValue) this.onValue(reading);

    const inRange = reading.value >= this.targetMin
                 && reading.value <= this.targetMax;

    if (inRange) {
      this._handleInRange(reading);
    } else {
      this._handleOutOfRange();
    }
  }

  _handleInRange(reading) {
    // First time entering range — start the hold timer
    if (this._holdStart === null) {
      this._holdStart = Date.now();
    }

    const elapsed  = Date.now() - this._holdStart;
    const required = this.holdTime;

    if (this.onProgress) this.onProgress(elapsed, required);

    if (elapsed >= required) {
      // ── Task complete! ──
      this._completed = true;
      this.stop();
      if (this.onComplete) this.onComplete(reading);
    }
  }

  _handleOutOfRange() {
    // Value left the target range before holdTime was met
    if (this._holdStart !== null) {
      this._holdStart = null;
      if (this.onReset) this.onReset();
    }
  }

  async _fetchReading() {
    const now = Date.now();
    try {
      const res = await fetch(this.sensorUrl, {
        signal: AbortSignal.timeout(2000)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'firmware error');

      return {
        value:     this._extractValue(data),
        raw:       data,
        real:      true,
        timestamp: now,
      };
    } catch (err) {
      if (this.onError) this.onError(err);
      return {
        value:     this._simulateValue(),
        raw:       null,
        real:      false,
        timestamp: now,
      };
    }
  }

  _extractValue(data) {
    if (this.sensorKey === 'pot') {
      return parseFloat(data.pot);
    }
    if (this.sensorKey === 'dist') {
      return parseInt(data.dist, 10);
    }
    // Fallback: try to read the key directly
    return parseFloat(data[this.sensorKey]) || 0;
  }

  _simulateValue() {
    if (this.sensorKey === 'pot') {
      return parseFloat((Math.random() * 3.3).toFixed(3));
    }
    if (this.sensorKey === 'dist') {
      return Math.floor(30 + Math.random() * 1170);
    }
    return 0;
  }
}


// ══════════════════════════════════════════════════════════════
//  EXAMPLE WIRING — delete or adapt these when building real tasks
// ══════════════════════════════════════════════════════════════

/**
 *  Example 1: InfluxDB task
 *  "Turn the potentiometer to 2.0–2.5 V and hold for 3 seconds"
 *  On success, show a fake InfluxDB timestamp write confirmation.
 */
function exampleInfluxTask(containerEl) {
  // You would create your display elements here
  const display = document.createElement('div');
  display.innerHTML = `
    <div id="influx-value" style="font-size:32px; font-weight:900;">—</div>
    <div id="influx-status" style="margin-top:8px; font-size:12px; color:#8fa3b3;"></div>
    <div id="influx-result" style="margin-top:12px; display:none;"></div>
  `;
  containerEl.appendChild(display);

  const valueEl  = display.querySelector('#influx-value');
  const statusEl = display.querySelector('#influx-status');
  const resultEl = display.querySelector('#influx-result');

  const task = new SensorTask({
    sensorKey:  'pot',
    targetMin:  2.0,
    targetMax:  2.5,
    holdTime:   3000,     // hold for 3 seconds
    pollInterval: 500,

    onValue(reading) {
      const src = reading.real ? '● LIVE' : '◌ sim';
      valueEl.textContent = reading.value.toFixed(3) + ' V';
      statusEl.textContent = `${src}  |  Target: 2.0–2.5 V`;
    },

    onProgress(elapsed, required) {
      const pct = Math.min(100, (elapsed / required) * 100).toFixed(0);
      statusEl.textContent = `In range — hold steady… ${pct}%`;
    },

    onComplete(reading) {
      const ts = new Date(reading.timestamp).toISOString();
      resultEl.style.display = 'block';
      resultEl.innerHTML = `
        <div style="padding:12px; background:rgba(74,222,128,.12); border:1px solid #4ade80; border-radius:8px;">
          <strong>✓ InfluxDB write confirmed</strong><br>
          <code>sensor,type=pot value=${reading.value.toFixed(3)} ${reading.timestamp}000000</code><br>
          <span style="font-size:11px; color:#8fa3b3;">Timestamp: ${ts}</span>
        </div>
      `;
    },

    onReset() {
      statusEl.textContent = 'Value left target range — try again';
      resultEl.style.display = 'none';
    },
  });

  task.start();
  return task; // return so the caller can stop/destroy later
}


/**
 *  Example 2: Grafana task
 *  "Get the distance sensor between 200–400 mm"
 *  On success, show a fake Grafana dashboard confirmation.
 */
function exampleGrafanaTask(containerEl) {
  const display = document.createElement('div');
  display.innerHTML = `
    <div id="graf-value" style="font-size:32px; font-weight:900;">—</div>
    <div id="graf-bar" style="margin-top:8px; height:8px; background:rgba(255,255,255,.08); border-radius:4px; overflow:hidden;">
      <div id="graf-fill" style="height:100%; width:0%; background:#38B8D0; transition:width .3s;"></div>
    </div>
    <div id="graf-status" style="margin-top:6px; font-size:12px; color:#8fa3b3;"></div>
    <div id="graf-result" style="margin-top:12px; display:none;"></div>
  `;
  containerEl.appendChild(display);

  const valueEl  = display.querySelector('#graf-value');
  const fillEl   = display.querySelector('#graf-fill');
  const statusEl = display.querySelector('#graf-status');
  const resultEl = display.querySelector('#graf-result');

  const task = new SensorTask({
    sensorKey:  'dist',
    targetMin:  200,
    targetMax:  400,
    holdTime:   2000,
    pollInterval: 500,

    onValue(reading) {
      valueEl.textContent = reading.value + ' mm';
    },

    onProgress(elapsed, required) {
      const pct = Math.min(100, (elapsed / required) * 100);
      fillEl.style.width = pct + '%';
      statusEl.textContent = `Holding in range… ${pct.toFixed(0)}%`;
    },

    onComplete(reading) {
      fillEl.style.width = '100%';
      fillEl.style.background = '#4ade80';
      resultEl.style.display = 'block';
      resultEl.innerHTML = `
        <div style="padding:12px; background:rgba(74,222,128,.12); border:1px solid #4ade80; border-radius:8px;">
          <strong>✓ Grafana panel updated</strong><br>
          <span>Distance reading ${reading.value} mm displayed on dashboard</span>
        </div>
      `;
    },

    onReset() {
      fillEl.style.width = '0%';
      fillEl.style.background = '#38B8D0';
      statusEl.textContent = 'Left target range — try again';
      resultEl.style.display = 'none';
    },
  });

  task.start();
  return task;
}