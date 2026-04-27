import {
  getCurrentUser,
  getEvents,
  getWorkoutLogs,
  getMealLogs,
  getWellnessLogs,
  generateDailyGuidance,
  updateCurrentUserProfile,
  updateCurrentUserMealPreferences,
  updateCurrentUserWorkoutPreferences,
  getWorkoutPreferences,
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
  profileMenuTitle: document.getElementById("profileMenuTitle"),
  profileOverlay: document.getElementById("profileOverlay"),
  profileMenu: document.getElementById("profileMenu"),
  closeProfileMenuBtn: document.getElementById("closeProfileMenuBtn"),
  profileLogoutBtn: document.getElementById("profileLogoutBtn"),
  profilePanelMessage: document.getElementById("profilePanelMessage"),

  profileMenuView: document.getElementById("profileMenuView"),
  profileEditView: document.getElementById("profileEditView"),

  passwordForm: document.getElementById("passwordEditForm"),
  mealPrefsForm: document.getElementById("mealPreferenceForm"),
  workoutPrefsForm: document.getElementById("workoutPreferenceForm"),
  bodyStatsForm: document.getElementById("bodyStatsForm"),

  currentPassword: document.getElementById("currentPassword"),
  newPassword: document.getElementById("newPassword"),
  confirmPassword: document.getElementById("confirmPassword"),

  dietType: document.getElementById("dietType"),
  isGlutenFree: document.getElementById("isGlutenFree"),
  allergens: document.getElementById("allergens"),

  workoutPreferenceId: document.getElementById("workoutPreferenceId"),
  preferredWorkoutDurationMinutes: document.getElementById("preferredWorkoutDurationMinutes"),

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
  [
    els.passwordForm,
    els.mealPrefsForm,
    els.workoutPrefsForm,
    els.bodyStatsForm
  ].forEach(form => {
    if (form) form.hidden = true;
  });
}

function showProfileMenuView() {
  hideAllProfileForms();

  if (els.profileMenuTitle) {
    els.profileMenuTitle.textContent = "Profile";
  }

  if (els.profileMenuView) els.profileMenuView.hidden = false;
  if (els.profileEditView) els.profileEditView.hidden = true;

  hideProfileMessage();
}

function showProfileEditView(form, title) {
  if (els.profileMenuTitle) {
    els.profileMenuTitle.textContent = title;
  }

  if (els.profileMenuView) els.profileMenuView.hidden = true;
  if (els.profileEditView) els.profileEditView.hidden = false;

  hideAllProfileForms();

  if (form) form.hidden = false;
}

function normalizeLookupItems(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.$values)) return response.$values;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.Items)) return response.Items;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.Data)) return response.Data;

  return [];
}

async function loadWorkoutPreferenceOptions() {
  if (!els.workoutPreferenceId) return;

  const currentValue = els.workoutPreferenceId.value;

  try {
    const response = await getWorkoutPreferences();
    const items = normalizeLookupItems(response);

    els.workoutPreferenceId.innerHTML = `
      <option value="">Select workout preference</option>
      ${items
        .map(item => {
          const id =
            item.workoutPreferenceId ??
            item.WorkoutPreferenceId ??
            item.id ??
            item.Id;

          const name =
            item.name ??
            item.Name ??
            item.preferenceName ??
            item.PreferenceName;

          if (!id || !name) return "";

          return `
            <option value="${escapeHtml(id)}">
              ${escapeHtml(name)}
            </option>
          `;
        })
        .join("")}
    `;

    if (currentValue) {
      els.workoutPreferenceId.value = currentValue;
    }
  } catch (error) {
    console.error("Failed to load workout preferences:", error);

    els.workoutPreferenceId.innerHTML = `
      <option value="">Unable to load workout preferences</option>
    `;
  }
}

function fillWorkoutPreferenceForm(user) {
  const profile = user?.profile || user?.Profile || {};

  const workoutPreferenceId =
    profile.workoutPreferenceId ??
    profile.WorkoutPreferenceId ??
    profile.workoutPreference?.workoutPreferenceId ??
    profile.WorkoutPreference?.WorkoutPreferenceId ??
    "";

  const preferredWorkoutDurationMinutes =
    profile.preferredWorkoutDurationMinutes ??
    profile.PreferredWorkoutDurationMinutes ??
    "";

  if (els.workoutPreferenceId) {
    els.workoutPreferenceId.value = workoutPreferenceId ? String(workoutPreferenceId) : "";
  }

  if (els.preferredWorkoutDurationMinutes) {
    els.preferredWorkoutDurationMinutes.value = preferredWorkoutDurationMinutes || "";
  }
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
  showProfileMenuView();
}

