import { setApiBaseUrl, createWorkoutLog, getWorkoutTypes } from "./api.js";
import { loadAppState, saveAppState, setStatus, todayIso } from "./common.js";

const els = {
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  userId: document.getElementById("userId"),
  status: document.getElementById("statusMessage"),
  workoutForm: document.getElementById("workoutForm"),
  workoutTypeId: document.getElementById("workoutTypeId"),
  workoutDate: document.getElementById("workoutDate"),
  durationMinutes: document.getElementById("durationMinutes"),
  perceivedIntensity: document.getElementById("perceivedIntensity"),
  notes: document.getElementById("notes")
};

function setDefaults() {
  const state = loadAppState();
  els.apiBaseUrl.value = state.apiBaseUrl;
  els.userId.value = state.userId;
  els.workoutDate.value = todayIso();
}

async function loadWorkoutTypeOptions() {
  const apiBaseUrl = els.apiBaseUrl.value.trim();
  setApiBaseUrl(apiBaseUrl);

  const workoutTypes = await getWorkoutTypes();

  els.workoutTypeId.innerHTML = `
    <option value="">Select workout type</option>
    ${workoutTypes.map(type => `
      <option value="${type.workoutTypeId ?? type.id}">
        ${type.name}
      </option>
    `).join("")}
  `;
}

function buildWorkoutPayload(userId) {
  return {
    userId,
    workoutTypeId: Number(els.workoutTypeId.value),
    eventId: 0,
    workoutDate: els.workoutDate.value,
    durationMinutes: Number(els.durationMinutes.value),
    perceivedIntensity: els.perceivedIntensity.value.trim(),
    effortScore: 0,
    skipReason: "",
    source: "manual",
    notes: els.notes.value.trim(),
    status: "completed"
  };
}

els.workoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const apiBaseUrl = els.apiBaseUrl.value.trim();
    const userId = Number(els.userId.value.trim());

    saveAppState({ apiBaseUrl, userId });
    setApiBaseUrl(apiBaseUrl);

    const payload = buildWorkoutPayload(userId);
    await createWorkoutLog(payload);

    setStatus(els.status, "Workout saved.");
    els.workoutForm.reset();
    els.workoutDate.value = todayIso();

    await loadWorkoutTypeOptions();
  } catch (error) {
    setStatus(els.status, error.message, true);
  }
});

async function initializePage() {
  try {
    setDefaults();
    await loadWorkoutTypeOptions();
  } catch (error) {
    setStatus(els.status, error.message, true);
  }
}

initializePage();