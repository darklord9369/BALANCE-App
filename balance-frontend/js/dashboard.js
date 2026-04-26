import {
  getCurrentUser,
  getEvents,
  getWorkoutLogs,
  getMealLogs,
  getWellnessLogs,
  generateDailyGuidance,
  updateCurrentUserProfile,
  updateCurrentUserMealPreferences,
  changeCurrentUserPassword,
  generateGuidanceSummary
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
  selectedDate: document.getElementById("selectedDate"),

  profileMenuBtn: document.getElementById("profileMenuBtn"),
  profileOverlay: document.getElementById("profileOverlay"),
  profileMenu: document.getElementById("profileMenu"),
  closeProfileMenuBtn: document.getElementById("closeProfileMenuBtn"),
  profileLogoutBtn: document.getElementById("profileLogoutBtn"),
  openPasswordBtn: document.getElementById("openPasswordBtn"),
  openMealPrefsBtn: document.getElementById("openMealPrefsBtn"),
  openBodyStatsBtn: document.getElementById("openBodyStatsBtn"),
  profilePanelMessage: document.getElementById("profilePanelMessage"),

  passwordForm: document.getElementById("passwordForm"),
  mealPrefsForm: document.getElementById("mealPrefsForm"),
  bodyStatsForm: document.getElementById("bodyStatsForm"),

  currentPassword: document.getElementById("currentPassword"),
  newPassword: document.getElementById("newPassword"),
  confirmPassword: document.getElementById("confirmPassword"),

  dietType: document.getElementById("dietType"),
  isGlutenFree: document.getElementById("isGlutenFree"),
  allergens: document.getElementById("allergens"),

  heightCm: document.getElementById("heightCm"),
  weightKg: document.getElementById("weightKg"),
  age: document.getElementById("age"),

  dashboardCard: document.getElementById("dashboardCard"),
  loadingState: document.getElementById("dashboardLoadingState"),

  workoutHistoryToggle: document.querySelector('.history-toggle[data-target="completedWorkoutPopover"]'),
  mealHistoryToggle: document.querySelector('.history-toggle[data-target="completedMealPopover"]')
};

let currentUser = null;

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

  const textValue = String(value).slice(0, 10);

  if (/^\d{4}-\d{2}-\d{2}$/.test(textValue)) {
    return textValue;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateOnly(value) {
  if (!value) return null;

  const normalized = normalizeDateInputValue(value);
  if (!normalized) return null;

  const parts = normalized.split("-");
  if (parts.length !== 3) return null;

  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);

  return new Date(year, month, day);
}

function isSameDay(dateValue, selectedDateValue) {
  const left = parseDateOnly(dateValue);
  const right = parseDateOnly(selectedDateValue);

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

  const start = parseDateOnly(event.startDate);
  const end = parseDateOnly(event.endDate);

  if (!start || !end) return false;

  return selected >= start && selected <= end;
}

