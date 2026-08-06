// Adaptive gap engine: adjusts gap based on user "Next" timing

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

  setBaseGap(sec) {
    this.baseGapSec = sec;
    if (this.history.length === 0) {
      this.currentGapSec = sec;
    }
  }

  recordRepeat(phaseDurationSec, expectedGapSec, userAdvancedEarly) {
    if (!this.enabled) {
      this.currentGapSec = expectedGapSec;
      return;
    }

    const delta = userAdvancedEarly ? -0.5 : 0.5;
    this.currentGapSec = Math.max(0, expectedGapSec + delta);

    this.history.push({
      phaseDurationSec,
      expectedGapSec,
      userAdvancedEarly,
      newGapSec: this.currentGapSec
    });

    if (this.history.length > 20) {
      this.history.shift();
    }
  }

  getCurrentGap() {
    return this.currentGapSec;
  }
}

window.AdaptiveEngine = AdaptiveEngine;
