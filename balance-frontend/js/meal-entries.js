import { getMealLogs, deleteMealLog } from "./api.js";
import { requireAuth, logout, setStatus, getSelectedDate } from "./common.js";

const auth = requireAuth();
if (!auth) throw new Error("Unauthorized");

const els = {
  logoutBtn: document.getElementById("logoutBtn"),
  status: document.getElementById("statusMessage"),
  selectedDateDisplay: document.getElementById("selectedDateDisplay"),
  tableBody: document.getElementById("mealTableBody"),
  tableHead: document.querySelector(".entry-table thead")
};

els.logoutBtn?.addEventListener("click", logout);

function isSameDate(value, selectedDate) {
  return String(value || "").slice(0, 10) === selectedDate;
}

function renderRows(items) {
  if (!items.length) {
    if (els.tableHead) {
      els.tableHead.style.display = "none";
    }

    els.tableBody.innerHTML = `
      <tr>
        <td colspan="3" class="empty-state-cell">No meals found for this day.</td>
      </tr>
    `;
    return;
  }

  if (els.tableHead) {
    els.tableHead.style.display = "";
  }

  els.tableBody.innerHTML = items.map((item) => `
    <tr>
      <td>${item.mealCategoryName ?? ""}</td>
      <td>${item.mealTime ?? ""}</td>
      <td class="action-cell">
        <button type="button" class="table-action icon-btn edit-btn" data-id="${item.mealLogId}" title="Edit" aria-label="Edit">
          ✎
        </button>
        <button type="button" class="table-action icon-btn delete-btn" data-id="${item.mealLogId}" title="Delete" aria-label="Delete">
          ✕
        </button>
      </td>
    </tr>
  `).join("");
}

async function loadEntries() {
  try {
    const selectedDate = getSelectedDate();

    if (els.selectedDateDisplay) {
      els.selectedDateDisplay.value = selectedDate;
    }

    const meals = await getMealLogs();
    const dayMeals = (meals || []).filter((item) =>
      isSameDate(item.mealDate, selectedDate)
    );

    renderRows(dayMeals);
  } catch (error) {
    setStatus(els.status, error.message || "Failed to load meals.", true);
  }
}

els.tableBody?.addEventListener("click", async (event) => {
  const editBtn = event.target.closest(".edit-btn");
  const deleteBtn = event.target.closest(".delete-btn");

  if (editBtn) {
    const id = editBtn.dataset.id;
    window.location.href = `./meal.html?edit=${id}&returnTo=meal-entries`;
    return;
  }

  if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    const confirmed = window.confirm("Delete this meal?");
    if (!confirmed) return;

    try {
      await deleteMealLog(id);
      setStatus(els.status, "Meal deleted.");
      await loadEntries();
    } catch (error) {
      setStatus(els.status, error.message || "Failed to delete meal.", true);
    }
  }
});

loadEntries();