function formatPlanLines(lines, fallbackText) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return fallbackText;
  }

  return lines;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderPlanList(container, lines, fallbackText) {
  if (!container) return;

  if (!Array.isArray(lines) || lines.length === 0) {
    container.textContent = fallbackText;
    return;
  }

  container.innerHTML = `
    <ul class="guidance-list">
      ${lines.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function renderCompletedList(listEl, items, emptyText) {
  if (!listEl) return;

  if (!Array.isArray(items) || items.length === 0) {
    listEl.innerHTML = `<li class="empty-state">${escapeHtml(emptyText)}</li>`;
    return;
  }

  listEl.innerHTML = items
    .map(item => {
      const title = item.title || item.name || "Completed item";
      const meta = item.timeLabel || item.typeLabel || item.mealTime || "Logged today";

      return `
        <li class="completed-mini-item">
          <span class="completed-mini-name">${escapeHtml(title)}</span>
          <span class="completed-mini-meta">${escapeHtml(meta)}</span>
        </li>
      `;
    })
    .join("");
}

function renderStressLevel(selectedDateValue, wellnessLogs, events) {
  if (!els.stressBadge) return;

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

function hideAllProfileForms() {
  [els.passwordForm, els.mealPrefsForm, els.bodyStatsForm].forEach(form => {
    form?.classList.add("hidden");
  });
}

function showProfileForm(form) {
  hideAllProfileForms();
  form?.classList.remove("hidden");
}

function showProfileMessage(message, isError = false) {
  if (!els.profilePanelMessage) return;

  els.profilePanelMessage.textContent = message;
  els.profilePanelMessage.classList.remove("hidden", "success", "error");
  els.profilePanelMessage.classList.add(isError ? "error" : "success");
}

function hideProfileMessage() {
  if (!els.profilePanelMessage) return;

  els.profilePanelMessage.textContent = "";
  els.profilePanelMessage.classList.add("hidden");
  els.profilePanelMessage.classList.remove("success", "error");
}

function openProfileMenu() {
  els.profileOverlay?.classList.remove("hidden");
  els.profileMenuBtn?.setAttribute("aria-expanded", "true");
  hideProfileMessage();
  hideAllProfileForms();
}

function closeProfileMenu() {
  els.profileOverlay?.classList.add("hidden");
  els.profileMenuBtn?.setAttribute("aria-expanded", "false");
  hideProfileMessage();
  hideAllProfileForms();
}

function fillMealPreferenceForm(user) {
  const profile = user?.profile || user?.Profile || {};

  const dietType = profile.dietType ?? profile.DietType ?? "";
  const isVegan = profile.isVegan ?? profile.IsVegan ?? false;
  const isGlutenFree = profile.isGlutenFree ?? profile.IsGlutenFree ?? false;
  const allergens = profile.allergens ?? profile.Allergens ?? "";

  if (els.dietType) {
    els.dietType.value = isVegan ? "vegan" : dietType;
  }

  if (els.isGlutenFree) {
    els.isGlutenFree.value = isGlutenFree ? "yes" : "no";
  }

  if (els.allergens) {
    els.allergens.value = allergens || "";
  }
}

function fillBodyStatsForm(user) {
  const profile = user?.profile || user?.Profile || {};

  if (els.age) {
    els.age.value = profile.age ?? profile.Age ?? "";
  }

  if (els.heightCm) {
    els.heightCm.value = profile.heightCm ?? profile.HeightCm ?? "";
  }

  if (els.weightKg) {
    els.weightKg.value = profile.weightKg ?? profile.WeightKg ?? "";
  }
}

function setGoalToggleState(button, isComplete) {
  if (!button) return;

  button.classList.remove("goal-complete-toggle", "goal-pending-toggle");

  if (isComplete) {
    button.innerHTML = "✓";
    button.classList.add("goal-complete-toggle");
    button.setAttribute("title", "You're done");
    button.setAttribute("aria-label", "You're done");
  } else {
    button.innerHTML = "📋";
    button.classList.add("goal-pending-toggle");
    button.setAttribute("title", "View completed items");
    button.setAttribute("aria-label", "View completed items");
  }
}

function updateGoalCompletionIcons(guidance) {
  const completedWorkoutCount = Array.isArray(guidance?.workout?.completed)
    ? guidance.workout.completed.length
    : 0;

  const completedMealCount = Array.isArray(guidance?.meals?.completed)
    ? guidance.meals.completed.length
    : 0;

  const workoutGoalCompleted = completedWorkoutCount >= 2;
  const mealGoalCompleted = completedMealCount >= 3;

  setGoalToggleState(els.workoutHistoryToggle, workoutGoalCompleted);
  setGoalToggleState(els.mealHistoryToggle, mealGoalCompleted);
}

function showDashboardLoader() {
  els.loadingState?.classList.remove("hidden");
  els.dashboardCard?.classList.add("dashboard-card-hidden");
}

function hideDashboardLoader() {
  els.loadingState?.classList.add("hidden");
  els.dashboardCard?.classList.remove("dashboard-card-hidden");
}

async function loadGuidanceSummary(selectedDateValue) {
  if (!els.guidanceSummary) return;

  els.guidanceSummary.textContent = "Generating guidance summary...";

  try {
    const result = await generateGuidanceSummary(selectedDateValue);

    els.guidanceSummary.textContent =
      result?.summary ||
      "Your guidance is based on the events scheduled for this day. Keep your workout and fueling choices flexible based on your academic or training load.";
  } catch (error) {
    console.error("Guidance summary failed:", error);

    els.guidanceSummary.textContent =
      "Your guidance is based on the events scheduled for this day. Keep your workout and fueling choices flexible based on your academic or training load.";
  }
}

async function loadDashboard() {
  showDashboardLoader();

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

    currentUser = user;

    const firstName =
      user?.firstName ||
      user?.FirstName ||
      auth?.user?.firstName ||
      auth?.userName ||
      "User";

    if (els.welcomeText) {
      els.welcomeText.textContent = `Welcome, ${firstName}!`;
    }

    renderStressLevel(selectedDateValue, wellnessLogs, events);

    renderPlanList(
      els.workoutSuggestion,
      formatPlanLines(
        guidance?.workout?.currentPlan,
        "No workout guidance available."
      ),
      "No workout guidance available."
    );

    renderPlanList(
      els.mealSuggestion,
      formatPlanLines(
        guidance?.meals?.currentPlan,
        "No meal guidance available."
      ),
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

    updateGoalCompletionIcons(guidance);

    await loadGuidanceSummary(selectedDateValue);

    fillMealPreferenceForm(user);
    fillBodyStatsForm(user);

    setStatus(els.status, "Dashboard loaded.", false);
  } catch (error) {
    console.error(error);
    setStatus(els.status, error.message || "Unable to load dashboard.", true);

    if (els.guidanceSummary) {
      els.guidanceSummary.textContent =
        "Unable to generate guidance summary right now. Keep your plan flexible and adjust your workout and meals based on today’s schedule.";
    }
  } finally {
    hideDashboardLoader();
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

function initProfileMenu() {
  els.profileMenuBtn?.addEventListener("click", event => {
    event.stopPropagation();
    openProfileMenu();
  });

  els.closeProfileMenuBtn?.addEventListener("click", () => {
    closeProfileMenu();
  });

  els.profileOverlay?.addEventListener("click", event => {
    if (event.target === els.profileOverlay) {
      closeProfileMenu();
    }
  });

  els.profileMenu?.addEventListener("click", event => {
    event.stopPropagation();
  });

  els.profileLogoutBtn?.addEventListener("click", () => {
    logout();
  });

  els.openPasswordBtn?.addEventListener("click", () => {
    hideProfileMessage();
    showProfileForm(els.passwordForm);
  });

  els.openMealPrefsBtn?.addEventListener("click", () => {
    hideProfileMessage();
    fillMealPreferenceForm(currentUser);
    showProfileForm(els.mealPrefsForm);
  });

  els.openBodyStatsBtn?.addEventListener("click", () => {
    hideProfileMessage();
    fillBodyStatsForm(currentUser);
    showProfileForm(els.bodyStatsForm);
  });

  document.querySelectorAll(".close-profile-form-btn").forEach(button => {
    button.addEventListener("click", () => {
      hideAllProfileForms();
      hideProfileMessage();
    });
  });

  els.passwordForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const currentPassword = els.currentPassword?.value?.trim() || "";
    const newPassword = els.newPassword?.value?.trim() || "";
    const confirmPassword = els.confirmPassword?.value?.trim() || "";

    if (!currentPassword || !newPassword || !confirmPassword) {
      showProfileMessage("Please fill in all password fields.", true);
      return;
    }

    if (newPassword !== confirmPassword) {
      showProfileMessage("New password and confirm password do not match.", true);
      return;
    }

    try {
      await changeCurrentUserPassword({
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword
      });

      els.passwordForm.reset();
      showProfileMessage("Password updated successfully.");
    } catch (error) {
      console.error(error);
      showProfileMessage(error.message || "Failed to change password.", true);
    }
  });

  els.mealPrefsForm?.addEventListener("submit", async event => {
    event.preventDefault();

    try {
      const dietType = els.dietType?.value || "";
      const isVegan = dietType === "vegan";
      const isGlutenFree = (els.isGlutenFree?.value || "") === "yes";
      const allergens = els.allergens?.value?.trim() || "";

      await updateCurrentUserMealPreferences({
        dietType,
        isVegan,
        isGlutenFree,
        allergens
      });

      if (!currentUser) currentUser = {};
      if (!currentUser.profile) currentUser.profile = {};

      currentUser.profile.dietType = dietType;
      currentUser.profile.isVegan = isVegan;
      currentUser.profile.isGlutenFree = isGlutenFree;
      currentUser.profile.allergens = allergens;

      showProfileMessage("Meal preferences updated.");
    } catch (error) {
      console.error(error);
      showProfileMessage(error.message || "Failed to update meal preferences.", true);
    }
  });

  els.bodyStatsForm?.addEventListener("submit", async event => {
    event.preventDefault();

    try {
      const ageValue = els.age?.value?.trim() || "";
      const heightValue = els.heightCm?.value?.trim() || "";
      const weightValue = els.weightKg?.value?.trim() || "";

      await updateCurrentUserProfile({
        age: ageValue ? Number(ageValue) : null,
        heightCm: heightValue ? Number(heightValue) : null,
        weightKg: weightValue ? Number(weightValue) : null
      });

      if (!currentUser) currentUser = {};
      if (!currentUser.profile) currentUser.profile = {};

      currentUser.profile.age = ageValue ? Number(ageValue) : null;
      currentUser.profile.heightCm = heightValue ? Number(heightValue) : null;
      currentUser.profile.weightKg = weightValue ? Number(weightValue) : null;

      showProfileMessage("Body stats updated.");
    } catch (error) {
      console.error(error);
      showProfileMessage(error.message || "Failed to update body stats.", true);
    }
  });

  document.addEventListener("keydown", event => {
    if (
      event.key === "Escape" &&
      els.profileOverlay &&
      !els.profileOverlay.classList.contains("hidden")
    ) {
      closeProfileMenu();
    }
  });
}

window.addEventListener("storage", event => {
  if (event.key === "dashboardNeedsRefresh") {
    loadDashboard();
  }
});

initCompletedPopovers();
initSelectedDate();
initProfileMenu();
loadDashboard();