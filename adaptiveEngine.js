class AdaptiveEngine {
  constructor(initialGapSec) {
    this.baseGapSec = initialGapSec;
    this.currentGapSec = initialGapSec;
    this.history = [];
    this.enabled = true;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  recordRepeat(userAdvancedEarly) {
    if (!this.enabled) return;

    const delta = userAdvancedEarly ? -0.5 : 0.5;
    this.currentGapSec = Math.max(0, this.currentGapSec + delta);
  }

  getCurrentGap() {
    return this.currentGapSec;
  }
}

window.AdaptiveEngine = AdaptiveEngine;
