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
    this.completionNotified = false;
    this.betweenSetsResting = false;

    this.adaptiveEngine = new window.AdaptiveEngine(config.gapDurationSec);
    this.adaptiveEngine.setEnabled(config.adaptiveGap);
  }

  start() {
    this.currentSet = 1;
    this.currentRepeat = 1;
    this.phase = PHASES.PREP;
    this.secondsInPhase = 0;
    this.completionNotified = false;
    this.betweenSetsResting = false;
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
        window.audioEngine.holdCount(this.secondsInPhase, this.config.holdDurationSec);
        if (this.secondsInPhase >= this.config.holdDurationSec) {
          this._notifyUpdate();
          this._transitionTo(PHASES.GAP);
          return;
        }
        break;

      case PHASES.GAP:
        if (this.betweenSetsResting && this.secondsInPhase >= 0) {
          this._startNextSet();
        } else if (!this.betweenSetsResting && this.secondsInPhase >= this.adaptiveEngine.getCurrentGap()) {
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
        this.betweenSetsResting = true;
      } else {
        this.phase = PHASES.COMPLETE;
        window.audioEngine.announceSessionComplete();

        if (!this.completionNotified && this.callbacks?.onComplete) {
          this.completionNotified = true;
          this.callbacks.onComplete({
            exerciseName: this.config.exerciseName,
            completedAt: new Date().toISOString()
          });
        }
      }
    }

    this._notifyUpdate();
  }

  manualNext() {
    if (this.phase !== PHASES.COMPLETE && this.phase !== PHASES.IDLE) {
      if (this.betweenSetsResting) {
        this._startNextSet();
        return;
      }
      this._advanceRepeat(true);
    }
  }

  _startNextSet() {
    this.betweenSetsResting = false;
    this._transitionTo(PHASES.MOVE);
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
    this.completionNotified = false;
    this.betweenSetsResting = false;
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
