import {
  getCurrentUser,
  getEvents,
  getWorkoutLogs,
  getMealLogs,
  getWellnessLogs
} from "./api.js";

import {
  setStatus,
  stressClass,
  requireAuth,
  logout
} from "./common.js";

const auth = requireAuth();
if (!auth) throw new Error("Unauthorized");

const els = {
  status: document.getElementById("statusMessage"),
  loadDashboardBtn: document.getElementById("loadDashboardBtn"),
  welcomeUser: document.getElementById("welcomeUser"),
  welcomeText: document.getElementById("welcomeText"),
  stressBadge: document.getElementById("stressBadge"),
  workoutSuggestion: document.getElementById("workoutSuggestion"),
  mealSuggestion: document.getElementById("mealSuggestion"),
  eventCount: document.getElementById("eventCount"),
  workoutCount: document.getElementById("workoutCount"),
  mealCount: document.getElementById("mealCount"),
  wellnessCount: document.getElementById("wellnessCount"),
  logoutBtn: document.getElementById("logoutBtn")
};

els.welcomeUser.textContent = `Welcome, ${auth.userName}`;
els.logoutBtn?.addEventListener("click", logout);

function buildWorkoutGuidance(stressText, latestWellness) {
  const s = String(stressText || "").toLowerCase();
  const energy = latestWellness?.energyLevel ?? null;
  const sleepHours = latestWellness?.sleepHours ?? null;

  if (s.includes("high") || (sleepHours !== null && sleepHours < 6)) {
    return "Active recovery: 20-30 minute walk or easy mobility.";
  }

  if (energy !== null && energy >= 8) {
    return "You look ready for a moderate workout session today.";
  }

  return "Balanced day: short run, brisk walk, or light lifting.";
}

function buildMealGuidance(stressText, latestWellness) {
  const s = String(stressText || "").toLowerCase();

  if (s.includes("high")) {
    return "Complex carbs + protein. Keep meals steady and avoid skipping.";
  }

  if ((latestWellness?.recoveryLevel ?? 0) <= 4) {
    return "Prioritize recovery foods with protein, fluids, and a balanced meal.";
  }

  return "Balanced meal with carbs, protein, and hydration.";
}

function getDisplayName(user) {
  if (user?.firstName) return user.firstName;
  if (user?.email) return user.email;
  return `User ${auth.userId}`;
}

function deriveStressText(nearestEvent, latestWellness) {
  if (nearestEvent?.stressLevel) {
    return nearestEvent.stressLevel;
  }

  if (latestWellness?.stressLevel != null) {
    const s = latestWellness.stressLevel;
    if (s >= 7) return "High";
    if (s >= 4) return "Medium";
  }

  return "Low";
}

async function loadDashboard() {
  try {
    setStatus(els.status, "Loading dashboard...");

    const [user, events, workouts, meals, wellness] = await Promise.all([
      getCurrentUser(),
      getEvents(),
      getWorkoutLogs(),
      getMealLogs(),
      getWellnessLogs()
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

    const stressText = deriveStressText(nearestEvent, latestWellness);

    els.welcomeText.textContent = `Welcome, ${getDisplayName(user)}!`;
    els.stressBadge.textContent = stressText;
    els.stressBadge.className = `badge ${stressClass(stressText)}`;

    els.workoutSuggestion.textContent = buildWorkoutGuidance(stressText, latestWellness);
    els.mealSuggestion.textContent = buildMealGuidance(stressText, latestWellness);

    els.eventCount.textContent = userEvents.length;
    els.workoutCount.textContent = userWorkouts.length;
    els.mealCount.textContent = userMeals.length;
    els.wellnessCount.textContent = userWellness.length;

    setStatus(els.status, "Dashboard loaded.");
  } catch (error) {
    setStatus(els.status, error.message || "Failed to load dashboard.", true);
  }
}

els.loadDashboardBtn?.addEventListener("click", loadDashboard);

loadDashboard();