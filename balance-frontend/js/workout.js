import {
  createWorkoutLog,
  getWorkoutTypes,
  getWorkoutLogById,
  updateWorkoutLog
} from "./api.js";
import { setStatus, requireAuth, logout, getSelectedDate } from "./common.js";

const auth = requireAuth();
if (!auth) throw new Error("Unauthorized");

const params = new URLSearchParams(window.location.search);
const editId = params.get("edit");
const returnTo = params.get("returnTo") || "workout-entries";

const els = {
  logoutBtn: document.getElementById("logoutBtn"),
  status: document.getElementById("statusMessage"),
  pageTitle: document.getElementById("pageTitle"),
  submitBtn: document.getElementById("submitBtn"),
  backToEntriesLink: document.getElementById("backToEntriesLink"),
  workoutForm: document.getElementById("workoutForm"),
  workoutTypeId: document.getElementById("workoutTypeId"),
  selectedDateDisplay: document.getElementById("selectedDateDisplay"),
  durationMinutes: document.getElementById("durationMinutes"),
  perceivedIntensity: document.getElementById("perceivedIntensity"),
  notes: document.getElementById("notes")
};

els.logoutBtn?.addEventListener("click", logout);
els.backToEntriesLink.href = `./${returnTo}.html`;

function setDefaults() {
  els.selectedDateDisplay.value = getSelectedDate();
}

async function loadWorkoutTypeOptions() {
  const workoutTypes = await getWorkoutTypes();

  els.workoutTypeId.innerHTML = `
    <option value="">Select workout type</option>
    ${workoutTypes.map((type) => `
      <option value="${type.workoutTypeId ?? type.id}">
        ${type.name}
      </option>
    `).join("")}
  `;
}

function mapEffortScore(intensity) {
  const value = String(intensity || "").trim().toLowerCase();
  if (value === "low") return 3;
  if (value === "medium") return 6;
  if (value === "high") return 9;
  return null;
}

function buildWorkoutPayload() {
  const perceivedIntensity = els.perceivedIntensity.value.trim();

  return {
    workoutTypeId: Number(els.workoutTypeId.value),
    eventId: null,
    workoutDate: getSelectedDate(),
    durationMinutes: Number(els.durationMinutes.value),
    perceivedIntensity,
    effortScore: mapEffortScore(perceivedIntensity),
    skipReason: "",
    source: "manual",
    notes: els.notes.value.trim(),
    status: "completed"
  };
}

async function loadEditData() {
  if (!editId) return;

  const item = await getWorkoutLogById(editId);

  els.pageTitle.textContent = "Edit Workout";
  els.submitBtn.textContent = "Update Workout";
  els.selectedDateDisplay.value = String(item.workoutDate || "").slice(0, 10);
  els.workoutTypeId.value = String(item.workoutTypeId ?? "");
  els.durationMinutes.value = item.durationMinutes ?? "";
  els.perceivedIntensity.value = item.perceivedIntensity ?? "";
  els.notes.value = item.notes ?? "";
}

els.workoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const payload = buildWorkoutPayload();

    if (!payload.effortScore) {
      setStatus(els.status, "Please select Low, Medium, or High intensity.", true);
      return;
    }

    if (editId) {
      await updateWorkoutLog(editId, payload);
      setStatus(els.status, "Workout updated.");
    } else {
      await createWorkoutLog(payload);
      setStatus(els.status, "Workout saved.");
    }

    setTimeout(() => {
      window.location.href = `./${returnTo}.html`;
    }, 600);
  } catch (error) {
    setStatus(els.status, error.message || "Failed to save workout.", true);
  }
});

async function initializePage() {
  try {
    setDefaults();
    await loadWorkoutTypeOptions();
    await loadEditData();
  } catch (error) {
    setStatus(els.status, error.message || "Failed to load page.", true);
  }
}

initializePage();