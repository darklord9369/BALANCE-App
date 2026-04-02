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
  eventCount: document.getElementById("eventCount"),
  workoutCount: document.getElementById("workoutCount"),
  mealCount: document.getElementById("mealCount"),
  wellnessCount: document.getElementById("wellnessCount"),
  logoutBtn: document.getElementById("logoutBtn"),
  selectedDate: document.getElementById("selectedDate")
};

els.logoutBtn?.addEventListener("click", logout);

function syncSelectedDateInput() {
  if (els.selectedDate) {
    els.selectedDate.value = getSelectedDate();
  }
}

if (els.selectedDate) {
  syncSelectedDateInput();

  els.selectedDate.addEventListener("change", async () => {
    const newDate = els.selectedDate.value || getSelectedDate();
    saveSelectedDate(newDate);
    syncSelectedDateInput();
    await loadDashboard();
  });
}

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
  if (auth?.userName) return auth.userName;
  return `User ${auth.userId}`;
}

function deriveStressText(nearestEvent, latestWellness) {
  if (nearestEvent?.stressLevel) return nearestEvent.stressLevel;

  if (latestWellness?.stressLevel != null) {
    const s = latestWellness.stressLevel;
    if (s >= 7) return "High";
    if (s >= 4) return "Medium";
  }

  return "Low";
}

function isSameDate(value, selectedDate) {
  return String(value || "").slice(0, 10) === selectedDate;
}

function isEventActiveOnDate(event, selectedDate) {
  const start = String(event?.startDate || "").slice(0, 10);
  const end = String(event?.endDate || "").slice(0, 10);

  if (!start || !end) return false;

  return start <= selectedDate && end >= selectedDate;
}

async function loadDashboard() {
  try {
    const selectedDate = getSelectedDate();
    syncSelectedDateInput();

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

    const dayEvents = userEvents.filter((event) =>
      isEventActiveOnDate(event, selectedDate)
    );

    const dayWorkouts = userWorkouts.filter((workout) =>
      isSameDate(workout.workoutDate, selectedDate)
    );

    const dayMeals = userMeals.filter((meal) =>
      isSameDate(meal.mealDate, selectedDate)
    );

    const dayWellness = userWellness.filter((entry) =>
      isSameDate(entry.logDate, selectedDate)
    );

    const nearestEvent = [...dayEvents].sort(
      (a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0)
    )[0];

    const latestWellness = [...dayWellness].sort(
      (a, b) => new Date(b.logDate || 0) - new Date(a.logDate || 0)
    )[0];

    const stressText = deriveStressText(nearestEvent, latestWellness);

    if (els.welcomeText) {
      els.welcomeText.textContent = `Welcome, ${getDisplayName(user)}!`;
    }

    if (els.stressBadge) {
      els.stressBadge.textContent = stressText;
      els.stressBadge.className = `badge ${stressClass(stressText)}`;
    }

    if (els.workoutSuggestion) {
      els.workoutSuggestion.textContent = buildWorkoutGuidance(stressText, latestWellness);
    }

    if (els.mealSuggestion) {
      els.mealSuggestion.textContent = buildMealGuidance(stressText, latestWellness);
    }

    if (els.eventCount) {
      els.eventCount.textContent = dayEvents.length;
    }

    if (els.workoutCount) {
      els.workoutCount.textContent = dayWorkouts.length;
    }

    if (els.mealCount) {
      els.mealCount.textContent = dayMeals.length;
    }

    if (els.wellnessCount) {
      els.wellnessCount.textContent = dayWellness.length;
    }

    setStatus(els.status, "Dashboard loaded.");
  } catch (error) {
    setStatus(els.status, error.message || "Failed to load dashboard.", true);
  }
}

loadDashboard();