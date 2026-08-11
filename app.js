let timerEngine = null;

const EXERCISE_STORAGE_KEY = "physioTimer.exercises";
const COMPLETION_STORAGE_KEY = "physioTimer.completions";
const COMPLETION_RETENTION_DAYS = 30;
const DEFAULT_EXERCISES = ["Squat", "Supine Bridge", "Knee Extension", "Sit to Stand", "Leg Curl"];

function normalizeExerciseName(name) {
  return name.trim().replace(/\s+/g, " ");
}

function loadExercises() {
  try {
    const stored = JSON.parse(localStorage.getItem(EXERCISE_STORAGE_KEY) || "null");
    if (Array.isArray(stored) && stored.length > 0) {
      return [...new Set(stored.map((exercise) => normalizeExerciseName(String(exercise))).filter(Boolean))];
    }
  } catch (error) {
    console.warn("Unable to load exercise list", error);
  }

  return [...DEFAULT_EXERCISES];
}

function saveExercises(exercises) {
  localStorage.setItem(EXERCISE_STORAGE_KEY, JSON.stringify(exercises));
}

function loadCompletions() {
  try {
    const stored = JSON.parse(localStorage.getItem(COMPLETION_STORAGE_KEY) || "null");
    if (Array.isArray(stored)) {
      const cutoffTime = Date.now() - (COMPLETION_RETENTION_DAYS * 24 * 60 * 60 * 1000);
      const filtered = stored.filter((entry) => {
        if (!entry || !entry.name || !entry.timestamp) return false;
        const entryTime = Date.parse(entry.timestamp);
        return Number.isFinite(entryTime) && entryTime >= cutoffTime;
      });

      if (filtered.length !== stored.length) {
        saveCompletions(filtered);
      }

      return filtered;
    }
  } catch (error) {
    console.warn("Unable to load completion history", error);
  }

  return [];
}

function saveCompletions(completions) {
  localStorage.setItem(COMPLETION_STORAGE_KEY, JSON.stringify(completions));
}

function refreshExerciseControls(selectedExercise) {
  const resolvedSelection = renderExerciseOptions(selectedExercise);
  renderExerciseManagement();
  return resolvedSelection;
}

function renderExerciseOptions(selectedExercise) {
  const select = document.getElementById("exerciseName");
  const exercises = loadExercises();

  select.innerHTML = "";

  exercises.forEach((exercise) => {
    const option = document.createElement("option");
    option.value = exercise;
    option.textContent = exercise;
    select.appendChild(option);
  });

  const resolvedSelection = exercises.includes(selectedExercise) ? selectedExercise : exercises[0] || "";
  if (resolvedSelection) {
    select.value = resolvedSelection;
  }

  return resolvedSelection;
}

