import { setApiBaseUrl, getUserById, getEvents, getWorkoutLogs, getMealLogs, getWellnessLogs } from "./api.js";
import { loadAppState, saveAppState, setStatus, filterByUser, stressClass } from "./common.js";

const els = {
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  userId: document.getElementById("userId"),
  status: document.getElementById("statusMessage"),
  loadDashboardBtn: document.getElementById("loadDashboardBtn"),
  welcomeText: document.getElementById("welcomeText"),
  stressBadge: document.getElementById("stressBadge"),
  workoutSuggestion: document.getElementById("workoutSuggestion"),
  mealSuggestion: document.getElementById("mealSuggestion"),
  eventCount: document.getElementById("eventCount"),
  workoutCount: document.getElementById("workoutCount"),
  mealCount: document.getElementById("mealCount"),
  wellnessCount: document.getElementById("wellnessCount")
};

function setDefaults() {
  const state = loadAppState();
  els.apiBaseUrl.value = state.apiBaseUrl;
  els.userId.value = state.userId;
}

function buildWorkoutGuidance(stressText, latestWellness) {
  const s = String(stressText || "").toLowerCase();
  const energy = latestWellness?.energyLevel ?? null;
  const sleepHours = latestWellness?.sleepHours ?? null;
  if (s.includes("high") || (sleepHours !== null && sleepHours < 6)) return "Active recovery: 20-30 minute walk or easy mobility.";
  if (energy !== null && energy >= 8) return "You look ready for a moderate workout session today.";
  return "Balanced day: short run, brisk walk, or light lifting.";
}

function buildMealGuidance(stressText, latestWellness) {
  const s = String(stressText || "").toLowerCase();
  if (s.includes("high")) return "Complex carbs + protein. Keep meals steady && avoid skipping.";
  if ((latestWellness?.recoveryLevel ?? 0) <= 4) return "Prioritize recovery foods with protein, fluids, && a balanced meal.";
  return "Balanced meal with carbs, protein, && hydration.";
}

async function loadDashboard() {
  try {
    const apiBaseUrl = els.apiBaseUrl.value.trim();
    const userId = els.userId.value.trim();

    saveAppState({ apiBaseUrl, userId });
    setApiBaseUrl(apiBaseUrl);

    const [user, events, workouts, meals, wellness] = await Promise.all([
      getUserById(userId),
      getEvents(userId),
      getWorkoutLogs(userId),
      getMealLogs(userId),
      getWellnessLogs(userId)
    ]);

    const userEvents = events || [];
    const userWorkouts = workouts || [];
    const userMeals = meals || [];
    const userWellness = wellness || [];

    const nearestEvent = [...userEvents].sort(
      (a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0)
    )[0];

    const latestWellness = [...userWellness].sort(
      (a, b) => new Date(b.logDate || 0) - new Date(a.logDate || 0)
    )[0];

    let stressText = "Low";

    if (nearestEvent?.stressLevel) {
      stressText = nearestEvent.stressLevel;
    } else if (latestWellness?.stressLevel != null) {
      const s = latestWellness.stressLevel;
      if (s >= 7) stressText = "High";
      else if (s >= 4) stressText = "Medium";
    }

    els.welcomeText.textContent =
      `Welcome, ${user.name ?? user.email ?? `User ${userId}`}!`;

    els.stressBadge.textContent = stressText;
    els.stressBadge.className = `badge ${stressClass(stressText)}`;

    els.workoutSuggestion.textContent =
      buildWorkoutGuidance(stressText, latestWellness);

    els.mealSuggestion.textContent =
      buildMealGuidance(stressText, latestWellness);

    els.eventCount.textContent = userEvents.length;
    els.workoutCount.textContent = userWorkouts.length;
    els.mealCount.textContent = userMeals.length;
    els.wellnessCount.textContent = userWellness.length;

    setStatus(els.status, "Dashboard loaded.");
  } catch (error) {
    setStatus(els.status, error.message, true);
  }
}

els.loadDashboardBtn.addEventListener("click", loadDashboard);
setDefaults();
