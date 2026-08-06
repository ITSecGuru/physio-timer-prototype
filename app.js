let timerEngine = null;

function getConfigFromUI() {
  const exerciseName = document.getElementById("exerciseName").value || "Exercise";
  const repeats = Number(document.getElementById("repeats").value);
  const sets = Number(document.getElementById("sets").value);
  const moveDurationSec = Number(document.getElementById("moveDuration").value);
  const holdDurationSec = Number(document.getElementById("holdDuration").value);
  const gapDurationSec = Number(document.getElementById("gapDuration").value);
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
    `${state.setProgress * 100}%`;
  document.getElementById("repeatProgressBar").style.width =
    `${state.repeatProgress * 100}%`;
}

function init() {
  document.getElementById("startBtn").addEventListener("click", () => {
    const config = getConfigFromUI();

    if (timerEngine) timerEngine.reset();

    timerEngine = new window.TimerEngine(config, {
      onUpdate: (state) => updateUI(state, config.exerciseName)
    });

    timerEngine.start();
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    if (timerEngine) timerEngine.reset();
  });

  document.getElementById("nextBtn").addEventListener("click", () => {
    if (timerEngine) timerEngine.manualNext();
  });

  document.getElementById("pauseBtn").addEventListener("click", () => {
    if (timerEngine) timerEngine.pause();
  });

  document.getElementById("resumeBtn").addEventListener("click", () => {
    if (timerEngine) timerEngine.resume();
  });
}

document.addEventListener("DOMContentLoaded", init);