function renderExerciseManagement() {
  const exercises = loadExercises();
  const list = document.getElementById("exerciseList");
  const emptyState = document.getElementById("exerciseListEmpty");

  list.innerHTML = "";

  if (exercises.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  exercises.forEach((exercise) => {
    const item = document.createElement("li");
    const label = document.createElement("span");
    const removeButton = document.createElement("button");

    label.textContent = exercise;
    removeButton.type = "button";
    removeButton.className = "secondary-btn exercise-remove-btn";
    removeButton.textContent = "Delete";
    removeButton.disabled = exercises.length === 1;
    removeButton.title = exercises.length === 1 ? "Keep at least one saved exercise" : "Remove this exercise";

    removeButton.addEventListener("click", () => {
      const currentSelection = document.getElementById("exerciseName").value;
      if (removeExerciseFromList(exercise)) {
        refreshExerciseControls(currentSelection === exercise ? "" : currentSelection);
      }
    });

    item.appendChild(label);
    item.appendChild(removeButton);
    list.appendChild(item);
  });
}

function addExerciseToList(exerciseName) {
  const name = normalizeExerciseName(exerciseName);
  if (!name) return null;

  const exercises = loadExercises();
  if (!exercises.includes(name)) {
    exercises.push(name);
    exercises.sort((left, right) => left.localeCompare(right));
    saveExercises(exercises);
  }

  refreshExerciseControls(name);
  document.getElementById("newExerciseName").value = "";
  return name;
}

function removeExerciseFromList(exerciseName) {
  const name = normalizeExerciseName(exerciseName);
  const exercises = loadExercises();

  if (exercises.length <= 1) {
    return false;
  }

  const nextExercises = exercises.filter((exercise) => exercise !== name);
  if (nextExercises.length === exercises.length) {
    return false;
  }

  saveExercises(nextExercises);
  return true;
}

function renderCompletionHistory() {
  const completions = loadCompletions();
  const list = document.getElementById("completionHistory");
  const emptyState = document.getElementById("completionHistoryEmpty");

  list.innerHTML = "";

  if (completions.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  completions.slice().reverse().forEach((entry) => {
    const item = document.createElement("li");
    const completedAt = new Date(entry.timestamp);

    item.textContent = `${completedAt.toLocaleDateString()} ${completedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${entry.name}`;
    list.appendChild(item);
  });
}

function recordCompletion(exerciseName) {
  const completions = loadCompletions();
  completions.push({
    name: normalizeExerciseName(exerciseName),
    timestamp: new Date().toISOString()
  });

  saveCompletions(completions);
  renderCompletionHistory();
}

function purgeCompletionHistory() {
  localStorage.removeItem(COMPLETION_STORAGE_KEY);
  renderCompletionHistory();
}

function formatCompletionValue(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`
  };
}

function escapeCsvValue(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function buildCompletionCsv(completions) {
  const rows = ["date,time,exerciseName"];

  completions.forEach((entry) => {
    const formatted = formatCompletionValue(entry.timestamp);
    rows.push([
      escapeCsvValue(formatted.date),
      escapeCsvValue(formatted.time),
      escapeCsvValue(entry.name)
    ].join(","));
  });

  return rows.join("\n");
}

function downloadTextFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(objectUrl);
}

function exportCompletionHistory() {
  const completions = loadCompletions();
  if (completions.length === 0) {
    return;
  }

  const csv = buildCompletionCsv(completions);
  const exportDate = formatCompletionValue(new Date().toISOString()).date;
  downloadTextFile(csv, `physio-timer-completions-${exportDate}.csv`, "text/csv;charset=utf-8");
}

function getConfigFromUI() {
  const selectedExercise = normalizeExerciseName(document.getElementById("exerciseName").value || "");
  const typedExercise = normalizeExerciseName(document.getElementById("newExerciseName").value || "");
  const exerciseName = addExerciseToList(typedExercise || selectedExercise) || selectedExercise || "Exercise";
  const repeats = Number(document.getElementById("repeats").value) || 10;
  const sets = Number(document.getElementById("sets").value) || 2;
  const moveDurationSec = Number(document.getElementById("moveDuration").value) || 3;
  const holdDurationSec = Number(document.getElementById("holdDuration").value) || 0;
  const gapDurationSec = Number(document.getElementById("gapDuration").value) || 3;
  const adaptiveGap = document.getElementById("adaptiveGap").checked;
  const audioEnabled = document.getElementById("audioEnabled").checked;
  const languageMode = document.getElementById("languageMode").value;

  window.audioEngine.setAudioEnabled(audioEnabled);
  window.audioEngine.setLanguageMode(languageMode);

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
  const addExerciseBtn = document.getElementById("addExerciseBtn");
  const exportHistoryBtn = document.getElementById("exportHistoryBtn");
  const purgeHistoryBtn = document.getElementById("purgeHistoryBtn");

  refreshExerciseControls("Knee Extension");
  renderCompletionHistory();

  addExerciseBtn.addEventListener("click", () => {
    const newExerciseName = document.getElementById("newExerciseName").value;
    const savedExercise = addExerciseToList(newExerciseName);

    if (savedExercise) {
      document.getElementById("exerciseName").value = savedExercise;
    }
  });

  document.getElementById("exerciseName").addEventListener("change", (event) => {
    document.getElementById("newExerciseName").value = "";
    addExerciseToList(event.target.value);
  });

  exportHistoryBtn.addEventListener("click", () => {
    exportCompletionHistory();
  });

  purgeHistoryBtn.addEventListener("click", () => {
    purgeCompletionHistory();
  });

  startBtn.addEventListener("click", () => {
    const config = getConfigFromUI();

    if (timerEngine) timerEngine.reset();

    timerEngine = new window.TimerEngine(config, {
      onUpdate: (state) => updateUI(state, config.exerciseName),
      onComplete: () => recordCompletion(config.exerciseName)
    });

    timerEngine.start();
  });

  resetBtn.addEventListener("click", () => {
    if (timerEngine) timerEngine.reset();
  });

  nextBtn.addEventListener("click", () => {
    if (timerEngine) timerEngine.manualNext();
  });

  pauseBtn.addEventListener("click", () => {
    if (timerEngine) timerEngine.pause();
  });

  resumeBtn.addEventListener("click", () => {
    if (timerEngine) timerEngine.resume();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Ensure voices are loaded before first speak
  if ("speechSynthesis" in window) {
    speechSynthesis.onvoiceschanged = () => {};
  }

  init();
});
