class SensorTask {

  constructor(config = {}) {
    // set defaults if nothing is passed in
    this.sensorKey    = config.sensorKey    || 'pot';
    this.targetMin    = config.targetMin    ?? 0;
    this.targetMax    = config.targetMax    ?? 3.3;
    this.holdTime     = config.holdTime     ?? 0;       // 0 = complete on first in-range reading
    this.pollInterval = config.pollInterval ?? 1000;
    this.sensorUrl    = config.sensorUrl    || '/sensor';

    // callbacks — set to null if not provided
    this.onValue    = config.onValue    || null;
    this.onProgress = config.onProgress || null;
    this.onComplete = config.onComplete || null;
    this.onReset    = config.onReset    || null;
    this.onError    = config.onError    || null;

    // internal state
    this._intervalId    = null;
    this._completed     = false;
    this._holdStart     = null;   // timestamp when value first entered range
    this._lastReading   = null;
  }

  // public API

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
    // null out callbacks so nothing fires after the task is gone
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

  // Private 

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
      // ESP32 not reachable, return simulated value and mark as not real
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
    // fallback if sensorKey doesn't match pot or dist
    return parseFloat(data[this.sensorKey]) || 0;
  }

  _simulateValue() {
    if (this.sensorKey === 'pot') {
      return parseFloat((Math.random()).toFixed(3));
    }
    if (this.sensorKey === 'dist') {
      return Math.floor(30 + Math.random() * 1170);
    }
    return 0;
  }
}
