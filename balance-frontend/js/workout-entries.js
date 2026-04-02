import { getWorkoutLogs, deleteWorkoutLog } from "./api.js";
import { requireAuth, logout, setStatus, getSelectedDate } from "./common.js";

const auth = requireAuth();
if (!auth) throw new Error("Unauthorized");

const els = {
  logoutBtn: document.getElementById("logoutBtn"),
  status: document.getElementById("statusMessage"),
  selectedDateDisplay: document.getElementById("selectedDateDisplay"),
  tableBody: document.getElementById("workoutTableBody")
};

els.logoutBtn?.addEventListener("click", logout);

function isSameDate(value, selectedDate) {
  return String(value || "").slice(0, 10) === selectedDate;
}

function renderRows(items) {
  if (!items.length) {
    els.tableBody.innerHTML = `
      <tr>
        <td colspan="4">No workouts found for this day.</td>
      </tr>
    `;
    return;
  }

  els.tableBody.innerHTML = items.map((item) => `
    <tr>
      <td>${item.workoutTypeName ?? ""}</td>
      <td>${item.durationMinutes ?? ""}</td>
      <td>${item.perceivedIntensity ?? ""}</td>
      <td class="action-cell">
        <button type="button" class="table-action icon-btn edit-btn" data-id="${item.workoutLogId}" title="Edit" aria-label="Edit">
          ✎
        </button>
        <button type="button" class="table-action icon-btn delete-btn" data-id="${item.workoutLogId}" title="Delete" aria-label="Delete">
          ✕
        </button>
      </td>
    </tr>
  `).join("");
}

async function loadEntries() {
  try {
    const selectedDate = getSelectedDate();

    if (els.selectedDateDisplay) {
      els.selectedDateDisplay.value = selectedDate;
    }

    const workouts = await getWorkoutLogs();
    const dayWorkouts = (workouts || []).filter((item) =>
      isSameDate(item.workoutDate, selectedDate)
    );

    renderRows(dayWorkouts);
  } catch (error) {
    setStatus(els.status, error.message || "Failed to load workouts.", true);
  }
}

els.tableBody?.addEventListener("click", async (event) => {
  const editBtn = event.target.closest(".edit-btn");
  const deleteBtn = event.target.closest(".delete-btn");

  if (editBtn) {
    const id = editBtn.dataset.id;
    window.location.href = `./workout.html?edit=${id}&returnTo=workout-entries`;
    return;
  }

  if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    const confirmed = window.confirm("Delete this workout?");
    if (!confirmed) return;

    try {
      await deleteWorkoutLog(id);
      setStatus(els.status, "Workout deleted.");
      await loadEntries();
    } catch (error) {
      setStatus(els.status, error.message || "Failed to delete workout.", true);
    }
  }
});

loadEntries();