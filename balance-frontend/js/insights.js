import {
  getWorkoutLogs,
  getMealLogs,
  getWellnessLogs,
  getWeeklySummaries,
  generateWeeklySummary
} from "./api.js";

import {
  requireAuth,
  logout,
  getSelectedDate
} from "./common.js";

const auth = requireAuth();
if (!auth) throw new Error("Unauthorized");

const els = {
  logoutBtn: document.getElementById("logoutBtn"),
  status: document.getElementById("statusMessage"),
  latestReportBtn: document.getElementById("latestReportBtn"),
  summaryText: document.getElementById("summaryText"),

  stressBar: document.getElementById("stressBar"),
  workoutBar: document.getElementById("workoutBar"),
  mealBar: document.getElementById("mealBar"),

  stressTrack: document.getElementById("stressTrack"),
  workoutTrack: document.getElementById("workoutTrack"),
  mealTrack: document.getElementById("mealTrack"),

  stressHoverValue: document.getElementById("stressHoverValue"),
  workoutHoverValue: document.getElementById("workoutHoverValue"),
  mealHoverValue: document.getElementById("mealHoverValue")
};

els.logoutBtn?.addEventListener("click", logout);

function setInsightStatus(message, type = "loading") {
  if (!els.status) return;

  els.status.textContent = message;
  els.status.className = "status-banner";

  if (type === "success") {
    els.status.classList.add("status-success");
  } else if (type === "error") {
    els.status.classList.add("status-error");
  } else {
    els.status.classList.add("status-loading");
  }
}

function parseLocalDate(dateString) {
  const [year, month, day] = String(dateString || "")
    .slice(0, 10)
    .split("-")
    .map(Number);

  return new Date(year, (month || 1) - 1, day || 1);
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekRange(selectedDate) {
  const date = parseLocalDate(selectedDate);
  const day = date.getDay();

  const start = new Date(date);
  start.setDate(date.getDate() - day);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start,
    end,
    weekStartDate: toIsoDate(start),
    weekEndDate: toIsoDate(end)
  };
}

function isDateInRange(value, start, end) {
  const dateText = String(value || "").slice(0, 10);
  if (!dateText) return false;

  const date = parseLocalDate(dateText);
  return date >= start && date <= end;
}

function isSameDate(value, targetDate) {
  return String(value || "").slice(0, 10) === String(targetDate || "").slice(0, 10);
}

function barWidth(value, maxValue) {
  if (maxValue <= 0) return "10%";
  const percent = Math.round((value / maxValue) * 100);
  return `${Math.max(10, Math.min(100, percent))}%`;
}

function updateTrendBar(barEl, trackEl, valueEl, value, label, maxValue) {
  if (barEl) {
    barEl.style.width = barWidth(value, maxValue);
  }

  if (valueEl) {
    valueEl.textContent = String(value);
  }

  if (trackEl) {
    trackEl.title = `${label}: ${value}`;
    trackEl.setAttribute("aria-label", `${label}: ${value}`);
  }
}

async function loadInsights() {
  try {
    setInsightStatus("Loading insights...", "loading");

    const selectedDate = getSelectedDate();
    const { start, end, weekStartDate } = getWeekRange(selectedDate);

    const [workouts, meals, wellness, summaries] = await Promise.all([
      getWorkoutLogs(),
      getMealLogs(),
      getWellnessLogs(),
      getWeeklySummaries()
    ]);

    const weeklyWorkouts = (workouts || []).filter((item) =>
      isDateInRange(item.workoutDate, start, end)
    );

    const weeklyMeals = (meals || []).filter((item) =>
      isDateInRange(item.mealDate, start, end)
    );

    const weeklyWellness = (wellness || []).filter((item) =>
      isDateInRange(item.logDate, start, end)
    );

    const weeklySummary = (summaries || []).find((item) =>
      isSameDate(item.weekStartDate, weekStartDate)
    );

    els.summaryText.textContent =
      weeklySummary?.summaryText ||
      weeklySummary?.summary ||
      "No weekly summary entry found for the selected week.";

    const stressCount = weeklyWellness.length;
    const workoutCount = weeklyWorkouts.length;
    const mealCount = weeklyMeals.length;
    const maxCount = Math.max(stressCount, workoutCount, mealCount, 1);

    updateTrendBar(
      els.stressBar,
      els.stressTrack,
      els.stressHoverValue,
      stressCount,
      "Stress Logs",
      maxCount
    );

    updateTrendBar(
      els.workoutBar,
      els.workoutTrack,
      els.workoutHoverValue,
      workoutCount,
      "Workouts",
      maxCount
    );

    updateTrendBar(
      els.mealBar,
      els.mealTrack,
      els.mealHoverValue,
      mealCount,
      "Meals",
      maxCount
    );

    setInsightStatus("Insights loaded.", "success");
  } catch (error) {
    setInsightStatus(error.message || "Failed to load insights.", "error");
  }
}

els.latestReportBtn?.addEventListener("click", async () => {
  try {
    const selectedDate = getSelectedDate();
    const { weekStartDate } = getWeekRange(selectedDate);

    setInsightStatus("Generating latest report...", "loading");
    await generateWeeklySummary(undefined, weekStartDate);
    await loadInsights();
    setInsightStatus("Latest report generated.", "success");
  } catch (error) {
    setInsightStatus(error.message || "Failed to generate latest report.", "error");
  }
});

loadInsights();