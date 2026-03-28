import {
  getWorkoutLogs,
  getMealLogs,
  getWellnessLogs,
  getWeeklySummaries,
  generateWeeklySummary
} from "./api.js";

import {
  setStatus,
  requireAuth,
  logout,
  todayIso
} from "./common.js";

const auth = requireAuth();
if (!auth) throw new Error("Unauthorized");

const els = {
  welcomeUser: document.getElementById("welcomeUser"),
  logoutBtn: document.getElementById("logoutBtn"),
  status: document.getElementById("statusMessage"),
  refreshInsightsBtn: document.getElementById("refreshInsightsBtn"),
  generateSummaryBtn: document.getElementById("generateSummaryBtn"),
  summaryText: document.getElementById("summaryText"),
  stressCount: document.getElementById("stressCount"),
  workoutCount: document.getElementById("workoutCount"),
  mealCount: document.getElementById("mealCount"),
  recoveryAvg: document.getElementById("recoveryAvg"),
  stressBar: document.getElementById("stressBar"),
  workoutBar: document.getElementById("workoutBar"),
  mealBar: document.getElementById("mealBar")
};

els.welcomeUser.textContent = `Welcome, ${auth.userName}`;
els.logoutBtn?.addEventListener("click", logout);

function avg(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function barWidth(value, max = 10) {
  const pct = Math.max(10, Math.min(100, Math.round((value / max) * 100)));
  return `${pct}%`;
}

function getCurrentWeekStart() {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? -6 : 1 - day; // make Monday the week start
  today.setDate(today.getDate() + diff);
  return today.toISOString().split("T")[0];
}

async function loadInsights() {
  try {
    setStatus(els.status, "Loading insights...");

    const [workouts, meals, wellness, summaries] = await Promise.all([
      getWorkoutLogs(),
      getMealLogs(),
      getWellnessLogs(),
      getWeeklySummaries()
    ]);

    const userWorkouts = workouts || [];
    const userMeals = meals || [];
    const userWellness = wellness || [];
    const userSummaries = summaries || [];

    const latestSummary = [...userSummaries].sort(
      (a, b) =>
        new Date(b.createdAt || b.weekStartDate || 0) -
        new Date(a.createdAt || a.weekStartDate || 0)
    )[0];

    const avgStress = avg(userWellness.map((x) => Number(x.stressLevel || 0)));
    const avgRecovery = avg(userWellness.map((x) => Number(x.recoveryLevel || 0)));

    els.summaryText.textContent =
      latestSummary?.summaryText ||
      latestSummary?.summary ||
      "No weekly summary yet.";

    els.stressCount.textContent = String(userWellness.length);
    els.workoutCount.textContent = String(userWorkouts.length);
    els.mealCount.textContent = String(userMeals.length);
    els.recoveryAvg.textContent = String(avgRecovery);

    els.stressBar.style.width = barWidth(avgStress, 10);
    els.workoutBar.style.width = barWidth(userWorkouts.length, 7);
    els.mealBar.style.width = barWidth(userMeals.length, 14);

    setStatus(els.status, "Insights loaded.");
  } catch (error) {
    setStatus(els.status, error.message || "Failed to load insights.", true);
  }
}

els.refreshInsightsBtn?.addEventListener("click", loadInsights);

els.generateSummaryBtn?.addEventListener("click", async () => {
  try {
    const weekStartDate = getCurrentWeekStart();
    await generateWeeklySummary(undefined, weekStartDate);
    setStatus(els.status, "Weekly summary generated.");
    await loadInsights();
  } catch (error) {
    setStatus(els.status, error.message || "Failed to generate weekly summary.", true);
  }
});

loadInsights();