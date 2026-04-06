import {
  createMealLog,
  getMealCategories,
  getMealLogById,
  updateMealLog
} from "./api.js";
import { setStatus, requireAuth, logout, getSelectedDate } from "./common.js";

const auth = requireAuth();
if (!auth) throw new Error("Unauthorized");

const params = new URLSearchParams(window.location.search);
const editId = params.get("edit");
const returnTo = params.get("returnTo") || "meal-entries";

const els = {
  logoutBtn: document.getElementById("logoutBtn"),
  status: document.getElementById("statusMessage"),
  pageTitle: document.getElementById("pageTitle"),
  submitBtn: document.getElementById("submitBtn"),
  backToEntriesLink: document.getElementById("backToEntriesLink"),
  mealForm: document.getElementById("mealForm"),
  mealCategoryId: document.getElementById("mealCategoryId"),
  selectedDateDisplay: document.getElementById("selectedDateDisplay"),
  mealTime: document.getElementById("mealTime"),
  notes: document.getElementById("notes")
};

els.logoutBtn?.addEventListener("click", logout);
els.backToEntriesLink.href = `./${returnTo}.html`;

function setDefaults() {
  els.selectedDateDisplay.value = getSelectedDate();
}

async function loadMealCategoryOptions() {
  const mealCategories = await getMealCategories();

  els.mealCategoryId.innerHTML = `
    <option value="">Select meal category</option>
    ${mealCategories.map((category) => `
      <option value="${category.mealCategoryId ?? category.id}">
        ${category.name}
      </option>
    `).join("")}
  `;
}

function buildMealPayload() {
  return {
    mealCategoryId: Number(els.mealCategoryId.value),
    eventId: null,
    mealDate: getSelectedDate(),
    mealTime: els.mealTime.value,
    notes: els.notes.value.trim(),
    source: "manual",
    status: "logged"
  };
}

async function loadEditData() {
  if (!editId) return;

  const item = await getMealLogById(editId);

  els.pageTitle.textContent = "Edit Meal";
  els.submitBtn.textContent = "Update Meal";
  els.selectedDateDisplay.value = String(item.mealDate || "").slice(0, 10);
  els.mealCategoryId.value = String(item.mealCategoryId ?? "");
  els.mealTime.value = item.mealTime ?? "";
  els.notes.value = item.notes ?? "";
}

els.mealForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const payload = buildMealPayload();

    if (editId) {
      await updateMealLog(editId, payload);
      setStatus(els.status, "Meal updated.");
    } else {
      await createMealLog(payload);
      setStatus(els.status, "Meal saved.");
    }

    localStorage.setItem("dashboardNeedsRefresh", String(Date.now()));

    setTimeout(() => {
      window.location.href = `./${returnTo}.html`;
    }, 600);
  } catch (error) {
    setStatus(els.status, error.message || "Failed to save meal.", true);
  }
});

async function initializePage() {
  try {
    setDefaults();
    await loadMealCategoryOptions();
    await loadEditData();
  } catch (error) {
    setStatus(els.status, error.message || "Failed to load page.", true);
  }
}

initializePage();