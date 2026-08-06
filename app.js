// Wire UI ↔ TimerEngine ↔ AudioEngine

let timerEngine = null;

function getConfigFromUI() {
  const exerciseName = document.getElementById("exerciseName").value || "Exercise";
  const repeats = Number(document.getElementById("repeats").value) || 10;
  const sets = Number(document.getElementById("sets").value) || 2;
  const moveDurationSec = Number(document.getElementById("moveDuration").value) || 3;
  const holdDurationSec = Number(document.getElementById("holdDuration").value) || 0;
  const gapDurationSec = Number(document.getElementById("gapDuration").value) || 3;
  const adaptiveGap = document.getElementById("adaptiveGap").checked;
  const audioEnabled = document.getElementById("audioEnabled").checked;

  window.audioEngine.setAudioEnabled(audioEnabled);

  return {
    exerciseName,
    repeats,
    sets,
    moveDurationSec,
    holdDurationSec,
    gapDurationSec,
    adaptiveGap
  };
}

function updateUI(state, exerciseName) {
  document.getElementById("statusExercise").textContent = exerciseName;
  document.getElementById("statusSet").textContent =
    `${state.currentSet} / ${state.totalSets}`;
  document.getElementById("statusRepeat").textContent =
    `${state.currentRepeat} / ${state.totalRepeats}`;
  document.getElementById("statusPhase").textContent = state.phase;
  document.getElementById("statusSeconds").textContent = state.secondsInPhase;
  document.getElementById("statusAdaptiveGap").textContent =
    state.adaptiveGapSec.toFixed(1);

  document.getElementById("phaseLabel").textContent = state.phase;
  document.getElementById("phaseTimer").textContent = state.secondsInPhase;

  document.getElementById("setProgressBar").style.width =
    `${Math.min(100, state.setProgress * 100)}%`;
  document.getElementById("repeatProgressBar").style.width =
    `${Math.min(100, state.repeatProgress * 100)}%`;
}

function init() {
  const startBtn = document.getElementById("startBtn");
  const resetBtn = document.getElementById("resetBtn");
  const nextBtn = document.getElementById("nextBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const resumeBtn = document.getElementById("resumeBtn");

  startBtn.addEventListener("click", () => {
    const config = getConfigFromUI();

    if (timerEngine) {
      timerEngine.reset();
    }

    timerEngine = new window.TimerEngine(config, {
      onUpdate: (state) => updateUI(state, config.exerciseName)
    });

    timerEngine.start();
  });

  resetBtn.addEventListener("click", () => {
    if (!timerEngine) return;
    timerEngine.reset();
  });

  nextBtn.addEventListener("click", () => {
    if (!timerEngine) return;
    timerEngine.manualNext();
  });

  pauseBtn.addEventListener("click", () => {
    if (!timerEngine) return;
    timerEngine.pause();
  });

  resumeBtn.addEventListener("click", () => {
    if (!timerEngine) return;
    timerEngine.resume();
  });
}

document.addEventListener("DOMContentLoaded", init);
