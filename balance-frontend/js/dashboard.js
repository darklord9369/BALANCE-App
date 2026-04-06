import {
  getCurrentUser,
  getEvents,
  getWorkoutLogs,
  getMealLogs,
  getWellnessLogs,
  generateDailyGuidance
} from "./api.js";

import {
  setStatus,
  stressClass,
  requireAuth,
  logout,
  getSelectedDate,
  saveSelectedDate
} from "./common.js";

const auth = requireAuth();
if (!auth) throw new Error("Unauthorized");

const els = {
  status: document.getElementById("statusMessage"),
  welcomeText: document.getElementById("welcomeText"),
  stressBadge: document.getElementById("stressBadge"),
  workoutSuggestion: document.getElementById("workoutSuggestion"),
  mealSuggestion: document.getElementById("mealSuggestion"),
  completedWorkoutList: document.getElementById("completedWorkoutList"),
  completedMealList: document.getElementById("completedMealList"),
  guidanceSummary: document.getElementById("guidanceSummary"),
  eventCount: document.getElementById("eventCount"),
  workoutCount: document.getElementById("workoutCount"),
  mealCount: document.getElementById("mealCount"),
  wellnessCount: document.getElementById("wellnessCount"),
  logoutBtn: document.getElementById("logoutBtn"),
  selectedDate: document.getElementById("selectedDate")
};

els.logoutBtn?.addEventListener("click", logout);

function getTodayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ensureSelectedDate() {
  let selectedDateValue = getSelectedDate();

  if (
    !selectedDateValue ||
    typeof selectedDateValue !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(selectedDateValue)
  ) {
    selectedDateValue = getTodayLocalDate();
    saveSelectedDate(selectedDateValue);
  }

  if (els.selectedDate) {
    els.selectedDate.value = selectedDateValue;
  }

  return selectedDateValue;
}

function normalizeDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateOnly(value) {
  if (!value) return null;
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  return new Date(year, month, day);
}

function isSameDay(dateValue, selectedDateValue) {
  const left = parseDateOnly(normalizeDateInputValue(dateValue));
  const right = parseDateOnly(normalizeDateInputValue(selectedDateValue));
  if (!left || !right) return false;

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isEventActiveOnDate(event, selectedDateValue) {
  const selected = parseDateOnly(selectedDateValue);
  if (!selected) return false;

  const start = parseDateOnly(normalizeDateInputValue(event.startDate));
  const end = parseDateOnly(normalizeDateInputValue(event.endDate));

  if (!start || !end) return false;

  return selected >= start && selected <= end;
}

function formatPlanLines(lines, fallbackText) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return fallbackText;
  }

  return lines.map(item => `• ${item}`).join("\n");
}

function renderCompletedList(listEl, items, emptyText) {
  if (!listEl) return;

  if (!Array.isArray(items) || items.length === 0) {
    listEl.innerHTML = `<li class="empty-state">${escapeHtml(emptyText)}</li>`;
    return;
  }

  listEl.innerHTML = items
    .map(item => {
      const title = item.title || "Completed item";
      const meta = item.timeLabel || item.typeLabel || "Logged today";

      return `
        <li class="completed-mini-item">
          <span class="completed-mini-name">${escapeHtml(title)}</span>
          <span class="completed-mini-meta">${escapeHtml(meta)}</span>
        </li>
      `;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderStressLevel(selectedDateValue, wellnessLogs, events) {
  const activeEvents = Array.isArray(events)
    ? events.filter(event => isEventActiveOnDate(event, selectedDateValue))
    : [];

  if (activeEvents.length === 0) {
    els.stressBadge.textContent = "Low";
    els.stressBadge.className = "badge badge-low";
    return;
  }

  if (!Array.isArray(wellnessLogs) || wellnessLogs.length === 0) {
    els.stressBadge.textContent = "Medium";
    els.stressBadge.className = "badge badge-medium";
    return;
  }

  const selectedDayLogs = wellnessLogs.filter(log =>
    isSameDay(log.logDate || log.date, selectedDateValue)
  );

  if (selectedDayLogs.length === 0) {
    els.stressBadge.textContent = "Medium";
    els.stressBadge.className = "badge badge-medium";
    return;
  }

  const latest = selectedDayLogs[0];
  const stressValue = latest?.stressLevel;

  let label = "Medium";

  if (typeof stressValue === "number") {
    if (stressValue <= 3) label = "Low";
    else if (stressValue <= 6) label = "Medium";
    else label = "High";
  } else if (typeof stressValue === "string") {
    label = stressValue;
  }

  els.stressBadge.textContent = label;
  els.stressBadge.className = `badge ${stressClass(label)}`;
}

async function loadDashboard() {
  try {
    const selectedDateValue = ensureSelectedDate();

    setStatus(els.status, "Loading dashboard guidance...");

    const [user, events, workoutLogs, mealLogs, wellnessLogs, guidance] = await Promise.all([
      getCurrentUser(),
      getEvents(),
      getWorkoutLogs(),
      getMealLogs(),
      getWellnessLogs(),
      generateDailyGuidance(selectedDateValue)
    ]);

    const firstName =
      user?.firstName ||
      user?.FirstName ||
      auth?.userName ||
      "User";

    els.welcomeText.textContent = `Welcome, ${firstName}!`;

    renderStressLevel(selectedDateValue, wellnessLogs, events);

    els.workoutSuggestion.textContent = formatPlanLines(
      guidance?.workout?.currentPlan,
      "No workout guidance available."
    );

    els.mealSuggestion.textContent = formatPlanLines(
      guidance?.meals?.currentPlan,
      "No meal guidance available."
    );

    renderCompletedList(
      els.completedWorkoutList,
      guidance?.workout?.completed,
      "No workouts logged yet."
    );

    renderCompletedList(
      els.completedMealList,
      guidance?.meals?.completed,
      "No meals logged yet."
    );

    els.guidanceSummary.textContent =
      guidance?.summary ||
      "Your guidance is based on your selected date, recent logs, and upcoming events.";

    setStatus(els.status, "Dashboard loaded.", false);
  } catch (error) {
    console.error(error);
    setStatus(els.status, error.message || "Unable to load dashboard.", true);
  }
}

function initSelectedDate() {
  ensureSelectedDate();

  if (els.selectedDate) {
    els.selectedDate.addEventListener("change", async event => {
      const newDate = event.target.value;
      if (!newDate) return;
      saveSelectedDate(newDate);
      await loadDashboard();
    });
  }
}

window.addEventListener("storage", event => {
  if (event.key === "dashboardNeedsRefresh") {
    loadDashboard();
  }
});

function initCompletedPopovers() {
  const toggleButtons = document.querySelectorAll(".history-toggle");

  toggleButtons.forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();

      const targetId = button.dataset.target;
      const popover = document.getElementById(targetId);
      if (!popover) return;

      document.querySelectorAll(".completed-popover.open").forEach(el => {
        if (el !== popover) el.classList.remove("open");
      });

      popover.classList.toggle("open");
    });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".completed-popover.open").forEach(el => {
      el.classList.remove("open");
    });
  });
}

initCompletedPopovers();
initSelectedDate();
loadDashboard();