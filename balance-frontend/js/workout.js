import { createWorkoutLog, getWorkoutTypes } from "./api.js";
import { setStatus, todayIso, requireAuth, logout } from "./common.js";

const auth = requireAuth();
if (!auth) throw new Error("Unauthorized");

const els = {
  welcomeUser: document.getElementById("welcomeUser"),
  logoutBtn: document.getElementById("logoutBtn"),
  status: document.getElementById("statusMessage"),
  workoutForm: document.getElementById("workoutForm"),
  workoutTypeId: document.getElementById("workoutTypeId"),
  workoutDate: document.getElementById("workoutDate"),
  durationMinutes: document.getElementById("durationMinutes"),
  perceivedIntensity: document.getElementById("perceivedIntensity"),
  notes: document.getElementById("notes")
};

els.welcomeUser.textContent = `Welcome, ${auth.userName}`;
els.logoutBtn?.addEventListener("click", logout);

function setDefaults() {
  els.workoutDate.value = todayIso();
}

async function loadWorkoutTypeOptions() {
  const workoutTypes = await getWorkoutTypes();

  els.workoutTypeId.innerHTML = `
    <option value="">Select workout type</option>
    ${workoutTypes
      .map(
        (type) => `
      <option value="${type.workoutTypeId ?? type.id}">
        ${type.name}
      </option>
    `
      )
      .join("")}
  `;
}

function buildWorkoutPayload() {
  return {
    workoutTypeId: Number(els.workoutTypeId.value),
    eventId: null,
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
    const payload = buildWorkoutPayload();
    await createWorkoutLog(payload);

    setStatus(els.status, "Workout saved.");
    els.workoutForm.reset();
    els.workoutDate.value = todayIso();
    await loadWorkoutTypeOptions();
  } catch (error) {
    setStatus(els.status, error.message || "Failed to save workout.", true);
  }
});

async function initializePage() {
  try {
    setDefaults();
    await loadWorkoutTypeOptions();
  } catch (error) {
    setStatus(els.status, error.message || "Failed to load page.", true);
  }
}

initializePage();