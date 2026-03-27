import { setApiBaseUrl, getWorkoutLogs, getMealLogs, getWellnessLogs, getWeeklySummaries, generateWeeklySummary } from "./api.js";
import { loadAppState, saveAppState, setStatus, filterByUser } from "./common.js";

const els = {
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  userId: document.getElementById("userId"),
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

function setDefaults() {
  const state = loadAppState();
  els.apiBaseUrl.value = state.apiBaseUrl;
  els.userId.value = state.userId;
}

function avg(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function barWidth(value, max = 10) {
  const pct = Math.max(10, Math.min(100, Math.round((value / max) * 100)));
  return `${pct}%`;
}

async function loadInsights() {
  try {
    const apiBaseUrl = els.apiBaseUrl.value.trim();
    const userId = els.userId.value.trim();
    saveAppState({ apiBaseUrl, userId });
    setApiBaseUrl(apiBaseUrl);

    const [workouts, meals, wellness, summaries] = await Promise.all([
      getWorkoutLogs(), getMealLogs(), getWellnessLogs(), getWeeklySummaries()
    ]);

    const userWorkouts = filterByUser(workouts, userId);
    const userMeals = filterByUser(meals, userId);
    const userWellness = filterByUser(wellness, userId);
    const userSummaries = filterByUser(summaries, userId);

    const latestSummary = [...userSummaries].sort((a, b) => new Date(b.createdAt || b.weekStart || 0) - new Date(a.createdAt || a.weekStart || 0))[0];
    const avgStress = avg(userWellness.map(x => Number(x.stressLevel || 0)));
    const avgRecovery = avg(userWellness.map(x => Number(x.recoveryLevel || 0)));

    els.summaryText.textContent = latestSummary?.summaryText || latestSummary?.summary || "No weekly summary yet.";
    els.stressCount.textContent = String(userWellness.length);
    els.workoutCount.textContent = String(userWorkouts.length);
    els.mealCount.textContent = String(userMeals.length);
    els.recoveryAvg.textContent = String(avgRecovery);
    els.stressBar.style.width = barWidth(avgStress, 10);
    els.workoutBar.style.width = barWidth(userWorkouts.length, 7);
    els.mealBar.style.width = barWidth(userMeals.length, 14);

    setStatus(els.status, "Insights loaded.");
  } catch (error) {
    setStatus(els.status, error.message, true);
  }
}

els.refreshInsightsBtn.addEventListener("click", loadInsights);
els.generateSummaryBtn.addEventListener("click", async () => {
  try {
    const apiBaseUrl = els.apiBaseUrl.value.trim();
    const userId = Number(els.userId.value.trim());
    saveAppState({ apiBaseUrl, userId });
    setApiBaseUrl(apiBaseUrl);
    await generateWeeklySummary({ userId });
    setStatus(els.status, "Weekly summary generated.");
    await loadInsights();
  } catch (error) {
    setStatus(els.status, error.message, true);
  }
});

setDefaults();
