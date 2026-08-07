class AdaptiveEngine {
  constructor(initialGapSec) {
    this.baseGapSec = initialGapSec;
    this.currentGapSec = initialGapSec;
    this.enabled = true;

    this.MIN_GAP = 1;
    this.MAX_GAP = 10;
    this.deltaEarly = -0.5;
    this.deltaLate = 0.5;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setDelta(early, late) {
    this.deltaEarly = early;
    this.deltaLate = late;
  }

  setLimits(min, max) {
    this.MIN_GAP = min;
    this.MAX_GAP = max;
  }

  recordRepeat(userAdvancedEarly) {
    if (!this.enabled) return;

    const delta = userAdvancedEarly ? this.deltaEarly : this.deltaLate;
    this.currentGapSec += delta;

    this.currentGapSec = Math.max(this.MIN_GAP, Math.min(this.MAX_GAP, this.currentGapSec));
  }

  getCurrentGap() {
    return this.currentGapSec;
  }
}

window.AdaptiveEngine = AdaptiveEngine;