function closeProfileMenu() {
  els.profileOverlay?.classList.add("hidden");
  els.profileMenuBtn?.setAttribute("aria-expanded", "false");
  showProfileMenuView();
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
    fillWorkoutPreferenceForm(user);

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

  document.querySelectorAll("[data-profile-edit]").forEach(button => {
    button.addEventListener("click", async () => {
      const editType = button.dataset.profileEdit;
  
      hideProfileMessage();
  
      if (editType === "password") {
        showProfileEditView(els.passwordForm, "Change Password");
        return;
      }
  
      if (editType === "meal") {
        fillMealPreferenceForm(currentUser);
        showProfileEditView(els.mealPrefsForm, "Edit Meal Preference");
        return;
      }
  
      if (editType === "workout") {
        showProfileEditView(els.workoutPrefsForm, "Edit Workout Preference");
        await loadWorkoutPreferenceOptions();
        fillWorkoutPreferenceForm(currentUser);
        return;
      }
  
      if (editType === "body") {
        fillBodyStatsForm(currentUser);
        showProfileEditView(els.bodyStatsForm, "Edit Body Stats");
      }
    });
  });

  document.querySelectorAll(".profileBackBtn").forEach(button => {
    button.addEventListener("click", () => {
      showProfileMenuView();
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

      await loadDashboard();
    } catch (error) {
      console.error(error);
      showProfileMessage(error.message || "Failed to update meal preferences.", true);
    }
  });

  els.workoutPrefsForm?.addEventListener("submit", async event => {
    event.preventDefault();

    try {
      const workoutPreferenceIdValue = els.workoutPreferenceId?.value || "";
      const preferredWorkoutDurationValue =
        els.preferredWorkoutDurationMinutes?.value?.trim() || "";

      const payload = {
        workoutPreferenceId: workoutPreferenceIdValue
          ? Number(workoutPreferenceIdValue)
          : null,
        preferredWorkoutDurationMinutes: preferredWorkoutDurationValue
          ? Number(preferredWorkoutDurationValue)
          : null
      };

      await updateCurrentUserWorkoutPreferences(payload);

      if (!currentUser) currentUser = {};
      if (!currentUser.profile) currentUser.profile = {};

      currentUser.profile.workoutPreferenceId = payload.workoutPreferenceId;
      currentUser.profile.preferredWorkoutDurationMinutes =
        payload.preferredWorkoutDurationMinutes;

      const selectedOption = els.workoutPreferenceId?.selectedOptions?.[0];

      currentUser.profile.workoutPreference = payload.workoutPreferenceId
        ? {
            workoutPreferenceId: payload.workoutPreferenceId,
            name: selectedOption?.textContent?.trim() || ""
          }
        : null;

      showProfileMessage("Workout preferences updated.");

      await loadDashboard();
    } catch (error) {
      console.error(error);
      showProfileMessage(error.message || "Failed to update workout preferences.", true);
    }
  });

  els.bodyStatsForm?.addEventListener("submit", async event => {
    event.preventDefault();

    try {
      const ageValue = els.age?.value?.trim() || "";
      const heightValue = els.heightCm?.value?.trim() || "";
      const weightValue = els.weightKg?.value?.trim() || "";

      const age = ageValue ? Number(ageValue) : null;
      const heightCm = heightValue ? Number(heightValue) : null;
      const weightKg = weightValue ? Number(weightValue) : null;

      if (age !== null && (Number.isNaN(age) || age < 13 || age > 99)) {
        showProfileMessage("Age must be between 13 and 99.", true);
        return;
      }

      if (heightCm !== null && (Number.isNaN(heightCm) || heightCm < 1 || heightCm > 250)) {
        showProfileMessage("Height must be between 1 and 250 cm.", true);
        return;
      }
  
      if (weightKg !== null && (Number.isNaN(weightKg) || weightKg < 1 || weightKg > 650)) {
        showProfileMessage("Weight must be between 1 and 650 kg.", true);
        return;
      }

      await updateCurrentUserProfile({
        age: ageValue ? Number(ageValue) : null,
        heightCm: heightValue ? Number(heightValue) : null,
        weightKg: weightValue ? Number(weightValue) : null
      });

      if (!currentUser) currentUser = {};
      if (!currentUser.profile) currentUser.profile = {};

      currentUser.profile.age = age;
      currentUser.profile.heightCm = heightCm;
      currentUser.profile.weightKg = weightKg;

      showProfileMessage("Body stats updated.");

      await loadDashboard();
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
loadWorkoutPreferenceOptions();
loadDashboard();