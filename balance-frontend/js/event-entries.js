import { getEvents, deleteEvent } from "./api.js";
import { requireAuth, logout, setStatus, getSelectedDate } from "./common.js";

const auth = requireAuth();
if (!auth) throw new Error("Unauthorized");

const els = {
  logoutBtn: document.getElementById("logoutBtn"),
  status: document.getElementById("statusMessage"),
  selectedDateDisplay: document.getElementById("selectedDateDisplay"),
  tableBody: document.getElementById("eventTableBody"),
  tableHead: document.querySelector(".entry-table thead")
};

els.logoutBtn?.addEventListener("click", logout);

function isEventActiveOnDate(event, selectedDate) {
  const start = String(event?.startDate || "").slice(0, 10);
  const end = String(event?.endDate || "").slice(0, 10);

  if (!start || !end) return false;

  return start <= selectedDate && end >= selectedDate;
}

function renderRows(items) {
  if (!items.length) {
    if (els.tableHead) {
      els.tableHead.style.display = "none";
    }

    els.tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state-cell">No events found for this day.</td>
      </tr>
    `;
    return;
  }

  if (els.tableHead) {
    els.tableHead.style.display = "";
  }

  els.tableBody.innerHTML = items.map((item) => `
    <tr>
      <td>${item.title ?? ""}</td>
      <td>${item.eventTypeName ?? ""}</td>
      <td>${item.stressLevel ?? ""}</td>
      <td class="action-cell">
        <button type="button" class="table-action icon-btn edit-btn" data-id="${item.eventId}" title="Edit" aria-label="Edit">
          ✎
        </button>
        <button type="button" class="table-action icon-btn delete-btn" data-id="${item.eventId}" title="Delete" aria-label="Delete">
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

    const events = await getEvents();
    const dayEvents = (events || []).filter((item) =>
      isEventActiveOnDate(item, selectedDate)
    );

    renderRows(dayEvents);
  } catch (error) {
    setStatus(els.status, error.message || "Failed to load events.", true);
  }
}

els.tableBody?.addEventListener("click", async (event) => {
  const editBtn = event.target.closest(".edit-btn");
  const deleteBtn = event.target.closest(".delete-btn");

  if (editBtn) {
    const id = editBtn.dataset.id;
    window.location.href = `./events.html?edit=${id}&returnTo=event-entries`;
    return;
  }

  if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    const confirmed = window.confirm("Delete this event?");
    if (!confirmed) return;

    try {
      await deleteEvent(id);
      setStatus(els.status, "Event deleted.");
      await loadEntries();
    } catch (error) {
      setStatus(els.status, error.message || "Failed to delete event.", true);
    }
  }
});

loadEntries();