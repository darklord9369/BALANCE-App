import { createEvent, getEventTypes, getEventById, updateEvent } from "./api.js";
import {
  setStatus,
  requireAuth,
  getSelectedDate
} from "./common.js";

const auth = requireAuth();
if (!auth) throw new Error("Unauthorized");

const params = new URLSearchParams(window.location.search);
const editId = params.get("edit");
const returnTo = params.get("returnTo") || "event-entries";

const els = {
  status: document.getElementById("statusMessage"),
  eventForm: document.getElementById("eventForm"),
  pageTitle: document.getElementById("pageTitle"),
  submitBtn: document.getElementById("submitBtn"),
  backToEntriesLink: document.getElementById("backToEntriesLink"),
  title: document.getElementById("title"),
  description: document.getElementById("description"),
  eventTypeId: document.getElementById("eventTypeId"),
  stressLevel: document.getElementById("stressLevel"),
  startDate: document.getElementById("startDate"),
  endDate: document.getElementById("endDate")
};

els.backToEntriesLink.href = `./${returnTo}.html`;

function setDefaults() {
  const selectedDate = getSelectedDate();
  els.startDate.value = selectedDate;
  els.endDate.value = selectedDate;
}

async function loadEventTypeOptions() {
  const eventTypes = await getEventTypes();

  els.eventTypeId.innerHTML = `
    <option value="">Select event type</option>
    ${eventTypes.map((type) => `
      <option value="${type.eventTypeId ?? type.id}">
        ${type.name}
      </option>
    `).join("")}
  `;
}

function buildEventPayload() {
  return {
    eventTypeId: Number(els.eventTypeId.value),
    title: els.title.value.trim(),
    description: els.description.value.trim(),
    startDate: els.startDate.value,
    endDate: els.endDate.value,
    stressLevel: els.stressLevel.value,
    status: "active"
  };
}

async function loadEditData() {
  if (!editId) return;

  const item = await getEventById(editId);

  els.pageTitle.textContent = "Edit Event";
  els.submitBtn.textContent = "Update Event";
  els.title.value = item.title ?? "";
  els.description.value = item.description ?? "";
  els.eventTypeId.value = String(item.eventTypeId ?? "");
  els.stressLevel.value = item.stressLevel ?? "";
  els.startDate.value = String(item.startDate || "").slice(0, 10);
  els.endDate.value = String(item.endDate || "").slice(0, 10);
}

els.eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const payload = buildEventPayload();

    if (editId) {
      await updateEvent(editId, payload);
      setStatus(els.status, "Event updated.");
    } else {
      await createEvent(payload);
      setStatus(els.status, "Event saved.");
    }

    setTimeout(() => {
      window.location.href = `./${returnTo}.html`;
    }, 600);
  } catch (error) {
    setStatus(els.status, error.message || "Failed to save event.", true);
  }
});

async function initializePage() {
  try {
    setDefaults();
    await loadEventTypeOptions();
    await loadEditData();
  } catch (error) {
    setStatus(els.status, error.message || "Failed to load page.", true);
  }
}

initializePage();