import { setApiBaseUrl, getEvents, createEvent, getEventTypes } from "./api.js";
import { loadAppState, saveAppState, setStatus, todayIso } from "./common.js";
import { requireAuth, logout } from "./common.js";

const auth = requireAuth();
if (!auth) throw new Error("Unauthorized");

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}

const els = {
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  userId: document.getElementById("userId"),
  status: document.getElementById("statusMessage"),
  loadSetupBtn: document.getElementById("loadSetupBtn"),
  loadDemoBtn: document.getElementById("loadDemoBtn"),
  upcomingEvents: document.getElementById("upcomingEvents"),
  eventForm: document.getElementById("eventForm"),
  eventTitle: document.getElementById("eventTitle"),
  eventDescription: document.getElementById("eventDescription"),
  eventTypeId: document.getElementById("eventTypeId"),
  eventStressLevel: document.getElementById("eventStressLevel"),
  startDate: document.getElementById("startDate"),
  endDate: document.getElementById("endDate")
};

function setDefaults() {
  const state = loadAppState();
  els.apiBaseUrl.value = state.apiBaseUrl;
  els.userId.value = state.userId;
  els.startDate.value = todayIso();
  els.endDate.value = todayIso();
}

async function loadEventTypeOptions() {
  const apiBaseUrl = els.apiBaseUrl.value.trim();
  setApiBaseUrl(apiBaseUrl);

  const eventTypes = await getEventTypes();

  els.eventTypeId.innerHTML = `
    <option value="">Select event type</option>
    ${eventTypes.map(type => `
      <option value="${type.eventTypeId ?? type.id}">
        ${type.name}
      </option>
    `).join("")}
  `;
}

async function loadSetup() {
  try {
    const apiBaseUrl = els.apiBaseUrl.value.trim();
    const userId = els.userId.value.trim();

    saveAppState({ apiBaseUrl, userId });
    setApiBaseUrl(apiBaseUrl);

    const events = await getEvents(userId);
    const userEvents = (events || []).sort(
      (a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0)
    );

    if (!userEvents.length) {
      els.upcomingEvents.innerHTML =
        '<div class="empty-state">No events yet for this user.</div>';
    } else {
      els.upcomingEvents.innerHTML = userEvents.map(event => `
        <div class="list-card">
          <strong>${event.title ?? "Untitled event"}</strong><br />
          <span>${event.startDate ?? "-"} to ${event.endDate ?? "-"}</span><br />
          <span>Stress: ${event.stressLevel ?? "-"}</span>
        </div>
      `).join("");
    }

    setStatus(els.status, "Setup loaded.");
  } catch (error) {
    setStatus(els.status, error.message, true);
  }
}

els.loadSetupBtn.addEventListener("click", async () => {
  try {
    await loadEventTypeOptions();
    await loadSetup();
  } catch (error) {
    setStatus(els.status, error.message, true);
  }
});

els.loadDemoBtn.addEventListener("click", async () => {
  try {
    els.apiBaseUrl.value = "http://localhost:5000";
    els.userId.value = "1";
    els.startDate.value = todayIso();
    els.endDate.value = todayIso();
    await loadEventTypeOptions();
    setStatus(els.status, "Demo values loaded.");
  } catch (error) {
    setStatus(els.status, error.message, true);
  }
});

els.eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const apiBaseUrl = els.apiBaseUrl.value.trim();
    const userId = Number(els.userId.value.trim());

    saveAppState({ apiBaseUrl, userId });
    setApiBaseUrl(apiBaseUrl);

    await createEvent({
      userId,
      eventTypeId: Number(els.eventTypeId.value),
      title: els.eventTitle.value.trim(),
      description: els.eventDescription.value.trim(),
      startDate: els.startDate.value,
      endDate: els.endDate.value,
      stressLevel: els.eventStressLevel.value
    });

    setStatus(els.status, "Event saved.");
    els.eventForm.reset();
    els.startDate.value = todayIso();
    els.endDate.value = todayIso();
    await loadEventTypeOptions();
    await loadSetup();
  } catch (error) {
    setStatus(els.status, error.message, true);
  }
});

async function initializePage() {
  try {
    setDefaults();
    await loadEventTypeOptions();
  } catch (error) {
    setStatus(els.status, error.message, true);
  }
}

initializePage();