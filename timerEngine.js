// Core timing state machine: MOVE → HOLD → GAP → NEXT

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
    this._notifyUpdate();
    this._startTick();
  }

  _startTick() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      if (this.paused) return;
      this._tick();
    }, 1000);
  }

  _tick() {
    this.secondsInPhase += 1;

    if (this.phase !== PHASES.IDLE && this.phase !== PHASES.COMPLETE) {
      window.audioEngine.beepAndCount(this.secondsInPhase);
    }

    switch (this.phase) {
      case PHASES.PREP:
        if (this.secondsInPhase >= 1) {
          this._transitionTo(PHASES.MOVE);
          window.audioEngine.announce("Start movement");
        }
        break;

      case PHASES.MOVE:
        if (this.secondsInPhase >= this.config.moveDurationSec) {
          if (this.config.holdDurationSec > 0) {
            this._transitionTo(PHASES.HOLD);
            window.audioEngine.announce("Hold");
          } else {
            this._transitionTo(PHASES.GAP);
            window.audioEngine.announce("Relax");
          }
        }
        break;

      case PHASES.HOLD:
        if (this.secondsInPhase >= this.config.holdDurationSec) {
          this._transitionTo(PHASES.GAP);
          window.audioEngine.announce("Relax");
        }
        break;

      case PHASES.GAP:
        const currentGap = this.adaptiveEngine.getCurrentGap();
        if (this.secondsInPhase >= currentGap) {
          this._advanceRepeat(false);
        }
        break;

      case PHASES.COMPLETE:
        clearInterval(this.intervalId);
        this.intervalId = null;
        break;
    }

    this._notifyUpdate();
  }

  _transitionTo(newPhase) {
    this.phase = newPhase;
    this.secondsInPhase = 0;
    this._notifyUpdate();
  }

  _advanceRepeat(userAdvancedEarly) {
    const expectedGap = this.config.gapDurationSec;
    this.adaptiveEngine.recordRepeat(
      this.secondsInPhase,
      expectedGap,
      userAdvancedEarly
    );

    if (this.currentRepeat < this.config.repeats) {
      this.currentRepeat += 1;
      this._transitionTo(PHASES.MOVE);
      window.audioEngine.announce("Next repeat");
    } else {
      if (this.currentSet < this.config.sets) {
        this.currentSet += 1;
        this.currentRepeat = 1;
        this._transitionTo(PHASES.MOVE);
        window.audioEngine.announce("Next set");
      } else {
        this.phase = PHASES.COMPLETE;
        this.secondsInPhase = 0;
        window.audioEngine.announce("Session complete");
      }
    }

    this._notifyUpdate();
  }

  manualNext() {
    if (this.phase === PHASES.COMPLETE || this.phase === PHASES.IDLE) return;
    this._advanceRepeat(true);
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  reset() {
    clearInterval(this.intervalId);
    this.intervalId = null;
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

    const setProgress = (this.currentSet - 1) / totalSets;
    const repeatProgress = (this.currentRepeat - 1) / totalRepeats;

    this.callbacks.onUpdate({
      phase: this.phase,
      secondsInPhase: this.secondsInPhase,
      currentSet: this.currentSet,
      totalSets,
      currentRepeat: this.currentRepeat,
      totalRepeats,
      adaptiveGapSec: this.adaptiveEngine.getCurrentGap(),
      setProgress,
      repeatProgress
    });
  }
}

window.TimerEngine = TimerEngine;
window.PHASES = PHASES;
