const PHASES = {
  IDLE: "IDLE",
  PREP: "PREP",
  MOVE: "MOVE",
  HOLD: "HOLD",
  GAP: "GAP",
  COMPLETE: "COMPLETE"
};

class TimerEngine {
  constructor(config, callbacks) {
    this.config = config;
    this.callbacks = callbacks;

    this.currentSet = 1;
    this.currentRepeat = 1;
    this.phase = PHASES.IDLE;
    this.secondsInPhase = 0;
    this.intervalId = null;
    this.paused = false;

    this.adaptiveEngine = new window.AdaptiveEngine(config.gapDurationSec);
    this.adaptiveEngine.setEnabled(config.adaptiveGap);
  }

  start() {
    this.currentSet = 1;
    this.currentRepeat = 1;
    this.phase = PHASES.PREP;
    this.secondsInPhase = 0;
    this._startTick();
  }

  _startTick() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      if (!this.paused) this._tick();
    }, 1000);
  }

  _tick() {
    this.secondsInPhase += 1;

    switch (this.phase) {
      case PHASES.PREP:
        if (this.secondsInPhase >= 1) {
          this._transitionTo(PHASES.MOVE);
        }
        break;

      case PHASES.MOVE:
        if (this.secondsInPhase >= this.config.moveDurationSec) {
          if (this.config.holdDurationSec > 0) {
            this._transitionTo(PHASES.HOLD);
          } else {
            this._transitionTo(PHASES.GAP);
          }
        }
        break;

      case PHASES.HOLD:
        window.audioEngine.holdCount(this.secondsInPhase);

        if (this.secondsInPhase >= this.config.holdDurationSec) {
          this._transitionTo(PHASES.GAP);
        }
        break;

      case PHASES.GAP:
        const gap = this.adaptiveEngine.getCurrentGap();
        if (this.secondsInPhase >= gap) {
          this._advanceRepeat(false);
        }
        break;

      case PHASES.COMPLETE:
        clearInterval(this.intervalId);
        break;
    }

    this._notifyUpdate();
  }

  _transitionTo(newPhase) {
    this.phase = newPhase;
    this.secondsInPhase = 0;
  }

  _advanceRepeat(userAdvancedEarly) {
    this.adaptiveEngine.recordRepeat(userAdvancedEarly);

    if (this.currentRepeat < this.config.repeats) {
      this.currentRepeat += 1;
      window.audioEngine.announceRepeat(this.currentRepeat, this.config.repeats);
      this._transitionTo(PHASES.MOVE);
    } else {
      if (this.currentSet < this.config.sets) {
        this.currentSet += 1;
        this.currentRepeat = 1;

        window.audioEngine.announceRest();
        window.audioEngine.playSoothingMusic();

        this._transitionTo(PHASES.GAP);
        this.secondsInPhase = -30;
      } else {
        this.phase = PHASES.COMPLETE;
        window.audioEngine.speak("Session complete");
      }
    }

    this._notifyUpdate();
  }

  manualNext() {
    if (this.phase !== PHASES.COMPLETE) {
      this._advanceRepeat(true);
    }
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  reset() {
    clearInterval(this.intervalId);
    this.phase = PHASES.IDLE;
    this.secondsInPhase = 0;
    this.currentSet = 1;
    this.currentRepeat = 1;
    this._notifyUpdate();
  }

  _notifyUpdate() {
    if (!this.callbacks) return;

    const totalRepeats = this.config.repeats;
    const totalSets = this.config.sets;

    this.callbacks.onUpdate({
      phase: this.phase,
      secondsInPhase: this.secondsInPhase,
      currentSet: this.currentSet,
      totalSets,
      currentRepeat: this.currentRepeat,
      totalRepeats,
      adaptiveGapSec: this.adaptiveEngine.getCurrentGap(),
      setProgress: (this.currentSet - 1) / totalSets,
      repeatProgress: (this.currentRepeat - 1) / totalRepeats
    });
  }
}

window.TimerEngine = TimerEngine;
window.PHASES = PHASES;
