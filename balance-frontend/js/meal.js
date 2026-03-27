import { setApiBaseUrl, createMealLog, getMealCategories } from "./api.js";
import { loadAppState, saveAppState, setStatus, todayIso } from "./common.js";

const els = {
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  userId: document.getElementById("userId"),
  status: document.getElementById("statusMessage"),
  mealForm: document.getElementById("mealForm"),
  mealCategoryId: document.getElementById("mealCategoryId"),
  mealDate: document.getElementById("mealDate"),
  mealTime: document.getElementById("mealTime"),
  notes: document.getElementById("notes")
};

function setDefaults() {
  const state = loadAppState();
  els.apiBaseUrl.value = state.apiBaseUrl;
  els.userId.value = state.userId;
  els.mealDate.value = todayIso();
}

async function loadMealCategoryOptions() {
  const apiBaseUrl = els.apiBaseUrl.value.trim();
  setApiBaseUrl(apiBaseUrl);

  const mealCategories = await getMealCategories();

  els.mealCategoryId.innerHTML = `
    <option value="">Select meal category</option>
    ${mealCategories.map(category => `
      <option value="${category.mealCategoryId ?? category.id}">
        ${category.name}
      </option>
    `).join("")}
  `;
}

function buildMealPayload(userId) {
  return {
    userId,
    mealCategoryId: Number(els.mealCategoryId.value),
    eventId: 0,
    mealDate: els.mealDate.value,
    mealTime: els.mealTime.value,
    notes: els.notes.value.trim(),
    source: "manual",
    status: "logged"
  };
}

els.mealForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const apiBaseUrl = els.apiBaseUrl.value.trim();
    const userId = Number(els.userId.value.trim());

    saveAppState({ apiBaseUrl, userId });
    setApiBaseUrl(apiBaseUrl);

    const payload = buildMealPayload(userId);
    await createMealLog(payload);

    setStatus(els.status, "Meal saved.");
    els.mealForm.reset();
    els.mealDate.value = todayIso();

    await loadMealCategoryOptions();
  } catch (error) {
    setStatus(els.status, error.message, true);
  }
});

async function initializePage() {
  try {
    setDefaults();
    await loadMealCategoryOptions();
  } catch (error) {
    setStatus(els.status, error.message, true);
  }
}

initializePage();