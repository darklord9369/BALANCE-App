import { createMealLog, getMealCategories } from "./api.js";
import { setStatus, todayIso, requireAuth, logout } from "./common.js";

const auth = requireAuth();
if (!auth) throw new Error("Unauthorized");

const els = {
  welcomeUser: document.getElementById("welcomeUser"),
  logoutBtn: document.getElementById("logoutBtn"),
  status: document.getElementById("statusMessage"),
  mealForm: document.getElementById("mealForm"),
  mealCategoryId: document.getElementById("mealCategoryId"),
  mealDate: document.getElementById("mealDate"),
  mealTime: document.getElementById("mealTime"),
  notes: document.getElementById("notes")
};

els.welcomeUser.textContent = `Welcome, ${auth.userName}`;
els.logoutBtn?.addEventListener("click", logout);

function setDefaults() {
  els.mealDate.value = todayIso();
}

async function loadMealCategoryOptions() {
  const mealCategories = await getMealCategories();

  els.mealCategoryId.innerHTML = `
    <option value="">Select meal category</option>
    ${mealCategories
      .map(
        (category) => `
      <option value="${category.mealCategoryId ?? category.id}">
        ${category.name}
      </option>
    `
      )
      .join("")}
  `;
}

function buildMealPayload() {
  return {
    mealCategoryId: Number(els.mealCategoryId.value),
    eventId: null,
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
    const payload = buildMealPayload();
    await createMealLog(payload);

    setStatus(els.status, "Meal saved.");
    els.mealForm.reset();
    els.mealDate.value = todayIso();
    await loadMealCategoryOptions();
  } catch (error) {
    setStatus(els.status, error.message || "Failed to save meal.", true);
  }
});

async function initializePage() {
  try {
    setDefaults();
    await loadMealCategoryOptions();
  } catch (error) {
    setStatus(els.status, error.message || "Failed to load page.", true);
  }
}

initializePage();